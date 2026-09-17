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

// Matches GAP in ShellMatchGame.jsx — the space between two cells, which each
// neighbouring tile claims half of as grip (see Tile).
const GAP = 6;

// A quick fade-in for a tile landing at the very top of its column, which
// has no room to visually drop from (see MAX_DROP_OFFSET in the component) —
// gives it something rather than just materializing outright.
const popIn = keyframes`
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
`;

// The impact at the end of a fall: the shell squashes against what it lands
// on, rebounds a touch past its resting height, then settles. Anchored to the
// bottom of the tile so it compresses onto the floor rather than around its
// own middle. Runs on the shell image, never the tile, because the tile's own
// transform is carrying its board position.
const landSquash = keyframes`
  0%   { transform: scale(1, 1); }
  32%  { transform: scale(1.13, 0.83); }
  64%  { transform: scale(0.97, 1.04); }
  100% { transform: scale(1, 1); }
`;

// The break itself, in ocean blue: a bright foam-white core going straight out
// through shallow water to deep sea, so a shatter reads as something bursting
// underwater rather than catching fire.
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

// A shatter's word: punched in oversized, snapped back to its own size, then
// carried up off the board as it fades. The centring translate has to be part
// of every frame — the element is positioned by its own centre, and a keyframe
// that set only scale would drop that and fling the word to the corner.
const praisePop = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.35) rotate(-8deg); }
  16%  { opacity: 1; transform: translate(-50%, -52%) scale(1.22) rotate(3deg); }
  30%  { opacity: 1; transform: translate(-50%, -52%) scale(0.96) rotate(-1deg); }
  42%  { opacity: 1; transform: translate(-50%, -54%) scale(1.04) rotate(0deg); }
  70%  { opacity: 1; transform: translate(-50%, -78%) scale(1.02); }
  100% { opacity: 0; transform: translate(-50%, -128%) scale(0.9); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
`;

// A single highlight travelling the length of the filled part and away, with a
// long dead gap before it comes round again — a glass-and-sugar catch of the
// light, not the old barber's pole of stripes crawling nonstop.
const barSheen = keyframes`
  0%, 62%  { transform: translateX(-120%) skewX(-18deg); }
  86%, 100% { transform: translateX(520%) skewX(-18deg); }
`;

// The bar's leading edge, breathing. Gives the fill a live end even when the
// player hasn't scored for a while.
const capPulse = keyframes`
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.95; }
  50%      { transform: translate(-50%, -50%) scale(1.22); opacity: 1; }
`;

const dotPop = keyframes`
  0%   { transform: scale(0.5) rotate(-25deg); }
  55%  { transform: scale(1.35) rotate(8deg); }
  78%  { transform: scale(0.94) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
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
  box-sizing: border-box;
  height: 24px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(12, 48, 62, 0.3) 0%, rgba(12, 48, 62, 0.16) 100%);
  border: 2px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    inset 0 3px 7px rgba(0, 0, 0, 0.3),
    0 2px 0 rgba(255, 255, 255, 0.55),
    0 4px 12px rgba(0, 0, 0, 0.12);
  margin-top: 6px;
  margin-bottom: 34px;
`;

export const BarFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 999px;
  overflow: hidden;
  /* Sized to the track, not to itself, so the sweet-shop gradient stays put as
     the bar grows instead of dragging its own colours along behind the head. */
  background-image: linear-gradient(
    90deg,
    #ff8fd0 0%,
    #ff5fa2 30%,
    #ff8a45 62%,
    #ffc93f 84%,
    #ffe96b 100%
  );
  background-repeat: no-repeat;
  /* Slow enough to be watchable and eased so it arrives rather than stops —
     the old 320ms linear-ish slide was over before it read as anything. */
  transition: width 560ms cubic-bezier(0.22, 1, 0.36, 1);

  /* Sugar-glass: a bright band across the top half, a shadow along the floor. */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.12) 46%, rgba(255, 255, 255, 0) 58%),
      linear-gradient(0deg, rgba(120, 20, 60, 0.28) 0%, rgba(120, 20, 60, 0) 40%);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 22%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0) 100%);
    animation: ${barSheen} 3.4s ease-in-out infinite;
  }
`;

// The fill's head: a bright bead sitting on the leading edge, pulsing. Hidden
// at zero, where there's no edge for it to sit on.
export const BarCap = styled.div`
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, #fff 26%, #ffe9a8 58%, rgba(255, 233, 168, 0) 78%);
  box-shadow: 0 0 14px rgba(255, 214, 120, 0.95);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: left 560ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease;
  animation: ${capPulse} 1.4s ease-in-out infinite;
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

// A gumdrop on the rail rather than a numbered stop: unreached it's a pale
// sweet waiting to be taken, reached it's a glossy filled one with a tick. The
// last checkpoint is the jackpot, so it sits a size up.
export const CheckpointDot = styled.div`
  box-sizing: border-box;
  width: ${({ $final }) => ($final ? 28 : 22)}px;
  height: ${({ $final }) => ($final ? 28 : 22)}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $final }) => ($final ? 14 : 11)}px;
  font-weight: 900;
  color: #b3541e;
  border: 3px solid #fff;
  background: ${({ $reached }) =>
    $reached
      ? "radial-gradient(circle at 34% 28%, #fff6cf 0%, #ffd45e 52%, #ffab2e 100%)"
      : "radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.42) 60%, rgba(255, 255, 255, 0.25) 100%)"};
  box-shadow:
    0 2px 5px rgba(0, 0, 0, 0.3),
    ${({ $reached }) => ($reached ? "0 0 14px rgba(255, 196, 80, 0.85)" : "none")};
  transition: background 260ms ease, box-shadow 260ms ease;
  ${({ $reached }) => $reached && css`animation: ${dotPop} 420ms cubic-bezier(0.22, 1, 0.36, 1);`}
