const PAD_X  = 14;
const PAD_Y  = 10;
const RADIUS = 14;
const WRAP   = 180;

export default function makeChatBubble(scene, x, y, text) {
  const txt = scene.add.text(0, 0, text, {
    fontFamily: "'Quicksand', sans-serif",
    fontSize: "13px",
    fontStyle: "600",
    color: "#F2EEFF",
    wordWrap: { width: WRAP },
    align: "center",
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: "rgba(200,162,255,0.5)",
      blur: 10,
      fill: true,
      stroke: false,
    },
  });

  const bw = txt.width  + PAD_X * 2;
  const bh = txt.height + PAD_Y * 2;

  const gfx = scene.add.graphics();

  // Background
  gfx.fillStyle(0x101424, 0.72);
  gfx.fillRoundedRect(-bw / 2, -bh, bw, bh, RADIUS);

  // Border
  gfx.lineStyle(1, 0xffffff, 0.08);
  gfx.strokeRoundedRect(-bw / 2, -bh, bw, bh, RADIUS);

  // Subtle outer glow (box-shadow approximation)
  gfx.lineStyle(6, 0x8be9ff, 0.04);
  gfx.strokeRoundedRect(-bw / 2 - 3, -bh - 3, bw + 6, bh + 6, RADIUS + 2);

  txt.setPosition(-txt.width / 2, -bh + PAD_Y);

  return scene.add.container(x, y, [gfx, txt]).setDepth(100);
}
