/**
 * Falling-rain weather overlay for maps that want one (e.g. Castle).
 *
 * Screen-space only — the emitter is pinned to the camera (scrollFactor 0)
 * and covers the fixed 1920x1080 viewport, so it stays put as the camera
 * scrolls across wider maps instead of raining on one patch of the world.
 */
export default class RainSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [opts]
   * @param {number} [opts.width]  viewport width to cover
   * @param {number} [opts.height] viewport height to cover
   */
  constructor(scene, { width = 1920, height = 1080 } = {}) {
    this.scene = scene;

    if (!scene.textures.exists("raindrop")) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(2, 0xbfe0ff, 1);
      g.lineBetween(4, 0, 0, 18);
      g.generateTexture("raindrop", 8, 18);
      g.destroy();
    }

    this.emitter = scene.add.particles(0, 0, "raindrop", {
      x: { min: -40, max: width + 40 },
      y: -20,
      angle: { min: 95, max: 100 },
      speed: { min: 810, max: 1170 },
      lifespan: 1450,
      alpha: { min: 0.3, max: 0.6 },
      scale: { min: 0.8, max: 1.2 },
      quantity: 3,
      frequency: 20,
      blendMode: "ADD",
    });
    this.emitter.setScrollFactor(0);
    this.emitter.setDepth(10000);
  }

  destroy() {
    this.emitter.destroy();
  }
}
