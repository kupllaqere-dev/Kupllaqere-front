import Phaser from "phaser";
import { parseArmature, createPose, poseArmature, poseSlot, createMatrix, loopFrameTime } from "./dragonBones.js";
import { preloadClothing, getWornSlotsByBodyPart, CLOTHING_ITEMS } from "./RigClothing.js";

// The in-world avatar: a DragonBones rig (one image per body part) rather than
// a baked spritesheet. Only the world uses it — the profile/store previews and
// thumbnails still render the composited character sheet (see AvatarCompositor).

const RIG_DIR   = "/assets/walking%20avatar";
const RIG_NAME  = "FemaleFrontWalk";

export const RIG_TEXTURE_KEY = "rig-tex";
const SKE_KEY   = "rig-ske";
const ATLAS_KEY = "rig-atlas";

// Rig art is authored at ~683 units tall; the character bases it replaces are
// 668 px tall inside their 510×900 frame, so this keeps the on-screen size and
// every perspectiveScale() value that was tuned against it unchanged.
const RIG_SCALE = 0.978;

// Those frames also left 114 px of empty space below the feet, and the sprite
// was anchored at the frame's bottom edge. Lifting the rig by the same amount
// puts its feet exactly where the old avatar's feet were — so the shadow, name
// plate and depth sorting all keep working untouched.
const FOOT_LIFT = 0;

// Multiplier on the rig's authored 24 fps timeline — the walk cycle is 30
// frames, so 1.5 turns a 1.25 s stride into a ~0.83 s one.
const PLAYBACK_RATE = 1.5;

// Fraction of the rig's bounding box used as the click target. The full box
// spans the arm swing, which would swallow click-to-move taps near the player;
// the narrower box tracks the torso-and-legs silhouette.
const HIT_WIDTH_RATIO = 0.55;

// Garments worn by every rig. Outfits are still per-player only on the baked
// character sheet; the rig wears the whole (one-item) wardrobe for now.
const DEFAULT_CLOTHING = Object.keys(CLOTHING_ITEMS);

const armatureCache = new WeakMap(); // Phaser.Game → parsed armature

export function preloadRig(scene) {
  scene.load.json(SKE_KEY,   `${RIG_DIR}/${RIG_NAME}_ske.json`);
  scene.load.json(ATLAS_KEY, `${RIG_DIR}/${RIG_NAME}_tex.json`);
  scene.load.image(RIG_TEXTURE_KEY, `${RIG_DIR}/${RIG_NAME}_tex.png`);
  preloadClothing(scene);
}

// Parses the armature and registers every atlas sub-texture as a Phaser frame.
// Runs once per game; every avatar shares the result.
export function getRigArmature(scene) {
  const cached = armatureCache.get(scene.game);
  if (cached) return cached;

  const ske   = scene.cache.json.get(SKE_KEY);
  const atlas = scene.cache.json.get(ATLAS_KEY);
  if (!ske || !atlas || !scene.textures.exists(RIG_TEXTURE_KEY)) {
    throw new Error("Avatar rig assets are not loaded — call preloadRig() in the scene's preload()");
  }

  const armature = parseArmature(ske);
  const texture  = scene.textures.get(RIG_TEXTURE_KEY);

  for (const sub of atlas.SubTexture || []) {
    if (!texture.has(sub.name)) {
      texture.add(sub.name, 0, sub.x, sub.y, sub.width, sub.height);
    }
  }

  armatureCache.set(scene.game, armature);
  return armature;
}

/**
 * A posed DragonBones rig that stands in for the Phaser.Sprite the world used
 * before. It mirrors the slice of the sprite API the game touches — play(),
 * stop(), setFrame(), anims.currentAnim / anims.isPlaying — so MovementManager
 * and PlayerManager can drive it exactly as they drove the spritesheet.
 */
export default class RigAvatar extends Phaser.GameObjects.Container {
  #armature;
  #pose;
  #parts = [];   // { image, matrix } in draw order — matrix is posed each frame
  #worn  = [];   // { slot, matrix } for the clothing slots, which pose themselves
  #clip = null;
  #elapsed = 0;

