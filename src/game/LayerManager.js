import Phaser from "phaser";

/**
 * Manages clothing/accessory sprite layers on top of a base player sprite.
 *
 * Each equipped item is a spritesheet with the SAME frame layout as the
 * character base (510×900, same frame count) so it overlays perfectly.
 *
 * Layer depth order (rendered bottom to top):
 *   base sprite → appearance → feet → bottoms → tops → coats → hands → accessories → hair → head
 *
 * Face sub-items (eyes, eyebrows, nose, mouth, beard) are composited into a
 * single "appearance" sprite so there is always at most one face layer sprite.
 */
const LAYER_ORDER = [
  "appearance",
  "bottoms",
  "feet",
  "tops",
  "hands",
  "coats",
  "accessories",
  "hair",
  "head",
];

const FACE_SUBS = new Set(["eyes", "eyebrows", "nose", "mouth", "beard"]);

export { LAYER_ORDER };

let _bakeCounter = 0;

export default class LayerManager {
  constructor() {
    // ownerId -> Map<category, { sprite, key, imageUrl }>
    this.layers = new Map();
    // ownerId -> baseSprite (set by registerBase for interactive players)
    this.owners = new Map();
    // ownerId -> Map<sub, {itemId, imageUrl}> — pending/active face items
    this._faceItems = new Map();
    // ownerId -> baked canvas texture key (or null)
    this._faceBakedKey = new Map();
    // ownerId -> baseSprite (populated on first equip so rebake always has it)
    this._baseSprites = new Map();
  }

