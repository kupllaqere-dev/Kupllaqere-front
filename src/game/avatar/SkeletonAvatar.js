import Phaser from "phaser";
import {
  parseArmature, createPose, poseArmature, poseSlot, createMatrix,
  attachmentMatrix, loopFrameTime,
} from "./dragonBones.js";
import { resolveRigParts, frameNameCandidates } from "./rigParts.js";

// The "skeleton" rig: the avatar is assembled straight out of the packed
// atlas, the DragonBones skeleton is laid over it in its idle pose, and each
// body part is then pinned to the bone it sits on.
//
// Three views. The character has a side-on rig (FemaleSideWalk), shown
// walking or standing left/right — mirrored for right — a front-on rig
// (FemaleFrontWalk), shown walking down and standing FRONT, and a back-on rig
// (FemaleBackWalk), shown walking up and standing BACK. Each is its own
// armature and atlas; the avatar builds all three and shows one at a time.
//
// Assembly. Each atlas is a TexturePacker sheet whose frames are trimmed
// cutouts of one 600x900 canvas — `spriteSourceSize` says where each cutout
// belongs on it. Phaser restores that offset itself for a trimmed frame
// (`x = -displayOriginX + frame.x` in the batcher, with an Image's width being
// the *untrimmed* size), so every part is simply an Image with a centred
// origin drawn at one shared point: the canvas centre. Stacked in draw order
// they rebuild the original artwork pixel for pixel, no per-part maths.
//
// Registration. One canvas pixel is one armature unit in every rig, so all
// that is needed is where the canvas centre sits in armature units, and which
// bone each frame rides — see resolveRigParts in rigParts.js.
//
// Linking. Each part is *pinned* to its bone the way RigClothing pins
// garments: unrotated and unmoved in the setup pose, so the assembled art
// renders exactly as authored at rest, then riding that bone rigidly for any
// pose that differs from it. Where the pin point sits does not matter to that,
// so all parts share one. See attachmentMatrix() in dragonBones.js.

const RIG_DIR = "/assets/skeleton";
const VIEWS = {
  side:  { dir: "FemaleSideWalk",  skeKey: "skeleton-side-ske",  atlasKey: "skeleton-side-atlas"  },
  front: { dir: "FemaleFrontWalk", skeKey: "skeleton-front-ske", atlasKey: "skeleton-front-atlas" },
  back:  { dir: "FemaleBackWalk",  skeKey: "skeleton-back-ske",  atlasKey: "skeleton-back-atlas"  },
};

// Draw order, back to front, comes from the rig's slot order (the last slot,
// Head, on top), via resolveRigParts — shared with the creator portal's
// preview so both stack the parts the same way.

// The parts that touch the ground. The avatar is anchored between these
// rather than on the middle of its whole bounding box: the arms hang well
// clear of the body on one side, which drags that box ~15 units off the spot
// the character actually stands on — enough to leave the shadow beside the
// feet rather than under them.
const GROUND_PARTS = ["Left_Foot", "Right_Foot"];

// The pose held when nothing is playing. `idle` is keyless (duration 0), so it
// resolves to the setup pose — naming it rather than passing null keeps that
// true if the clip later gains keyframes. A rig without one rests in its
// setup pose.
const REST_ANIM = "idle";
const WALK_ANIM = "walk";

// Art unit -> world pixel. The assembled art is ~684 units tall in every rig
// and the character bases this replaces were 668 px tall, so this keeps the
// on-screen size — and every perspectiveScale() value tuned against it.
const RIG_SCALE = 0.978;

// Matches RigAvatar's speed-up over the authored 24 fps timeline: the walk
// cycle is 30 frames, so 1.5 turns a 1.25 s stride into a ~0.83 s one.
const PLAYBACK_RATE = 1.5;

// Fraction of the art's width used as the click target. The full box spans the
// arm swing, which would swallow click-to-move taps near the player.
const HIT_WIDTH_RATIO = 0.55;

