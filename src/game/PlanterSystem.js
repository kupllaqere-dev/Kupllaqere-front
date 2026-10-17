import Phaser from "phaser";
import { bakeGraphics } from "./bakeGraphics";

/**
 * Outdoor planter for the Farm map: a raised timber bed holding a 5x5 grid of
 * soil plots the player can sow, wait on, and harvest.
 *
 * The bed is drawn in one-point perspective. The vanishing point sits on the
 * map's horizon, `lean` px to the right of the bed's centre — always relative
 * to the bed, so every bed built with the same lean is an exact copy of the
 * others wherever it stands. Every horizontal measurement is scaled by its
 * distance below that point, so the back of the bed is narrower than the front
 * and the rows compress as they recede.
 * `scaleAt()` and `project()` are the single source of that projection — plot
 * quads, rim thickness, gaps, speckle size and plant scale all run through it.
 *
 * A bed can start locked: its plots are inert and a price tag sits over the
 * soil until unlock() is called (the Farm's extra beds are bought with Lis).
 *
 * The bed is a view over server state: plots are loaded with load(), sowing and
 * harvesting are requests the caller makes on the player's behalf (see
 * Game.jsx), and ripeness is measured against the server's clock rather than
 * the scene's. Crops therefore keep growing while the player is elsewhere or
 * logged out — nothing here has to be running for a seed to come up.
 *
 * Plant art is placeholder emoji rendered as Text so the growth stages read at
 * a glance until real sprites exist.
 */

export const COLS = 5;
export const ROWS = 5;
export const PLOT_COUNT = COLS * ROWS;

/**
 * Default growing time. The server sends its own value with the farm (see
 * GROW_MS in fv-game-back/lib/farm.js); this is the fallback used before that
 * arrives, and for showing "ripens in Ns" in the seed picker.
 */
export const GROW_MS = 60_000;

/**
 * How scarce each seed is in the Garden. The drop weights themselves are the
 * server's business (fv-game-back/lib/seeds.js); this is the presentation side
 * of rarity — what a tier is called and the colour it is drawn in.
 */
export const SEED_RARITY = {
  common:    { label: "Common",    color: "#cfc3e8", hex: 0xcfc3e8 },
  uncommon:  { label: "Uncommon",  color: "#7ee6a8", hex: 0x7ee6a8 },
  rare:      { label: "Rare",      color: "#6fc3ff", hex: 0x6fc3ff },
  legendary: { label: "Legendary", color: "#ffcf4d", hex: 0xffcf4d },
};

export function getRarity(rarity) {
  return SEED_RARITY[rarity] || SEED_RARITY.common;
}

/**
 * Seed catalogue. Every seed takes the same minute to grow; what differs is the
 * payout — flowers sell for coins, the herbs are studied for XP instead — and
 * how often it turns up in the Garden, which is what `rarity` records. Ids and
 * rarities must match fv-game-back/lib/seeds.js, which decides what drops.
 */
export const SEEDS = [
  { id: "sunflower", name: "Sunflower", rarity: "common",     sprout: "🌱", icon: "🌻", reward: { type: "coins", amount: 500 } },
  { id: "tulip",     name: "Tulip",     rarity: "common",     sprout: "🌱", icon: "🌷", reward: { type: "coins", amount: 500 } },
  { id: "mint",      name: "Mint",      rarity: "common",     sprout: "🌱", icon: "🍃", reward: { type: "xp",    amount: 5000 } },
  { id: "chamomile", name: "Chamomile", rarity: "common",     sprout: "🌱", icon: "🌼", reward: { type: "xp",    amount: 5000 } },
  { id: "rose",      name: "Rose",      rarity: "uncommon",   sprout: "🌱", icon: "🌹", reward: { type: "coins", amount: 1200 } },
  { id: "sage",      name: "Sage",      rarity: "rare",       sprout: "🌱", icon: "🌿", reward: { type: "xp",    amount: 400 } },
  { id: "mandrake",  name: "Mandrake",  rarity: "legendary",  sprout: "🌱", icon: "🍀", reward: { type: "xp",    amount: 1500 } },
];

export function getSeed(seedId) {
  return SEEDS.find((s) => s.id === seedId) || SEEDS[0];
}

/**
 * Lis it costs to open each bed on the Farm, by position. The first is free;
 * the rest are bought in order. Must match PLANTER_PRICES in
 * fv-game-back/lib/farm.js, which is what actually charges.
 */
export const PLANTER_PRICES = [0, 100, 250];

/** What the bed's plaque reads before anyone renames it. */
export const DEFAULT_PLANTER_NAME = "PLANTER";

/** Longest name the plaque will accept. */
export const PLANTER_NAME_MAX = 24;

/**
 * Trims a player-supplied name down to something the plaque can carry, falling
 * back to the default when nothing usable is left.
 */
export function sanitizePlanterName(name) {
  const collapsed = String(name ?? "").replace(/\s+/g, " ").trim();
  // Cut by code point, not by UTF-16 unit — slicing mid-surrogate would leave a
  // lone half that renders as a replacement box.
  const clean = [...collapsed].slice(0, PLANTER_NAME_MAX).join("").trim();
  return clean || DEFAULT_PLANTER_NAME;
}

