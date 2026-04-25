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

export const BADGE_NAMES = ["diamond", "flame", "medal", "paint", "verified"];
export const BADGE_DISPLAY_SIZE = 18; // px wide, drawn next to the name text
const NAME_BADGE_GAP = 4;

export function badgeTextureKey(name) {
  return `badge-${name}`;
}

export function baseTextureKey(gender) {
  return gender === "male" ? "player-male" : "player-female";
}

export function genderScale(gender) {
  return gender === "male" ? 1.05 : 1.0;
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
  for (const name of BADGE_NAMES) {
    scene.load.image(badgeTextureKey(name), `/assets/badges/${name}.png`);
  }
}

/**
 * Position a badge image immediately to the left of the name label.
 * Badges use origin (1, 0.5) so we anchor them by their right edge.
 */
export function layoutNameBadge(badgeIcon, nameText) {
  if (!badgeIcon || !badgeIcon.visible) return;
  const left = nameText.x - nameText.displayWidth / 2 - NAME_BADGE_GAP;
  const centerY = nameText.y + nameText.displayHeight / 2;
  badgeIcon.setPosition(left, centerY);
  badgeIcon.setDepth(nameText.depth);
}

export function setNameBadge(scene, badgeIcon, nameText, badge) {
  if (badge && BADGE_NAMES.includes(badge)) {
    if (!badgeIcon) {
      badgeIcon = scene.add.image(nameText.x, nameText.y, badgeTextureKey(badge));
      badgeIcon.setOrigin(1, 0.5);
      const scale = BADGE_DISPLAY_SIZE / badgeIcon.width;
      badgeIcon.setScale(scale);
    } else {
      badgeIcon.setTexture(badgeTextureKey(badge));
      badgeIcon.setVisible(true);
      const scale = BADGE_DISPLAY_SIZE / badgeIcon.width;
      badgeIcon.setScale(scale);
    }
    layoutNameBadge(badgeIcon, nameText);
  } else if (badgeIcon) {
    badgeIcon.setVisible(false);
  }
  return badgeIcon;
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

// Exponential-decay rate (1/s) used to lerp perspective scale toward its target.
// Decoupled from the 60Hz logic step so scale also smooths at higher refresh rates.
const SCALE_LERP_RATE = 18;

export function createLocalPlayer(scene, x, y, name, layerManager, gender) {
  const gScale = genderScale(gender);
  const initialScale = perspectiveScale(y) * gScale;

  const shadow = scene.add.image(x, y, "shadow");
  shadow.setOrigin(0.5, 0.8);
  shadow.setScale(initialScale * 0.375);
  shadow.setAlpha(0.2);

  const textureKey = baseTextureKey(gender);
  const sprite = scene.add.sprite(x, y, textureKey, FRAME.FRONT);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(initialScale);
  sprite.gender = gender;
  sprite.currentScale = initialScale;
  // Logical position — updated by the fixed-timestep sim; sprite.x/y is the
  // per-frame interpolated render position.
  sprite._logicalX = x;
  sprite._logicalY = y;
  sprite._prevLogicalX = x;
  sprite._prevLogicalY = y;
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

  return { sprite, shadow, nameText, badgeIcon: null };
}

export function setLocalPlayerBadge(scene, player, badge) {
  player.badgeIcon = setNameBadge(scene, player.badgeIcon, player.nameText, badge);
}

/**
 * Sync shadow/name + perspective scale to the sprite's current position.
 * `renderDeltaMs` drives a frame-rate-independent lerp on scale so vertical
 * motion doesn't produce per-pixel scale discontinuities (the root cause of
 * perceived "jitter" when moving up/down combined with `roundPixels`).
 */
export function updateLocalPlayer(player, renderDeltaMs = 16.67) {
  const { sprite, shadow, nameText } = player;
  const gScale = genderScale(sprite.gender);
  const targetScale = perspectiveScale(sprite.y) * gScale;

  const curScale = sprite.currentScale ?? targetScale;
  const alpha = 1 - Math.exp(-SCALE_LERP_RATE * (renderDeltaMs / 1000));
  const nextScale = curScale + (targetScale - curScale) * alpha;
  sprite.currentScale = nextScale;

  sprite.setScale(nextScale);
  sprite.setDepth(sprite.y);
  shadow.setPosition(sprite.x, sprite.y);
  shadow.setScale(nextScale * 0.375);
  shadow.setDepth(sprite.y - 1);
  nameText.setPosition(sprite.x, sprite.y + 8);
  nameText.setDepth(sprite.y + 1);
  if (player.badgeIcon && player.badgeIcon.visible) {
    layoutNameBadge(player.badgeIcon, nameText);
  }
}

export function repositionLocalPlayer(player, x, y) {
  player.sprite.setPosition(x, y);
  player.shadow.setPosition(x, y);
  player.nameText.setPosition(x, y + 8);
  if (player.badgeIcon && player.badgeIcon.visible) {
    layoutNameBadge(player.badgeIcon, player.nameText);
  }
  // Reset logical state so the next fixed step doesn't interpolate from the
  // pre-teleport position (that would visually "slingshot" across the map).
  player.sprite._logicalX = x;
  player.sprite._logicalY = y;
  player.sprite._prevLogicalX = x;
  player.sprite._prevLogicalY = y;
  // Resync scale baseline so we don't lerp visibly from the teleport point.
  const gScale = genderScale(player.sprite.gender);
  const target = perspectiveScale(y) * gScale;
  player.sprite.currentScale = target;
  player.sprite.setScale(target);
  player.shadow.setScale(target * 0.375);
}

export function setLocalPlayerGender(player, gender) {
  const { sprite } = player;
  if (sprite.gender === gender) return;
  sprite.gender = gender;
  const textureKey = baseTextureKey(gender);
  const frame = Number(sprite.frame.name);
  const wasPlaying = sprite.anims.isPlaying;
  const animBase = sprite.anims.currentAnim?.key?.replace(/-player-(male|female)$/, "");
  sprite.setTexture(textureKey, frame);
  if (wasPlaying && animBase) {
    const nextKey = `${animBase}-${textureKey}`;
    if (sprite.scene.anims.exists(nextKey)) sprite.play(nextKey);
  }
}
