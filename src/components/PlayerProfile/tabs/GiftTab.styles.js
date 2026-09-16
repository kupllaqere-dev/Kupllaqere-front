import styled from "styled-components";

/* The gift tab never scrolls: the grid and the membership row divide whatever
   height the panel has between them, and the cards shrink to fit rather than
   pushing a scrollbar into a panel that has none anywhere else. */

export const GiftPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  overflow: hidden;
`;

export const GiftHeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
`;

export const GiftHeading = styled.div`
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: ${"var(--pp-txt)"};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const GiftBalance = styled.div`
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid rgba(var(--pp-accent-rgb),0.2);
  border-radius: 6px;
  padding: 3px 9px;
`;

export const GiftGrid = styled.div`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 1fr;
  gap: 8px;
  overflow: hidden;
`;

export const GiftCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 0;
  overflow: hidden;
  padding: 6px 4px;
  border-radius: 12px;
  cursor: pointer;
  background: var(--pp-gradCard);
  border: 1.5px solid ${p => p.$selected ? "var(--pp-accent)" : "var(--pp-border)"};
  box-shadow: ${p => p.$selected ? "0 0 0 3px rgba(var(--pp-accent-rgb),0.18)" : "none"};
  /* $dim only means "you can't afford this yet" — it stays pickable so the
     footer can say how short you are. */
  opacity: ${p => p.$dim ? 0.55 : 1};
  transition: border-color .13s, box-shadow .13s, transform .13s, opacity .13s;
  &:hover { border-color: ${"var(--pp-accent)"}; opacity: 1; }
  &:active { transform: scale(0.97); }
`;

export const GiftIcon = styled.span`
  font-size: 26px;
  line-height: 1;
`;

export const GiftName = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const GiftPrice = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
`;

export const GiftDivider = styled.div`
  flex-shrink: 0;
  height: 1px;
  background: ${"var(--pp-border)"};
`;

export const MembershipRow = styled.div`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

export const MembershipCard = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 14px;
  cursor: pointer;
  background: var(--pp-gradCard);
  border: 1.5px solid ${p => p.$selected ? "var(--pp-accent)" : "var(--pp-border2)"};
  box-shadow: ${p => p.$selected ? "0 0 0 3px rgba(var(--pp-accent-rgb),0.18)" : "none"};
  opacity: ${p => p.$dim ? 0.55 : 1};
  transition: border-color .13s, box-shadow .13s, transform .13s, opacity .13s;
  &:hover { border-color: ${"var(--pp-accent)"}; opacity: 1; }
  &:active { transform: scale(0.99); }
`;

export const MembershipIcon = styled.span`
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
`;

export const MembershipInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const MembershipName = styled.span`
  font-size: 12px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MembershipBlurb = styled.span`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MembershipPrice = styled.span`
  font-size: 11px;
  font-weight: 800;
  color: ${"var(--pp-accent)"};
`;

export const GiftFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

/* One line for both the error and the "sent!" confirmation — they can't both
   be true at once, and a fixed row keeps the layout from jumping. */
export const GiftStatus = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$error ? "#ef4444" : "var(--pp-txt3)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const GiftSendBtn = styled.button`
  flex-shrink: 0;
  padding: 8px 20px;
  border-radius: 10px;
  border: none;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
  background: ${"var(--pp-accent)"};
  cursor: pointer;
  transition: filter .13s, opacity .13s;
  &:hover:not(:disabled) { filter: brightness(1.1); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
