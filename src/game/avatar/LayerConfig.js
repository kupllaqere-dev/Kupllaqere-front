// Spritesheet dimensions
export const SHEET_W       = 3060;
export const SHEET_TOTAL_H = 5238;
export const FRAME_W       = 510;
export const FRAME_H       = 900;

// Rows 1-5 only — baked into Phaser textures (thumbnail row excluded)
export const SHEET_ANIM_H = 4500;

// Row definitions within the full spritesheet
export const ROWS = {
  idle:      { y: 0,    h: 900, frames: 6 },
  walkLeft:  { y: 900,  h: 900, frames: 6 },
  walkRight: { y: 1800, h: 900, frames: 6 },
  walkUp:    { y: 2700, h: 900, frames: 4 },
  walkDown:  { y: 3600, h: 900, frames: 4 },
  thumb:     { y: 4500, h: 738, frames: 1 },
};

// Phaser frame indices for a 3060×4500 spritesheet with frameWidth=510, frameHeight=900
export const ANIM_DEFS = {
  idle:      { frames: [0, 1, 2, 3, 4, 5],         frameRate: 1,  repeat: -1 },
  walkLeft:  { frames: [6, 7, 8, 9, 10, 11],        frameRate: 4,  repeat: -1 },
  walkRight: { frames: [12, 13, 14, 15, 16, 17],    frameRate: 4,  repeat: -1 },
  walkDown:  { frames: [18, 19, 20, 21],             frameRate: 4,  repeat: -1 },
  walkUp:    { frames: [24, 25, 26, 27],             frameRate: 4,  repeat: -1 },
};

// Maps (category, subcategory) → outfit slot key.
// All items of the same slot key are mutually exclusive.
export function getSlotKey(category, subcategory) {
  switch (category) {
    case "appearance":   return subcategory;               // eyes, eyebrows, nose, mouth, beard — each independent
    case "tattoos":      return `tattoo_${subcategory}`;   // tattoo_back, tattoo_chest, tattoo_arms, tattoo_legs
    case "head":         return subcategory;               // hats, sunglasses, decorations, horns, halos — each independent
    case "accessories":  return subcategory;               // bracelets, belts, neckwear, necklace, bags, nails — each independent
    case "hands":        return subcategory;               // gloves, handheld — each independent
    case "feet":         return subcategory === "socks" ? "socks" : "footwear"; // shoes/boots/slipOns share one slot
    case "coats":        return subcategory === "vests"  ? "vest" : "coatMain"; // jackets/hoodie mutually exclusive; vests independent
    default:             return category;                  // hair, tops, bottoms, onePiece
  }
}

// Returns outfit slot keys that must be cleared when equipping the given item.
// Handles: onePiece ↔ tops, onePiece ↔ bottoms
export function getConflictSlots(category, currentEquipped) {
  const conflicts = [];
  if (category === "onePiece") {
    if ("tops"    in currentEquipped) conflicts.push("tops");
    if ("bottoms" in currentEquipped) conflicts.push("bottoms");
  } else if (category === "tops" || category === "bottoms") {
    if ("onePiece" in currentEquipped) conflicts.push("onePiece");
  }
  return conflicts;
}

// Builds the ordered layer stack (slot keys, back→front) for the given outfit.
// Skinny-pants + boots ordering is handled dynamically.
export function buildLayerStack(outfit) {
  const hasSkinnyBottoms = outfit?.bottoms?.subcategory === "skinny";
  const hasBoots         = outfit?.footwear != null;

  const layers = [
    // Appearance — directly above base avatar
    "eyes", "eyebrows", "nose", "mouth", "beard",
    // Tattoos — above appearance, before clothing
    "tattoo_back", "tattoo_chest", "tattoo_arms", "tattoo_legs",
    // Hair — under all clothing
    "hair",
    // Accessories tucked under clothing
    "necklace", "bracelets", "gloves",
    // Socks always under footwear
    "socks",
  ];

  // Skinny pants render INSIDE boots; regular pants render OVER boots
  if (hasSkinnyBottoms && hasBoots) {
    layers.push("bottoms", "footwear");
  } else {
    layers.push("footwear", "bottoms");
  }

  layers.push(
    "onePiece",
    "tops",
    "belts",
    "vest",
    "coatMain",
    "neckwear",
    "handheld",
    "bags",
    "nails",
    // Head items — above hair and all clothing
    "hats", "sunglasses", "decorations", "horns", "halos",
  );

  return layers;
}

// All possible slot keys in default render order (non-skinny case).
// Use buildLayerStack(outfit) for actual rendering — this is for reference/preloading.
export const LAYER_ORDER = [
  "eyes", "eyebrows", "nose", "mouth", "beard",
  "tattoo_back", "tattoo_chest", "tattoo_arms", "tattoo_legs",
  "hair",
  "necklace", "bracelets", "gloves",
  "socks", "footwear", "bottoms",
  "onePiece", "tops", "belts", "vest", "coatMain",
  "neckwear", "handheld", "bags", "nails",
  "hats", "sunglasses", "decorations", "horns", "halos",
];

export const BASE_SPRITES = {
  female: "/assets/character-bases/females_new.png",
  male:   "/assets/character-bases/men-test.png",
};

// UI crop: visible area within a single 510×900 frame
export const CROP_X = 60;
export const CROP_W = 390;
export const CROP_H = 880;

// Remap UI pose index (0-5) → spritesheet column for idle row
export const POSE_REMAP = [0, 1, 2, 3, 5, 4];
