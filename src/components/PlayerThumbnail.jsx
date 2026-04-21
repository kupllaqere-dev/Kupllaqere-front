import { useEffect, useRef } from "react";

const LAYER_ORDER = [
  "bottoms",
  "feet",
  "tops",
  "hands",
  "coats",
  "accessories",
  "hair",
  "head",
];

// Crop window inside the 510×900 FRONT frame, tuned to show head + shoulders.
const CROP = { sx: 125, sy: 30, sw: 260, sh: 260 };

const BASE_SPRITE_URLS = {
  female: "/assets/character-bases/females.png",
  male: "/assets/character-bases/men-test.png",
};

function baseSpriteUrl(gender) {
  return gender === "male" ? BASE_SPRITE_URLS.male : BASE_SPRITE_URLS.female;
}

const imageCache = new Map();
function loadImage(url) {
  if (!imageCache.has(url)) {
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, promise);
  }
  return imageCache.get(url);
}

export default function PlayerThumbnail({ outfit, gender, size = 36 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const urls = [
      baseSpriteUrl(gender),
      ...LAYER_ORDER
        .filter((cat) => outfit?.[cat]?.imageUrl)
        .map((cat) => outfit[cat].imageUrl),
    ];

    Promise.all(urls.map(loadImage)).then((images) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const img of images) {
        if (!img) continue;
        ctx.drawImage(
          img,
          CROP.sx, CROP.sy, CROP.sw, CROP.sh,
          0, 0, canvas.width, canvas.height,
        );
      }
    });

    return () => { cancelled = true; };
  }, [outfit, gender]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
