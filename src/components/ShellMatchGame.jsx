import { useCallback, useEffect, useRef, useState } from "react";
import * as S from "./ShellMatchGame.styles";

/**
 * A standalone match-3 puzzle (Candy Crush style) opened from the Beach's
 * shell decoration.
 *
 * There's no "score" — instead, breaking shells fills a shared nectar bar
 * with 4 checkpoints, each paying out real Nectar (via `onNectarEarned`,
 * wired to the player's coin balance in Game.jsx) the moment it's crossed.
 * Combos (a drop that connects again) fill the bar faster, same as the old
 * score multiplier did. The player gets a flat budget of moves to work with
 * — filling the whole bar is meant to take real cascade play, not just be a
 * given.
 *
 * Three difficulties reuse this exact board/bar/moves engine. The checkpoints
 * sit at the same four places on the bar whatever the difficulty — what
 * changes is what they pay (the first three are a trickle, the last one is the
 * prize: 100/100/100/500 on easy up to 500/500/500/2500 on hard) and which
 * special tiles get seeded onto the board:
 *  - easy:   plain shells only.
 *  - medium: some board SLOTS are cracked — whichever shell currently sits
 *            there breaks normally, but that first break on the slot pays no
 *            fill; the slot is free for good after that one hit. The crack
 *            belongs to the cell, not to any one shell — a shell just
 *            passing through it on its way down doesn't wear it down, only
 *            actually matching there does.
 *  - hard:   cracked slots return, plus a few rocks that can never be
 *            broken, swapped, or moved — a fixed obstacle carved out of the
 *            grid, rendered as a solid black tile.
 *
 * Input works two ways, and both end up in the same attemptSwap: tap a shell
 * and then tap a neighbour, or drag a shell onto the neighbour directly. A
 * drag reads from where it started (the tile takes pointer capture) rather
 * than from whatever is under the pointer, commits to one axis as soon as it's
 * clearly a drag at all, and fires the swap well before the shell has been
 * pulled a full cell. A press that never moves is still a tap, so the
 * click-only interaction is untouched.
 *
 * Board model: the grid is actually TOTAL_ROWS tall (a hidden BUFFER_ROWS-tall
 * "reserve board" stacked above the VISIBLE_ROWS-tall playable one), clipped
 * by the Grid container's `overflow: hidden` so only the bottom VISIBLE_ROWS
 * are ever shown. Matching, clicking, and rocks/cracked-slots only ever touch
 * the visible band. Gravity, though, runs over the FULL height uniformly —
 * the same per-column compaction that shifts a survivor down into a cleared
 * gap also shifts the whole reserve stack above it down by exactly as much,
 * and any brand-new tile is created way up at the top of the reserve rather
 * than at the point it's needed. That means a shell crossing into view was
 * already sitting there, already moving, well before the player ever sees
 * it — there's no "spawn it right where it's needed" moment to fake a drop
 * for, because the real gravity simulation already extends off the top of
 * the screen. Reserve tiles need no interaction wiring (no click handler,
 * no burst/chip/selection), since they can never be part of a match — they
 * only start behaving like ordinary board tiles once they cross the line
 * into the visible band.
 *
 * The exception is a segment enclosed below a rock (hard mode only): with a
 * rock blocking the column, nothing above the rock ever reaches the reserve,
 * so a fresh tile there still has to be created on the spot. That rare case
 * keeps the old small-capped-drop + fade-in treatment as a fallback.
 *
 * Board state is a flat TOTAL_ROWS*COLS array (row-major). Each occupied
 * cell holds `{ id, color, locked? }` — `id` is stable across gravity/
 * refills so React can key each tile on it and let CSS transitions animate
 * the move for free when a tile's row/col (and therefore its rendered
 * position) changes.
 */

const COLS = 6;
const VISIBLE_ROWS = 6;
// The hidden reserve board "above" the playable one, same size per the brief.
const BUFFER_ROWS = 6;
const TOTAL_ROWS = VISIBLE_ROWS + BUFFER_ROWS;

const CELL = 68;
const GAP = 6;
// Centre-to-centre distance between neighbouring cells — one cell of travel.
const STEP_PX = CELL + GAP;
// How far a pointer has to move before the press stops being a tap and
// becomes a drag that's committed to an axis.
const DRAG_SLOP_PX = 5;
// How far a shell has to be pulled toward a neighbour before the two swap.
// Well under a full cell, so a flick is enough and nobody has to haul a shell
// all the way into the next slot for it to count.
const DRAG_COMMIT_PX = STEP_PX * 0.38;
export const BOARD_PX = COLS * CELL + (COLS - 1) * GAP;
const BOARD_HEIGHT_PX = VISIBLE_ROWS * CELL + (VISIBLE_ROWS - 1) * GAP;

const COLORS = [
  { id: "coral", filter: "none" },
  { id: "pink", filter: "hue-rotate(300deg) saturate(1.5)" },
  { id: "aqua", filter: "hue-rotate(150deg) saturate(1.6) brightness(1.08)" },
  { id: "lime", filter: "hue-rotate(70deg) saturate(1.4)" },
  { id: "violet", filter: "hue-rotate(220deg) saturate(1.6)" },
];
const COLOR_FILTER = Object.fromEntries(COLORS.map((c) => [c.id, c.filter]));

