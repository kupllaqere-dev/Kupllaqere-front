import { buildLayerStack, SHEET_W, SHEET_ANIM_H, ROWS, BASE_SPRITES } from "./LayerConfig.js";

class AvatarCompositor {
  #imgCache  = new Map(); // url → HTMLImageElement  (main-thread, for composite())
  #bakeCache = new Map(); // hash → Promise<HTMLCanvasElement> (full sheet, for Phaser)
  #idleCache = new Map(); // hash → Promise<ImageBitmap|HTMLCanvasElement>
  #worker    = null;
  #pending   = new Map(); // id → { resolve, reject }
  #nextId    = 0;

  constructor() {
    try {
      this.#worker = new Worker(
        new URL("./AvatarCompositorWorker.js", import.meta.url),
        { type: "module" }
      );
      this.#worker.onmessage = ({ data }) => {
        const cb = this.#pending.get(data.id);
        if (!cb) return;
        this.#pending.delete(data.id);
        if (data.error) cb.reject(new Error(data.error));
        else cb.resolve(data.result); // ImageBitmap
      };
    } catch {
      // Worker unavailable — compositeIdle falls back to main thread
    }
  }

  #load(url) {
    if (this.#imgCache.has(url)) return Promise.resolve(this.#imgCache.get(url));
    const img = new Image();
    img.crossOrigin = "anonymous";
    const p = new Promise((res, rej) => {
      img.onload  = () => res(img);
      img.onerror = () => rej(new Error(`Avatar asset failed to load: ${url}`));
    });
    img.src = url;
    this.#imgCache.set(url, p);
    p.then(resolved => this.#imgCache.set(url, resolved));
    return p;
  }

  #hash(gender, outfit) {
    return gender + "|" + JSON.stringify(outfit);
  }

  // Full bake (all 5 animation rows) — used by Phaser.
  // Worker does the heavy compositing; main thread does one drawImage to get the HTMLCanvasElement Phaser needs.
  async composite(gender, outfit) {
    const hash = this.#hash(gender, outfit);
    if (this.#bakeCache.has(hash)) return this.#bakeCache.get(hash);

    const promise = this.#worker
      ? this.#sendToWorker("full", gender, outfit).then(bitmap => {
          const canvas = document.createElement("canvas");
          canvas.width  = SHEET_W;
          canvas.height = SHEET_ANIM_H;
          canvas.getContext("2d").drawImage(bitmap, 0, 0);
          bitmap.close();
          return canvas;
        })
      : this.#compositeFallback(gender, outfit, SHEET_ANIM_H);

    this.#bakeCache.set(hash, promise);
    promise.catch(() => this.#bakeCache.delete(hash));
    return promise;
  }

  // Idle-row bake for profile preview — runs in worker (no main-thread freeze).
  async compositeIdle(gender, outfit) {
    const hash = this.#hash(gender, outfit);
    if (this.#idleCache.has(hash)) return this.#idleCache.get(hash);

    const promise = this.#worker
      ? this.#sendToWorker("idle", gender, outfit)
      : this.#compositeFallback(gender, outfit, ROWS.idle.h);

    this.#idleCache.set(hash, promise);
    promise.catch(() => this.#idleCache.delete(hash));
    return promise;
  }

  #sendToWorker(type, gender, outfit) {
    return new Promise((resolve, reject) => {
      const id = this.#nextId++;
      this.#pending.set(id, { resolve, reject });
      this.#worker.postMessage({ id, type, gender, outfit });
    });
  }

  // Main-thread fallback when worker is unavailable.
  async #compositeFallback(gender, outfit, height) {
    const baseUrl   = BASE_SPRITES[gender] ?? BASE_SPRITES.female;
    const layerUrls = buildLayerStack(outfit).map(slot => outfit?.[slot]?.imageUrl).filter(Boolean);
    const images    = await Promise.all([baseUrl, ...layerUrls].map(url => this.#load(url)));

    const canvas = document.createElement("canvas");
    canvas.width  = SHEET_W;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    for (const img of images) {
      ctx.drawImage(img, 0, 0, SHEET_W, height, 0, 0, SHEET_W, height);
    }
    return canvas;
  }

  // Warms #imgCache for a single URL — cheap, no compositing.
  preloadImage(url) {
    if (url) this.#load(url).catch(() => {});
  }

  invalidate(gender, outfit) {
    const hash = this.#hash(gender, outfit);
    this.#bakeCache.delete(hash);
    this.#idleCache.delete(hash);
  }

  preload(gender, outfit) {
    this.composite(gender, outfit).catch(() => {});
  }
}

export const avatarCompositor = new AvatarCompositor();
