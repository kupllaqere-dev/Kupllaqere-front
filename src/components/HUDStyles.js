import styled from "styled-components";

export const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 70%;
  pointer-events: none;
`;

export const Bar = styled.div`
  width: 100%;
  height: 80px;
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;

  .orb-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: -70px;
    margin-left: -30px;
  }

  /* 🔴 THE PULSE */
  .orb-pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;

    background: radial-gradient(
      circle,
      rgba(211, 208, 10, 0.88) 0%,
      rgba(189, 164, 24, 0.86) 40%,
      transparent 80%
    );
    filter: blur(8px);

    animation: pulse 12s infinite ease-in-out;
  }

  /* 🔴 SECOND LAYER (more depth) */
  .orb-pulse::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;

    background: radial-gradient(
      circle,
      rgba(255, 50, 50, 0.4) 0%,
      transparent 70%
    );
    filter: blur(12px);

    animation: pulse 12s infinite ease-in-out reverse;
  }

  /* 👤 YOUR ICON */
  .orb-icon {
    position: relative;
    width: 70%;
    height: 70%;
    z-index: 2;
  }

  /* ✨ ANIMATION */
  @keyframes pulse {
    0% {
      transform: scale(0.9);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.3;
    }
    100% {
      transform: scale(0.9);
      opacity: 0.7;
    }
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  pointer-events: all; /* enable clicking on buttons */
`;

export const ProfileWrapper = styled.div`
  position: relative;
`;

export const Dropdown = styled.div`
  position: absolute;
  top: 60px; /* space below the main bubble */
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  flex-direction: column;
  gap: 10px;

  padding: 10px;
`;

export const Bubble = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;

  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.1);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 22px;
  cursor: pointer;

  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow:
      0 6px 14px rgba(0, 0, 0, 0.7),
      inset 0 1px 3px rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }

  img {
    width: 32px;
    height: 32px;
    filter: brightness(2);
  }
`;
