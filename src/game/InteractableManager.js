export function preloadInteractables(scene) {
  scene.load.image("butterfly", "/butterfly.png");
}

export function createInteractables(scene, onObjectMenu) {
  const butterfly = scene.add.image(1200, 800, "butterfly");
  butterfly.setDisplaySize(100, 100);
  butterfly.setInteractive({ pixelPerfect: true });
  butterfly.on("pointerover", () => butterfly.postFX.addGlow(0xffffff, 4, 0));
  butterfly.on("pointerout", () => butterfly.postFX.clear());
  butterfly.on("pointerdown", (pointer) => {
    onObjectMenu({ x: pointer.event.clientX, y: pointer.event.clientY });
  });
}
