import { useState, useRef } from "react";
import styled from "styled-components";
import { submitItems } from "../api/items";

const CATEGORIES = {
  tops:        ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms:     ["pants", "skinny", "shorts", "skirt"],
  coats:       ["jackets", "vests", "hoodie"],
  head:        ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair:        ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet:        ["shoes", "boots", "slipOns", "socks"],
  hands:       ["gloves", "handheld"],
};

const MAX_VARIANTS = 10;

const DEFAULT_COLORS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
  "#1abc9c", "#3498db", "#9b59b6", "#e91e63",
  "#ffffff", "#000000",
];

function makeVariant(index) {
  return { id: Date.now() + index, color: DEFAULT_COLORS[index] || "#ffffff", file: null, preview: null };
}

function UploadItemModal({ onClose }) {
  const [name, setName]             = useState("");
  const [category, setCategory]     = useState("");
  const [subcategory, setSubcat]    = useState("");
  const [gender, setGender]         = useState("");
  const [variants, setVariants]     = useState([makeVariant(0)]);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");
  const fileRefs                    = useRef({});

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubcat("");
  };

  const addVariant = () => {
    if (variants.length >= MAX_VARIANTS) return;
    setVariants((v) => [...v, makeVariant(v.length)]);
  };

  const removeVariant = (id) => {
    if (variants.length === 1) return;
    setVariants((v) => v.filter((x) => x.id !== id));
  };

  const updateColor = (id, color) => {
    setVariants((v) => v.map((x) => (x.id === id ? { ...x, color } : x)));
  };

  const handleFile = (id, e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "image/png") { setError("Only PNG files are allowed"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) =>
      setVariants((v) => v.map((x) => (x.id === id ? { ...x, file: f, preview: ev.target.result } : x)));
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!name.trim())   return setError("Name is required");
    if (!category)      return setError("Pick a category");
    if (!subcategory)   return setError("Pick a subcategory");
    if (!gender)        return setError("Select a gender");
    const filledVariants = variants.filter((v) => v.file);
    if (filledVariants.length === 0) return setError("Upload at least one image");

    setUploading(true);
    setError("");
    try {
      await submitItems({ name: name.trim(), category, subcategory, gender, variants: filledVariants });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>&times;</CloseBtn>
        <Title>Submit Item</Title>

        <Field>
          <Label>Item Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Oversized Hoodie"
            maxLength={40}
          />
        </Field>

        <Row>
          <Field>
            <Label>Category</Label>
            <Select value={category} onChange={handleCategoryChange}>
              <option value="">Select…</option>
              {Object.keys(CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Subcategory</Label>
            <Select value={subcategory} onChange={(e) => setSubcat(e.target.value)} disabled={!category}>
              <option value="">Select…</option>
              {category && CATEGORIES[category].map((sub) => (
                <option key={sub} value={sub}>
                  {sub.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
        </Row>

        <Field>
          <Label>Gender</Label>
          <GenderRow>
            <GenderBtn $active={gender === "female"} onClick={() => setGender("female")}>Female</GenderBtn>
            <GenderBtn $active={gender === "male"}   onClick={() => setGender("male")}>Male</GenderBtn>
          </GenderRow>
        </Field>

        <SectionLabel>Color Variants <Hint>({variants.length}/{MAX_VARIANTS})</Hint></SectionLabel>

        <VariantList>
          {variants.map((v, idx) => (
            <VariantRow key={v.id}>
              <VariantNum>{idx + 1}</VariantNum>

              <ColorWrap title="Pick color">
                <ColorDot style={{ background: v.color }} />
                <ColorInput
                  type="color"
                  value={v.color}
                  onChange={(e) => updateColor(v.id, e.target.value)}
                />
              </ColorWrap>

              <DropZone
                $hasFile={!!v.file}
                onClick={() => fileRefs.current[v.id]?.click()}
              >
                {v.preview
                  ? <ThumbImg src={v.preview} alt="preview" />
                  : <DropHint>+ PNG</DropHint>}
                <input
                  type="file"
                  accept="image/png"
                  hidden
                  ref={(el) => { fileRefs.current[v.id] = el; }}
                  onChange={(e) => handleFile(v.id, e)}
                />
              </DropZone>

              {v.file && <FileName>{v.file.name}</FileName>}

              {variants.length > 1 && (
                <RemoveBtn onClick={() => removeVariant(v.id)} title="Remove variant">×</RemoveBtn>
              )}
            </VariantRow>
          ))}
        </VariantList>

        {variants.length < MAX_VARIANTS && (
          <AddBtn onClick={addVariant}>+ Add Color Variant</AddBtn>
        )}

        {error && <Error>{error}</Error>}

        <SubmitBtn onClick={handleSubmit} disabled={uploading}>
          {uploading ? "Submitting…" : "Submit for Review"}
        </SubmitBtn>
      </Modal>
    </Overlay>
  );
}

export default UploadItemModal;

/* ── styles ── */

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  background: #1a1a2e;
  border: 1px solid #ffffff22;
  border-radius: 14px;
  padding: 28px 28px 24px;
  width: 480px; max-width: 95vw; max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  color: #fff;
`;

const CloseBtn = styled.button`
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; color: #888; font-size: 24px; cursor: pointer;
  &:hover { color: #fff; }
`;

const Title = styled.h2`margin: 0 0 18px; font-size: 20px; font-weight: 700;`;

const Field = styled.div`display: flex; flex-direction: column; gap: 5px; flex: 1;`;

const Label = styled.label`
  font-size: 11px; font-weight: 600; color: #aaa;
  text-transform: uppercase; letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: #12121f; border: 1px solid #ffffff22; border-radius: 8px;
  padding: 9px 12px; color: #fff; font-size: 14px; outline: none;
  margin-bottom: 12px;
  &:focus { border-color: #7b2ff7; }
`;

const Select = styled.select`
  background: #12121f; border: 1px solid #ffffff22; border-radius: 8px;
  padding: 9px 12px; color: #fff; font-size: 14px; outline: none; cursor: pointer;
  &:focus { border-color: #7b2ff7; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  option { background: #1a1a2e; }
`;

const Row = styled.div`display: flex; gap: 12px;`;

const SectionLabel = styled.div`
  font-size: 12px; font-weight: 600; color: #aaa;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin: 16px 0 10px;
`;

const Hint = styled.span`font-weight: 400; color: #555;`;

const VariantList = styled.div`display: flex; flex-direction: column; gap: 8px;`;

const VariantRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  background: #12121f; border: 1px solid #ffffff10; border-radius: 10px;
  padding: 8px 10px;
`;

const VariantNum = styled.span`
  font-size: 11px; color: #555; font-weight: 700; min-width: 14px; text-align: center;
`;

const ColorWrap = styled.div`position: relative; width: 28px; height: 28px; flex-shrink: 0; cursor: pointer;`;

const ColorDot = styled.div`
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid #ffffff33;
  pointer-events: none;
`;

const ColorInput = styled.input`
  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
`;

const DropZone = styled.div`
  width: 52px; height: 52px; flex-shrink: 0;
  border: 2px dashed ${(p) => (p.$hasFile ? "#7b2ff7" : "#ffffff22")};
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden;
  &:hover { border-color: #7b2ff7; }
`;

const ThumbImg = styled.img`width: 100%; height: 100%; object-fit: contain;`;

const DropHint = styled.span`font-size: 11px; color: #555; user-select: none;`;

const FileName = styled.span`
  font-size: 11px; color: #666; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const RemoveBtn = styled.button`
  background: none; border: none; color: #666; font-size: 18px; cursor: pointer;
  padding: 0 4px; line-height: 1; flex-shrink: 0;
  &:hover { color: #ff6b6b; }
`;

const AddBtn = styled.button`
  margin-top: 10px; width: 100%; padding: 9px;
  border: 1px dashed #ffffff22; border-radius: 8px;
  background: transparent; color: #777; font-size: 13px; cursor: pointer;
  &:hover { border-color: #7b2ff7; color: #c4a1ff; }
`;

const Error = styled.div`color: #ff6b6b; font-size: 13px; margin-top: 10px;`;

const GenderRow = styled.div`display: flex; gap: 8px; margin-bottom: 12px;`;

const GenderBtn = styled.button`
  flex: 1; padding: 9px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: 1px solid ${(p) => p.$active ? "rgba(123,47,247,0.8)" : "#ffffff22"};
  background: ${(p) => p.$active ? "rgba(123,47,247,0.35)" : "transparent"};
  color: ${(p) => p.$active ? "#c4a1ff" : "#666"};
  transition: all 0.15s;
  &:hover { border-color: #7b2ff7; color: #c4a1ff; }
`;

const SubmitBtn = styled.button`
  width: 100%; margin-top: 16px; padding: 12px;
  border: none; border-radius: 8px;
  background: linear-gradient(135deg, #7b2ff7, #c471ed);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 14px rgba(123,47,247,0.4);
  transition: all 0.2s;
  &:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 6px 20px rgba(123,47,247,0.6); }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
