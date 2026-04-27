import { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import { fetchInbox, fetchSent, fetchThread, markThreadRead, replyToThread } from "../api/mail";
import PlayerThumbnail from "./PlayerThumbnail";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

const REPLY_MAX = 2000;

export default function MailModal({ onClose, onUnreadChange }) {
  const [tab, setTab] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState(null); // null = list view, object = thread detail
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const messagesEndRef = useRef(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxData, sentData] = await Promise.all([fetchInbox(), fetchSent()]);
      setInbox(inboxData);
      setSent(sentData);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  // Scroll to bottom when thread messages load or a reply is sent
  useEffect(() => {
    if (thread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function openThread(threadId) {
    setThreadLoading(true);
    try {
      const data = await fetchThread(threadId);
      setThread(data);
      setReplyBody("");
      setReplyError(null);
      // Mark all unread as read
      await markThreadRead(threadId).catch(() => {});
      onUnreadChange?.();
      // Refresh lists so unread counts update
      loadLists();
    } catch {
      // silently ignore
    } finally {
      setThreadLoading(false);
    }
  }

  function backToList() {
    setThread(null);
    setReplyBody("");
    setReplyError(null);
  }

  async function handleReply() {
    if (!replyBody.trim() || replySending || !thread) return;
    setReplySending(true);
    setReplyError(null);
    try {
      await replyToThread(thread.threadId, replyBody.trim());
      setReplyBody("");
      // Reload thread to show new message
      const updated = await fetchThread(thread.threadId);
      setThread(updated);
      loadLists();
    } catch (err) {
      setReplyError(err.message || "Failed to send.");
    } finally {
      setReplySending(false);
    }
  }

  const inboxUnread = inbox.reduce((sum, t) => sum + t.unreadCount, 0);
  const currentList = tab === "inbox" ? inbox : sent;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Inner>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>

          {thread ? (
            /* ── Thread detail view ── */
            <>
              <ThreadHeader>
                <BackBtn onClick={backToList}>← Back</BackBtn>
                <ThreadSubject>{thread.subject}</ThreadSubject>
                <ThreadWith>
                  <PlayerThumbnail playerName={thread.otherParticipant.name} size={28} />
                  <span>{thread.otherParticipant.name}</span>
                </ThreadWith>
              </ThreadHeader>

              {threadLoading ? (
                <EmptyState>Loading…</EmptyState>
              ) : (
                <MessageList>
                  {thread.messages.map((msg) => (
                    <MessageRow key={msg.id} $mine={msg.isFromMe}>
                      {!msg.isFromMe && (
                        <MsgThumb>
                          <PlayerThumbnail playerName={msg.fromName} size={34} />
                        </MsgThumb>
                      )}
                      <MessageBubble $mine={msg.isFromMe}>
                        <BubbleBody>{msg.body}</BubbleBody>
                        <BubbleTime>{formatTime(msg.createdAt)}</BubbleTime>
                      </MessageBubble>
                      {msg.isFromMe && (
                        <MsgThumb>
                          <PlayerThumbnail playerName={msg.fromName} size={34} />
                        </MsgThumb>
                      )}
                    </MessageRow>
                  ))}
                  <div ref={messagesEndRef} />
                </MessageList>
              )}

              <ReplyBox>
                <ReplyTextarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                  }}
                  maxLength={REPLY_MAX}
                  placeholder="Write a reply… (Ctrl+Enter to send)"
                  disabled={replySending}
                  rows={3}
                />
                {replyError && <ReplyError>{replyError}</ReplyError>}
                <ReplyFooter>
                  <ReplyCounter>{replyBody.length}/{REPLY_MAX}</ReplyCounter>
                  <ReplySendBtn
                    onClick={handleReply}
                    disabled={!replyBody.trim() || replySending}
                  >
                    {replySending ? "Sending…" : "Send Reply"}
                  </ReplySendBtn>
                </ReplyFooter>
              </ReplyBox>
            </>
          ) : (
            /* ── Thread list view ── */
            <>
              <ListHeader>
                <ModalTitle>Mailbox</ModalTitle>
                <Tabs>
                  <Tab $active={tab === "inbox"} onClick={() => setTab("inbox")}>
                    Inbox
                    {inboxUnread > 0 && <TabBadge>{inboxUnread > 99 ? "99+" : inboxUnread}</TabBadge>}
                  </Tab>
                  <Tab $active={tab === "sent"} onClick={() => setTab("sent")}>
                    Sent
                  </Tab>
                </Tabs>
              </ListHeader>

              {loading ? (
                <EmptyState>Loading…</EmptyState>
              ) : currentList.length === 0 ? (
                <EmptyState>{tab === "inbox" ? "Your inbox is empty." : "No sent mail."}</EmptyState>
              ) : (
                <ThreadList>
                  {currentList.map((t) => (
                    <ThreadRow
                      key={t.threadId}
                      $unread={t.unreadCount > 0}
                      onClick={() => openThread(t.threadId)}
                    >
                      <ThumbWrap>
                        <PlayerThumbnail playerName={t.otherParticipant.name} size={42} />
                        {t.unreadCount > 0 && <UnreadDot />}
                      </ThumbWrap>
                      <ThreadMeta>
                        <ThreadMetaTop>
                          <ThreadParticipant $unread={t.unreadCount > 0}>
                            {t.otherParticipant.name}
                          </ThreadParticipant>
                          <ThreadTime>{formatTime(t.lastMessage.createdAt)}</ThreadTime>
                        </ThreadMetaTop>
                        <ThreadSubjectLine $unread={t.unreadCount > 0}>
                          {t.subject}
                        </ThreadSubjectLine>
                        <ThreadPreview>
                          {t.lastMessage.isFromMe ? "You: " : ""}{t.lastMessage.body}
                        </ThreadPreview>
                      </ThreadMeta>
                      {t.unreadCount > 0 && (
                        <UnreadBadge>{t.unreadCount}</UnreadBadge>
                      )}
                    </ThreadRow>
                  ))}
                </ThreadList>
              )}
            </>
          )}
        </Inner>
      </Modal>
    </Overlay>
  );
}

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  width: min(85vw, 96vh * 1.5);
  max-width: 96vw;
  max-height: 96vh;
  aspect-ratio: 1536 / 1024;
  color: #fff;
  filter: drop-shadow(0 8px 40px rgba(0,0,0,0.6));
`;

const Inner = styled.div`
  border-radius: 14px;
  position: absolute;
  top: 5.5%; right: 2.5%; bottom: 5%; left: 2.5%;
  background: #49494d;
  padding: 28px;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px; right: 16px;
  background: none; border: none;
  color: #888; font-size: 24px;
  cursor: pointer; z-index: 2;
  &:hover { color: #fff; }
`;

/* ── List view ── */

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 4px;
`;

const Tab = styled.button`
  position: relative;
  background: ${(p) => (p.$active ? "rgba(124,58,237,0.5)" : "transparent")};
  border: ${(p) => (p.$active ? "1px solid rgba(124,58,237,0.6)" : "1px solid transparent")};
  color: ${(p) => (p.$active ? "#fff" : "#888")};
  font-size: 13px; font-weight: 600;
  padding: 6px 18px;
  border-radius: 7px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.15s;
  &:hover { color: #fff; }
`;

const TabBadge = styled.span`
  background: #e03131; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

const ThreadList = styled.div`
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 3px; }
`;

const ThreadRow = styled.div`
  display: flex; align-items: center; gap: 12px;
  background: ${(p) => (p.$unread ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)")};
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px; padding: 12px 14px;
  cursor: pointer; transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.3); }
