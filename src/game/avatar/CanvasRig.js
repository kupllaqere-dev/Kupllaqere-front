import {
  parseArmature, createPose, poseArmature, poseSlot, createMatrix,
  attachmentMatrix, loopFrameTime,
} from "./dragonBones.js";
import { partDrawOrder, RIG_CANVAS } from "./rigParts.js";

// The skeleton avatar drawn onto a plain 2D canvas — the same rig, pins and
// timing as SkeletonAvatar, without Phaser, so the creator portal and the
// admin panel can preview clothing on the real in-game body.
//
// Everything here works in armature units on the shared 600x900 canvas (see
// SkeletonAvatar for why one canvas pixel is one armature unit). A "piece" is
// any image region placed on that canvas: a body part out of the rig's atlas,
// a frame out of a packed clothing atlas, or a whole raw 600x900 upload. Each
// is pinned to its part's bone, so in the rest pose it sits exactly where it
// was painted and from then on rides that bone through the walk.
//
// No framework imports on purpose: the creator and admin apps each bundle
// their own React, so anything shared with them must be plain JS.

const RIG_DIR = "/assets/skeleton";
export const RIG_ASSETS = {
  ske:        `${RIG_DIR}/qifsha_ske.json`,
  atlasJson:  `${RIG_DIR}/qifsha.json`,
  atlasImage: `${RIG_DIR}/qifsha.png`,
};

export const ANIMATIONS = { idle: "idle", walk: "walk" };

// Same as SkeletonAvatar: the walk cycle is sped up over its authored 24 fps.
const PLAYBACK_RATE = 1.5;
const GROUND_PARTS  = ["Left_Foot", "Right_Foot"];

const BONE_COLOR  = "#ffd479";
const JOINT_COLOR = "#ffffff";

// ── loading ──────────────────────────────────────────────────────────────────

const imageCache = new Map();

