import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { fetchConversations, fetchThread, markThreadRead, replyToThread, sendMail } from "../api/mail";
import { lookupUser } from "../api/auth";
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
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [newToInput, setNewToInput] = useState("");
  const [newResolved, setNewResolved] = useState(null);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [newBody, setNewBody] = useState("");
  const [newSending, setNewSending] = useState(false);
  const [newError, setNewError] = useState(null);
  const messagesEndRef = useRef(null);

  async function loadConversations() {
    setLoading(true);
    try {
      setConversations(await fetchConversations());
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  async function refreshConversations() {
    try {
      setConversations(await fetchConversations());
    } catch {
      // silently ignore
    }
  }

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (thread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function openThread(threadId) {
    setIsNew(false);
    setActiveThreadId(threadId);
    setThreadLoading(true);
    setThread(null);
    try {
      const data = await fetchThread(threadId);
      setThread(data);
      setReplyBody("");
      setReplyError(null);
      await markThreadRead(threadId).catch(() => {});
      onUnreadChange?.();
      refreshConversations();
    } catch {
      // silently ignore
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleReply() {
    if (!replyBody.trim() || replySending || !thread) return;
    setReplySending(true);
    setReplyError(null);
    try {
      await replyToThread(thread.threadId, replyBody.trim());
      setReplyBody("");
      const updated = await fetchThread(thread.threadId);
      setThread(updated);
      refreshConversations();
    } catch (err) {
      setReplyError(err.message || "Failed to send.");
    } finally {
      setReplySending(false);
    }
  }

  function startNew() {
    setIsNew(true);
    setThread(null);
    setActiveThreadId(null);
    setNewToInput("");
    setNewResolved(null);
    setLookupStatus(null);
    setNewBody("");
    setNewError(null);
  }

  async function handleLookup() {
    const name = newToInput.trim();
    if (!name) return;
    setLookupStatus("searching");
    setNewResolved(null);
    setNewError(null);
    try {
      const user = await lookupUser(name);
      if (!user) { setLookupStatus("notfound"); return; }
      const existing = conversations.find((c) => c.otherParticipant.id === user.id);
      if (existing) {
        openThread(existing.threadId);
        return;
      }
      setNewResolved({ id: user.id, name: user.name });
      setLookupStatus("found");
    } catch {
      setLookupStatus("error");
    }
  }

  async function handleNewSend() {
    if (!newBody.trim() || newSending || !newResolved) return;
    setNewSending(true);
    setNewError(null);
    try {
      await sendMail(newResolved.id, "Direct Message", newBody.trim());
      const updated = await fetchConversations();
      setConversations(updated);
      const created = updated.find((c) => c.otherParticipant.id === newResolved.id);
      if (created) openThread(created.threadId);
    } catch (err) {
      setNewError(err.message || "Failed to send.");
    } finally {
      setNewSending(false);
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Inner>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>

          {/* ── Left sidebar ── */}
          <Sidebar>
            <SidebarHeader>
              <SidebarTitle>
                Messages
                {totalUnread > 0 && <TitleBadge>{totalUnread > 99 ? "99+" : totalUnread}</TitleBadge>}
              </SidebarTitle>
              <NewBtn onClick={startNew}>+ New</NewBtn>
            </SidebarHeader>

            {loading ? (
              <SidebarEmpty>Loading…</SidebarEmpty>
            ) : conversations.length === 0 ? (
              <SidebarEmpty>No conversations yet.</SidebarEmpty>
            ) : (
              <ConvList>
                {conversations.map((c) => (
                  <ConvRow
                    key={c.threadId}
                    $active={activeThreadId === c.threadId}
                    $unread={c.unreadCount > 0}
                    onClick={() => openThread(c.threadId)}
                  >
                    <ThumbWrap>
                      <PlayerThumbnail playerName={c.otherParticipant.name} size={38} />
                      {c.unreadCount > 0 && <UnreadDot />}
                    </ThumbWrap>
                    <ConvMeta>
                      <ConvTop>
                        <ConvName $unread={c.unreadCount > 0}>{c.otherParticipant.name}</ConvName>
                        <ConvTime>{formatTime(c.lastMessage.createdAt)}</ConvTime>
                      </ConvTop>
                      <ConvPreview>
                        {c.lastMessage.isFromMe ? "You: " : ""}{c.lastMessage.body}
                      </ConvPreview>
                    </ConvMeta>
                    {c.unreadCount > 0 && <UnreadBadge>{c.unreadCount}</UnreadBadge>}
                  </ConvRow>
                ))}
              </ConvList>
            )}
          </Sidebar>

          {/* ── Right content ── */}
          <Content>
            {isNew ? (
              <NewPanel>
                <NewPanelTitle>New Conversation</NewPanelTitle>
                <ToRow>
                  <ToLabel>To</ToLabel>
                  <ToInput
                    value={newToInput}
                    onChange={(e) => {
                      setNewToInput(e.target.value);
                      setLookupStatus(null);
                      setNewResolved(null);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                    placeholder="Player username…"
                    disabled={newSending}
                    autoFocus
                  />
                  <FindBtn
                    onClick={handleLookup}
                    disabled={!newToInput.trim() || lookupStatus === "searching"}
                  >
                    {lookupStatus === "searching" ? "…" : "Find"}
                  </FindBtn>
                </ToRow>
                {lookupStatus === "found" && <LookupHint $ok>Found: {newResolved.name}</LookupHint>}
                {lookupStatus === "notfound" && <LookupHint>No player with that name.</LookupHint>}
                {lookupStatus === "error" && <LookupHint>Lookup failed. Try again.</LookupHint>}

                {newResolved && (
                  <>
                    <NewBodyTextarea
                      value={newBody}
                      onChange={(e) => setNewBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleNewSend();
                      }}
                      maxLength={REPLY_MAX}
                      placeholder={`Message ${newResolved.name}… (Ctrl+Enter to send)`}
                      disabled={newSending}
                      autoFocus
                    />
                    {newError && <ReplyError>{newError}</ReplyError>}
                    <ReplyFooter>
                      <ReplyCounter>{newBody.length}/{REPLY_MAX}</ReplyCounter>
                      <SendBtn onClick={handleNewSend} disabled={!newBody.trim() || newSending}>
                        {newSending ? "Sending…" : "Send"}
                      </SendBtn>
                    </ReplyFooter>
                  </>
                )}
              </NewPanel>
            ) : threadLoading ? (
              <EmptyState>Loading…</EmptyState>
            ) : thread ? (
              <>
                <ThreadHeader>
                  <PlayerThumbnail playerName={thread.otherParticipant.name} size={30} />
                  <ThreadName>{thread.otherParticipant.name}</ThreadName>
                </ThreadHeader>

                <MessageList>
                  {thread.messages.map((msg) => (
                    <MessageRow key={msg.id} $mine={msg.isFromMe}>
                      {!msg.isFromMe && (
                        <MsgThumb><PlayerThumbnail playerName={msg.fromName} size={34} /></MsgThumb>
                      )}
                      <MessageBubble $mine={msg.isFromMe}>
                        <BubbleBody>{msg.body}</BubbleBody>
                        <BubbleTime>{formatTime(msg.createdAt)}</BubbleTime>
                      </MessageBubble>
                      {msg.isFromMe && (
                        <MsgThumb><PlayerThumbnail playerName={msg.fromName} size={34} /></MsgThumb>
                      )}
                    </MessageRow>
                  ))}
                  <div ref={messagesEndRef} />
                </MessageList>

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
                    <SendBtn onClick={handleReply} disabled={!replyBody.trim() || replySending}>
                      {replySending ? "Sending…" : "Send"}
                    </SendBtn>
                  </ReplyFooter>
                </ReplyBox>
              </>
            ) : (
              <EmptyState>Select a conversation or start a new one.</EmptyState>
            )}
          </Content>
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
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1;
  display: flex;
  flex-direction: row;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px; right: 16px;
  background: none; border: none;
  color: #888; font-size: 24px;
  cursor: pointer; z-index: 2;
  &:hover { color: #fff; }
`;

/* ── Sidebar ── */

const Sidebar = styled.div`
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const SidebarTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleBadge = styled.span`
  background: #e03131; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

const NewBtn = styled.button`
  background: rgba(124,58,237,0.35);
  border: 1px solid rgba(124,58,237,0.6);
  color: #c084fc;
  font-size: 12px; font-weight: 700;
  padding: 5px 11px;
  border-radius: 7px; cursor: pointer;
  white-space: nowrap;
  &:hover { background: rgba(124,58,237,0.6); color: #fff; }
`;

const SidebarEmpty = styled.div`
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #555;
`;

const ConvList = styled.div`
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #ffffff18; border-radius: 2px; }
`;

const ConvRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  background: ${(p) => p.$active ? "rgba(124,58,237,0.2)" : "transparent"};
  border-left: 2px solid ${(p) => p.$active ? "rgba(124,58,237,0.8)" : "transparent"};
  transition: all 0.12s;
  &:hover { background: ${(p) => p.$active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)"}; }
`;

const ThumbWrap = styled.div`
  position: relative; flex-shrink: 0;
  width: 38px; height: 38px;
`;

const UnreadDot = styled.div`
  position: absolute; top: -2px; right: -2px;
  width: 9px; height: 9px;
  background: #e03131; border-radius: 50%;
  border: 2px solid #49494d;
`;

const ConvMeta = styled.div`
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
`;

const ConvTop = styled.div`
  display: flex; align-items: baseline; justify-content: space-between; gap: 4px;
`;

const ConvName = styled.div`
  font-size: 13px;
  font-weight: ${(p) => (p.$unread ? 700 : 500)};
  color: ${(p) => (p.$unread ? "#c4a1ff" : "#ccc")};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ConvTime = styled.div`
  font-size: 10px; color: #555;
  flex-shrink: 0; white-space: nowrap;
`;

const ConvPreview = styled.div`
  font-size: 11px; color: #555;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  flex-shrink: 0;
  background: #e03131; color: #fff;
  font-size: 10px; font-weight: 700;
  min-width: 17px; height: 17px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
`;

/* ── Right content ── */

const Content = styled.div`
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
`;

const EmptyState = styled.div`
  flex: 1; display: flex;
  align-items: center; justify-content: center;
  font-size: 14px; color: #555;
`;

/* ── Thread view ── */

const ThreadHeader = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  canvas { border-radius: 50%; }
`;

const ThreadName = styled.div`
  font-size: 15px; font-weight: 600; color: #fff;
`;

const MessageList = styled.div`
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px 20px;
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
  background: ${(p) => p.$mine ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)"};
  border: 1px solid ${(p) => p.$mine ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"};
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
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 12px 20px;
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

const SendBtn = styled.button`
  background: rgba(124,58,237,0.6);
  border: 1px solid rgba(124,58,237,0.8);
  color: #fff; font-size: 13px; font-weight: 600;
  padding: 7px 20px; border-radius: 8px; cursor: pointer;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); }
`;

/* ── New conversation panel ── */

const NewPanel = styled.div`
  flex: 1; display: flex; flex-direction: column;
  padding: 24px 24px 20px;
  gap: 14px; overflow-y: auto;
`;

const NewPanelTitle = styled.div`
  font-size: 16px; font-weight: 700; color: #fff;
  flex-shrink: 0;
`;

const ToRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
`;

const ToLabel = styled.div`
  font-size: 12px; font-weight: 600; color: #888;
  text-transform: uppercase; letter-spacing: 0.5px;
  flex-shrink: 0; width: 24px;
`;

const ToInput = styled.input`
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid #ffffff22;
  border-radius: 8px; color: #fff;
  font-family: inherit; font-size: 13px;
  padding: 9px 12px; outline: none;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #555; }
  &:disabled { opacity: 0.6; }
`;

const FindBtn = styled.button`
  background: rgba(124,58,237,0.35);
  border: 1px solid rgba(124,58,237,0.6);
  color: #c084fc; font-size: 12px; font-weight: 700;
  padding: 0 14px; height: 37px;
  border-radius: 8px; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.6); color: #fff; }
`;

const LookupHint = styled.div`
  font-size: 12px;
  color: ${({ $ok }) => ($ok ? "#50c878" : "#ff7777")};
  flex-shrink: 0;
`;

const NewBodyTextarea = styled.textarea`
  flex: 1; resize: none; min-height: 120px;
  background: rgba(255,255,255,0.06);
  border: 1px solid #ffffff22;
  border-radius: 8px; color: #fff;
  font-family: inherit; font-size: 13px; line-height: 1.5;
  padding: 10px 12px; outline: none; box-sizing: border-box;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #555; }
  &:disabled { opacity: 0.6; }
`;
