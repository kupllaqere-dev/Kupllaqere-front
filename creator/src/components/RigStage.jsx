import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { RigView, getSharedRig } from "@avatar/RigView.js";

const BACKGROUNDS = {
  dark:    "#121216",
  checker: "repeating-conic-gradient(#2a2a31 0% 25%, #222228 0% 50%) 50% / 24px 24px",
  light:   "#e9e9ee",
  grass:   "linear-gradient(#bfe3f5 0%, #dff1f8 62%, #8fc46d 62%, #7db35c 100%)",
};

/**
 * The in-game avatar on a canvas, wearing `garments` ({ part, layer, piece }).
 * Fills its container; `overlay` renders over the stage (e.g. a notice).
 */
export default function RigStage({ garments = [], overlay = null, compact = false }) {
  const canvasRef = useRef(null);
  const viewRef   = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const [animation, setAnimation] = useState("idle");
  const [facing, setFacing]       = useState(1);
  const [fadeBody, setFadeBody]   = useState(false);
  const [showBones, setShowBones] = useState(false);
  const [bg, setBg]               = useState("checker");

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
      .catch((e) => setError(e.message));
    return () => { cancelled = true; view?.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    viewRef.current?.set({ garments, animation, facing, bodyAlpha: fadeBody ? 0.35 : 1, showBones });
  }, [ready, garments, animation, facing, fadeBody, showBones]);

  return (
    <Wrap>
      <Stage style={{ background: BACKGROUNDS[bg] }}>
        <Canvas ref={canvasRef} />
        {error && <Notice $error>Couldn't load the avatar: {error}</Notice>}
        {!error && overlay && <Notice>{overlay}</Notice>}
      </Stage>
      <Toolbar $compact={compact}>
        <Seg>
          <SegBtn $on={animation === "idle"} onClick={() => setAnimation("idle")}>Idle</SegBtn>
          <SegBtn $on={animation === "walk"} onClick={() => setAnimation("walk")}>Walk</SegBtn>
        </Seg>
        <Seg>
          <SegBtn $on={facing === 1}  onClick={() => setFacing(1)}  title="Face left">◀</SegBtn>
          <SegBtn $on={facing === -1} onClick={() => setFacing(-1)} title="Face right">▶</SegBtn>
        </Seg>
        <Toggle $on={fadeBody} onClick={() => setFadeBody((v) => !v)} title="Fade the body to see the clothing on its own">Fade body</Toggle>
        <Toggle $on={showBones} onClick={() => setShowBones((v) => !v)} title="Show the skeleton each piece is pinned to">Bones</Toggle>
        <Swatches>
          {Object.entries(BACKGROUNDS).map(([key, value]) => (
            <Swatch key={key} $on={bg === key} style={{ background: value }} onClick={() => setBg(key)} title={`${key} background`} />
          ))}
        </Swatches>
      </Toolbar>
    </Wrap>
  );
}

const Wrap = styled.div`display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;`;
const Stage = styled.div`
  position:relative;flex:1;min-height:0;border-radius:12px;overflow:hidden;
  border:1px solid #ffffff10;
`;
const Canvas = styled.canvas`position:absolute;inset:0;width:100%;height:100%;display:block;`;
const Notice = styled.div`
  position:absolute;left:50%;bottom:16px;transform:translateX(-50%);
  max-width:calc(100% - 32px);padding:8px 14px;border-radius:8px;
  font-size:12px;line-height:1.45;text-align:center;
  background:rgba(18,18,22,0.88);border:1px solid ${(p) => p.$error ? "rgba(239,68,68,0.5)" : "#ffffff18"};
  color:${(p) => p.$error ? "#ff8a8a" : "#c8c8d0"};
  backdrop-filter:blur(4px);
`;
const Toolbar = styled.div`
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  justify-content:${(p) => p.$compact ? "flex-start" : "center"};
`;
const Seg = styled.div`display:flex;border:1px solid #ffffff18;border-radius:7px;overflow:hidden;`;
const SegBtn = styled.button`
  padding:6px 12px;border:none;font-size:12px;font-weight:600;cursor:pointer;
  background:${(p) => p.$on ? "rgba(104,207,238,0.2)" : "transparent"};
  color:${(p) => p.$on ? "#a8e6f5" : "#777"};
  & + &{border-left:1px solid #ffffff18;}
  &:hover{color:#a8e6f5;}
`;
const Toggle = styled.button`
  padding:6px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p) => p.$on ? "rgba(104,207,238,0.6)" : "#ffffff18"};
  background:${(p) => p.$on ? "rgba(104,207,238,0.15)" : "transparent"};
  color:${(p) => p.$on ? "#a8e6f5" : "#777"};
  &:hover{color:#a8e6f5;}
`;
const Swatches = styled.div`display:flex;gap:5px;margin-left:4px;`;
const Swatch = styled.button`
  width:20px;height:20px;border-radius:50%;cursor:pointer;padding:0;
  border:2px solid ${(p) => p.$on ? "#68cfee" : "#ffffff25"};
`;
