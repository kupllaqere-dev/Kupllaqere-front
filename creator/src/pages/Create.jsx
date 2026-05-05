import { useRef, useState } from "react";
import styled from "styled-components";
import AvatarCanvas from "../components/AvatarCanvas";
import { submitSingle, submitSet } from "../api/creator";

// ── Category data ─────────────────────────────────────────────────────────────
const CATEGORIES = {
  tops:        ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms:     ["pants", "skinny", "shorts", "skirt"],
  coats:       ["jackets", "vests", "hoodie"],
  head:        ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair:        ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet:        ["shoes", "boots", "slipOns", "socks"],
  hands:       ["gloves", "handheld"],
  appearance:  ["eyes", "eyebrows", "nose", "mouth", "beard"],
};

const CAT_LABELS = {
  tops: "Tops", bottoms: "Bottoms", coats: "Coats", head: "Head",
  hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance",
};

const SUBCAT_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations", horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear", necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
};

// ── Extract thumbnail from sprite sheet (y:4616, 510×510 → 256×256) ──────────
// Returns { file, avatarUrl (full sheet object URL), thumbnailUrl (canvas data URL) }
async function extractVariantAssets(file) {
  return new Promise((resolve) => {
    const avatarUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width  = 256;
        canvas.height = 256;
        canvas.getContext("2d").drawImage(img, 0, 4616, 510, 510, 0, 0, 256, 256);
        resolve({ file, avatarUrl, thumbnailUrl: canvas.toDataURL("image/png") });
      } catch {
        resolve({ file, avatarUrl, thumbnailUrl: null });
      }
    };
    img.onerror = () => resolve({ file, avatarUrl, thumbnailUrl: null });
    img.src = avatarUrl;
  });
}

const EMPTY_VARIANTS = () => Array(10).fill(null);

const EMPTY_SET_ITEM = () => ({
  name: "",
  category: null,
  subcategory: null,
  variants: Array(5).fill(null),
  activeVar: 0,
});

// ── VariantSlot ───────────────────────────────────────────────────────────────
function VariantSlot({ variant, required, isActive, onUpload, onSelect, onDelete }) {
  const inputRef = useRef(null);

  if (variant) {
    return (
      <SlotBox
        $filled
        $active={isActive}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          const f = e.dataTransfer.files[0];
          if (f) onUpload(f);
        }}
      >
        {variant.thumbnailUrl
          ? <SlotThumb src={variant.thumbnailUrl} alt="variant" />
          : <SlotThumb src={variant.avatarUrl} alt="variant" style={{ objectFit: "cover" }} />}
        <SlotDeleteBtn
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Remove"
        >✕</SlotDeleteBtn>
      </SlotBox>
    );
  }

  return (
    <SlotBox
      $required={required}
      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) onUpload(f); }}
    >
      <SlotPlaceholder>{required ? "Required" : "Optional"}</SlotPlaceholder>
      <input
        ref={inputRef}
        type="file"
        accept=".png"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; if (f) onUpload(f); e.target.value = ""; }}
      />
    </SlotBox>
  );
}

// ── CategorySelector ──────────────────────────────────────────────────────────
function CategorySelector({ mode, selectedSlot, singleSel, setItems, onSelectSingle, onSelectForSlot }) {
  // Which slot (1-based) owns this exact subcat? (for the badge)
  const slotForSub = (cat, sub) => {
    const i = setItems.findIndex((it) => it.category === cat && it.subcategory === sub);
    return i >= 0 ? i + 1 : null;
  };

  const handleClick = (cat, sub) => {
    if (mode === "single") { onSelectSingle(cat, sub); return; }
    if (selectedSlot === null) return;
    onSelectForSlot(selectedSlot, cat, sub);
  };

  return (
    <CatList>
      {Object.entries(CATEGORIES).map(([cat, subs]) => (
        <CatGroup key={cat}>
          <CatHeader>
            <CatName>{CAT_LABELS[cat]}</CatName>
          </CatHeader>
          <SubList>
            {subs.map((sub) => {
              const isThisSlotActive = mode === "single"
                ? singleSel.category === cat && singleSel.subcategory === sub
                : setItems[selectedSlot]?.category === cat && setItems[selectedSlot]?.subcategory === sub;
              const slotNum = mode === "set" ? slotForSub(cat, sub) : null;
              return (
                <SubItem
                  key={sub}
                  $active={isThisSlotActive}
                  onClick={() => handleClick(cat, sub)}
                >
                  {SUBCAT_LABELS[sub] || sub}
                  {slotNum !== null && <SlotBadge>{slotNum}</SlotBadge>}
                </SubItem>
              );
            })}
          </SubList>
        </CatGroup>
      ))}
    </CatList>
  );
}

