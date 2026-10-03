import { CanvasRig, loadRig, ANIMATIONS } from "./CanvasRig.js";

// A live CanvasRig on a <canvas>: keeps the backing store matched to the
// element's size and the display's pixel ratio, fits the avatar's 600x900
// canvas into view, and runs the walk cycle. Plain JS so the creator portal
// and admin panel can both wrap it in their own React.

let sharedRig = null;

/** The in-game rig, loaded once per page. */
export function getSharedRig() {
  if (!sharedRig) {
    sharedRig = loadRig();
    sharedRig.catch(() => { sharedRig = null; });
  }
  return sharedRig;
}

const DEFAULTS = {
  animation:  ANIMATIONS.idle,
  facing:     1,
  garments:   [],
  bodyAlpha:  1,
  showBones:  false,
  shadow:     true,
  margin:     0.04, // of the view, around the fitted 600x900 canvas
};

export class RigView {
  #canvas;
  #ctx;
  #rig;
  #opts;
  #seconds = 0;
  #last = 0;
  #raf = 0;
  #dirty = true;
  #resize;

  constructor(canvas, rig, options = {}) {
    this.#canvas = canvas;
    this.#ctx    = canvas.getContext("2d");
    this.#rig    = new CanvasRig(rig);
    this.#opts   = { ...DEFAULTS, ...options };

    this.#resize = new ResizeObserver(() => { this.#dirty = true; });
    this.#resize.observe(canvas);
    this.#raf = requestAnimationFrame(this.#tick);
  }

  /** Updates any of the options; the next frame redraws. */
  set(options) {
    if (options.animation && options.animation !== this.#opts.animation) this.#seconds = 0;
    Object.assign(this.#opts, options);
    this.#dirty = true;
  }

  destroy() {
    cancelAnimationFrame(this.#raf);
    this.#resize.disconnect();
  }

  #tick = (now) => {
    const dt = this.#last ? Math.min(0.1, (now - this.#last) / 1000) : 0;
    this.#last = now;
    const moving = this.#opts.animation !== ANIMATIONS.idle;
    if (moving) this.#seconds += dt;
    if (moving || this.#dirty) this.#draw();
    this.#raf = requestAnimationFrame(this.#tick);
  };

  #draw() {
    this.#dirty = false;
    const canvas = this.#canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    const ctx = this.#ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Fit the whole 600x900 authoring canvas, so anything a creator painted
    // on it — a tall hat, a long skirt — stays in view.
    const { aabb } = this.#rig.rig.armature;
    const { bounds } = this.#rig.rig;
    const o = this.#opts;
    const scale = Math.min(w / aabb.width, h / aabb.height) * (1 - 2 * o.margin);
    const centreY = aabb.y + aabb.height / 2;
    const groundX = w / 2;
    const groundY = h / 2 + (bounds.maxY - centreY) * scale;

    if (o.shadow) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(groundX, groundY - 4 * scale, 70 * scale, 16 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.#rig.draw(ctx, {
      animation: o.animation,
      seconds:   this.#seconds,
      facing:    o.facing,
      x:         groundX,
      y:         groundY,
      scale,
      garments:  o.garments,
      bodyAlpha: o.bodyAlpha,
      showBones: o.showBones,
    });
  }
}