const SWAP_MS = 200;
// Keep in step with CLEAR_ANIM_MS in ShellMatchGame.styles.js — that drives
// the burst/chip flash, this drives when state actually moves on. Kept
// short so a chain of cascades doesn't feel like it's waiting around —
// each round of a combo should trigger snappily, not lag.
const CLEAR_MS = 220;
// Column-by-column stagger for the fall — left column starts immediately,
// each one after it starts a bit later, like a wave sweeping across the
// board rather than every column dropping in lockstep. Tight enough that
// the wave reads without dragging the whole cascade out.
const COLUMN_DELAY_MS = 26;
// A fall is timed like a real one: duration grows with the square root of the
// distance, the way it does under constant acceleration. A shell dropping six
// rows takes ~2.4x as long as one dropping a single row, instead of every
// tile sharing one flat duration — which is what makes a board slide as a
// rigid sheet rather than read as a stack of things falling.
const FALL_BASE_MS = 115;
// Time held after the last tile has landed, so its squash finishes playing
// before the next cascade round starts clearing on top of it.
const FALL_SETTLE_MS = 150;
// Matches the popIn keyframe's duration in ShellMatchGame.styles.js. A round
// whose only new tile is a locally spawned one (the enclosed-below-a-rock
// fallback) may have nothing actually falling, and must still hold long
// enough for that fade to finish.
const POP_IN_MS = 260;
const fallDurationFor = (rows) => (rows > 0 ? Math.round(FALL_BASE_MS * Math.sqrt(rows)) : 0);

const TOTAL_MOVES = 50;
const FILL_PER_TILE = 10;

// Four checkpoints at escalating distances (not just escalating rewards) — the
// fill needed per segment grows even as the moves budget stays flat, so the
// last one is the long haul. Where the marks sit is the same on every
// difficulty; only what they pay changes, so a harder board is worth playing
// for the money rather than for a shorter bar.
const CHECKPOINT_THRESHOLDS = [500, 1100, 1800, 2800];
const BAR_TOTAL = CHECKPOINT_THRESHOLDS[CHECKPOINT_THRESHOLDS.length - 1];
const checkpointsFor = (rewards) =>
  CHECKPOINT_THRESHOLDS.map((threshold, i) => ({ threshold, reward: rewards[i] }));

const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "Easy",
    accent: "#4fb477",
    blurb: "Plain shells only — every match counts straight away.",
    crackedSlotCount: 0,
    lockedCount: 0,
    checkpoints: checkpointsFor([100, 100, 100, 500]),
  },
  medium: {
    key: "medium",
    label: "Medium",
    accent: "#e0a13a",
    blurb: "A few board slots are cracked — the first shell broken there doesn't count, then the slot's free for good.",
    crackedSlotCount: 6,
    lockedCount: 0,
    checkpoints: checkpointsFor([300, 300, 300, 1500]),
  },
  hard: {
    key: "hard",
    label: "Hard",
    accent: "#d9534f",
    blurb: "Cracked slots return, plus a handful of solid rocks that can never be broken or moved.",
    crackedSlotCount: 5,
    lockedCount: 5,
    checkpoints: checkpointsFor([500, 500, 500, 2500]),
  },
};

// One word per shatter, escalating with the combo: a drop that connects again
// moves one further along, and the last word holds for anything beyond it.
const PRAISE_WORDS = ["Nice", "Good", "Great", "Amazing", "Incredible", "Insane"];

let tileSeq = 0;
const nextTileId = () => ++tileSeq;
let praiseSeq = 0;
// A fresh id per shatter is what restarts the pop animation — same word twice
// in a row still has to play twice.
const nextPraiseId = () => ++praiseSeq;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const randomColorId = () => COLORS[(Math.random() * COLORS.length) | 0].id;

/** Full-grid index of a cell in the visible band, given a row local to it
 * (0 = top of the playable board). */
function visIndex(localRow, col) {
  return (localRow + BUFFER_ROWS) * COLS + col;
}

