import Phaser from "phaser";
import {
  parseArmature, createPose, poseArmature, poseSlot, createMatrix,
  attachmentMatrix, loopFrameTime,
} from "./dragonBones.js";
import { partDrawOrder } from "./rigParts.js";

// The "skeleton" rig: the avatar is assembled straight out of the packed
// atlas, the DragonBones skeleton is laid over it in its idle pose, and each
// body part is then pinned to the bone it sits on.
//
// Assembly. qifsha.json is a TexturePacker sheet whose frames are trimmed
// cutouts of one 600x900 canvas — `spriteSourceSize` says where each cutout
// belongs on it. Phaser restores that offset itself for a trimmed frame
// (`x = -displayOriginX + frame.x` in the batcher, with an Image's width being
// the *untrimmed* size), so every part is simply an Image with a centred
// origin drawn at one shared point: the canvas centre. Stacked in draw order
// they rebuild the original artwork pixel for pixel, no per-part maths.
//
// Registration. The armature's aabb is (-300, -450.24) 600.19x900.24 — the
// same 600x900 canvas with its centre at the armature origin, so one canvas
// pixel is one armature unit (to within 0.2 px across the whole sheet) and the
// canvas centre lands on the armature origin. That is the whole mapping
// between the two files, and it checks out: every atlas frame's centre lands
// on the bone named after it.
//
// Linking. The rig's slots only set the draw order. In qifsha_ske.json they
// all hang off `root` with no attachments, so they say nothing about which
// bone drives which part, and the atlas already places the art. Each part is
// instead
// *pinned* to its bone the way RigClothing pins garments: unrotated and
// unmoved in the setup pose — which is what the keyless `idle` clip resolves
// to, so the assembled art renders exactly as authored at rest — then riding
// that bone rigidly for any pose that differs from it. Where the pin point
// sits does not matter to that (the bone's motion is applied as a rigid
// transform either way), so all eleven parts share one. See attachmentMatrix()
// in dragonBones.js.

const RIG_DIR   = "/assets/skeleton";
const SKE_FILE   = "qifsha_ske.json";
const ATLAS_FILE = "qifsha"; // .png + .json
const SKE_KEY   = "skeleton-ske";
const ATLAS_KEY = "skeleton-atlas";

// Draw order, back to front, comes from the rig's slot order (the last slot,
// Head, on top) via partDrawOrder in rigParts.js — shared with the creator
// portal's preview so both stack the parts the same way.

// The parts that touch the ground. The avatar is anchored between these
// rather than on the middle of its whole bounding box: the arms hang well
// clear of the body on one side, which drags that box ~15 units off the spot
// the character actually stands on — enough to leave the shadow beside the
// feet rather than under them.
const GROUND_PARTS = ["Left_Foot", "Right_Foot"];

// The pose held when nothing is playing. `idle` is keyless (duration 0), so it
// resolves to the setup pose — naming it rather than passing null keeps that
// true if the clip later gains keyframes.
const REST_ANIM = "idle";

// Art unit -> world pixel. The assembled art is ~684 units tall and the
// character bases this replaces were 668 px tall, so this keeps the on-screen
// size — and every perspectiveScale() value tuned against it — unchanged.
const RIG_SCALE = 0.978;

// Matches RigAvatar's speed-up over the authored 24 fps timeline: the walk
// cycle is 30 frames, so 1.5 turns a 1.25 s stride into a ~0.83 s one.
const PLAYBACK_RATE = 1.5;

// Fraction of the art's width used as the click target. The full box spans the
// arm swing, which would swallow click-to-move taps near the player.
const HIT_WIDTH_RATIO = 0.55;

// Which way the art faces: +1 as authored, -1 mirrored. The rig is
// front-facing with a single walk cycle, so heading right is shown by
// mirroring the whole thing. Direction reaches an avatar two ways — the walk
// animation key while it is moving, and the frame index while it stands — so
// both set the facing, and anything carrying no left/right (walkUp/walkDown,
// FRONT/BACK) leaves it alone so the last facing persists.
//
// The frame indices are PlayerManager's FRAME, repeated rather than imported:
// PlayerManager imports this module, so importing it back would be a cycle.
const FACE_LEFT  =  1;
const FACE_RIGHT = -1;
const RIGHT_FRAMES = new Set([4, 5]); // FRONT_RIGHT, RIGHT
const LEFT_FRAMES  = new Set([1, 2]); // FRONT_LEFT,  LEFT

// Bone overlay — the skeleton drawn over the assembled art so the two can be
// checked against each other. Off: it was for confirming the parts really do
// sit on their bones, which they do. Flip to true to see it again — nothing
// else depends on it, and with it off no Graphics object is even created.
const SHOW_SKELETON = false;
const BONE_COLOR    = 0xffd479; // gold — reads over both skin and clothing
const JOINT_COLOR   = 0xffffff;
const BONE_WIDTH    = 4;        // art units, so it scales with the avatar
const JOINT_RADIUS  = 5;

const armatureCache = new WeakMap(); // Phaser.Game → parsed armature + parts

