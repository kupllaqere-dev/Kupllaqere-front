import { BASE_SKIN_TONE } from "./LayerConfig.js";

const HEX_RE = /^#?([0-9a-fA-F]{6})$/;

function parseHex(color) {
  const m = HEX_RE.exec(typeof color === "string" ? color.trim() : "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Canonical "#rrggbb", or null when the value isn't a usable colour.
export function normalizeSkinColor(color) {
  const rgb = parseHex(color);
  if (!rgb) return null;
  return "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join("");
}

// True when the colour leaves the base sprite untouched — unset, malformed,
// or exactly the tone the bases are already painted in.
export function isBaseSkinTone(color) {
  const hex = normalizeSkinColor(color);
  return hex === null || hex === BASE_SKIN_TONE;
}

// Per-channel 256-entry lookup tables mapping base-sprite values → tinted values.
function buildSkinLuts(color) {
  const target = parseHex(color);
  const ref    = parseHex(BASE_SKIN_TONE);
  if (!target) return null;
  return [0, 1, 2].map(c => {
    const ratio = target[c] / ref[c];
    const lut   = new Uint8Array(256);
    for (let v = 0; v < 256; v++) lut[v] = Math.min(255, Math.round(v * ratio));
    return lut;
  });
}

// Recolours every non-transparent pixel of the context in place.
// The context must hold nothing but the untinted base sprite.
export function applySkinTint(ctx, width, height, color) {
  const luts = buildSkinLuts(color);
  if (!luts) return;
  const [lr, lg, lb] = luts;
  const img = ctx.getImageData(0, 0, width, height);
  const d   = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i]     = lr[d[i]];
    d[i + 1] = lg[d[i + 1]];
    d[i + 2] = lb[d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
}
