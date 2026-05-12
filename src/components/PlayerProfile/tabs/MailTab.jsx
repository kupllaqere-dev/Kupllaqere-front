import { useState, useEffect, useRef } from "react";
import { fetchUserStatus } from "../../../api/users";
import { lookupUser } from "../../../api/auth";
import PlayerThumbnail from "../../PlayerThumbnail";
import { formatRelativeTime } from "../utils";
import {
  HubPanelContainer, MailListCol, PanelHeaderRow, PanelTitle, TabUnreadBadge,
  NewMailBtn, MailThreadList, MailThreadRow, SkeletonCircle, SkeletonLine,
  PanelEmpty, MailThumbWrap, MailThreadThumb, MailStatusDot, MailUnreadDot,
  MailThreadMeta, MailThreadMetaTop, MailThreadName, MailThreadTime, MailUnreadBadge,
  MailDetailCol, MailNewPanel, MailNewTitle, MailToRow, MailToLabel, MailToInput,
  MailFindBtn, MailLookupHint, MailNewTextarea, MailReplyError, MailReplyFooter,
  MailReplyCounter, PrimaryBtn, MailPlaceholder, MailPlaceholderText, MailPlaceholderIcon,
  MailDetailHeader, MailDetailWith, MailMessageList, MailLoadingMore,
  MailMessageCompact, MailCompactTime, MailBubbleBody, MailMessageRow, MailMsgThumb,
  MailMsgContent, MailMsgHeader, MailMsgName, MailBubbleTime, MailReplyBox,
  MailReplyTextarea,
} from "../styles";

