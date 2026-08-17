import { buildLayerStack, SHEET_W, SHEET_ANIM_H, ROWS, BASE_SPRITES } from "./LayerConfig.js";
import { normalizeSkinColor, isBaseSkinTone, applySkinTint } from "./skinTint.js";

const imgCache = new Map(); // url → ImageBitmap

// Tinted bases are full sheets (up to ~55 MB each), so the cache is capped and
// evicted oldest-first. Rebuilding one costs a single getImageData pass.
const TINT_CACHE_MAX = 12;
const tintCache = new Map(); // `${url}|${hex}|${height}` → Promise<OffscreenCanvas>

async function loadBitmap(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const promise = fetch(url)
    .then(r => r.blob())
    .then(b => createImageBitmap(b));
  imgCache.set(url, promise);
  const bm = await promise;
  imgCache.set(url, bm);
  return bm;
}

// Returns the base sprite for a gender, recoloured to skinColor when needed.
// Resolves to an ImageBitmap (untinted) or an OffscreenCanvas (tinted) — both
// are valid drawImage sources.
function loadBase(gender, skinColor, height) {
  const url = BASE_SPRITES[gender] ?? BASE_SPRITES.female;
  if (isBaseSkinTone(skinColor)) return loadBitmap(url);

  const hex = normalizeSkinColor(skinColor);
  const key = `${url}|${hex}|${height}`;
  if (tintCache.has(key)) return tintCache.get(key);

  const promise = loadBitmap(url).then(bm => {
    const canvas = new OffscreenCanvas(SHEET_W, height);
    const ctx    = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bm, 0, 0, SHEET_W, height, 0, 0, SHEET_W, height);
    applySkinTint(ctx, SHEET_W, height, hex);
    return canvas;
  });

  tintCache.set(key, promise);
  promise.catch(() => tintCache.delete(key));
  if (tintCache.size > TINT_CACHE_MAX) tintCache.delete(tintCache.keys().next().value);
  return promise;
}

async function bake(gender, outfit, skinColor, height) {
  const layerUrls = buildLayerStack(outfit).map(slot => outfit?.[slot]?.imageUrl).filter(Boolean);
  const [base, ...bitmaps] = await Promise.all([
    loadBase(gender, skinColor, height),
    ...layerUrls.map(loadBitmap),
  ]);

  const canvas = new OffscreenCanvas(SHEET_W, height);
  const ctx    = canvas.getContext("2d");
  ctx.drawImage(base, 0, 0, SHEET_W, height, 0, 0, SHEET_W, height);
  for (const bm of bitmaps) {
    ctx.drawImage(bm, 0, 0, SHEET_W, height, 0, 0, SHEET_W, height);
  }
  return canvas.transferToImageBitmap();
}

self.onmessage = async ({ data }) => {
  const { id, type, gender, outfit, skinColor } = data;
  try {
    const height = type === "full" ? SHEET_ANIM_H : ROWS.idle.h;
    const result = await bake(gender, outfit, skinColor, height);
    self.postMessage({ id, result }, [result]);
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
