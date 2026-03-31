import styled from "styled-components";

export const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
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

export const Spacer = styled.div`
  flex: 1;
`;

export const StatsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  pointer-events: all;
`;

export const LevelBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LevelLabel = styled.span`
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
`;

export const LevelTrack = styled.div`
  width: 100px;
  height: 10px;
  background: #111;
  border-radius: 5px;
  border: 1px solid #ffffff22;
  overflow: hidden;
`;

export const LevelFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #f0c040, #f5a623);
  border-radius: 5px;
  transition: width 0.3s ease;
`;

export const Currency = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;

  img {
    width: 20px;
    height: 20px;
  }
`;

export const AngelButton = styled.button`
  background: linear-gradient(135deg, #7b2ff7, #c471ed);
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(123, 47, 247, 0.4);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(123, 47, 247, 0.6);
  }

  &:active {
    transform: scale(0.97);
  }
`;

export const LogoutButton = styled.button`
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border: 1px solid #ffffff22;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(145deg, #3a2a2a, #2a1a1a);
    color: #ff8888;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;
