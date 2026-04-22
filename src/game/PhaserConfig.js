import Phaser from "phaser";

export function createPhaserGame(parent, sceneFunctions) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent,
    roundPixels: true,
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