`;

const ThumbWrap = styled.div`
  position: relative; flex-shrink: 0;
  width: 42px; height: 42px;
`;

const UnreadDot = styled.div`
  position: absolute; top: -2px; right: -2px;
  width: 10px; height: 10px;
  background: #e03131; border-radius: 50%;
  border: 2px solid #49494d;
`;

const ThreadMeta = styled.div`
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
`;

const ThreadMetaTop = styled.div`
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
`;

const ThreadParticipant = styled.div`
  font-size: 13px;
  font-weight: ${(p) => (p.$unread ? 700 : 500)};
  color: ${(p) => (p.$unread ? "#c4a1ff" : "#ccc")};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ThreadTime = styled.div`
  font-size: 11px; color: #666;
  flex-shrink: 0; white-space: nowrap;
`;

const ThreadSubjectLine = styled.div`
  font-size: 12px;
  font-weight: ${(p) => (p.$unread ? 600 : 400)};
  color: ${(p) => (p.$unread ? "#fff" : "#aaa")};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ThreadPreview = styled.div`
  font-size: 11px; color: #666;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  flex-shrink: 0;
  background: #e03131; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

/* ── Thread detail view ── */

const ThreadHeader = styled.div`
  display: flex; align-items: center; gap: 14px; flex-shrink: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ffffff15;
`;

