/**
 * Bakes detailed procedural art into a RenderTexture instead of leaving it as a
 * live Graphics object.
 *
 * Phaser replays a Graphics object's entire command buffer every frame, so
 * artwork built from thousands of small fills — soil grain, a tree's foliage —
 * costs that much work per frame forever. Baking runs the drawing once and
 * collapses it to a single textured quad.
 *
 * `draw(g)` gets a scratch Graphics and should paint in WORLD coordinates;
 * `bounds` is the world rectangle to capture. Anything drawn outside `bounds`
 * is clipped, so leave margin for stroke widths and soft shadows.
 *
 * @returns {Phaser.GameObjects.RenderTexture} positioned at the bounds' origin.
 */
export function bakeGraphics(scene, draw, bounds, depth) {
  const { x, y, width, height } = bounds;

  // `false` keeps the scratch Graphics off the display list — it exists only
  // long enough to be stamped into the texture.
  const gfx = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(gfx);

  const rt = scene.add
    .renderTexture(x, y, Math.ceil(width), Math.ceil(height))
    .setOrigin(0, 0)
    .setDepth(depth);
  rt.draw(gfx, -x, -y);

  gfx.destroy();
  return rt;
}
