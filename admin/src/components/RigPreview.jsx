import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { RigView, getSharedRig } from "@avatar/RigView.js";

/** The in-game avatar wearing `garments`, with idle / walk and facing controls. */
export default function RigPreview({ garments, note = null, width = 260, height = 380 }) {
  const canvasRef = useRef(null);
  const viewRef   = useRef(null);
  const [ready, setReady]         = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [animation, setAnimation] = useState("idle");
  const [facing, setFacing]       = useState(1);

  useEffect(() => {
    let view = null;
    let cancelled = false;
    getSharedRig()
      .then((rig) => {
        if (cancelled || !canvasRef.current) return;
        view = new RigView(canvasRef.current, rig);
        viewRef.current = view;
        setReady(true);
      })
      .catch((e) => setLoadError(e.message));
    return () => { cancelled = true; view?.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    viewRef.current?.set({ garments, animation, facing });
  }, [ready, garments, animation, facing]);

  return (
    <Wrap>
      <Stage style={{ width, height }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        {(loadError || note) && <Note>{loadError ? `Couldn't load the avatar: ${loadError}` : note}</Note>}
      </Stage>
      <Controls>
        <ModeBtn $active={animation === "idle"} onClick={() => setAnimation("idle")}>Idle</ModeBtn>
        <ModeBtn $active={animation === "walk"} onClick={() => setAnimation("walk")}>Walk</ModeBtn>
        <TurnBtn onClick={() => setFacing((f) => -f)} title="Turn around">{facing === 1 ? "◀" : "▶"}</TurnBtn>
      </Controls>
    </Wrap>
  );
}

const Wrap = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;`;
const Stage = styled.div`
  position:relative;border-radius:10px;overflow:hidden;border:1px solid #ffffff10;
  background:repeating-conic-gradient(#1d1d24 0% 25%, #18181e 0% 50%) 50% / 22px 22px;
`;
const Note = styled.div`
  position:absolute;left:8px;right:8px;bottom:8px;padding:6px 8px;border-radius:6px;
  font-size:11px;line-height:1.4;text-align:center;color:#bbb;background:rgba(10,10,14,0.85);
`;
const Controls = styled.div`display:flex;gap:6px;`;
const ModeBtn = styled.button`
  padding:5px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p) => p.$active ? "rgba(123,47,247,0.8)" : "#ffffff18"};
  background:${(p) => p.$active ? "rgba(123,47,247,0.35)" : "transparent"};
  color:${(p) => p.$active ? "#c4a1ff" : "#666"};
  &:hover{border-color:#7b2ff7;color:#c4a1ff;}
`;
const TurnBtn = styled.button`
  padding:5px 12px;border-radius:6px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:hover{background:rgba(255,255,255,0.08);}
`;
