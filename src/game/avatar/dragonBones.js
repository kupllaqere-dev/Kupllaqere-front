// Minimal DragonBones (5.x JSON) runtime — just enough to pose a bone rig and
// sample its animation tracks. Meshes, slot/FFD timelines, bone offsets and
// multi-skin armatures are unsupported; the walking-avatar rig uses none of
// them. Two-bone IK (a "thigh+shin" or "upper+lower arm" chain solving for a
// target bone's position) is supported, since some rigs bake their walk cycle
// as IK-target motion rather than per-bone rotation curves.
//
// Conventions match the DragonBones exporter: y points down, angles are
// degrees, and a bone timeline stores *offsets* from the bone's setup pose
// (translate/rotate add, scale multiplies).

const DEG2RAD = Math.PI / 180;

const BONE_TRACKS = [
  ["translateFrame", "translate", f => [f.x ?? 0, f.y ?? 0]],
  ["rotateFrame",    "rotate",    f => [(f.rotate ?? 0) * DEG2RAD]],
  ["scaleFrame",     "scale",     f => [f.x ?? 1, f.y ?? 1]],
];

/** Parses a `*_ske.json` armature into a form `poseArmature` can walk. */
export function parseArmature(skeJson, armatureName = null) {
  const raw = armatureName
    ? skeJson.armature.find(a => a.name === armatureName)
    : skeJson.armature?.[0];
  if (!raw) throw new Error(`DragonBones armature not found: ${armatureName ?? "<first>"}`);

  const bones     = orderBones(raw.bone || []);
  const boneIndex = new Map(bones.map((b, i) => [b.name, i]));

  // Only the default skin is used — the rig ships a single one.
  const displays = new Map();
  for (const slot of raw.skin?.[0]?.slot || []) displays.set(slot.name, slot.display?.[0] || null);

  // Slot order in the armature *is* the draw order (first = furthest back).
  const slots = [];
  for (const s of raw.slot || []) {
    const display = displays.get(s.name);
    if (!display?.name) continue; // slot with no attachment — nothing to draw
    slots.push({
      name:      s.name,
      bone:      boneIndex.get(s.parent) ?? 0,
      frameName: display.name,
      pivotX:    display.pivot?.x ?? 0.5,
      pivotY:    display.pivot?.y ?? 0.5,
      matrix:    setMatrixFrom(newMatrix(), readTransform(display.transform)),
    });
  }

  const animations = {};
  for (const anim of raw.animation || []) {
    const boneTracks = {};
    for (const track of anim.bone || []) {
      const parsed = {};
      for (const [key, name, read] of BONE_TRACKS) {
        if (track[key]?.length) parsed[name] = readTrack(track[key], read);
      }
      boneTracks[track.name] = parsed;
    }
    animations[anim.name] = {
      name:     anim.name,
      duration: anim.duration || 0, // in timeline frames
      bones:    boneTracks,
    };
  }

  // Only two-bone (chain: 1) IK is handled — the effector bone plus its
  // parent solve to reach `target`'s posed position. Other chain lengths are
  // dropped rather than mis-solved.
  const iks = [];
  for (const ik of raw.ik || []) {
    if (ik.chain !== 1) continue;
    const effectorIndex = boneIndex.get(ik.bone);
    const targetIndex   = boneIndex.get(ik.target);
    if (effectorIndex === undefined || targetIndex === undefined) continue;
    iks.push({ boneIndex: effectorIndex, targetIndex, bendPositive: ik.bendPositive !== false });
  }

  return {
    name:      raw.name,
    frameRate: raw.frameRate || skeJson.frameRate || 24,
    aabb:      raw.aabb || { x: 0, y: 0, width: 0, height: 0 },
    bones,
    slots,
    animations,
    iks,
  };
}

/** Scratch matrices for one armature instance — one per bone and per slot. */
export function createPose(armature) {
  return {
    bones: armature.bones.map(() => newMatrix()),
    slots: armature.slots.map(() => newMatrix()),
  };
}

/**
 * Fills `pose` with world matrices for every bone and slot.
 * `animation` may be null, which yields the armature's setup pose.
 * `frameTime` is in timeline frames (see `loopFrameTime`).
 */
export function poseArmature(armature, animation, frameTime, pose) {
  computeBonePose(armature, animation, frameTime, pose, null);

  if (armature.iks.length) {
    // Pass 1 (above) gives every bone's animated-but-unsolved world position,
    // which is all a two-bone solve needs: target and chain-root positions are
    // plain translations, unaffected by the rotation IK is about to override.
    // Pass 2 substitutes solved *world* rotations for the chain-root and
    // effector bones, then reruns the same parent-before-child sweep so the
    // solve cascades correctly to anything parented under the effector.
    const overrides = new Map();
    for (const ik of armature.iks) {
      const effector = armature.bones[ik.boneIndex];
      const rootIndex = effector.parent;
      const root = armature.bones[rootIndex];
      if (rootIndex < 0) continue;

      const p0     = pose.bones[rootIndex];
      const target = pose.bones[ik.targetIndex];
      const [theta0, theta1] = solveTwoBoneIK(
        p0.tx, p0.ty, target.tx, target.ty, root.length, effector.length, ik.bendPositive,
      );
      overrides.set(rootIndex, theta0);
      overrides.set(ik.boneIndex, theta1);
    }
    computeBonePose(armature, animation, frameTime, pose, overrides);
  }

  for (let i = 0; i < armature.slots.length; i++) {
    const slot = armature.slots[i];
    const m    = pose.slots[i];
    copyMatrix(m, slot.matrix);
    concat(m, pose.bones[slot.bone]);
  }
}