function isAdjacent(a, b) {
  const ra = (a / COLS) | 0, ca = a % COLS;
  const rb = (b / COLS) | 0, cb = b % COLS;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

function swapCells(grid, a, b) {
  const next = grid.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/** Indices belonging to any horizontal or vertical run of 3+ same colour,
 * scanned across the visible band only — the reserve stack above never
 * participates in a match, whatever it happens to line up as. Locked (rock)
 * cells never join a run either, on either side of the comparison. */
function findMatches(grid) {
  const matched = new Set();
  const sameColor = (i, j) => {
    const a = grid[i], b = grid[j];
    return !!a && !!b && !a.locked && !b.locked && a.color === b.color;
  };

  for (let r = 0; r < VISIBLE_ROWS; r++) {
    let streak = 1;
    for (let c = 1; c <= COLS; c++) {
      const same = c < COLS && sameColor(visIndex(r, c), visIndex(r, c - 1));
      if (same) {
        streak++;
      } else {
        if (streak >= 3) for (let k = c - streak; k < c; k++) matched.add(visIndex(r, k));
        streak = 1;
      }
    }
  }

  for (let c = 0; c < COLS; c++) {
    let streak = 1;
    for (let r = 1; r <= VISIBLE_ROWS; r++) {
      const same = r < VISIBLE_ROWS && sameColor(visIndex(r, c), visIndex(r - 1, c));
      if (same) {
        streak++;
      } else {
        if (streak >= 3) for (let k = r - streak; k < r; k++) matched.add(visIndex(k, c));
        streak = 1;
      }
    }
  }

  return matched;
}

function hasAnyMove(grid, locked) {
  for (let r = 0; r < VISIBLE_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = visIndex(r, c);
      if (locked.has(i)) continue;
      if (c + 1 < COLS) {
        const j = visIndex(r, c + 1);
        if (!locked.has(j) && findMatches(swapCells(grid, i, j)).size > 0) return true;
      }
      if (r + 1 < VISIBLE_ROWS) {
        const j = visIndex(r + 1, c);
        if (!locked.has(j) && findMatches(swapCells(grid, i, j)).size > 0) return true;
      }
    }
  }
  return false;
}

/** Fresh full-height board: the visible band gets ordinary "no pre-existing
 * match" colours, the reserve band above it is just plain random shells —
 * it's never checked for matches, so there's nothing to avoid up there. */
function generateBoard() {
  const cells = new Array(TOTAL_ROWS * COLS).fill(null);
  for (let r = 0; r < TOTAL_ROWS; r++) {
    const inVisibleBand = r >= BUFFER_ROWS;
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      let color;
      do {
        color = randomColorId();
      } while (
        inVisibleBand && (
          (c >= 2 && cells[i - 1].color === color && cells[i - 2].color === color) ||
          (r >= BUFFER_ROWS + 2 && cells[i - COLS].color === color && cells[i - 2 * COLS].color === color)
        )
      );
      cells[i] = { id: nextTileId(), color };
    }
  }
  return cells;
}

/** Picks random cells from the visible band only — rocks and cracked slots
 * are both properties of the playable board, never the reserve above it. */
function pickRandomIndices(count, exclude) {
  const pool = [];
  for (let r = 0; r < VISIBLE_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = visIndex(r, c);
      if (!exclude.has(i)) pool.push(i);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return new Set(pool.slice(0, count));
}

/** Builds a board for the given difficulty: plain colours, then a fixed set
 * of rocks (locked, immovable, colourless cells) — retrying until at least
 * one legal move still exists, since locking cells can remove the last one.
 * Cracked slots are picked separately since they don't affect matchability,
 * only what happens once a match lands on them (see resolveCascades). */
function createPlayableBoard(config) {
  let grid, locked;
  let attempts = 0;
  do {
    grid = generateBoard();
    locked = pickRandomIndices(config.lockedCount, new Set());
    for (const idx of locked) grid[idx] = { id: nextTileId(), locked: true, color: null };
    attempts++;
  } while (!hasAnyMove(grid, locked) && attempts < 200);

  const crackedSlots = pickRandomIndices(config.crackedSlotCount, locked);

  return { grid, locked, crackedSlots };
}

/** Re-rolls the colour of every unlocked VISIBLE cell in place (rock
 * positions and slot cracks survive, since both are properties of the cell,
 * not the shell; the reserve band is untouched) until the board has a move
 * and no free match — the fallback for "board has no legal moves left". */
function reshuffleColors(grid, locked) {
  let next;
  let attempts = 0;
  do {
    next = grid.slice();
    for (let r = 0; r < VISIBLE_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = visIndex(r, c);
        if (!locked.has(i)) next[i] = { ...next[i], color: randomColorId() };
      }
    }
    attempts++;
  } while ((findMatches(next).size > 0 || !hasAnyMove(next, locked)) && attempts < 300);
  return next;
}

// Fallback only: how far above its own landing slot a freshly spawned tile
// can start when its segment is enclosed below a rock (so it can't draw from
// the reserve above it), capped so it doesn't start further up than makes
// sense for that short segment. A tile landing at the segment's own top row
// gets offset 0 — see the popIn fade on <Shell> for how that reads as
// arriving rather than just materializing.
const MAX_DROP_OFFSET = 3;

/** Drops surviving tiles to the bottom of each column and fills the gaps at
 * the top with freshly spawned plain shells — run over the FULL board height
 * (reserve + visible) as one continuous simulation, so a shell crossing into
 * the visible band was always a real tile already falling, never something
 * conjured at the moment it's needed. Rocks (which only ever sit in the
 * visible band) still split a column into independent segments; a segment
 * that reaches all the way to row 0 draws its replacements from "off the top
 * of the screen" (rowStart === 0, no special handling needed — it's already
 * clipped from view by the Grid's overflow), while a segment enclosed below
 * a rock has nowhere off-screen to pull from and falls back to spawning
 * locally (see spawnOffsets). */
