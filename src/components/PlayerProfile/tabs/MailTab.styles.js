import styled from "styled-components";
import { glassShine, thinScrollbar } from "../styles";

export const PanelHeaderRow = styled.div`
  position: relative;
  flex-shrink: 0;
  padding: 0 0 10px;
`;

export const MailListCol = styled.div`
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 16px;
  margin: 8px 4px 8px 8px;
  padding: 8px;
`;

export const MailSearchWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  padding: 6px 0 10px;
`;

export const MailSearchIcon = styled.svg`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 13px;
  height: 13px;
  color: ${"var(--pp-txt3)"};
  pointer-events: none;
`;

export const MailSearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 9px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 14px;
  padding: 8px 12px 8px 32px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const MailFilterTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 0 0 12px;
`;

export const MailFilterTab = styled.button`
  flex: 1;
  min-width: 0;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  padding: 5px 8px;
  text-align: center;
  border-radius: 7px;
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.14)" : "var(--pp-surface)"};
  color: ${p => p.$active ? "var(--pp-accent)" : p.$disabled ? "var(--pp-txt3)" : "var(--pp-txt2)"};
  cursor: ${p => p.$disabled ? "not-allowed" : "pointer"};
  opacity: ${p => p.$disabled ? 0.5 : 1};
  transition: all 0.15s;
  white-space: nowrap;
  &:hover:not(:disabled) { ${p => !p.$disabled && !p.$active && "border-color: var(--pp-border2); color: var(--pp-txt);"} }
`;

export const NewMailBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  color: ${"var(--pp-accent)"};
  font-size: 15.5px;
  font-weight: 700;
  padding: 9px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  box-sizing: border-box;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-accent)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const MailThreadList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 4px 0 0;
  gap: 6px;
  ${thinScrollbar}
`;

export const MailRowThumbWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
`;

export const MailRowThreadThumb = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid ${"var(--pp-border2)"};
  background: ${"var(--pp-card)"};
  canvas { border-radius: 50%; }
`;

export const MailThreadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.12)" : p.$unread ? "var(--pp-card)" : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(138, 75, 245, 0.03); border-color: ${"var(--pp-border2)"}; }
`;

export const MailUnreadDot = styled.div`
  position: absolute;
  top: -2px; right: -2px;
  width: 9px; height: 9px;
  background: #e03131;
  border-radius: 50%;
  border: 2px solid ${"var(--pp-bg)"};
`;

