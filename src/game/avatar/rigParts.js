// The body parts of the skeleton rig — one per frame of
// /assets/skeleton/qifsha.json, each a trimmed cutout of one shared 600x900
// canvas. Shared by the in-game SkeletonAvatar and the creator / admin
// previews (CanvasRig), and mirrored by the backend's lib/itemParts.js, which
// enforces the same names on uploaded clothing.
//
// Clothing is authored on that same 600x900 canvas, one PNG per body part it
// covers, so a garment piece lines up with its body part pixel for pixel and
// rides the same bone. A frame's name lowercased is also its bone:
// "Left_Upper_Leg.png" -> `left_upper_leg`.

export const RIG_CANVAS = { width: 600, height: 900 };

// qifsha_ske.json's slots are named after the atlas frames, with one
// exception: the right arm. The rig has no `right_upper_arm` bone —
// `right_lower_arm` hangs off `torso` and its cutout covers the whole arm,
// shoulder included — but the slot that places it is called Right_Upper_Arm.
const SLOT_TO_PART = { Right_Upper_Arm: "Right_Lower_Arm" };

// Draw order, back to front — the slot order of qifsha_ske.json, the last
// (Head) drawn on top. The rig file is the source of truth (see
// partDrawOrder); this copy is the fallback and what the backend mirrors.
export const PART_ORDER = [
  "Right_Lower_Arm",
  "Right_Foot",
  "Right_Upper_Leg",
  "Right_Lower_Leg",
  "Left_Foot",
  "Left_Lower_Leg",
  "Left_Upper_Leg",
  "Torso",
  "Left_Lower_Arm",
  "Left_Upper_Arm",
  "Head",
];

// Clothing is layered with the body, not over it: each garment piece is drawn
// in its body part's slot, right on top of that part (see CanvasRig.draw), so
// it follows the same order. Mirrored as DRAW_ORDER in the backend's
// lib/itemParts.js, which packs atlas frames and stacks thumbnails this way.
export const GARMENT_ORDER = PART_ORDER;

/**
 * The body parts back to front, as the parsed armature's slots stack them.
 * Falls back to PART_ORDER for a rig with no usable slots, and appends any
 * part the slots leave out so it is still drawn rather than lost.
 */
export function partDrawOrder(armature) {
  const known = new Set(PART_ORDER);
  const order = [];
  for (const slot of armature?.drawOrder || []) {
    const part = SLOT_TO_PART[slot] ?? slot;
    if (known.has(part) && !order.includes(part)) order.push(part);
  }
  if (!order.length) return [...PART_ORDER];
  for (const part of PART_ORDER) if (!order.includes(part)) order.push(part);
  return order;
}

/** "Left_Upper_Arm" -> "left_upper_arm", the body part clothing file names end in. */
export function partFileToken(part) {
  return part.toLowerCase();
}

/** "Left_Upper_Arm" -> "Left upper arm". */
export function partLabel(part) {
  const label = partFileToken(part).replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}