  constructor(scene, x, y) {
    super(scene, x, y);

    const armature = getRigArmature(scene);
    this.#armature = armature;
    this.#pose     = createPose(armature);

    // Inner container carries the art-unit → world-unit scale and the foot
    // lift, so the outer container's scale stays the game's own scale value.
    this.rigRoot = new Phaser.GameObjects.Container(scene, 0, -FOOT_LIFT);
    this.rigRoot.setScale(RIG_SCALE);
    this.add(this.rigRoot);

    // Each body part is followed by whatever it wears, so a sleeve lands on top
    // of its arm while still sitting behind the parts drawn in front of it.
    const worn = getWornSlotsByBodyPart(scene, armature, DEFAULT_CLOTHING);

    for (let i = 0; i < armature.slots.length; i++) {
      const slot = armature.slots[i];
      this.#addPart(scene, RIG_TEXTURE_KEY, slot, this.#pose.slots[i]);

      for (const piece of worn.get(slot.name) ?? []) {
        const matrix = createMatrix();
        this.#worn.push({ slot: piece, matrix });
        this.#addPart(scene, piece.textureKey, piece, matrix);
      }
    }

    // Sprite-compatible animation surface.
    this.anims = { currentAnim: null, isPlaying: false };
    this.frame = { name: 0 };
    // MovementManager/PlayerManager look up an animation key per direction; the
    // rig has a single front-facing walk, so the name passes straight through.
    this._animKey = name => name;

    // Size is the layout box the rest of the game measures against: width of
    // the rig, height from the placement point up to the top of the head, so
    // `displayHeight` still lands chat bubbles just above the avatar.
    this.setSize(armature.aabb.width * RIG_SCALE, FOOT_LIFT + armature.aabb.height * RIG_SCALE);
    this.#applyPose();

    scene.add.existing(this);
    this.addToUpdateList();
  }

  preUpdate(_time, delta) {
    if (!this.anims.isPlaying) return;
    this.#elapsed += (delta / 1000) * PLAYBACK_RATE;
    this.#applyPose();
  }

  /** Starts (or keeps) an animation. Any walk direction plays the walk cycle. */
  play(key) {
    const name = String(key).startsWith("walk") ? "walk" : String(key);
    const clip = this.#armature.animations[name] ?? null;
    // Direction changes keep the cycle running rather than snapping to frame 0.
    if (this.#clip !== clip) {
      this.#clip   = clip;
      this.#elapsed = 0;
    }
    this.anims.isPlaying   = true;
    this.anims.currentAnim = { key };
    this.#applyPose();
    return this;
  }

  /** Drops back to the rig's neutral standing pose. */
  stop() {
    this.#clip             = null;
    this.#elapsed          = 0;
    this.anims.isPlaying   = false;
    this.anims.currentAnim = null;
    this.#applyPose();
    return this;
  }

  // The rig is front-facing only, so directional frames have nothing to switch
  // — but the frame index still travels over the wire, so keep it readable.
  setFrame(name) {
    this.frame.name = name;
    return this;
  }

  // No-ops kept so avatar code written against Phaser.Sprite still runs.
  setTexture() { return this; }
  setOrigin()  { return this; }

  // Containers need an explicit hit area; pixel-perfect testing isn't available.
  setInteractive() {
    const { aabb } = this.#armature;
    const width  = aabb.width * RIG_SCALE * HIT_WIDTH_RATIO;
    const height = aabb.height * RIG_SCALE;
    const top    = aabb.y * RIG_SCALE - FOOT_LIFT;
    return super.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, top, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  #applyPose() {
    const frameTime = loopFrameTime(this.#armature, this.#clip, this.#elapsed);
    poseArmature(this.#armature, this.#clip, frameTime, this.#pose);

    for (const worn of this.#worn) poseSlot(worn.slot, this.#pose, worn.matrix);

    for (const { image, matrix: m } of this.#parts) {
      image.setPosition(m.tx, m.ty);
      image.rotation = Math.atan2(m.b, m.a);
      image.scaleX   = Math.hypot(m.a, m.b);
      image.scaleY   = Math.hypot(m.c, m.d) * (m.a * m.d - m.b * m.c < 0 ? -1 : 1);
    }
  }

  // `matrix` is held by reference — whatever #applyPose writes into it lands on
  // this image, whether it came from the armature's pose or a clothing slot.
  #addPart(scene, textureKey, slot, matrix) {
    const image = new Phaser.GameObjects.Image(scene, 0, 0, textureKey, slot.frameName);
    image.setOrigin(slot.pivotX, slot.pivotY);
    this.rigRoot.add(image);
    this.#parts.push({ image, matrix });
  }
}
