/**
 * A single clickable shell decoration, e.g. for the Beach map.
 *
 * FRONT END ONLY — like TreeSystem before any reward is wired up, this is just
 * a hover/click toy: no server call, no inventory. Swap `onClick` for a real
 * handler once there's something to give the player for finding it.
 */
export default class ShellSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}   opts
   * @param {number}   opts.x       world x of the shell's base
   * @param {number}   opts.y       world y of the shell's base (also its depth)
   * @param {number}   [opts.size]  rendered width/height in px
   * @param {Function} [opts.onClick] () => void — shell clicked
   */
  constructor(scene, { x, y, size = 84, onClick }) {
    this.scene = scene;

    const shell = scene.add.image(x, y, "shell").setOrigin(0.5, 1);
    shell.setDisplaySize(size, size);
    shell.setDepth(y);
    shell.setInteractive({ pixelPerfect: true, cursor: "pointer" });
    shell.on("pointerover", () => shell.postFX.addGlow(0xffffff, 3, 0));
    shell.on("pointerout", () => shell.postFX.clear());
    shell.on("pointerdown", (pointer) => {
      if (pointer.button !== 0) return;
      scene.tweens.add({
        targets: shell,
        scale: { from: shell.scale * 1.18, to: shell.scale },
        duration: 220,
        ease: "Back.easeOut",
      });
      onClick?.();
    });

    this.shell = shell;
  }

  destroy() {
    this.shell.destroy();
  }
}