export function preloadRig(scene) {
  scene.load.json(SKE_KEY, `${RIG_DIR}/${SKE_FILE}`);
  scene.load.atlas(ATLAS_KEY, `${RIG_DIR}/${ATLAS_FILE}.png`, `${RIG_DIR}/${ATLAS_FILE}.json`);
}

/** Parses the armature and resolves the atlas parts once per game. */
export function getRigArmature(scene) {
  const cached = armatureCache.get(scene.game);
  if (cached) return cached;

  const ske = scene.cache.json.get(SKE_KEY);
  if (!ske || !scene.textures.exists(ATLAS_KEY)) {
    throw new Error("Skeleton rig assets are not loaded — call preloadRig() in the scene's preload()");
  }

  const armature = parseArmature(ske);
  armature.parts     = buildParts(scene, armature);
  armature.artBounds = computeArtBounds(armature, armature.parts);
  armature.ikTargets = new Set(armature.iks.map(ik => ik.targetIndex));

  // Where the character stands: midway between the feet, on the ground. Falls
  // back to the middle of the art if the ground parts ever go missing.
  const feet = armature.parts.filter(p => GROUND_PARTS.includes(p.name));
  const footBounds = feet.length ? computeArtBounds(armature, feet) : armature.artBounds;
  armature.anchorX = (footBounds.minX + footBounds.maxX) / 2;

  armatureCache.set(scene.game, armature);
  return armature;
}

// One entry per atlas frame, in draw order: the bone it rides, the slot matrix
// that pins it there, and its trimmed rect as an offset from the pin point
// (used only to measure where the art actually sits).
function buildParts(scene, armature) {
  const texture = scene.textures.get(ATLAS_KEY);
  const { x, y, width, height } = armature.aabb;
  const pinX = x + width / 2;   // canvas centre, in armature units
  const pinY = y + height / 2;

  const parts = [];
  for (const name of partDrawOrder(armature)) {
    const frameName = `${name}.png`;
    if (!texture.has(frameName)) {
      console.warn(`Skeleton rig: atlas has no frame "${frameName}"`);
      continue;
    }
    const boneIndex = armature.bones.findIndex(b => b.name === name.toLowerCase());
    if (boneIndex < 0) {
      console.warn(`Skeleton rig: no bone for atlas frame "${frameName}"`);
      continue;
    }

    // frame.x/y are the trim offset on the untrimmed canvas; realWidth/Height
    // are that canvas. Both are relative to the pin, which is its centre.
    const frame = texture.get(frameName);
    parts.push({
      name,
      frameName,
      boneIndex,
      slot: { bone: boneIndex, matrix: attachmentMatrix(armature, boneIndex, pinX, pinY) },
      rect: {
        left: frame.x - frame.realWidth  / 2,
        top:  frame.y - frame.realHeight / 2,
        w:    frame.cutWidth,
        h:    frame.cutHeight,
      },
    });
  }
  return parts;
}

// Where the assembled art sits in armature units, in the rest pose — this is
// what grounds the feet at the container's origin and sizes its layout box.
// Measured from the art rather than the aabb, which covers the whole 600x900
// canvas including the empty margins above the head and below the feet.
function computeArtBounds(armature, parts) {
  const pose = createPose(armature);
  poseArmature(armature, armature.animations[REST_ANIM] ?? null, 0, pose);

  const out = createMatrix();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const part of parts) {
    const m = poseSlot(part.slot, pose, out);
    const { left, top, w, h } = part.rect;
    for (const [ox, oy] of [[left, top], [left + w, top], [left, top + h], [left + w, top + h]]) {
      const px = m.tx + ox * m.a + oy * m.c;
      const py = m.ty + ox * m.b + oy * m.d;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }

  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}

/**
 * A posed DragonBones rig that stands in for the Phaser.Sprite the world used
 * before. It mirrors the slice of the sprite API the game touches — play(),
 * stop(), setFrame(), anims.currentAnim / anims.isPlaying — so MovementManager
 * and PlayerManager drive it exactly as they drove the spritesheet.
 */
export default class SkeletonAvatar extends Phaser.GameObjects.Container {
  #armature;
  #pose;
  #parts = []; // { slot, out, image } — one per atlas frame, in draw order
  #bones = null; // debug Graphics, or null when the overlay is off
  #clip;
  #elapsed = 0;
  #anchorX = 0;
  #facing = FACE_LEFT;