export const MailThreadMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MailThreadMetaTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
`;

export const MailThreadName = styled.div`
  font-size: 13.5px;
  font-weight: ${p => p.$unread ? "700" : "500"};
  color: ${p => p.$unread ? "var(--pp-accent)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadTime = styled.div`
  font-size: 11.5px;
  color: ${"var(--pp-txt3)"};
  flex-shrink: 0;
  white-space: nowrap;
`;

export const MailThreadSubject = styled.div`
  font-size: 12.5px;
  font-weight: ${p => p.$unread ? "600" : "400"};
  color: ${p => p.$unread ? "var(--pp-txt)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadPreview = styled.div`
  font-size: 12px;
  color: ${"var(--pp-txt3)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailUnreadBadge = styled.div`
  flex-shrink: 0;
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 17px; height: 17px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const MailDetailCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 16px;
  margin: 8px 8px 8px 4px;
`;

export const MailPlaceholder = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const MailPlaceholderIcon = styled.div`
  font-size: 42px;
  opacity: 0.3;
  color: ${"var(--pp-accentLt)"};
`;

export const MailPlaceholderText = styled.div`
  font-size: 14.5px;
  color: ${"var(--pp-txt3)"};
`;

export const MailDetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
`;

export const MailHeaderThumbWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 40px; height: 40px;
  cursor: pointer;
`;

export const MailHeaderNameCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
`;

export const MailHeaderStatusText = styled.div`
  font-size: 12.5px;
  color: ${p => p.$online ? "#22c55e" : "var(--pp-txt3)"};
  text-transform: capitalize;
`;

export const MailHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const MailHeaderBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: ${"var(--pp-txt2)"};
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover:not(:disabled) { border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-accent)"}; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  svg { flex-shrink: 0; }
`;

export const MailHeaderIconBtn = styled(MailHeaderBtn)`
  padding: 7px 9px;
`;

export const MailBackBtn = styled.button`
  all: unset;
  font-size: 13.5px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const MailDetailSubject = styled.div`
  flex: 1;
  font-size: 15.5px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

export const MailDetailWith = styled.div`
  font-size: 16.5px;
  font-weight: 600;
  color: ${"var(--pp-txt)"};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MailMessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${thinScrollbar}
`;

export const MailLoadingMore = styled.div`
  text-align: center;
  font-size: 12.5px;
  color: ${"var(--pp-txt3)"};
  padding: 4px 0 8px;
`;

export const MailDateDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0 12px;
  &:first-child { margin-top: 0; }
`;

export const MailDateDividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${p => p.$flip
    ? "linear-gradient(to right, var(--pp-border2), transparent)"
    : "linear-gradient(to right, transparent, var(--pp-border2))"};
`;

export const MailDateDividerPill = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 20px;
  padding: 4px 12px;
`;

export const MailBubbleGroup = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-direction: ${p => p.$mine ? "row-reverse" : "row"};
  margin-top: 10px;
  &:first-child { margin-top: 0; }
`;

export const MailBubbleAvatarSlot = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
`;

export const MailBubbleCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 72%;
  align-items: ${p => p.$mine ? "flex-end" : "flex-start"};
`;

export const MailBubble = styled.div`
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
  padding: 9px 13px;
  border-radius: ${p => p.$mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
  background: ${p => p.$mine ? "var(--pp-accent)" : "var(--pp-card)"};
  color: ${p => p.$mine ? "#fff" : "var(--pp-txt)"};
  border: 1px solid ${p => p.$mine ? "transparent" : "var(--pp-border)"};
`;

export const MailBubbleTime = styled.span`
  display: inline-block;
  position: relative;
  top: 3px;
  margin-left: 8px;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  opacity: ${p => p.$mine ? 0.75 : 0.65};
  color: ${p => p.$mine ? "#fff" : "var(--pp-txt3)"};
`;

export const MailBubbleGifWrap = styled.div`
  position: relative;
  line-height: 0;
  border-radius: 12px;
  overflow: hidden;
`;

export const MailBubbleGifImg = styled.img`
  display: block;
  max-width: 220px;
  max-height: 180px;
  border-radius: 12px;
`;

export const MailBubbleGifTime = styled.span`
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 10.5px;
  color: #fff;
  background: rgba(0,0,0,0.45);
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
`;

export const MailReplyBox = styled.div`
  position: relative;
  padding: 12px 18px 14px;
  border-top: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MailComposerBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 30px;
  padding: 8px 8px 8px 12px;
`;

export const MailComposerIconBtn = styled.button`
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: ${"var(--pp-card)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt3)"};
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.1); border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-accent)"}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export const MailComposerInput = styled.input`
  flex: 1;
  min-width: 0;
  background: ${"var(--pp-card)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 22px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 14.5px;
  padding: 12px 16px;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: ${"var(--pp-border2)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

export const MailComposerSendBtn = styled.button`
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: ${"var(--pp-accent)"};
  border: 1px solid ${"var(--pp-accent)"};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  &:hover:not(:disabled) { background: ${"var(--pp-accentLt)"}; border-color: ${"var(--pp-accentLt)"}; }
  &:active:not(:disabled) { transform: scale(0.94); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

/* Rendered via portal into document.body (outside ProfileWrapper), so the
   --pp-* custom properties scoped to ProfileWrapper aren't inherited here —
   use fixed literal colors instead, same as PlayerContextMenu does. */
export const MailEmojiPickerWrap = styled.div`
  position: fixed;
  z-index: 10000;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(130,80,220,0.18);
  box-shadow: 0 8px 32px rgba(40,15,90,0.35);
`;

export const MailGifPickerWrap = styled.div`
  position: fixed;
  z-index: 10000;
  width: 300px;
  height: 300px;
  background: #ffffff;
  border: 1px solid rgba(130,80,220,0.18);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(40,15,90,0.35);
`;

export const MailGifSearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: #f0eaff;
  border: 1px solid rgba(130,80,220,0.18);
  border-radius: 8px;
  color: #2e1065;
  font-family: inherit;
  font-size: 12.5px;
  padding: 7px 10px;
  outline: none;
  &::placeholder { color: #a98fd4; }
  &:focus { border-color: rgba(130,80,220,0.32); }
`;

export const MailGifStatus = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 24px;
  color: #a98fd4;
  font-size: 12px;
`;


export const MailReplyFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const MailReplyCounter = styled.div`font-size: 12.5px; color: ${"var(--pp-txt3)"};`;

export const MailReplyError = styled.div`font-size: 12.5px; color: #dc2626;`;

export const MailNewPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 22px 20px;
  gap: 14px;
  overflow-y: auto;
  ${thinScrollbar}
`;

export const MailNewTitle = styled.div`
  font-size: 16.5px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  flex-shrink: 0;
`;

export const MailToRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const MailToLabel = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  width: 20px;
`;

export const MailToInput = styled.input`
  flex: 1;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 14.5px;
  padding: 8px 12px;
  outline: none;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

export const MailFindBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  color: ${"var(--pp-accent)"};
  font-size: 13.5px;
  font-weight: 700;
  padding: 0 14px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); }
`;

export const MailLookupHint = styled.div`
  font-size: 13.5px;
  color: ${({ $ok }) => ($ok ? "#16a34a" : "#dc2626")};
  flex-shrink: 0;
`;

export const MailNewTextarea = styled.textarea`
  flex: 1;
  min-height: 120px;
  resize: none;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 14.5px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;
