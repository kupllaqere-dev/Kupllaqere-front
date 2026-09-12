import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

// How long the banner holds at full size before it starts fading, and how long
// the fade runs (kept in sync with the `fadeOut` keyframes below).
const VISIBLE_MS = 2200;
const EXIT_MS = 520;

const punchIn = keyframes`
  from { opacity: 0; transform: scale(0.72); letter-spacing: 32px; }
  55%  { opacity: 1; transform: scale(1.06); letter-spacing: 8px; }
  to   { opacity: 1; transform: scale(1);    letter-spacing: 12px; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const bandIn = keyframes`
  from { opacity: 0; transform: scaleX(0.2); }
  to   { opacity: 1; transform: scaleX(1); }
`;

const shimmer = keyframes`
  0%, 100% { filter: drop-shadow(0 0 18px rgba(255, 190, 40, 0.55)); }
  50%      { filter: drop-shadow(0 0 38px rgba(255, 215, 90, 0.95)); }
`;

// The vertical taper now lives on the band itself: a mask here would fade the
// rules that bound it, which are meant to read as crisp lines.
const Banner = styled.div`
  position: absolute;
  /* Centred on the upper fifth of the screen, clear of the avatar and the HUD. */
  top: 20%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 60;
  padding: 48px 0;
  animation: ${({ $leaving }) => ($leaving ? fadeOut : "none")}
    ${EXIT_MS}ms ease-in forwards;
`;

// A grey bar behind the letters so they read over any map. The fill tapers off
// towards the top and bottom, and one mask fades the whole thing — fill and
// rules alike — out to nothing at the left and right ends.
const Band = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 160px;
  background: linear-gradient(
    to bottom,
    rgba(42, 42, 48, 0.12) 0%,
    rgba(52, 52, 60, 0.72) 32%,
    rgba(58, 58, 66, 0.82) 50%,
    rgba(52, 52, 60, 0.72) 68%,
    rgba(42, 42, 48, 0.12) 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.5) 12%,
    #000 30%,
    #000 70%,
    rgba(0, 0, 0, 0.5) 88%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.5) 12%,
    #000 30%,
    #000 70%,
    rgba(0, 0, 0, 0.5) 88%,
    transparent 100%
  );
  animation: ${bandIn} 420ms cubic-bezier(0.2, 0.9, 0.3, 1) both;

  /* The rules along the top and bottom edges. */
  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(196, 196, 208, 0.85);
  }

  &::before {
    top: 0;
  }

  &::after {
    bottom: 0;
  }
`;

const Text = styled.div`
  position: relative;
  font-family: var(--heading);
  font-size: 104px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 12px;
  /* The tracking pushes the last letter off-centre; pull it back. */
  text-indent: 12px;
  white-space: nowrap;
  background: linear-gradient(
    to bottom,
    #fff7d6 0%,
    #ffd75e 38%,
    #ffa617 62%,
    #ffe89a 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-stroke: 2px rgba(70, 24, 0, 0.55);
  paint-order: stroke fill;
  animation:
    ${punchIn} 560ms cubic-bezier(0.16, 1, 0.3, 1) both,
    ${shimmer} 1600ms ease-in-out 560ms infinite;
`;

const LevelNumber = styled.span`
  margin-left: 0.06em;
`;

// `trigger` is a counter: every increment plays the banner once, so repeated
// level-ups (or repeated dev-button presses) restart it instead of being
// swallowed by an already-true boolean.
export default function LevelUpNotification({ trigger, level }) {
  // `level` is snapshotted per run: the banner keeps showing the level it
  // announced even if another payload moves the number while it is fading.
  const [run, setRun] = useState({ id: 0, leaving: false, showing: false, level: null });
  const [seenTrigger, setSeenTrigger] = useState(trigger);

  // Adjusted during render so a new trigger paints the first animation frame
  // immediately instead of one commit late.
  if (trigger !== seenTrigger) {
    setSeenTrigger(trigger);
    // `id` remounts the animated nodes, so a re-trigger replays from frame one.
    if (trigger) {
      setRun((prev) => ({ id: prev.id + 1, leaving: false, showing: true, level }));
    }
  }

  const runId = run.id;
  useEffect(() => {
    if (!runId) return undefined;
    const timers = [];
    timers.push(
      setTimeout(() => {
        setRun((prev) => (prev.id === runId ? { ...prev, leaving: true } : prev));
        timers.push(
          setTimeout(() => {
            setRun((prev) => (prev.id === runId ? { ...prev, showing: false } : prev));
          }, EXIT_MS),
        );
      }, VISIBLE_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [runId]);

  if (!run.showing) return null;

  return (
    <Banner key={run.id} $leaving={run.leaving}>
      <Band />
      <Text>
        LEVEL UP
        {run.level != null && <LevelNumber>{run.level}</LevelNumber>}
      </Text>
    </Banner>
  );
}
