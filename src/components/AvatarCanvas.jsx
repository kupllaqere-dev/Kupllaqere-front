import { useEffect, useRef } from "react";

const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];

// First idle frame: x=0, y=0, w=510, h=900. Crop to show full body.
const CROP = { sx: 60, sy: 0, sw: 390, sh: 880 };

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
export default function AvatarCanvas({ gender, outfit, width = 156, height = 352 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const base = gender === "male" ? BASE_SPRITES.male : BASE_SPRITES.female;
    const layerUrls = LAYER_ORDER
      .filter((cat) => outfit?.[cat]?.imageUrl)
      .map((cat) => outfit[cat].imageUrl);

    Promise.all([base, ...layerUrls].map(loadImage)).then((images) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const img of images) {
        if (!img) continue;
        ctx.drawImage(img, CROP.sx, CROP.sy, CROP.sw, CROP.sh, 0, 0, canvas.width, canvas.height);
      }
    });

    return () => { cancelled = true; };
  }, [gender, outfit]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block", imageRendering: "pixelated" }}
    />
  );
}
