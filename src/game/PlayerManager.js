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

// Snapshot interpolation render delay (ms). 100 ms keeps us behind by one
// network tick so we always have two bracketing snapshots to interpolate.
const RENDER_DELAY_MS  = 100;
const MAX_BUFFER_AGE_MS = 1000;
const SCALE_LERP_RATE  = 18;

export { RENDER_DELAY_MS };

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map();
    // Set by Game.jsx after create() — used to build avatar textures on spawn.
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

    const seedTime = performance.now() - RENDER_DELAY_MS;
    this.otherPlayers.set(data.id, {
      sprite,
      shadowImg,
      nameText,
      badgeIcon:    null,
      userId:       data.userId       || null,
      bio:          data.bio          || "",
      selectedBadge: data.selectedBadge || null,
      buffer:       [{ t: seedTime, x: data.x, y: data.y }],
      lastAnim:     null,
      lastFrame:    FRAME.FRONT,
      lastRenderX:  data.x,
      lastRenderY:  data.y,
    });

    if (data.selectedBadge) this.updateBadge(scene, data.id, data.selectedBadge);

    // Build composited avatar texture asynchronously. Until ready the sprite
    // shows the base character, then swaps seamlessly.
    const avatarSys = this.worldAvatarSystem;
    if (avatarSys) {
      avatarSys.rebuild(data.id, data.gender, data.outfit || {}).then(key => {
        if (!sprite.scene) return; // player left before texture was ready
        sprite.setTexture(key);
        sprite._animKey = (name) => avatarSys.animKey(data.id, name);
      }).catch(() => {});
    }
  }

  // Re-composites the avatar for a player when their outfit changes.
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

  // Record an authoritative server snapshot for a remote player.
  // `data.anim` should be a normalized animation name ("walkLeft", etc.), not
  // a full Phaser key — the receiving sprite translates via sprite._animKey.
  pushSnapshot(data, receiveTimeMs) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;

    const t    = receiveTimeMs ?? performance.now();
    const last = other.buffer[other.buffer.length - 1];
    if (last && t <= last.t) return;
    if (typeof data.t === "number" && other.lastSenderT !== undefined && data.t < other.lastSenderT) return;
    if (typeof data.t === "number") other.lastSenderT = data.t;

    other.buffer.push({ t, x: data.x, y: data.y });

    const cutoff = performance.now() - MAX_BUFFER_AGE_MS;
    while (other.buffer.length > 2 && other.buffer[0].t < cutoff) other.buffer.shift();

    if (data.anim) {
      // Translate normalized name → full Phaser anim key for this sprite.
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
    const now        = performance.now();
    const renderTime = now - RENDER_DELAY_MS;
    const scaleAlpha = 1 - Math.exp(-SCALE_LERP_RATE * (renderDeltaMs / 1000));

    for (const [, other] of this.otherPlayers) {
      const buf = other.buffer;
      if (buf.length === 0) continue;

      let x, y;
      if (buf.length === 1 || renderTime <= buf[0].t) {
        x = buf[0].x; y = buf[0].y;
      } else if (renderTime >= buf[buf.length - 1].t) {
        x = buf[buf.length - 1].x; y = buf[buf.length - 1].y;
      } else {
        let a = buf[0], b = buf[1];
        for (let i = 1; i < buf.length; i++) {
          if (buf[i].t >= renderTime) { a = buf[i - 1]; b = buf[i]; break; }
        }
        const span  = b.t - a.t;
        const alpha = span > 0 ? (renderTime - a.t) / span : 0;
        x = a.x + (b.x - a.x) * alpha;
        y = a.y + (b.y - a.y) * alpha;
      }

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
