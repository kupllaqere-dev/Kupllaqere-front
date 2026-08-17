import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import EmojiPicker from "emoji-picker-react";
import PlayerThumbnail from "./PlayerThumbnail";
import PlayerContextMenu from "./PlayerContextMenu";

const CHAT_W    = 800;
const BAR_H     = 34;
const MIN_H     = 220;
const DEF_H     = 400;
const MAX_H     = 780;
const FLASH_H   = 150;
const FLASH_MS  = 10000;
const FLASH_MAX = 4;

const THEME_BG      = "rgba(0, 0, 0, 0.38)";
const THEME_BORDER  = "1px solid rgba(255,255,255,0.12)";
const THEME_SHADOW  = "0 0 20px rgba(139,233,255,0.05), 0 8px 32px rgba(0,0,0,0.35)";
const THEME_TEXT    = "#F2EEFF";
const THEME_TSHADOW = "0 0 10px rgba(200,162,255,0.25)";
const FONT          = "'Quicksand', sans-serif";
const PINK          = "#e879f9";
const PINK_LIGHT    = "#fce7f3";

/* ─── Layout ───────────────────────────────────────────────── */

const Root = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: ${CHAT_W}px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  z-index: 1000;
  pointer-events: none;
  font-family: ${FONT};
`;

/* ─── Collapsed bar ─────────────────────────────────────────── */

const Bar = styled.button`
  height: ${BAR_H}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: ${THEME_BG};
  border: ${THEME_BORDER};
  border-bottom: none;
  border-radius: 0;
  color: rgba(242, 238, 255, 0.5);
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  cursor: pointer;
  pointer-events: all;
  box-shadow: ${THEME_SHADOW};
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${THEME_TEXT}; background: rgba(0, 0, 0, 0.55); }
`;

/* ─── Flash overlay (collapsed) ─────────────────────────────── */

const FlashLayer = styled.div`
  position: absolute;
  bottom: ${BAR_H}px;
  left: 0;
  width: 100%;
  height: ${FLASH_H}px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 16px;
  box-sizing: border-box;
  pointer-events: none;
  overflow: hidden;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.42) 0%,
    rgba(0, 0, 0, 0.36) 20%,
    rgba(0, 0, 0, 0.26) 45%,
    rgba(0, 0, 0, 0.14) 72%,
    rgba(0, 0, 0, 0) 100%
  );
`;

const FlashLine = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${THEME_TEXT};
  text-shadow: 0 1px 4px rgba(0,0,0,0.85);
  line-height: 1.35;
  word-break: break-word;
`;

const FlashName = styled.span`
  color: ${p => p.$whisper ? PINK : p.$self ? "#4ade80" : "#93c5fd"};
`;

/* ─── Open panel ────────────────────────────────────────────── */

const Panel = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: ${THEME_BG};
  border: ${THEME_BORDER};
  border-bottom: none;
  border-radius: 18px 18px 0 0;
  box-shadow: ${THEME_SHADOW};
  color: ${THEME_TEXT};
  overflow: hidden;
  pointer-events: all;
  user-select: none;
  position: relative;
`;

const Grip = styled.div`
  height: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  &::before {
    content: '';
    width: 46px;
    height: 3px;
    border-radius: 2px;
    background: rgba(242,238,255,0.18);
    transition: background 0.15s;
  }
  &:hover::before { background: rgba(242,238,255,0.45); }
`;

const CollapseBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(242,238,255,0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  &:hover {
    color: ${THEME_TEXT};
    background: rgba(200,162,255,0.16);
    border-color: rgba(200,162,255,0.32);
  }
`;

/* ─── Room row ──────────────────────────────────────────────── */

const RoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 76px;
  flex-shrink: 0;
  padding: 0 64px 0 14px;
  border-bottom: ${THEME_BORDER};
  overflow-x: auto;
  overflow-y: hidden;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(242,238,255,0.15); border-radius: 3px; }
`;

const PlayerFrame = styled.div`
  width: ${p => p.$s}px;
  height: ${p => p.$s}px;
  border-radius: 50%;
  border: 1.5px solid ${p => p.$c};
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0,0,0,0.3);
  box-shadow: 0 0 7px ${p => p.$c}55;
`;

const ClickableAvatar = styled.div`
  border-radius: 50%;
  cursor: pointer;
  transition: filter 0.15s;
  &:hover { filter: drop-shadow(0 0 6px rgba(255,255,255,0.45)); }
`;

/* ─── Messages ──────────────────────────────────────────────── */

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-height: 0;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(242,238,255,0.15); border-radius: 3px; }
`;

const MsgRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.4;
  word-break: break-word;
`;

const MsgContent = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 1px;
`;