// ── Bed geometry (world px, measured at the front edge) ──────────────
export const BED_FRONT_W = 440; // outer width where the bed is closest to camera
const BED_DEPTH   = 150; // projected front-to-back extent
export const WALL_H = 44; // height of the visible front face of the box
const RIM         = 20;  // timber rim between the outer edge and the soil
const GAP         = 7;   // furrow between neighbouring plots
const PLAQUE_W    = 168; // name plaque on the front face
const PLAQUE_H    = 26;
const PLAQUE_PAD  = 12;  // inner margin the name has to fit inside
const PLANT_PX    = 46;  // font size of a fully grown plant at the front row
const POST_W      = 10;  // corner posts on the front face
const BOARDS      = 7;   // vertical boards across the front face
const SOIL_FRONT_W = BED_FRONT_W - RIM * 2;

// Fallback for a bed placed without a horizon: how far above the front edge
// the vanishing point sits. Larger = flatter angle.
const VP_RISE = 350;

// ── Palette ──────────────────────────────────────────────────────────
const WOOD_FRONT   = 0x9c6b3a; // rim plank catching the light
const WOOD_SIDE    = 0x81552c;
const WOOD_BACK    = 0x6d461f;
const WOOD_WALL    = 0x7c5129;
const WOOD_WALL_LO = 0x53331a;
const WOOD_SEAM    = 0x422714;
const WOOD_EDGE    = 0xc08a4e;

const SOIL_DEEP  = 0x241609; // shadow in the pit, under the rim
const SOIL_BASE  = 0x452b17;
const SOIL_LIGHT = 0x573620;
const SOIL_DUST  = 0x8a6338; // dry crumb catching the light
const SOIL_DARK  = 0x2c1a0c;
const SOIL_WET   = 0x1f1308; // damp patches
const PEBBLE     = 0x8d8375;
const PEBBLE_LIT = 0xb5aa99;

const READY_TINT = 0xffd34d;

/** Mixes two packed RGB colours; t=0 returns `a`. */
function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (
    (((ar + (br - ar) * t) | 0) << 16) |
    (((ag + (bg - ag) * t) | 0) << 8) |
    ((ab + (bb - ab) * t) | 0)
  );
}

