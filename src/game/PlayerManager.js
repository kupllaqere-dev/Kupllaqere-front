import { perspectiveScale } from "./perspective";
import { baseTextureKey, genderScale, setNameBadge, layoutNameBadge } from "./LocalPlayer";
import makeChatBubble from "./makeChatBubble.js";

export const FRAME = {
  FRONT:       0,
  FRONT_LEFT:  1,
  LEFT:        2,
  BACK:        3,
  FRONT_RIGHT: 4,
  RIGHT:       5,
};

const MOVE_LERP_RATE  = 25;
const SCALE_LERP_RATE = 18;

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map();
    this.worldAvatarSystem = null;
  }

  addPlayer(scene, data) {
    if (this.otherPlayers.has(data.id)) return;

    const initialScale = perspectiveScale(data.y) * genderScale(data.gender);

    const shadowImg = scene.add.image(data.x, data.y, "shadow");
    shadowImg.setOrigin(0.5, 0.8);
    shadowImg.setScale(initialScale * 0.375);
    shadowImg.setAlpha(0.2);
    shadowImg.setDepth(data.y - 1);

    const sprite = scene.add.sprite(data.x, data.y, baseTextureKey(data.gender), FRAME.FRONT);
    sprite.setOrigin(0.5, 1);
    sprite.setScale(initialScale);
    sprite.setDepth(data.y);
    sprite.gender       = data.gender;
    sprite.currentScale = initialScale;

    sprite.setInteractive({ pixelPerfect: true });
    sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 2, 0));
    sprite.on("pointerout",  () => sprite.postFX.clear());
    sprite.on("pointerdown", (pointer) => {
      if (this.onPlayerClick) {
        this.onPlayerClick(data.id, data.name, pointer.event.clientX, pointer.event.clientY, data.userId);
      }
    });

    const nameText = scene.add
      .text(data.x, data.y + 8, data.name || "???", {
        fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
        fontSize:   "13px",
        color:      "#ffffff",
        shadow:     { offsetX: 0, offsetY: 1, color: "#000000", blur: 4, fill: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(data.y + 1);

    this.otherPlayers.set(data.id, {
      sprite,
      shadowImg,
      nameText,
      badgeIcon:    null,
      userId:       data.userId       || null,
      bio:          data.bio          || "",
      selectedBadge: data.selectedBadge || null,
      targetX:      data.x,
      targetY:      data.y,
      vx:           0,
      vy:           0,
      lastSnapshotMs: performance.now(),
      lastAnim:     null,
      lastFrame:    FRAME.FRONT,
    });

    if (data.selectedBadge) this.updateBadge(scene, data.id, data.selectedBadge);

    const avatarSys = this.worldAvatarSystem;
    if (avatarSys) {
      avatarSys.rebuild(data.id, data.gender, data.outfit || {}).then(key => {
        if (!sprite.scene) return;
        sprite.setTexture(key);
        sprite._animKey = (name) => avatarSys.animKey(data.id, name);
      }).catch(() => {});
    }
  }

  applyOutfit(id, gender, outfit) {
    const other    = this.otherPlayers.get(id);
    const avatarSys = this.worldAvatarSystem;
    if (!other || !avatarSys) return;
    avatarSys.rebuild(id, gender, outfit).then(key => {
      if (!other.sprite.scene) return;
      other.sprite.setTexture(key);
      other.sprite._animKey = (name) => avatarSys.animKey(id, name);
    }).catch(() => {});
  }

  updateBadge(scene, id, badge) {
    const other = this.otherPlayers.get(id);
    if (!other) return;
    other.selectedBadge = badge || null;
    other.badgeIcon = setNameBadge(scene, other.badgeIcon, other.nameText, badge);
  }

  pushSnapshot(data) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;

    const now     = performance.now();
    const elapsed = now - (other.lastSnapshotMs ?? now);

    if (!data.anim) {
      // Player stopped — kill velocity so extrapolation doesn't drift
      other.vx = 0;
      other.vy = 0;
    } else if (elapsed > 0 && elapsed < 250) {
      other.vx = (data.x - other.targetX) / (elapsed / 1000);
      other.vy = (data.y - other.targetY) / (elapsed / 1000);
    }

    other.targetX        = data.x;
    other.targetY        = data.y;
    other.lastSnapshotMs = now;

    if (data.anim) {
      const animKey = other.sprite._animKey?.(data.anim) ?? null;
      if (animKey && (other.sprite.anims.currentAnim?.key !== animKey || !other.sprite.anims.isPlaying)) {
        other.sprite.play(animKey);
      }
      other.lastAnim = data.anim;
    } else {
      const wasAnimating = other.lastAnim !== null;
      if (wasAnimating && other.sprite.anims.isPlaying) other.sprite.stop();
      other.lastAnim = null;
      if (data.frame !== undefined && (wasAnimating || data.frame !== other.lastFrame)) {
        other.sprite.setFrame(data.frame);
        other.lastFrame = data.frame;
      }
    }
  }

  interpolate(renderDeltaMs) {
    const moveAlpha  = 1 - Math.exp(-MOVE_LERP_RATE  * (renderDeltaMs / 1000));
    const scaleAlpha = 1 - Math.exp(-SCALE_LERP_RATE * (renderDeltaMs / 1000));

    for (const [, other] of this.otherPlayers) {
      // Extrapolate target forward by velocity, capped at 100 ms to avoid drift on stop
      const sinceSnapshot = Math.min((performance.now() - (other.lastSnapshotMs ?? 0)) / 1000, 0.1);
      const predictedX = other.targetX + (other.vx ?? 0) * sinceSnapshot;
      const predictedY = other.targetY + (other.vy ?? 0) * sinceSnapshot;

      const x = other.sprite.x + (predictedX - other.sprite.x) * moveAlpha;
      const y = other.sprite.y + (predictedY - other.sprite.y) * moveAlpha;

      const targetScale = perspectiveScale(y) * genderScale(other.sprite.gender);
      const curScale    = other.sprite.currentScale ?? targetScale;
      const nextScale   = curScale + (targetScale - curScale) * scaleAlpha;
      other.sprite.currentScale = nextScale;

      other.sprite.setPosition(x, y);
      other.sprite.setScale(nextScale);
      other.sprite.setDepth(y);
      other.shadowImg.setPosition(x, y);
      other.shadowImg.setScale(nextScale * 0.375);
      other.shadowImg.setDepth(y - 1);
      other.nameText.setPosition(x, y + 8);
      other.nameText.setDepth(y + 1);
      if (other.badgeIcon?.visible) layoutNameBadge(other.badgeIcon, other.nameText);
      if (other.chatBubble) {
        other.chatBubble.setPosition(x, y - other.sprite.displayHeight - 10);
      }
    }
  }

  showChatBubble(scene, id, text) {
    const other = this.otherPlayers.get(id);
    if (!other) return;
    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer)  clearTimeout(other.chatTimer);
    const bubble = makeChatBubble(scene, other.sprite.x, other.sprite.y - other.sprite.displayHeight - 10, text);
    other.chatBubble = bubble;
    other.chatTimer  = setTimeout(() => { bubble.destroy(); other.chatBubble = null; }, 5000);
  }

  removePlayer(id) {
    const other = this.otherPlayers.get(id);
    if (!other) return;
    other.sprite.destroy();
    other.shadowImg.destroy();
    other.nameText.destroy();
    if (other.badgeIcon)  other.badgeIcon.destroy();
    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer)  clearTimeout(other.chatTimer);
    this.worldAvatarSystem?.destroy(id);
    this.otherPlayers.delete(id);
  }
}
