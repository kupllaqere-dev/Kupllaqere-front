import styled from "styled-components";
import { glassShine } from "../styles";

export const ClubPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
`;

export const ClubSection = styled.div`
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(var(--pp-accent-rgb), 0.08);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 14px;
`;

export const ClubSectionTitle = styled.div`
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${"var(--pp-txt3)"};
`;

export const ClubCard = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`;

export const ClubAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(var(--pp-accent-rgb), 0.12);
  border: 1px solid ${"var(--pp-border2)"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

export const ClubInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ClubName = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
`;

export const ClubNameMark = styled.span`
  font-size: 11px;
  color: ${"var(--pp-accent)"};
`;

export const ClubRole = styled.div`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
`;

export const ClubViewBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  padding: 9px 0;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb), 0.08);
  border: 1px solid ${"var(--pp-border2)"};
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.18s;
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover {
    background: rgba(var(--pp-accent-rgb), 0.15);
    border-color: ${"var(--pp-accent)"};
  }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;