/** Loads (and caches) an image. Rejects on error so a broken upload is visible. */
export function loadImage(url) {
  if (!imageCache.has(url)) {
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load image ${url}`));
      img.src = url;
    });
    promise.catch(() => imageCache.delete(url));
    imageCache.set(url, promise);
  }
  return imageCache.get(url);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  return res.json();
}

/**
 * Frames of a TexturePacker atlas — the multi-texture "textures" form
 * qifsha.json uses, or the plain hash / array forms — keyed by name
 * without the ".png". Rotated frames are skipped: neither the rig's atlas nor
 * the backend packer ever rotates.
 */
export function parseAtlasFrames(json) {
  let list;
  if (Array.isArray(json?.textures)) list = json.textures.flatMap(t => t.frames || []);
  else if (Array.isArray(json?.frames)) list = json.frames;
  else list = Object.entries(json?.frames || {}).map(([filename, f]) => ({ filename, ...f }));

  const frames = new Map();
  for (const f of list) {
    if (f.rotated) {
      console.warn(`CanvasRig: rotated atlas frame "${f.filename}" is not supported`);
      continue;
    }
    const source = f.spriteSourceSize || { x: 0, y: 0 };
    const size   = f.sourceSize || { w: f.frame.w, h: f.frame.h };
    frames.set(String(f.filename).replace(/\.png$/i, ""), {
      sx: f.frame.x, sy: f.frame.y, sw: f.frame.w, sh: f.frame.h,
      dx: source.x,  dy: source.y,
      sourceW: size.w, sourceH: size.h,
    });
  }
  return frames;
}

/** A whole untrimmed 600x900 upload as a piece. */
export function rawPiece(image) {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  return { image, sx: 0, sy: 0, sw: w, sh: h, dx: 0, dy: 0, sourceW: w, sourceH: h };
}

/**
 * A packed clothing atlas (the backend packer's output) as pieces keyed by
 * body part. The image defaults to the one the JSON names, next to the JSON.
 */
export async function loadItemAtlas(jsonUrl, imageUrl = null) {
  const json = await fetchJson(jsonUrl);
  const imageName = json?.textures?.[0]?.image || json?.meta?.image;
  const src = imageUrl || new URL(imageName, new URL(jsonUrl, window.location.href)).href;
  const image = await loadImage(src);
  const pieces = new Map();
  for (const [name, frame] of parseAtlasFrames(json)) pieces.set(name, { image, ...frame });
  return { pieces, meta: json.meta || {} };
}

/** Loads the in-game rig: skeleton, body atlas, and each part pinned to its bone. */
export async function loadRig(assets = RIG_ASSETS) {
  const [ske, atlasJson, image] = await Promise.all([
    fetchJson(assets.ske),
    fetchJson(assets.atlasJson),
    loadImage(assets.atlasImage),
  ]);

  const armature = parseArmature(ske);
  const frames   = parseAtlasFrames(atlasJson);
  const { x, y, width, height } = armature.aabb;
  const pinX = x + width / 2;   // canvas centre, in armature units
  const pinY = y + height / 2;

  // Back to front, as the rig's slots stack them — the same order in game.
  const order = partDrawOrder(armature);
  const parts = [];
  for (const name of order) {
    const frame     = frames.get(name);
    const boneIndex = armature.bones.findIndex(b => b.name === name.toLowerCase());
    if (!frame || boneIndex < 0) {
      console.warn(`CanvasRig: body part "${name}" is missing from the atlas or skeleton`);
      continue;
    }
    parts.push({
      name,
      boneIndex,
      slot: { bone: boneIndex, matrix: attachmentMatrix(armature, boneIndex, pinX, pinY) },
      body: { image, ...frame },
    });
  }

  const rig = { armature, parts, order, ikTargets: new Set(armature.iks.map(ik => ik.targetIndex)) };
  rig.bounds  = restBounds(rig, parts);
  const feet  = parts.filter(p => GROUND_PARTS.includes(p.name));
  const footB = feet.length ? restBounds(rig, feet) : rig.bounds;
  rig.anchorX = (footB.minX + footB.maxX) / 2;
  return rig;
}

// Where the body art sits in the rest pose, in armature units.
function restBounds(rig, parts) {
  const pose = createPose(rig.armature);
  poseArmature(rig.armature, rig.armature.animations[ANIMATIONS.idle] ?? null, 0, pose);
  const out = createMatrix();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const part of parts) {
    const m = poseSlot(part.slot, pose, out);
    const { dx, dy, sw, sh, sourceW, sourceH } = part.body;
    const left = dx - sourceW / 2, top = dy - sourceH / 2;
    for (const [ox, oy] of [[left, top], [left + sw, top], [left, top + sh], [left + sw, top + sh]]) {
      const px = m.tx + ox * m.a + oy * m.c;
      const py = m.ty + ox * m.b + oy * m.d;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
}

// ── drawing ──────────────────────────────────────────────────────────────────

/**
 * One posable avatar. Garments are `{ part, layer, piece }`, each riding its
 * body part's bone and drawn in that part's slot: body parts go back to front
 * in the rig's slot order, and each part's garments go straight on top of it,
 * lowest item layer first — so a sleeve on the far arm stays behind the torso,
 * just like the arm it is worn on.
 */
export class CanvasRig {
  #rig;
  #pose;
  #out = createMatrix();

  constructor(rig) {
    this.#rig  = rig;
    this.#pose = createPose(rig.armature);
  }

  get rig() { return this.#rig; }

  /**
   * Draws the avatar standing with its feet on (x, y), in the context's
   * current coordinate space. `scale` is canvas units per armature unit;
   * `facing` is 1 as authored (looking left), -1 mirrored.
   */
  draw(ctx, {
    animation = ANIMATIONS.idle, seconds = 0, facing = 1, x = 0, y = 0, scale = 1,
    garments = [], bodyAlpha = 1, showBones = false,
  } = {}) {
    const { armature, parts, bounds, anchorX } = this.#rig;
    const clip = armature.animations[animation] ?? null;
    poseArmature(armature, clip, loopFrameTime(armature, clip, seconds * PLAYBACK_RATE), this.#pose);

    ctx.save();
    ctx.translate(x - facing * anchorX * scale, y - bounds.maxY * scale);
    ctx.scale(facing * scale, scale);

    // Each body part, then whatever is worn on it, then the next part — so
    // clothing stacks exactly like the body (and bones) it rides.
    const worn = new Map();
    garments
      .map((g, i) => ({ g, i }))
      .sort((a, b) => (a.g.layer ?? 0) - (b.g.layer ?? 0) || a.i - b.i)
      .forEach(({ g }) => {
        if (!worn.has(g.part)) worn.set(g.part, []);
        worn.get(g.part).push(g.piece);
      });
    for (const part of parts) {
      if (bodyAlpha > 0) {
        ctx.globalAlpha = bodyAlpha;
        this.#drawOnPart(ctx, part, part.body);
        ctx.globalAlpha = 1;
      }
      for (const piece of worn.get(part.name) || []) this.#drawOnPart(ctx, part, piece);
    }

    if (showBones) this.#drawBones(ctx, 1 / scale);
    ctx.restore();
  }

  // A piece pinned to `part`'s bone in the current pose.
  #drawOnPart(ctx, part, piece) {
    const m = poseSlot(part.slot, this.#pose, this.#out);
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
    drawPiece(ctx, piece);
    ctx.restore();
  }

  #drawBones(ctx, px) {
    const { armature, ikTargets } = this.#rig;
    ctx.lineWidth = 3 * px;
    for (let i = 0; i < armature.bones.length; i++) {
      if (ikTargets.has(i)) continue;
      const bone = armature.bones[i];
      const m    = this.#pose.bones[i];
      if (bone.length) {
        ctx.strokeStyle = BONE_COLOR;
        ctx.beginPath();
        ctx.moveTo(m.tx, m.ty);
        ctx.lineTo(bone.length * m.a + m.tx, bone.length * m.b + m.ty);
        ctx.stroke();
      }
      ctx.fillStyle = JOINT_COLOR;
      ctx.beginPath();
      ctx.arc(m.tx, m.ty, 4 * px, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// A piece's canvas is centred on the pin, so its top-left sits half a canvas
// up and left of it, and the trimmed region is offset from there.
function drawPiece(ctx, p) {
  ctx.drawImage(p.image, p.sx, p.sy, p.sw, p.sh, p.dx - p.sourceW / 2, p.dy - p.sourceH / 2, p.sw, p.sh);
}

/**
 * The bare body at rest on a 600x900 canvas — the template creators paint
 * clothing over. At rest every part sits exactly where the atlas places it,
 * so this is just the frames stacked in draw order.
 */
export function renderTemplate(rig, { background = null } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width  = RIG_CANVAS.width;
  canvas.height = RIG_CANVAS.height;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  for (const { body: p } of rig.parts) ctx.drawImage(p.image, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.sw, p.sh);
  return canvas;
}

/** Where each body part's art sits on the 600x900 canvas: name -> { x, y, w, h }. */
export function bodyPartRects(rig) {
  const rects = new Map();
  for (const { name, body: p } of rig.parts) rects.set(name, { x: p.dx, y: p.dy, w: p.sw, h: p.sh });
  return rects;
}
