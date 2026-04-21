import { FRAME } from "./PlayerManager";
import { perspectiveScale } from "./perspective";

const ANIMATIONS = [
  { key: "walk-left", start: 6, end: 11 },
  { key: "walk-right", start: 12, end: 17 },
  { key: "walk-down", start: 18, end: 21 },
  { key: "walk-up", start: 24, end: 27 },
];

export const BASE_SPRITE_URLS = {
  female: "/assets/character-bases/females.png",
  male: "/assets/character-bases/men-test.png",
};

export function baseTextureKey(gender) {
  return gender === "male" ? "player-male" : "player-female";
}

export function getBaseSpriteUrl(gender) {
  return gender === "male" ? BASE_SPRITE_URLS.male : BASE_SPRITE_URLS.female;
}

export function preloadLocalPlayer(scene) {
  scene.load.spritesheet(
    "player-female",
    BASE_SPRITE_URLS.female,
    { frameWidth: 510, frameHeight: 900 },
  );
  scene.load.spritesheet(
    "player-male",
    BASE_SPRITE_URLS.male,
    { frameWidth: 510, frameHeight: 900 },
  );
  scene.load.image("shadow", "/assets/character-bases/shadow.png");
}

function ensureAnimations(scene, textureKey) {
  for (const anim of ANIMATIONS) {
    const key = `${anim.key}-${textureKey}`;
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        start: anim.start,
        end: anim.end,
      }),
      frameRate: 4,
      repeat: -1,
    });
  }
}

export function createLocalPlayer(scene, x, y, name, layerManager, gender) {
  const shadow = scene.add.image(x, y, "shadow");
  shadow.setOrigin(0.5, 0.8);
  shadow.setScale(0.15);
  shadow.setAlpha(0.2);

  const textureKey = baseTextureKey(gender);
  const sprite = scene.add.sprite(x, y, textureKey, FRAME.FRONT);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(0.2);
  if (layerManager) {
    layerManager.registerBase("local", sprite);
  } else {
    sprite.setInteractive({ pixelPerfect: true });
    sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 2, 0));
    sprite.on("pointerout", () => sprite.postFX.clear());
  }

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

  ensureAnimations(scene, "player-female");
  ensureAnimations(scene, "player-male");

  return { sprite, shadow, nameText };
}

export function updateLocalPlayer(player) {
  const { sprite, shadow, nameText } = player;
  const s = perspectiveScale(sprite.y);
  sprite.setScale(s);
  sprite.setDepth(sprite.y);
  shadow.setPosition(sprite.x, sprite.y);
  shadow.setScale(s * 0.375);
  shadow.setDepth(sprite.y - 1);
  nameText.setPosition(sprite.x, sprite.y + 8);
  nameText.setDepth(sprite.y + 1);
}

export function repositionLocalPlayer(player, x, y) {
  player.sprite.setPosition(x, y);
  player.shadow.setPosition(x, y);
  player.nameText.setPosition(x, y + 8);
}
