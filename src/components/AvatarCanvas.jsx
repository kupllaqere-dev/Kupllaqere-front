import { useEffect, useRef } from "react";

const LAYER_ORDER = ["appearance", "bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];

const FRAME_W = 510;
const CROP_X_OFFSET = 60;
const CROP_W = 390;
const CROP_H = 880;
const FRAME_REMAP = [0, 1, 2, 3, 5, 4];
const POSE_COUNT = 6;

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

function bakeAllPoses(images) {
  return Array.from({ length: POSE_COUNT }, (_, poseIdx) => {
    const frameIndex = FRAME_REMAP[poseIdx] ?? poseIdx;
    const sx = frameIndex * FRAME_W + CROP_X_OFFSET;
    const c = document.createElement("canvas");
    c.width = CROP_W;
    c.height = CROP_H;
    const ctx = c.getContext("2d");
    for (const img of images) {
      if (!img) continue;
      ctx.drawImage(img, sx, 0, CROP_W, CROP_H, 0, 0, CROP_W, CROP_H);
    }
    return c;
  });
}

export default function AvatarCanvas({ gender, outfit, width = 156, height = 352, pose = 0 }) {
  const canvasRef = useRef(null);
  const bakedRef = useRef([]);

  // Re-bake all poses when gender or outfit changes
  useEffect(() => {
    let cancelled = false;
    const baseUrl = gender === "male" ? BASE_SPRITES.male : BASE_SPRITES.female;
    const layerUrls = LAYER_ORDER
      .filter((cat) => outfit?.[cat]?.imageUrl)
      .map((cat) => outfit[cat].imageUrl);

    Promise.all([baseUrl, ...layerUrls].map(loadImage)).then((images) => {
      if (cancelled) return;
      bakedRef.current = bakeAllPoses(images);
      // Draw current pose immediately after baking
      const canvas = canvasRef.current;
      if (!canvas) return;
      const baked = bakedRef.current[pose];
      if (!baked) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baked, 0, 0, canvas.width, canvas.height);
    });

    return () => { cancelled = true; };
  }, [gender, outfit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Instant draw on pose change — no async needed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const baked = bakedRef.current[pose];
    if (!baked) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baked, 0, 0, canvas.width, canvas.height);
  }, [pose]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: "block", imageRendering: "pixelated", position: "relative", zIndex: 1 }}
    />
  );
}
