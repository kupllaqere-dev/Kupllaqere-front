import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

export default function LoadingOverlay({ progress, ready }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [unmounted, setUnmounted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const fadeTimer = setTimeout(() => setFadingOut(true), 150);
    const unmountTimer = setTimeout(() => setUnmounted(true), 650);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [ready]);

  if (unmounted) return null;

  const pct = Math.max(0, Math.min(1, progress));
  const displayPct = ready ? 100 : Math.floor(pct * 100);

  return (
    <Overlay $fadingOut={fadingOut}>
      <Title>Neclis</Title>
      <BarTrack>
        <BarFill style={{ width: `${displayPct}%` }} />
      </BarTrack>
      <Percent>{displayPct}%</Percent>
    </Overlay>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: radial-gradient(ellipse at center, #1f1a3a 0%, #0c0a1a 100%);
  color: #fff;
  font-family: Quicksand, Nunito, Poppins, sans-serif;
  opacity: ${(p) => (p.$fadingOut ? 0 : 1)};
  transition: opacity 500ms ease-out;
  pointer-events: ${(p) => (p.$fadingOut ? "none" : "auto")};
  animation: ${fadeIn} 200ms ease-out;
`;

const Title = styled.div`
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 2px 12px rgba(255, 120, 200, 0.4);
`;

const BarTrack = styled.div`
  width: min(420px, 70vw);
  height: 14px;
  background: #ffffff18;
  border: 1px solid #ffffff33;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
`;

const BarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff7eb9 0%, #7afcff 100%);
  border-radius: 999px;
  transition: width 200ms ease-out;
  box-shadow: 0 0 12px rgba(255, 126, 185, 0.5);
`;

const Percent = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #ffffffbb;
  letter-spacing: 1px;
`;
