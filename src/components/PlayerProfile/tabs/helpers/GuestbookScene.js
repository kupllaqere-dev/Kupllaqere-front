import Phaser from "phaser";

// ── Constants ──────────────────────────────────────────────────────────────
const TEXTURE_SIZE  = 80;
const BASE_DEPTH    = 10;
const PREVIEW_DEPTH = 9000;
const PREVIEW_ALPHA = 0.85;
const MIN_SCALE     = 0.35;
const MAX_SCALE     = 2.8;
const HANDLE_R      = 7;    // corner / rotation handle radius
const BTN_R         = 14;   // confirm / cancel button radius
const ROT_GAP       = 32;   // extra px above sticker edge to place rotation handle

function buildEmojiTexture(scene, key, emoji) {
  if (scene.textures.exists(key)) {
    const src = scene.textures.get(key).source[0];
    if (src && src.width > 2) return;
  }
  const rt  = scene.textures.createCanvas(key, TEXTURE_SIZE, TEXTURE_SIZE);
  const ctx = rt.getContext("2d");
  const sz  = Math.floor(TEXTURE_SIZE * 0.74);
  ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  ctx.font         = `${sz}px serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 + 2);
  rt.refresh();
}

// Rotate a local-space point (lx, ly) around origin and translate to world
function toWorld(cx, cy, lx, ly, cosA, sinA) {
  return {
    x: cx + lx * cosA - ly * sinA,
    y: cy + lx * sinA + ly * cosA,
  };
}

export default class GuestbookScene extends Phaser.Scene {
  constructor() {
    super({ key: "GuestbookScene" });

    // ── Injected by GuestbookCanvas ──────────────────────────────
    this.initialStickers     = [];
    this.currentUserId       = null;
    this.profileOwnerId      = null;
    this.stickerAssets       = [];
    this.onStickerClick      = null; // (stickerId, placedByUserId) => void
    this.onPlacementDone     = null; // () => void  (cancel OR after confirm anim)
    this.onConfirmPlacement  = null; // (payload) => void

    // ── Internal state ───────────────────────────────────────────
    this._locked  = new Map();
    this._preview = null;   // { img, shadow }
    this._handles = null;   // transform / action handles

    this._placementMode    = false;
    this._placementAssetId = null;
    this._previewX         = 0;
    this._previewY         = 0;
    this._previewRot       = 0;
    this._previewScale     = 1.0;
    this._topZ             = 0;
    this._pinchData        = null;
  }

  // ── LIFECYCLE ─────────────────────────────────────────────────────────────

  preload() {
    this.load.on("loaderror", () => {});
    this.stickerAssets.forEach(({ id }) => {
      this.load.image(`s_${id}`, `/assets/stickers/${id}.png`);
    });
  }

  create() {
    this.stickerAssets.forEach(({ id, emoji }) => buildEmojiTexture(this, `s_${id}`, emoji));
    this._drawBackground();
    this._topZ = (this.initialStickers || []).reduce((m, s) => Math.max(m, s.z_index ?? 0), 0);
    (this.initialStickers || []).forEach(s => this._renderLocked(s));

    // Scroll wheel: rotate (shift = scale)
    this.input.on("wheel", (_ptr, _objs, _dx, dy) => {
      if (!this._placementMode) return;
      if (this.input.keyboard?.isDown(Phaser.Input.Keyboard.KeyCodes.SHIFT)) {
        this._previewScale = Phaser.Math.Clamp(this._previewScale - dy * 0.002, MIN_SCALE, MAX_SCALE);
      } else {
        this._previewRot += dy * 0.14;
      }
      this._applyTransform();
    });
  }

  update() { this._handlePinch(); }

  // ── BACKGROUND ────────────────────────────────────────────────────────────

  _drawBackground() {
    const { width, height } = this.scale;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xfdf8f0);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xd8c0a8, 0.32);
    for (let x = 26; x < width; x += 28)
      for (let y = 26; y < height; y += 28)
        g.fillCircle(x, y, 1.1);
  }

  // ── LOCKED STICKER RENDERING ──────────────────────────────────────────────

  _renderLocked(stickerData) {
    const { id, sticker_asset_id, x: nx, y: ny, rotation = 0, scale = 1, z_index = 0, placed_by_user_id } = stickerData;
    const { width, height } = this.scale;
    const px = nx * width, py = ny * height;
    const key = `s_${sticker_asset_id}`;
    const depth = BASE_DEPTH + z_index;

    const shadow = this.add.image(px + 3, py + 5, key)
      .setScale(scale).setAngle(rotation).setAlpha(0.2).setTint(0x220033)
      .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(depth - 1);

    const img = this.add.image(px, py, key)
      .setScale(scale).setAngle(rotation).setDepth(depth)
      .setInteractive({ useHandCursor: true });

    img.on("pointerover", () => { if (!this._placementMode) img.setAlpha(0.75); });
    img.on("pointerout",  () => { img.setAlpha(1); });
    img.on("pointerup",   (ptr) => {
      if (this._placementMode) return;
      if (Math.hypot(ptr.upX - ptr.downX, ptr.upY - ptr.downY) > 6) return;
      this.onStickerClick?.(id, placed_by_user_id);
    });

    this._locked.set(id, { img, shadow, data: stickerData });
  }

  // ── PLACEMENT ─────────────────────────────────────────────────────────────

  startPlacement(assetId) {
    if (this._placementMode) this._doCancel(true); // silent cancel

    const { width, height } = this.scale;
    this._placementAssetId = assetId;
    this._placementMode    = true;
    this._previewX         = width  / 2;
    this._previewY         = height / 2;
    this._previewRot       = Phaser.Math.Between(-14, 14);
    this._previewScale     = 1.0;

    const key = `s_${assetId}`;

    const shadow = this.add.image(this._previewX + 3, this._previewY + 5, key)
      .setScale(0).setAngle(this._previewRot).setAlpha(0.2).setTint(0x220033)
      .setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(PREVIEW_DEPTH - 1);

    const img = this.add.image(this._previewX, this._previewY, key)
      .setScale(0).setAngle(this._previewRot).setAlpha(PREVIEW_ALPHA).setDepth(PREVIEW_DEPTH)
      .setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(img);

    img.on("drag", (_ptr, dragX, dragY) => {
      this._previewX = dragX;
      this._previewY = dragY;
      this._applyTransform();
    });

    this._preview = { img, shadow };

    // Pop-in, then reveal handles
    this.tweens.add({
      targets: [img, shadow],
      scaleX: this._previewScale, scaleY: this._previewScale,
      duration: 240, ease: "Back.easeOut",
      onComplete: () => { this._buildHandles(); this._syncHandles(); },
    });
  }

  cancelPlacement() { this._doCancel(false); }

  // ── IN-CANVAS TRANSFORM HANDLES ───────────────────────────────────────────

  _buildHandles() {
    if (this._handles) this._destroyHandles();

    // ── Bounding box outline ──────────────────────────────────────
    const bbox = this.add.graphics().setDepth(PREVIEW_DEPTH + 1);

    // ── Line from center to rotation handle ──────────────────────
    const rotLine = this.add.graphics().setDepth(PREVIEW_DEPTH + 1);

    // ── Rotation handle (circle above sticker) ────────────────────
    const rotHandle = this._makeHandle(0x9b7bc8);
    rotHandle.on("drag", (ptr) => {
      this._previewRot = Math.atan2(
        ptr.y - this._previewY,
        ptr.x - this._previewX
      ) * Phaser.Math.RAD_TO_DEG + 90;
      this._applyTransform();
    });

    // ── 4 corner scale handles ─────────────────────────────────────
    const cornerDefs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const cornerHandles = cornerDefs.map(([sx, sy]) => {
      const h = this._makeHandle(0xffffff);
      h._initDist  = 0;
      h._initScale = 1;
      h.on("dragstart", (ptr) => {
        const dx = ptr.x - this._previewX;
        const dy = ptr.y - this._previewY;
        h._initDist  = Math.sqrt(dx * dx + dy * dy) || 1;
        h._initScale = this._previewScale;
      });
      h.on("drag", (ptr) => {
        const dx = ptr.x - this._previewX;
        const dy = ptr.y - this._previewY;
        this._previewScale = Phaser.Math.Clamp(
          h._initScale * (Math.sqrt(dx * dx + dy * dy) / h._initDist),
          MIN_SCALE, MAX_SCALE
        );
        this._applyTransform();
      });
      return h;
    });

    // ── Confirm button (✓) ────────────────────────────────────────
    const confirmGfx = this._makeActionBtn(0x3dba5c);
    const confirmTxt = this.add.text(0, 1, "✓", {
      fontSize: "14px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(PREVIEW_DEPTH + 5);
    confirmGfx.on("pointerup", () => this._doConfirm());
    confirmGfx.on("pointerover", () => confirmGfx.setAlpha(0.78));
    confirmGfx.on("pointerout",  () => confirmGfx.setAlpha(1));

    // ── Cancel button (✕) ─────────────────────────────────────────
    const cancelGfx = this._makeActionBtn(0xe53935);
    const cancelTxt = this.add.text(0, 1, "✕", {
      fontSize: "12px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(PREVIEW_DEPTH + 5);
    cancelGfx.on("pointerup", () => this._doCancel(false));
    cancelGfx.on("pointerover", () => cancelGfx.setAlpha(0.78));
    cancelGfx.on("pointerout",  () => cancelGfx.setAlpha(1));

    this._handles = { bbox, rotLine, rotHandle, cornerHandles, confirmGfx, confirmTxt, cancelGfx, cancelTxt };

    // Fade all handles in
    const all = [rotHandle, ...cornerHandles, confirmGfx, confirmTxt, cancelGfx, cancelTxt];
    all.forEach(o => o.setAlpha(0));
    this.tweens.add({ targets: all, alpha: 1, duration: 160 });
  }

  _makeHandle(color) {
    const g = this.add.graphics().setDepth(PREVIEW_DEPTH + 3);
    g.fillStyle(color, 0.92);
    g.fillCircle(0, 0, HANDLE_R);
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(0, 0, HANDLE_R);
    g.setInteractive(
      new Phaser.Geom.Circle(0, 0, HANDLE_R + 5),
      Phaser.Geom.Circle.Contains
    );
    this.input.setDraggable(g);
    return g;
  }

  _makeActionBtn(color) {
    const g = this.add.graphics().setDepth(PREVIEW_DEPTH + 4);
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, BTN_R);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(0, 0, BTN_R);
    g.setInteractive(
      new Phaser.Geom.Circle(0, 0, BTN_R + 5),
      Phaser.Geom.Circle.Contains
    );
    return g;
  }

  _syncHandles() {
    if (!this._handles || !this._preview) return;
    const { bbox, rotLine, rotHandle, cornerHandles, confirmGfx, confirmTxt, cancelGfx, cancelTxt } = this._handles;

    const cx   = this._previewX;
    const cy   = this._previewY;
    const ang  = Phaser.Math.DegToRad(this._previewRot);
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const hw   = (TEXTURE_SIZE / 2) * this._previewScale + 6;
    const hh   = (TEXTURE_SIZE / 2) * this._previewScale + 6;

    // Corner handles
    [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach(([lx, ly], i) => {
      const p = toWorld(cx, cy, lx, ly, cosA, sinA);
      cornerHandles[i].setPosition(p.x, p.y);
    });

    // Bounding box
    bbox.clear();
    bbox.lineStyle(1.5, 0x000000, 0.7);
    const pts = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]
      .map(([lx, ly]) => toWorld(cx, cy, lx, ly, cosA, sinA));
    bbox.strokePoints(pts, true);

    // Rotation handle — above the sticker (local y = -(hh + ROT_GAP))
    const rotLocal = toWorld(cx, cy, 0, -(hh + ROT_GAP), cosA, sinA);
    rotHandle.setPosition(rotLocal.x, rotLocal.y);

    // Line center → rotation handle
    rotLine.clear();
    rotLine.lineStyle(1.5, 0x000000, 0.6);
    rotLine.strokeLineShape(new Phaser.Geom.Line(cx, cy, rotLocal.x, rotLocal.y));

    // Action buttons — below sticker center, offset left/right in local space
    const btnY = hh + BTN_R + 10;
    const confirmPos = toWorld(cx, cy,  BTN_R + 4, btnY, cosA, sinA);
    const cancelPos  = toWorld(cx, cy, -(BTN_R + 4), btnY, cosA, sinA);
    confirmGfx.setPosition(confirmPos.x, confirmPos.y);
    confirmTxt.setPosition(confirmPos.x, confirmPos.y);
    cancelGfx.setPosition(cancelPos.x, cancelPos.y);
    cancelTxt.setPosition(cancelPos.x, cancelPos.y);
  }

  _destroyHandles() {
    if (!this._handles) return;
    const { bbox, rotLine, rotHandle, cornerHandles, confirmGfx, confirmTxt, cancelGfx, cancelTxt } = this._handles;
    [bbox, rotLine, rotHandle, ...cornerHandles, confirmGfx, confirmTxt, cancelGfx, cancelTxt]
      .forEach(o => o?.destroy());
    this._handles = null;
  }

  // ── CONFIRM / CANCEL ──────────────────────────────────────────────────────

  _doConfirm() {
    if (!this._placementMode || !this._preview) return;

    const { width, height } = this.scale;
    const payload = {
      sticker_asset_id: this._placementAssetId,
      x:        Phaser.Math.Clamp(this._previewX / width,  0.01, 0.99),
      y:        Phaser.Math.Clamp(this._previewY / height, 0.01, 0.99),
      rotation: this._previewRot,
      scale:    this._previewScale,
      z_index:  ++this._topZ,
    };

    this._placementMode    = false;
    this._placementAssetId = null;
    this._destroyHandles();

    const { img, shadow } = this._preview;
    const s = this._previewScale;
    this.tweens.killTweensOf(img);
    this.tweens.add({
      targets: img,
      alpha: 1, scaleX: s * 1.22, scaleY: s * 1.22,
      duration: 80, ease: "Sine.easeOut", yoyo: true,
      onComplete: () => { img.destroy(); shadow.destroy(); this.onPlacementDone?.(); },
    });
    this._preview = null;
    this.onConfirmPlacement?.(payload);
  }

  _doCancel(silent = false) {
    this._placementMode    = false;
    this._placementAssetId = null;
    this._destroyHandles();

    if (!this._preview) { if (!silent) this.onPlacementDone?.(); return; }

    const { img, shadow } = this._preview;
    this.tweens.killTweensOf(img);
    this.tweens.killTweensOf(shadow);
    this.tweens.add({
      targets: [img, shadow],
      alpha: 0, scaleX: 0, scaleY: 0,
      duration: 160, ease: "Power2.easeIn",
      onComplete: () => { img.destroy(); shadow.destroy(); if (!silent) this.onPlacementDone?.(); },
    });
    this._preview = null;
  }

  // Public alias so React close-button can still call cancelPlacement()
  cancelPlacement() { this._doCancel(false); }

  // ── TRANSFORM ─────────────────────────────────────────────────────────────

  _applyTransform() {
    if (!this._preview) return;
    const { img, shadow } = this._preview;
    img.setPosition(this._previewX, this._previewY).setAngle(this._previewRot).setScale(this._previewScale);
    shadow.setPosition(this._previewX + 3, this._previewY + 5).setAngle(this._previewRot).setScale(this._previewScale);
    this._syncHandles();
  }

  // ── MOBILE PINCH ──────────────────────────────────────────────────────────

  _handlePinch() {
    if (!this._placementMode || !this._preview) { this._pinchData = null; return; }
    const p1 = this.input.pointer1, p2 = this.input.pointer2;
    if (!p1?.isDown || !p2?.isDown) { this._pinchData = null; return; }

    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * Phaser.Math.RAD_TO_DEG;

    if (!this._pinchData) {
      this._pinchData = { dist0: dist, angle0: angle, scale0: this._previewScale, rot0: this._previewRot };
      return;
    }
    const { dist0, angle0, scale0, rot0 } = this._pinchData;
    this._previewScale = Phaser.Math.Clamp(scale0 * (dist / dist0), MIN_SCALE, MAX_SCALE);
    this._previewRot   = rot0 + (angle - angle0);
    this._applyTransform();
  }

  // ── EXTERNAL UPDATES ──────────────────────────────────────────────────────

  addStickerExternal(stickerData) {
    if (this._locked.has(stickerData.id)) return;
    this._topZ = Math.max(this._topZ, stickerData.z_index ?? 0);
    this._renderLocked(stickerData);
    const obj = this._locked.get(stickerData.id);
    if (!obj) return;
    obj.img.setScale(0); obj.shadow.setScale(0);
    this.tweens.add({ targets: [obj.img, obj.shadow], scaleX: stickerData.scale ?? 1, scaleY: stickerData.scale ?? 1, duration: 300, ease: "Back.easeOut" });
  }

  removeStickerExternal(stickerId) {
    const obj = this._locked.get(stickerId);
    if (!obj) return;
    this.tweens.killTweensOf(obj.img); this.tweens.killTweensOf(obj.shadow);
    this.tweens.add({
      targets: [obj.img, obj.shadow], alpha: 0, scaleX: 0, scaleY: 0, duration: 200, ease: "Back.easeIn",
      onComplete: () => { obj.img.destroy(); obj.shadow.destroy(); this._locked.delete(stickerId); },
    });
  }

  // ── ZOOM ──────────────────────────────────────────────────────────────────

  zoomIn()    { const c = this.cameras.main; c.setZoom(Phaser.Math.Clamp(c.zoom * 1.2, 0.5, 3)); }
  zoomOut()   { const c = this.cameras.main; c.setZoom(Phaser.Math.Clamp(c.zoom / 1.2, 0.5, 3)); }
  zoomReset() { this.cameras.main.setZoom(1); }

  // ── CLEANUP ───────────────────────────────────────────────────────────────

  shutdown() {
    this.onStickerClick = null; this.onPlacementDone = null; this.onConfirmPlacement = null;
    this._destroyHandles();
    if (this._preview) { this._preview.img.destroy(); this._preview.shadow.destroy(); this._preview = null; }
    this._locked.forEach(({ img, shadow }) => { img.destroy(); shadow.destroy(); });
    this._locked.clear();
    this.input.off("wheel");
    this._pinchData = null;
  }
}
