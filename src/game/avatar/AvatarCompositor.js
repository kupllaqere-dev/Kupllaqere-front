import { LAYER_ORDER, SHEET_W, SHEET_ANIM_H, BASE_SPRITES } from "./LayerConfig.js";

class AvatarCompositor {
  #imgCache  = new Map(); // url → HTMLImageElement
  #bakeCache = new Map(); // hash → HTMLCanvasElement

  #load(url) {
    if (this.#imgCache.has(url)) return Promise.resolve(this.#imgCache.get(url));
    const img = new Image();
    img.crossOrigin = "anonymous";
    const p = new Promise((res, rej) => {
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`Avatar asset failed to load: ${url}`));
    });
    img.src = url;
    this.#imgCache.set(url, p); // store promise so concurrent calls share it
    p.then(resolved => this.#imgCache.set(url, resolved));
    return p;
  }

  #hash(gender, outfit) {
    return gender + "|" + JSON.stringify(outfit);
  }

  // Returns a Promise<HTMLCanvasElement> — 3060×4500, all 5 animation rows baked.
  // Result is cached by (gender, outfit) identity — same outfit returns instantly.
  async composite(gender, outfit) {
    const hash = this.#hash(gender, outfit);
    if (this.#bakeCache.has(hash)) return this.#bakeCache.get(hash);

    const baseUrl  = BASE_SPRITES[gender] ?? BASE_SPRITES.female;
    const layerUrls = LAYER_ORDER
      .map(slot => outfit?.[slot]?.imageUrl)
      .filter(Boolean);

    const images = await Promise.all(
      [baseUrl, ...layerUrls].map(url => this.#load(url))
    );

    const canvas = document.createElement("canvas");
    canvas.width  = SHEET_W;
    canvas.height = SHEET_ANIM_H; // rows 1-5 only (thumbnail excluded)
    const ctx = canvas.getContext("2d");

    for (const img of images) {
      // 1:1 copy of the top SHEET_ANIM_H pixels — no scaling, no stretching
      ctx.drawImage(img, 0, 0, SHEET_W, SHEET_ANIM_H, 0, 0, SHEET_W, SHEET_ANIM_H);
    }

    this.#bakeCache.set(hash, canvas);
    return canvas;
  }

  // Call when items change and the previous bake should not be reused.
  invalidate(gender, outfit) {
    this.#bakeCache.delete(this.#hash(gender, outfit));
  }

  // Fire-and-forget preload — warms the cache before the avatar is shown.
  preload(gender, outfit) {
    this.composite(gender, outfit).catch(() => {});
  }
}

// Shared singleton — both Phaser and React import this instance.
export const avatarCompositor = new AvatarCompositor();
