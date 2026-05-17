import makeChatBubble from "./makeChatBubble.js";

export default class ChatBubbleManager {
  constructor() {
    this.bubble = null;
    this.timer = null;
  }

  show(scene, player, text) {
    this.destroy();

    this.bubble = makeChatBubble(
      scene,
      player.x,
      player.y - player.displayHeight - 10,
      text,
    );

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
