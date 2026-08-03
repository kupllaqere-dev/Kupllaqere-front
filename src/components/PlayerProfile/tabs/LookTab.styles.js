import styled from "styled-components";
import { thinScrollbar } from "../styles";

export const LookPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const LookScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${thinScrollbar}
`;

export const LookGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

export const LookFeatureCard = styled.div`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  padding: 13px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const LookFeatureLabel = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

export const LookSlotsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const LookSlotWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

export const LookSlot = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background: ${"var(--pp-card)"};
  border: 1px dashed ${"var(--pp-border2)"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  position: relative;
  overflow: hidden;
  &:hover {
    border-style: solid;
    border-color: ${"var(--pp-accent)"};
    background: rgba(var(--pp-accent-rgb),0.1);
    box-shadow: 0 0 12px rgba(var(--pp-accent-rgb),0.14);
  }
`;

export const LookSlotPlus = styled.span`
  font-size: 22px;
  color: ${"var(--pp-txt3)"};
  line-height: 1;
  pointer-events: none;
  ${LookSlot}:hover & { color: ${"var(--pp-accent)"}; }
`;

export const LookSlotSubLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const LookSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const LookSliderLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${"var(--pp-txt2)"};
  min-width: 42px;
`;

export const LookSlider = styled.input`
  flex: 1;
  accent-color: ${"var(--pp-accent)"};
  cursor: pointer;
  height: 4px;
`;

export const LookSliderValue = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  min-width: 28px;
  text-align: right;
`;

export const LookSlotImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  pointer-events: none;
`;

export const LookPickerRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0 2px;
  ${thinScrollbar}
  scrollbar-width: thin;
  &::-webkit-scrollbar { height: 3px; }
`;

export const LookPickerXBtn = styled.button`
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1.5px solid rgba(220,38,38,0.3);
  background: rgba(220,38,38,0.07);
  color: #dc2626;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.13s, border-color 0.13s;
  &:hover { background: rgba(220,38,38,0.15); border-color: rgba(220,38,38,0.55); }
`;

export const LookPickerThumb = styled.img`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 8px;
  background: ${"var(--pp-card)"};
  border: 1.5px solid ${({ $selected }) => $selected ? "var(--pp-accent)" : "var(--pp-border)"};
  box-shadow: ${({ $selected }) => $selected ? "0 0 0 2px rgba(var(--pp-accent-rgb),0.22)" : "none"};
  cursor: pointer;
  transition: border-color 0.14s, transform 0.1s, box-shadow 0.14s;
  &:hover { border-color: ${"var(--pp-accent)"}; transform: scale(1.07); }
`;

export const LookPickerEmpty = styled.div`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  font-style: italic;
  white-space: nowrap;
  padding: 4px 2px;
`;
