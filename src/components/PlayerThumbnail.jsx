import { useEffect, useRef, useState } from "react";
import { avatarCompositor } from "../game/avatar/AvatarCompositor.js";
import { ROWS } from "../game/avatar/LayerConfig.js";
import { lookupUser } from "../api/auth.js";

// Crop within the front-facing idle frame (col 0, 510×900) to show head + shoulders
const CROP = { sx: 163, sy: 105, sw: 185, sh: 185 };


const appearanceCache = new Map();
function fetchAppearance(playerName) {
  if (appearanceCache.has(playerName)) return appearanceCache.get(playerName);
  const promise = lookupUser(playerName)
    .then(user => ({ gender: user?.gender ?? "female", outfit: user?.outfit ?? {} }))
    .catch(() => null);
  appearanceCache.set(playerName, promise);
  return promise;
}

export default function PlayerThumbnail({ playerName, gender: genderProp, outfit: outfitProp, size = 36 }) {
  const canvasRef = useRef(null);
  // Track which key the canvas was last drawn for
  const [drawnKey, setDrawnKey] = useState(null);
  const currentKey = `${playerName}|${genderProp}|${size}|${JSON.stringify(outfitProp)}`;
  const ready = drawnKey === currentKey;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let gender = genderProp;
      let outfit = outfitProp;

      if (!gender && playerName) {
        const data = await fetchAppearance(playerName);
        if (cancelled || !data) return;
        gender = data.gender;
        outfit = data.outfit;
      }
      if (!gender) return;

      const baked = await avatarCompositor.compositeIdle(gender, outfit ?? {});
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.ceil(window.devicePixelRatio || 2);
      const px = size * dpr;
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, px, px);
      // Crop head+shoulders from front-facing idle pose (column 0)
      ctx.drawImage(
        baked,
        CROP.sx, ROWS.idle.y + CROP.sy, CROP.sw, CROP.sh,
        0, 0, px, px,
      );
      setDrawnKey(currentKey);
    })().catch(() => {});

    return () => { cancelled = true; };
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      flexShrink: 0,
      borderRadius: "50%",
      overflow: "hidden",
      background: "rgba(30, 30, 30, 0.6)",
    }}>
      {!ready && (
        <span style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.3)",
          fontSize: Math.round(size * 0.4),
          userSelect: "none",
          pointerEvents: "none",
        }}>
          ?
        </span>
      )}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          position: "absolute",
          inset: 0,
          width: size,
          height: size,
          display: "block",
          opacity: ready ? 1 : 0,
        }}
      />
    </div>
  );
}
