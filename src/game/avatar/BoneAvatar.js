import Phaser from "phaser";
import {
  parseArmature, createPose, poseArmature, poseSlot, createMatrix,
  attachmentMatrix, getSetupPose, loopFrameTime,
} from "./dragonBones.js";

// Debug stand-in for RigAvatar: renders the "dots" walking rig using loose
// PNG cutouts (not a packed DragonBones atlas) instead of a texture atlas.
// Same public surface as RigAvatar (constructor, play/stop/setFrame, anims,
// setInteractive) so it drops into LocalPlayer.js / PlayerManager.js
// unchanged — swap the import back to go textured again.
//
// The rig's own per-slot display transforms (rotation + offset, read by
// RigAvatar for the real atlas) are not trusted here: several are visibly
// broken, and even the "working" ones are presumably calibrated for how a
// packed DragonBones atlas frame sits, not for these standalone PNGs — using
// them produced misaligned limbs no matter how they were patched. Instead
// each cutout is *pinned* to its bone the same way RigClothing pins garment
// art: unrotated and unmoved in the rig's setup pose (so it renders exactly
// as authored at rest), then it rigidly rides that bone's rotation/position
// for any pose that differs from setup — see attachmentMatrix() below.

const RIG_DIR  = "/assets/test%20bones";
const RIG_NAME = "dots";
const SKE_KEY  = "bone-rig-ske";

const CUTS_DIR = `${RIG_DIR}/all%20cuts`;
const CUT_FILE_PREFIX = "Female-Left-Cut-maybe-last-this-time_0000s_0000s_";

// Draw order is back-to-front: torso, then legs, then arms, then head on top.
const PART_DEFS = [
  { bone: "bone6",  file: `${CUT_FILE_PREFIX}0005_Torso.png` },
  { bone: "bone3",  file: `${CUT_FILE_PREFIX}0004_Right-Upper-Leg.png` },
  { bone: "bone4",  file: `${CUT_FILE_PREFIX}0009_Right-Lower-Leg.png` },
  { bone: "bone5",  file: `${CUT_FILE_PREFIX}0007_Right-Foot.png` },
  { bone: "bone",   file: `${CUT_FILE_PREFIX}0012_Left-Upper-Leg.png` },
  { bone: "bone1",  file: `${CUT_FILE_PREFIX}0011_Left-Lower-Leg.png` },
  { bone: "bone2",  file: `${CUT_FILE_PREFIX}0013_Left-Foot.png` },
  { bone: "bone8",  file: `${CUT_FILE_PREFIX}0002_Right-Upper-Arm.png` },
  { bone: "bone9",  file: `${CUT_FILE_PREFIX}0003_Right-Lower-Arm.png` },
  { bone: "bone10", file: `${CUT_FILE_PREFIX}0015_Left-Lower-Arm.png` },
  { bone: "bone7",  file: `${CUT_FILE_PREFIX}0000_Head.png` },
];

function cutTextureKey(file) {
  return `dots-cut-${file}`;
}

// The rig's own aabb is ~600x900 already, but this box is enforced
// explicitly (rather than trusted) so any future rig still lands inside it.
const BOX_WIDTH  = 600;
const BOX_HEIGHT = 900;

// Matches RigAvatar's speed-up over the authored 24fps timeline.
const PLAYBACK_RATE = 1.5;

const armatureCache = new WeakMap(); // Phaser.Game → parsed armature

export function preloadRig(scene) {
  scene.load.json(SKE_KEY, `${RIG_DIR}/${RIG_NAME}_ske.json`);
  for (const { file } of PART_DEFS) {
    scene.load.image(cutTextureKey(file), `${CUTS_DIR}/${file}`);
  }
}

export function getRigArmature(scene) {
  const cached = armatureCache.get(scene.game);
  if (cached) return cached;

  const ske = scene.cache.json.get(SKE_KEY);
  if (!ske) {
    throw new Error("Bone rig assets are not loaded — call preloadRig() in the scene's preload()");
  }

  const armature = parseArmature(ske);
  // The JSON `aabb` reflects the armature's *setup* pose only — this rig's
  // walk clip bakes a large constant offset into the root bone, so the
  // animated pose sits well outside that box. Sample every clip (plus the
  // setup pose) once to find where the bones actually go, and fit that.
  armature.animatedBounds = computeAnimatedBounds(armature);
  armatureCache.set(scene.game, armature);
  return armature;
}

function computeAnimatedBounds(armature) {
  const pose = createPose(armature);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  const sample = (clip, frameTime) => {
    poseArmature(armature, clip, frameTime, pose);
    for (let i = 0; i < armature.bones.length; i++) {
      const bone = armature.bones[i];
      if (!bone.length) continue;
      const m  = pose.bones[i];
      const ex = bone.length * m.a + m.tx;
      const ey = bone.length * m.b + m.ty;
      minX = Math.min(minX, m.tx, ex); maxX = Math.max(maxX, m.tx, ex);
      minY = Math.min(minY, m.ty, ey); maxY = Math.max(maxY, m.ty, ey);
    }
  };

  sample(null, 0); // setup pose
  for (const clip of Object.values(armature.animations)) {
    const steps = Math.max(1, Math.ceil(clip.duration));
    for (let s = 0; s <= steps; s++) sample(clip, (s / steps) * clip.duration);
  }

  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}

