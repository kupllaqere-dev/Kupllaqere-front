/**
 * Master sticker catalogue.
 *
 * Each entry defines:
 *   id        – stable DB key, also used as texture key (`s_<id>`)
 *               and PNG filename (`/assets/stickers/<id>.png`)
 *   emoji     – fallback when the PNG is absent
 *   label     – accessible name shown in the picker
 *   category  – for future grouped picker UI
 */
export const STICKER_ASSETS = [
  // ── Hearts & Love ─────────────────────────────────────────────
  { id: "heart_pink",     emoji: "❤️",  label: "Heart",       category: "love"   },
  { id: "heart_sparkle",  emoji: "💖",  label: "Sparkling Heart", category: "love" },
  { id: "heart_ribbon",   emoji: "💝",  label: "Heart Ribbon", category: "love"  },
  { id: "kiss_mark",      emoji: "💋",  label: "Kiss",         category: "love"  },

  // ── Stars & Magic ─────────────────────────────────────────────
  { id: "star_yellow",    emoji: "⭐",  label: "Star",         category: "magic" },
  { id: "shooting_star",  emoji: "🌟",  label: "Glow Star",    category: "magic" },
  { id: "sparkles",       emoji: "✨",  label: "Sparkles",     category: "magic" },
  { id: "magic_wand",     emoji: "🪄",  label: "Magic Wand",   category: "magic" },

  // ── Nature & Flowers ─────────────────────────────────────────
  { id: "cherry_blossom", emoji: "🌸",  label: "Blossom",      category: "nature" },
  { id: "rose",           emoji: "🌹",  label: "Rose",         category: "nature" },
  { id: "rainbow",        emoji: "🌈",  label: "Rainbow",      category: "nature" },
  { id: "four_leaf",      emoji: "🍀",  label: "Clover",       category: "nature" },
  { id: "butterfly",      emoji: "🦋",  label: "Butterfly",    category: "nature" },
  { id: "crescent_moon",  emoji: "🌙",  label: "Moon",         category: "nature" },
  { id: "sun",            emoji: "☀️",  label: "Sun",          category: "nature" },

  // ── Cute & Kawaii ─────────────────────────────────────────────
  { id: "cat_face",       emoji: "🐱",  label: "Cat",          category: "kawaii" },
  { id: "crown",          emoji: "👑",  label: "Crown",        category: "kawaii" },
  { id: "bow",            emoji: "🎀",  label: "Bow",          category: "kawaii" },
  { id: "gem",            emoji: "💎",  label: "Gem",          category: "kawaii" },
  { id: "balloon",        emoji: "🎈",  label: "Balloon",      category: "kawaii" },
  { id: "birthday_cake",  emoji: "🎂",  label: "Cake",         category: "kawaii" },
  { id: "lollipop",       emoji: "🍭",  label: "Lollipop",     category: "kawaii" },
  { id: "strawberry",     emoji: "🍓",  label: "Strawberry",   category: "kawaii" },
  { id: "cherry",         emoji: "🍒",  label: "Cherry",       category: "kawaii" },

  // ── Misc ──────────────────────────────────────────────────────
  { id: "fire",           emoji: "🔥",  label: "Fire",         category: "misc"  },
  { id: "musical_note",   emoji: "🎵",  label: "Music Note",   category: "misc"  },
  { id: "diamond_suit",   emoji: "♦️",  label: "Diamond",      category: "misc"  },
];

/** Fast lookup by id */
export const STICKER_ASSET_MAP = Object.fromEntries(
  STICKER_ASSETS.map(a => [a.id, a])
);

/** Set used on the server for quick validation */
export const VALID_STICKER_IDS = new Set(STICKER_ASSETS.map(a => a.id));
