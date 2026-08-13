import styled from "styled-components";
import { glassShine, thinScrollbar } from "../styles";

/* Card geometry — the scroll viewport is sized to one group label plus exactly
   3 card rows, so the list opens on 9 visible friends and scrolls past that. */
const CARD_H = 116;
const GRID_GAP = 10;
const LABEL_H = 26;
/* Scrollbar track (4px, see thinScrollbar) + breathing room, mirrored on the
   soulmate row so both grids share one column geometry. */
const SCROLLBAR_W = 4;
const SCROLL_PAD = 6;
export const LIST_VIEWPORT_H = LABEL_H + GRID_GAP + CARD_H * 3 + GRID_GAP * 2;

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

/* No container gap — each section owns its own spacing, so the soulmate row can
   sit well clear of the friends list while the sort row hugs it. */
export const FriendsPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px;
  overflow: hidden;
`;

/* ── Header: "FRIENDS (24)" + sort control ── */

export const FriendsHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  margin-bottom: 6px;
`;

/* Pinned soulmate row — same card metrics as the grid below it. */
export const SoulmateRow = styled.div`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${GRID_GAP}px;
  margin-bottom: 26px;
  padding-right: ${SCROLL_PAD + SCROLLBAR_W}px;
`;

/* Stays mounted in the requests view — hiding it outright would collapse the
   header row's height and shift the whole panel. */
export const SortWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  visibility: ${p => p.$hidden ? "hidden" : "visible"};
  pointer-events: ${p => p.$hidden ? "none" : "auto"};
`;

export const SortBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt2)"};
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  svg { opacity: 0.7; transition: transform 0.18s; transform: rotate(${p => p.$open ? "180deg" : "0deg"}); }
`;

export const SortLabelMuted = styled.span`
  color: ${"var(--pp-txt3)"};
  font-weight: 500;
`;

export const SortMenu = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  z-index: 40;
  min-width: 140px;
  padding: 4px;
  border-radius: 10px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border2)"};
  box-shadow: 0 10px 28px rgba(60,20,120,0.16);
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SortItem = styled.button`
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.1)" : "transparent"};
  border: none;
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt2)"};
  font-family: inherit;
  font-size: 11px;
  font-weight: ${p => p.$active ? 700 : 500};
  text-align: left;
  padding: 7px 9px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;
  &:hover { background: ${"var(--pp-card)"}; color: ${"var(--pp-txt)"}; }
`;

/* ── List ── */

export const FriendsListScroll = styled.div`
  flex: 1;
  min-height: 0;
  max-height: ${LIST_VIEWPORT_H}px;
  overflow-y: auto;
  overflow-x: hidden;
  /* Reserve the scrollbar track even when the list is short (requests view),
     otherwise the columns widen and the whole grid shifts on view switch. */
  scrollbar-gutter: stable;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${GRID_GAP}px;
  align-content: start;
  padding-right: ${SCROLL_PAD}px;
  ${thinScrollbar}
`;

export const FriendsGroupLabel = styled.div`
  grid-column: 1 / -1;
  height: ${LABEL_H}px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 800;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  text-shadow: 0 1px 3px rgba(30,10,70,0.45);
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.45), transparent);
  }
`;

export const FriendCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  height: ${CARD_H}px;
  background: ${p => p.$soulmate
    ? "linear-gradient(150deg, rgba(244,114,182,0.14), rgba(255,255,255,0.9) 65%)"
    : "var(--pp-surface)"};
  border: 1px solid ${p => p.$soulmate ? "rgba(236,72,153,0.34)" : "var(--pp-border)"};
  border-radius: 12px;
  padding: 10px 11px;
  min-width: 0;
  transition: all 0.18s;
  opacity: ${p => p.$dim ? 0.68 : 1};
  &:hover {
    border-color: ${p => p.$soulmate ? "rgba(236,72,153,0.55)" : "var(--pp-border2)"};
    box-shadow: ${p => p.$soulmate
      ? "0 4px 18px rgba(236,72,153,0.18)"
      : "0 4px 16px rgba(100,50,200,0.1)"};
    opacity: 1;
  }
`;

export const FriendCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
`;

