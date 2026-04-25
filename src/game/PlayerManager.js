import { perspectiveScale } from "./perspective";
import { baseTextureKey, genderScale, setNameBadge, layoutNameBadge } from "./LocalPlayer";

const FRAME = { FRONT: 0, FRONT_LEFT: 1, LEFT: 2, BACK: 3, FRONT_RIGHT: 4, RIGHT: 5 };

// Snapshot interpolation: render remote players RENDER_DELAY_MS in the past so
// we always have at least two snapshots bracketing the render time. 100 ms is
// the standard Valve/Quake figure — long enough to hide typical jitter at a
// 20 Hz tick, short enough to keep interaction feeling live.
const RENDER_DELAY_MS = 100;
const MAX_BUFFER_AGE_MS = 1000;
// Exponential-decay rate for perspective-scale smoothing (1/s). Higher = snappier.
const SCALE_LERP_RATE = 18;

export { FRAME, RENDER_DELAY_MS };

export default class PlayerManager {
  constructor() {
    this.otherPlayers = new Map();
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
    sprite.gender = data.gender;
    sprite.currentScale = initialScale;

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

    // Seed the buffer so there's something to interpolate toward before the
    // first server update arrives. The timestamp is "in the past" so the very
    // first real snapshot interpolates forward naturally.
    const seedTime = performance.now() - RENDER_DELAY_MS;
    this.otherPlayers.set(data.id, {
      sprite,
      shadowImg,
      nameText,
      badgeIcon: null,
      userId: data.userId || null,
      bio: data.bio || "",
      selectedBadge: data.selectedBadge || null,
      buffer: [{ t: seedTime, x: data.x, y: data.y }],
      lastAnim: null,
      lastFrame: FRAME.FRONT,
      lastRenderX: data.x,
      lastRenderY: data.y,
    });

    if (data.selectedBadge) {
      this.updateBadge(scene, data.id, data.selectedBadge);
    }
  }

  updateBadge(scene, id, badge) {
    const other = this.otherPlayers.get(id);
    if (!other) return;
    other.selectedBadge = badge || null;
    other.badgeIcon = setNameBadge(scene, other.badgeIcon, other.nameText, badge);
  }

  /**
   * Record an authoritative snapshot for a remote player. Out-of-order packets
   * (older than the latest buffered snapshot) are dropped — the next fresher
   * snapshot will supersede them. Animation/frame state is applied immediately
   * and is decoupled from position interpolation.
   */
  pushSnapshot(data, receiveTimeMs) {
    const other = this.otherPlayers.get(data.id);
    if (!other) return;

    // We key snapshots by *receive* time (client clock) rather than by the
    // sender's `data.t`, because client and server clocks aren't synced and
    // `performance.now()` on two machines has no relation. Receive time gives
    // us a consistent, monotonic timeline for interpolation; the 100ms render
    // delay absorbs normal transport jitter. `data.t` is still forwarded for
    // out-of-order detection when available.
    const t = receiveTimeMs ?? performance.now();
    const last = other.buffer[other.buffer.length - 1];
    if (last && t <= last.t) return;
    // Detect packet reordering using the sender's clock if provided.
    if (typeof data.t === "number" && other.lastSenderT !== undefined &&
        data.t < other.lastSenderT) {
      return;
    }
    if (typeof data.t === "number") other.lastSenderT = data.t;

    other.buffer.push({ t, x: data.x, y: data.y });

    const cutoff = performance.now() - MAX_BUFFER_AGE_MS;
    while (other.buffer.length > 2 && other.buffer[0].t < cutoff) {
      other.buffer.shift();
    }

    if (data.anim) {
      if (data.anim !== other.lastAnim ||
          other.sprite.anims.currentAnim?.key !== data.anim ||
          !other.sprite.anims.isPlaying) {
        other.sprite.play(data.anim);
      }
      other.lastAnim = data.anim;
    } else {
      // Animations bypass our lastFrame cache while playing (the animation
      // system drives sprite.frame directly), so when we stop mid-animation
      // the sprite is left on a walk frame. We must always force the idle
      // frame here — skipping on `data.frame === lastFrame` would leave the
      // sprite visually frozen on a walk pose whenever the idle frame
      // happens to match the stale cached value (very common: stopping
      // while walking down → idle FRONT=0 == default lastFrame=0).
      const wasAnimating = other.lastAnim !== null;
      if (wasAnimating && other.sprite.anims.isPlaying) {
        other.sprite.stop();
      }
      other.lastAnim = null;
      if (data.frame !== undefined && (wasAnimating || data.frame !== other.lastFrame)) {
        other.sprite.setFrame(data.frame);
        other.lastFrame = data.frame;
      }
    }
  }

