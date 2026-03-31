import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const Panel = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 340px;
  height: 380px;
  background: rgba(15, 15, 15, 0.88);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  pointer-events: all;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
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
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }
`;

const Msg = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
  word-break: break-word;

  .author {
    font-weight: 700;
    color: ${(p) => p.$color || "#8bb4ff"};
    margin-right: 6px;
  }

  .whisper-label {
    color: #c78bff;
    font-style: italic;
    font-size: 11px;
    margin-right: 4px;
  }

  .system {
    color: rgba(255, 255, 255, 0.35);
    font-style: italic;
  }
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

  option {
    background: #1a1a1a;
    color: #fff;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 13px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const NAME_COLORS = [
  "#8bb4ff",
  "#ff8b8b",
  "#8bffc3",
  "#ffd88b",
  "#d88bff",
  "#8bfff5",
  "#ff8bd8",
  "#b8ff8b",
  "#ffb88b",
  "#8b9eff",
];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}

export default function ChatBox({
  messages,
  whispers,
  players,
  myId,
  onSend,
  onWhisper,
}) {
  const [tab, setTab] = useState("general");
  const [text, setText] = useState("");
  const [whisperTo, setWhisperTo] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeMessages = tab === "general" ? messages : whispers;

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
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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

  const otherPlayers = players.filter((p) => p.id !== myId);

  return (
    <Panel>
      <Tabs>
        <Tab $active={tab === "general"} onClick={() => setTab("general")}>
          General
        </Tab>
        <Tab $active={tab === "whisper"} onClick={() => setTab("whisper")}>
          Whisper
        </Tab>
      </Tabs>

      <Messages>
        {activeMessages.length === 0 && (
          <Msg>
            <span className="system">
              {tab === "general" ? "No messages yet..." : "No whispers yet..."}
            </span>
          </Msg>
        )}
        {activeMessages.map((msg, i) => (
          <Msg key={msg.id || i} $color={colorForName(msg.from?.name || "?")}>
            {tab === "whisper" && (
              <span className="whisper-label">
                {msg.from?.id === myId ? `To ${msg.toName || "?"}` : "From"}
              </span>
            )}
            <span className="author">{msg.from?.name || "???"}</span>
            {msg.text}
          </Msg>
        ))}
        <div ref={messagesEndRef} />
      </Messages>

      <InputRow onSubmit={handleSubmit}>
        {tab === "whisper" && (
          <WhisperTarget
            value={whisperTo}
            onChange={(e) => setWhisperTo(e.target.value)}
          >
            <option value="">To...</option>
            {otherPlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
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
    </Panel>
  );
}