`;

export const CheckpointReward = styled.div`
  position: absolute;
  top: 100%;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: ${({ $final }) => ($final ? 12 : 10.5)}px;
  font-weight: 800;
  color: ${({ $reached }) => ($reached ? "#b3541e" : "rgba(18, 60, 74, 0.6)")};
  white-space: nowrap;
  transition: color 260ms ease;

  img {
    width: ${({ $final }) => ($final ? 14 : 12)}px;
    height: ${({ $final }) => ($final ? 14 : 12)}px;
    opacity: ${({ $reached }) => ($reached ? 1 : 0.75)};
  }
`;

// Escalating with the combo: each step is bigger and a stage louder in colour,
// ending somewhere ridiculous. Sizes are deliberately steep — "Insane" should
// barely fit on the board.
const PRAISE_STEPS = [
  { size: 30, color: "#5fd8ff" },
  { size: 38, color: "#3ee89b" },
  { size: 48, color: "#ffd63f" },
  { size: 60, color: "#ff9b2f" },
  { size: 74, color: "#ff5fa2" },
  { size: 90, color: "#b877ff" },
];

export const Praise = styled.div`
  position: absolute;
  z-index: 20;
  pointer-events: none;
  white-space: nowrap;
  font-weight: 900;
  font-style: italic;
  letter-spacing: -0.5px;
  line-height: 1;
  font-size: ${({ $level }) => PRAISE_STEPS[$level - 1].size}px;
  color: ${({ $level }) => PRAISE_STEPS[$level - 1].color};
  /* A drawn-behind white border rather than -webkit-text-stroke, which is
     painted centred over the glyph and eats into the colour at these weights.
     Eight offsets make a solid outline; the last shadow is the drop under it. */
  text-shadow:
    -3px -3px 0 #fff,  0 -3px 0 #fff,  3px -3px 0 #fff,
    -3px  0   0 #fff,                  3px  0   0 #fff,
    -3px  3px 0 #fff,  0  3px 0 #fff,  3px  3px 0 #fff,
    0 7px 12px rgba(6, 30, 44, 0.45);
  animation: ${praisePop} 1000ms cubic-bezier(0.22, 1, 0.36, 1) both;
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
  /* The frame inside is inline-level, so without this the wrapper keeps a few
     px of baseline gap under it — enough to push everything positioned against
     the wrapper (a praise word, the shuffle veil) off the board it's meant to
     line up with. */
  line-height: 0;
`;

// The board frame's own padding, needed in the component too — it's the offset
// between the board's own coordinates and the wrapper a praise word is placed
// in. Declared above BoardFrame because that template literal reads it as the
// module loads.
export const FRAME_PAD = 8;

// Purely decorative — the frame's own padding lives here, outside the grid's
// coordinate system entirely, so it can never throw off where a grid cell
// and the shell tile positioned on top of it land (that padding-vs-content-box
// mismatch was the actual cause of the shade/shell misalignment before).
export const BoardFrame = styled.div`
  display: inline-flex;
  border-radius: 16px;
  background: linear-gradient(160deg, #2a94a8 0%, #1f7a8c 60%, #176271 100%);
  box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.35), 0 8px 22px rgba(0, 0, 0, 0.3);
  padding: ${FRAME_PAD}px;
  /* The cursor belongs to the whole board, not to each shell. Set per tile it
     changed every time the pointer crossed one of the 6px gaps, which is most
     of the way across the board — a flicker that read as the board being
     half-interactive. Set here it's inherited by everything inside (rocks
     override it, being the one thing that genuinely can't be moved) and never
     changes on the way across. It stays put while a cascade resolves, too:
     the input guards already ignore those clicks, and a cursor blinking in
     and out several times a second would be the same flicker back again. */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
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

  /* The tile is one cell wide, but its grip reaches half a gap further on
     every side, so the gaps between shells belong to whichever shell is
     nearest instead of being dead space that swallows a press. Neighbouring
     grips meet exactly and never overlap. */
  &::before {
    content: "";
    position: absolute;
    inset: -${GAP / 2}px;
  }

  /* A drag on a touch screen has to be the board's gesture, not the page's —
     without this the browser claims the pull as a scroll and the swap never
     gets its move events. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
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
      /* Gravity's curve only — the duration is set inline per tile, since it
         depends on how far that particular tile drops (see fallDurationFor in
         ShellMatchGame.jsx). Accelerates from a standstill and stays fast into
         the landing, which is what a fall actually does; the bounce that used
         to live in an overshooting curve here now lives in the landing squash
         instead, because a curve's overshoot scales with distance — a
         six-row drop would have visibly punched through the board. */
      transition-timing-function: cubic-bezier(0.45, 0.02, 0.85, 1);
    `}

  ${({ $locked }) =>
    $locked &&
    css`
      cursor: default;
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
    rgba(198, 244, 255, 0.92) 22%,
    rgba(56, 178, 255, 0.7) 50%,
    rgba(12, 110, 190, 0) 78%
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
  border: 4px solid rgba(214, 246, 255, 0.9);
  box-shadow: 0 0 10px rgba(56, 178, 255, 0.6);

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

  /* The "both" fill is what makes this safe to attach for the whole fall:
     until its inline animation-delay elapses the shell holds the 0% frame, so
     the squash fires the instant this tile lands and not before. Must fit
     inside FALL_SETTLE_MS in ShellMatchGame.jsx, which is the only time the
     board waits after the last landing. */
  ${({ $landing }) =>
    $landing &&
    css`
      transform-origin: 50% 88%;
      animation: ${landSquash} 150ms ease-out both;
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
