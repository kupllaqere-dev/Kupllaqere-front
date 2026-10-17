// Client-side checks for body-part uploads — the same convention the backend
// enforces (fv-game-back/lib/itemParts.js), so creators see problems as soon
// as they drop a file instead of on submit. The body parts and per-type rules
// come from GET /api/creator/item-types.
//
//   Texas_rodeo-left_upper_arm.png        ->  name "Texas rodeo", part Left_Upper_Arm
//   Texas_rodeo-front-left_upper_arm.png  ->  the same, for the front view
//
// Which item a file belongs to is wherever it was dropped; the name only
// pre-fills an empty item's name. Which view (side, front, back) it's for is
// the view in its name, or else the view shown when it was dropped.

// Name, a hyphen, then the body part — whatever follows the last hyphen.
const FILE_RE = /^([A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*)-([A-Za-z]+(?:_[A-Za-z]+)*)\.png$/;
// The convention this replaced: "Left-upper-arm_Texas_rodeo.png".
const OLD_FILE_RE = /^([A-Za-z]+(?:-[A-Za-z]+)*)_([A-Za-z0-9_-]+)\.png$/;

export const NAME_EXAMPLE = "Texas_rodeo-left_upper_arm.png";
export const VIEW_NAME_EXAMPLE = "Texas_rodeo-front-left_upper_arm.png";

export const VIEWS = ["side", "front", "back"];
export const VIEW_LABELS = { side: "Side", front: "Front", back: "Back" };
const VIEW_SUFFIX_RE = new RegExp(`-(${VIEWS.join("|")})$`, "i");

/** The body parts `view`'s rig has — from the backend, or all of them if it predates views. */
export function partsOfView(types, view) {
  return types.views?.find((v) => v.name === view)?.bodyParts ?? types.bodyParts.map((p) => p.name);
}

// Ids that stay unique across hot reloads and remounts — a module-level
// counter restarts at 1 when the module reloads while pieces and items already
// on screen keep theirs, and two items sharing an id then edit as one.
export function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** { part, itemName, view } or { error }; `view` is null when the name doesn't say. */
export function parseFileName(fileName, types) {
  const base = String(fileName).split(/[\\/]/).pop();
  // Matched against the part's own name ("Right_Lower_Arm"), not the token the
  // backend sends, so a backend still on the old hyphenated tokens can't make
  // the multi-word parts unrecognisable.
  const byToken = new Map(types.bodyParts.map((p) => [p.name.toLowerCase(), p.name]));
  const m = FILE_RE.exec(base);
  const part = m && byToken.get(m[2].toLowerCase());
  if (!part) {
    if (!/\.png$/i.test(base)) return { error: "Not a .png file." };
    if (/\s/.test(base)) return { error: "Contains spaces — use underscores in the name." };
    const old = OLD_FILE_RE.exec(base);
    const oldPart = old && byToken.get(old[1].replace(/-/g, "_").toLowerCase());
    if (oldPart) return { error: `The body part now goes last — rename it ${old[2]}-${tokenOf(oldPart)}.png` };
    if (m) return { error: `Unknown body part "${m[2]}".` };
    return { error: `Doesn't follow Name-body_part.png (e.g. ${NAME_EXAMPLE}).` };
  }
  const viewMatch = VIEW_SUFFIX_RE.exec(m[1]);
  const view      = viewMatch ? viewMatch[1].toLowerCase() : null;
  const itemName  = (viewMatch ? m[1].slice(0, viewMatch.index) : m[1]).replace(/_/g, " ");
  if (!itemName) return { error: "The item name is missing." };
  if (itemName.length > types.maxNameLength) return { error: `Name is longer than ${types.maxNameLength} characters.` };
  return { part, itemName, view };
}

/** The body part as file names end in it: "left_upper_arm". */
export function tokenOf(part) {
  return part.toLowerCase();
}

/** "Left_Upper_Arm" -> "Left upper arm". */
export function labelOf(part) {
  const words = part.toLowerCase().split("_");
  return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ");
}

/** The file name a piece of `itemName` on `part` is expected under; side pieces need no view. */
export function expectedFileName(itemName, part, view = "side") {
  const name = String(itemName || "Item").trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_-]/g, "") || "Item";
  return view === "side" ? `${name}-${tokenOf(part)}.png` : `${name}-${view}-${tokenOf(part)}.png`;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read the image.")); };
    img.src = url;
  });
}

