import { useEffect, useRef } from "react";
import { avatarCompositor } from "../../game/avatar/AvatarCompositor.js";
import { FRAME_W, FRAME_H, ROWS, POSE_REMAP } from "../../game/avatar/LayerConfig.js";

// Composites an avatar onto a <canvas> ref.
// poseIndex: 0-5, selects one of the 6 idle poses (remapped via POSE_REMAP).
// Returns a ref to attach to a <canvas width={CROP_W} height={CROP_H}> element.
export function useAvatarCanvas(gender, outfit, poseIndex = 0) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    avatarCompositor.composite(gender, outfit).then(baked => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      const col = POSE_REMAP[poseIndex] ?? 0;
      const srcX = col * FRAME_W;
      const srcY = ROWS.idle.y;
      ctx.clearRect(0, 0, FRAME_W, FRAME_H);
      ctx.drawImage(baked, srcX, srcY, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [gender, outfit, poseIndex]);

  return canvasRef;
}
