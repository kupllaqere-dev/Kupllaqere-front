import styled, { keyframes, css } from "styled-components";

/* ─── Palette ───────────────────────────────────────────────
   bg-overlay  rgba(10, 40, 56, .6)   dusk sea
   bg-panel    #fdf1d6                sand
   bg-board    #1f7a8c                deep sea
   border      #ffe1a8                shell rim
   text-dark   #123c4a                deep navy
   text-mid    #1f7a8c
   accent      #ff8a5c                coral highlight
────────────────────────────────────────────────────────────── */

// Matches CLEAR_MS in ShellMatchGame.jsx — kept in sync by hand since CSS
// keyframe durations live in this file but the game's timeline (when a tile
// actually leaves the grid) lives in the component.
const CLEAR_ANIM_MS = 220;

// A quick fade-in for a tile landing at the very top of its column, which
// has no room to visually drop from (see MAX_DROP_OFFSET in the component) —
// gives it something rather than just materializing outright.
const popIn = keyframes`
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
`;

// Hot core + a shockwave ring for a tile that actually breaks.
const burstPop = keyframes`
  0%   { opacity: 0.95; transform: scale(0.15); }
  35%  { opacity: 0.8;  transform: scale(1.15); }
  100% { opacity: 0;    transform: scale(1.7); }
`;

const burstRingPop = keyframes`
  0%   { opacity: 0.8; transform: scale(0.35); border-width: 5px; }
  100% { opacity: 0;   transform: scale(1.7); border-width: 1px; }
`;

// A cooler, smaller flash for a double-shelled tile that took a hit but
// survived — distinct from the warm "broken" burst above.
const chipPop = keyframes`
  0%   { opacity: 0.85; transform: scale(0.3); }
  100% { opacity: 0;    transform: scale(1.25); }
`;

// Never touches `transform` — the tile's own inline transform carries its
// board position (translate), and an animated `transform` here would replace
// that outright rather than compose with it, snapping the tile to the
// board's top-left corner for the animation's duration.
const selectPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.85), 0 0 10px rgba(255, 234, 180, 0.7);
    filter: brightness(1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 1), 0 0 26px rgba(255, 234, 180, 1);
    filter: brightness(1.15);
  }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
`;

const fillShimmer = keyframes`
  0%   { background-position: 0 0; }
  100% { background-position: 40px 0; }
`;

const dotPop = keyframes`
  0%   { transform: scale(0.6); }
  60%  { transform: scale(1.25); }
  100% { transform: scale(1); }
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 34, 46, 0.6);
  backdrop-filter: blur(5px);
  font-family: Quicksand, Nunito, Poppins, sans-serif;
`;

export const Panel = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 22px 26px 26px;
  border-radius: 26px;
  background: linear-gradient(180deg, #fdf1d6 0%, #fbe6bd 100%);
  border: 3px solid #ffe1a8;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 24px;
`;

export const Title = styled.div`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: #123c4a;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    display: inline-block;
    animation: ${bob} 2.2s ease-in-out infinite;
  }
`;

export const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e8c17e;
  background: #fff8e8;
  color: #b3541e;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: #ffe3d0;
    border-color: #ff8a5c;
    color: #b3541e;
    transform: scale(1.06);
  }
`;

/* ── Difficulty select ─────────────────────────────────────── */

export const DifficultyGrid = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

export const DifficultyCard = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  padding: 14px 12px;
  min-width: 0;
  border-radius: 14px;
  border: 2px solid ${({ $accent }) => $accent};
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
`;

export const DifficultyLabel = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: ${({ $accent }) => $accent};
`;

export const DifficultyBlurb = styled.div`
  font-size: 11.5px;
  line-height: 1.4;
  color: rgba(18, 60, 74, 0.8);
`;

/* ── Playing HUD ────────────────────────────────────────────── */

export const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const DifficultyPill = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: ${({ $accent }) => $accent};
`;

