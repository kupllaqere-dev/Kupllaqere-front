/**
 * Manages clothing/accessory sprite layers on top of a base player sprite.
 *
 * Each equipped item is a spritesheet with the SAME frame layout as the
 * character base (510×900, same frame count) so it overlays perfectly.
 *
 * Layer depth order (rendered bottom to top):
 *   base sprite → feet → bottoms → tops → coats → hands → accessories → hair → head
 */
const LAYER_ORDER = [
  "bottoms",
  "feet",
  "tops",
  "hands",
  "coats",
  "accessories",
  "hair",
  "head",
];

export { LAYER_ORDER };

export default class LayerManager {
  constructor() {
    // ownerId -> Map<category, { sprite, key }>
    this.layers = new Map();
  }

  /**
   * Equip an item layer on a player.
   */
  equip(scene, baseSprite, ownerId, category, imageUrl, itemId) {
    const textureKey = `item_${itemId}`;

    this.unequip(ownerId, category);

    if (!this.layers.has(ownerId)) {
      this.layers.set(ownerId, new Map());
    }

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

  clearAll(ownerId) {
    const playerLayers = this.layers.get(ownerId);
    if (!playerLayers) return;
    for (const [, { sprite }] of playerLayers) {
      sprite.destroy();
    }
    playerLayers.clear();
  }

  destroy() {
    for (const [ownerId] of this.layers) {
      this.clearAll(ownerId);
    }
    this.layers.clear();
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
