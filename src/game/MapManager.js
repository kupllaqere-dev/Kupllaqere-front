export const MAP_WIDTH = 5000;
export const MAP_HEIGHT = 1000;

const LAYER_W = 1578;
const LAYER_H = 714;

const PARALLAX_LAYERS = [
  { key: "parallax3", scroll: 0.2 },
  { key: "parallax2", scroll: 0.5 },
  { key: "parallax1", scroll: 1 },
];

const MAP_CONFIGS = {
  main: {
    type: "parallax",
    layers: PARALLAX_LAYERS,
    colliders: "/assets/maps/old-town/colliders.json",
  },
  "old-town": {
    type: "single",
    background: { key: "old-town-bg", path: "/assets/maps/old-town/background2.webp" },
    colliders: "/assets/maps/old-town/colliders.json",
  },
};

let currentMapObjects = [];

export function preloadMap(scene) {
  scene.load.image("parallax1", "/assets/maps/parallax/layer1.webp");
  scene.load.image("parallax2", "/assets/maps/parallax/layer2.webp");
  scene.load.image("parallax3", "/assets/maps/parallax/layer3.webp");
  scene.load.image("old-town-bg", "/assets/maps/old-town/background2.webp");
  scene.load.json("colliders", "/assets/maps/old-town/colliders.json");
}

export function createMap(scene, mapName = "main") {
  // Clear previous map objects
  currentMapObjects.forEach((obj) => obj.destroy());
  currentMapObjects = [];

  const config = MAP_CONFIGS[mapName] || MAP_CONFIGS.main;
  const scaleY = MAP_HEIGHT / LAYER_H;
  const scaledW = LAYER_W * scaleY;
  const tilesNeeded = Math.ceil(MAP_WIDTH / scaledW) + 1;

  if (config.type === "parallax") {
    config.layers.forEach(({ key, scroll }, layerIdx) => {
      for (let i = 0; i < tilesNeeded; i++) {
        const img = scene.add
          .image(scaledW * i + scaledW / 2, MAP_HEIGHT / 2, key)
          .setScale(scaleY)
          .setScrollFactor(scroll)
          .setDepth(-10 + layerIdx);
        currentMapObjects.push(img);
      }
    });
  } else if (config.type === "single") {
    const bg = scene.add
      .image(MAP_WIDTH / 2, MAP_HEIGHT / 2, config.background.key)
      .setDisplaySize(MAP_WIDTH, MAP_HEIGHT)
      .setScrollFactor(1)
      .setDepth(-10);
    currentMapObjects.push(bg);
  }

  const collidersData = scene.cache.json.get("colliders");
  let walkableZones = [];
  if (collidersData?.walkableZones) {
    walkableZones = collidersData.walkableZones.map((z) => z.points);
  }
  return walkableZones;
}