// Fills `pose.bones` with world matrices, parents before children.
// `rotationOverrides` (bone index -> world-space rotation in radians), when
// given, replaces the animated rotation for those bones only — used for the
// second, IK-solved pass.
function computeBonePose(armature, animation, frameTime, pose, rotationOverrides) {
  for (let i = 0; i < armature.bones.length; i++) {
    const bone = armature.bones[i];
    const t    = bone.transform;

    let x = t.x, y = t.y, rotation = t.rotation, scaleX = t.scaleX, scaleY = t.scaleY;

    const tracks = animation?.bones[bone.name];
    if (tracks) {
      if (tracks.translate) { sampleTrack(tracks.translate, frameTime, sample); x += sample[0]; y += sample[1]; }
      if (tracks.rotate)    { sampleTrack(tracks.rotate,    frameTime, sample); rotation += sample[0]; }
      if (tracks.scale)     { sampleTrack(tracks.scale,     frameTime, sample); scaleX *= sample[0]; scaleY *= sample[1]; }
    }

    const worldOverride = rotationOverrides?.get(i);
    if (worldOverride !== undefined) {
      const parentRotation = bone.parent >= 0 ? matrixRotation(pose.bones[bone.parent]) : 0;
      rotation = worldOverride - parentRotation;
    }

    const m = pose.bones[i];
    setMatrix(m, x, y, rotation, t.skew, scaleX, scaleY);
    if (bone.parent >= 0) concat(m, pose.bones[bone.parent]);
  }
}

