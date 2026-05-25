import styled, { keyframes } from "styled-components";

const goldPulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(255, 200, 40, 0.5), 0 0 20px rgba(255, 180, 0, 0.25); opacity: 0.88; text-shadow: 0 0 4px rgba(255,255,255,0.3); }
  50%       { box-shadow: 0 0 18px rgba(255, 210, 60, 0.95), 0 0 40px rgba(255, 180, 0, 0.6), 0 0 60px rgba(255, 160, 0, 0.3); opacity: 1; text-shadow: 0 0 10px rgba(255,255,255,0.85); }
`;

export const Container = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const LogoWrapper = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  pointer-events: none;

  .logo-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    display: block;
  }
`;

export const TopBar = styled.div`
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  pointer-events: none;
`;

export const SidePanel = styled.div`
  background: linear-gradient(160deg, rgba(80, 35, 170, 0.42), rgba(45, 12, 120, 0.5));
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  width: 240px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  pointer-events: all;
  gap: 6px;
  box-shadow:
    0 6px 30px rgba(70, 20, 180, 0.35),
    0 8px 16px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12);
`;

export const PlayerCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
  pointer-events: none;
`;

export const AvatarFrame = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid rgba(180, 120, 255, 0.55);
  box-shadow:
    0 0 0 1px rgba(180, 120, 255, 0.15),
    0 0 20px rgba(123, 47, 247, 0.5);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
`;

export const PlayerName = styled.div`
  color: rgba(240, 225, 255, 0.97);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  margin-bottom: 2px;
`;

export const LevelSection = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const PlayerLevel = styled.div`
  color: #f0c040;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

export const LevelTrack = styled.div`
  width: 80px;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
`;

export const LevelFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #f0c040, #f5a623);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

export const CurrencyCol = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

export const Currency = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(225, 205, 255, 0.9);
  font-size: 13px;
  font-weight: 600;

  img {
    width: 18px;
    height: 18px;
  }
`;

export const NavBubbleWrapper = styled.div`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
`;

export const NavButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(90, 40, 180, 0.38), rgba(50, 15, 120, 0.45));
  backdrop-filter: blur(16px);
  border: 1px solid #fff;
  box-shadow:
    0 4px 20px rgba(70, 20, 180, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  flex-shrink: 0;

  span {
    display: none;
  }

  img {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  }

  .nav-emoji {
    display: flex;
    font-size: 20px;
    line-height: 1;
  }

  &:hover {
    background: linear-gradient(145deg, rgba(110, 55, 210, 0.5), rgba(70, 25, 160, 0.55));
    border-color: #fff;
    box-shadow:
      0 6px 28px rgba(90, 30, 220, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      inset 0 -1px 0 rgba(0, 0, 0, 0.12);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }
`;

export const SettingsWrapper = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  pointer-events: all;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

export const BottomButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const SettingsBtn = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(90, 40, 180, 0.38), rgba(50, 15, 120, 0.45));
  backdrop-filter: blur(16px);
  border: 1px solid #fff;
  box-shadow:
    0 4px 20px rgba(70, 20, 180, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  img {
    width: 26px;
    height: 26px;
    filter: brightness(0) invert(1);
  }

  &:hover {
    background: linear-gradient(145deg, rgba(110, 55, 210, 0.5), rgba(70, 25, 160, 0.55));
    border-color: #fff;
    box-shadow:
      0 6px 28px rgba(90, 30, 220, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      inset 0 -1px 0 rgba(0, 0, 0, 0.12);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }
`;

export const Dropdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: linear-gradient(145deg, #252525, #191919);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.65);
`;

export const LogoutButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ff6b6b;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(255, 80, 80, 0.1);
    color: #ff9090;
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

export const NotifBadge = styled.div`
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 16px;
  height: 16px;
  background: #e03131;
  border-radius: 8px;
  border: 2px solid rgba(18, 18, 18, 0.9);
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
  z-index: 1;
`;

export const SearchPopover = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border: 1px solid #ffffff22;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
`;

export const SearchInput = styled.input`
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #ffffff22;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #666; }
`;

export const SearchHint = styled.div`
  font-size: 11px;
  color: ${({ $error }) => ($error ? "#ff7777" : "#888")};
  min-height: 14px;
`;

export const AngelStrip = styled.button`
  background: rgba(190, 138, 12, 0.92);
  border: 1px solid rgba(255, 210, 80, 0.65);
  border-top: none;
  border-radius: 0 0 12px 12px;
  margin: 0 10px;
  padding: 6px 14px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  text-align: center;
  font-family: inherit;
  animation: ${goldPulse} 2s ease-in-out infinite;

  &:hover {
    animation: none;
    background: rgba(215, 158, 18, 0.96);
    box-shadow: 0 0 14px rgba(255, 210, 60, 0.6);
    opacity: 1;
  }

  &:active {
    background: linear-gradient(90deg, rgba(220, 160, 40, 0.85), rgba(255, 195, 50, 0.9));
  }
`;
