import { setPerspectiveFromColliders } from "./perspective";

// The camera is a fixed 1920x1080 window. Every map's world height is pinned to
// the camera height and its world width derived from the source image's aspect,
// so nothing is stretched. Maps narrower than the camera are widened to 1920 so
// camera bounds stay valid.
const WORLD_HEIGHT = 1080;
const CAMERA_WIDTH = 1920;

function worldWidth(imgW, imgH) {
  return Math.max(CAMERA_WIDTH, Math.round(imgW * (WORLD_HEIGHT / imgH)));
}

export const DEFAULT_MAP = "garden";

/**
 * Map registry. `side` picks which half of the Maps modal the map is listed on.
 * `colliders` is optional — a map without one is walkable everywhere inside its
 * bounds (see MovementManager, which treats an empty zone list as "no limits").
 */
export const MAPS = {
  garden: {
    id:      "garden",
    label:   "Garden",
    side:    "day",
    texture: "map-garden",
    path:    "/assets/maps/Garden/Garden.png",
    width:   worldWidth(10297, 1774), // 6272
    height:  WORLD_HEIGHT,
    colliders:    "/assets/maps/mainmap/colliders.json",
    collidersKey: "colliders-garden",
    spawn:   { x: 0.5, y: 0.65 },
  },
  plaza: {
    id:      "plaza",
    label:   "Plaza",
    side:    "day",
    texture: "map-plaza",
    path:    "/assets/maps/Plaza/Plaza.png",
    width:   worldWidth(10297, 1357), // 8196
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.88 },
  },
  beach: {
    id:      "beach",
    label:   "Beach",
    side:    "day",
    texture: "map-beach",
    path:    "/assets/maps/Beach/Beach.jpg",
    width:   worldWidth(3000, 1440), // 2250
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.72 },
  },
  pool: {
    id:      "pool",
    label:   "Pool",
    side:    "day",
    texture: "map-pool",
    path:    "/assets/maps/Pool/Pool.png",
    width:   worldWidth(10297, 1774), // 6272
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.93 },
  },
  ruins: {
    id:      "ruins",
    label:   "Ruins",
    side:    "night",
    texture: "map-ruins",
    path:    "/assets/maps/Ruins/Ruins.jpg",
    width:   worldWidth(3000, 1440), // 2250
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.78 },
  },
  castle: {
    id:      "castle",
    label:   "Castle",
    side:    "night",
    texture: "map-castle",
    path:    "/assets/maps/Castle/Castle.png",
    width:   worldWidth(3000, 1440), // 2250
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.88 },
  },
  graveyard: {
    id:      "graveyard",
    label:   "Graveyard",
    side:    "night",
    texture: "map-graveyard",
    path:    "/assets/maps/Graveyard/Graveyard.png",
    width:   worldWidth(10297, 1774), // 6272
    height:  WORLD_HEIGHT,
    colliders:    null,
    collidersKey: null,
    spawn:   { x: 0.5, y: 0.85 },
  },
};

export const MAP_LIST = Object.values(MAPS);

export function getMap(mapId) {
  return MAPS[mapId] || MAPS[DEFAULT_MAP];
}

export function spawnPoint(map) {
  return { x: Math.round(map.width * map.spawn.x), y: Math.round(map.height * map.spawn.y) };
}

let currentMapObjects = [];

/**
 * Boot-time preload — only the default map. The other backgrounds are large
 * (Garden alone is 20 MB) so they're fetched on demand by ensureMapLoaded().
 */
export function preloadMap(scene, mapId = DEFAULT_MAP) {
  const map = getMap(mapId);
  scene.load.image(map.texture, map.path);
  if (map.colliders) scene.load.json(map.collidersKey, map.colliders);
}

/**
 * Fetches a map's texture (and colliders) if the scene doesn't have them yet.
 * Resolves with the map config once the loader is done.
 */
export function ensureMapLoaded(scene, mapId, onProgress) {
  const map = getMap(mapId);
  const needsTexture   = !scene.textures.exists(map.texture);
  const needsColliders = !!map.collidersKey && !scene.cache.json.exists(map.collidersKey);

  if (!needsTexture && !needsColliders) return Promise.resolve(map);

  return new Promise((resolve) => {
    if (needsTexture)   scene.load.image(map.texture, map.path);
    if (needsColliders) scene.load.json(map.collidersKey, map.colliders);

    const handleProgress = (value) => onProgress?.(value);
    if (onProgress) scene.load.on("progress", handleProgress);

    // Fires even when an individual file errored — createMap() falls back to a
    // flat fill if the texture never arrived.
    scene.load.once("complete", () => {
      if (onProgress) scene.load.off("progress", handleProgress);
      resolve(map);
    });
    scene.load.start();
  });
}

/**
 * Tears down the previous map's display objects and builds `mapId`.
 * Returns { map, walkableZones, spawn }.
 */
export function createMap(scene, mapId = DEFAULT_MAP) {
  currentMapObjects.forEach((obj) => obj.destroy());
  currentMapObjects = [];

  const map = getMap(mapId);

  if (scene.textures.exists(map.texture)) {
    const bg = scene.add
      .image(map.width / 2, map.height / 2, map.texture)
      .setDisplaySize(map.width, map.height)
      .setScrollFactor(1)
      .setDepth(-10);
    currentMapObjects.push(bg);
  } else {
    const fill = scene.add
      .rectangle(map.width / 2, map.height / 2, map.width, map.height, 0x1a1030)
      .setScrollFactor(1)
      .setDepth(-10);
    currentMapObjects.push(fill);
  }

  let walkableZones = [];
  const collidersData = map.collidersKey ? scene.cache.json.get(map.collidersKey) : null;
  if (collidersData?.walkableZones) {
    walkableZones = collidersData.walkableZones.map((z) => z.points);
    setPerspectiveFromColliders(walkableZones);
  }

  return { map, walkableZones, spawn: spawnPoint(map) };
}
