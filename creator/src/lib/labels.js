export const CATEGORY_LABELS = {
  tops: "Tops", bottoms: "Bottoms", onePiece: "One-piece", coats: "Coats", head: "Head",
  hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance", tattoos: "Tattoos",
};

export const SUBCATEGORY_LABELS = {
  longSleeve: "Long sleeve", shortSleeve: "Short sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jacket", vests: "Vest", hoodie: "Hoodie",
  hats: "Hat", sunglasses: "Sunglasses", decorations: "Decoration", horns: "Horns", halos: "Halo",
  short: "Short", medium: "Medium", long: "Long",
  bracelets: "Bracelet", belts: "Belt", neckwear: "Neckwear", necklace: "Necklace", bags: "Bag", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
  back: "Back", chest: "Chest", arms: "Arms", legs: "Legs",
};

const humanize = (s) => String(s || "").replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export const categoryLabel    = (c) => CATEGORY_LABELS[c] || humanize(c);
export const subcategoryLabel = (s) => SUBCATEGORY_LABELS[s] || humanize(s);
export const typeLabel = (c, s) => (c && s ? `${categoryLabel(c)} · ${subcategoryLabel(s)}` : "No type");
