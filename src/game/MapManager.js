export const MAP_WIDTH = 5000;
export const MAP_HEIGHT = 1000;

const LAYER_W = 1578;
const LAYER_H = 714;

const PARALLAX_LAYERS = [
  { key: "parallax3", scroll: 0.2 },
  { key: "parallax2", scroll: 0.5 },
  { key: "parallax1", scroll: 1 },
];

export function preloadMap(scene) {
  scene.load.image("parallax1", "/assets/maps/parallax/layer1.webp");
  scene.load.image("parallax2", "/assets/maps/parallax/layer2.webp");
  scene.load.image("parallax3", "/assets/maps/parallax/layer3.webp");
  scene.load.json("colliders", "/assets/maps/old-town/colliders.json");
}

export function createMap(scene) {
  const scaleY = MAP_HEIGHT / LAYER_H;
  const scaledW = LAYER_W * scaleY;
  const tilesNeeded = Math.ceil(MAP_WIDTH / scaledW) + 1;

  PARALLAX_LAYERS.forEach(({ key, scroll }, layerIdx) => {
    for (let i = 0; i < tilesNeeded; i++) {
      scene.add
        .image(scaledW * i + scaledW / 2, MAP_HEIGHT / 2, key)
        .setScale(scaleY)
        .setScrollFactor(scroll)
        .setDepth(-10 + layerIdx);
    }
  });

  const collidersData = scene.cache.json.get("colliders");
  let walkableZones = [];
  if (collidersData?.walkableZones) {
    walkableZones = collidersData.walkableZones.map((z) => z.points);
  }
  return walkableZones;
}
