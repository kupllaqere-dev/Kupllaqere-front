import { getSeed, getRarity } from "./PlanterSystem";

/**
 * The seeds lying around the Garden, waiting to be picked up.
 *
 * Purely a view: the server owns which seeds exist, where they are and who got
 * them (fv-game-back/lib/seedSpawner.js). This class renders whatever it is
 * told about and reports clicks back up; it never invents or removes a seed on
 * its own, so two players clicking the same seed always agree on who won.
 *
 * Art is placeholder emoji, matching PlanterSystem and TreeSystem, with a
 * rarity-tinted glow underneath so the scarce ones read from across the map.
 */

const ICON_PX = 44;
const BOB_PX = 10;      // how far a seed drifts up and down
const BOB_MS = 1400;
const HALO_W = 62;
const HALO_H = 26;

export default class SeedField {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}   opts
   * @param {Function} opts.onPickup  (seedDropId) => void — a seed was clicked
   */
  constructor(scene, { onPickup }) {
    this.scene = scene;
    this.onPickup = onPickup;
    this.drops = new Map(); // drop id -> { objects, tweens }
  }

  /** Replaces everything on the ground with the server's current list. */
  sync(seeds = []) {
    for (const id of [...this.drops.keys()]) this._destroyDrop(id);
    for (const seed of seeds) this.add(seed);
  }

  /** @param {{id: string, seedId: string, rarity: string, x: number, y: number}} drop */
  add({ id, seedId, rarity, x, y }) {
    if (!id || this.drops.has(id)) return;

    const scene = this.scene;
    const seed = getSeed(seedId);
    const tier = getRarity(rarity ?? seed.rarity);

    // Sorted like a player standing at the same spot, so a seed behind an
    // avatar is drawn behind it.
    const halo = scene.add.ellipse(x, y, HALO_W, HALO_H, tier.hex, 0.32).setDepth(y - 1);
    const icon = scene.add
      .text(x, y, seed.icon, { fontSize: `${ICON_PX}px` })
      .setOrigin(0.5, 0.9)
      .setDepth(y);

    const label = scene.add
      .text(x, y - ICON_PX - 10, `${seed.name} · ${tier.label}`, {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: tier.color,
      })
      .setOrigin(0.5, 1)
      .setStroke("#20112f", 5)
      .setDepth(y + 1)
      .setVisible(false);

    icon.setInteractive({ useHandCursor: true });
    icon.on("pointerover", () => {
      label.setVisible(true);
      icon.setScale(1.16);
    });
    icon.on("pointerout", () => {
      label.setVisible(false);
      icon.setScale(1);
    });
    icon.on("pointerdown", (pointer) => {
      if (pointer.button !== 0) return;
      // The server decides — the seed only disappears when it says so.
      this.onPickup?.(id);
    });

    const tweens = [
      scene.tweens.add({
        targets: icon,
        y: y - BOB_PX,
        duration: BOB_MS,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
      scene.tweens.add({
        targets: halo,
        scaleX: { from: 0.8, to: 1.12 },
        scaleY: { from: 0.8, to: 1.12 },
        alpha: { from: 0.32, to: 0.14 },
        duration: BOB_MS,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      }),
    ];

    // Drop-in pop, so a seed appearing mid-view is noticeable. Tracked with the
    // rest so a seed claimed the instant it lands doesn't fight two tweens.
    icon.setScale(0.2);
    tweens.push(
      scene.tweens.add({ targets: icon, scale: 1, duration: 320, ease: "Back.easeOut" }),
    );

    this.drops.set(id, { objects: [halo, icon, label], tweens, icon });
  }

  /**
   * Takes a seed off the ground. `taken` plays the pickup flourish; an expired
   * seed just fades out.
   */
  remove(id, taken = true) {
    const drop = this.drops.get(id);
    if (!drop) return;

    for (const tween of drop.tweens) tween.stop();
    drop.tweens = [];
    drop.objects.forEach((obj) => obj.disableInteractive?.());

    this.scene.tweens.add({
      targets: drop.objects,
      y: taken ? "-=70" : "+=0",
      alpha: 0,
      scale: taken ? 1.4 : 0.7,
      duration: taken ? 420 : 260,
      ease: "Cubic.easeOut",
      onComplete: () => this._destroyDrop(id),
    });
  }

  _destroyDrop(id) {
    const drop = this.drops.get(id);
    if (!drop) return;
    for (const tween of drop.tweens) tween.stop();
    for (const obj of drop.objects) obj.destroy();
    this.drops.delete(id);
  }

  destroy() {
    for (const id of [...this.drops.keys()]) this._destroyDrop(id);
  }
}
