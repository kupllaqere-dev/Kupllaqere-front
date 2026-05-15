import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const AVATAR_BG = [
  "#4f46e5", "#7c3aed", "#0891b2", "#0d9488",
  "#059669", "#d97706", "#dc2626", "#9333ea",
  "#2563eb", "#db2777",
];

function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length];
}

const MIN_W = 380, MAX_W = 900, MIN_H = 260, MAX_H = 700;

const Panel = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(15, 15, 15, 0.88);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  z-index: 1000;
  pointer-events: all;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  user-select: none;
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  cursor: nw-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    width: 9px;
    height: 9px;
    border-top: 2px solid rgba(255, 255, 255, 0.22);
    border-left: 2px solid rgba(255, 255, 255, 0.22);
    border-radius: 1px;
    transition: border-color 0.15s;
  }

  &:hover::before {
    border-color: rgba(255, 255, 255, 0.55);
  }
`;

const Sidebar = styled.div`
  width: 130px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow-y: auto;
  padding: 8px 4px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 2px;
  }
`;

const SidebarTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.32);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 6px 8px;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 6px;
  transition: background 0.1s;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const AvatarCircle = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$bg};
`;

const UserName = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px 0;
  background: ${(p) => (p.$active ? "rgba(255,255,255,0.06)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "rgba(255,255,255,0.4)")};
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
  }
`;

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
`;

const MsgRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  line-height: 1.45;
  word-break: break-word;

  .name-self  { color: #4ade80; font-weight: 700; }
  .name-other { color: #60a5fa; font-weight: 700; }
  .whisper-label { color: #c78bff; font-size: 11px; font-style: italic; margin-right: 3px; }
  .msg-text   { color: rgba(255, 255, 255, 0.85); }
`;

const MsgAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$bg};
`;

const InputRow = styled.form`
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
`;

const WhisperTarget = styled.select`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #c78bff;
  font-size: 12px;
  padding: 0 8px;
  outline: none;
  cursor: pointer;
  max-width: 110px;

  option { background: #1a1a1a; color: #fff; }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 13px;
  outline: none;

  &::placeholder { color: rgba(255, 255, 255, 0.3); }
`;

const MinimizeBtn = styled.button`
  width: 34px;
  flex-shrink: 0;
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;

  &:hover { color: #fff; }
`;

const MinimizedSquare = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(15, 15, 15, 0.88);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  z-index: 1000;
  pointer-events: all;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover { background: rgba(35, 35, 35, 0.92); }
`;

export default function ChatBox({ messages, whispers, players, myId, myName, onSend, onWhisper }) {
  const [tab, setTab] = useState("general");
  const [text, setText] = useState("");
  const [whisperTo, setWhisperTo] = useState("");
  const [size, setSize] = useState({ width: 520, height: 380 });
  const [minimized, setMinimized] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeMessages = tab === "general" ? messages : whispers;
  const allPlayers = [{ id: myId, name: myName || "You" }, ...players];
  const otherPlayers = players.filter((p) => p.id !== myId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, tab]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function handlePointerDown(e) {
      if (e.target !== inputRef.current) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    function onMove(ev) {
      setSize({
        width:  Math.max(MIN_W, Math.min(MAX_W, startW + (startX - ev.clientX))),
        height: Math.max(MIN_H, Math.min(MAX_H, startH + (startY - ev.clientY))),
      });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    if (tab === "whisper") {
      if (whisperTo) onWhisper(whisperTo, msg);
    } else {
      onSend(msg);
    }
    setText("");
  }

  if (minimized) {
    return (
      <MinimizedSquare onClick={() => setMinimized(false)} title="Open chat">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </MinimizedSquare>
    );
  }

  return (
    <Panel style={{ width: size.width, height: size.height }}>
      <ResizeHandle onMouseDown={startResize} title="Drag to resize" />

      <Sidebar>
        <SidebarTitle>In Room</SidebarTitle>
        {allPlayers.map((p) => (
          <UserCard key={p.id || "self"}>
            <AvatarCircle $bg={avatarColor(p.name)}>
              {(p.name || "?")[0].toUpperCase()}
            </AvatarCircle>
            <UserName>{p.name}</UserName>
          </UserCard>
        ))}
      </Sidebar>

      <ChatArea>
        <Tabs>
          <Tab $active={tab === "general"} onClick={() => setTab("general")}>General</Tab>
          <Tab $active={tab === "whisper"} onClick={() => setTab("whisper")}>Whisper</Tab>
          <MinimizeBtn onClick={() => setMinimized(true)} title="Minimize">—</MinimizeBtn>
        </Tabs>

        <Messages>
          {activeMessages.length === 0 && (
            <span style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic", fontSize: 12 }}>
              {tab === "general" ? "No messages yet..." : "No whispers yet..."}
            </span>
          )}
          {activeMessages.map((msg, i) => (
            <MsgRow key={msg.id || i}>
              <MsgAvatar $bg={avatarColor(msg.from?.name || "?")}>
                {(msg.from?.name || "?")[0].toUpperCase()}
              </MsgAvatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                {tab === "whisper" && (
                  <span className="whisper-label">
                    {msg.from?.id === myId ? `→ ${msg.toName || "?"}` : "whisper"}{" "}
                  </span>
                )}
                <span className={msg.from?.id === myId ? "name-self" : "name-other"}>
                  {msg.from?.name || "???"}
                </span>
                {": "}
                <span className="msg-text">{msg.text}</span>
              </div>
            </MsgRow>
          ))}
          <div ref={messagesEndRef} />
        </Messages>

        <InputRow onSubmit={handleSubmit}>
          {tab === "whisper" && (
            <WhisperTarget value={whisperTo} onChange={(e) => setWhisperTo(e.target.value)}>
              <option value="">To...</option>
              {otherPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </WhisperTarget>
          )}
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            placeholder={tab === "whisper" ? "Whisper..." : "Type a message..."}
            maxLength={200}
          />
        </InputRow>
      </ChatArea>
    </Panel>
  );
}