// ── Main Create page ──────────────────────────────────────────────────────────
export default function Create() {
  const [mode, setMode]     = useState("single");
  const [gender, setGender] = useState("female");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [error, setError]           = useState(null);

  // ── Single state ──
  const [singleName, setSingleName]         = useState("");
  const [singleSel, setSingleSel]           = useState({ category: null, subcategory: null });
  const [singleVariants, setSingleVariants] = useState(EMPTY_VARIANTS());
  const [singleActiveVar, setSingleActiveVar] = useState(0);

  // ── Set state ──
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [setItems, setSetItems]         = useState(() => Array.from({ length: 5 }, EMPTY_SET_ITEM));

  // ── Avatar URLs ──
  const avatarUrls = mode === "single"
    ? [(singleVariants[singleActiveVar] ?? singleVariants.find(Boolean))?.avatarUrl].filter(Boolean)
    : setItems.map((it) => (it.variants[it.activeVar] ?? it.variants.find(Boolean))?.avatarUrl).filter(Boolean);

  // ── Single handlers ──
  const handleSingleUpload = async (idx, file) => {
    const assets = await extractVariantAssets(file);
    setSingleVariants((prev) => { const n = [...prev]; n[idx] = assets; return n; });
    setSingleActiveVar(idx);
  };

  const handleSingleDelete = (idx) => {
    setSingleVariants((prev) => {
      const n = [...prev];
      n[idx] = null;
      // If we removed the active variant, switch to first remaining
      if (singleActiveVar === idx) {
        const next = n.findIndex((v) => v !== null);
        setSingleActiveVar(next >= 0 ? next : 0);
      }
      return n;
    });
  };

  // ── Set handlers ──
  const handleSetUpload = async (slotIdx, varIdx, file) => {
    const assets = await extractVariantAssets(file);
    setSetItems((prev) => {
      const next = [...prev];
      const item = { ...next[slotIdx], variants: [...next[slotIdx].variants] };
      item.variants[varIdx] = assets;
      item.activeVar = varIdx;
      next[slotIdx] = item;
      return next;
    });
  };

  const handleSetDelete = (slotIdx, varIdx) => {
    setSetItems((prev) => {
      const next = [...prev];
      const item = { ...next[slotIdx], variants: [...next[slotIdx].variants] };
      item.variants[varIdx] = null;
      if (item.activeVar === varIdx) {
        const nxt = item.variants.findIndex((v, i) => i !== varIdx && v);
        item.activeVar = nxt >= 0 ? nxt : 0;
      }
      next[slotIdx] = item;
      return next;
    });
  };

  const handleSetActiveVar = (slotIdx, varIdx) => {
    setSetItems((prev) => {
      const next = [...prev];
      next[slotIdx] = { ...next[slotIdx], activeVar: varIdx };
      return next;
    });
  };

  const handleSetName = (slotIdx, val) => {
    setSetItems((prev) => { const n = [...prev]; n[slotIdx] = { ...n[slotIdx], name: val }; return n; });
  };

  const handleSelectForSlot = (slotIdx, cat, sub) => {
    setSetItems((prev) => { const n = [...prev]; n[slotIdx] = { ...n[slotIdx], category: cat, subcategory: sub }; return n; });
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError(null); setSuccess(null);

    if (mode === "single") {
      if (!singleName.trim()) return setError("Name is required.");
      if (!singleSel.category) return setError("Select a category and subcategory.");
      if (!singleVariants.some(Boolean)) return setError("Upload at least one variant.");

      const fd = new FormData();
      fd.append("type", "single");
      fd.append("name", singleName.trim());
      fd.append("gender", gender);
      fd.append("category", singleSel.category);
      fd.append("subcategory", singleSel.subcategory);
      singleVariants.forEach((v, i) => { if (v) fd.append(`image_${i}`, v.file); });

      setSubmitting(true);
      try {
        await submitSingle(fd);
        setSuccess("Item submitted for review!");
        setSingleName(""); setSingleSel({ category: null, subcategory: null });
        setSingleVariants(EMPTY_VARIANTS()); setSingleActiveVar(0);
      } catch (e) { setError(e.message); }
      finally { setSubmitting(false); }
      return;
    }

    // Set validation
    for (let i = 0; i < 5; i++) {
      const it = setItems[i];
      if (!it.name.trim()) return setError(`Item ${i + 1}: name is required.`);
      if (!it.category)    return setError(`Item ${i + 1}: select a category.`);
      const varCount = it.category === "appearance" ? 1 : 5;
      if (it.variants.slice(0, varCount).some((v) => !v)) return setError(`Item ${i + 1}: all ${varCount} variant${varCount > 1 ? "s are" : " is"} required.`);
    }

    const fd = new FormData();
    fd.append("type", "set");
    fd.append("gender", gender);
    setItems.forEach((it, i) => {
      fd.append(`item_${i}_name`, it.name.trim());
      fd.append(`item_${i}_category`, it.category);
      fd.append(`item_${i}_subcategory`, it.subcategory);
      it.variants.forEach((v, vi) => { if (v) fd.append(`image_${i}_${vi}`, v.file); });
    });

    setSubmitting(true);
    try {
      await submitSet(fd);
      setSuccess("Set submitted for review!");
      setSetItems(Array.from({ length: 5 }, EMPTY_SET_ITEM));
      setSelectedSlot(0);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  // ── Render ──
  return (
    <Page>
      <ModeBar>
        <ModeTab $active={mode === "single"} onClick={() => setMode("single")}>Singles</ModeTab>
        <ModeTab $active={mode === "set"}    onClick={() => setMode("set")}>Sets</ModeTab>
      </ModeBar>

      <ThreeCols>
        {/* ── LEFT: Category selector ── */}
        <LeftPanel>
          <PanelTitle>Category</PanelTitle>
          <CategorySelector
            mode={mode}
            selectedSlot={selectedSlot}
            singleSel={singleSel}
            setItems={setItems}
            onSelectSingle={(cat, sub) => setSingleSel({ category: cat, subcategory: sub })}
            onSelectForSlot={handleSelectForSlot}
          />
        </LeftPanel>

        {/* ── MIDDLE: Name + gender (above avatar) + avatar ── */}
        <MiddlePanel>
          <FieldRow>
            {mode === "single" ? (
              <Field>
                <FieldLabel>Item name</FieldLabel>
                <TextInput
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. Floral Blouse"
                  maxLength={40}
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel>Name for item {selectedSlot + 1}</FieldLabel>
                <TextInput
                  value={setItems[selectedSlot].name}
                  onChange={(e) => handleSetName(selectedSlot, e.target.value)}
                  placeholder={`Item ${selectedSlot + 1} name`}
                  maxLength={40}
                />
              </Field>
            )}
            <Field style={{ flex: "0 0 130px" }}>
              <FieldLabel>Gender</FieldLabel>
              <GenderSelect value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </GenderSelect>
            </Field>
          </FieldRow>

          <AvatarSection>
            <AvatarCanvas gender={gender} itemImageUrls={avatarUrls} width={306} height={540} />
          </AvatarSection>

          {error   && <Msg $error>{error}</Msg>}
          {success && <Msg $success>{success}</Msg>}

          <SubmitBtn onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : mode === "set" ? "Submit Set" : "Submit Item"}
          </SubmitBtn>
        </MiddlePanel>

        {/* ── RIGHT: Variant upload boxes ── */}
        <RightPanel>
          {mode === "single" ? (
            <VariantBox>
              <VariantBoxTitle>
                {singleSel.subcategory
                  ? `${CAT_LABELS[singleSel.category]} - ${SUBCAT_LABELS[singleSel.subcategory] || singleSel.subcategory}`
                  : "Select a category"}
              </VariantBoxTitle>
              <VariantGrid>
                {Array(singleSel.category === "appearance" ? 1 : 10).fill(null).map((_, i) => (
                  <VariantSlot
                    key={i}
                    variant={singleVariants[i]}
                    required={false}
                    isActive={!!singleVariants[i] && i === singleActiveVar}
                    onUpload={(f) => handleSingleUpload(i, f)}
                    onSelect={() => setSingleActiveVar(i)}
                    onDelete={() => handleSingleDelete(i)}
                  />
                ))}
              </VariantGrid>
            </VariantBox>
          ) : (
            setItems.map((item, slotIdx) => {
              const varCount = item.category === "appearance" ? 1 : 5;
              return (
                <VariantBox
                  key={slotIdx}
                  $active={slotIdx === selectedSlot}
                  onClick={() => setSelectedSlot(slotIdx)}
                >
                  <VariantBoxTitle>
                    {item.subcategory
                      ? `${slotIdx + 1}. ${CAT_LABELS[item.category]} - ${SUBCAT_LABELS[item.subcategory] || item.subcategory}`
                      : `${slotIdx + 1}. No category`}
                  </VariantBoxTitle>
                  <VariantGrid>
                    {item.variants.slice(0, varCount).map((variant, varIdx) => (
                      <VariantSlot
                        key={varIdx}
                        variant={variant}
                        required={true}
                        isActive={!!item.variants[varIdx] && varIdx === item.activeVar}
                        onUpload={(f) => { setSelectedSlot(slotIdx); handleSetUpload(slotIdx, varIdx, f); }}
                        onSelect={() => { setSelectedSlot(slotIdx); handleSetActiveVar(slotIdx, varIdx); }}
                        onDelete={() => handleSetDelete(slotIdx, varIdx)}
                      />
                    ))}
                  </VariantGrid>
                </VariantBox>
              );
            })
          )}
        </RightPanel>
      </ThreeCols>
    </Page>
  );
}

/* ── Styles ── */
const Page = styled.div`display:flex;flex-direction:column;height:100%;overflow:hidden;`;

const ModeBar = styled.div`
  display:flex;gap:0;padding:20px 24px 0;border-bottom:1px solid #ffffff0a;flex-shrink:0;
`;
const ModeTab = styled.button`
  padding:10px 28px;border:none;cursor:pointer;font-size:14px;font-weight:700;
  background:${(p) => p.$active ? "#68cfee" : "transparent"};
  color:${(p) => p.$active ? "#fff" : "#666"};
  border-radius:8px 8px 0 0;transition:background 0.15s,color 0.15s;
  &:hover{color:${(p) => p.$active ? "#fff" : "#ccc"};}
`;

const ThreeCols = styled.div`display:flex;flex:1;overflow:hidden;`;

// Left panel
const LeftPanel = styled.div`
  width:240px;flex-shrink:0;border-right:1px solid #ffffff0a;
  display:flex;flex-direction:column;overflow-y:auto;padding:16px 0;
`;
const PanelTitle = styled.div`font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;padding:0 16px 10px;`;


const CatList   = styled.div`display:flex;flex-direction:column;gap:4px;padding:0 10px;`;
const CatGroup  = styled.div``;
const CatHeader = styled.div`
  padding:10px 6px 4px;
  color:#bbb;
  font-size:13px;font-weight:700;
`;
const CatName   = styled.span``;
const SubList   = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:0 0 6px 0;`;
const SubItem   = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:7px 7px;border-radius:5px;min-height:30px;
  cursor:pointer;font-size:11px;white-space:nowrap;overflow:hidden;
  color:${(p) => p.$active ? "#a8e6f5" : "#777"};
  background:${(p) => p.$active ? "rgba(104,207,238,0.12)" : "transparent"};
  &:hover{background:rgba(104,207,238,0.08);color:#a8e6f5;}
`;
const SlotBadge = styled.span`font-size:10px;font-weight:700;background:rgba(104,207,238,0.3);color:#a8e6f5;padding:1px 6px;border-radius:10px;`;

// Middle panel
const MiddlePanel = styled.div`
  flex:1;display:flex;flex-direction:column;gap:16px;padding:20px 24px;overflow-y:auto;align-items:stretch;
`;
const FieldRow  = styled.div`display:flex;gap:12px;align-items:flex-end;`;
const Field     = styled.div`display:flex;flex-direction:column;gap:6px;flex:1;`;
const FieldLabel= styled.label`font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.4px;`;
const TextInput = styled.input`
  background:rgba(255,255,255,0.04);border:1px solid #ffffff15;border-radius:8px;
  color:#fff;font-size:14px;padding:9px 12px;outline:none;
  &::placeholder{color:#444;} &:focus{border-color:#68cfee;}
`;
const GenderSelect = styled.select`
  background:#1c1c22;border:1px solid #ffffff15;border-radius:8px;
  color:#fff;font-size:14px;padding:9px 12px;outline:none;cursor:pointer;
  &:focus{border-color:#68cfee;}
`;
const AvatarSection = styled.div`display:flex;justify-content:center;`;
const Msg = styled.div`
  font-size:13px;padding:10px 14px;border-radius:8px;
  color:${(p) => p.$error ? "#ff7777" : "#4ade80"};
  background:${(p) => p.$error ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)"};
  border:1px solid ${(p) => p.$error ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"};
`;
const SubmitBtn = styled.button`
  padding:12px;border-radius:10px;
  border:1.5px solid rgba(104,207,238,0.6);
  background:rgba(104,207,238,0.08);
  color:#68cfee;
  font-size:15px;font-weight:700;cursor:pointer;transition:background 0.15s,border-color 0.15s;
  &:hover:not(:disabled){background:rgba(104,207,238,0.15);border-color:#68cfee;}
  &:disabled{opacity:0.35;cursor:not-allowed;}
`;

// Right panel
const RightPanel = styled.div`
  width:290px;flex-shrink:0;border-left:1px solid #ffffff0a;overflow-y:auto;
  padding:16px;display:flex;flex-direction:column;gap:16px;
`;
const VariantBox = styled.div`
  border:1px solid ${(p) => p.$active ? "rgba(104,207,238,0.5)" : "#ffffff10"};
  border-radius:10px;padding:12px;
  background:${(p) => p.$active ? "rgba(104,207,238,0.04)" : "rgba(255,255,255,0.02)"};
  cursor:${(p) => p.$active !== undefined ? "pointer" : "default"};
  transition:border-color 0.15s;
`;
const VariantBoxTitle = styled.div`font-size:12px;font-weight:700;color:#999;text-transform:capitalize;margin-bottom:10px;`;
const VariantGrid = styled.div`display:grid;grid-template-columns:repeat(5,1fr);gap:6px;`;

// Variant slot
const SlotBox = styled.div`
  position:relative;
  aspect-ratio:1;border-radius:7px;cursor:pointer;overflow:hidden;
  border:2px solid ${(p) =>
    p.$filled && p.$active ? "#68cfee" :
    p.$filled              ? "rgba(104,207,238,0.35)" :
    p.$required            ? "rgba(239,68,68,0.35)" :
    "#ffffff15"};
  background:${(p) => p.$filled ? "#111" : "rgba(255,255,255,0.02)"};
  display:flex;align-items:center;justify-content:center;
  transition:border-color 0.15s;
  &:hover{border-color:#68cfee;}
`;
const SlotThumb = styled.img`width:100%;height:100%;object-fit:cover;display:block;`;
const SlotPlaceholder = styled.div`font-size:9px;color:#444;text-align:center;padding:2px;line-height:1.3;`;
const SlotDeleteBtn = styled.button`
  position:absolute;top:2px;right:2px;
  width:16px;height:16px;border-radius:50%;
  background:rgba(0,0,0,0.75);border:none;
  color:#ff7777;font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;line-height:1;padding:0;
  opacity:0;transition:opacity 0.15s;
  ${SlotBox}:hover & { opacity:1; }
`;
