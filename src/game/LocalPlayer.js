import { FRAME } from "./PlayerManager";

const ANIMATIONS = [
  { key: "walk-left", start: 6, end: 11 },
  { key: "walk-right", start: 12, end: 17 },
  { key: "walk-down", start: 18, end: 21 },
  { key: "walk-up", start: 24, end: 27 },
];

export function preloadLocalPlayer(scene) {
  scene.load.spritesheet(
    "player",
    "/assets/character-bases/female-normal.png",
    { frameWidth: 510, frameHeight: 900 },
  );
  scene.load.image("shadow", "/assets/character-bases/shadow.png");
}

export function createLocalPlayer(scene, x, y, name) {
  const shadow = scene.add.image(x, y, "shadow");
  shadow.setOrigin(0.5, 0.8);
  shadow.setScale(0.15);
  shadow.setAlpha(0.2);

  const sprite = scene.add.sprite(x, y, "player", FRAME.FRONT);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(0.4);
  sprite.setInteractive({ pixelPerfect: true });
  sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 3, 0));
  sprite.on("pointerout", () => sprite.postFX.clear());

  const nameText = scene.add
    .text(x, y + 8, name, {
      fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      shadow: {
        offsetX: 0,
        offsetY: 1,
        color: "#000000",
        blur: 4,
        fill: true,
      },
    })
    .setOrigin(0.5, 0)
    .setDepth(51);

  for (const anim of ANIMATIONS) {
    scene.anims.create({
      key: anim.key,
      frames: scene.anims.generateFrameNumbers("player", {
        start: anim.start,
        end: anim.end,
      }),
      frameRate: 4,
      repeat: -1,
    });
  }

  return { sprite, shadow, nameText };
}

export function updateLocalPlayer(player) {
  const { sprite, shadow, nameText } = player;
  sprite.setDepth(sprite.y);
  shadow.setPosition(sprite.x, sprite.y);
  shadow.setDepth(sprite.y - 1);
  nameText.setPosition(sprite.x, sprite.y + 8);
  nameText.setDepth(sprite.y + 1);
}

export function repositionLocalPlayer(player, x, y) {
  player.sprite.setPosition(x, y);
  player.shadow.setPosition(x, y);
  player.nameText.setPosition(x, y + 8);
}
