import styled from "styled-components";
import { thinScrollbar } from "../styles";

export const ThemePanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ThemeGrid = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-content: start;
  ${thinScrollbar}
`;

export const ThemeSwatch = styled.button`
  all: unset;
  box-sizing: border-box;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${p => p.$active ? p.$accent : "transparent"};
  box-shadow: ${p => p.$active ? `0 0 0 2px ${p.$accent}44, 0 4px 14px ${p.$accent}33` : "0 2px 8px rgba(0,0,0,0.08)"};
  transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
  background: ${p => p.$bg};
  display: flex;
  flex-direction: column;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.14); }
`;

export const ThemeSwatchTop = styled.div`
  height: 44px;
  background: ${p => p.$card};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 10px;
`;

export const ThemeSwatchDot = styled.div`
  width: 10px; height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

export const ThemeSwatchBottom = styled.div`
  padding: 8px 10px 9px;
  background: ${p => p.$bg};
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const ThemeSwatchName = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${p => p.$txt};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ThemeSwatchBar = styled.div`
  height: 3px;
  border-radius: 2px;
  background: ${p => p.$accent};
  width: ${p => p.$w || "60%"};
  opacity: 0.7;
`;