  /**
   * Per-render step. Samples each remote player's snapshot buffer at
   * `now - RENDER_DELAY_MS`, linear-interpolating between bracketing snapshots.
   * Scale lerps toward target to avoid visible perspective jitter from per-frame
   * Y changes (scale updates are decoupled from network ticks).
   */
  interpolate(renderDeltaMs) {
    const now = performance.now();
    const renderTime = now - RENDER_DELAY_MS;
    const scaleAlpha = 1 - Math.exp(-SCALE_LERP_RATE * (renderDeltaMs / 1000));

    for (const [, other] of this.otherPlayers) {
      const buf = other.buffer;
      if (buf.length === 0) continue;

      let x;
      let y;
      if (buf.length === 1 || renderTime <= buf[0].t) {
        x = buf[0].x;
        y = buf[0].y;
      } else if (renderTime >= buf[buf.length - 1].t) {
        // Missing newer snapshot (packet loss / stall). Hold last known position
        // rather than extrapolate — extrapolation overshoots and has to snap
        // back when the next packet lands, which is exactly the jitter we want
        // to avoid.
        x = buf[buf.length - 1].x;
        y = buf[buf.length - 1].y;
      } else {
        let a = buf[0];
        let b = buf[1];
        for (let i = 1; i < buf.length; i++) {
          if (buf[i].t >= renderTime) {
            a = buf[i - 1];
            b = buf[i];
            break;
          }
        }
        const span = b.t - a.t;
        const alpha = span > 0 ? (renderTime - a.t) / span : 0;
        x = a.x + (b.x - a.x) * alpha;
        y = a.y + (b.y - a.y) * alpha;
      }

      if (x === other.lastRenderX && y === other.lastRenderY &&
          Math.abs(other.sprite.currentScale - perspectiveScale(y) * genderScale(other.sprite.gender)) < 0.0005) {
        // Nothing moved and scale already converged — skip per-sprite work.
        continue;
      }
      other.lastRenderX = x;
      other.lastRenderY = y;

      const targetScale = perspectiveScale(y) * genderScale(other.sprite.gender);
      const curScale = other.sprite.currentScale ?? targetScale;
      const nextScale = curScale + (targetScale - curScale) * scaleAlpha;
      other.sprite.currentScale = nextScale;

      other.sprite.setPosition(x, y);
      other.sprite.setScale(nextScale);
      other.sprite.setDepth(y);
      other.shadowImg.setPosition(x, y);
      other.shadowImg.setScale(nextScale * 0.375);
      other.shadowImg.setDepth(y - 1);
      other.nameText.setPosition(x, y + 8);
      other.nameText.setDepth(y + 1);
      if (other.badgeIcon && other.badgeIcon.visible) {
        layoutNameBadge(other.badgeIcon, other.nameText);
      }
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
    if (other.badgeIcon) other.badgeIcon.destroy();
    if (other.chatBubble) other.chatBubble.destroy();
    if (other.chatTimer) clearTimeout(other.chatTimer);
    this.otherPlayers.delete(id);
  }
}