  registerBase(ownerId, baseSprite) {
    this.owners.set(ownerId, baseSprite);
    this._baseSprites.set(ownerId, baseSprite);
    const self = this;
    baseSprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 510, 900),
      hitAreaCallback(hitArea, x, y) {
        return self._compositeHitTest(ownerId, Math.floor(x), Math.floor(y));
      },
    });
    baseSprite.on("pointerover", () => this._setGlow(ownerId, true));
    baseSprite.on("pointerout", () => this._setGlow(ownerId, false));
  }

  equip(scene, baseSprite, ownerId, category, imageUrl, itemId) {
    this._baseSprites.set(ownerId, baseSprite);

    if (FACE_SUBS.has(category)) {
      this._equipFaceItem(scene, ownerId, category, imageUrl, itemId);
      return;
    }

    const textureKey = `item_${itemId}`;
    this.unequip(ownerId, category);

    if (!this.layers.has(ownerId)) this.layers.set(ownerId, new Map());

    if (scene.textures.exists(textureKey)) {
      this._createLayerSprite(scene, baseSprite, ownerId, category, textureKey, imageUrl);
      return;
    }

    scene.load.spritesheet(textureKey, imageUrl, {
      frameWidth: 510,
      frameHeight: 900,
    });
    scene.load.once("complete", () => {
      if (!this.layers.has(ownerId)) return;
      this._createLayerSprite(scene, baseSprite, ownerId, category, textureKey, imageUrl);
    });
    scene.load.start();
  }

  _equipFaceItem(scene, ownerId, sub, imageUrl, itemId) {
    if (!this._faceItems.has(ownerId)) this._faceItems.set(ownerId, new Map());
    this._faceItems.get(ownerId).set(sub, { itemId, imageUrl });

    const textureKey = `item_${itemId}`;
    if (scene.textures.exists(textureKey)) {
      this._rebakeAppearance(ownerId);
      return;
    }

    scene.load.spritesheet(textureKey, imageUrl, {
      frameWidth: 510,
      frameHeight: 900,
    });
    scene.load.once("complete", () => {
      if (!this._faceItems.has(ownerId)) return;
      this._rebakeAppearance(ownerId);
    });
    scene.load.start();
  }

  _rebakeAppearance(ownerId) {
    const baseSprite = this._baseSprites.get(ownerId);
    if (!baseSprite || !baseSprite.scene) return;
    const scene = baseSprite.scene;

    const faceMap = this._faceItems.get(ownerId);

    if (!faceMap || faceMap.size === 0) {
      const playerLayers = this.layers.get(ownerId);
      if (playerLayers) {
        const existing = playerLayers.get("appearance");
        if (existing) {
          existing.sprite.destroy();
          playerLayers.delete("appearance");
        }
      }
      this._cleanupBakedTexture(scene, ownerId);
      return;
    }

    // Collect source images for already-loaded textures
    const sources = [];
    for (const [, { itemId }] of faceMap) {
      const texKey = `item_${itemId}`;
      if (!scene.textures.exists(texKey)) continue;
      const src = scene.textures.get(texKey).getSourceImage();
      if (src && src.width > 0) sources.push(src);
    }

    if (sources.length === 0) return;

    let bakedKey;

    if (sources.length === 1) {
      // Single face item — use its existing texture directly, no extra canvas needed
      let singleId = null;
      for (const [, { itemId }] of faceMap) {
        if (scene.textures.exists(`item_${itemId}`)) { singleId = itemId; break; }
      }
      bakedKey = `item_${singleId}`;
      this._cleanupBakedTexture(scene, ownerId); // remove any previous baked canvas
    } else {
      // Multiple face items — composite onto a single canvas texture
      const w = sources[0].width;
      const h = sources[0].height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      for (const src of sources) ctx.drawImage(src, 0, 0);

      this._cleanupBakedTexture(scene, ownerId);

      bakedKey = `face_baked_${ownerId}_${++_bakeCounter}`;
      const texture = scene.textures.addCanvas(bakedKey, canvas);

      // Stamp frame data matching the spritesheet layout (510×900 frames)
      const cols = Math.floor(w / 510);
      const rows = Math.floor(h / 900);
      let idx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          texture.add(idx, 0, c * 510, r * 900, 510, 900);
          idx++;
        }
      }

      this._faceBakedKey.set(ownerId, bakedKey);
    }

    // Update existing "appearance" sprite or create a new one
    if (!this.layers.has(ownerId)) this.layers.set(ownerId, new Map());
    const playerLayers = this.layers.get(ownerId);
    const existing = playerLayers.get("appearance");
    const currentFrame = Number(baseSprite.frame.name);

    if (existing) {
      existing.sprite.setTexture(bakedKey, currentFrame);
      existing.key = bakedKey;
    } else {
      this._createLayerSprite(scene, baseSprite, ownerId, "appearance", bakedKey, null);
    }
  }

  _cleanupBakedTexture(scene, ownerId) {
    const oldKey = this._faceBakedKey.get(ownerId);
    if (oldKey && scene.textures.exists(oldKey)) {
      scene.textures.remove(oldKey);
    }
    this._faceBakedKey.delete(ownerId);
  }

  _createLayerSprite(scene, baseSprite, ownerId, category, textureKey, imageUrl) {
    const layerSprite = scene.add.sprite(
      baseSprite.x,
      baseSprite.y,
      textureKey,
      Number(baseSprite.frame.name),
    );
    layerSprite.setOrigin(baseSprite.originX, baseSprite.originY);
    layerSprite.setScale(baseSprite.scaleX, baseSprite.scaleY);

    const orderIndex = LAYER_ORDER.indexOf(category);
    layerSprite.setDepth(baseSprite.depth + 1 + orderIndex);

    const playerLayers = this.layers.get(ownerId);
    playerLayers.set(category, { sprite: layerSprite, key: textureKey, imageUrl });
  }

  unequip(ownerId, category) {
    if (FACE_SUBS.has(category)) {
      const faceMap = this._faceItems.get(ownerId);
      if (faceMap) faceMap.delete(category);
      this._rebakeAppearance(ownerId);
      return;
    }

    if (category === "appearance") {
      // Clear all face items and remove the baked appearance sprite
      const faceMap = this._faceItems.get(ownerId);
      if (faceMap) faceMap.clear();
      const baseSprite = this._baseSprites.get(ownerId);
      if (baseSprite?.scene) {
        this._cleanupBakedTexture(baseSprite.scene, ownerId);
      } else {
        this._faceBakedKey.delete(ownerId);
      }
      const playerLayers = this.layers.get(ownerId);
      if (playerLayers) {
        const layer = playerLayers.get("appearance");
        if (layer) {
          layer.sprite.destroy();
          playerLayers.delete("appearance");
        }
      }
      return;
    }

    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return;
    const layer = playerLayers.get(category);
    if (layer) {
      layer.sprite.destroy();
      playerLayers.delete(category);
    }
  }

  applyOutfit(scene, baseSprite, ownerId, outfit) {
    this.clearAll(ownerId);
    if (!outfit) return;
    for (const [category, item] of Object.entries(outfit)) {
      if (item && item.imageUrl) {
        this.equip(scene, baseSprite, ownerId, category, item.imageUrl, item.itemId);
      }
    }
  }

  /**
   * Sync every layer sprite with the base sprite's position, frame, and animation.
   */
  update(baseSprite, ownerId) {
    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return;

    const baseFrame = Number(baseSprite.frame.name);
    const baseAnim = baseSprite.anims.isPlaying ? baseSprite.anims.currentAnim?.key : null;

    for (const [category, { sprite }] of playerLayers) {
      sprite.setPosition(baseSprite.x, baseSprite.y);
      sprite.setScale(baseSprite.scaleX, baseSprite.scaleY);

      const orderIndex = LAYER_ORDER.indexOf(category);
      sprite.setDepth(baseSprite.depth + 1 + orderIndex);

      if (baseAnim) {
        const layerAnimKey = `${sprite.texture.key}_${baseAnim}`;
        if (!sprite.scene.anims.exists(layerAnimKey)) {
          const baseAnimData = sprite.scene.anims.get(baseAnim);
          if (baseAnimData) {
            sprite.scene.anims.create({
              key: layerAnimKey,
              frames: sprite.scene.anims.generateFrameNumbers(sprite.texture.key, {
                start: baseAnimData.frames[0].frame.name,
                end: baseAnimData.frames[baseAnimData.frames.length - 1].frame.name,
              }),
              frameRate: baseAnimData.frameRate,
              repeat: baseAnimData.repeat,
            });
          }
        }
        if (sprite.anims.currentAnim?.key !== layerAnimKey || !sprite.anims.isPlaying) {
          sprite.play(layerAnimKey);
        }
      } else {
        if (sprite.anims.isPlaying) sprite.stop();
        sprite.setFrame(baseFrame);
      }
    }
  }

  /**
   * Returns true if (x, y) hits a non-transparent pixel on any layer (base or equipped).
   */
  _compositeHitTest(ownerId, x, y) {
    const baseSprite = this.owners.get(ownerId);
    if (!baseSprite) return false;
    const textures = baseSprite.scene.textures;

    if (textures.getPixelAlpha(x, y, baseSprite.texture.key, baseSprite.frame.name) > 0) {
      return true;
    }

    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return false;
    for (const [, { sprite }] of playerLayers) {
      if (textures.getPixelAlpha(x, y, sprite.texture.key, sprite.frame.name) > 0) {
        return true;
      }
    }
    return false;
  }

  _setGlow(ownerId, on) {
    const baseSprite = this.owners.get(ownerId);
    if (!baseSprite) return;
    if (on) {
      baseSprite.postFX.addGlow(0xffffff, 2, 0);
    } else {
      baseSprite.postFX.clear();
    }
    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return;
    for (const [, { sprite }] of playerLayers) {
      if (on) {
        sprite.postFX.addGlow(0xffffff, 2, 0);
      } else {
        sprite.postFX.clear();
      }
    }
  }

  clearAll(ownerId) {
    const playerLayers = this.layers.get(ownerId);
    if (playerLayers) {
      for (const [, { sprite }] of playerLayers) sprite.destroy();
      playerLayers.clear();
    }
    const faceMap = this._faceItems.get(ownerId);
    if (faceMap) faceMap.clear();
    const baseSprite = this._baseSprites.get(ownerId);
    if (baseSprite?.scene) {
      this._cleanupBakedTexture(baseSprite.scene, ownerId);
    } else {
      this._faceBakedKey.delete(ownerId);
    }
  }

  destroy() {
    for (const [ownerId] of this.layers) {
      this.clearAll(ownerId);
    }
    this.layers.clear();
    this.owners.clear();
    this._faceItems.clear();
    this._baseSprites.clear();
    this._faceBakedKey.clear();
  }

  /**
   * Returns the full outfit including individual face items (not the baked key).
   * Use this instead of reading `layers` directly.
   */
  getFullOutfit(ownerId) {
    const result = {};
    const playerLayers = this.layers.get(ownerId);
    if (playerLayers) {
      for (const [category, { key, imageUrl }] of playerLayers) {
        if (category === "appearance") continue; // face items are in _faceItems
        result[category] = { itemId: key.replace("item_", ""), imageUrl };
      }
    }
    const faceMap = this._faceItems.get(ownerId);
    if (faceMap) {
      for (const [sub, { itemId, imageUrl }] of faceMap) {
        result[sub] = { itemId, imageUrl };
      }
    }
    return result;
  }

  getEquipped(ownerId) {
    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return {};
    const result = {};
    for (const [category, { key }] of playerLayers) {
      result[category] = key;
    }
    return result;
  }
}
