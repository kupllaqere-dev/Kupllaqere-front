import Phaser from "phaser";
import { FRAME } from "./PlayerManager";
import { pointInPolygon } from "./collision";

const SPEED = 300;
const ARRIVE_THRESHOLD = 5;

export default class MovementManager {
  constructor(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.moveTarget = null;
    this.clickIndicators = [];
    this.lastDirection = null; // tracks last walk direction for idle frame
    this.wasWalking = false;   // tracks whether we were animating last frame
    this.currentAnim = null;   // current walk animation key (e.g. "walk-left") or null
  }

  handleClick(scene, pointer, walkableZones) {
    if (pointer.button !== 0) return;
    const hitObjects = scene.input.hitTestPointer(pointer);
    if (hitObjects.length > 0) return;
    const { worldX, worldY } = pointer;

    const inWalkable =
      walkableZones.length === 0 ||
      walkableZones.some((z) => pointInPolygon(worldX, worldY, z));
    if (!inWalkable) return;

    this.moveTarget = { x: worldX, y: worldY };
    this._spawnClickIndicator(scene, worldX, worldY);
  }

  update(player, cursors, walkableZones, delta) {
    const dt = delta / 1000;
    const left = cursors.left.isDown;
    const right = cursors.right.isDown;
    const up = cursors.up.isDown;
    const down = cursors.down.isDown;
    const keyMoving = left || right || up || down;

    if (keyMoving) this.moveTarget = null;

    let dx = 0;
    let dy = 0;

    if (keyMoving) {
      dx = left ? -SPEED * dt : right ? SPEED * dt : 0;
      dy = up ? -SPEED * dt : down ? SPEED * dt : 0;
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }
    } else if (this.moveTarget) {
      const distX = this.moveTarget.x - player.x;
      const distY = this.moveTarget.y - player.y;
      const dist = Math.sqrt(distX * distX + distY * distY);
      if (dist < ARRIVE_THRESHOLD) {
        this.moveTarget = null;
      } else {
        const step = Math.min(SPEED * dt, dist);
        dx = (distX / dist) * step;
        dy = (distY / dist) * step;
      }
    }

    const curX = player.x;
    const curY = player.y;
    let newX = Phaser.Math.Clamp(curX + dx, 0, this.mapWidth);
    let newY = Phaser.Math.Clamp(curY + dy, 0, this.mapHeight);

    if (walkableZones.length > 0 && (dx !== 0 || dy !== 0)) {
      const fullOk = walkableZones.some((z) => pointInPolygon(newX, newY, z));
      if (fullOk) {
        player.setPosition(newX, newY);
      } else {
        const xOk =
          dx !== 0 &&
          walkableZones.some((z) => pointInPolygon(newX, curY, z));
        const yOk =
          dy !== 0 &&
          walkableZones.some((z) => pointInPolygon(curX, newY, z));
        if (xOk) player.setPosition(newX, curY);
        else if (yOk) player.setPosition(curX, newY);
        else this.moveTarget = null;
      }
    } else {
      player.setPosition(newX, newY);
    }

    // Determine facing frame and walk animation
    const isMoving = dx !== 0 || dy !== 0;
    let frame = Number(player.frame.name);
    let walkDir = null; // "left", "right", "down", or "up"

    if (keyMoving) {
      if (left && down) { frame = FRAME.FRONT_LEFT; walkDir = "down"; }
      else if (right && down) { frame = FRAME.FRONT_RIGHT; walkDir = "down"; }
      else if (left && up) { frame = FRAME.BACK; walkDir = "up"; }
      else if (right && up) { frame = FRAME.BACK; walkDir = "up"; }
      else if (left) { frame = FRAME.LEFT; walkDir = "left"; }
      else if (right) { frame = FRAME.RIGHT; walkDir = "right"; }
      else if (down) { frame = FRAME.FRONT; walkDir = "down"; }
      else if (up) { frame = FRAME.BACK; walkDir = "up"; }
    } else if (isMoving) {
      const angle = Math.atan2(dy, dx);
      if (angle > 2.75 || angle < -2.75) { frame = FRAME.LEFT; walkDir = "left"; }
      else if (angle > 1.96) { frame = FRAME.FRONT_LEFT; walkDir = "down"; }
      else if (angle > 1.18) { frame = FRAME.FRONT; walkDir = "down"; }
      else if (angle > 0.39) { frame = FRAME.FRONT_RIGHT; walkDir = "down"; }
      else if (angle > -0.39) { frame = FRAME.RIGHT; walkDir = "right"; }
      else if (angle > -1.18) { frame = FRAME.BACK; walkDir = "up"; }
      else if (angle > -1.96) { frame = FRAME.BACK; walkDir = "up"; }
      else if (angle > -2.75) { frame = FRAME.LEFT; walkDir = "left"; }
      else { frame = FRAME.LEFT; walkDir = "left"; }
    }

    const baseTextureKey = player.texture.key;

    if (walkDir) {
      const animKey = `walk-${walkDir}-${baseTextureKey}`;
      if (!this.wasWalking || player.anims.currentAnim?.key !== animKey) {
        player.play(animKey);
      }
      this.lastDirection = walkDir;
      this.wasWalking = true;
      this.currentAnim = animKey;
    } else {
      this.currentAnim = null;
      if (this.wasWalking) {
        player.stop();
        const idleFrame = this.lastDirection === "left" ? FRAME.FRONT_LEFT
          : this.lastDirection === "right" ? FRAME.FRONT_RIGHT
          : this.lastDirection === "up" ? FRAME.BACK
          : FRAME.FRONT;
        player.setTexture(baseTextureKey, idleFrame);
        this.wasWalking = false;
      } else if (isMoving) {
        player.setFrame(frame);
        this.lastDirection = null;
      } else {
        player.setFrame(frame);
      }
    }
  }

  _spawnClickIndicator(scene, worldX, worldY) {
    this.clickIndicators.forEach((obj) => obj.destroy());
    this.clickIndicators = [];

    const starts = [
      { x: worldX - 20, y: worldY - 25 },
      { x: worldX, y: worldY - 30 },
      { x: worldX + 20, y: worldY - 25 },
    ];

    for (let i = 0; i < starts.length; i++) {
      const s = starts[i];
      const angle = Math.atan2(worldY - s.y, worldX - s.x);
      const gfx = scene.add.graphics().setDepth(9999);
      gfx.lineStyle(2, 0xffffff, 1);
      gfx.beginPath();
      gfx.moveTo(0, -10);
      gfx.lineTo(0, 4);
      gfx.moveTo(-4, 0);
      gfx.lineTo(0, 4);
      gfx.lineTo(4, 0);
      gfx.strokePath();
      gfx.setPosition(s.x, s.y);
      gfx.setRotation(angle - Math.PI / 2);
      this.clickIndicators.push(gfx);

      scene.tweens.add({
        targets: gfx,
        x: worldX,
        y: worldY,
        alpha: 0,
        duration: 350,
        ease: "Power2",
        delay: i * 40,
        onComplete: () => {
          gfx.destroy();
          this.clickIndicators = this.clickIndicators.filter((o) => o !== gfx);
        },
      });
    }
  }
}