function applyGravity(grid, locked) {
  const next = new Array(TOTAL_ROWS * COLS).fill(null);
  const spawnOffsets = new Map();
  // tile id -> how many rows it visibly travels this round, which is what
  // gives each tile its own fall duration (see fallDurationFor). A tile that
  // doesn't move simply isn't in here.
  const fallDistances = new Map();
  let fallMs = 0;

  const compactSegment = (col, rowStart, rowEnd) => {
    const survivors = [];
    for (let r = rowStart; r < rowEnd; r++) {
      const tile = grid[r * COLS + col];
      if (tile) survivors.push({ tile, from: r });
    }
    const segLen = rowEnd - rowStart;
    const freshCount = segLen - survivors.length;
    const needsLocalDrop = rowStart > 0;
    const column = [];
    for (let k = 0; k < freshCount; k++) {
      column.push({ tile: { id: nextTileId(), color: randomColorId() }, from: null });
    }
    column.push(...survivors);

    for (let i = 0; i < segLen; i++) {
      const row = rowStart + i;
      const { tile, from } = column[i];
      next[row * COLS + col] = tile;

      // A survivor travels from wherever it used to sit. A fresh tile is born
      // at the top of the reserve board and doesn't travel at all this round
      // — it rides down with the stack over the rounds that follow, which is
      // exactly why shells appear to stream in from off the top of the board.
      // The one exception is the enclosed-below-a-rock fallback, where the
      // tile has to be spawned a short hop above its own slot instead.
      let distance = 0;
      if (from === null) {
        if (needsLocalDrop) {
          distance = Math.min(i, MAX_DROP_OFFSET);
          // Offset 0 still gets an entry: it's what marks the tile as locally
          // spawned, and so what gives it the popIn fade in place of a drop.
          spawnOffsets.set(tile.id, distance);
        }
      } else {
        distance = row - from;
      }

      if (from === null && needsLocalDrop) {
        fallMs = Math.max(fallMs, POP_IN_MS);
      }
      if (distance > 0) {
        fallDistances.set(tile.id, distance);
        fallMs = Math.max(fallMs, col * COLUMN_DELAY_MS + fallDurationFor(distance));
      }
    }
  };

  for (let c = 0; c < COLS; c++) {
    let segStart = 0;
    for (let r = 0; r <= TOTAL_ROWS; r++) {
      const idx = r * COLS + c;
      const isRock = r < TOTAL_ROWS && locked.has(idx);
      if (r === TOTAL_ROWS || isRock) {
        if (r > segStart) compactSegment(c, segStart, r);
        if (isRock) next[idx] = grid[idx];
        segStart = r + 1;
      }
    }
  }

  return { grid: next, spawnOffsets, fallDistances, fallMs: fallMs + FALL_SETTLE_MS };
}