const MsgSender = styled.span`
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  color: ${p => p.$whisper ? (p.$self ? PINK : "#f0abfc") : p.$self ? "#4ade80" : "#93c5fd"};
  text-shadow: ${p => p.$whisper
    ? "0 0 10px rgba(232,121,249,0.4)"
    : p.$self ? "0 0 10px rgba(74,222,128,0.35)" : "0 0 10px rgba(147,197,253,0.35)"};
  &:hover { text-decoration: underline; }
`;

const MsgText = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${p => p.$whisper ? PINK_LIGHT : THEME_TEXT};
  text-shadow: ${THEME_TSHADOW};
`;

const EmptyNote = styled.span`
  color: rgba(242,238,255,0.3);
  font-style: italic;
  font-size: 13px;
  font-weight: 600;
`;

const ErrorMsgRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 8px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.22);
  color: rgba(239,68,68,0.9);
  font-size: 12.5px;
  font-weight: 600;
`;

/* ─── Input ─────────────────────────────────────────────────── */

const InputSection = styled.div`
  border-top: ${THEME_BORDER};
  flex-shrink: 0;
  position: relative;
`;

const InputRow = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 0 8px;
  min-height: 38px;
  transition: border-color 0.15s;
  &:focus-within {
    border-color: ${p => p.$whisper ? "rgba(232,121,249,0.45)" : "rgba(200,162,255,0.35)"};
  }
`;

const WhisperLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: ${PINK};
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
`;

const InputField = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: ${p => p.$whisper ? PINK : THEME_TEXT};
  font-family: ${FONT};
  font-size: 13.5px;
  font-weight: 600;
  outline: none;
  padding: 8px 6px;
  align-self: stretch;
  transition: color 0.15s;
  &::placeholder { color: rgba(242,238,255,0.28); }
`;

const InlineIconBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(242,238,255,0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: rgba(242,238,255,0.7); }
`;

const SendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${p => p.$whisper ? "rgba(232,121,249,0.2)" : "rgba(200,162,255,0.18)"};
  border: 1px solid ${p => p.$whisper ? "rgba(232,121,249,0.35)" : "rgba(200,162,255,0.28)"};
  color: ${THEME_TEXT};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
  &:hover { background: ${p => p.$whisper ? "rgba(232,121,249,0.35)" : "rgba(200,162,255,0.32)"}; }
`;

const EmojiPickerWrap = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  right: 44px;
  z-index: 200;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
`;

/* ─── Icons ─────────────────────────────────────────────────── */