export default class RigAvatar extends Phaser.GameObjects.Container {
  #armature;
  #pose;
  #parts = []; // { slot: {bone, matrix}, out, image } — one per PART_DEFS entry
  #scale;
  #centerX;
  #groundY;
  #defaultAnim;
  #clip = null;
  #elapsed = 0;

  constructor(scene, x, y) {
    super(scene, x, y);

    const armature = getRigArmature(scene);
    this.#armature    = armature;
    this.#pose        = createPose(armature);
    this.#defaultAnim = Object.keys(armature.animations)[0] ?? null;

    const { minX, maxX, minY, maxY } = armature.animatedBounds;
    const width  = maxX - minX || 1;
    const height = maxY - minY || 1;
    this.#scale   = Math.min(BOX_WIDTH / width, BOX_HEIGHT / height);
    this.#centerX = (minX + maxX) / 2;
    this.#groundY = maxY; // feet — the bottom of the animated bounds

    // Inner container carries the art-unit → box scale, centred horizontally
    // and grounded vertically so the whole walk cycle stays inside the box,
    // so the outer container's scale stays the game's own perspective scale.
    // The rig is authored mirrored (it faces/walks backwards as exported), so
    // this flips it on X — negating scaleX rather than re-deriving every bone
    // and slot transform by hand.
    const scaleX = -this.#scale;
    this.rigRoot = new Phaser.GameObjects.Container(scene, -this.#centerX * scaleX, -this.#groundY * this.#scale);
    this.rigRoot.setScale(scaleX, this.#scale);
    this.add(this.rigRoot);

    // Each cutout is pinned to its bone at that bone's own setup-pose
    // midpoint — unrotated, exactly as the PNG was exported — and rides the
    // bone's motion from there on (see attachmentMatrix in dragonBones.js).
    // PART_DEFS order is the draw order, back to front.
    for (const { bone, file } of PART_DEFS) {
      const boneIndex = armature.bones.findIndex(b => b.name === bone);
      if (boneIndex < 0) continue;
      const setupBone = getSetupPose(armature).bones[boneIndex];
      const length    = armature.bones[boneIndex].length;
      const midX = (length / 2) * setupBone.a + setupBone.tx;
      const midY = (length / 2) * setupBone.b + setupBone.ty;

      const image = new Phaser.GameObjects.Image(scene, 0, 0, cutTextureKey(file));
      image.setOrigin(0.5, 0.5);
      this.rigRoot.add(image);
      this.#parts.push({
        slot: { bone: boneIndex, matrix: attachmentMatrix(armature, boneIndex, midX, midY) },
        out:  createMatrix(),
        image,
      });
    }

    // Sprite-compatible animation surface.
    this.anims = { currentAnim: null, isPlaying: false };
    this.frame = { name: 0 };
    // The rig has a single walk clip; any requested key plays it.
    this._animKey = () => this.#defaultAnim;

    this.setSize(BOX_WIDTH, BOX_HEIGHT);
    this.#applyPose();

    scene.add.existing(this);
    this.addToUpdateList();
  }

  preUpdate(_time, delta) {
    if (!this.anims.isPlaying) return;
    this.#elapsed += (delta / 1000) * PLAYBACK_RATE;
    this.#applyPose();
  }

  /** Starts (or keeps) the walk clip regardless of the requested key. */
  play(key) {
    const clip = this.#defaultAnim ? this.#armature.animations[this.#defaultAnim] : null;
    if (this.#clip !== clip) {
      this.#clip    = clip;
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

  setFrame(name) {
    this.frame.name = name;
    return this;
  }

  // No-ops kept so avatar code written against Phaser.Sprite still runs.
  setTexture() { return this; }
  setOrigin()  { return this; }

  setInteractive() {
    const width  = this.width;
    const height = this.height;
    const left   = this.displayOriginX - width / 2;
    const top    = this.displayOriginY - height;
    return super.setInteractive(
      new Phaser.Geom.Rectangle(left, top, width, height),
      Phaser.Geom.Rectangle.Contains,
    );
  }

  #applyPose() {
    const frameTime = loopFrameTime(this.#armature, this.#clip, this.#elapsed);
    poseArmature(this.#armature, this.#clip, frameTime, this.#pose);

    for (const { slot, out, image } of this.#parts) {
      const m = poseSlot(slot, this.#pose, out);
      image.setPosition(m.tx, m.ty);
      image.rotation = Math.atan2(m.b, m.a);
      image.scaleX   = Math.hypot(m.a, m.b);
      image.scaleY   = Math.hypot(m.c, m.d) * (m.a * m.d - m.b * m.c < 0 ? -1 : 1);
    }
  }
}