// Which way the side view faces: +1 as authored, -1 mirrored. It has a single
// walk cycle, so heading right is shown by mirroring it. Direction reaches an
// avatar two ways — the walk animation key while it is moving, and the frame
// index while it stands — so both pick the view and set the facing. The front
// and back views are never mirrored; the side view's facing persists while it
// is hidden.
//
// The frame indices are PlayerManager's FRAME, repeated rather than imported:
// PlayerManager imports this module, so importing it back would be a cycle.
const FACE_LEFT  =  1;
const FACE_RIGHT = -1;
const RIGHT_FRAMES = new Set([4, 5]); // FRONT_RIGHT, RIGHT
const LEFT_FRAMES  = new Set([1, 2]); // FRONT_LEFT,  LEFT
const FRONT_FRAME  = 0;
const BACK_FRAME   = 3;

// Bone overlay — the skeleton drawn over the assembled art so the two can be
// checked against each other. Off: it was for confirming the parts really do
// sit on their bones, which they do. Flip to true to see it again — nothing
// else depends on it, and with it off no Graphics object is even created.
const SHOW_SKELETON = false;
const BONE_COLOR    = 0xffd479; // gold — reads over both skin and clothing
const JOINT_COLOR   = 0xffffff;
const BONE_WIDTH    = 4;        // art units, so it scales with the avatar
const JOINT_RADIUS  = 5;

const armatureCache = new WeakMap(); // Phaser.Game → { [view]: parsed armature + parts }

export function preloadRig(scene) {
  for (const { dir, skeKey, atlasKey } of Object.values(VIEWS)) {
    scene.load.json(skeKey, `${RIG_DIR}/${dir}/${dir}_ske.json`);
    scene.load.atlas(atlasKey, `${RIG_DIR}/${dir}/${dir}.png`, `${RIG_DIR}/${dir}/${dir}.json`);
  }
}

/** Parses one view's armature and resolves its atlas parts once per game. */
export function getRigArmature(scene, view = "side") {
  let cached = armatureCache.get(scene.game);
  if (!cached) armatureCache.set(scene.game, cached = {});
  if (cached[view]) return cached[view];

  const { skeKey, atlasKey } = VIEWS[view];
  const ske = scene.cache.json.get(skeKey);
  if (!ske || !scene.textures.exists(atlasKey)) {
    throw new Error("Skeleton rig assets are not loaded — call preloadRig() in the scene's preload()");
  }

  const armature = parseArmature(ske);
  armature.atlasKey  = atlasKey;
  armature.parts     = buildParts(scene.textures.get(atlasKey), armature);
  armature.artBounds = computeArtBounds(armature, armature.parts);
  armature.ikTargets = new Set(armature.iks.map(ik => ik.targetIndex));

  // Where the character stands: midway between the feet, on the ground. Falls
  // back to the middle of the art if the ground parts ever go missing.
  const feet = armature.parts.filter(p => GROUND_PARTS.includes(p.name));
  const footBounds = feet.length ? computeArtBounds(armature, feet) : armature.artBounds;
  armature.anchorX = (footBounds.minX + footBounds.maxX) / 2;

  cached[view] = armature;
  return armature;
}

