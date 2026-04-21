import { perspectiveScale } from "./perspective";

const FRAME = { FRONT: 0, FRONT_LEFT: 1, LEFT: 2, BACK: 3, FRONT_RIGHT: 4, RIGHT: 5 };

export { FRAME };

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map(); // socketId -> { sprite, nameText }
  }

  addPlayer(scene, data) {
    if (this.otherPlayers.has(data.id)) return;
    const s = perspectiveScale(data.y);
    const shadowImg = scene.add.image(data.x, data.y, "shadow");
    shadowImg.setOrigin(0.5, 0.8);
    shadowImg.setScale(s * 0.375);
    shadowImg.setAlpha(0.2);
    shadowImg.setDepth(data.y - 1);

    const sprite = scene.add.sprite(data.x, data.y, "player", FRAME.FRONT);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(s);
    sprite.setDepth(data.y);
    if (this.layerManager) {
      this.layerManager.registerBase(data.id, sprite);
    } else {
      sprite.setInteractive({ pixelPerfect: true });
      sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 2, 0));
      sprite.on("pointerout", () => sprite.postFX.clear());
    }
    sprite.on("pointerdown", (pointer) => {
      if (this.onPlayerClick) {
        this.onPlayerClick(data.id, data.name, pointer.event.clientX, pointer.event.clientY, data.userId);
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
    this.otherPlayers.set(data.id, { sprite, shadowImg, nameText, startX: data.x, startY: data.y, targetX: data.x, targetY: data.y, interpElapsed: 0 });
  }

  updatePlayer(data) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;

    // Snapshot current position as the start of the new interpolation segment
    other.startX = other.sprite.x;
    other.startY = other.sprite.y;
    other.targetX = data.x;
    other.targetY = data.y;
    other.interpElapsed = 0;

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

  /** Call every frame to smoothly interpolate remote players between server ticks. */
  interpolate(delta) {
    // Server sends updates every ~50ms; use a slightly longer window for smoothness
    const interpDuration = 60;
    for (const [, other] of this.otherPlayers) {
      if (other.targetX === undefined) continue;

      other.interpElapsed = (other.interpElapsed || 0) + delta;
      const t = Math.min(1, other.interpElapsed / interpDuration);

      const x = other.startX + (other.targetX - other.startX) * t;
      const y = other.startY + (other.targetY - other.startY) * t;

      const s = perspectiveScale(y);
      other.sprite.setPosition(x, y);
      other.sprite.setScale(s);
      other.sprite.setDepth(y);
      other.shadowImg.setPosition(x, y);
      other.shadowImg.setScale(s * 0.375);
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
