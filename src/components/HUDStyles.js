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

const dropIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.92);
  }
  60% {
    opacity: 1;
    transform: translateY(3px) scale(1.01);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const PANEL_BG = "#3b1478";
const PANEL_BG_HOVER = "#4d1f9c";

// Avatar geometry — the arc buttons are positioned from these in HUD.jsx
export const AVATAR_SIZE = 138; // 1.5x the previous 92px thumbnail
export const RING_SIZE = 162; // outer ring: avatar + its own background band
export const ARC_BTN = 46; // matches the membership badge
// Centres sit on the ring's rim, so the buttons straddle its edge and overlap
// the avatar the same way the membership badge does.
export const ARC_RADIUS = RING_SIZE / 2;

export const PanelStack = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  z-index: 5;
`;

export const AvatarRing = styled.div`
  position: relative;
  pointer-events: all;
  cursor: pointer;
  box-sizing: border-box;
  width: ${RING_SIZE}px;
  height: ${RING_SIZE}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${PANEL_BG};
  border: 2px solid rgba(255, 255, 255, 0.55);
  transition: filter 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: rgba(235, 210, 255, 0.95);
    box-shadow:
      0 0 10px rgba(180, 120, 255, 0.75),
      0 0 26px rgba(140, 70, 245, 0.5);
  }

  &:active {
    filter: brightness(0.55) saturate(0.8);
    transform: scale(0.98);
  }
`;

export const AvatarFrame = styled.div`
  width: ${AVATAR_SIZE}px;
  height: ${AVATAR_SIZE}px;
  border-radius: 50%;
  border: 2px solid rgba(180, 120, 255, 0.75);
  background: rgba(0, 0, 0, 0.22);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const ArcButton = styled.div`
  position: absolute;
  width: ${ARC_BTN}px;
  height: ${ARC_BTN}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${PANEL_BG};
  border: 2px solid rgba(255, 255, 255, 0.85);
  color: #fff;
  cursor: pointer;
  pointer-events: all;
  box-sizing: border-box;
  transition: background 0.2s ease, transform 0.15s ease;
  animation: ${dropIn} 0.32s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  animation-delay: ${({ $index }) => $index * 70}ms;

  img {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  }

  .nav-emoji {
    font-size: 21px;
    line-height: 1;
  }

  &:hover {
    background: ${PANEL_BG_HOVER};
  }

  &:active {
    transform: scale(0.94);
  }
`;

export const NameBlock = styled.div`
  width: 112px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 6px;
  pointer-events: none;
`;

export const PlayerName = styled.div`
  color: rgba(240, 225, 255, 0.97);
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85);
`;

export const LevelSection = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const PlayerLevel = styled.div`
  color: #f0c040;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85);
`;

export const LevelTrack = styled.div`
  width: 60px;
  height: 8px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  box-sizing: border-box;
`;

export const LevelFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #f0c040, #f5a623);
  border-radius: 3px;
  transition: width 0.3s ease;
`;

export const MembershipBadge = styled.div`
  position: absolute;
  left: -2px;
  bottom: 6px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: ${PANEL_BG};
  border: 2px solid rgba(255, 255, 255, 0.65);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MembershipIcon = styled.div`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background-color: ${({ $active }) => ($active ? "#3fd469" : "#8b8b99")};
  -webkit-mask: url("/assets/membership/membership.png") center / contain no-repeat;
  mask: url("/assets/membership/membership.png") center / contain no-repeat;
  transition: background-color 0.25s ease, filter 0.25s ease;
  filter: ${({ $active }) => ($active ? "drop-shadow(0 0 6px rgba(63, 212, 105, 0.75))" : "none")};
`;

export const CurrencyGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 160px;
  flex-shrink: 0;
`;

export const Currency = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(240, 228, 255, 0.97);
  font-size: 19px;
  font-weight: 700;

  img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
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
  background: ${PANEL_BG};
  border: 1px solid #fff;
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
    background: ${PANEL_BG_HOVER};
    border-color: #fff;
  }

  &:active {
    transform: scale(0.94);
  }
`;

export const MembershipToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${({ $active }) => ($active ? "rgba(63, 212, 105, 0.16)" : "transparent")};
  border: 1px solid ${({ $active }) => ($active ? "rgba(63, 212, 105, 0.55)" : "rgba(255, 255, 255, 0.18)")};
  color: ${({ $active }) => ($active ? "#6ff09a" : "#cfc2e8")};
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${({ $active }) => ($active ? "#3fd469" : "#8b8b99")};
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(63, 212, 105, 0.24)" : "rgba(255, 255, 255, 0.08)")};
  }
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

export const MenuDropdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 190px;
  box-sizing: border-box;
  background: #250c50;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  padding: 8px;
  pointer-events: all;
  animation: ${dropIn} 0.25s cubic-bezier(0.34, 1.4, 0.64, 1) both;
`;

export const NotifBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 22px;
  height: 22px;
  background: #e03131;
  border-radius: 11px;
  border: 2px solid rgba(18, 18, 18, 0.9);
  font-size: 11px;
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
