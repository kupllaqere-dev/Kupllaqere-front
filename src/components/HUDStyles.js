import styled from "styled-components";

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

export const NavGroup = styled.div`
  position: absolute;
  top: 100px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: all;
`;

export const NavBubbleWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

export const NavButton = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  min-width: 130px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(28, 28, 28, 0.88), rgba(18, 18, 18, 0.88));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: all 0.18s ease;
  color: #e8e8e8;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;

  img {
    width: 22px;
    height: 22px;
    filter: brightness(1.8);
    flex-shrink: 0;
  }

  .nav-emoji {
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
  }

  &:hover {
    background: linear-gradient(145deg, rgba(42, 42, 42, 0.92), rgba(28, 28, 28, 0.92));
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55);
    transform: translateX(4px);
    color: #fff;
  }

  &:active {
    transform: translateX(2px) scale(0.97);
  }
`;

export const PlayerBox = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(160deg, rgba(22, 22, 22, 0.9), rgba(14, 14, 14, 0.9));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 12px 14px;
  min-width: 210px;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.55);
  pointer-events: all;
`;

export const PlayerBoxTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const AvatarFrame = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 0 14px rgba(123, 47, 247, 0.25);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const PlayerName = styled.div`
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const LevelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const PlayerLevel = styled.div`
  color: #f0c040;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

export const LevelTrack = styled.div`
  width: 100%;
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

export const CurrencyRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  width: 100%;
  justify-content: center;
`;

export const Currency = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #e8e8e8;
  font-size: 12px;
  font-weight: 600;

  img {
    width: 16px;
    height: 16px;
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
  background: linear-gradient(145deg, rgba(28, 28, 28, 0.9), rgba(18, 18, 18, 0.9));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;

  img {
    width: 26px;
    height: 26px;
    filter: brightness(1.8);
  }

  &:hover {
    background: linear-gradient(145deg, rgba(42, 42, 42, 0.95), rgba(28, 28, 28, 0.95));
    transform: scale(1.06);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
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

export const FullscreenButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #aaa;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    color: #ccc;
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
