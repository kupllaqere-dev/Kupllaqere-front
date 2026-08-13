import styled from "styled-components";
import { thinScrollbar } from "../styles";

export const LookPanelInner = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: 14px;
  border: 2px solid ${"var(--pp-accent)"};
  border-radius: 14px;
  box-shadow: 0 0 14px rgba(var(--pp-accent-rgb),0.35), inset 0 0 10px rgba(var(--pp-accent-rgb),0.08);
`;

export const LookSidebar = styled.div`
  flex-shrink: 0;
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  ${thinScrollbar}
`;

export const LookNavDivider = styled.div`
  flex-shrink: 0;
  height: 2px;
  margin: 2px 4px;
  background: linear-gradient(
    to right,
    transparent,
    ${"var(--pp-accent)"} 50%,
    transparent
  );
`;

export const LookNavIcon = styled.span`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  background-color: #fff;
  -webkit-mask-image: ${({ $src }) => `url(${$src})`};
  mask-image: ${({ $src }) => `url(${$src})`};
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
`;

export const LookNavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 15px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: ${({ $active }) => $active ? "rgba(var(--pp-accent-rgb),0.12)" : "transparent"};
  border-color: ${({ $active }) => $active ? "var(--pp-accent)" : "transparent"};
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.14s, border-color 0.14s;
  &:hover {
    background: rgba(var(--pp-accent-rgb),0.1);
  }
`;

export const LookContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 2px solid ${"var(--pp-accent)"};
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
  box-shadow: inset 4px 0 10px -6px rgba(var(--pp-accent-rgb),0.5);
`;

export const LookScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  ${thinScrollbar}
`;

export const LookGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 12px;
`;

// Takes the leftover height under the item grid and centers the swatches in it.
export const LookColorSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Fixed 10-wide grid so the 40 feature colors always land on exactly 4 rows.
export const LookColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 46px);
  gap: 7px;
`;

export const LookItemCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

export const LookItemThumb = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  background: ${"var(--pp-card)"};
  border: 1.5px solid ${({ $selected }) => $selected ? "var(--pp-accent)" : "var(--pp-border)"};
  box-shadow: ${({ $selected }) => $selected ? "0 0 0 2px rgba(var(--pp-accent-rgb),0.22)" : "none"};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.1s;
  &:hover {
    border-color: var(--pp-accent);
    transform: scale(1.03);
  }
`;

export const LookItemImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
`;

export const LookItemName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $selected }) => $selected ? "var(--pp-accent)" : "var(--pp-txt2)"};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export const LookColorSwatch = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 9px;
  background: ${({ $color }) => $color};
  border: 1.5px solid ${({ $selected }) => $selected ? "var(--pp-accent)" : "var(--pp-border)"};
  box-shadow: ${({ $selected }) => $selected ? "inset 0 0 0 2px rgba(var(--pp-accent-rgb),0.5)" : "none"};
  cursor: pointer;
  transition: border-color 0.14s, box-shadow 0.14s;
  &:hover {
    border-color: var(--pp-accent);
    box-shadow: inset 0 0 0 2px rgba(var(--pp-accent-rgb),0.35);
  }
`;

export const LookPlaceholderThumb = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  background: ${"var(--pp-card)"};
  border: 1.5px dashed ${"var(--pp-border)"};
  opacity: 0.5;
`;

export const LookPageNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
`;

export const LookPageArrow = styled.button`
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1.5px solid ${"var(--pp-border)"};
  background: ${"var(--pp-card)"};
  color: ${"var(--pp-txt2)"};
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.14s, color 0.14s, background 0.14s;
  &:hover:not(:disabled) {
    border-color: var(--pp-accent);
    color: var(--pp-accent);
    background: rgba(var(--pp-accent-rgb),0.1);
  }
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

export const LookPageLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  min-width: 46px;
  text-align: center;
`;

export const LookEmptyMsg = styled.div`
  font-size: 12px;
  color: ${"var(--pp-txt3)"};
  font-style: italic;
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
