import styled, { css } from "styled-components";
import { thinScrollbar } from "../styles";

export const ProfileContent = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  ${thinScrollbar}
`;

export const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const SectionTitle = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

export const SectionCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  padding: 1px 6px;
  border-radius: 10px;
`;

export const SectionEditBtn = styled.button`
  all: unset;
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  cursor: pointer;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: color 0.2s;
  &:hover { color: ${"var(--pp-accentLt)"}; }
`;

export const BadgesScrollWrap = styled.div`
  overflow-x: auto;
  padding-bottom: 5px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--pp-accent-rgb),0.28); border-radius: 3px; }
`;

export const BadgesRow = styled.div`
  display: flex;
  gap: 9px;
  width: max-content;
`;

export const BadgeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 12px 9px;
  border-radius: 12px;
  border: 1px solid ${p => {
    if (p.$selected) return "rgba(var(--pp-accent-rgb),0.5)";
    if (p.$rarity === "legendary") return "rgba(234,179,8,0.38)";
    if (p.$rarity === "rare") return "rgba(59,130,246,0.28)";
    return "var(--pp-border)";
  }};
  background: ${p => p.$selected ? "rgba(var(--pp-accent-rgb),0.08)" : "var(--pp-surface)"};
  cursor: ${p => p.$clickable ? (p.$saving ? "wait" : "pointer") : "default"};
  min-width: 72px;
  position: relative;
  overflow: hidden;
  opacity: ${p => p.$saving ? 0.6 : 1};
  box-shadow: ${p => p.$selected ? "0 4px 14px rgba(var(--pp-accent-rgb),0.18)" : "0 1px 4px rgba(100,50,200,0.06)"};
  transition: box-shadow 0.2s, border-color 0.2s;
  &:hover {
    box-shadow: ${p => {
      if (!p.$clickable || p.$saving) return "none";
      return "0 6px 20px rgba(var(--pp-accent-rgb),0.18)";
    }};
  }
`;

export const BadgeCardIconWrap = styled.div`
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  ${BadgeCard}:hover & {
    transform: scale(1.22);
  }
`;

export const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

export const BadgeCardName = styled.div`
  font-size: 8.5px;
  font-weight: 700;
  color: ${"var(--pp-txt2)"};
  text-align: center;
`;

export const BadgeCardRarity = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${p => {
    if (p.$rarity === "legendary") return "#b45309";
    if (p.$rarity === "rare") return "#0369a1";
    return "var(--pp-txt3)";
  }};
`;

export const BadgeExpandBtn = styled.button`
  all: unset;
  align-self: flex-end;
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  padding: 0;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const CompanionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(var(--pp-accent-rgb),0.05), rgba(59,130,246,0.03));
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 14px;
  padding: 14px 16px;
`;

export const CompanionPetWrap = styled.div`position: relative; flex-shrink: 0;`;

export const CompanionPetAura = styled.div`
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--pp-accent-rgb),0.28) 0%, transparent 70%);
  animation: auraBreath 3.2s ease-in-out infinite;
  @keyframes auraBreath { 0%,100% { transform: scale(1); opacity: 0.48; } 50% { transform: scale(1.18); opacity: 0.9; } }
`;

export const CompanionPetEmoji = styled.span`
  font-size: 40px;
  line-height: 1;
  display: block;
  position: relative;
  z-index: 1;
  animation: petBounce 2.6s ease-in-out infinite;
  @keyframes petBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
`;

export const CompanionInfoBlock = styled.div`
  flex: 1; min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const CompanionNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const CompanionNameText = styled.span`font-size: 14px; font-weight: 800; color: ${"var(--pp-txt)"};`;

export const CompanionMoodText = styled.span`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const CompanionLevelText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  letter-spacing: 0.3px;
`;

export const CompanionXPWrap = styled.div`display: flex; flex-direction: column; gap: 4px;`;

export const XPBarOuter = styled.div`
  height: 5px;
  background: rgba(130,80,220,0.1);
  border-radius: 3px;
  overflow: hidden;
`;

export const XPBarFill = styled.div`
  height: 100%;
  width: var(--xp, 0%);
  background: linear-gradient(90deg, #5b21b6, #a855f7, #ec4899);
  border-radius: 3px;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.36) 50%, transparent 100%);
    background-size: 60px 100%;
    animation: xpShimmer 2s linear infinite;
    @keyframes xpShimmer { from { background-position: -60px 0; } to { background-position: 200px 0; } }
  }
`;

export const XPLabelsRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: ${"var(--pp-txt3)"};
  font-weight: 600;
`;

/* ── Bio Sections (Welcome / Info / Quote / Fun Facts) ── */

export const BioSectionsWrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: "Comic Sans MS", "Comic Sans", cursive;
`;

export const BioSection = styled.div`
  position: relative;
  flex: ${p => p.$flexGrow ?? 1} 1 0%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  transition: background 0.15s;
  background: ${p => p.$dragOver ? "rgba(var(--pp-accent-rgb),0.07)" : "transparent"};
  outline: ${p => p.$dragging ? "1.5px dashed rgba(var(--pp-accent-rgb),0.5)" : "none"};
  outline-offset: -1px;
`;

export const BioSectionHeaderRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const BioSectionDragHandle = styled.span`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  color: ${"var(--pp-txt3)"};
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
  &:active { cursor: grabbing; }
`;

const editableFieldCss = css`
  outline: none;
  border-radius: 4px;
  cursor: ${p => p.$editable ? "text" : "default"};
  ${p => p.$editable && css`
    &:hover { background: rgba(var(--pp-accent-rgb),0.05); }
    &:focus { background: rgba(var(--pp-accent-rgb),0.08); box-shadow: 0 0 0 1px rgba(var(--pp-accent-rgb),0.3); }
  `}
`;

export const BioSectionTitle = styled.h3`
  margin: 0;
  font-family: "Cormorant Infant", serif;
  font-size: 24px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.5px;
  text-align: center;
  color: #ffffff;
  ${editableFieldCss}
`;

export const BioSectionSeparator = styled.div`
  height: 1px;
  width: 100%;
  margin: 8px 0;
  background: ${"var(--pp-border2)"};
  flex-shrink: 0;
`;

export const BioSectionText = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 12.5px;
  line-height: 1.6;
  text-align: center;
  color: #ffffff;
  white-space: pre-wrap;
  ${editableFieldCss}
`;

export const InfoColumnsRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
`;

export const InfoColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InfoColumnTitle = styled.div`
  font-family: "Cormorant Infant", serif;
  font-size: 18px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.4px;
  text-align: center;
  color: #ffffff;
  ${editableFieldCss}
`;

export const InfoColumnSeparator = styled.div`
  height: 1px;
  width: 100%;
  margin: 6px 0;
  background: ${"var(--pp-border)"};
  flex-shrink: 0;
`;

export const InfoColumnLine = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 11.5px;
  line-height: 1.6;
  text-align: center;
  color: #ffffff;
  ${editableFieldCss}
`;

export const ColumnDivider = styled.div`
  width: 1px;
  align-self: stretch;
  flex-shrink: 0;
  margin: 0 8px;
  background: linear-gradient(to bottom,
    transparent 0%,
    ${"var(--pp-border2)"} 18%,
    ${"var(--pp-border2)"} 82%,
    transparent 100%);
`;

export const FunFactsRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 16px;
`;

export const FunFactItem = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
`;

export const FunFactSymbol = styled.div`
  font-size: 22px;
  line-height: 1;
  ${editableFieldCss}
`;

export const FunFactText = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 11.5px;
  line-height: 1.5;
  color: #ffffff;
  ${editableFieldCss}
`;
