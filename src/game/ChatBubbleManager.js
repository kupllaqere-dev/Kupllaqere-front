export default class ChatBubbleManager {
  constructor() {
    this.bubble = null;
    this.timer = null;
  }

  show(scene, player, text) {
    this.destroy();

    this.bubble = scene.add
      .text(player.x, player.y - player.displayHeight - 10, text, {
        fontSize: "11px",
        color: "#ffffff",
        backgroundColor: "#222222dd",
        padding: { x: 8, y: 5 },
        wordWrap: { width: 180 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(100);

    this.timer = setTimeout(() => {
      if (this.bubble) this.bubble.destroy();
      this.bubble = null;
    }, 5000);
  }

  updatePosition(player) {
    if (this.bubble) {
      this.bubble.setPosition(player.x, player.y - player.displayHeight - 10);
    }
  }

  destroy() {
    if (this.bubble) this.bubble.destroy();
    if (this.timer) clearTimeout(this.timer);
    this.bubble = null;
    this.timer = null;
  }
}