const IconChevron = ({ dir = "up", size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === "up" ? <polyline points="6 15 12 9 18 15" /> : <polyline points="6 9 12 15 18 9" />}
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const isGif = text => typeof text === "string" && text.startsWith("https://static.klipy.com");

/* ─── Component ─────────────────────────────────────────────── */

const ChatBox = forwardRef(function ChatBox({ messages, whispers, players, myId, myName, onSend, onWhisper, onViewProfile }, ref) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(DEF_H);
  const [text, setText] = useState("");
  const [whisperTarget, setWhisperTarget] = useState(null);
  const [flashes, setFlashes] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [playerMenu, setPlayerMenu] = useState(null);

  const playerMenuRef  = useRef(null);
  const inputRef       = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef       = useRef(null);
  const heightRef      = useRef(DEF_H);
  const emojiPickerRef = useRef(null);
  const instantScrollRef = useRef(true);
  const openRef        = useRef(open);
  const flashIdRef     = useRef(0);
  const flashTimerRef  = useRef(null);

  useEffect(() => { heightRef.current = height; }, [height]);
  useEffect(() => { openRef.current = open; }, [open]);

  const others = useMemo(
    () => players.filter(p => p.id !== myId),
    [players, myId],
  );
  const roomPlayers = useMemo(
    () => [{ id: myId, name: myName || "You", self: true }, ...others],
    [myId, myName, others],
  );

  const visibleMessages = useMemo(() => {
    if (!whisperTarget) return messages;
    return whispers.filter(msg => {
      const isMe = msg.from?.id === myId;
      return (isMe ? msg.to : msg.from?.id) === whisperTarget.id;
    });
  }, [messages, whispers, whisperTarget, myId]);

  /* ── Flash queue: newly arrived messages surface above the collapsed bar ── */

  const lastChatRef    = useRef(null);
  const lastWhisperRef = useRef(null);
  const initedRef      = useRef(false);

  useEffect(() => {
    const pickNew = (list, seenRef) => {
      const last = list[list.length - 1] ?? null;
      const idx  = seenRef.current ? list.lastIndexOf(seenRef.current) : -1;
      const added = seenRef.current && idx === -1 ? [] : list.slice(idx + 1);
      seenRef.current = last;
      return added;
    };

    if (!initedRef.current) {
      initedRef.current = true;
      lastChatRef.current    = messages[messages.length - 1] ?? null;
      lastWhisperRef.current = whispers[whispers.length - 1] ?? null;
      return;
    }

    const added = [
      ...pickNew(messages, lastChatRef).map(m => ({ msg: m, whisper: false })),
      ...pickNew(whispers, lastWhisperRef).map(m => ({ msg: m, whisper: true })),
    ];
    if (!added.length) return;

    const entries = added.map(({ msg, whisper }) => ({
      key: ++flashIdRef.current,
      name: msg.from?.name || "???",
      text: msg.text,
      self: msg.from?.id === myId,
      whisper,
    }));

    setFlashes(prev => [...prev, ...entries].slice(-FLASH_MAX));

    // One shared timer for every visible flash: each new message restarts it,
    // so the whole stack clears together FLASH_MS after the latest one.
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashes([]), FLASH_MS);
  }, [messages, whispers, myId]);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  /* ── Imperative API ── */

  useImperativeHandle(ref, () => ({
    openWhisper({ id, name }) {
      instantScrollRef.current = true;
      openChat();
      setWhisperTarget({ id, name });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
  }), []);

  function openChat() {
    instantScrollRef.current = true;
    setOpen(true);
  }

  /* ── Scrolling ── */

  useEffect(() => {
    if (!open) return;
    const behavior = instantScrollRef.current ? "instant" : "smooth";
    instantScrollRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [visibleMessages.length, localErrors.length, open, whisperTarget]);

  /* ── Enter focuses / opens the chat ── */

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        if (!openRef.current) {
          instantScrollRef.current = true;
          openChat();
        }
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
    function handlePointerDown(e) {
      if (e.target !== inputRef.current) inputRef.current?.blur();
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  /* ── Picker / player menu dismissal ── */

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handle(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target))
        setShowEmojiPicker(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!playerMenu) return;
    function onDown(e) {
      if (!playerMenuRef.current?.contains(e.target)) setPlayerMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [playerMenu]);

  /* ── Clicking outside the panel collapses the chat ── */

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (panelRef.current?.contains(e.target)) return;
      // The player menu is portalled outside the panel — keep the chat open for it.
      if (playerMenuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openPlayerMenu(player, e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerMenu({ ...player, x: rect.right, y: rect.top });
  }

  /* ── Vertical resize (drag the grip upwards) ── */

  function startResize(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startH = heightRef.current;
    let rafId = null;
    function onMove(ev) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const newH = Math.max(MIN_H, Math.min(MAX_H, startH + (startY - ev.clientY)));
        heightRef.current = newH;
        if (panelRef.current) panelRef.current.style.height = newH + "px";
      });
    }
    function onUp() {
      if (rafId) cancelAnimationFrame(rafId);
      setHeight(heightRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  /* ── Sending ── */

  function addLocalError(message) {
    const id = Date.now();
    setLocalErrors(prev => [...prev, { id, message }]);
    setTimeout(() => setLocalErrors(prev => prev.filter(e => e.id !== id)), 5000);
  }

  function handleTextChange(e) {
    const val = e.target.value;
    // "/w <name> " switches the chat into a whisper with that player.
    const m = val.match(/^\/w (\S+) /);
    if (m) {
      const player = others.find(p => (p.name || "").toLowerCase() === m[1].toLowerCase());
      setWhisperTarget(player ? { id: player.id, name: player.name } : { name: m[1] });
      setText(val.slice(m[0].length));
      return;
    }
    setText(val);
  }

  function sendText(msg) {
    if (!whisperTarget) { onSend(msg); return; }
    let targetId = whisperTarget.id;
    if (!targetId) {
      targetId = others.find(
        p => (p.name || "").toLowerCase() === (whisperTarget.name || "").toLowerCase()
      )?.id;
    }
    if (targetId) onWhisper(targetId, msg);
    else addLocalError(`Whisper couldn't be sent, ${whisperTarget.name} is not online`);
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    sendText(msg);
    setText("");
  }

  return (
    <Root>
      {!open && flashes.length > 0 && (
        <FlashLayer>
          {flashes.map(f => (
            <FlashLine key={f.key}>
              <FlashName $self={f.self} $whisper={f.whisper}>{f.name}</FlashName>
              {" : "}
              {isGif(f.text) ? "🖼 GIF" : f.text}
            </FlashLine>
          ))}
        </FlashLayer>
      )}

      {open && (
        <Panel ref={panelRef} style={{ height }}>
          <Grip onMouseDown={startResize} title="Drag to resize" />
          <CollapseBtn type="button" title="Hide chat" onClick={() => setOpen(false)}>
            <IconChevron dir="down" />
          </CollapseBtn>

          <RoomRow>
            {roomPlayers.map(p => {
              const menuPlayer = { id: p.id, userId: p.userId ?? null, name: p.name };
              return (
                <PlayerFrame
                  key={p.id ?? p.name}
                  $s={54}
                  $c={p.self ? "rgba(74,222,128,0.6)" : "rgba(147,197,253,0.45)"}
                  title={p.self ? `${p.name} (you)` : p.name}
                >
                  <ClickableAvatar onClick={e => openPlayerMenu(menuPlayer, e)}>
                    <PlayerThumbnail playerName={p.name} size={54} />
                  </ClickableAvatar>
                </PlayerFrame>
              );
            })}
          </RoomRow>

          <MessagesArea>
            {visibleMessages.length === 0 && (
              <EmptyNote>
                {whisperTarget
                  ? `No whispers with ${whisperTarget.name} yet...`
                  : "No messages yet..."}
              </EmptyNote>
            )}
            {visibleMessages.map((msg, i) => {
              const isSelf = msg.from?.id === myId;
              const msgPlayer = msg.from ? {
                id: msg.from.id,
                userId: players.find(p => p.id === msg.from.id)?.userId ?? null,
                name: msg.from.name,
              } : null;
              return (
                <MsgRow key={msg.id || i}>
                  <PlayerFrame
                    $s={34}
                    $c={whisperTarget
                      ? "rgba(232,121,249,0.55)"
                      : isSelf ? "rgba(74,222,128,0.55)" : "rgba(147,197,253,0.45)"}
                  >
                    <ClickableAvatar onClick={e => openPlayerMenu(msgPlayer, e)}>
                      <PlayerThumbnail playerName={msg.from?.name} size={34} />
                    </ClickableAvatar>
                  </PlayerFrame>
                  <MsgContent>
                    <MsgSender
                      $self={isSelf}
                      $whisper={!!whisperTarget}
                      onClick={e => openPlayerMenu(msgPlayer, e)}
                    >
                      {msg.from?.name || "???"}
                    </MsgSender>
                    {isGif(msg.text)
                      ? <img
                          src={msg.text}
                          alt="GIF"
                          style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, display: "block", marginTop: 3 }}
                          onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                        />
                      : <MsgText $whisper={!!whisperTarget}>{" : "}{msg.text}</MsgText>}
                  </MsgContent>
                </MsgRow>
              );
            })}
            {localErrors.map(err => (
              <ErrorMsgRow key={err.id}>⚠ {err.message}</ErrorMsgRow>
            ))}
            <div ref={messagesEndRef} />
          </MessagesArea>

          <InputSection>
            {showEmojiPicker && (
              <EmojiPickerWrap ref={emojiPickerRef}>
                <EmojiPicker
                  theme="dark"
                  height={300}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                  onEmojiClick={emojiData => {
                    setText(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                />
              </EmojiPickerWrap>
            )}
            <InputRow onSubmit={handleSubmit}>
              <InputWrapper $whisper={!!whisperTarget}>
                {whisperTarget && (
                  <WhisperLabel>
                    →&nbsp;{whisperTarget.name}
                    <button
                      type="button"
                      onClick={() => { setWhisperTarget(null); inputRef.current?.focus(); }}
                      style={{
                        background: "none", border: "none",
                        color: "rgba(232,121,249,0.5)", cursor: "pointer",
                        fontSize: 15, padding: "0 1px", lineHeight: 1, fontFamily: FONT,
                      }}
                    >×</button>
                  </WhisperLabel>
                )}
                <InputField
                  ref={inputRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={e => e.stopPropagation()}
                  onKeyUp={e => e.stopPropagation()}
                  placeholder={whisperTarget ? "Type your whisper..." : "Type a message...  (/w name to whisper)"}
                  $whisper={!!whisperTarget}
                  maxLength={200}
                />
                <InlineIconBtn
                  type="button"
                  title="Emoji"
                  onClick={() => setShowEmojiPicker(v => !v)}
                >😊</InlineIconBtn>
              </InputWrapper>
              <SendBtn type="submit" $whisper={!!whisperTarget} title="Send">
                <IconSend />
              </SendBtn>
            </InputRow>
          </InputSection>
        </Panel>
      )}

      {!open && (
        <Bar type="button" onClick={openChat} title="Open chat">
          <IconChevron dir="up" size={16} />
          Chat
        </Bar>
      )}

      {playerMenu && createPortal(
        <PlayerContextMenu
          ref={playerMenuRef}
          playerMenu={playerMenu}
          onClose={() => setPlayerMenu(null)}
          onViewProfile={(data) => { onViewProfile?.(data); setPlayerMenu(null); }}
          onOpenWhisper={(p) => {
            setPlayerMenu(null);
            setWhisperTarget({ id: p.id, name: p.name });
            inputRef.current?.focus();
          }}
        />,
        document.body
      )}
    </Root>
  );
});

export default ChatBox;
