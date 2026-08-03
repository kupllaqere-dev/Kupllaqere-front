import styled from "styled-components";
import { glassShine, thinScrollbar } from "../styles";

export const PanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 58px 14px 18px;
  flex-shrink: 0;
`;

export const MailListCol = styled.div`
  width: 290px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.3);
  overflow: hidden;
`;

export const NewMailBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  color: ${"var(--pp-accent)"};
  font-size: 14px;
  font-weight: 700;
  padding: 9px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
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
  padding: 18px 0 18px 18px;
  gap: 3px;
  ${thinScrollbar}
`;

export const MailThreadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.12)" : p.$unread ? "var(--pp-card)" : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  padding: 10px 12px;
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
  font-size: 12px;
  font-weight: ${p => p.$unread ? "700" : "500"};
  color: ${p => p.$unread ? "var(--pp-accent)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadTime = styled.div`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  flex-shrink: 0;
  white-space: nowrap;
`;

export const MailThreadSubject = styled.div`
  font-size: 11px;
  font-weight: ${p => p.$unread ? "600" : "400"};
  color: ${p => p.$unread ? "var(--pp-txt)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadPreview = styled.div`
  font-size: 10.5px;
  color: ${"var(--pp-txt3)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailUnreadBadge = styled.div`
  flex-shrink: 0;
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const MailDetailCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  font-size: 13px;
  color: ${"var(--pp-txt3)"};
`;

export const MailDetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
`;

export const MailBackBtn = styled.button`
  all: unset;
  font-size: 12px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const MailDetailSubject = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

export const MailDetailWith = styled.div`
  font-size: 15px;
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
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  padding: 4px 0 8px;
`;

export const MailMessageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  margin-top: 12px;
  &:first-child { margin-top: 0; }
`;

export const MailMsgThumb = styled.div`
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: ${"var(--pp-card)"};
`;

export const MailMsgContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const MailMsgHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

export const MailMsgName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.$mine ? "var(--pp-accent)" : "var(--pp-txt2)"};
`;

export const MailBubbleBody = styled.div`
  font-size: 13px;
  color: ${"var(--pp-txt)"};
  line-height: 1.5;
  word-break: break-word;
`;

export const MailBubbleTime = styled.span`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
`;

export const MailMessageCompact = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 1px 0;
  padding-left: 52px;
  position: relative;
  &:hover > span:first-child {
    opacity: 1;
  }
`;

export const MailCompactTime = styled.span`
  position: absolute;
  left: 0;
  width: 42px;
  text-align: center;
  font-size: 9px;
  white-space: nowrap;
  color: ${"var(--pp-txt3)"};
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;
  top: 50%;
  transform: translateY(-50%);
`;

export const MailReplyBox = styled.div`
  padding: 12px 18px 14px;
  border-top: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MailReplyTextarea = styled.textarea`
  width: 100%;
  resize: none;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

export const MailReplyFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const MailReplyCounter = styled.div`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const MailReplyError = styled.div`font-size: 11px; color: #dc2626;`;

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
  font-size: 15px;
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
  font-size: 11px;
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
  font-size: 13px;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;