const BackBtn = styled.button`
  background: none; border: none;
  color: #c4a1ff; font-size: 13px; font-weight: 600;
  cursor: pointer; padding: 0; flex-shrink: 0;
  &:hover { color: #fff; }
`;

const ThreadSubject = styled.div`
  flex: 1; font-size: 15px; font-weight: 600; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ThreadWith = styled.div`
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
  font-size: 13px; color: #aaa;
  canvas { border-radius: 50%; }
`;

const MessageList = styled.div`
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
  padding-right: 4px; padding-bottom: 4px;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 3px; }
`;

const MessageRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  justify-content: ${(p) => (p.$mine ? "flex-end" : "flex-start")};
`;

const MsgThumb = styled.div`
  flex-shrink: 0;
  canvas { border-radius: 50%; }
`;

const MessageBubble = styled.div`
  max-width: 65%;
  background: ${(p) =>
    p.$mine ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)"};
  border: 1px solid ${(p) =>
    p.$mine ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"};
  border-radius: ${(p) => (p.$mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px")};
  padding: 10px 14px;
  display: flex; flex-direction: column; gap: 4px;
`;

const BubbleBody = styled.div`
  font-size: 13px; color: #e8e8e8;
  line-height: 1.5; white-space: pre-wrap; word-break: break-word;
`;

const BubbleTime = styled.div`
  font-size: 10px; color: #777;
  text-align: right;
`;

const ReplyBox = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #ffffff15;
  padding-top: 12px;
  display: flex; flex-direction: column; gap: 6px;
`;

const ReplyTextarea = styled.textarea`
  width: 100%; resize: none;
  background: rgba(255,255,255,0.06);
  border: 1px solid #ffffff22;
  border-radius: 8px; color: #fff;
  font-family: inherit; font-size: 13px; line-height: 1.5;
  padding: 9px 12px; outline: none; box-sizing: border-box;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #555; }
  &:disabled { opacity: 0.6; }
`;

const ReplyError = styled.div`
  font-size: 12px; color: #ff7777;
`;

const ReplyFooter = styled.div`
  display: flex; align-items: center; justify-content: space-between;
`;

const ReplyCounter = styled.div`
  font-size: 10px; color: #555;
`;

const ReplySendBtn = styled.button`
  background: rgba(124,58,237,0.6);
  border: 1px solid rgba(124,58,237,0.8);
  color: #fff; font-size: 13px; font-weight: 600;
  padding: 7px 20px; border-radius: 8px; cursor: pointer;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); }
`;

const EmptyState = styled.div`
  flex: 1; display: flex;
  align-items: center; justify-content: center;
  font-size: 14px; color: #666;
`;