export const FriendAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 46px; height: 46px;
  border-radius: 50%;
  cursor: pointer;
  transition: filter 0.15s;
  &:hover { filter: drop-shadow(0 0 6px rgba(var(--pp-accent-rgb),0.45)); }
`;

export const FriendAvatarCircle = styled.div`
  width: 46px; height: 46px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid ${"var(--pp-border2)"};
  background: ${"var(--pp-card)"};
  canvas { border-radius: 50%; }
`;

const STATUS_COLOR = {
  online:  { bg: "#22c55e", shadow: "0 0 6px rgba(34,197,94,0.75)" },
  away:    { bg: "#f59e0b", shadow: "0 0 6px rgba(245,158,11,0.7)" },
  offline: { bg: "#9ca3af", shadow: "none" },
};

export const FriendStatusDot = styled.span`
  position: absolute;
  bottom: 0; right: 0;
  width: 12px; height: 12px;
  border-radius: 50%;
  border: 2px solid ${"var(--pp-surface)"};
  background: ${({ $status }) => (STATUS_COLOR[$status] || STATUS_COLOR.offline).bg};
  box-shadow: ${({ $status }) => (STATUS_COLOR[$status] || STATUS_COLOR.offline).shadow};
`;

export const FriendCardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FriendCardName = styled.div`
  font-size: 12.5px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  &:hover { text-decoration: underline; text-decoration-color: currentColor; }
`;

export const FriendMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10.5px;
  color: ${"var(--pp-txt3)"};
`;

export const FriendMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  svg { flex-shrink: 0; opacity: 0.8; }
`;

export const FriendMetaDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) => (STATUS_COLOR[$status] || STATUS_COLOR.offline).bg};
`;

export const SoulmateTag = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  color: #db2777;
  white-space: nowrap;
  svg { flex-shrink: 0; }
`;

export const FriendMetaSep = styled.span`
  width: 1px;
  height: 9px;
  background: ${"var(--pp-border2)"};
  flex-shrink: 0;
`;

export const FriendCardDivider = styled.div`
  height: 1px;
  background: linear-gradient(to right, transparent, ${"var(--pp-border2)"}, transparent);
  flex-shrink: 0;
`;

export const FriendCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
`;

export const FriendActionBtn = styled.button`
  flex: 1;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${"var(--pp-card)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt2)"};
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 600;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.12); border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-accent)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

export const FriendAcceptBtn = styled(FriendActionBtn)`
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.3);
  color: #15803d;
  &:hover:not(:disabled) { background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.45); color: #15803d; }
`;

export const FriendDeclineBtn = styled(FriendActionBtn)`
  background: rgba(220,38,38,0.07);
  border-color: rgba(220,38,38,0.25);
  color: #dc2626;
  &:hover:not(:disabled) { background: rgba(220,38,38,0.16); border-color: rgba(220,38,38,0.4); color: #dc2626; }
`;

/* ── Footer actions ── */

/* Keeps the add-friend popover + action buttons pinned to the panel bottom. */
export const FriendsBottom = styled.div`
  margin-top: auto;
  padding-top: 14px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const FriendsFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
  padding-top: 2px;
`;

export const FooterBtn = styled.button`
  flex: 1;
  max-width: 260px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.16)" : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt2)"};
  box-shadow: ${p => p.$active ? "0 4px 18px rgba(var(--pp-accent-rgb),0.18)" : "none"};
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(var(--pp-accent-rgb),0.12); border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-accent)"}; transform: translateY(-1px); }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:active { transform: translateY(0); }
  svg { flex-shrink: 0; }
`;

export const FooterBtnBadge = styled.span`
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

/* ── Add-friend popover ── */

export const AddFriendPanel = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border2)"};
  box-shadow: 0 6px 22px rgba(60,20,120,0.12);
`;

export const AddFriendTitle = styled.div`
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: ${"var(--pp-txt3)"};
`;

export const AddFriendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AddFriendInput = styled.input`
  flex: 1;
  min-width: 0;
  background: ${"var(--pp-bg)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 9px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 12px;
  padding: 8px 12px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const AddFriendHint = styled.div`
  font-size: 11px;
  color: ${p => p.$error ? "#dc2626" : "var(--pp-txt3)"};
`;
