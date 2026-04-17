const MIN_SCALE = 0.4;
const MAX_SCALE = 0.6;

let topY = 500;
let bottomY = 1000;

/**
 * Set the perspective bounds from walkable zone colliders.
 * Uses the actual min/max Y so the scale maps linearly across the full walkable area.
 */
export function setPerspectiveFromColliders(walkableZones) {
  const allY = walkableZones.flat().map((p) => p[1]);
  if (allY.length === 0) return;
  topY = Math.min(...allY);
  bottomY = Math.max(...allY);
  if (bottomY <= topY) bottomY = topY + 1;
}

/**
 * Returns a scale factor based on Y position to simulate depth perspective.
 * Higher Y (closer to bottom/camera) = bigger, lower Y (further/top) = smaller.
 */
export function perspectiveScale(y) {
  const t = Math.max(0, Math.min(1, (y - topY) / (bottomY - topY)));
  return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
}
