import Phaser from "phaser";
import { bakeGraphics } from "./bakeGraphics";

/**
 * A fruit tree for the Farm map.
 *
 * The tree is generated rather than drawn by hand: a recursive branch system
 * produces tapered limbs that are shaded as cylinders, and the foliage is built
 * from the resulting twig tips as layered clusters (shadow, body, sunlit face,
 * highlight) so the canopy reads as volume rather than a flat blob. Everything
 * comes from a fixed seed, so the tree looks the same every visit.
 *
 * Clicking the canopy plants a fruit into the nearest free slot; each fruit
 * blossoms, ripens over a minute, and can then be picked for coins or XP.
 *
 * FRONT END ONLY — fruit state lives here and dies with the scene, exactly like
 * PlanterSystem. See App.jsx for where the payouts land.
 */

/** How long a fruit takes to ripen. Matches the planter's beds. */
export const FRUIT_GROW_MS = 60_000;

/**
 * Most fruit the tree will carry at once. Fewer are used if the crown can't
 * spread them far enough apart — see FRUIT_MIN_GAP.
 */
export const FRUIT_SLOTS = 10;

/**
 * Fruit catalogue. Sweet fruit sells for coins; the rarer ones are studied for
 * XP instead, mirroring how the planter splits its seeds.
 */
export const FRUITS = [
  { id: "apple",  name: "Apple",    blossom: "🌸", icon: "🍎", reward: { type: "coins", amount: 400 } },
  { id: "orange", name: "Orange",   blossom: "🌸", icon: "🍊", reward: { type: "coins", amount: 600 } },
  { id: "cherry", name: "Cherries", blossom: "🌸", icon: "🍒", reward: { type: "coins", amount: 900 } },
  { id: "pear",   name: "Pear",     blossom: "🌼", icon: "🍐", reward: { type: "xp",    amount: 150 } },
  { id: "peach",  name: "Peach",    blossom: "🌼", icon: "🍑", reward: { type: "xp",    amount: 300 } },
];

export function getFruit(fruitId) {
  return FRUITS.find((f) => f.id === fruitId) || FRUITS[0];
}

// ── Growth model ─────────────────────────────────────────────────────
const MAX_DEPTH   = 6;
const LEN_FALLOFF = 0.82;
const WIDTH_FALLOFF = 0.72;
const MIN_WIDTH   = 2.4;
// Limbs are kept inside a cone around vertical, and the outer ones bend back
// toward the light. Without both, compounding random spread walks the crown off
// to one side and leaves the trunk standing beside its own canopy.
const TILT_LIMIT  = 1.12;
const PHOTOTROPY  = 0.22;

const UP = -Math.PI / 2;

/** Soft-limits a branch angle to the cone around vertical. */
function limitTilt(angle) {
  const d = angle - UP;
  if (Math.abs(d) <= TILT_LIMIT) return angle;
  return UP + Math.sign(d) * (TILT_LIMIT + (Math.abs(d) - TILT_LIMIT) * 0.22);
}

// ── Palette ──────────────────────────────────────────────────────────
const BARK_MID  = 0x6d5039;
const BARK_LIT  = 0x9a785a;
const BARK_DARK = 0x3a281a;
const BARK_LINE = 0x2b1c11;

const LEAF_SHADE = 0x24491f;
const LEAF_BODY  = 0x356b2b;
const LEAF_SUN   = 0x54993d;
const LEAF_HI    = 0x7fc255;

