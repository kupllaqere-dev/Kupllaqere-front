import Phaser from "phaser";

export function createPhaserGame(parent, sceneFunctions) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent,
    // roundPixels:true was the primary source of the perspective-scale jitter
    // when moving vertically — with origin (0.5, 1.0), a 0.002/frame scale
    // delta shifts the sprite's rounded top edge by ±1px. It also caused
    // horizontal wobble when the camera scrolled at sub-pixel rates. The
    // character bases (510x900) are already rendered at 0.4–0.6 scale so
    // they're being filtered either way; switching to sub-pixel rendering
    // yields smooth motion with negligible visual cost.
    roundPixels: false,
    fps: {
      target: 60,
      // smoothStep spreads a single slow frame's delta across ~10 frames
      // of history, which visibly slows the player for several frames
      // after any hitch. Use the real per-frame delta instead (MovementManager
      // already clamps it) so recovery is instantaneous.
      smoothStep: false,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: sceneFunctions,
  });
}
