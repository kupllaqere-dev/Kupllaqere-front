import { getSetupPose } from "./dragonBones.js";

// The body parts of the skeleton rigs — one per atlas frame, each a trimmed
// cutout of one shared 600x900 canvas. The character has three rigs, one per
// view: side-on (FemaleSideWalk, the parts listed below), front-on and
// back-on (FemaleFrontWalk / FemaleBackWalk, which add a separate
// Right_Upper_Arm). Shared by the in-game SkeletonAvatar and the creator / admin
// previews (CanvasRig), and mirrored by the backend's lib/itemParts.js, which
// enforces the same names on uploaded clothing.
//
// Clothing is authored on that same 600x900 canvas, one PNG per body part it
// covers, so a garment piece lines up with its body part pixel for pixel and
// rides the same bone. A frame's name lowercased is also its bone:
// "Left_Upper_Leg.png" -> `left_upper_leg`.

export const RIG_CANVAS = { width: 600, height: 900 };

// FemaleSideWalk_ske.json's slots are named after the atlas frames, with one
// exception: the right arm. The rig has no `right_upper_arm` bone —
// `right_lower_arm` hangs off `torso` and its cutout covers the whole arm,
// shoulder included — but the slot that places it is called Right_Upper_Arm.
const SLOT_TO_PART = { Right_Upper_Arm: "Right_Lower_Arm" };

// Draw order, back to front — the slot order of FemaleSideWalk_ske.json, the last
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

// ── views ────────────────────────────────────────────────────────────────────

/** The character's rigs, one per direction it can be seen from. */
export const RIG_VIEWS = ["side", "front", "back"];
export const VIEW_LABELS = { side: "Side", front: "Front", back: "Back" };

// Body parts per view. The side rig's right arm is one piece (Right_Lower_Arm,
// shoulder to hand); the front and back rigs split it like the left one.
// Mirrored by the backend's lib/itemParts.js.
export const VIEW_PARTS = {
  side:  PART_ORDER,
  front: [...PART_ORDER, "Right_Upper_Arm"],
  back:  [...PART_ORDER, "Right_Upper_Arm"],
};

/**
 * A garment frame's name in a packed clothing atlas: side-view pieces keep
 * the plain body-part name ("Torso"), the other views are prefixed
 * ("front/Torso") — so atlases packed before there were views still read as
 * side-on.
 */
export function garmentFrameName(view, part) {
  return view === "side" ? part : `${view}/${part}`;
}

/** "front/Torso" -> { view: "front", part: "Torso" }; "Torso" -> side. */
export function parseGarmentFrame(name) {
  const i = name.indexOf("/");
  if (i < 0) return { view: "side", part: name };
  return { view: name.slice(0, i), part: name.slice(i + 1) };
}

// ── matching a rig to its atlas ──────────────────────────────────────────────

// Slot names the front and back rigs use that are not side-first part names.
// The back rig's left shin was made by copying the right one and never renamed
// — it rides the bone between Left_Upper_Leg and Left_Foot.
const SLOT_ALIASES = { Right_Lower_Leg_copy: "Left_Lower_Leg" };

/** A front/back rig slot name as a part name: "Foot_Left" -> "Left_Foot". */
export function canonicalPartName(slotName) {
  if (SLOT_ALIASES[slotName]) return SLOT_ALIASES[slotName];
  const m = /^(.*)_(Left|Right)$/.exec(slotName);
  return m ? `${m[2]}_${m[1]}` : slotName;
}

/**
 * Matches a parsed armature's body parts to its atlas frames, in draw order,
 * and finds where the atlas's 600x900 canvas centre sits in armature units
 * (the pin point every part is drawn at). One canvas pixel is one armature
 * unit in every rig.
 *
 * `findFrame(baseName)` looks a frame up by part or attachment name — trying
 * the name as given and with spaces for underscores ("Upper Leg Right") —
 * and returns `{ key, centreX, centreY }`: its key, and its trimmed cutout's
 * centre relative to the canvas centre. Returns
 * `{ pinX, pinY, parts: [{ name, boneIndex, key }] }`.
 *
 *  - Side rig: its slots are bare (they only set the draw order), each frame
 *    rides the bone named after it, and its aabb is the canvas, centred.
 *  - Front/back rigs: their slots carry attachments on real bones, so each
 *    frame rides its slot's bone, and the canvas centre is recovered from
 *    where those attachments sit in the setup pose. They agree on it to
 *    within a pixel, so the average is used.
 */
export function resolveRigParts(armature, findFrame) {
  const parts = [];

  if (!armature.slots.length) {
    const { x, y, width, height } = armature.aabb;
    for (const name of partDrawOrder(armature)) {
      const frame     = findFrame(name);
      const boneIndex = armature.bones.findIndex(b => b.name === name.toLowerCase());
      if (!frame || boneIndex < 0) {
        console.warn(`Rig: body part "${name}" is missing from the atlas or skeleton`);
        continue;
      }
      parts.push({ name, boneIndex, key: frame.key });
    }
    return { pinX: x + width / 2, pinY: y + height / 2, parts };
  }

  // Each attachment is its frame's cutout centred on the slot, so the slot's
  // setup position minus the cutout's offset is the canvas centre.
  const setup = getSetupPose(armature);
  let sumX = 0, sumY = 0;
  armature.slots.forEach((slot, i) => {
    const frame = findFrame(slot.frameName.split("/").pop());
    if (!frame) {
      console.warn(`Rig: atlas has no frame for attachment "${slot.frameName}"`);
      return;
    }
    sumX += setup.slots[i].tx - frame.centreX;
    sumY += setup.slots[i].ty - frame.centreY;
    parts.push({ name: canonicalPartName(slot.name), boneIndex: slot.bone, key: frame.key });
  });
  const n = parts.length || 1;
  return { pinX: sumX / n, pinY: sumY / n, parts };
}

/** The spellings an atlas may use for a frame: as given, and with spaces. */
export function frameNameCandidates(name) {
  const spaced = name.replace(/_/g, " ");
  return spaced === name ? [name] : [name, spaced];
}
