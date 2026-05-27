import { FRAME } from "./PlayerManager";
import { perspectiveScale } from "./perspective";

export const BASE_SPRITE_URLS = {
  female: "/assets/character-bases/females_new.png",
  male:   "/assets/character-bases/men-test.png",
};

export const BADGE_NAMES = ["diamond", "flame", "medal", "paint", "verified"];
export const BADGE_DISPLAY_SIZE = 18;
const NAME_BADGE_GAP = 4;

export function badgeTextureKey(name) { return `badge-${name}`; }
export function baseTextureKey(gender) { return gender === "male" ? "player-male" : "player-female"; }
export function genderScale(gender) { return gender === "male" ? 1.2 : 1; }

export function preloadLocalPlayer(scene) {
  scene.load.spritesheet("player-female", BASE_SPRITE_URLS.female, { frameWidth: 510, frameHeight: 900 });
  scene.load.spritesheet("player-male",   BASE_SPRITE_URLS.male,   { frameWidth: 510, frameHeight: 900 });
  scene.load.image("shadow", "/assets/character-bases/shadow.png");
  for (const name of BADGE_NAMES) {
    scene.load.image(badgeTextureKey(name), `/assets/badges/${name}.png`);
  }
}

export function layoutNameBadge(badgeIcon, nameText) {
  if (!badgeIcon || !badgeIcon.visible) return;
  const left    = nameText.x - nameText.displayWidth / 2 - NAME_BADGE_GAP;
  const centerY = nameText.y + nameText.displayHeight / 2;
  badgeIcon.setPosition(left, centerY);
  badgeIcon.setDepth(nameText.depth);
}

export function setNameBadge(scene, badgeIcon, nameText, badge) {
  if (badge && BADGE_NAMES.includes(badge)) {
    if (!badgeIcon) {
      badgeIcon = scene.add.image(nameText.x, nameText.y, badgeTextureKey(badge));
      badgeIcon.setOrigin(1, 0.5);
      badgeIcon.setScale(BADGE_DISPLAY_SIZE / badgeIcon.width);
    } else {
      badgeIcon.setTexture(badgeTextureKey(badge));
      badgeIcon.setVisible(true);
      badgeIcon.setScale(BADGE_DISPLAY_SIZE / badgeIcon.width);
    }
    layoutNameBadge(badgeIcon, nameText);
  } else if (badgeIcon) {
    badgeIcon.setVisible(false);
  }
  return badgeIcon;
}

const SCALE_LERP_RATE = 18;

// Creates the local player's shadow, sprite, and name label.
// The avatar texture is a placeholder until WorldAvatarSystem finishes compositing.
export function createLocalPlayer(scene, x, y, name, gender) {
  const gScale       = genderScale(gender);
  const initialScale = perspectiveScale(y) * gScale;

  const shadow = scene.add.image(x, y, "shadow");
  shadow.setOrigin(0.5, 0.8);
  shadow.setScale(initialScale * 0.375);
  shadow.setAlpha(0.2);

  const sprite = scene.add.sprite(x, y, baseTextureKey(gender), FRAME.FRONT);
  sprite.setOrigin(0.5, 1);
  sprite.setScale(initialScale);
  sprite.gender        = gender;
  sprite.currentScale  = initialScale;
  sprite._logicalX     = x;
  sprite._logicalY     = y;
  sprite._prevLogicalX = x;
  sprite._prevLogicalY = y;

  sprite.setInteractive({ pixelPerfect: true });
  sprite.on("pointerover", () => sprite.postFX.addGlow(0xffffff, 2, 0));
  sprite.on("pointerout",  () => sprite.postFX.clear());

  const nameText = scene.add
    .text(x, y + 8, name, {
      fontFamily: "Quicksand, Nunito, Poppins, sans-serif",
      fontSize:   "13px",
      color:      "#ffffff",
      shadow:     { offsetX: 0, offsetY: 1, color: "#000000", blur: 4, fill: true },
    })
    .setOrigin(0.5, 0)
    .setDepth(51);

  return { sprite, shadow, nameText, badgeIcon: null };
}

export function setLocalPlayerBadge(scene, player, badge) {
  player.badgeIcon = setNameBadge(scene, player.badgeIcon, player.nameText, badge);
}

export function updateLocalPlayer(player, renderDeltaMs = 16.67) {
  const { sprite, shadow, nameText } = player;
  const targetScale = perspectiveScale(sprite.y) * genderScale(sprite.gender);
  const curScale    = sprite.currentScale ?? targetScale;
  const alpha       = 1 - Math.exp(-SCALE_LERP_RATE * (renderDeltaMs / 1000));
  const nextScale   = curScale + (targetScale - curScale) * alpha;
  sprite.currentScale = nextScale;

  sprite.setScale(nextScale);
  sprite.setDepth(sprite.y);
  shadow.setPosition(sprite.x, sprite.y);
  shadow.setScale(nextScale * 0.375);
  shadow.setDepth(sprite.y - 1);
  nameText.setPosition(sprite.x, sprite.y + 8);
  nameText.setDepth(sprite.y + 1);
  if (player.badgeIcon?.visible) layoutNameBadge(player.badgeIcon, nameText);
}

export function repositionLocalPlayer(player, x, y) {
  player.sprite.setPosition(x, y);
  player.shadow.setPosition(x, y);
  player.nameText.setPosition(x, y + 8);
  if (player.badgeIcon?.visible) layoutNameBadge(player.badgeIcon, player.nameText);
  player.sprite._logicalX     = x;
  player.sprite._logicalY     = y;
  player.sprite._prevLogicalX = x;
  player.sprite._prevLogicalY = y;
  const target = perspectiveScale(y) * genderScale(player.sprite.gender);
  player.sprite.currentScale = target;
  player.sprite.setScale(target);
  player.shadow.setScale(target * 0.375);
}