export default function MailTab({
  mailConversations, mailLoading,
  mailThread, mailThreadLoading, mailReplyBody, setMailReplyBody,
  mailReplySending, mailReplyError, openMailThread, handleMailReply,
  onNewSend, onClearThread, onLoadMore, socket,
}) {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const [isNew, setIsNew] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [onlineMap, setOnlineMap] = useState(() => new Map());

  useEffect(() => {
    if (!mailConversations.length) return;
    Promise.all(
      mailConversations.map((c) =>
        fetchUserStatus(c.otherParticipant.id).then((s) => ({
          id: String(c.otherParticipant.id),
          status: s.status || "offline",
        }))
      )
    ).then((results) => {
      setOnlineMap((prev) => {
        const next = new Map(prev);
        for (const r of results) next.set(r.id, r.status);
        return next;
      });
    }).catch(() => {});
  }, [mailConversations]);

  useEffect(() => {
    if (!socket?.socket) return;
    const handleList = (list) => {
      setOnlineMap((prev) => {
        const next = new Map(prev);
        for (const f of list || []) next.set(String(f.id), f.status || (f.online ? "online" : "offline"));
        return next;
      });
    };
    const handleOnline = (f) => {
      if (!f?.id) return;
      setOnlineMap((prev) => new Map(prev).set(String(f.id), f.status || "online"));
    };
    const handleOffline = ({ id } = {}) => {
      if (!id) return;
      setOnlineMap((prev) => new Map(prev).set(String(id), "offline"));
    };
    const handleStatus = ({ userId, status } = {}) => {
      if (!userId || !status) return;
      setOnlineMap((prev) => new Map(prev).set(String(userId), status));
    };
    socket.socket.on("friends:online", handleList);
    socket.socket.on("friend:online", handleOnline);
    socket.socket.on("friend:offline", handleOffline);
    socket.socket.on("friend:status", handleStatus);
    return () => {
      socket.socket.off("friends:online", handleList);
      socket.socket.off("friend:online", handleOnline);
      socket.socket.off("friend:offline", handleOffline);
      socket.socket.off("friend:status", handleStatus);
    };
  }, [socket]);

  const [newToInput, setNewToInput] = useState("");
  const [newResolved, setNewResolved] = useState(null);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [newBody, setNewBody] = useState("");
  const [newSending, setNewSending] = useState(false);
  const [newError, setNewError] = useState(null);

  useEffect(() => {
    if (mailThread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mailThread?.threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    const onScroll = async () => {
      if (el.scrollTop > 40 || loadingMore || !mailThread?.hasMore) return;
      const oldest = mailThread.messages[0];
      if (!oldest) return;
      setLoadingMore(true);
      const prevHeight = el.scrollHeight;
      await onLoadMore(mailThread.threadId, oldest.createdAt);
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
      setLoadingMore(false);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [mailThread, loadingMore, onLoadMore]);

  const totalUnread = mailConversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const activeThreadId = isNew ? null : mailThread?.threadId;

  function startNew() {
    setIsNew(true);
    onClearThread();
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
      const existing = mailConversations.find((c) => c.otherParticipant.id === user.id);
      if (existing) { setIsNew(false); openMailThread(existing.threadId); return; }
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
      await onNewSend(newResolved.id, newBody.trim());
      setIsNew(false);
    } catch (err) {
      setNewError(err.message || "Failed to send.");
    } finally {
      setNewSending(false);
    }
  }

  return (
    <HubPanelContainer>
      {/* ── Left: conversation list ── */}
      <MailListCol>
        <PanelHeaderRow>
          <PanelTitle>
            Messages
            {totalUnread > 0 && <TabUnreadBadge>{totalUnread > 99 ? "99+" : totalUnread}</TabUnreadBadge>}
          </PanelTitle>
          <NewMailBtn onClick={startNew}>+ New</NewMailBtn>
        </PanelHeaderRow>
        <MailThreadList>
          {mailLoading ? (
            [0,1,2,3].map(i => (
              <MailThreadRow key={i} style={{ pointerEvents: "none", gap: 10, alignItems: "center" }}>
                <SkeletonCircle $size="38px" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <SkeletonLine $w="55%" $h="11px" />
                </div>
              </MailThreadRow>
            ))
          ) : mailConversations.length === 0 ? (
            <PanelEmpty>No conversations yet.</PanelEmpty>
          ) : (
            mailConversations.map((c) => (
              <MailThreadRow
                key={c.threadId}
                $unread={c.unreadCount > 0}
                $active={activeThreadId === c.threadId}
                onClick={() => { setIsNew(false); openMailThread(c.threadId); }}
              >
                <MailThumbWrap>
                  <MailThreadThumb>
                    <PlayerThumbnail playerName={c.otherParticipant.name} size={38} />
                  </MailThreadThumb>
                  <MailStatusDot $status={onlineMap.get(String(c.otherParticipant.id)) || "offline"} />
                  {c.unreadCount > 0 && <MailUnreadDot />}
                </MailThumbWrap>
                <MailThreadMeta>
                  <MailThreadMetaTop>
                    <MailThreadName $unread={c.unreadCount > 0}>{c.otherParticipant.name}</MailThreadName>
                    <MailThreadTime>{formatRelativeTime(c.lastMessage.createdAt)}</MailThreadTime>
                  </MailThreadMetaTop>
                </MailThreadMeta>
                {c.unreadCount > 0 && <MailUnreadBadge>{c.unreadCount}</MailUnreadBadge>}
              </MailThreadRow>
            ))
          )}
        </MailThreadList>
      </MailListCol>

      {/* ── Right: thread or new conversation ── */}
      <MailDetailCol>
        {isNew ? (
          <MailNewPanel>
            <MailNewTitle>New Conversation</MailNewTitle>
            <MailToRow>
              <MailToLabel>To</MailToLabel>
              <MailToInput
                value={newToInput}
                onChange={(e) => { setNewToInput(e.target.value); setLookupStatus(null); setNewResolved(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                placeholder="Player username…"
                disabled={newSending}
                autoFocus
              />
              <MailFindBtn onClick={handleLookup} disabled={!newToInput.trim() || lookupStatus === "searching"}>
                {lookupStatus === "searching" ? "…" : "Find"}
              </MailFindBtn>
            </MailToRow>
            {lookupStatus === "found" && <MailLookupHint $ok>Found: {newResolved.name}</MailLookupHint>}
            {lookupStatus === "notfound" && <MailLookupHint>No player with that name.</MailLookupHint>}
            {lookupStatus === "error" && <MailLookupHint>Lookup failed. Try again.</MailLookupHint>}
            {newResolved && (
              <>
                <MailNewTextarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleNewSend(); }}
                  maxLength={2000}
                  placeholder={`Message ${newResolved.name}… (Ctrl+Enter to send)`}
                  disabled={newSending}
                  autoFocus
                />
                {newError && <MailReplyError>{newError}</MailReplyError>}
                <MailReplyFooter>
                  <MailReplyCounter>{newBody.length}/2000</MailReplyCounter>
                  <PrimaryBtn onClick={handleNewSend} disabled={!newBody.trim() || newSending}>
                    {newSending ? "Sending…" : "Send"}
                  </PrimaryBtn>
                </MailReplyFooter>
              </>
            )}
          </MailNewPanel>
        ) : mailThreadLoading ? (
          <MailPlaceholder><MailPlaceholderText>Loading…</MailPlaceholderText></MailPlaceholder>
        ) : !mailThread ? (
          <MailPlaceholder>
            <MailPlaceholderIcon>✉</MailPlaceholderIcon>
            <MailPlaceholderText>Select a conversation or start a new one.</MailPlaceholderText>
          </MailPlaceholder>
        ) : (
          <>
            <MailDetailHeader>
              <PlayerThumbnail playerName={mailThread.otherParticipant.name} size={28} />
              <MailDetailWith>{mailThread.otherParticipant.name}</MailDetailWith>
            </MailDetailHeader>
            <MailMessageList ref={messageListRef}>
              {loadingMore && <MailLoadingMore>Loading…</MailLoadingMore>}
              {mailThread.messages.map((msg, i) => {
                const prev = mailThread.messages[i - 1];
                const isFollowUp = prev &&
                  prev.fromName === msg.fromName &&
                  new Date(msg.createdAt) - new Date(prev.createdAt) < 60 * 60 * 1000;
                const hoverTime = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";
                return isFollowUp ? (
                  <MailMessageCompact key={msg.id}>
                    <MailCompactTime>{hoverTime}</MailCompactTime>
                    <MailBubbleBody>{msg.body}</MailBubbleBody>
                  </MailMessageCompact>
                ) : (
                  <MailMessageRow key={msg.id}>
                    <MailMsgThumb><PlayerThumbnail playerName={msg.fromName} size={42} /></MailMsgThumb>
                    <MailMsgContent>
                      <MailMsgHeader>
                        <MailMsgName $mine={msg.isFromMe}>{msg.fromName}</MailMsgName>
                        <MailBubbleTime>{formatRelativeTime(msg.createdAt)}{hoverTime && ` · ${hoverTime}`}</MailBubbleTime>
                      </MailMsgHeader>
                      <MailBubbleBody>{msg.body}</MailBubbleBody>
                    </MailMsgContent>
                  </MailMessageRow>
                );
              })}
              <div ref={messagesEndRef} />
            </MailMessageList>
            <MailReplyBox>
              <MailReplyTextarea
                value={mailReplyBody}
                onChange={(e) => setMailReplyBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleMailReply(); }}
                maxLength={2000}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                disabled={mailReplySending}
                rows={3}
              />
              {mailReplyError && <MailReplyError>{mailReplyError}</MailReplyError>}
              <MailReplyFooter>
                <MailReplyCounter>{mailReplyBody.length}/2000</MailReplyCounter>
                <PrimaryBtn onClick={handleMailReply} disabled={!mailReplyBody.trim() || mailReplySending}>
                  {mailReplySending ? "Sending…" : "Send"}
                </PrimaryBtn>
              </MailReplyFooter>
            </MailReplyBox>
          </>
        )}
      </MailDetailCol>
    </HubPanelContainer>
  );
}
