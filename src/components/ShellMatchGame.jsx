import { useCallback, useEffect, useRef, useState } from "react";
import * as S from "./ShellMatchGame.styles";

/**
 * A standalone match-3 puzzle (Candy Crush style) opened from the Beach's
 * shell decoration.
 *
 * There's no "score" — instead, breaking shells fills a shared nectar bar
 * with 6 checkpoints, each paying out real Nectar (via `onNectarEarned`,
 * wired to the player's coin balance in Game.jsx) the moment it's crossed.
 * Combos (a drop that connects again) fill the bar faster, same as the old
 * score multiplier did. The player gets a flat budget of moves to work with
 * — filling the whole bar is meant to take real cascade play, not just be a
 * given.
 *
 * Three difficulties reuse this exact board/bar/moves engine; the only thing
 * that changes is which special tiles get seeded onto the board:
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
const FALL_TRANSITION_MS = 320;
// Longer than the worst-case column delay + the fall transition itself (see
// $falling in ShellMatchGame.styles.js), so the whole wave finishes playing
// before the next cascade round starts clearing on top of it.
const FALL_MS = (COLS - 1) * COLUMN_DELAY_MS + FALL_TRANSITION_MS + 60;

const TOTAL_MOVES = 50;
const FILL_PER_TILE = 10;

// Escalating segment sizes (not just escalating rewards) are what make the
// far end of the bar "quite difficult" — the fill needed per checkpoint
// grows even as the moves budget stays flat.
const CHECKPOINTS = [
  { threshold: 400, reward: 500 },
  { threshold: 850, reward: 700 },
  { threshold: 1350, reward: 900 },
  { threshold: 1900, reward: 1200 },
  { threshold: 2500, reward: 1500 },
  { threshold: 3200, reward: 2000 },
];
const BAR_TOTAL = CHECKPOINTS[CHECKPOINTS.length - 1].threshold;

const DIFFICULTIES = {
  easy: {
    key: "easy",
    label: "Easy",
    accent: "#4fb477",
    blurb: "Plain shells only — every match counts straight away.",
    crackedSlotCount: 0,
    lockedCount: 0,
  },
  medium: {
    key: "medium",
    label: "Medium",
    accent: "#e0a13a",
    blurb: "A few board slots are cracked — the first shell broken there doesn't count, then the slot's free for good.",
    crackedSlotCount: 6,
    lockedCount: 0,
  },
  hard: {
    key: "hard",
    label: "Hard",
    accent: "#d9534f",
    blurb: "Cracked slots return, plus a handful of solid rocks that can never be broken or moved.",
    crackedSlotCount: 5,
    lockedCount: 5,
  },
};

let tileSeq = 0;
const nextTileId = () => ++tileSeq;
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

  const compactSegment = (col, rowStart, rowEnd) => {
    const survivors = [];
    for (let r = rowStart; r < rowEnd; r++) {
      const tile = grid[r * COLS + col];
      if (tile) survivors.push(tile);
    }
    const segLen = rowEnd - rowStart;
    const freshCount = segLen - survivors.length;
    const fresh = [];
    for (let k = 0; k < freshCount; k++) fresh.push({ id: nextTileId(), color: randomColorId() });
    const column = [...fresh, ...survivors];
    const needsLocalDrop = rowStart > 0;
    for (let i = 0; i < segLen; i++) {
      next[(rowStart + i) * COLS + col] = column[i];
      if (i < freshCount && needsLocalDrop) spawnOffsets.set(column[i].id, Math.min(i, MAX_DROP_OFFSET));
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

  return { grid: next, spawnOffsets };
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
  const [busy, setBusy] = useState(false);
  const [clearingIds, setClearingIds] = useState(() => new Set());
  const [chippingIds, setChippingIds] = useState(() => new Set());
  // Fallback-only (see MAX_DROP_OFFSET) — empty in the common case where
  // every replacement tile comes down from the reserve board instead.
  const [spawnOffsets, setSpawnOffsets] = useState(() => new Map());
  const [poppingIds, setPoppingIds] = useState(() => new Set());
  // True for the whole gravity/refill step of a cascade — swaps out the
  // Tile's snappy swap transition for a slower, smoother one (see $falling
  // in ShellMatchGame.styles.js) so a fall actually reads as a fall instead
  // of a snap.
  const [gravityPhase, setGravityPhase] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const [movesLeft, setMovesLeft] = useState(TOTAL_MOVES);
  const movesRef = useRef(TOTAL_MOVES);

  const [barFill, setBarFill] = useState(0);
  const fillRef = useRef(0);
  const [reachedCount, setReachedCount] = useState(0);
  const reachedRef = useRef(new Set());
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
    slotCracksRef.current = crackedSlots;
    setSlotCracks(new Set(crackedSlots));
    fillRef.current = 0;
    reachedRef.current = new Set();
    movesRef.current = TOTAL_MOVES;

    setDifficulty(config);
    setGrid(board);
    setSelected(null);
    setBusy(false);
    setClearingIds(new Set());
    setChippingIds(new Set());
    setSpawnOffsets(new Map());
    setPoppingIds(new Set());
    setGravityPhase(false);
    setShuffling(false);
    setMovesLeft(TOTAL_MOVES);
    setBarFill(0);
    setReachedCount(0);
    setEarnedTotal(0);
    setPhase("playing");
  }, []);

  const awardCheckpoint = useCallback((index) => {
    reachedRef.current.add(index);
    setReachedCount(reachedRef.current.size);
    const reward = CHECKPOINTS[index].reward;
    setEarnedTotal((t) => t + reward);
    onNectarEarned?.(reward);
  }, [onNectarEarned]);

  const addFill = useCallback((amount) => {
    if (amount <= 0) return;
    const prev = fillRef.current;
    const next = Math.min(prev + amount, BAR_TOTAL);
    fillRef.current = next;
    if (mountedRef.current) setBarFill(next);
    CHECKPOINTS.forEach((cp, i) => {
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
      const { grid: refilled, spawnOffsets: offsets } = applyGravity(cleared, locked);

      current = refilled;
      setGravityPhase(true);
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

      await sleep(FALL_MS);
      if (!mountedRef.current) return;
      setGravityPhase(false);
      setPoppingIds(new Set());
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

  const handleTileClick = useCallback((idx) => {
    if (busy) return;
    const tapped = grid[idx];
    if (!tapped || tapped.locked) return;

    if (selected === idx) { setSelected(null); return; }
    if (selected === null || !isAdjacent(selected, idx)) { setSelected(idx); return; }

    const from = selected;
    setSelected(null);

    const attempt = swapCells(grid, from, idx);
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
  }, [grid, busy, selected, resolveCascades]);

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
              <S.BarFill style={{ width: `${(barFill / BAR_TOTAL) * 100}%` }} />
              {CHECKPOINTS.map((cp, i) => (
                <S.CheckpointMark key={i} style={{ left: `${(cp.threshold / BAR_TOTAL) * 100}%` }}>
                  <S.CheckpointDot $reached={reachedCount > i}>
                    {reachedCount > i ? "✓" : i + 1}
                  </S.CheckpointDot>
                  <S.CheckpointReward>
                    <img src="/icons/Nectar.png" alt="" />{cp.reward}
                  </S.CheckpointReward>
                </S.CheckpointMark>
              ))}
            </S.BarTrack>

            <S.BoardWrap>
              {shuffling && <S.ShuffleNotice>Shuffling…</S.ShuffleNotice>}
              <S.BoardFrame $busy={busy}>
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

                  {grid.map((tile, idx) => {
                    if (!tile) return null;
                    const fullRow = (idx / COLS) | 0, col = idx % COLS;
                    // Row 0 of the visible band sits at pixel 0; the reserve
                    // board above it gets negative rows, clipped out of view
                    // by the Grid's own overflow rather than any extra math.
                    const baseVisualRow = fullRow - BUFFER_ROWS;
                    const visualRow = baseVisualRow - (spawnOffsets.get(tile.id) || 0);
                    const style = {
                      width: CELL,
                      height: CELL,
                      transform: `translate(${col * (CELL + GAP)}px, ${visualRow * (CELL + GAP)}px)`,
                    };
                    // Left-to-right wave: each column starts falling a little
                    // later than the one before it, instead of the whole
                    // board (and reserve) dropping in lockstep. A real prop
                    // rather than an inline transitionDelay style, so it
                    // can't be silently reset by the transition shorthand.
                    const delayMs = gravityPhase ? col * COLUMN_DELAY_MS : 0;

                    if (tile.locked) {
                      return (
                        <S.Tile key={tile.id} $locked $delayMs={delayMs} style={{ ...style, cursor: "default" }}>
                          <S.Rock>🪨</S.Rock>
                        </S.Tile>
                      );
                    }

                    const isVisible = fullRow >= BUFFER_ROWS;
                    const clearing = isVisible && clearingIds.has(idx);
                    const chipping = isVisible && chippingIds.has(idx);

                    return (
                      <S.Tile
                        key={tile.id}
                        $selected={isVisible && selected === idx}
                        $falling={gravityPhase}
                        $delayMs={delayMs}
                        style={style}
                        onClick={isVisible ? () => handleTileClick(idx) : undefined}
                      >
                        <S.Burst $active={clearing} />
                        <S.BurstRing $active={clearing} />
                        <S.Chip $active={chipping} />
                        <S.Shell
                          src="/assets/shell/shell.png"
                          draggable={false}
                          $clearing={clearing}
                          $popping={poppingIds.has(tile.id)}
                          style={{ filter: COLOR_FILTER[tile.color] }}
                        />
                      </S.Tile>
                    );
                  })}
                </S.Grid>
              </S.BoardFrame>
            </S.BoardWrap>

            <S.Hint>Swap neighbouring shells to connect 3 or more.</S.Hint>
          </>
        )}

        {phase === "results" && difficulty && (
          <S.ResultsBody>
            <S.ResultsHeadline>
              {reachedCount >= CHECKPOINTS.length ? "Bar complete!" : "Out of moves"}
            </S.ResultsHeadline>
            <S.ResultsRow>{difficulty.label} · {reachedCount} / {CHECKPOINTS.length} checkpoints</S.ResultsRow>
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
