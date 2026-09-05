import { attachmentMatrix } from "./dragonBones.js";

// Clothing for the in-world rig. Each garment is a small atlas (PNG + JSON in
// the TexturePacker hash format) whose frames were cut from a 600×900 canvas
// painted over a front-facing render of the rig at its native size. Because the
// art shares that canvas, a frame's untrimmed position *is* its position on the
// body — no per-item nudging, just the canvas → armature offset below.

const CLOTHING_DIR = "/test%20clothes";

// Where the armature's origin (the ground point between the feet) falls on that
// 600×900 canvas, fitted against the rig's setup pose. x is where the garment's
// side seams line up with the body's silhouette. y is set by the shoulder line:
// it is the one place a top has to *meet* the body edge exactly, and 793 is the
// point where it does — a pixel less leaves a sliver of bare shoulder above the
// neckline, a pixel more starts lifting the sleeve caps off the arms.
const CANVAS_ORIGIN_X = 296;
const CANVAS_ORIGIN_Y = 793;

// Frame name → the rig slot the piece rides on. A garment's frames are pinned
// to body parts, not to one another, so sleeves swing with the arms while the
// torso panel stays on the chest. Frames not listed here are ignored.
const FRAME_SLOTS = {
  shirt_torso_front_fem: "Torso",
  left_sleeve:           "Upper_Arm_Left",
  right_sleeve:          "Upper_Arm_Right",
};

// Garments every avatar wears. Until outfits reach the rig this is the whole
// wardrobe: the one test shirt.
export const CLOTHING_ITEMS = {
  shirt: { file: "shirt" },
};

const slotCache = new WeakMap(); // Phaser.Game → { itemKey: slots[] }

function textureKey(itemKey) { return `cloth-${itemKey}`; }
function atlasKey(itemKey)   { return `cloth-${itemKey}-atlas`; }

export function preloadClothing(scene) {
  for (const [key, item] of Object.entries(CLOTHING_ITEMS)) {
    scene.load.json(atlasKey(key), `${CLOTHING_DIR}/${item.file}.json`);
    scene.load.image(textureKey(key), `${CLOTHING_DIR}/${item.file}.png`);
  }
}

/**
 * Slot descriptors for one garment — same shape as the armature's own slots, so
 * RigAvatar draws and poses them with the same code. Built once per game.
 */
export function getClothingSlots(scene, armature, itemKey) {
  let byItem = slotCache.get(scene.game);
  if (!byItem) slotCache.set(scene.game, (byItem = {}));
  if (byItem[itemKey]) return byItem[itemKey];

  const atlas = scene.cache.json.get(atlasKey(itemKey));
  const key   = textureKey(itemKey);
  if (!atlas || !scene.textures.exists(key)) {
    throw new Error(`Clothing "${itemKey}" is not loaded — call preloadClothing() in the scene's preload()`);
  }

  const texture   = scene.textures.get(key);
  const boneOf    = new Map(armature.slots.map(s => [s.name, s.bone]));
  const slots     = [];

  for (const [frameName, def] of Object.entries(atlas.frames || {})) {
    const attachTo = FRAME_SLOTS[frameName];
    if (attachTo === undefined) continue;
    if (!boneOf.has(attachTo)) {
      throw new Error(`Clothing frame "${frameName}" targets unknown rig slot "${attachTo}"`);
    }

    const { frame, spriteSourceSize: source } = def;
    if (!texture.has(frameName)) {
      texture.add(frameName, 0, frame.x, frame.y, frame.w, frame.h);
    }

    // The frame's centre on the authoring canvas, expressed in armature space.
    const x = source.x + frame.w / 2 - CANVAS_ORIGIN_X;
    const y = source.y + frame.h / 2 - CANVAS_ORIGIN_Y;

    slots.push({
      name:       frameName,
      attachTo,
      bone:       boneOf.get(attachTo),
      textureKey: key,
      frameName,
      pivotX:     0.5,
      pivotY:     0.5,
      matrix:     attachmentMatrix(armature, boneOf.get(attachTo), x, y),
    });
  }

  byItem[itemKey] = slots;
  return slots;
}

/** Every worn garment's slots, grouped by the rig slot they draw on top of. */
export function getWornSlotsByBodyPart(scene, armature, itemKeys) {
  const byPart = new Map();
  for (const itemKey of itemKeys) {
    for (const slot of getClothingSlots(scene, armature, itemKey)) {
      const list = byPart.get(slot.attachTo);
      if (list) list.push(slot);
      else byPart.set(slot.attachTo, [slot]);
    }
  }
  return byPart;
}
