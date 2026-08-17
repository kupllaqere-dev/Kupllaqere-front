import { BASE_SKIN_TONE } from "../../game/avatar/LayerConfig";

export const FRAME_W = 510;
export const FRAME_H = 900;
export const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6, 1.8];
export const POSE_ORDER = [0, 4, 5, 3, 2, 1];

export const BADGES = ["diamond", "flame", "medal", "paint", "verified"];

export const INV_CATEGORY_LABELS = {
  tops: "Tops", bottoms: "Bottoms", onePiece: "One Piece", coats: "Coats",
  head: "Head", hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance", tattoos: "Tattoos",
};
export const INV_SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations", horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear", necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
  back: "Back", chest: "Chest", arms: "Arms", legs: "Legs",
};
export const INV_CATEGORY_SUBCATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts", "skirt"],
  onePiece: ["overall", "dress"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
  appearance: ["eyes", "eyebrows", "nose", "mouth", "beard"],
  tattoos: ["back", "chest", "arms", "legs"],
};
export const INV_CATEGORY_DECO = {
  tops: "/assets/store/tops.png", bottoms: "/assets/store/bottoms.png",
  onePiece: "/assets/store/onepiece.png", coats: "/assets/store/coats.png",
  head: "/assets/store/head.png", hair: "/assets/store/hair.png",
  accessories: "/assets/store/accessories.png", feet: "/assets/store/feet.png",
  hands: "/assets/store/hands.png", appearance: "/assets/store/head.png",
  tattoos: "/assets/store/head.png",
};
export const INV_CATEGORIES = Object.keys(INV_CATEGORY_LABELS);

export const BADGE_RARITY = { diamond: "legendary", flame: "legendary", medal: "rare", paint: "rare", verified: "common" };
export const SHOWCASE_SLOTS = 5;
export const COMMENT_MAX = 100;

export const PRESENCE_LABELS = {
  online:    "Online",
  away:      "Away",
  offline:   "Offline",
  invisible: "Invisible",
};

export const STORE_LABELS = { normal: "Normal Store", gem: "Gem Store", seasonal: "Seasonal Store" };

export const WL_RARITY = {
  nonRare:  { label: "Common",     bg: "rgba(120,90,180,0.1)",  border: "rgba(120,90,180,0.22)", color: "#7c5cbf" },
  rare:     { label: "Rare",       bg: "rgba(109,40,217,0.1)",  border: "rgba(109,40,217,0.3)",  color: "#7c3aed" },
  superRare:{ label: "Super Rare", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.3)",   color: "#b45309" },
};

export const LOOK_FEATURES = [
  { key: "hair",      label: "Hair" },
  { key: "eyes",      label: "Eyes" },
  { key: "eyebrows",  label: "Eyebrows" },
  { key: "nose",      label: "Nose" },
  { key: "mouth",     label: "Mouth" },
  { key: "beard",     label: "Beard" },
  { key: "makeup",    label: "Makeup" },
];

export const LOOK_FEATURE_CATEGORY = {
  hair:     "hair",
  eyebrows: "appearance",
  eyes:     "appearance",
  nose:     "appearance",
  mouth:    "appearance",
  beard:    "appearance",
  makeup:   "appearance",
};

// BASE_SKIN_TONE is the tone the character bases are painted in, so that swatch
// renders the avatar untinted — every other one is a ratio tint against it.
export const LOOK_SKIN_COLORS = [
  "#ffe0bd", "#ffcd94", BASE_SKIN_TONE, "#e0ac69", "#c68642",
  "#a56b3f", "#8d5524", "#6b4226", "#4a2c1c", "#3a2116",
];

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// 40 swatches = exactly 4 rows of 10 in the color grid.
// Row 1: neutrals + browns; rows 2-4: an even sweep around the hue wheel.
export const LOOK_FEATURE_COLORS = [
  "#ffffff", "#d9d9d9", "#9a9a9a", "#4a4a4a", "#000000",
  "#e3c496", "#c08f57", "#8b5a2b", "#5c3a1e", "#3b2314",
  ...Array.from({ length: 30 }, (_, i) => hslToHex((i * 360) / 30, 65, 50)),
];

export const DEFAULT_BIO_SECTIONS = [
  {
    id: "welcome",
    type: "welcome",
    title: "Welcome",
    text: "Welcome to my profile! Thanks for stopping by — feel free to look around.",
  },
  {
    id: "info",
    type: "info",
    title: "Info",
    columns: [
      {
        title: "About", style: "text",
        lines: ["Line one", "Line two", "Line three", "Line four"],
        rows: [
          { key: "Key", value: "Line one" },
          { key: "Key", value: "Line two" },
          { key: "Key", value: "Line three" },
          { key: "Key", value: "Line four" },
        ],
      },
      {
        title: "Favorites", style: "text",
        lines: ["Line one", "Line two", "Line three", "Line four"],
        rows: [
          { key: "Key", value: "Line one" },
          { key: "Key", value: "Line two" },
          { key: "Key", value: "Line three" },
          { key: "Key", value: "Line four" },
        ],
      },
      {
        title: "Stats", style: "text",
        lines: ["Line one", "Line two", "Line three", "Line four"],
        rows: [
          { key: "Key", value: "Line one" },
          { key: "Key", value: "Line two" },
          { key: "Key", value: "Line three" },
          { key: "Key", value: "Line four" },
        ],
      },
    ],
  },
  {
    id: "quote",
    type: "quote",
    title: "Quote",
    text: "Placeholder quote goes here.",
  },
  {
    id: "badges",
    type: "badges",
    title: "Badges",
    slots: [null, null, null, null, null, null, null],
  },
];

export const LOOK_FEATURE_SUBCATEGORY = {
  hair:     null,
  eyebrows: "eyebrows",
  eyes:     "eyes",
  nose:     "nose",
  mouth:    "mouth",
  beard:    "beard",
  makeup:   "makeup",
};