// Solves a 2-bone ("thigh + shin") chain rooted at (p0x, p0y) so its tip
// reaches (tx, ty), returning [rootWorldRotation, effectorWorldRotation].
// Falls back to fully extending toward the target when it's out of reach.
function solveTwoBoneIK(p0x, p0y, tx, ty, l0, l1, bendPositive) {
  const dx = tx - p0x, dy = ty - p0y;
  const maxReach = l0 + l1;
  const minReach = Math.abs(l0 - l1);
  let dist = Math.hypot(dx, dy);
  if (dist > maxReach) dist = maxReach;
  if (dist < minReach) dist = minReach || 0.0001;

  const baseAngle = Math.atan2(dy, dx);
  const cosA   = clamp((l0 * l0 + dist * dist - l1 * l1) / (2 * l0 * dist), -1, 1);
  const angleA = Math.acos(cosA);
  const theta0 = bendPositive ? baseAngle - angleA : baseAngle + angleA;

  const cosI     = clamp((l0 * l0 + l1 * l1 - dist * dist) / (2 * l0 * l1), -1, 1);
  const interior = Math.acos(cosI);
  const theta1   = bendPositive ? theta0 + (Math.PI - interior) : theta0 - (Math.PI - interior);

  return [theta0, theta1];
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function matrixRotation(m) { return Math.atan2(m.b, m.a); }

/**
 * Poses one slot-shaped `{ bone, matrix }` against bones already posed by
 * `poseArmature`. Armature slots are done for you; this is for the extra ones
 * an avatar pins on at runtime (see RigClothing).
 */
export function poseSlot(slot, pose, out) {
  copyMatrix(out, slot.matrix);
  concat(out, pose.bones[slot.bone]);
  return out;
}

/** A scratch matrix for callers that pose their own slots. */
export function createMatrix() {
  return newMatrix();
}

/**
 * The slot matrix that pins an image centred at (x, y) in the armature's setup
 * pose to `boneIndex`, so from then on it rides that bone through every
 * animation. Cancels the bone's own setup transform, which is what makes the
 * attachment sit still when the animation is at rest.
 */
export function attachmentMatrix(armature, boneIndex, x, y) {
  const m = setMatrix(newMatrix(), x, y, 0, 0, 1, 1);
  concatInverse(m, getSetupPose(armature).bones[boneIndex]);
  return m;
}

const setupPoses = new WeakMap(); // armature -> its setup pose

/** The armature's rest-pose matrices — identical every time, so computed once. */
export function getSetupPose(armature) {
  let pose = setupPoses.get(armature);
  if (!pose) {
    pose = createPose(armature);
    poseArmature(armature, null, 0, pose);
    setupPoses.set(armature, pose);
  }
  return pose;
}

/** Wraps elapsed seconds into a looping position on the animation's timeline. */
export function loopFrameTime(armature, animation, seconds) {
  if (!animation || animation.duration <= 0) return 0;
  const frames = seconds * armature.frameRate;
  return ((frames % animation.duration) + animation.duration) % animation.duration;
}

// ── parsing helpers ──────────────────────────────────────────────────────────

// Sorts bones so every parent precedes its children — `poseArmature` relies on
// a single forward pass. The exporter usually emits them in order already.
function orderBones(rawBones) {
  const byName   = new Map(rawBones.map(b => [b.name, b]));
  const index    = new Map();
  const visiting = new Set();
  const out      = [];

  function visit(raw) {
    if (index.has(raw.name)) return index.get(raw.name);
    if (visiting.has(raw.name)) throw new Error(`DragonBones bone cycle at "${raw.name}"`);
    visiting.add(raw.name);
    const parentRaw = raw.parent ? byName.get(raw.parent) : null;
    const parent    = parentRaw ? visit(parentRaw) : -1;
    visiting.delete(raw.name);

    const i = out.length;
    out.push({ name: raw.name, parent, length: raw.length || 0, transform: readTransform(raw.transform) });
    index.set(raw.name, i);
    return i;
  }

  for (const raw of rawBones) visit(raw);
  return out;
}

function readTransform(t = {}) {
  const rotation = (t.skY ?? 0) * DEG2RAD;
  return {
    x:        t.x ?? 0,
    y:        t.y ?? 0,
    rotation,
    skew:     (t.skX ?? 0) * DEG2RAD - rotation,
    scaleX:   t.scX ?? 1,
    scaleY:   t.scY ?? 1,
  };
}

// Frame durations are relative; expand them into absolute timeline positions.
function readTrack(frames, read) {
  const times = [], values = [], easings = [];
  let t = 0;
  for (const f of frames) {
    times.push(t);
    values.push(read(f));
    easings.push(f.tweenEasing);
    t += f.duration ?? 0;
  }
  return { times, values, easings };
}

// ── sampling ─────────────────────────────────────────────────────────────────

const sample = [0, 0];

function sampleTrack(track, frameTime, out) {
  const { times, values, easings } = track;

  let i = times.length - 1;
  while (i > 0 && times[i] > frameTime) i--;

  const from = values[i];
  const to   = values[i + 1];
  const tween = easings[i];

  // No following keyframe, or a stepped frame (tweenEasing absent) — hold.
  if (!to || tween === undefined || tween === null) {
    for (let k = 0; k < from.length; k++) out[k] = from[k];
    return out;
  }

  const span = times[i + 1] - times[i];
  const p    = span > 0 ? ease((frameTime - times[i]) / span, tween) : 0;
  for (let k = 0; k < from.length; k++) out[k] = from[k] + (to[k] - from[k]) * p;
  return out;
}

// DragonBones tweenEasing: 0 linear, <0 quad-in, 0..1 quad-out, >1 quad-in-out.
function ease(p, amount) {
  if (amount === 0) return p;
  if (amount < 0)   return p + (p * p - p) * -amount;
  if (amount <= 1)  return p + (1 - (1 - p) * (1 - p) - p) * amount;
  return 0.5 * (1 - Math.cos(p * Math.PI));
}

// ── matrices (row-vector convention, same as the DragonBones runtime) ────────

function newMatrix() {
  return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

function setMatrix(m, x, y, rotation, skew, scaleX, scaleY) {
  const a = Math.cos(rotation);
  const b = Math.sin(rotation);
  const c = skew === 0 ? -b : -Math.sin(skew + rotation);
  const d = skew === 0 ?  a :  Math.cos(skew + rotation);
  m.a  = a * scaleX;
  m.b  = b * scaleX;
  m.c  = c * scaleY;
  m.d  = d * scaleY;
  m.tx = x;
  m.ty = y;
  return m;
}

function setMatrixFrom(m, t) {
  return setMatrix(m, t.x, t.y, t.rotation, t.skew, t.scaleX, t.scaleY);
}

function copyMatrix(dst, src) {
  dst.a = src.a; dst.b = src.b; dst.c = src.c; dst.d = src.d; dst.tx = src.tx; dst.ty = src.ty;
}

// m := m × parent⁻¹ (in place) — undoes a concat.
function concatInverse(m, p) {
  const det = p.a * p.d - p.b * p.c;
  concat(m, {
    a:  p.d / det,
    b: -p.b / det,
    c: -p.c / det,
    d:  p.a / det,
    tx: (p.c * p.ty - p.d * p.tx) / det,
    ty: (p.b * p.tx - p.a * p.ty) / det,
  });
}

// m := m × parent (in place).
function concat(m, p) {
  const a = m.a * p.a + m.b * p.c;
  const b = m.a * p.b + m.b * p.d;
  const c = m.c * p.a + m.d * p.c;
  const d = m.c * p.b + m.d * p.d;
  const tx = m.tx * p.a + m.ty * p.c + p.tx;
  const ty = m.tx * p.b + m.ty * p.d + p.ty;
  m.a = a; m.b = b; m.c = c; m.d = d; m.tx = tx; m.ty = ty;
}
