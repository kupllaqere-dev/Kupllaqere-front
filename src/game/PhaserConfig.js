import Phaser from "phaser";

export function createPhaserGame(parent, sceneFunctions) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: sceneFunctions,
  });
}