/**
 * Small deterministic PRNG. The soil speckles must be identical every redraw,
 * otherwise the texture would crawl each time a plot changes state.
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default class PlanterSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}   opts
   * @param {number}   opts.centerX      world x of the bed's centre
   * @param {number}   opts.centerY      world y of the bed's centre
   * @param {number}   opts.lean         how far right of the bed's centre the vanishing
   *                                      point sits; 0 = straight on, larger = steeper lean
   * @param {number}   opts.vpY          world y of the vanishing point (the horizon)
   * @param {number}   opts.plotOffset   index of this bed's first plot; plot indices
   *                                      in and out of this class are farm-wide
   * @param {string}   opts.name          plaque text; falls back to DEFAULT_PLANTER_NAME
   * @param {boolean}  opts.renamable     whether tapping the plaque offers a rename
   * @param {boolean}  opts.locked        start inert behind a price tag
   * @param {string}   opts.lockLabel     text on the price tag
   * @param {number}   opts.growMs        server's growing time; defaults to GROW_MS
   * @param {number}   opts.timeOffset    server clock minus local clock, in ms
   * @param {Function} opts.onPlotClick   (plotIndex, screenPos) => void — empty plot tapped
   * @param {Function} opts.onHarvest     (plotIndex) => void — ripe plot tapped; the
   *                                      caller confirms with the server, then calls
   *                                      collect() or cancelHarvest()
   * @param {Function} opts.onRenameClick (screenPos, currentName) => void — plaque tapped
   * @param {Function} opts.onUnlockClick (screenPos) => void — locked bed tapped
   */
  constructor(scene, {
    centerX, centerY, lean = 0, vpY, plotOffset = 0,
    name, renamable = true, locked = false, lockLabel = "Locked",
    growMs, timeOffset,
    onPlotClick, onHarvest, onRenameClick, onUnlockClick,
  }) {
    this.scene         = scene;
    this.onPlotClick   = onPlotClick;
    this.onHarvest     = onHarvest;
    this.onRenameClick = onRenameClick;
    this.onUnlockClick = onUnlockClick;
    this.plotOffset    = plotOffset;
    this.renamable     = renamable;
    this.locked        = locked;
    this.name          = sanitizePlanterName(name);
    this.growMs        = growMs || GROW_MS;
    // How far the server's clock is ahead of this machine's. Keeps a plot from
    // looking ripe here a few seconds before the server will allow it.
    this.timeOffset    = timeOffset || 0;
    this.plots       = [];
    this.objects     = [];
    this.dynamicDirty = true;

    this.cx     = centerX;
    this.yFront = centerY + BED_DEPTH / 2;
    this.yBack  = centerY - BED_DEPTH / 2;
    this.yVP    = vpY ?? this.yFront - VP_RISE;
    this.vpX    = centerX + lean;

    // Soil surface sits inside the rim. The rim foreshortens too, so the back
    // strip is visibly thinner than the front one.
    this.soilFrontY = this.yFront - RIM * this.scaleAt(this.yFront);
    this.soilBackY  = this.yBack  + RIM * this.scaleAt(this.yBack);

    // Everything sorts as one block against players, keyed off the bottom of
    // the box, matching the y-as-depth convention in LocalPlayer/PlayerManager.
    this.baseDepth = this.yFront + WALL_H;

    // The bed's timber and soil never change, so they are baked into a texture
    // once instead of replaying thousands of fills every frame. Only the hover
    // and ripeness tints stay a live Graphics — that is 25 quads at most.
    this.dynamicGfx = this._track(scene.add.graphics().setDepth(this.baseDepth + 0.1));

    this._buildPlots(scene);
    this._track(
      bakeGraphics(scene, (g) => this._drawStatic(g), this._artBounds(), this.baseDepth),
    );
    this._drawDynamic();
    this._buildPlaque(scene);
    if (this.locked) this._buildLock(scene, lockLabel);
  }

  // ── Perspective projection ─────────────────────────────────────────

  /** Foreshortening factor at projected y: 1 at the front edge, smaller behind. */
  scaleAt(y) {
    return (y - this.yVP) / (this.yFront - this.yVP);
  }

  /**
   * World x of a ground point that would sit at `xFront` on the front edge,
   * pushed back to projected y — it slides toward the vanishing point.
   */
  project(xFront, y) {
    return this.vpX + (xFront - this.vpX) * this.scaleAt(y);
  }

  /** Left/right x of the soil surface at projected y. */
  soilEdgesAt(y) {
    return [this.project(this.cx - SOIL_FRONT_W / 2, y), this.project(this.cx + SOIL_FRONT_W / 2, y)];
  }

  /** Left/right x of the bed's outer edge at projected y. */
  outerEdgesAt(y) {
    return [this.project(this.cx - BED_FRONT_W / 2, y), this.project(this.cx + BED_FRONT_W / 2, y)];
  }

  /**
   * Projected y of row boundary `i` (0 = back edge of the soil, ROWS = front).
   * Ground lines that are evenly spaced in world space project to evenly spaced
   * *reciprocals* of the distance below the vanishing point, which is what
   * makes the near rows deeper than the far ones.
   */
  rowY(i) {
    const back  = 1 / (this.soilBackY  - this.yVP);
    const front = 1 / (this.soilFrontY - this.yVP);
    return this.yVP + 1 / (back + (front - back) * (i / ROWS));
  }

  /** World x of soil-space coordinate u (0 = left edge, 1 = right) at row y. */
  soilX(u, y) {
    return this.project(this.cx + (u - 0.5) * SOIL_FRONT_W, y);
  }

  // ── Construction ───────────────────────────────────────────────────

  _track(obj) {
    this.objects.push(obj);
    return obj;
  }

  _buildPlots(scene) {
    for (let row = 0; row < ROWS; row++) {
      const yBack  = this.rowY(row);
      const yFront = this.rowY(row + 1);
      // Furrows foreshorten with everything else.
      const gapBack  = (GAP * this.scaleAt(yBack))  / 2;
      const gapFront = (GAP * this.scaleAt(yFront)) / 2;
      const top    = yBack  + gapBack;
      const bottom = yFront - gapFront;

      for (let col = 0; col < COLS; col++) {
        const u0 = col / COLS;
        const u1 = (col + 1) / COLS;

        // Trapezoid, clockwise from the back-left corner.
        const points = [
          { x: this.soilX(u0, top)    + gapBack,  y: top },
          { x: this.soilX(u1, top)    - gapBack,  y: top },
          { x: this.soilX(u1, bottom) - gapFront, y: bottom },
          { x: this.soilX(u0, bottom) + gapFront, y: bottom },
        ];

        this.plots.push(this._buildPlot(scene, this.plotOffset + row * COLS + col, row, points));
      }
    }
  }

  _buildPlot(scene, index, row, points) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const left = Math.min(...xs);
    const top  = Math.min(...ys);
    const w = Math.max(...xs) - left;
    const h = Math.max(...ys) - top;

    const frontY  = points[2].y;
    const frontCx = (points[2].x + points[3].x) / 2;
    const pScale  = this.scaleAt(frontY);

    // Input uses the real trapezoid, not its bounding box, so the furrows
    // between plots are dead space rather than belonging to a neighbour.
    // Zone hit areas are in coordinates relative to the AABB's top-left.
    const zone = scene.add.zone(left + w / 2, top + h / 2, w, h);
    zone.setInteractive(
      new Phaser.Geom.Polygon(points.map((p) => ({ x: p.x - left, y: p.y - top }))),
      Phaser.Geom.Polygon.Contains,
    );
    zone.input.cursor = "pointer";
    zone.input.enabled = !this.locked;

    // Plants sort among themselves by row so nearer rows overlap further ones.
    const textDepth = this.baseDepth + 0.2 + row * 0.1;

    const hint = scene.add
      .text((points[0].x + points[2].x) / 2, (points[0].y + points[2].y) / 2, "+", {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#d9b183",
      })
      .setOrigin(0.5)
      .setAlpha(0.75)
      .setStroke("#2a1809", 4)
      .setScale(pScale)
      .setDepth(textDepth)
      .setVisible(!this.locked);

    // Anchored to the plot's front edge so the plant "grows" up out of the soil.
    const plant = scene.add
      .text(frontCx, frontY - 4, "", { fontSize: `${PLANT_PX}px` })
      .setOrigin(0.5, 1)
      .setDepth(textDepth + 0.05)
      .setVisible(false);

    // Countdown / "Ready!" caption. A grown plant fills most of its plot, so the
    // caption floats above the plant's full height instead of overlapping it.
    // The offset is fixed rather than tracking the current growth scale, so the
    // text doesn't creep upward as the plant grows.
    const label = scene.add
      .text(frontCx, frontY - PLANT_PX * pScale - 4, "", {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#fff6dd",
      })
      .setOrigin(0.5, 1)
      .setStroke("#2c1a0c", 4)
      .setScale(pScale)
      .setDepth(textDepth + 0.06)
      .setVisible(false);

    const plot = {
      index, row, points, pScale, frontY,
      state: "empty", // "empty" | "growing" | "ready" | "harvesting"
      seedId: null,
      plantedAt: 0,
      hovered: false,
      zone, hint, plant, label,
      readyTween: null,
    };

    zone.on("pointerover", () => {
      plot.hovered = true;
      this.dynamicDirty = true;
      this._refreshLabel(plot);
    });
    zone.on("pointerout", () => {
      plot.hovered = false;
      this.dynamicDirty = true;
      this._refreshLabel(plot);
    });
    zone.on("pointerdown", (pointer) => {
      // Left click only — MovementManager already ignores the other buttons.
      if (pointer.button !== 0) return;
      if (plot.state === "ready") {
        this._requestHarvest(plot);
      } else if (plot.state === "empty") {
        this.onPlotClick?.(index, {
          clientX: pointer.event.clientX,
          clientY: pointer.event.clientY,
        });
      }
    });

    this._track(zone);
    this._track(hint);
    this._track(plant);
    this._track(label);
    return plot;
  }

  get _plaqueY() {
    return this.yFront + WALL_H * 0.54;
  }

  _drawPlaque(g) {
    const y = this._plaqueY;
    const left = this.cx - PLAQUE_W / 2;
    const top  = y - PLAQUE_H / 2;
    g.fillStyle(WOOD_WALL_LO, 1);
    g.fillRoundedRect(left, top, PLAQUE_W, PLAQUE_H, 6);
    g.lineStyle(2, WOOD_EDGE, 0.75);
    g.strokeRoundedRect(left, top, PLAQUE_W, PLAQUE_H, 6);
    g.lineStyle(1.5, WOOD_SEAM, 0.6);
    g.strokeRoundedRect(left + 3, top + 3, PLAQUE_W - 6, PLAQUE_H - 6, 4);
  }

  /**
   * The carved name board. The plaque's backing is part of the baked texture,
   * so the name can't reflow it — setName() scales the text down instead,
   * which keeps long names inside the timber.
   */
  _buildPlaque(scene) {
    const y = this._plaqueY;

    this.nameText = this._track(
      scene.add
        .text(this.cx, y, this.name, {
          fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
          color: "#f4dcae",
        })
        .setOrigin(0.5)
        .setStroke("#2a1809", 3)
        .setDepth(this.baseDepth + 0.15),
    );

    this._fitName();
    if (!this.renamable) return;

    const zone = this._track(scene.add.zone(this.cx, y, PLAQUE_W, PLAQUE_H));
    zone.setInteractive();
    zone.input.cursor = "pointer";
    zone.setDepth(this.baseDepth + 0.16);
    zone.on("pointerover", () => this.nameText.setColor("#ffffff"));
    zone.on("pointerout",  () => this.nameText.setColor("#f4dcae"));
    zone.on("pointerdown", (pointer) => {
      if (pointer.button !== 0) return;
      this.onRenameClick?.(
        { clientX: pointer.event.clientX, clientY: pointer.event.clientY },
        this.name,
      );
    });
  }

  /**
   * Price tag over a locked bed: the soil is dimmed, the plots stay inert, and
   * tapping anywhere on the bed asks the caller to sell it. unlock() removes
   * all of it.
   */
  _buildLock(scene, label) {
    const depth = this.baseDepth + 0.8;
    const [ofl, ofr] = this.outerEdgesAt(this.yFront);
    const [obl, obr] = this.outerEdgesAt(this.yBack);
    const [ifl, ifr] = this.soilEdgesAt(this.soilFrontY);
    const [ibl, ibr] = this.soilEdgesAt(this.soilBackY);

    const shade = scene.add.graphics().setDepth(depth);
    shade.fillStyle(0x120b05, 0.55);
    shade.fillPoints([
      { x: ibl, y: this.soilBackY },
      { x: ibr, y: this.soilBackY },
      { x: ifr, y: this.soilFrontY },
      { x: ifl, y: this.soilFrontY },
    ], true);

    const midY = (this.soilBackY + this.soilFrontY) / 2;
    const text = scene.add
      .text(this.soilX(0.5, midY), midY, label, {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#f4dcae",
      })
      .setOrigin(0.5)
      .setDepth(depth + 0.02);

    // Pill behind the label, sized to it.
    const padX = 14, padY = 7;
    const pillW = text.width + padX * 2;
    const pillH = text.height + padY * 2;
    const pill = scene.add.graphics().setDepth(depth + 0.01);
    const drawPill = (hover) => {
      pill.clear();
      pill.fillStyle(0x2b2620, hover ? 0.95 : 0.85);
      pill.fillRoundedRect(text.x - pillW / 2, text.y - pillH / 2, pillW, pillH, pillH / 2);
      pill.lineStyle(1.5, 0xd8b26a, hover ? 1 : 0.7);
      pill.strokeRoundedRect(text.x - pillW / 2, text.y - pillH / 2, pillW, pillH, pillH / 2);
    };
    drawPill(false);

    // The whole bed, top and front face, is the button.
    const outline = [
      { x: obl, y: this.yBack },
      { x: obr, y: this.yBack },
      { x: ofr, y: this.yFront },
      { x: ofr, y: this.yFront + WALL_H },
      { x: ofl, y: this.yFront + WALL_H },
      { x: ofl, y: this.yFront },
    ];
    const left = Math.min(...outline.map((p) => p.x));
    const right = Math.max(...outline.map((p) => p.x));
    const w = right - left;
    const h = this.yFront + WALL_H - this.yBack;
    const zone = scene.add.zone(left + w / 2, this.yBack + h / 2, w, h).setDepth(depth + 0.03);
    zone.setInteractive(
      new Phaser.Geom.Polygon(outline.map((p) => ({ x: p.x - left, y: p.y - this.yBack }))),
      Phaser.Geom.Polygon.Contains,
    );
    zone.input.cursor = "pointer";
    zone.on("pointerover", () => { drawPill(true); text.setColor("#ffffff"); });
    zone.on("pointerout",  () => { drawPill(false); text.setColor("#f4dcae"); });
    zone.on("pointerdown", (pointer) => {
      if (pointer.button !== 0) return;
      this.onUnlockClick?.({ clientX: pointer.event.clientX, clientY: pointer.event.clientY });
    });

    this.lockObjects = [shade, pill, text, zone];
    for (const obj of this.lockObjects) this._track(obj);
  }

  /** Opens a locked bed: drops the price tag and wakes the plots up. */
  unlock() {
    if (!this.locked) return;
    this.locked = false;
    for (const obj of this.lockObjects ?? []) {
      obj.destroy();
      this.objects = this.objects.filter((o) => o !== obj);
    }
    this.lockObjects = null;
    for (const plot of this.plots) {
      plot.zone.input.enabled = true;
      plot.hint.setVisible(plot.state === "empty");
    }
  }

  /** Shrinks the name until it sits inside the plaque's inner margin. */
  _fitName() {
    this.nameText.setScale(1);
    const maxW = PLAQUE_W - PLAQUE_PAD * 2;
    if (this.nameText.width > maxW) {
      this.nameText.setScale(maxW / this.nameText.width);
    }
  }

  /**
   * Renames the bed. Returns the name actually applied, which may differ from
   * what was passed once it has been trimmed.
   */
  setName(name) {
    this.name = sanitizePlanterName(name);
    this.nameText.setText(this.name);
    this._fitName();
    return this.name;
  }

  // ── Drawing ────────────────────────────────────────────────────────

  /** World rectangle covering the bed, its front face and its ground shadow. */
  _artBounds() {
    const [fl, fr] = this.outerEdgesAt(this.yFront);
    const [bl, br] = this.outerEdgesAt(this.yBack);
    const margin = BED_FRONT_W * 0.03 + 16; // shadow ellipse overhang
    const left   = Math.min(fl, bl) - margin;
    const right  = Math.max(fr, br) + margin;
    const top    = this.yBack - 12;
    const bottom = this.yFront + WALL_H + 24; // shadow ellipse plus margin
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  _drawStatic(g) {
    const { yFront, yBack, soilFrontY, soilBackY } = this;
    const [oflX, ofrX] = this.outerEdgesAt(yFront);
    const [oblX, obrX] = this.outerEdgesAt(yBack);
    const [iflX, ifrX] = this.soilEdgesAt(soilFrontY);
    const [iblX, ibrX] = this.soilEdgesAt(soilBackY);
    const ofl = { x: oflX, y: yFront };
    const ofr = { x: ofrX, y: yFront };
    const obl = { x: oblX, y: yBack  };
    const obr = { x: obrX, y: yBack  };
    const ifl = { x: iflX, y: soilFrontY };
    const ifr = { x: ifrX, y: soilFrontY };
    const ibl = { x: iblX, y: soilBackY  };
    const ibr = { x: ibrX, y: soilBackY  };

    this._drawGroundShadow(g, ofl, ofr);
    this._drawSideWall(g, ofl, ofr, obl, obr);
    this._drawFrontWall(g, ofl, ofr);

    // Rim, back to front so the near plank overlaps the side mitres.
    this._quad(g, WOOD_BACK,  [obl, obr, ibr, ibl]);
    this._quad(g, WOOD_SIDE,  [obl, ibl, ifl, ofl]);
    this._quad(g, WOOD_SIDE,  [obr, ibr, ifr, ofr]);
    this._quad(g, WOOD_FRONT, [ifl, ifr, ofr, ofl]);

    this._drawRimGrain(g, ofl, ofr, ifl, ifr);

    this._drawSoil(g, ifl, ifr, ibr, ibl);

    // Highlight along the rim's outer lip, where the timber catches the light.
    g.lineStyle(2, WOOD_EDGE, 0.55);
    g.strokePoints([obl, obr, ofr, ofl], true);
    g.lineStyle(2, WOOD_SEAM, 0.5);
    g.strokePoints([ibl, ibr, ifr, ifl], true);

    this._drawPlaque(g);
  }

  _drawGroundShadow(g, ofl, ofr) {
    const w = (ofr.x - ofl.x) * 1.06;
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(this.cx, ofl.y + WALL_H + 3, w, 22);
  }

  /**
   * The outer face on whichever side looks toward the vanishing point. A bed
   * to the right of it shows its left wall, and vice versa; a bed straddling
   * it shows neither. The wall's foot recedes with the ground, so it is
   * shorter at the back than at the front.
   */
  _drawSideWall(g, ofl, ofr, obl, obr) {
    let front, back;
    if (ofl.x > this.vpX) [front, back] = [ofl, obl];
    else if (ofr.x < this.vpX) [front, back] = [ofr, obr];
    else return;

    const backH = WALL_H * this.scaleAt(back.y);
    const face = [
      back,
      front,
      { x: front.x, y: front.y + WALL_H },
      { x: back.x,  y: back.y + backH },
    ];
    this._quad(g, mix(WOOD_WALL, WOOD_WALL_LO, 0.55), face);

    // A couple of board seams running back along the face.
    g.lineStyle(1.5, WOOD_SEAM, 0.4);
    for (const t of [1 / 3, 2 / 3]) {
      g.lineBetween(
        front.x, front.y + WALL_H * t,
        back.x,  back.y + backH * t,
      );
    }
    g.lineStyle(2, WOOD_SEAM, 0.7);
    g.strokePoints(face, true);
  }

  _drawFrontWall(g, ofl, ofr) {
    const yTop = ofl.y;
    const yBot = yTop + WALL_H;

    g.fillStyle(WOOD_WALL, 1);
    g.fillRect(ofl.x, yTop, ofr.x - ofl.x, WALL_H);

    // Boards run vertically; darken toward the base so the box reads as solid.
    g.fillStyle(WOOD_WALL_LO, 0.55);
    g.fillRect(ofl.x, yTop + WALL_H * 0.62, ofr.x - ofl.x, WALL_H * 0.38);

    const step = (ofr.x - ofl.x) / BOARDS;
    g.lineStyle(1.5, WOOD_SEAM, 0.45);
    for (let i = 1; i < BOARDS; i++) {
      const x = ofl.x + step * i;
      g.lineBetween(x, yTop + 2, x, yBot - 2);
    }

    // Corner posts.
    g.fillStyle(WOOD_BACK, 1);
    g.fillRect(ofl.x, yTop, POST_W, WALL_H);
    g.fillRect(ofr.x - POST_W, yTop, POST_W, WALL_H);

    g.lineStyle(2, WOOD_SEAM, 0.7);
    g.lineBetween(ofl.x, yBot, ofr.x, yBot);
  }

  _drawRimGrain(g, ofl, ofr, ifl, ifr) {
    // Plank seams across the front rim, spaced to match the front wall boards.
    const stepOuter = (ofr.x - ofl.x) / BOARDS;
    const stepInner = (ifr.x - ifl.x) / BOARDS;
    g.lineStyle(1.5, WOOD_SEAM, 0.32);
    for (let i = 1; i < BOARDS; i++) {
      g.lineBetween(ifl.x + stepInner * i, ifl.y, ofl.x + stepOuter * i, ofl.y);
    }
  }

  _drawSoil(g, ifl, ifr, ibr, ibl) {
    const perimeter = [ibl, ibr, ifr, ifl];

    // The pit first, then the soil surface inset slightly so a dark line
    // survives against the rim — reads as soil sitting below the timber.
    this._quad(g, SOIL_DEEP, perimeter);

    const inset = 3;
    this._quad(g, SOIL_BASE, [
      { x: ibl.x + inset, y: ibl.y + inset },
      { x: ibr.x - inset, y: ibr.y + inset },
      { x: ifr.x - inset, y: ifr.y - inset },
      { x: ifl.x + inset, y: ifl.y - inset },
    ]);

    this._drawPlotBeds(g);
    this._drawSpeckles(g);

    // Ambient occlusion under the rim: a few progressively tighter strokes
    // around the soil perimeter, darkest right against the timber.
    for (const [width, alpha] of [[12, 0.1], [8, 0.12], [4, 0.14]]) {
      g.lineStyle(width, SOIL_DEEP, alpha);
      g.strokePoints(perimeter, true);
    }
  }

  /**
   * Each plot is a mound of soil rather than a flat tile: a jittered base tone
   * that also darkens toward the back of the bed, a shadowed rear lip and a
   * sunlit front lip.
   */
  _drawPlotBeds(g) {
    for (const plot of this.plots) {
      const [backL, backR, frontR, frontL] = plot.points;
      // Seeded by the plot's place in its own bed, so every bed's soil matches.
      const rand = mulberry32(0x9e37 + (plot.index - this.plotOffset) * 2654435761);

      // Back rows read as further from the light, so shade them down.
      const depthShade = (1 - plot.pScale) * 1.5;
      const tone = mix(
        mix(SOIL_BASE, SOIL_LIGHT, rand()),
        SOIL_DEEP,
        Math.min(0.45, depthShade),
      );
      this._quad(g, tone, plot.points);

      // Damp patch, offset randomly so no two beds look alike.
      const wetW = (backR.x - backL.x) * (0.3 + rand() * 0.4);
      const wetY = backL.y + (frontL.y - backL.y) * (0.25 + rand() * 0.5);
      g.fillStyle(SOIL_WET, 0.16);
      g.fillEllipse(
        backL.x + (backR.x - backL.x) * (0.2 + rand() * 0.6),
        wetY,
        wetW,
        wetW * 0.45,
      );

      // Rear lip in shadow.
      const lip = 3 * plot.pScale;
      g.fillStyle(SOIL_DARK, 0.55);
      g.fillPoints(
        [backL, backR, { x: backR.x, y: backR.y + lip }, { x: backL.x, y: backL.y + lip }],
        true,
      );
      // Front lip catching the light.
      g.fillStyle(SOIL_DUST, 0.22);
      g.fillPoints(
        [
          { x: frontL.x, y: frontL.y - lip * 1.2 },
          { x: frontR.x, y: frontR.y - lip * 1.2 },
          frontR,
          frontL,
        ],
        true,
      );
      // Furrow shadow down the left side, so the rows read as raked.
      g.fillStyle(SOIL_DARK, 0.3);
      g.fillPoints(
        [backL, { x: backL.x + lip, y: backL.y }, { x: frontL.x + lip, y: frontL.y }, frontL],
        true,
      );
    }
  }

  /**
   * Grit, clods and stones over the soil. Positions come from a fixed seed so
   * the texture is stable across redraws, and every size follows the
   * perspective so the far rows stay finer-grained than the near ones.
   */
  _drawSpeckles(g) {
    const rand = mulberry32(0x5eed);

    // Distribute in reciprocal space so grains are evenly dense on the ground
    // plane rather than bunching toward the back.
    const back  = 1 / (this.soilBackY  - this.yVP);
    const front = 1 / (this.soilFrontY - this.yVP);
    const pick = () => {
      const y = this.yVP + 1 / (back + (front - back) * rand());
      return { y, s: this.scaleAt(y), x: this.soilX(rand(), y) };
    };

    // Fine grit.
    const grit = [SOIL_DARK, SOIL_DUST, SOIL_LIGHT, SOIL_DEEP];
    for (let i = 0; i < 520; i++) {
      const { x, y, s } = pick();
      const size = (0.6 + rand() * 1.4) * s;
      g.fillStyle(grit[(rand() * grit.length) | 0], 0.25 + rand() * 0.45);
      if (rand() < 0.4) g.fillCircle(x, y, size * 0.6);
      else g.fillRect(x, y, size, size * 0.85);
    }

    // Clods — bigger crumbs with a lit top edge and a cast shadow.
    for (let i = 0; i < 90; i++) {
      const { x, y, s } = pick();
      const r = (1.4 + rand() * 2) * s;
      g.fillStyle(SOIL_DARK, 0.5);
      g.fillEllipse(x, y + r * 0.5, r * 2.1, r * 1.1);
      g.fillStyle(mix(SOIL_LIGHT, SOIL_DUST, rand()), 0.75);
      g.fillEllipse(x, y, r * 2, r * 1.4);
      g.fillStyle(SOIL_DUST, 0.5);
      g.fillEllipse(x - r * 0.25, y - r * 0.3, r * 0.9, r * 0.5);
    }

    // The odd stone worked up out of the bed.
    for (let i = 0; i < 12; i++) {
      const { x, y, s } = pick();
      const r = (1.4 + rand() * 1.4) * s;
      g.fillStyle(SOIL_DEEP, 0.55);
      g.fillEllipse(x, y + r * 0.45, r * 2.2, r * 1.0);
      g.fillStyle(PEBBLE, 0.62);
      g.fillEllipse(x, y, r * 2, r * 1.3);
      g.fillStyle(PEBBLE_LIT, 0.45);
      g.fillEllipse(x - r * 0.3, y - r * 0.25, r * 0.8, r * 0.45);
    }
  }

  /** Hover and ripeness tints — cheap enough to redraw whenever a plot changes. */
  _drawDynamic() {
    const g = this.dynamicGfx;
    g.clear();

    for (const plot of this.plots) {
      if (plot.state === "ready") {
        g.fillStyle(READY_TINT, plot.hovered ? 0.3 : 0.17);
        g.fillPoints(plot.points, true);
        g.lineStyle(4, READY_TINT, 0.95);
        g.strokePoints(plot.points, true);
      } else if (plot.hovered) {
        g.fillStyle(0xffffff, 0.12);
        g.fillPoints(plot.points, true);
        g.lineStyle(2, 0xffe9b0, 0.6);
        g.strokePoints(plot.points, true);
      }
    }

    this.dynamicDirty = false;
  }

  _quad(g, color, points, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillPoints(points, true);
  }

  // ── Plot lifecycle ─────────────────────────────────────────────────

  /**
   * A ripe plot always announces itself; a growing one only shows its countdown
   * while hovered, which keeps 25 live timers from cluttering the bed.
   */
  _refreshLabel(plot) {
    const show =
      plot.state === "ready" ||
      plot.state === "harvesting" ||
      (plot.state === "growing" && plot.hovered);
    plot.label.setVisible(show).setColor(plot.state === "ready" ? "#ffe9a8" : "#fff6dd");
  }

  /**
   * The clock ripeness is measured against: wall time, nudged onto the
   * server's, because the server is what decides whether a harvest lands.
   * Using the scene's own timer instead would restart growth on every reload.
   */
  now() {
    return Date.now() + this.timeOffset;
  }

  /** This bed's plot for a farm-wide index, or undefined if it isn't ours. */
  _plotAt(index) {
    return this.plots[index - this.plotOffset];
  }

  /** Whether a farm-wide plot index falls in this bed. */
  owns(index) {
    return !!this._plotAt(index);
  }

  /**
   * Replaces the whole bed with the server's picture of it. Takes the whole
   * farm's plots — anything belonging to another bed is skipped.
   */
  load(plots = []) {
    for (const plot of this.plots) this._clear(plot);
    for (const { plotIndex, seedId, plantedAt } of plots) {
      this.plant(plotIndex, seedId, plantedAt);
    }
    // A plot that ripened while the player was away is promoted on the next
    // update() tick, which runs before the bed is ever drawn.
  }

  /**
   * Sows `seedId` into an empty plot, as of `plantedAt` (epoch ms, from the
   * server). No-op if the plot is already in use.
   */
  plant(index, seedId, plantedAt = this.now()) {
    const plot = this._plotAt(index);
    if (!plot || plot.state !== "empty") return false;

    const seed = getSeed(seedId);
    plot.state     = "growing";
    plot.seedId    = seed.id;
    plot.plantedAt = plantedAt;

    plot.hint.setVisible(false);
    plot.plant
      .setText(seed.sprout)
      .setVisible(true)
      .setAlpha(1)
      .setY(plot.frontY - 4)
      .setScale(0.42 * plot.pScale);
    plot.label.setText(`${Math.ceil(this.growMs / 1000)}s`);
    this._refreshLabel(plot);
    this.dynamicDirty = true;
    return true;
  }

  /**
   * A ripe plot was clicked. The plot is held in "harvesting" until the server
   * says whether the crop was banked — a second click can't claim it twice,
   * and a refused harvest goes back to being ripe.
   */
  _requestHarvest(plot) {
    if (plot.state !== "ready") return;
    plot.state = "harvesting";
    plot.readyTween?.stop();
    plot.readyTween = null;
    plot.plant.setScale(plot.pScale);
    plot.label.setText("...");
    this._refreshLabel(plot);
    this.dynamicDirty = true;
    this.onHarvest?.(plot.index);
  }

  /** The server banked the crop: pop the plant out and leave bare soil. */
  collect(index) {
    const plot = this._plotAt(index);
    if (!plot || plot.state !== "harvesting") return;

    const restY = plot.frontY - 4;
    this.scene.tweens.add({
      targets: plot.plant,
      y: restY - 30 * plot.pScale,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => {
        if (!plot.plant.scene) return;
        plot.plant.setVisible(false).setAlpha(1).setY(restY).setScale(plot.pScale);
      },
    });

    plot.state  = "empty";
    plot.seedId = null;
    plot.hint.setVisible(!this.locked);
    this._refreshLabel(plot);
    this.dynamicDirty = true;
  }

  /** The harvest was refused — hand the plant back to the plot. */
  cancelHarvest(index) {
    const plot = this._plotAt(index);
    if (!plot || plot.state !== "harvesting") return;
    this._setReady(plot);
  }

  /** Empties a plot outright, with no animation and no payout. */
  _clear(plot) {
    plot.readyTween?.stop();
    plot.readyTween = null;
    plot.state = "empty";
    plot.seedId = null;
    plot.plantedAt = 0;
    plot.plant.setVisible(false).setAlpha(1).setY(plot.frontY - 4).setScale(plot.pScale);
    plot.hint.setVisible(!this.locked);
    this._refreshLabel(plot);
    this.dynamicDirty = true;
  }

  /** Called every frame from the scene's update loop. */
  update() {
    const now = this.now();

    for (const plot of this.plots) {
      if (plot.state !== "growing") continue;

      const elapsed = now - plot.plantedAt;
      const t       = Math.min(1, elapsed / this.growMs);

      if (t < 1) {
        // Sprout at 42% size, swap to the grown emoji halfway through, and
        // reach full (perspective-corrected) size as the timer runs out.
        const seed = getSeed(plot.seedId);
        plot.plant.setText(t < 0.5 ? seed.sprout : seed.icon);
        plot.plant.setScale((0.42 + t * 0.58) * plot.pScale);
        if (plot.hovered) plot.label.setText(`${Math.ceil((this.growMs - elapsed) / 1000)}s`);
      } else {
        this._setReady(plot);
      }
    }

    if (this.dynamicDirty) this._drawDynamic();
  }

  _setReady(plot) {
    const seed = getSeed(plot.seedId);
    plot.state = "ready";
    plot.plant.setText(seed.icon).setScale(plot.pScale);
    plot.label.setText("Ready!");
    this._refreshLabel(plot);
    this.dynamicDirty = true;

    plot.readyTween = this.scene.tweens.add({
      targets: plot.plant,
      scale: { from: plot.pScale, to: plot.pScale * 1.12 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  destroy() {
    for (const plot of this.plots) plot.readyTween?.stop();
    for (const obj of this.objects) obj.destroy();
    this.plots = [];
    this.objects = [];
  }
}
