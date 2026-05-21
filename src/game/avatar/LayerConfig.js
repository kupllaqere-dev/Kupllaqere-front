// Spritesheet dimensions
export const SHEET_W      = 3060;
export const SHEET_TOTAL_H = 5238;
export const FRAME_W      = 510;
export const FRAME_H      = 900;

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
// (6 cols × 5 rows = 30 frames, indexed left-to-right, top-to-bottom)
export const ANIM_DEFS = {
  idle:      { frames: [0, 1, 2, 3, 4, 5],         frameRate: 0,  repeat: -1 },
  walkLeft:  { frames: [6, 7, 8, 9, 10, 11],        frameRate: 4, repeat: -1 },
  walkRight: { frames: [12, 13, 14, 15, 16, 17],    frameRate: 4, repeat: -1 },
  walkDown:    { frames: [18, 19, 20, 21],             frameRate: 4, repeat: -1 },
  walkUp:  { frames: [24, 25, 26, 27],             frameRate: 4, repeat: -1 },
};

// Canvas compositing order — bottom layer to top.
// Keys match the outfit object's slot keys directly (appearance sub-items
// are stored by subcategory name, e.g. outfit.eyes, outfit.hair).
export const LAYER_ORDER = [
  "eyes",
  "eyebrows",
  "nose",
  "mouth",
  "beard",
  "bottoms",
  "feet",
  "onePiece",
  "tops",
  "hands",
  "coats",
  "accessories",
  "hair",
  "head",
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
