export const FRAME_W = 510;
export const FRAME_H = 900;
export const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6, 1.8];
export const POSE_ORDER = [0, 4, 5, 3, 2, 1];
export const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];
export const LAYER_ORDER = ["appearance", "bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];
export const BADGES = ["diamond", "flame", "medal", "paint", "verified"];

export const INV_CATEGORY_LABELS = {
  tops: "Tops", bottoms: "Bottoms", onePiece: "One Piece", coats: "Coats",
  head: "Head", hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance",
};
export const INV_SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations", horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear", necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
};
export const INV_CATEGORY_SUBCATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts", "skirt"],
  onePiece: ["overall", "dress"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
  appearance: ["eyes", "eyebrows", "nose", "mouth", "beard"],
};
export const INV_CATEGORY_DECO = {
  tops: "/assets/store/tops.png", bottoms: "/assets/store/bottoms.png",
  onePiece: "/assets/store/onepiece.png", coats: "/assets/store/coats.png",
  head: "/assets/store/head.png", hair: "/assets/store/hair.png",
  accessories: "/assets/store/accessories.png", feet: "/assets/store/feet.png",
  hands: "/assets/store/hands.png", appearance: "/assets/store/head.png",
};
export const INV_CATEGORIES = Object.keys(INV_CATEGORY_LABELS);

export const BADGE_RARITY = { diamond: "legendary", flame: "legendary", medal: "rare", paint: "rare", verified: "common" };
export const BIO_MAX = 2000;
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
  { key: "eyebrows",  label: "Eyebrows" },
  { key: "eyes",      label: "Eyes" },
  { key: "nose",      label: "Nose" },
  { key: "mouth",     label: "Mouth" },
];

export const LOOK_FEATURE_CATEGORY = {
  hair:     "hair",
  eyebrows: "appearance",
  eyes:     "appearance",
  nose:     "appearance",
  mouth:    "appearance",
};

export const LOOK_FEATURE_SUBCATEGORY = {
  hair:     null,
  eyebrows: "eyebrows",
  eyes:     "eyes",
  nose:     "nose",
  mouth:    "mouth",
};