// Opaque bounds of an image, or null if it's fully transparent.
function opaqueBounds(img) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function cropThumb(img, b, size = 72) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const s = Math.min(size / b.w, size / b.h);
  c.getContext("2d").drawImage(img, b.x, b.y, b.w, b.h, (size - b.w * s) / 2, (size - b.h * s) / 2, b.w * s, b.h * s);
  return c.toDataURL("image/png");
}

const OVERLAP_SLACK = 40; // px a garment may sit outside its body part and still count as on it


/**
 * Checks one dropped file. Always resolves, with `error` set when it can't be
 * used and `warning` when it can but looks off. `view` is where it goes if
 * its name doesn't say. `bodyRectsByView` (view -> part -> rect on the
 * 600x900 canvas) enables the "is this on the right body part?" check.
 */
export async function inspectFile(file, types, bodyRectsByView, view = "side") {
  const entry = { id: uid(), file, fileName: file.name };
  const parsed = parseFileName(file.name, types);
  if (parsed.error) return { ...entry, error: parsed.error };
  Object.assign(entry, parsed, { view: parsed.view ?? view });
  if (!partsOfView(types, entry.view).includes(entry.part)) {
    return { ...entry, error: `The ${VIEW_LABELS[entry.view].toLowerCase()} view has no ${labelOf(entry.part).toLowerCase()}${
      entry.part === "Right_Upper_Arm" ? " — its right arm is one piece, right_lower_arm" : ""}.` };
  }

  let loaded;
  try { loaded = await loadImageFromFile(file); }
  catch (e) { return { ...entry, error: e.message }; }
  const { img, url } = loaded;
  Object.assign(entry, { image: img, url });

  const { width, height } = types.canvas;
  if (img.naturalWidth !== width || img.naturalHeight !== height) {
    return { ...entry, error: `Is ${img.naturalWidth}×${img.naturalHeight} — must be exactly ${width}×${height}.` };
  }
  const bounds = opaqueBounds(img);
  if (!bounds) return { ...entry, error: "The image is fully transparent." };
  entry.bounds = bounds;
  entry.thumb  = cropThumb(img, bounds);

  const body = bodyRectsByView?.[entry.view]?.get(entry.part);
  if (body) {
    const overlaps = bounds.x < body.x + body.w + OVERLAP_SLACK && bounds.x + bounds.w > body.x - OVERLAP_SLACK
                  && bounds.y < body.y + body.h + OVERLAP_SLACK && bounds.y + bounds.h > body.y - OVERLAP_SLACK;
    if (!overlaps) entry.warning = `Doesn't touch the ${labelOf(entry.part)} — check the body part at the end of the file name, and that it was painted on the template.`;
  }
  return entry;
}

/**
 * Where an item stands. Any piece goes on the avatar straight away; the type's
 * usual parts are only suggestions. It can be submitted once it has a type.
 * `files` are its pieces ({ view, part }); `suggested` maps each view to the
 * parts that type usually covers which it has no piece for yet.
 */
export function checkItem(files, category, subcategory, types) {
  const rule = category && subcategory ? types.rules[`${category}/${subcategory}`] : null;
  const suggested = {};
  for (const view of VIEWS) {
    const have = new Set(files.filter((f) => f.view === view).map((f) => f.part));
    const exists = new Set(partsOfView(types, view));
    suggested[view] = rule
      ? [...new Set([...rule.required, ...rule.optional])].filter((p) => exists.has(p) && !have.has(p))
      : [];
  }
  return { rule, suggested, complete: !!rule && files.length > 0 };
}

/** Where an item stacks on a shared body part — fixed by its type, set by the backend. */
export function layerOf(category, subcategory, types) {
  return types.layers[`${category}/${subcategory}`] ?? types.defaultLayer ?? 0;
}
