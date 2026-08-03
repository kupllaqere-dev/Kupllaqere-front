import styled from "styled-components";
import { WL_RARITY } from "../constants";
import { thinScrollbar } from "../styles";

export const WishlistPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const WishlistScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${thinScrollbar}
`;

export const WishlistMsg = styled.div`
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: ${"var(--pp-txt3)"};
`;

export const WishlistItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: var(--pp-gradCard);
  border: 1px solid ${"var(--pp-border)"};
  min-height: 88px;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

export const WishlistNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

export const WishlistRarityBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 2px 7px; border-radius: 4px;
  width: fit-content;
  background: ${p => WL_RARITY[p.$r]?.bg};
  border: 1px solid ${p => WL_RARITY[p.$r]?.border};
  color: ${p => WL_RARITY[p.$r]?.color};
`;

export const WishlistTag = styled.div`
  display: inline-block;
  flex-shrink: 0;
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.4px;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid rgba(var(--pp-accent-rgb),0.18);
  border-radius: 4px;
  padding: 2px 7px;
`;

export const WishlistRemoveBtn = styled.button`
  background: none; border: none; cursor: pointer; flex-shrink: 0;
  font-size: 13px; color: ${"var(--pp-txt3)"};
  padding: 4px 8px; border-radius: 6px; margin-right: 4px;
  transition: color .13s, background .13s;
  &:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
`;
