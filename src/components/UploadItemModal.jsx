import { useState, useRef } from "react";
import styled from "styled-components";
import { uploadItem } from "../api/items";

const CATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts", "skirt"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
};

function UploadItemModal({ onClose }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "image/png") {
      setError("Only PNG files are allowed");
      return;
    }
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubcategory("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Name is required");
    if (!category) return setError("Pick a category");
    if (!subcategory) return setError("Pick a subcategory");
    if (!file) return setError("Upload an image");

    setUploading(true);
    setError("");
    try {
      await uploadItem({ file, name: name.trim(), category, subcategory });
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
        <Title>Upload Item</Title>

        <DropZone
          onClick={() => fileRef.current.click()}
          $hasPreview={!!preview}
        >
          {preview ? (
            <PreviewImg src={preview} alt="preview" />
          ) : (
            <DropText>
              <span>+</span>
              <p>Click to upload PNG</p>
            </DropText>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png"
            onChange={handleFile}
            hidden
          />
        </DropZone>

        <Field>
          <Label>Item Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Red Hoodie"
            maxLength={40}
          />
        </Field>

        <Row>
          <Field>
            <Label>Category</Label>
            <Select value={category} onChange={handleCategoryChange}>
              <option value="">Select...</option>
              {Object.keys(CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Subcategory</Label>
            <Select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              disabled={!category}
            >
              <option value="">Select...</option>
              {category &&
                CATEGORIES[category].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </option>
                ))}
            </Select>
          </Field>
        </Row>

        {error && <Error>{error}</Error>}

        <SubmitBtn onClick={handleSubmit} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Item"}
        </SubmitBtn>
      </Modal>
    </Overlay>
  );
}

export default UploadItemModal;

/* ── styled-components ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  background: #1a1a2e;
  border: 1px solid #ffffff22;
  border-radius: 14px;
  padding: 32px;
  width: 420px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  color: #fff;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  &:hover {
    color: #fff;
  }
`;

const Title = styled.h2`
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 700;
`;

const DropZone = styled.div`
  width: 100%;
  height: 180px;
  border: 2px dashed ${(p) => (p.$hasPreview ? "#7b2ff7" : "#ffffff33")};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 20px;
  background: #12121f;
  transition: border-color 0.2s;

  &:hover {
    border-color: #7b2ff7;
  }
`;

const DropText = styled.div`
  text-align: center;
  color: #666;
  span {
    font-size: 36px;
    display: block;
  }
  p {
    margin: 4px 0 0;
    font-size: 13px;
  }
`;

const PreviewImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: #12121f;
  border: 1px solid #ffffff22;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: #7b2ff7;
  }
`;

const Select = styled.select`
  background: #12121f;
  border: 1px solid #ffffff22;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  &:focus {
    border-color: #7b2ff7;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  option {
    background: #1a1a2e;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const Error = styled.div`
  color: #ff6b6b;
  font-size: 13px;
  margin-top: 12px;
`;

const SubmitBtn = styled.button`
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7b2ff7, #c471ed);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(123, 47, 247, 0.4);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(123, 47, 247, 0.6);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
