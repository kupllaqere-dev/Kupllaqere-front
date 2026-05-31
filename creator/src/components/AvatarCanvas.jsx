import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const FRAME_W    = 510;
const FRAME_H    = 900;
const SHEET_COLS = 6;
const IDLE_FRAMES = [0, 1, 2, 3, 5, 4];

const ANIM = {
  down:  { idle: IDLE_FRAMES, walk: [18, 19, 20, 21] },
  left:  { idle: IDLE_FRAMES, walk: [6, 7, 8, 9, 10, 11] },
  right: { idle: IDLE_FRAMES, walk: [12, 13, 14, 15, 16, 17] },
  up:    { idle: IDLE_FRAMES, walk: [24, 25, 26, 27] },
};
const DIR_CYCLE = ["down", "left", "up", "right"];

const imageCache = new Map();
function loadImg(url) {
  if (!imageCache.has(url)) {
    const p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return imageCache.get(url);
}

function baseUrl(gender) {
  return gender === "male"
    ? "/assets/character-bases/men-test.png"
    : "/assets/character-bases/females_new.png";
}

export default function AvatarCanvas({ gender = "female", itemImageUrls = [], width = 204, height = 360 }) {
  const canvasRef   = useRef(null);
  const [dir, setDir]           = useState("down");
  const [mode, setMode]         = useState("idle");
  const [frameIdx, setFrameIdx] = useState(0);

  const frames = ANIM[dir][mode];
  const prevKeyRef = useRef(`${dir}-${mode}`);

  useEffect(() => {
    if (mode === "idle") return;
    const key = `${dir}-${mode}`;
    if (prevKeyRef.current !== key) { prevKeyRef.current = key; setFrameIdx(0); }
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % frames.length), 250);
    return () => clearInterval(id);
  }, [mode, dir, frames.length]);

  useEffect(() => {
    const frameNum = frames[frameIdx] ?? frames[0];
    const col = frameNum % SHEET_COLS;
    const row = Math.floor(frameNum / SHEET_COLS);
    const sx  = col * FRAME_W;
    const sy  = row * FRAME_H;

    const urls = [baseUrl(gender), ...itemImageUrls].filter(Boolean);
    Promise.all(urls.map(loadImg)).then((imgs) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const img of imgs) {
        if (!img) continue;
        ctx.drawImage(img, sx, sy, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
      }
    });
  }, [gender, itemImageUrls, frameIdx, frames, dir]);

  const step = (delta) => {
    if (mode === "idle") {
      setFrameIdx((i) => (i - delta + IDLE_FRAMES.length) % IDLE_FRAMES.length);
    } else {
      setDir((d) => DIR_CYCLE[(DIR_CYCLE.indexOf(d) - delta + DIR_CYCLE.length) % DIR_CYCLE.length]);
    }
  };

  return (
    <Wrap>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, display: "block", imageRendering: "pixelated" }}
      />
      <Controls>
        <TurnBtn onClick={() => step(-1)}>◀</TurnBtn>
        <DirLabel>{mode === "idle" ? `${frameIdx + 1} / ${IDLE_FRAMES.length}` : dir}</DirLabel>
        <TurnBtn onClick={() => step(1)}>▶</TurnBtn>
      </Controls>
      <ModeToggle>
        <ModeBtn $active={mode === "idle"} onClick={() => setMode("idle")}>Idle</ModeBtn>
        <ModeBtn $active={mode === "walk"} onClick={() => setMode("walk")}>Walk</ModeBtn>
      </ModeToggle>
    </Wrap>
  );
}

const Wrap = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;`;
const Controls = styled.div`display:flex;align-items:center;gap:10px;`;
const TurnBtn = styled.button`
  padding:5px 12px;border-radius:6px;border:1px solid #ffffff18;
  background:transparent;color:#ccc;font-size:14px;cursor:pointer;
  &:hover{background:rgba(255,255,255,0.08);}
`;
const DirLabel = styled.span`font-size:12px;color:#777;min-width:40px;text-align:center;text-transform:capitalize;`;
const ModeToggle = styled.div`display:flex;gap:6px;`;
const ModeBtn = styled.button`
  padding:5px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p) => p.$active ? "rgba(104,207,238,0.8)" : "#ffffff18"};
  background:${(p) => p.$active ? "rgba(104,207,238,0.2)" : "transparent"};
  color:${(p) => p.$active ? "#a8e6f5" : "#666"};
  &:hover{border-color:#68cfee;color:#a8e6f5;}
`;