// One entry per atlas frame, in draw order: the bone it rides, the slot matrix
// that pins it there, and its trimmed rect as an offset from the pin point
// (used only to measure where the art actually sits). Which frame rides which
// bone, and where the pin goes, is worked out by resolveRigParts in
// rigParts.js — shared with the creator portal's preview.
//
// frame.x/y are the trim offset on the untrimmed canvas; realWidth/Height
// are that canvas. Both are relative to the pin, which is its centre.
function buildParts(texture, armature) {
  const findFrame = (name) => {
    const key = frameNameCandidates(name).map(n => `${n}.png`).find(k => texture.has(k));
    if (!key) return null;
    const f = texture.get(key);
    return {
      key,
      centreX: f.x + f.cutWidth  / 2 - f.realWidth  / 2,
      centreY: f.y + f.cutHeight / 2 - f.realHeight / 2,
    };
  };

  const { pinX, pinY, parts } = resolveRigParts(armature, findFrame);
  return parts.map(({ name, boneIndex, key }) => {
    const frame = texture.get(key);
    return {
      name,
      frameName: key,
      boneIndex,
      slot: { bone: boneIndex, matrix: attachmentMatrix(armature, boneIndex, pinX, pinY) },
      rect: {
        left: frame.x - frame.realWidth  / 2,
        top:  frame.y - frame.realHeight / 2,
        w:    frame.cutWidth,
        h:    frame.cutHeight,
      },
    };
  });
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
  // view name → { armature, pose, root, parts: [{ slot, out, image }], bones }
  #views = {};
  #view = "side";
  #clipName = REST_ANIM;
  #elapsed = 0;
  #facing = FACE_LEFT;

  constructor(scene, x, y) {
    super(scene, x, y);

    let width = 0, height = 0;
    for (const name of Object.keys(VIEWS)) {
      const view = this.#buildView(scene, getRigArmature(scene, name));
      view.root.setVisible(name === this.#view);
      this.#views[name] = view;

      const { minX, maxX, minY, maxY } = view.armature.artBounds;
      width  = Math.max(width,  (maxX - minX) * RIG_SCALE);
      height = Math.max(height, (maxY - minY) * RIG_SCALE);
    }
    this.#applyFacing();

    // Sprite-compatible animation surface.
    this.anims = { currentAnim: null, isPlaying: false };
    this.frame = { name: 0 };
    // MovementManager/PlayerManager look up an animation key per direction;
    // play() reads the direction straight off the name, so it passes through.
    this._animKey = name => name;

    // The layout box the rest of the game measures against: the art's width,
    // and its height from the feet up to the top of the head, so
    // `displayHeight` still lands chat bubbles just above the avatar. Covers
    // every view, so it does not change as the avatar turns.
    this.setSize(width, height);
    this.#applyPose();

    scene.add.existing(this);
    this.addToUpdateList();
  }

  // Inner container per view carries the art-unit → world-pixel scale, and
  // offsets the art so the character stands between the feet on the outer
  // container's (0, 0) — the point the shadow, name plate and depth sorting
  // all use — leaving the outer container's own scale free for the game's
  // perspective scale. #applyFacing sets its x and scaleX, since mirroring
  // changes both.
  #buildView(scene, armature) {
    const root = new Phaser.GameObjects.Container(scene, 0, -armature.artBounds.maxY * RIG_SCALE);
    root.scaleX = RIG_SCALE;
    root.scaleY = RIG_SCALE;
    root.x      = -armature.anchorX * RIG_SCALE;
    this.add(root);

    // Every part is drawn as if it were the whole 600x900 canvas, so they all
    // sit at the same point — the canvas centre, which is the pin point.
    const parts = armature.parts.map(part => {
      const image = new Phaser.GameObjects.Image(scene, 0, 0, armature.atlasKey, part.frameName);
      image.setOrigin(0.5, 0.5);
      root.add(image);
      return { slot: part.slot, out: createMatrix(), image };
    });

    // Added last, so the skeleton lands on top of the art it drives.
    let bones = null;
    if (SHOW_SKELETON) {
      bones = new Phaser.GameObjects.Graphics(scene);
      root.add(bones);
    }

    return { armature, pose: createPose(armature), root, parts, bones };
  }

  preUpdate(_time, delta) {
    if (!this.anims.isPlaying) return;
    this.#elapsed += (delta / 1000) * PLAYBACK_RATE;
    this.#applyPose();
  }

  /**
   * Starts (or keeps) an animation. walkUp plays the back view's walk cycle,
   * walkDown the front view's, walkLeft/walkRight the side view's, mirrored
   * for right.
   */
  play(key) {
    key = String(key);
    const name = key.startsWith("walk") ? WALK_ANIM : key;

    if (key.endsWith("Up"))   this.#setView("back");
    else if (key.endsWith("Down")) this.#setView("front");
    else if (key.endsWith("Right")) { this.#setView("side"); this.#setFacing(FACE_RIGHT); }
    else if (key.endsWith("Left"))  { this.#setView("side"); this.#setFacing(FACE_LEFT); }

    // Direction changes keep the cycle running rather than snapping to frame 0.
    if (this.#clipName !== name) {
      this.#clipName = name;
      this.#elapsed  = 0;
    }
    this.anims.isPlaying   = true;
    this.anims.currentAnim = { key };
    this.#applyPose();
    return this;
  }

  /** Drops back to the rig's idle pose. */
  stop() {
    this.#clipName         = REST_ANIM;
    this.#elapsed          = 0;
    this.anims.isPlaying   = false;
    this.anims.currentAnim = null;
    this.#applyPose();
    return this;
  }

  /** Shows or hides the bone overlay on this avatar. */
  setSkeletonVisible(visible) {
    for (const { bones } of Object.values(this.#views)) bones?.setVisible(visible);
    return this;
  }

  // Neither rig has directional standing poses, but the frame does say which
  // way a standing avatar looks — the only direction a remote player who has
  // not moved yet ever sends — so it picks the view and the facing.
  setFrame(name) {
    this.frame.name = name;
    const frame = Number(name);
    if (frame === FRONT_FRAME) this.#setView("front");
    else if (frame === BACK_FRAME) this.#setView("back");
    else if (RIGHT_FRAMES.has(frame)) { this.#setView("side"); this.#setFacing(FACE_RIGHT); }
    else if (LEFT_FRAMES.has(frame))  { this.#setView("side"); this.#setFacing(FACE_LEFT); }
    return this;
  }

  #setView(name) {
    if (name === this.#view) return;
    this.#views[this.#view].root.setVisible(false);
    this.#view = name;
    this.#views[name].root.setVisible(true);
    this.#applyPose();
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
    const { root, armature } = this.#views.side;
    root.scaleX = this.#facing * RIG_SCALE;
    root.x      = -this.#facing * armature.anchorX * RIG_SCALE;
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

  // Only the visible view is posed; a hidden one catches up when it is shown.
  #applyPose() {
    const view = this.#views[this.#view];
    const { armature, pose } = view;
    const clip = armature.animations[this.#clipName] ?? null;
    const frameTime = loopFrameTime(armature, clip, this.#elapsed);
    poseArmature(armature, clip, frameTime, pose);

    for (const { slot, out, image } of view.parts) {
      const m = poseSlot(slot, pose, out);
      image.setPosition(m.tx, m.ty);
      image.rotation = Math.atan2(m.b, m.a);
      image.scaleX   = Math.hypot(m.a, m.b);
      image.scaleY   = Math.hypot(m.c, m.d) * (m.a * m.d - m.b * m.c < 0 ? -1 : 1);
    }

    if (view.bones) this.#drawSkeleton(view);
  }

  // Each bone as a segment from its origin along its own x axis, with a joint
  // dot at the origin — the same picture the DragonBones editor draws. The IK
  // target bones are skipped: they are handles the walk cycle steers the legs
  // and arm by, not limbs, and being 200 units long and axis-aligned they just
  // read as stray lines shooting out past the hand and ankles.
  #drawSkeleton({ armature, pose, bones: g }) {
    const { bones, ikTargets } = armature;
    g.clear();

    for (let i = 0; i < bones.length; i++) {
      if (ikTargets.has(i)) continue;
      const bone = bones[i];
      const m    = pose.bones[i];

      if (bone.length) {
        g.lineStyle(BONE_WIDTH, BONE_COLOR, 0.9);
        g.lineBetween(m.tx, m.ty, bone.length * m.a + m.tx, bone.length * m.b + m.ty);
      }
      g.fillStyle(JOINT_COLOR, 0.95);
      g.fillCircle(m.tx, m.ty, JOINT_RADIUS);
    }
  }
}