export default function ShellMatchGame({ onClose, onNectarEarned }) {
  const [phase, setPhase] = useState("select"); // "select" | "playing" | "results"
  const [difficulty, setDifficulty] = useState(null);
  const [grid, setGrid] = useState(null);
  const lockedRef = useRef(new Set());
  // Cracked slots live on the cell, not the shell — a fixed set of indices
  // whose first broken shell doesn't pay fill; the slot is free for good
  // after that. `slotCracksRef` is the mutable source of truth read/written
  // inside the async cascade loop; `slotCracks` mirrors it into state so
  // rendering can read it instead of touching a ref.
  const slotCracksRef = useRef(new Set());
  const [slotCracks, setSlotCracks] = useState(() => new Set());

  const [selected, setSelected] = useState(null);
  // Drag-to-swap, alongside the original tap-a-shell-then-tap-a-neighbour.
  // `dragRef` is the live gesture — pointer handlers read and write it without
  // re-rendering — while `drag` is only what the render needs to keep the two
  // shells under the finger offset toward each other.
  const dragRef = useRef(null);
  // tile id -> its DOM node, so a drag can move the two shells under the
  // finger by writing their transforms directly. See paintTile.
  const tileEls = useRef(new Map());
  const [busy, setBusy] = useState(false);
  const [clearingIds, setClearingIds] = useState(() => new Set());
  const [chippingIds, setChippingIds] = useState(() => new Set());
  // Fallback-only (see MAX_DROP_OFFSET) — empty in the common case where
  // every replacement tile comes down from the reserve board instead.
  const [spawnOffsets, setSpawnOffsets] = useState(() => new Map());
  const [poppingIds, setPoppingIds] = useState(() => new Set());
  // tile id -> rows travelled in the current gravity step, so each tile gets a
  // fall duration matched to its own drop instead of one shared duration.
  const [fallDistances, setFallDistances] = useState(() => new Map());
  // True for the whole gravity/refill step of a cascade — swaps out the
  // Tile's snappy swap transition for a slower, smoother one (see $falling
  // in ShellMatchGame.styles.js) so a fall actually reads as a fall instead
  // of a snap.
  const [gravityPhase, setGravityPhase] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [praise, setPraise] = useState(null);

  const [movesLeft, setMovesLeft] = useState(TOTAL_MOVES);
  const movesRef = useRef(TOTAL_MOVES);

  const [barFill, setBarFill] = useState(0);
  const fillRef = useRef(0);
  const [reachedCount, setReachedCount] = useState(0);
  const reachedRef = useRef(new Set());
  // The running difficulty's four checkpoints. Kept in a ref as well as in
  // `difficulty` state because the cascade loop awards them from inside an
  // async run that would otherwise be reading a stale closure.
  const checkpointsRef = useRef([]);
  const [earnedTotal, setEarnedTotal] = useState(0);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startGame = useCallback((key) => {
    const config = DIFFICULTIES[key];
    const { grid: board, locked, crackedSlots } = createPlayableBoard(config);
    lockedRef.current = locked;
    checkpointsRef.current = config.checkpoints;
    slotCracksRef.current = crackedSlots;
    setSlotCracks(new Set(crackedSlots));
    fillRef.current = 0;
    reachedRef.current = new Set();
    movesRef.current = TOTAL_MOVES;

    setDifficulty(config);
    setGrid(board);
    setSelected(null);
    dragRef.current = null;
    setBusy(false);
    setClearingIds(new Set());
    setChippingIds(new Set());
    setSpawnOffsets(new Map());
    setPoppingIds(new Set());
    setFallDistances(new Map());
    setGravityPhase(false);
    setShuffling(false);
    setPraise(null);
    setMovesLeft(TOTAL_MOVES);
    setBarFill(0);
    setReachedCount(0);
    setEarnedTotal(0);
    setPhase("playing");
  }, []);

  const awardCheckpoint = useCallback((index) => {
    reachedRef.current.add(index);
    setReachedCount(reachedRef.current.size);
    const reward = checkpointsRef.current[index].reward;
    setEarnedTotal((t) => t + reward);
    onNectarEarned?.(reward);
  }, [onNectarEarned]);

  const addFill = useCallback((amount) => {
    if (amount <= 0) return;
    const prev = fillRef.current;
    const next = Math.min(prev + amount, BAR_TOTAL);
    fillRef.current = next;
    if (mountedRef.current) setBarFill(next);
    checkpointsRef.current.forEach((cp, i) => {
      if (prev < cp.threshold && next >= cp.threshold && !reachedRef.current.has(i)) {
        awardCheckpoint(i);
      }
    });
  }, [awardCheckpoint]);

  /** Resolves matches, then cascades through gravity refills — each round
   * that itself connects new shells raises the combo multiplier. Every
   * matched shell breaks and clears normally; a shell landing on a still-
   * cracked slot breaks too, but that one hit only cracks the slot instead
   * of paying fill — the slot is free for good from the next match on. */
  const resolveCascades = useCallback(async (startGrid) => {
    let current = startGrid;
    let comboLevel = 0;
    const locked = lockedRef.current;

    while (true) {
      const matches = findMatches(current);
      if (matches.size === 0) break;
      comboLevel++;

      let fillGained = 0;
      const chipped = [];
      for (const idx of matches) {
        if (slotCracksRef.current.has(idx)) {
          slotCracksRef.current.delete(idx);
          chipped.push(idx);
        } else {
          fillGained += FILL_PER_TILE * comboLevel;
        }
      }

      if (!mountedRef.current) return;

      // Drop the word at the middle of whatever just broke, rather than at
      // some fixed spot on the board, so it reads as coming out of the break.
      let sumCol = 0, sumRow = 0;
      for (const idx of matches) {
        sumCol += idx % COLS;
        sumRow += ((idx / COLS) | 0) - BUFFER_ROWS;
      }
      setPraise({
        id: nextPraiseId(),
        level: Math.min(comboLevel, PRAISE_WORDS.length),
        x: (sumCol / matches.size) * STEP_PX + CELL / 2,
        y: (sumRow / matches.size) * STEP_PX + CELL / 2,
      });

      setClearingIds(matches);
      setChippingIds(new Set(chipped));
      setSlotCracks(new Set(slotCracksRef.current));
      addFill(fillGained);

      await sleep(CLEAR_MS);
      if (!mountedRef.current) return;
      setClearingIds(new Set());
      setChippingIds(new Set());

      const cleared = current.slice();
      for (const idx of matches) cleared[idx] = null;
      const { grid: refilled, spawnOffsets: offsets, fallDistances: distances, fallMs } =
        applyGravity(cleared, locked);

      current = refilled;
      setGravityPhase(true);
      setFallDistances(distances);
      setSpawnOffsets(offsets);
      setPoppingIds(new Set(offsets.keys()));
      setGrid(refilled);

      // Paint the fallback tiles' "still above their own slot" frame before
      // dropping the offset — otherwise the browser can coalesce both
      // updates into one paint and that fall-in never actually plays. Only
      // matters for the rare enclosed-segment case; harmless no-op otherwise.
      await nextFrame();
      await nextFrame();
      if (!mountedRef.current) return;
      setSpawnOffsets(new Map());

      await sleep(fallMs);
      if (!mountedRef.current) return;
      setGravityPhase(false);
      setPoppingIds(new Set());
      setFallDistances(new Map());
    }

    if (!hasAnyMove(current, locked)) {
      setShuffling(true);
      await sleep(420);
      if (!mountedRef.current) return;
      current = reshuffleColors(current, locked);
      setGrid(current);
      setShuffling(false);
      await sleep(200);
      if (!mountedRef.current) return;
    }

    setBusy(false);
    if (fillRef.current >= BAR_TOTAL || movesRef.current <= 0) setPhase("results");
  }, [addFill]);

  /** Swaps two adjacent cells, whichever way the player asked for it — a pair
   * of taps or a drag both land here. A swap that connects nothing bounces
   * straight back and costs no move. */
  const attemptSwap = useCallback((from, to) => {
    setSelected(null);

    const attempt = swapCells(grid, from, to);
    const matches = findMatches(attempt);

    if (matches.size === 0) {
      setBusy(true);
      setGrid(attempt);
      const original = grid;
      setTimeout(() => {
        if (!mountedRef.current) return;
        setGrid(original);
        setTimeout(() => { if (mountedRef.current) setBusy(false); }, SWAP_MS);
      }, SWAP_MS);
      return;
    }

    movesRef.current = Math.max(0, movesRef.current - 1);
    setMovesLeft(movesRef.current);

    setBusy(true);
    setGrid(attempt);
    setTimeout(() => resolveCascades(attempt), SWAP_MS);
  }, [grid, resolveCascades]);

  const handleTileClick = useCallback((idx) => {
    if (busy) return;
    const tapped = grid[idx];
    if (!tapped || tapped.locked) return;

    if (selected === idx) { setSelected(null); return; }
    if (selected === null || !isAdjacent(selected, idx)) { setSelected(idx); return; }

    attemptSwap(selected, idx);
  }, [grid, busy, selected, attemptSwap]);

  /** The cell one step away in a direction, or null if there's nothing there
   * to drag against — the board's edge, the line up into the reserve band, or
   * a rock. A drag toward one of those simply doesn't move the shell, so the
   * wall gets felt rather than explained. */
  const dragNeighbor = useCallback((idx, dRow, dCol) => {
    const row = (idx / COLS) | 0, col = idx % COLS;
    const nr = row + dRow, nc = col + dCol;
    if (nc < 0 || nc >= COLS) return null;
    if (nr < BUFFER_ROWS || nr >= TOTAL_ROWS) return null;
    const j = nr * COLS + nc;
    const tile = grid?.[j];
    if (!tile || tile.locked) return null;
    return j;
  }, [grid]);

  /** Moves a tile by writing its transform straight to the DOM, around React
   * rather than through it. A drag repaints on every pointer move, and going
   * through state meant re-rendering all 72 tiles (each a handful of styled
   * components) at pointer rate — which is what made dragging feel heavy. The
   * string built here has to match the one the render produces exactly, so
   * that React's own next write is a no-op rather than a fight. */
  const paintTile = useCallback((idx, axis, offset) => {
    const tileId = grid?.[idx]?.id;
    if (tileId === undefined) return;
    const el = tileEls.current.get(tileId);
    if (!el) return;
    const row = ((idx / COLS) | 0) - BUFFER_ROWS;
    const col = idx % COLS;
    const x = col * STEP_PX + (axis === "x" ? offset : 0);
    const y = row * STEP_PX + (axis === "y" ? offset : 0);
    el.style.transform = `translate(${x}px, ${y}px)`;
  }, [grid]);

  /** Hands a tile back to React: the gesture's overrides come off and the tile
   * returns to its own slot on the ordinary transition. Nothing React renders
   * next would do this by itself — as far as it knows the tile never left. */
  const settleTile = useCallback((idx, axis) => {
    const tileId = grid?.[idx]?.id;
    if (tileId === undefined) return;
    const el = tileEls.current.get(tileId);
    if (!el) return;
    el.style.transitionDuration = "";
    el.style.zIndex = "";
    paintTile(idx, axis, 0);
  }, [grid, paintTile]);

  const endDrag = useCallback((e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return null;
    settleTile(d.idx, d.axis);
    if (d.neighbor != null) settleTile(d.neighbor, d.axis);
    if (e?.currentTarget?.hasPointerCapture?.(d.pointerId)) {
      e.currentTarget.releasePointerCapture(d.pointerId);
    }
    return d;
  }, [settleTile]);

  const handlePointerDown = useCallback((e, idx) => {
    if (busy || e.button > 0) return;
    const tile = grid[idx];
    if (!tile || tile.locked) return;
    // Capturing means every move and the release come back to this tile even
    // once the pointer has left it, so the gesture is read from where it
    // started rather than from whatever it happens to be over.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
    dragRef.current = {
      idx, pointerId: e.pointerId, x: e.clientX, y: e.clientY,
      axis: null, moved: false, neighbor: null,
      // What's currently painted, so a move that changes nothing on screen
      // costs nothing at all (see handlePointerMove).
      painted: null,
    };
  }, [busy, grid]);

  const handlePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;

    // The gesture picks an axis once, at the moment it's clearly a drag at
    // all, and keeps it for the rest of the pull — a diagonal wander partway
    // through shouldn't quietly re-aim the swap at a different neighbour.
    if (!d.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_SLOP_PX) return;
      d.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      d.moved = true;
      const el = tileEls.current.get(grid[d.idx].id);
      if (el) {
        // Track the finger with no transition of its own, and ride above the
        // shell it's being traded with for the length of the pull.
        el.style.transitionDuration = "0ms";
        el.style.zIndex = "2";
      }
    }

    const along = d.axis === "x" ? dx : dy;
    const dir = along < 0 ? -1 : 1;
    const neighbor = d.axis === "x" ? dragNeighbor(d.idx, 0, dir) : dragNeighbor(d.idx, dir, 0);

    if (neighbor !== null && Math.abs(along) >= DRAG_COMMIT_PX) {
      endDrag(e);
      attemptSwap(d.idx, neighbor);
      return;
    }

    // Reversing direction mid-pull hands the old partner back before the new
    // one is picked up, so it doesn't stay stranded half out of its slot.
    if (neighbor !== d.neighbor) {
      if (d.neighbor != null) settleTile(d.neighbor, d.axis);
      d.neighbor = neighbor;
      d.painted = null;
      if (neighbor != null) {
        const el = tileEls.current.get(grid[neighbor].id);
        if (el) el.style.transitionDuration = "0ms";
      }
    }

    const offset = neighbor === null ? 0 : Math.round(Math.max(-STEP_PX, Math.min(STEP_PX, along)));
    // Nothing to repaint when nothing would land anywhere else: dragging
    // against a wall pins the offset at 0 for the whole pull, and sub-pixel
    // jitter moves no shell either.
    if (d.painted === offset) return;
    d.painted = offset;

    paintTile(d.idx, d.axis, offset);
    if (neighbor != null) paintTile(neighbor, d.axis, -offset);
  }, [grid, dragNeighbor, endDrag, settleTile, paintTile, attemptSwap]);

  const handlePointerUp = useCallback((e) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    endDrag(e);
    // A press that never turned into a drag is a tap, and taps still drive the
    // original select-then-pick-a-neighbour swap.
    if (!d.moved) handleTileClick(d.idx);
  }, [endDrag, handleTileClick]);

  // Tiles are drawn in a stable id order instead of board order. They're
  // absolutely positioned, so DOM order carries no visual meaning — but it
  // carries a great deal of animation meaning: React reconciles a reordered
  // keyed list by detaching and re-inserting the nodes that moved, and a
  // detached node loses the computed style the browser needs to interpolate
  // from. In board order every surviving tile in a refilled column shifts
  // later in the list (fresh tiles are prepended above it), so exactly the
  // tiles that should be seen falling were the ones being re-inserted — their
  // transform change produced no transition and they snapped into place.
  // Ids only ever increase, so id order keeps survivors' relative order fixed
  // and appends fresh tiles at the end: React never moves a node again.
  const renderTiles = [];
  if (grid) {
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) renderTiles.push({ tile: grid[i], idx: i });
    }
    renderTiles.sort((a, b) => a.tile.id - b.tile.id);
  }

  const barPct = (barFill / BAR_TOTAL) * 100;

  return (
    <S.Overlay onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <S.Panel onMouseDown={(e) => e.stopPropagation()}>
        <S.Header>
          <S.Title><span>🐚</span> Shell Match</S.Title>
          <S.CloseBtn onClick={onClose} aria-label="Close">&times;</S.CloseBtn>
        </S.Header>

        {phase === "select" && (
          <>
            <S.Hint style={{ marginTop: 0 }}>
              Fill the nectar bar before your {TOTAL_MOVES} moves run out — chain reactions fill it faster.
            </S.Hint>
            <S.DifficultyGrid>
              {Object.values(DIFFICULTIES).map((cfg) => (
                <S.DifficultyCard key={cfg.key} $accent={cfg.accent} onClick={() => startGame(cfg.key)}>
                  <S.DifficultyLabel $accent={cfg.accent}>{cfg.label}</S.DifficultyLabel>
                  <S.DifficultyBlurb>{cfg.blurb}</S.DifficultyBlurb>
                </S.DifficultyCard>
              ))}
            </S.DifficultyGrid>
          </>
        )}

        {phase === "playing" && grid && (
          <>
            <S.StatsRow>
              <S.DifficultyPill $accent={difficulty.accent}>{difficulty.label}</S.DifficultyPill>
              <S.MovesPill $low={movesLeft <= 10}>Moves {movesLeft}</S.MovesPill>
            </S.StatsRow>

            <S.BarTrack style={{ width: BOARD_PX }}>
              <S.BarFill
                style={{
                  width: `${barPct}%`,
                  // Pinned to the track's width so the gradient's colours stay
                  // where they are as the fill grows past them.
                  backgroundSize: `${BOARD_PX}px 100%`,
                }}
              />
              <S.BarCap $visible={barPct > 0} style={{ left: `${barPct}%` }} />
              {difficulty.checkpoints.map((cp, i) => {
                const reached = reachedCount > i;
                const isFinal = i === difficulty.checkpoints.length - 1;
                return (
                  <S.CheckpointMark key={i} style={{ left: `${(cp.threshold / BAR_TOTAL) * 100}%` }}>
                    <S.CheckpointDot $reached={reached} $final={isFinal}>
                      {reached ? "✓" : ""}
                    </S.CheckpointDot>
                    <S.CheckpointReward $reached={reached} $final={isFinal}>
                      <img src="/icons/Nectar.png" alt="" />{cp.reward}
                    </S.CheckpointReward>
                  </S.CheckpointMark>
                );
              })}
            </S.BarTrack>

            <S.BoardWrap>
              {shuffling && <S.ShuffleNotice>Shuffling…</S.ShuffleNotice>}
              <S.BoardFrame>
                <S.Grid
                  style={{
                    width: BOARD_PX,
                    height: BOARD_HEIGHT_PX,
                    gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                    gridTemplateRows: `repeat(${VISIBLE_ROWS}, ${CELL}px)`,
                    gap: GAP,
                  }}
                >
                  {/* The actual invisible grid: 36 real grid cells, auto-placed
                      by the browser in row-major DOM order — the same order
                      the visible band uses — so a cracked cell's shaded
                      background is laid out by the grid itself rather than by
                      hand-computed pixel math, and can never drift out of
                      alignment with where the grid places the shell above it. */}
                  {Array.from({ length: VISIBLE_ROWS * COLS }, (_, i) => (
                    <S.Cell key={`cell-${i}`} $cracked={slotCracks.has(visIndex((i / COLS) | 0, i % COLS))} />
                  ))}

                  {renderTiles.map(({ tile, idx }) => {
                    const fullRow = (idx / COLS) | 0, col = idx % COLS;
                    // Row 0 of the visible band sits at pixel 0; the reserve
                    // board above it gets negative rows, clipped out of view
                    // by the Grid's own overflow rather than any extra math.
                    const baseVisualRow = fullRow - BUFFER_ROWS;
                    const visualRow = baseVisualRow - (spawnOffsets.get(tile.id) || 0);
                    // Resting position only. While a drag is in flight the two
                    // shells under the finger are moved by paintTile, straight
                    // on the DOM — this render doesn't run again until the
                    // gesture is over.
                    const style = {
                      width: CELL,
                      height: CELL,
                      transform: `translate(${col * STEP_PX}px, ${visualRow * STEP_PX}px)`,
                    };
                    // Left-to-right wave: each column starts falling a little
                    // later than the one before it, instead of the whole
                    // board (and reserve) dropping in lockstep. A real prop
                    // rather than an inline transitionDelay style, so it
                    // can't be silently reset by the transition shorthand.
                    const delayMs = gravityPhase ? col * COLUMN_DELAY_MS : 0;
                    // Per-tile, because a tile's drop is its own: the further
                    // it falls the longer it takes. Set inline (the styled
                    // component only supplies the gravity curve) so each tile
                    // in the same falling board can differ. 0 rows → 0ms,
                    // which is right — a tile that doesn't move has nothing
                    // to interpolate anyway.
                    const fallRows = gravityPhase ? fallDistances.get(tile.id) || 0 : 0;
                    if (gravityPhase) style.transitionDuration = `${fallDurationFor(fallRows)}ms`;

                    if (tile.locked) {
                      return (
                        <S.Tile key={tile.id} $locked $delayMs={delayMs} style={style}>
                          <S.Rock>🪨</S.Rock>
                        </S.Tile>
                      );
                    }

                    const isVisible = fullRow >= BUFFER_ROWS;
                    const clearing = isVisible && clearingIds.has(idx);
                    const chipping = isVisible && chippingIds.has(idx);
                    // Squash on impact, timed to start at the exact moment
                    // this tile's own fall ends (its column's stagger plus its
                    // own duration) rather than when the board as a whole
                    // finishes — so a short drop lands early and squashes
                    // early. Mutually exclusive with the popIn fade, since
                    // both drive the shell's transform.
                    const popping = poppingIds.has(tile.id);
                    const landing = fallRows > 0 && !popping;

                    return (
                      <S.Tile
                        key={tile.id}
                        ref={(el) => {
                          if (el) tileEls.current.set(tile.id, el);
                          else tileEls.current.delete(tile.id);
                        }}
                        $selected={isVisible && selected === idx}
                        $falling={gravityPhase}
                        $delayMs={delayMs}
                        style={style}
                        onPointerDown={isVisible ? (e) => handlePointerDown(e, idx) : undefined}
                        onPointerMove={isVisible ? handlePointerMove : undefined}
                        onPointerUp={isVisible ? handlePointerUp : undefined}
                        onPointerCancel={isVisible ? endDrag : undefined}
                      >
                        <S.Burst $active={clearing} />
                        <S.BurstRing $active={clearing} />
                        <S.Chip $active={chipping} />
                        <S.Shell
                          src="/assets/shell/shell.png"
                          draggable={false}
                          $clearing={clearing}
                          $popping={popping}
                          $landing={landing}
                          style={{
                            filter: COLOR_FILTER[tile.color],
                            ...(landing && { animationDelay: `${delayMs + fallDurationFor(fallRows)}ms` }),
                          }}
                        />
                      </S.Tile>
                    );
                  })}
                </S.Grid>
              </S.BoardFrame>
              {praise && (
                <S.Praise
                  key={praise.id}
                  $level={praise.level}
                  style={{ left: praise.x + S.FRAME_PAD, top: praise.y + S.FRAME_PAD }}
                >
                  {PRAISE_WORDS[praise.level - 1]}
                </S.Praise>
              )}
            </S.BoardWrap>

            <S.Hint>Drag a shell onto its neighbour — or tap the two of them — to connect 3 or more.</S.Hint>
          </>
        )}

        {phase === "results" && difficulty && (
          <S.ResultsBody>
            <S.ResultsHeadline>
              {reachedCount >= difficulty.checkpoints.length ? "Bar complete!" : "Out of moves"}
            </S.ResultsHeadline>
            <S.ResultsRow>
              {difficulty.label} · {reachedCount} / {difficulty.checkpoints.length} checkpoints
            </S.ResultsRow>
            <S.ResultsNectar>
              <img src="/icons/Nectar.png" alt="" />
              +{earnedTotal.toLocaleString()} Nectar
            </S.ResultsNectar>
            <S.PrimaryBtn onClick={() => setPhase("select")}>Play again</S.PrimaryBtn>
          </S.ResultsBody>
        )}
      </S.Panel>
    </S.Overlay>
  );
}
