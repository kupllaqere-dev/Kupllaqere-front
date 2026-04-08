const FRAME = { FRONT: 0, FRONT_LEFT: 1, LEFT: 2, BACK: 3, FRONT_RIGHT: 4, RIGHT: 5 };

export { FRAME };

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map(); // socketId -> { sprite, nameText }
  }

  addPlayer(scene, data) {
    if (this.otherPlayers.has(data.id)) return;
    const shadowImg = scene.add.image(data.x, data.y, "shadow");
    shadowImg.setOrigin(0.5, 0.8);
    shadowImg.setScale(0.15);
    shadowImg.setAlpha(0.2);
    shadowImg.setDepth(data.y - 1);

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
    this.otherPlayers.set(data.id, { sprite, shadowImg, nameText, targetX: data.x, targetY: data.y });
  }

  updatePlayer(data) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;

    // Store target position for interpolation instead of snapping
    other.targetX = data.x;
    other.targetY = data.y;

    if (data.anim) {
      if (other.sprite.anims.currentAnim?.key !== data.anim || !other.sprite.anims.isPlaying) {
        other.sprite.play(data.anim);
      }
    } else {
      if (other.sprite.anims.isPlaying) {
        other.sprite.stop();
      }
      if (data.frame !== undefined) {
        other.sprite.setFrame(data.frame);
      }
    }
  }

  /** Call every frame from the game update loop to smoothly interpolate remote players. */
  interpolate(delta) {
    const lerpSpeed = 0.015; // per ms — ~60% per 60fps frame
    for (const [, other] of this.otherPlayers) {
      if (other.targetX === undefined) continue;

      const t = Math.min(1, lerpSpeed * delta);
      const x = other.sprite.x + (other.targetX - other.sprite.x) * t;
      const y = other.sprite.y + (other.targetY - other.sprite.y) * t;

      other.sprite.setPosition(x, y);
      other.sprite.setDepth(y);
      other.shadowImg.setPosition(x, y);
      other.shadowImg.setDepth(y - 1);
      other.nameText.setPosition(x, y + 8);
      other.nameText.setDepth(y + 1);
      if (other.chatBubble) {
        other.chatBubble.setPosition(x, y - other.sprite.displayHeight - 10);
      }
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
    other.shadowImg.destroy();
    other.nameText.destroy();
    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer) clearTimeout(other.chatTimer);
    this.otherPlayers.delete(id);
  }
}
