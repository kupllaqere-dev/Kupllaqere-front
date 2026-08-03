import styled from "styled-components";
import { glassShine, thinScrollbar } from "../styles";

export const InvContentCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const InvCatScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  ${thinScrollbar}
`;

export const InvCatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const InvCatCard = styled.div`
  position: relative;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 4px 18px rgba(100,50,200,0.1); }
`;

export const InvCatDeco = styled.img`
  position: absolute;
  z-index: 1;
  right: -8px;
  bottom: 0;
  height: 78%;
  width: auto;
  object-fit: contain;
  opacity: 0.07;
  filter: saturate(0);
  pointer-events: none;
  transition: transform 0.2s;
  ${InvCatCard}:hover & { transform: translateX(-4px) scale(1.05); }
`;

export const InvCatCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid ${"var(--pp-border)"};
  background: rgba(var(--pp-accent-rgb),0.05);
  transition: background 0.13s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.1); }
`;

export const InvCatLabel = styled.span`font-size: 15px; font-weight: 700; color: ${"var(--pp-txt)"}; flex: 1;`;
export const InvCatArrow = styled.span`font-size: 14px; color: ${"var(--pp-txt3)"}; transition: transform 0.13s; ${InvCatCardTop}:hover & { transform: translateX(2px); }`;

export const InvCatSubList = styled.div`padding: 8px 14px 10px; display: flex; flex-direction: column; gap: 1px;`;

export const InvCatSubItem = styled.div`
  font-size: 13px;
  color: ${"var(--pp-txt2)"};
  padding: 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  font-weight: 600;
  transition: color 0.1s;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const InvSubCount = styled.span`font-size: 11.5px; color: ${"var(--pp-txt3)"}; font-weight: 500;`;

export const InvQuickNavRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
`;

export const InvQuickNavBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: ${"var(--pp-border2)"};
    background: ${"var(--pp-card)"};
    box-shadow: 0 4px 18px rgba(100,50,200,0.1);
  }
`;

export const InvQuickNavLabel = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
`;

export const InvQuickNavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const InvQuickNavCount = styled.span`
  font-size: 12.5px;
  color: ${"var(--pp-txt3)"};
  font-weight: 500;
`;

export const InvQuickNavArrow = styled.span`
  font-size: 14px;
  color: ${"var(--pp-txt3)"};
  transition: transform 0.13s;
  ${InvQuickNavBtn}:hover & { transform: translateX(2px); color: ${"var(--pp-accent)"}; }
`;

export const InvItemScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${thinScrollbar}
`;

export const InvMsg = styled.div`text-align: center; color: ${"var(--pp-txt3)"}; padding: 20px 0; font-size: 15px;`;
export const InvErrTxt = styled.div`font-size: 13px; color: #dc2626; padding: 8px 12px;`;

export const InvItemList = styled.div`display: flex; flex-direction: column; gap: 6px;`;

export const InvItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: var(--pp-gradCard);
  border: 1px solid ${p => p.$expanded ? "var(--pp-border2)" : "var(--pp-border)"};
  min-height: 88px;
  cursor: pointer;
  opacity: ${p => p.$locked ? 0.65 : 1};
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

export const InvWearingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  border-radius: 4px;
  padding: 2px 7px;
  width: fit-content;
`;

export const InvLockTxt = styled.div`font-size: 11px; font-weight: 600; color: #dc2626;`;

export const InvPricesArea = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  flex-shrink: 0;
  align-self: stretch;
  width: 35%;
`;

export const InvPricePanel = styled.div`
  border-radius: 10px;
  overflow: hidden;
  background: var(--pp-gradInner);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 24px;
  width: 50%;
`;

export const InvLevelBadge = styled.div`
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  padding: 4px 12px;
  border-radius: 4px;
  align-self: stretch;
  text-align: center;
  background: rgba(220,38,38,0.1);
  color: #dc2626;
  border: 1px solid rgba(220,38,38,0.3);
  text-wrap: nowrap;
`;

export const InvBadgeAndPrice = styled.div`display: flex; gap: 6px; align-items: center;`;

export const InvCoinImg = styled.img`width: 32px; height: 32px; object-fit: contain;`;

export const InvPriceAmt = styled.div`font-size: 14px; font-weight: 700; color: ${"var(--pp-coin)"};`;

export const InvSellPanel = styled.button`
  width: 50%;
  border-radius: 10px;
  background: var(--pp-gradInner);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: box-shadow 0.13s, color 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { box-shadow: 0 2px 10px rgba(120,60,220,0.12); color: ${"var(--pp-accent)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const InvBackBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  align-self: flex-start;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 10px;
  padding: 6px 12px 6px 9px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: ${"var(--pp-txt2)"};
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: rgba(var(--pp-accent-rgb),0.1);
    border-color: rgba(var(--pp-accent-rgb),0.35);
    color: ${"var(--pp-accent)"};
  }
`;
