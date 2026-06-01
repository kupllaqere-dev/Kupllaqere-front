import { buildLayerStack, SHEET_W, SHEET_ANIM_H, ROWS, BASE_SPRITES } from "./LayerConfig.js";

const imgCache = new Map(); // url → ImageBitmap

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

async function bake(gender, outfit, height) {
  const baseUrl   = BASE_SPRITES[gender] ?? BASE_SPRITES.female;
  const layerUrls = buildLayerStack(outfit).map(slot => outfit?.[slot]?.imageUrl).filter(Boolean);
  const bitmaps   = await Promise.all([baseUrl, ...layerUrls].map(loadBitmap));

  const canvas = new OffscreenCanvas(SHEET_W, height);
  const ctx    = canvas.getContext("2d");
  for (const bm of bitmaps) {
    ctx.drawImage(bm, 0, 0, SHEET_W, height, 0, 0, SHEET_W, height);
  }
  return canvas.transferToImageBitmap();
}

self.onmessage = async ({ data }) => {
  const { id, type, gender, outfit } = data;
  try {
    const height = type === "full" ? SHEET_ANIM_H : ROWS.idle.h;
    const result = await bake(gender, outfit, height);
    self.postMessage({ id, result }, [result]);
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
