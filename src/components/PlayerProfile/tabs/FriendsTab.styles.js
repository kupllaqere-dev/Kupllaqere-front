import styled from "styled-components";
import { glassShine, thinScrollbar } from "../styles";

export const SmPrimaryBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid rgba(var(--pp-accent-rgb),0.3);
  color: ${"var(--pp-accent)"};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const SmSecBtn = styled.button`
  background: transparent;
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt3)"};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${"var(--pp-card)"}; color: ${"var(--pp-txt2)"}; border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const PanelTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 0 10px;
  flex-shrink: 0;
  border-bottom: 1px solid ${"var(--pp-border)"};
`;

export const PanelTab = styled.button`
  position: relative;
  overflow: hidden;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.12)" : "transparent"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "transparent"};
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt3)"};
  font-size: 12px;
  font-weight: ${p => p.$active ? "700" : "500"};
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { color: ${"var(--pp-txt)"}; background: ${"var(--pp-card)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const TabCountBadge = styled.span`
  background: rgba(var(--pp-accent-rgb),0.12);
  color: ${"var(--pp-accent)"};
  font-size: 9px;
  font-weight: 700;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const FriendsPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px;
  gap: 14px;
  overflow: hidden;
`;

export const FriendsSearchRow = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const FriendsSearchInput = styled.input`
  width: 100%;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  padding: 10px 38px 10px 16px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const FriendsSearchIcon = styled.span`
  position: absolute;
  right: 13px; top: 50%;
  transform: translateY(-50%);
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  pointer-events: none;
`;

export const FriendsSearchHint = styled.div`
  font-size: 11px;
  color: ${p => p.$error ? "#ef4444" : "var(--pp-txt3)"};
  padding: 2px 2px 0;
  flex-shrink: 0;
`;

export const FriendsListScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-content: start;
  padding-bottom: 16px;
  ${thinScrollbar}
`;

export const FriendsGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 2px 2px;
  grid-column: 1 / -1;
`;

export const FriendCardTile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 0;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.18s;
  opacity: ${p => p.$offline ? 0.6 : 1};
  min-width: 0;
  &:hover {
    background: ${"var(--pp-card)"};
    border-color: ${"var(--pp-border2)"};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

export const FriendCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 0;
  padding: 11px 14px;
  grid-column: 1 / -1;
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    background: ${"var(--pp-card)"};
    border-color: ${"var(--pp-border2)"};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

export const FriendCardAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 60px; height: 60px;
`;

export const FriendOnlineDot = styled.div`
  position: absolute;
  bottom: 2px; right: 2px;
  width: 11px; height: 11px;
  background: ${p => p.$color || "#22c55e"};
  border-radius: 50%;
  border: 2px solid ${"var(--pp-surface)"};
  box-shadow: 0 0 6px #22c55e;
`;

export const FriendCardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const FriendCardName = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 5px;
`;

export const FriendCardLocation = styled.div`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const FriendLocationDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: ${p => p.$online ? "#22c55e" : "var(--pp-border2)"};
  flex-shrink: 0;
`;

export const FriendInviteActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;
