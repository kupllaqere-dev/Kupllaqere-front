import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import EmojiPicker from "emoji-picker-react";
import { fetchUserStatus } from "../../../api/users";
import { lookupUser } from "../../../api/auth";
import { fetchFriends } from "../../../api/friends";
import PlayerThumbnail from "../../PlayerThumbnail";
import PlayerContextMenu from "../../PlayerContextMenu";

const ConvoThumbHover = styled.div`
  border-radius: 50%;
  cursor: pointer;
  transition: filter 0.15s;
  &:hover { filter: drop-shadow(0 0 6px rgba(255,255,255,0.4)); }
`;

const ConvoNameHover = styled.span`
  cursor: pointer;
  &:hover { text-decoration: underline; text-decoration-color: currentColor; }
`;
import { formatRelativeTime } from "../utils";
import {
  HubPanelContainer, TabUnreadBadge, SkeletonCircle, SkeletonLine,
  PanelEmpty, MailThreadThumb, MailStatusDot, PrimaryBtn,
} from "../styles";
import {
  MailListCol, PanelHeaderRow,
  MailSearchWrap, MailSearchIcon, MailSearchInput, MailFilterTabs, MailFilterTab,
  NewMailBtn, MailThreadList, MailThreadRow, MailRowThumbWrap, MailRowThreadThumb, MailUnreadDot,
  MailThreadMeta, MailThreadMetaTop, MailThreadName, MailThreadTime, MailUnreadBadge,
  MailThreadPreview,
  MailDetailCol, MailNewPanel, MailNewTitle, MailToRow, MailToLabel, MailToInput,
  MailFindBtn, MailLookupHint, MailNewTextarea, MailReplyError, MailReplyFooter,
  MailReplyCounter, MailPlaceholder, MailPlaceholderText, MailPlaceholderIcon,
  MailDetailHeader, MailHeaderThumbWrap, MailHeaderNameCol, MailHeaderStatusText,
  MailHeaderActions, MailHeaderBtn, MailHeaderIconBtn,
  MailDetailWith, MailMessageList, MailLoadingMore,
  MailDateDivider, MailDateDividerLine, MailDateDividerPill, MailBubbleGroup, MailBubbleAvatarSlot,
  MailBubbleCol, MailBubble, MailBubbleTime, MailBubbleGifWrap, MailBubbleGifImg, MailBubbleGifTime,
  MailReplyBox, MailComposerBar, MailComposerIconBtn, MailComposerInput, MailComposerSendBtn,
  MailEmojiPickerWrap, MailGifPickerWrap, MailGifSearchInput, MailGifStatus,
} from "./MailTab.styles";

const KLIPY_KEY = "REEXWlCMkIFXqQdJQBzTBCsS8QNdShFb7dUCYfZSPknZA2vSlDJlJ8CpwswaPKry";
const GIF_URL_PREFIX = "https://static.klipy.com";

const MAIL_FILTERS = [
  { key: "all", label: "All" },
  { key: "friends", label: "Friends" },
  { key: "system", label: "System", disabled: true },
  { key: "trades", label: "Trades", disabled: true },
  { key: "event", label: "Event", disabled: true },
];

function formatDateDivider(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a, b) => a.toDateString() === b.toDateString();
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function formatShortTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
}

