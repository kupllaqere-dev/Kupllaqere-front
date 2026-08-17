import { FRAME_W, FRAME_H } from "../../game/avatar/LayerConfig.js";
import { useAvatarCanvas } from "./useAvatarCanvas.js";

// Renders one idle pose of a composited avatar.
// Props:
//   gender    — "female" | "male"
//   outfit    — outfit object from Game state (slot → { itemId, imageUrl })
//   poseIndex — 0-5, which idle pose to display (default 0)
//   skinColor — "#rrggbb" skin tint, or null for the base sprite's own tone
//   scale     — CSS scale multiplier (default 1)
//   style     — extra inline styles
export default function AvatarCanvas({ gender, outfit, poseIndex = 0, skinColor = null, scale = 1, style }) {
  const canvasRef = useAvatarCanvas(gender, outfit, poseIndex, skinColor);

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_W}
      height={FRAME_H}
      style={{
        width:           FRAME_W * scale,
        height:          FRAME_H * scale,
        imageRendering:  "auto",
        display:         "block",
        ...style,
      }}
    />
  );
}
