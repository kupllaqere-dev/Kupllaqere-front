export default class EditorManager {
  constructor(scene, player, walkableZones) {
    this.scene = scene;
    this.player = player;
    this.editorMode = false;
    this.walkableZones = walkableZones;
    this.editorPolygons = walkableZones.map((z) => [...z]);
    this.currentPoints = [];

    this.graphics = scene.add.graphics().setDepth(100);
    this.label = scene.add
      .text(10, 10, "", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(101);

    this._bindKeys(scene);
    this._bindPointer(scene);
    this.draw();
  }

  _bindKeys(scene) {
    scene.input.keyboard.on("keydown-E", () => {
      this.editorMode = !this.editorMode;
      if (this.editorMode) {
        scene.cameras.main.stopFollow();
      } else {
        this.currentPoints = [];
        scene.cameras.main.startFollow(this.player, true, 0.15, 0.15);
      }
      this.draw();
    });

    scene.input.keyboard.on("keydown-ENTER", () => {
      if (!this.editorMode || this.currentPoints.length < 3) return;
      this.editorPolygons.push([...this.currentPoints]);
      this.currentPoints = [];
      this.draw();
    });

    scene.input.keyboard.on("keydown-Z", () => {
      if (!this.editorMode) return;
      this.currentPoints.pop();
      this.draw();
    });

    scene.input.keyboard.on("keydown-ESC", () => {
      if (!this.editorMode) return;
      this.currentPoints = [];
      this.draw();
    });

    scene.input.keyboard.on("keydown-D", () => {
      if (!this.editorMode) return;
      this.editorPolygons.pop();
      this.draw();
    });

    scene.input.keyboard.on("keydown-S", () => {
      if (!this.editorMode) return;
      this.save();
    });
  }

  _bindPointer(scene) {
    scene.input.on("pointerdown", (pointer) => {
      if (!this.editorMode) return;
      const wp = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.currentPoints.push([Math.round(wp.x), Math.round(wp.y)]);
      this.draw();
    });
  }

  draw() {
    this.graphics.clear();

    const zones = this.editorMode ? this.editorPolygons : this.walkableZones;

    for (const zone of zones) {
      if (zone.length < 3) continue;
      const color = this.editorMode ? 0x00ff88 : 0x00ff00;
      const fillAlpha = this.editorMode ? 0.2 : 0.12;
      const strokeAlpha = this.editorMode ? 0.9 : 0.35;
      const strokeWidth = this.editorMode ? 2 : 1;
      this.graphics.fillStyle(color, fillAlpha);
      this.graphics.lineStyle(strokeWidth, color, strokeAlpha);
      this.graphics.beginPath();
      this.graphics.moveTo(zone[0][0], zone[0][1]);
      for (let i = 1; i < zone.length; i++) this.graphics.lineTo(zone[i][0], zone[i][1]);
      this.graphics.closePath();
      this.graphics.fillPath();
      this.graphics.strokePath();
    }

    if (this.editorMode && this.currentPoints.length > 0) {
      this.graphics.lineStyle(2, 0xffff00, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(this.currentPoints[0][0], this.currentPoints[0][1]);
      for (let i = 1; i < this.currentPoints.length; i++) {
        this.graphics.lineTo(this.currentPoints[i][0], this.currentPoints[i][1]);
      }
      this.graphics.strokePath();
      this.graphics.fillStyle(0xffff00, 1);
      for (const [x, y] of this.currentPoints) this.graphics.fillCircle(x, y, 5);
    }

    this.label.setText(
      this.editorMode
        ? "EDITOR  |  Click: add point  |  Enter: close polygon  |  Z: undo  |  Esc: cancel  |  D: delete last zone  |  S: save  |  E: exit  |  Arrows: pan"
        : ""
    );
  }

  async save() {
    const data = JSON.stringify(
      { walkableZones: this.editorPolygons.map((points) => ({ points })) },
      null,
      2
    );
    try {
      const res = await fetch("/api/save-colliders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      });
      if (res.ok) {
        this.walkableZones.length = 0;
        this.editorPolygons.forEach((p) => this.walkableZones.push([...p]));
        const msg = this.scene.add
          .text(this.scene.cameras.main.width / 2, 60, "Saved to colliders.json", {
            fontSize: "18px",
            color: "#00ff88",
            backgroundColor: "#000000cc",
            padding: { x: 10, y: 6 },
          })
          .setScrollFactor(0)
          .setDepth(200)
          .setOrigin(0.5, 0);
        setTimeout(() => msg.destroy(), 2000);
      }
    } catch {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"), {
        href: url,
        download: "colliders.json",
      }).click();
      URL.revokeObjectURL(url);
    }
  }

  panCamera(cursors) {
    if (!this.editorMode) return false;
    const panSpeed = 8;
    if (cursors.left.isDown) this.scene.cameras.main.scrollX -= panSpeed;
    else if (cursors.right.isDown) this.scene.cameras.main.scrollX += panSpeed;
    if (cursors.up.isDown) this.scene.cameras.main.scrollY -= panSpeed;
    else if (cursors.down.isDown) this.scene.cameras.main.scrollY += panSpeed;
    return true;
  }
}