export const MovesPill = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: ${({ $low }) => ($low ? "#fff" : "#123c4a")};
  background: ${({ $low }) => ($low ? "#d9534f" : "rgba(31, 122, 140, 0.15)")};
  transition: background 0.2s ease, color 0.2s ease;
`;

export const BarTrack = styled.div`
  position: relative;
  height: 16px;
  border-radius: 999px;
  background: rgba(18, 60, 74, 0.18);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25);
  margin-top: 4px;
  margin-bottom: 26px;
`;

export const BarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background:
    repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.25) 0 8px,
      rgba(255, 255, 255, 0) 8px 16px
    ),
    linear-gradient(90deg, #ffcf6b 0%, #ff8a5c 100%);
  background-size: 40px 100%, 100% 100%;
  animation: ${fillShimmer} 1.1s linear infinite;
  transition: width 320ms ease-out;
`;

export const CheckpointMark = styled.div`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const CheckpointDot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: ${({ $reached }) => ($reached ? "#123c4a" : "#fff8e8")};
  background: ${({ $reached }) => ($reached ? "#ffe1a8" : "#1f7a8c")};
  border: 2px solid #fdf1d6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  ${({ $reached }) => $reached && css`animation: ${dotPop} 320ms ease-out;`}
`;

export const CheckpointReward = styled.div`
  position: absolute;
  top: 100%;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 700;
  color: #123c4a;
  white-space: nowrap;

  img {
    width: 12px;
    height: 12px;
  }
`;

export const ShuffleNotice = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(8, 34, 46, 0.55);
  color: #fff8e8;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.4px;
`;

/* ── Board ──────────────────────────────────────────────────── */

export const BoardWrap = styled.div`
  position: relative;
`;

// Purely decorative — the frame's own padding lives here, outside the grid's
// coordinate system entirely, so it can never throw off where a grid cell
// and the shell tile positioned on top of it land (that padding-vs-content-box
// mismatch was the actual cause of the shade/shell misalignment before).
export const BoardFrame = styled.div`
  display: inline-flex;
  border-radius: 16px;
  background: linear-gradient(160deg, #2a94a8 0%, #1f7a8c 60%, #176271 100%);
  box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.35), 0 8px 22px rgba(0, 0, 0, 0.3);
  padding: 8px;
  cursor: ${({ $busy }) => ($busy ? "default" : "pointer")};
`;

// The actual invisible grid. Zero padding of its own — its content box is
// exactly SIZE*CELL + (SIZE-1)*GAP on each side, so a shell tile positioned
// with `transform: translate(col*(CELL+GAP), row*(CELL+GAP))` lands in
// exactly the same place the browser's own grid layout puts the matching
// <Cell>, with no separate math to drift out of sync.
export const Grid = styled.div`
  position: relative;
  display: grid;
  /* Clips the hidden reserve board stacked above the visible one (see
     ShellMatchGame.jsx) — tiles up there render at negative rows and are
     simply cut off here rather than needing any explicit "don't show this"
     logic of their own. */
  overflow: hidden;
  border-radius: 8px;
`;

// One per board cell, auto-placed by the grid in row-major DOM order.
// Invisible by default; a cracked slot tints its own cell darker — a real
// grid item, not a hand-positioned overlay, so it can't be offset from
// whatever shell happens to be sitting on top of it.
export const Cell = styled.div`
  border-radius: 10px;
  pointer-events: none;
  background: ${({ $cracked }) => ($cracked ? "rgba(4, 18, 24, 0.55)" : "transparent")};