  constructor(scene, x, y) {
    super(scene, x, y);

    const armature = getRigArmature(scene);
    this.#armature = armature;
    this.#pose     = createPose(armature);
    this.#clip     = armature.animations[REST_ANIM] ?? null;

    const { minX, maxX, minY, maxY } = armature.artBounds;
    this.#anchorX = armature.anchorX;

    // Inner container carries the art-unit → world-pixel scale, and offsets
    // the art so the character stands between the feet on the container's
    // (0, 0) — the point the shadow, name plate and depth sorting all use —
    // leaving the outer container's own scale free for the game's perspective
    // scale. #applyFacing sets its x and scaleX, since mirroring changes both.
    this.rigRoot = new Phaser.GameObjects.Container(scene, 0, -maxY * RIG_SCALE);
    this.rigRoot.scaleY = RIG_SCALE;
    this.add(this.rigRoot);
    this.#applyFacing();

    // Every part is drawn as if it were the whole 600x900 canvas, so they all
    // sit at the same point — the canvas centre, which is the armature origin.
    for (const part of armature.parts) {
      const image = new Phaser.GameObjects.Image(scene, 0, 0, ATLAS_KEY, part.frameName);
      image.setOrigin(0.5, 0.5);
      this.rigRoot.add(image);
      this.#parts.push({ slot: part.slot, out: createMatrix(), image });
    }

    // Added last, so the skeleton lands on top of the art it drives.
    if (SHOW_SKELETON) {
      this.#bones = new Phaser.GameObjects.Graphics(scene);
      this.rigRoot.add(this.#bones);
    }

    // Sprite-compatible animation surface.
    this.anims = { currentAnim: null, isPlaying: false };
    this.frame = { name: 0 };
    // MovementManager/PlayerManager look up an animation key per direction; the
    // rig has a single front-facing walk, so the name passes straight through.
    this._animKey = name => name;

    // The layout box the rest of the game measures against: the art's width,
    // and its height from the feet up to the top of the head, so
    // `displayHeight` still lands chat bubbles just above the avatar.
    this.setSize((maxX - minX) * RIG_SCALE, (maxY - minY) * RIG_SCALE);
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

    // The cycle itself is the same either way; only the facing differs.
    if (String(key).endsWith("Right")) this.#setFacing(FACE_RIGHT);
    else if (String(key).endsWith("Left")) this.#setFacing(FACE_LEFT);

    // Direction changes keep the cycle running rather than snapping to frame 0.
    if (this.#clip !== clip) {
      this.#clip    = clip;
      this.#elapsed = 0;
    }
    this.anims.isPlaying   = true;
    this.anims.currentAnim = { key };
    this.#applyPose();
    return this;
  }

  /** Drops back to the rig's idle pose. */
  stop() {
    this.#clip             = this.#armature.animations[REST_ANIM] ?? null;
    this.#elapsed          = 0;
    this.anims.isPlaying   = false;
    this.anims.currentAnim = null;
    this.#applyPose();
    return this;
  }

  /** Shows or hides the bone overlay on this avatar. */
  setSkeletonVisible(visible) {
    if (this.#bones) this.#bones.setVisible(visible);
    return this;
  }

  // The rig is front-facing only, so directional frames have no pose to switch
  // to — but they do say which way a standing avatar looks, which is the only
  // direction a remote player who has not moved yet ever sends.
  setFrame(name) {
    this.frame.name = name;
    const frame = Number(name);
    if (RIGHT_FRAMES.has(frame)) this.#setFacing(FACE_RIGHT);
    else if (LEFT_FRAMES.has(frame)) this.#setFacing(FACE_LEFT);
    return this;
  }

  // Mirroring flips the art about the container's x, so the centring offset
  // has to flip with it — otherwise the avatar would jump sideways by twice
  // its own off-centre distance each time it turned around.
  #setFacing(facing) {
    if (facing === this.#facing) return;
    this.#facing = facing;
    this.#applyFacing();
  }

  #applyFacing() {
    this.rigRoot.scaleX = this.#facing * RIG_SCALE;
    this.rigRoot.x      = -this.#facing * this.#anchorX * RIG_SCALE;
  }

  // No-ops kept so avatar code written against Phaser.Sprite still runs.
  setTexture() { return this; }
  setOrigin()  { return this; }

  // Containers need an explicit hit area; pixel-perfect testing isn't
  // available. Phaser normalises the hit test by the object's display origin,
  // and a Container reports that as half its size() — so the rectangle is
  // measured from the top-left of that box, not from the container's origin.
  setInteractive() {
    const width  = this.width * HIT_WIDTH_RATIO;
    const height = this.height;
    return super.setInteractive(
      new Phaser.Geom.Rectangle(
        this.displayOriginX - width / 2,
        this.displayOriginY - height, // the art stands on the container's y
        width,
        height,
      ),
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

    if (this.#bones) this.#drawSkeleton();
  }

  // Each bone as a segment from its origin along its own x axis, with a joint
  // dot at the origin — the same picture the DragonBones editor draws. The IK
  // target bones are skipped: they are handles the walk cycle steers the legs
  // and arm by, not limbs, and being 200 units long and axis-aligned they just
  // read as stray lines shooting out past the hand and ankles.
  #drawSkeleton() {
    const { bones, ikTargets } = this.#armature;
    const g = this.#bones;
    g.clear();

    for (let i = 0; i < bones.length; i++) {
      if (ikTargets.has(i)) continue;
      const bone = bones[i];
      const m    = this.#pose.bones[i];

      if (bone.length) {
        g.lineStyle(BONE_WIDTH, BONE_COLOR, 0.9);
        g.lineBetween(m.tx, m.ty, bone.length * m.a + m.tx, bone.length * m.b + m.ty);
      }
      g.fillStyle(JOINT_COLOR, 0.95);
      g.fillCircle(m.tx, m.ty, JOINT_RADIUS);
    }
  }
}