const FRUIT_PX  = 40;             // font size of a ripe fruit
const FRUIT_HIT = FRUIT_PX + 14;  // diameter of a fruit's click target
// Slots must never sit closer than one hit target apart, or two fruits overlap
// and a click between them is a coin toss.
const FRUIT_MIN_GAP = FRUIT_HIT;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default class TreeSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}   opts
   * @param {number}   opts.x            world x of the trunk's base
   * @param {number}   opts.baseY        world y of the ground at the trunk
   * @param {number}   opts.trunkLength  length of the first trunk segment; sets overall size
   * @param {number}   opts.seed         changes the tree's shape
   * @param {Function} opts.onTreeClick  (slotIndex, screenPos) => void — canopy tapped with room to spare
   * @param {Function} opts.onFull       () => void — canopy tapped with every slot taken
   * @param {Function} opts.onHarvest    (reward, slot) => void — ripe fruit picked
   */
  constructor(scene, {
    x, baseY, trunkLength = 150, seed = 0xb0115,
    onTreeClick, onFull, onHarvest,
  }) {
    this.scene       = scene;
    this.x           = x;
    this.baseY       = baseY;
    this.onTreeClick = onTreeClick;
    this.onFull      = onFull;
    this.onHarvest   = onHarvest;
    this.objects     = [];
    this.slots       = [];

    // Sorts against players by the trunk's base, like every other world object.
    this.baseDepth = baseY;

    const rand = mulberry32(seed);
    this.segments = [];
    this.tips     = [];
    this._grow(rand, x, baseY, UP, trunkLength, 58, 0);

    this.clusters = this._buildClusters(rand);
    this._bakeArt();
    this._buildSlots(rand);
    this._buildTreeZones();
  }

  _track(obj) {
    this.objects.push(obj);
    return obj;
  }

  // ── Branch generation ──────────────────────────────────────────────

  /**
   * Recursively grows one limb and its children. The trunk runs straight for
   * its first segment, forks in two, then branches two or three ways, which
   * gives a clear bole under a spreading crown rather than a shrub.
   */
  _grow(rand, x, y, angle, len, width, depth) {
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;

    this.segments.push({ x, y, x2, y2, w1: width, w2: width * WIDTH_FALLOFF, angle, depth });

    if (depth >= MAX_DEPTH || width * WIDTH_FALLOFF < MIN_WIDTH) {
      this.tips.push({ x: x2, y: y2, depth });
      return;
    }

    const children = depth === 0 ? 1 : depth === 1 ? 3 : rand() < 0.34 ? 3 : 2;
    const spread   = depth === 0 ? 0.1 : depth === 1 ? 0.62 : 0.66;
    // The main fork is symmetric; wander only creeps in further out, so the
    // tree stays balanced overall while still looking hand-grown.
    const wander   = depth <= 1 ? 0.06 : 0.26;

    for (let i = 0; i < children; i++) {
      const offset = children === 1 ? (rand() - 0.5) * 0.2 : (i - (children - 1) / 2) * spread;
      let childAngle = angle + offset + (rand() - 0.5) * wander;
      // Outer limbs turn back up toward the light, which rounds the crown.
      if (depth >= 3) childAngle += (UP - childAngle) * PHOTOTROPY;

      this._grow(
        rand,
        x2, y2,
        limitTilt(childAngle),
        len * LEN_FALLOFF * (0.9 + rand() * 0.2),
        width * WIDTH_FALLOFF,
        depth + 1,
      );
    }
  }

  /**
   * Foliage clusters. Twig tips carry the big outer masses; the outer branch
   * segments also carry smaller ones, otherwise the crown is a hollow ring of
   * leaves with bare limbs showing through the middle.
   */
  _buildClusters(rand) {
    const clusters = this.tips.map((t) => ({
      x: t.x + (rand() - 0.5) * 20,
      y: t.y + (rand() - 0.5) * 20 - 6,
      r: 36 + rand() * 22,
      seed: (rand() * 0xffffff) | 0,
    }));

    for (const seg of this.segments) {
      if (seg.depth < MAX_DEPTH - 2) continue;
      clusters.push({
        x: (seg.x + seg.x2) / 2 + (rand() - 0.5) * 18,
        y: (seg.y + seg.y2) / 2 + (rand() - 0.5) * 18,
        r: 24 + rand() * 16,
        seed: (rand() * 0xffffff) | 0,
      });
    }
    return clusters;
  }

  // ── Painting ───────────────────────────────────────────────────────

  /**
   * The tree is three baked layers so branches read as passing through the
   * crown: foliage behind, then the limbs, then foliage in front.
   */
  _bakeArt() {
    const bounds = this._artBounds();

    this.backLeaves = this._track(
      bakeGraphics(this.scene, (g) => {
        this._drawGroundShadow(g);
        this._drawFoliage(g, 0);
      }, bounds, this.baseDepth - 0.3),
    );

    this.branchArt = this._track(
      bakeGraphics(this.scene, (g) => this._drawBranches(g), bounds, this.baseDepth - 0.2),
    );

    this.frontLeaves = this._track(
      bakeGraphics(this.scene, (g) => this._drawFoliage(g, 1), bounds, this.baseDepth - 0.1),
    );
  }

  /** World rectangle covering trunk, crown and ground shadow, plus margin. */
  _artBounds() {
    let minX = this.x, maxX = this.x, minY = this.baseY, maxY = this.baseY;
    for (const c of this.clusters) {
      minX = Math.min(minX, c.x - c.r * 1.9 - 30);
      maxX = Math.max(maxX, c.x + c.r * 1.9 + 30);
      minY = Math.min(minY, c.y - c.r * 1.9 - 30);
      maxY = Math.max(maxY, c.y + c.r * 1.9 + 30);
    }
    for (const s of this.segments) {
      minX = Math.min(minX, s.x - s.w1, s.x2 - s.w1);
      maxX = Math.max(maxX, s.x + s.w1, s.x2 + s.w1);
      minY = Math.min(minY, s.y, s.y2);
    }
    const margin = 40;
    minX -= margin + 90; // root flare and ground shadow reach past the trunk
    maxX += margin + 90;
    minY -= margin;
    maxY += margin + 40;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  _drawGroundShadow(g) {
    let spread = 0;
    for (const c of this.clusters) spread = Math.max(spread, Math.abs(c.x - this.x) + c.r);
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(this.x + spread * 0.12, this.baseY + 8, spread * 1.7, 74);
    g.fillStyle(0x000000, 0.13);
    g.fillEllipse(this.x, this.baseY + 4, spread * 0.9, 48);
  }

  _drawBranches(g) {
    this._drawRoots(g);

    // Thickest first so thin twigs overlay cleanly at the joins.
    const ordered = [...this.segments].sort((a, b) => b.w1 - a.w1);
    for (const s of ordered) this._drawLimb(g, s);

    this._drawBark(g);
  }

  /**
   * Root flare. The trunk widens as it meets the ground and a few roots break
   * the surface, which is what stops a drawn tree looking like a pole stuck in
   * the grass.
   */
  _drawRoots(g) {
    const rand = mulberry32(0x1200d);
    const w = this.segments[0].w1;
    const flareTop = this.baseY - w * 2.2;

    // A little disturbed earth where the roots break the turf.
    g.fillStyle(0x4c3a22, 0.85);
    g.fillEllipse(this.x, this.baseY + 3, w * 2.7, w * 0.6);

    // Individual roots, alternating sides so the flare stays balanced.
    for (let i = 0; i < 8; i++) {
      const dir  = i % 2 ? 1 : -1;
      const reach = w * (0.7 + rand() * 0.9) * dir;
      const rise  = w * (0.4 + rand() * 1.1);
      g.fillStyle(i % 3 === 0 ? BARK_DARK : BARK_MID, 1);
      g.fillPoints([
        { x: this.x + reach * 0.1, y: this.baseY - rise * 1.6 },
        { x: this.x + reach,       y: this.baseY - rise * 0.1 },
        { x: this.x + reach * 1.2, y: this.baseY + 6 },
        { x: this.x - reach * 0.1, y: this.baseY + 6 },
      ], true);
    }

    // The flare itself: trunk width at the top, splayed at the ground.
    g.fillStyle(BARK_MID, 1);
    g.fillPoints([
      { x: this.x - w * 0.5, y: flareTop },
      { x: this.x + w * 0.5, y: flareTop },
      { x: this.x + w * 1.15, y: this.baseY + 4 },
      { x: this.x - w * 1.15, y: this.baseY + 4 },
    ], true);
    g.fillStyle(BARK_LIT, 0.4);
    g.fillPoints([
      { x: this.x - w * 0.5,  y: flareTop },
      { x: this.x - w * 0.14, y: flareTop },
      { x: this.x - w * 0.4,  y: this.baseY + 4 },
      { x: this.x - w * 1.15, y: this.baseY + 4 },
    ], true);
    g.fillStyle(BARK_DARK, 0.45);
    g.fillPoints([
      { x: this.x + w * 0.2,  y: flareTop },
      { x: this.x + w * 0.5,  y: flareTop },
      { x: this.x + w * 1.15, y: this.baseY + 4 },
      { x: this.x + w * 0.55, y: this.baseY + 4 },
    ], true);
  }

  /**
   * One tapered limb, shaded as a cylinder: a mid-tone body, a lit strip on the
   * side facing the light and a shadowed strip opposite. The strips are cut in
   * the limb's own frame, so the shading follows each branch's direction.
   */
  _drawLimb(g, { x, y, x2, y2, w1, w2, angle }) {
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    const strip = (from, to, color, alpha) => {
      g.fillStyle(color, alpha);
      g.fillPoints([
        { x: x  + nx * w1 * from, y: y  + ny * w1 * from },
        { x: x2 + nx * w2 * from, y: y2 + ny * w2 * from },
        { x: x2 + nx * w2 * to,   y: y2 + ny * w2 * to },
        { x: x  + nx * w1 * to,   y: y  + ny * w1 * to },
      ], true);
    };

    strip(-0.5, 0.5, BARK_MID, 1);
    strip(-0.5, -0.14, BARK_LIT, 0.5);
    strip(0.2, 0.5, BARK_DARK, 0.55);

    // Round the join so limbs don't show a hard mitre where they meet.
    g.fillStyle(BARK_MID, 1);
    g.fillCircle(x2, y2, w2 * 0.5);
  }

  /** Vertical bark fissures, only on limbs thick enough to show them. */
  _drawBark(g) {
    const rand = mulberry32(0x8a2b);
    for (const s of this.segments) {
      if (s.w1 < 12) continue;
      const nx = -Math.sin(s.angle);
      const ny = Math.cos(s.angle);
      const lines = Math.round(s.w1 / 4);
      for (let i = 0; i < lines; i++) {
        const off = (rand() - 0.5) * 0.72;
        const t0  = rand() * 0.6;
        const t1  = t0 + 0.2 + rand() * 0.4;
        g.lineStyle(1 + rand() * 1.6, BARK_LINE, 0.16 + rand() * 0.24);
        g.lineBetween(
          x_(s, t0) + nx * s.w1 * off, y_(s, t0) + ny * s.w1 * off,
          x_(s, t1) + nx * s.w1 * off, y_(s, t1) + ny * s.w1 * off,
        );
      }
    }
  }

  /**
   * Foliage clusters. `layer` 0 sits behind the branches and 1 in front, split
   * by each cluster's own seed so the crown interleaves with the limbs.
   *
   * Every cluster is drawn four times from the same random sequence — shadow,
   * body, sunlit face, highlight — each offset toward the light and shrunk, so
   * the leaf masses turn rather than looking like flat stamps.
   */
  _drawFoliage(g, layer) {
    for (const c of this.clusters) {
      if ((c.seed & 1) !== layer) continue;

      const k = c.r / 46; // offsets scale with the cluster, so small ones read too
      this._blob(g, c, LEAF_SHADE, 1,    10 * k,  16 * k, 1.06);
      this._blob(g, c, LEAF_BODY,  1,     0,       0,     0.98);
      this._blob(g, c, LEAF_SUN,   0.95, -13 * k, -18 * k, 0.66);
      this._blob(g, c, LEAF_HI,    0.8,  -22 * k, -29 * k, 0.34);
    }
    this._drawEdgeLeaves(g, layer);
  }

  _blob(g, cluster, color, alpha, dx, dy, scale) {
    const rand = mulberry32(cluster.seed);
    g.fillStyle(color, alpha);
    for (let i = 0; i < 13; i++) {
      const a = rand() * Math.PI * 2;
      const d = cluster.r * Math.sqrt(rand()) * 0.85;
      const r = cluster.r * (0.3 + rand() * 0.34) * scale;
      g.fillCircle(cluster.x + Math.cos(a) * d + dx, cluster.y + Math.sin(a) * d + dy, r);
    }
  }

  /** Individual leaves breaking the crown's outline so it isn't a bubble edge. */
  _drawEdgeLeaves(g, layer) {
    const rand = mulberry32(0x1eaf + layer);
    for (const c of this.clusters) {
      if ((c.seed & 1) !== layer) continue;
      const count = 3 + ((rand() * 3) | 0);
      for (let i = 0; i < count; i++) {
        const a  = rand() * Math.PI * 2;
        const d  = c.r * (0.8 + rand() * 0.35);
        const lx = c.x + Math.cos(a) * d;
        const ly = c.y + Math.sin(a) * d;
        const len = 9 + rand() * 9;
        const wid = len * 0.42;
        const rot = a + (rand() - 0.5) * 1.2;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        // Lens-shaped leaf: tip, two shoulders, tail.
        g.fillStyle(rand() < 0.45 ? LEAF_SUN : LEAF_BODY, 0.95);
        g.fillPoints([
          { x: lx + cos * len,             y: ly + sin * len },
          { x: lx - sin * wid,             y: ly + cos * wid },
          { x: lx - cos * len * 0.5,       y: ly - sin * len * 0.5 },
          { x: lx + sin * wid,             y: ly - cos * wid },
        ], true);
      }
    }
  }

  // ── Fruit slots ────────────────────────────────────────────────────

  /** Picks well-separated hanging points among the outermost twigs. */
  _buildSlots(rand) {
    const candidates = this.tips
      .filter((t) => t.depth >= MAX_DEPTH - 1)
      .map((t) => ({ x: t.x, y: t.y + 10, k: rand() }))
      .sort((a, b) => a.k - b.k);

    // Spread fruit as widely as the crown allows, relaxing the spacing until
    // the tree is full. The ladder stops at FRUIT_MIN_GAP rather than zero, so
    // a crowded crown yields fewer slots instead of overlapping ones.
    const chosen = [];
    for (const minGap of [120, 96, 76, FRUIT_MIN_GAP]) {
      for (const c of candidates) {
        if (chosen.length >= FRUIT_SLOTS) break;
        if (chosen.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < minGap)) continue;
        chosen.push(c);
      }
      if (chosen.length >= FRUIT_SLOTS) break;
    }

    const scene = this.scene;
    this.slots = chosen.slice(0, FRUIT_SLOTS).map((pos, index) => {
      const zone = scene.add.zone(pos.x, pos.y, FRUIT_HIT, FRUIT_HIT);
      zone.setInteractive(
        new Phaser.Geom.Circle(FRUIT_HIT / 2, FRUIT_HIT / 2, FRUIT_HIT / 2),
        Phaser.Geom.Circle.Contains,
      );
      zone.input.cursor = "pointer";
      zone.setDepth(this.baseDepth + 0.3);
      // An empty slot must not swallow the click — it should fall through to
      // the canopy so the picker opens.
      zone.disableInteractive();

      const sprite = scene.add
        .text(pos.x, pos.y, "", { fontSize: `${FRUIT_PX}px` })
        .setOrigin(0.5)
        .setDepth(this.baseDepth + 0.3)
        .setVisible(false);

      const label = scene.add
        .text(pos.x, pos.y - FRUIT_PX * 0.75, "", {
          fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
          fontSize: "18px",
          color: "#fff6dd",
        })
        .setOrigin(0.5, 1)
        .setStroke("#1d2a12", 4)
        .setDepth(this.baseDepth + 0.4)
        .setVisible(false);

      const slot = {
        index, x: pos.x, y: pos.y,
        state: "empty", // "empty" | "growing" | "ready"
        fruitId: null,
        plantedAt: 0,
        hovered: false,
        zone, sprite, label,
        readyTween: null,
      };

      zone.on("pointerover", () => { slot.hovered = true;  this._refreshLabel(slot); });
      zone.on("pointerout",  () => { slot.hovered = false; this._refreshLabel(slot); });
      zone.on("pointerdown", (pointer) => {
        if (pointer.button !== 0) return;
        if (slot.state === "ready") this._harvest(slot);
      });

      this._track(zone);
      this._track(sprite);
      this._track(label);
      return slot;
    });
  }

  /** Canopy and trunk both open the picker. */
  _buildTreeZones() {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of this.clusters) {
      minX = Math.min(minX, c.x - c.r); maxX = Math.max(maxX, c.x + c.r);
      minY = Math.min(minY, c.y - c.r); maxY = Math.max(maxY, c.y + c.r);
    }

    const cw = maxX - minX, ch = maxY - minY;
    const canopy = this.scene.add.zone(minX + cw / 2, minY + ch / 2, cw, ch);
    canopy.setInteractive(
      new Phaser.Geom.Ellipse(cw / 2, ch / 2, cw, ch),
      Phaser.Geom.Ellipse.Contains,
    );

    const trunk = this.segments[0];
    const th = this.baseY - Math.min(trunk.y2, this.baseY - 40);
    const bole = this.scene.add.zone(this.x, this.baseY - th / 2, trunk.w1 * 2.2, th);

    bole.setInteractive(); // default rectangular hit area from its size

    for (const zone of [canopy, bole]) {
      zone.setDepth(this.baseDepth - 0.25); // under the fruit zones, so a ripe
      zone.input.cursor = "pointer";        // fruit wins the click over the crown
      zone.on("pointerdown", (pointer) => {
        if (pointer.button !== 0) return;
        this._openPicker(pointer);
      });
      this._track(zone);
    }
  }

  _openPicker(pointer) {
    // Phaser resolves overlapping hit areas from the camera's render list,
    // which is built during the *previous* frame's render. Rather than trust
    // that ordering for something the player will notice, check ripe fruit
    // here as well: _harvest() no-ops if the fruit's own zone already took the
    // click, so it is safe whichever one arrives first.
    const ripe = this.slots.find(
      (s) => s.state === "ready" &&
        Math.hypot(s.x - pointer.worldX, s.y - pointer.worldY) <= FRUIT_HIT / 2,
    );
    if (ripe) {
      this._harvest(ripe);
      return;
    }

    const free = this.slots.filter((s) => s.state === "empty");
    if (free.length === 0) {
      this.onFull?.();
      return;
    }
    // Plant where the player pointed, as far as the tree allows.
    let best = free[0];
    let bestD = Infinity;
    for (const s of free) {
      const d = Math.hypot(s.x - pointer.worldX, s.y - pointer.worldY);
      if (d < bestD) { bestD = d; best = s; }
    }
    this.onTreeClick?.(best.index, {
      clientX: pointer.event.clientX,
      clientY: pointer.event.clientY,
    });
  }

  // ── Fruit lifecycle ────────────────────────────────────────────────

  _refreshLabel(slot) {
    const show = slot.state === "ready" || (slot.state === "growing" && slot.hovered);
    slot.label.setVisible(show).setColor(slot.state === "ready" ? "#ffe9a8" : "#fff6dd");
  }

  /** Sets a fruit growing in an empty slot. */
  plantFruit(index, fruitId) {
    const slot = this.slots[index];
    if (!slot || slot.state !== "empty") return false;

    const fruit = getFruit(fruitId);
    slot.state     = "growing";
    slot.fruitId   = fruit.id;
    slot.plantedAt = this.scene.time.now;

    slot.sprite
      .setText(fruit.blossom)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.4)
      .setY(slot.y);
    slot.label.setText(`${Math.ceil(FRUIT_GROW_MS / 1000)}s`);
    slot.zone.setInteractive();
    slot.zone.input.cursor = "pointer";
    this._refreshLabel(slot);
    return true;
  }

  _harvest(slot) {
    if (slot.state !== "ready") return;

    slot.readyTween?.stop();
    slot.readyTween = null;

    // Fruit drops off the branch rather than vanishing.
    this.scene.tweens.add({
      targets: slot.sprite,
      y: slot.y + 70,
      alpha: 0,
      duration: 420,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (!slot.sprite.scene) return;
        slot.sprite.setVisible(false).setAlpha(1).setY(slot.y).setScale(1);
      },
    });

    const reward = getFruit(slot.fruitId).reward;

    slot.state   = "empty";
    slot.fruitId = null;
    slot.hovered = false;
    slot.zone.disableInteractive();
    this._refreshLabel(slot);

    this.onHarvest?.(reward, slot);
  }

  /** Called every frame from the scene's update loop. */
  update() {
    const now = this.scene.time.now;

    for (const slot of this.slots) {
      if (slot.state !== "growing") continue;

      const elapsed = now - slot.plantedAt;
      const t = Math.min(1, elapsed / FRUIT_GROW_MS);

      if (t < 1) {
        // Blossom first, then set fruit at the third mark and swell to full.
        const fruit = getFruit(slot.fruitId);
        slot.sprite.setText(t < 0.35 ? fruit.blossom : fruit.icon);
        slot.sprite.setScale(t < 0.35 ? 0.4 + t * 0.5 : 0.42 + t * 0.58);
        if (slot.hovered) {
          slot.label.setText(`${Math.ceil((FRUIT_GROW_MS - elapsed) / 1000)}s`);
        }
      } else {
        this._setReady(slot);
      }
    }
  }

  _setReady(slot) {
    const fruit = getFruit(slot.fruitId);
    slot.state = "ready";
    slot.sprite.setText(fruit.icon).setScale(1);
    slot.label.setText("Pick!");
    this._refreshLabel(slot);

    // A ripe fruit hangs heavy and sways.
    slot.readyTween = this.scene.tweens.add({
      targets: slot.sprite,
      y: { from: slot.y, to: slot.y + 5 },
      scale: { from: 1, to: 1.1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  destroy() {
    for (const slot of this.slots) slot.readyTween?.stop();
    for (const obj of this.objects) obj.destroy();
    this.slots = [];
    this.objects = [];
  }
}

// Point along a segment, used by the bark fissures.
function x_(s, t) { return s.x + (s.x2 - s.x) * t; }
function y_(s, t) { return s.y + (s.y2 - s.y) * t; }
