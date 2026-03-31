const FRAME = { FRONT: 0, FRONT_LEFT: 1, LEFT: 2, BACK: 3, FRONT_RIGHT: 4, RIGHT: 5 };

export { FRAME };

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map(); // socketId -> { sprite, nameText }
  }

  addPlayer(scene, data) {
    if (this.otherPlayers.has(data.id)) return;
    const sprite = scene.add.sprite(data.x, data.y, "player", FRAME.FRONT);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(0.4);
    sprite.setDepth(data.y);
    sprite.setInteractive({ pixelPerfect: true });
    sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 3, 0));
    sprite.on("pointerout", () => sprite.postFX.clear());
    sprite.on("pointerdown", (pointer) => {
      if (this.onPlayerClick) {
        this.onPlayerClick(data.id, data.name, pointer.event.clientX, pointer.event.clientY);
      }
    });
    const nameText = scene.add
      .text(data.x, data.y + 8, data.name || "???", {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        shadow: { offsetX: 0, offsetY: 1, color: "#000000", blur: 4, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(data.y + 1);
    this.otherPlayers.set(data.id, { sprite, nameText });
  }

  updatePlayer(data) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;
    other.sprite.setPosition(data.x, data.y);
    other.sprite.setDepth(data.y);
    if (data.frame !== undefined) other.sprite.setFrame(data.frame);
    other.nameText.setPosition(data.x, data.y + 8);
    other.nameText.setDepth(data.y + 1);
    if (other.chatBubble) {
      other.chatBubble.setPosition(data.x, data.y - other.sprite.displayHeight - 10);
    }
  }

  showChatBubble(scene, id, text) {
    const other = this.otherPlayers.get(id);
    if (!other) return;

    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer) clearTimeout(other.chatTimer);

    const bubble = scene.add
      .text(other.sprite.x, other.sprite.y - other.sprite.displayHeight - 10, text, {
        fontSize: "11px",
        color: "#ffffff",
        backgroundColor: "#222222dd",
        padding: { x: 8, y: 5 },
        wordWrap: { width: 180 },
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(100);

    other.chatBubble = bubble;
    other.chatTimer = setTimeout(() => {
      bubble.destroy();
      other.chatBubble = null;
    }, 5000);
  }

  removePlayer(id) {
    const other = this.otherPlayers.get(id);
    if (!other) return;
    other.sprite.destroy();
    other.nameText.destroy();
    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer) clearTimeout(other.chatTimer);
    this.otherPlayers.delete(id);
  }
}