function IconProfile() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v9H5v-9" />
      <path d="M12 8c-1.5 0-3-1-3-2.5S10 3 12 5c0-2 1.5-2.5 3-2.5S17.5 4 16 5.5C15 8 12 8 12 8Z" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function IconAttach() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function GifPicker({ onSelect, style, wrapRef }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const delay = query.trim() ? 400 : 0;
    const t = setTimeout(() => {
      const url = query.trim()
        ? `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/search?q=${encodeURIComponent(query.trim())}&per_page=24`
        : `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/trending?per_page=24`;
      setLoading(true);
      fetch(url)
        .then((r) => r.json())
        .then((d) => { if (!cancelled) { setGifs(d.data?.data || []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }, delay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  return (
    <MailGifPickerWrap ref={wrapRef} style={style}>
      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid rgba(130,80,220,0.18)" }}>
        <MailGifSearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs…"
          autoFocus
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, alignContent: "start" }}>
        {loading && <MailGifStatus>Loading…</MailGifStatus>}
        {!loading && gifs.length === 0 && <MailGifStatus>No results</MailGifStatus>}
        {!loading && gifs.map((gif) => (
          <img
            key={gif.id}
            src={gif.file.sm.gif.url}
            alt={gif.title}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 7, cursor: "pointer", display: "block" }}
            onClick={() => onSelect(gif)}
          />
        ))}
      </div>
    </MailGifPickerWrap>
  );
}

export default function MailTab({
  mailConversations, mailLoading,
  mailThread, mailThreadLoading, mailReplyBody, setMailReplyBody,
  mailReplySending, mailReplyError, openMailThread, handleMailReply,
  onNewSend, onClearThread, onLoadMore, socket, onOpenProfile,
}) {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const [isNew, setIsNew] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [onlineMap, setOnlineMap] = useState(() => new Map());
  const [playerMenu, setPlayerMenu] = useState(null);
  const playerMenuRef = useRef(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [friendIds, setFriendIds] = useState(() => new Set());
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [gifPickerAnchor, setGifPickerAnchor] = useState(null);
  const emojiPickerRef = useRef(null);
  const gifPickerRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    fetchFriends()
      .then((data) => setFriendIds(new Set((data.friends || []).map((f) => String(f.id)))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!emojiPickerAnchor && !gifPickerAnchor) return;
    function onDown(e) {
      if (emojiPickerAnchor && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setEmojiPickerAnchor(null);
      if (gifPickerAnchor && gifPickerRef.current && !gifPickerRef.current.contains(e.target)) setGifPickerAnchor(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [emojiPickerAnchor, gifPickerAnchor]);

  function toggleEmojiPicker(e) {
    if (emojiPickerAnchor) { setEmojiPickerAnchor(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setEmojiPickerAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
    setGifPickerAnchor(null);
  }

  function toggleGifPicker(e) {
    if (gifPickerAnchor) { setGifPickerAnchor(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setGifPickerAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
    setEmojiPickerAnchor(null);
  }

  useEffect(() => {
    if (!playerMenu) return;
    function onDown(e) {
      if (!playerMenuRef.current?.contains(e.target)) setPlayerMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [playerMenu]);

  function openPlayerMenu(player, e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerMenu({ ...player, x: rect.right, y: rect.top });
  }

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

  const searchLower = search.trim().toLowerCase();
  const filteredConversations = mailConversations.filter((c) => {
    if (searchLower && !c.otherParticipant.name.toLowerCase().includes(searchLower)) return false;
    if (activeFilter === "friends" && !friendIds.has(String(c.otherParticipant.id))) return false;
    return true;
  });

  function handleViewProfile() {
    if (!mailThread) return;
    onOpenProfile?.({ userId: mailThread.otherParticipant.id, name: mailThread.otherParticipant.name });
  }

  const messageItems = [];
  if (mailThread) {
    let lastDayKey = null;
    let lastGroup = null;
    for (const msg of mailThread.messages) {
      const dayKey = new Date(msg.createdAt).toDateString();
      if (dayKey !== lastDayKey) {
        messageItems.push({ kind: "divider", key: `d-${msg.id}`, label: formatDateDivider(msg.createdAt) });
        lastDayKey = dayKey;
        lastGroup = null;
      }
      const canJoin = lastGroup && lastGroup.mine === msg.isFromMe &&
        new Date(msg.createdAt) - new Date(lastGroup.msgs[lastGroup.msgs.length - 1].createdAt) < 5 * 60 * 1000;
      if (canJoin) {
        lastGroup.msgs.push(msg);
      } else {
        lastGroup = { kind: "group", key: `g-${msg.id}`, mine: msg.isFromMe, fromName: msg.fromName, msgs: [msg] };
        messageItems.push(lastGroup);
      }
    }
  }

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
        <MailSearchWrap>
          <MailSearchIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </MailSearchIcon>
          <MailSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
          />
        </MailSearchWrap>
        <MailFilterTabs>
          {MAIL_FILTERS.map((f) => (
            <MailFilterTab
              key={f.key}
              $active={activeFilter === f.key}
              $disabled={f.disabled}
              disabled={f.disabled}
              title={f.disabled ? "Coming soon" : undefined}
              onClick={() => !f.disabled && setActiveFilter(f.key)}
            >
              {f.label}
            </MailFilterTab>
          ))}
        </MailFilterTabs>
        <PanelHeaderRow>
          <NewMailBtn onClick={startNew}>+ New</NewMailBtn>
          {totalUnread > 0 && (
            <TabUnreadBadge style={{ position: "absolute", top: -6, right: -6 }}>
              {totalUnread > 99 ? "99+" : totalUnread}
            </TabUnreadBadge>
          )}
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
          ) : filteredConversations.length === 0 ? (
            <PanelEmpty>No matching conversations.</PanelEmpty>
          ) : (
            filteredConversations.map((c) => (
              <MailThreadRow
                key={c.threadId}
                $unread={c.unreadCount > 0}
                $active={activeThreadId === c.threadId}
                onClick={() => { setIsNew(false); openMailThread(c.threadId); }}
              >
                <MailRowThumbWrap>
                  <MailRowThreadThumb>
                    <PlayerThumbnail playerName={c.otherParticipant.name} size={56} />
                  </MailRowThreadThumb>
                  <MailStatusDot $status={onlineMap.get(String(c.otherParticipant.id)) || "offline"} />
                  {c.unreadCount > 0 && <MailUnreadDot />}
                </MailRowThumbWrap>
                <MailThreadMeta>
                  <MailThreadMetaTop>
                    <MailThreadName $unread={c.unreadCount > 0}>{c.otherParticipant.name}</MailThreadName>
                    <MailThreadTime>{formatRelativeTime(c.lastMessage.createdAt)}</MailThreadTime>
                  </MailThreadMetaTop>
                  <MailThreadPreview $unread={c.unreadCount > 0}>
                    {c.lastMessage.isFromMe ? "You: " : ""}
                    {c.lastMessage.body?.startsWith(GIF_URL_PREFIX) ? "GIF" : c.lastMessage.body}
                  </MailThreadPreview>
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
              <MailHeaderThumbWrap onClick={(e) => openPlayerMenu({ id: mailThread.otherParticipant.id, userId: mailThread.otherParticipant.id, name: mailThread.otherParticipant.name }, e)}>
                <MailThreadThumb>
                  <PlayerThumbnail playerName={mailThread.otherParticipant.name} size={40} />
                </MailThreadThumb>
                <MailStatusDot $status={onlineMap.get(String(mailThread.otherParticipant.id)) || "offline"} />
              </MailHeaderThumbWrap>
              <MailHeaderNameCol>
                <MailDetailWith>
                  <ConvoNameHover onClick={(e) => openPlayerMenu({ id: mailThread.otherParticipant.id, userId: mailThread.otherParticipant.id, name: mailThread.otherParticipant.name }, e)}>
                    {mailThread.otherParticipant.name}
                  </ConvoNameHover>
                </MailDetailWith>
                <MailHeaderStatusText $online={(onlineMap.get(String(mailThread.otherParticipant.id)) || "offline") === "online"}>
                  {onlineMap.get(String(mailThread.otherParticipant.id)) || "offline"}
                </MailHeaderStatusText>
              </MailHeaderNameCol>
              <MailHeaderActions>
                <MailHeaderBtn onClick={handleViewProfile}>
                  <IconProfile /> View Profile
                </MailHeaderBtn>
                <MailHeaderIconBtn disabled title="Coming soon">
                  <IconGift />
                </MailHeaderIconBtn>
                <MailHeaderIconBtn onClick={(e) => openPlayerMenu({ id: mailThread.otherParticipant.id, userId: mailThread.otherParticipant.id, name: mailThread.otherParticipant.name }, e)}>
                  <IconMore />
                </MailHeaderIconBtn>
              </MailHeaderActions>
            </MailDetailHeader>
            <MailMessageList ref={messageListRef}>
              {loadingMore && <MailLoadingMore>Loading…</MailLoadingMore>}
              {messageItems.map((item) => {
                if (item.kind === "divider") {
                  return (
                    <MailDateDivider key={item.key}>
                      <MailDateDividerLine />
                      <MailDateDividerPill>{item.label}</MailDateDividerPill>
                      <MailDateDividerLine $flip />
                    </MailDateDivider>
                  );
                }
                const msgPlayer = !item.mine
                  ? { id: mailThread.otherParticipant.id, userId: mailThread.otherParticipant.id, name: item.fromName }
                  : { id: null, userId: null, name: item.fromName };
                return (
                  <MailBubbleGroup key={item.key} $mine={item.mine}>
                    <MailBubbleAvatarSlot>
                      <ConvoThumbHover onClick={(e) => openPlayerMenu(msgPlayer, e)}>
                        <PlayerThumbnail playerName={item.fromName} size={40} />
                      </ConvoThumbHover>
                    </MailBubbleAvatarSlot>
                    <MailBubbleCol $mine={item.mine}>
                      {item.msgs.map((msg) => (
                        msg.body?.startsWith(GIF_URL_PREFIX) ? (
                          <MailBubbleGifWrap key={msg.id}>
                            <MailBubbleGifImg src={msg.body} alt="GIF" />
                            <MailBubbleGifTime>{formatShortTime(msg.createdAt)}</MailBubbleGifTime>
                          </MailBubbleGifWrap>
                        ) : (
                          <MailBubble key={msg.id} $mine={item.mine}>
                            {msg.body}
                            <MailBubbleTime $mine={item.mine}>{formatShortTime(msg.createdAt)}</MailBubbleTime>
                          </MailBubble>
                        )
                      ))}
                    </MailBubbleCol>
                  </MailBubbleGroup>
                );
              })}
              <div ref={messagesEndRef} />
            </MailMessageList>
            <MailReplyBox>
              {mailReplyError && <MailReplyError>{mailReplyError}</MailReplyError>}
              <MailComposerBar>
                <MailComposerIconBtn type="button" title="Emoji" onClick={toggleEmojiPicker}>
                  😊
                </MailComposerIconBtn>
                <MailComposerIconBtn
                  type="button"
                  title="GIF"
                  style={{ fontSize: 10, fontWeight: 800 }}
                  onClick={toggleGifPicker}
                >
                  GIF
                </MailComposerIconBtn>
                <MailComposerIconBtn type="button" title="Attachments (coming soon)" disabled>
                  <IconAttach />
                </MailComposerIconBtn>
                <MailComposerInput
                  ref={replyInputRef}
                  value={mailReplyBody}
                  onChange={(e) => setMailReplyBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleMailReply(); } }}
                  maxLength={2000}
                  placeholder="Write a message…"
                  disabled={mailReplySending}
                />
                <MailComposerSendBtn
                  onClick={handleMailReply}
                  disabled={!mailReplyBody.trim() || mailReplySending}
                  title="Send"
                >
                  <IconSend />
                </MailComposerSendBtn>
              </MailComposerBar>
            </MailReplyBox>
            {emojiPickerAnchor && createPortal(
              <MailEmojiPickerWrap ref={emojiPickerRef} style={{ left: emojiPickerAnchor.left, bottom: emojiPickerAnchor.bottom }}>
                <EmojiPicker
                  theme="light"
                  height={320}
                  width={300}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  onEmojiClick={(emojiData) => {
                    setMailReplyBody(mailReplyBody + emojiData.emoji);
                    setEmojiPickerAnchor(null);
                    replyInputRef.current?.focus();
                  }}
                />
              </MailEmojiPickerWrap>,
              document.body
            )}
            {gifPickerAnchor && createPortal(
              <GifPicker
                wrapRef={gifPickerRef}
                style={{ left: gifPickerAnchor.left, bottom: gifPickerAnchor.bottom }}
                onSelect={(gif) => {
                  setMailReplyBody(gif.file.hd.gif.url);
                  setGifPickerAnchor(null);
                  replyInputRef.current?.focus();
                }}
              />,
              document.body
            )}
          </>
        )}
      </MailDetailCol>
      {playerMenu && createPortal(
        <PlayerContextMenu
          ref={playerMenuRef}
          playerMenu={playerMenu}
          onClose={() => setPlayerMenu(null)}
          onViewProfile={(data) => { onOpenProfile?.(data); setPlayerMenu(null); }}
        />,
        document.body
      )}
    </HubPanelContainer>
  );
}
