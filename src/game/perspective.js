const MIN_SCALE = 0.3;
const MAX_SCALE = 0.6;

let midY = 500; // default fallback
let rangeY = 500;

/**
 * Set the perspective midpoint from walkable zone colliders.
 * midY becomes the average Y of all collider points;
 * the range is derived from the min/max Y of those points.
 */
export function setPerspectiveFromColliders(walkableZones) {
  const allY = walkableZones.flat().map((p) => p[1]);
  if (allY.length === 0) return;
  midY = allY.reduce((a, b) => a + b, 0) / allY.length;
  const minColliderY = Math.min(...allY);
  const maxColliderY = Math.max(...allY);
  rangeY = Math.max(maxColliderY - minColliderY, 1) / 2;
}

/**
 * Returns a scale factor based on Y position to simulate depth perspective.
 * Higher Y (closer to bottom/camera) = bigger, lower Y (further) = smaller.
 */
export function perspectiveScale(y) {
  const t = Math.max(0, Math.min(1, (y - midY + rangeY) / (2 * rangeY)));
  return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
}