`;

export const Tile = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  /* Deliberately all longhands, never the transition shorthand — mixing a
     shorthand declaration here with the per-tile transition-delay below is a
     real footgun: transition: transform 240ms ... implicitly resets
     transition-delay to 0 as a side effect (it's not mentioned in the
     shorthand's value list), silently eating the left-to-right stagger.
     Keeping every sub-property explicit means the $falling block below only
     ever touches duration/timing-function, never delay. */
  transition-property: transform;
  /* Snappy by default — this is the swap/reject-bounce speed (matches
     SWAP_MS in ShellMatchGame.jsx). Gravity gets its own curve below so a
     fall reads differently from a swap. */
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Column-by-column wave during a cascade (see COLUMN_DELAY_MS in
     ShellMatchGame.jsx) — 0 the rest of the time, e.g. during a swap. */
  transition-delay: ${({ $delayMs }) => $delayMs || 0}ms;

  ${({ $falling }) =>
    $falling &&
    css`
      /* Matches FALL_TRANSITION_MS in ShellMatchGame.jsx. Accelerates like
         gravity taking hold, then overshoots the landing slightly before
         settling — a small physical bounce rather than a dead stop. Kept
         tight so a chain of cascades doesn't drag. */
      transition-duration: 320ms;
      transition-timing-function: cubic-bezier(0.38, 0, 0.62, 1.2);
    `}

  ${({ $locked }) =>
    $locked &&
    css`
      background: linear-gradient(160deg, #2b2b2b 0%, #050505 70%);
      box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.7);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      animation: ${selectPulse} 900ms ease-in-out infinite;
    `}
`;

export const Rock = styled.span`
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6));
  opacity: 0.85;
`;

export const Burst = styled.span`
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 248, 224, 0.9) 22%,
    rgba(255, 196, 102, 0.65) 50%,
    rgba(255, 138, 92, 0) 78%
  );

  ${({ $active }) =>
    $active &&
    css`
      animation: ${burstPop} ${CLEAR_ANIM_MS}ms ease-out both;
    `}
`;

export const BurstRing = styled.span`
  position: absolute;
  inset: -4%;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  border: 4px solid rgba(255, 244, 214, 0.85);
  box-shadow: 0 0 8px rgba(255, 196, 102, 0.45);

  ${({ $active }) =>
    $active &&
    css`
      animation: ${burstRingPop} ${CLEAR_ANIM_MS}ms ease-out both;
    `}
`;

// Cooler flash for a double-shelled tile that survived a hit.
export const Chip = styled.span`
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(190, 232, 255, 0.6) 55%,
    rgba(190, 232, 255, 0) 80%
  );

  ${({ $active }) =>
    $active &&
    css`
      animation: ${chipPop} ${CLEAR_ANIM_MS}ms ease-out both;
    `}
`;

export const Shell = styled.img`
  width: 78%;
  height: 78%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.3));
  transition: transform ${CLEAR_ANIM_MS}ms cubic-bezier(0.4, 0, 0.6, 1), opacity ${CLEAR_ANIM_MS}ms ease;

  ${({ $clearing }) =>
    $clearing &&
    css`
      opacity: 0;
      transform: scale(0.2) rotate(50deg);
    `}

  ${({ $popping }) =>
    $popping &&
    css`
      animation: ${popIn} 260ms ease-out both;
    `}
`;

// A cracked slot shows as a dark patch on the board cell itself, instead of
// a number — positioned once by its fixed index (see the render loop) and
// never nested inside a moving Tile, so it can't ride along when a shell
// swaps or falls through that cell. Disappears once the slot is cracked.
export const SlotShade = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(4, 18, 24, 0.6) 55%, rgba(4, 18, 24, 0) 100%);
`;

/* ── Results ────────────────────────────────────────────────── */

export const ResultsBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 30px 6px;
`;

export const ResultsHeadline = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #123c4a;
`;

export const ResultsRow = styled.div`
  font-size: 13px;
  color: rgba(18, 60, 74, 0.75);
`;

export const ResultsNectar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  font-weight: 800;
  color: #b3541e;
  margin: 6px 0 4px;

  img {
    width: 22px;
    height: 22px;
  }
`;

export const PrimaryBtn = styled.button`
  margin-top: 6px;
  padding: 10px 22px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(180deg, #ffcf6b 0%, #ff8a5c 100%);
  color: #4a2408;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(255, 138, 92, 0.4);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const Hint = styled.div`
  font-size: 12px;
  color: rgba(18, 60, 74, 0.65);
  align-self: flex-start;
  margin-top: -8px;
`;
