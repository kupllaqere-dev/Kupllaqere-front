import { useEffect, useRef } from "react";

const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];

// Sprite sheet: 6 columns × 510px wide, first row = idle poses (sy=0, sh=880)
const FRAME_W = 510;
const CROP_X_OFFSET = 60;
const CROP_W = 390;
const CROP_H = 880;

const BASE_SPRITES = {
  female: "/assets/character-bases/females_new.png",
  male: "/assets/character-bases/men-test.png",
};

const imageCache = new Map();
function loadImage(url) {
  if (!imageCache.has(url)) {
    const p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return imageCache.get(url);
}

// outfit: { category: { imageUrl } } — same shape as App.jsx outfit state
export default function AvatarCanvas({ gender, outfit, width = 156, height = 352, pose = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const base = gender === "male" ? BASE_SPRITES.male : BASE_SPRITES.female;
    const layerUrls = LAYER_ORDER
      .filter((cat) => outfit?.[cat]?.imageUrl)
      .map((cat) => outfit[cat].imageUrl);

    const FRAME_REMAP = [0, 1, 2, 3, 5, 4];
    const frameIndex = FRAME_REMAP[pose] ?? pose;
    const sx = frameIndex * FRAME_W + CROP_X_OFFSET;

    Promise.all([base, ...layerUrls].map(loadImage)).then((images) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const img of images) {
        if (!img) continue;
        ctx.drawImage(img, sx, 0, CROP_W, CROP_H, 0, 0, canvas.width, canvas.height);
      }
    });

    return () => { cancelled = true; };
  }, [gender, outfit, pose]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block", imageRendering: "pixelated", position: "relative", zIndex: 1 }}
    />
  );
}
