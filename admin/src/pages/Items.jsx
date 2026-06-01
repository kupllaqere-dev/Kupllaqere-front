import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { getItems, createItem, updateItemGroup, deleteItem, deleteItemGroup } from "../api/admin";
import styled from "styled-components";

const CATEGORY_SUBCATEGORIES = {
  tops:        ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms:     ["pants", "skinny", "shorts", "skirt"],
  onePiece:    ["overall", "dress"],
  coats:       ["jackets", "vests", "hoodie"],
  head:        ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair:        ["short", "medium", "long"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet:        ["shoes", "boots", "slipOns", "socks"],
  hands:       ["gloves", "handheld"],
  appearance:  ["eyes", "eyebrows", "nose", "mouth", "beard"],
  tattoos:     ["back", "chest", "arms", "legs"],
};
const CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES);
const LIMIT = 20;

const RARITY_LABELS = { nonRare: "Common", rare: "Rare", superRare: "Super Rare" };
const RARITY_COLORS = {
  nonRare:   { bg: "rgba(100,100,120,0.25)", border: "rgba(140,140,160,0.4)",  color: "#aaa" },
  rare:      { bg: "rgba(40,90,255,0.2)",    border: "rgba(60,120,255,0.5)",   color: "#7ab4ff" },
  superRare: { bg: "rgba(255,160,0,0.2)",    border: "rgba(255,180,0,0.55)",   color: "#ffc940" },
};

export default function Items() {
  const [data, setData]           = useState({ groups: [], total: 0 });
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [creating, setCreating]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [expandedKey, setExpanded] = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [busy, setBusy]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getItems({ search, category, page, limit: LIMIT });
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, category, page]);

  useEffect(() => { load(); }, [load]);

  const removeGroup = async (group) => {
    setBusy(true);
    try {
      await deleteItemGroup(group.name, group.category);
      setConfirm(null); setExpanded(null); await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const removeVariant = async (id) => {
    setBusy(true);
    try {
      await deleteItem(id);
      setConfirm(null); await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <Page>
      <Header>
        <PageTitle>Items <Count>({data.total.toLocaleString()} groups)</Count></PageTitle>
        <Filters>
          <SearchInput
            placeholder="Search by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <FilterSelect value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
          <CreateBtn onClick={() => setCreating(true)}>+ New Item</CreateBtn>
        </Filters>
      </Header>

      {error && <ErrMsg>{error}</ErrMsg>}

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Preview</Th>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Rarity</Th>
              <Th>Store</Th>
              <Th>Price</Th>
              <Th>Variants</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8}><Center>Loading…</Center></td></tr>}
            {!loading && (data.groups || []).length === 0 && (
              <tr><td colSpan={8}><Center>No items found.</Center></td></tr>
            )}
            {(data.groups || []).map((group) => {
              const key      = `${group.name}__${group.category}`;
              const expanded = expandedKey === key;
              const first    = group.variants?.[0];
              return (
                <Fragment key={key}>
                  <GroupRow onClick={() => setExpanded(expanded ? null : key)}>
                    <Td>
                      <ItemImg src={first?.thumbnailUrl || first?.imageUrl} alt={group.name} />
                    </Td>
                    <Td><strong>{group.name}</strong></Td>
                    <Td><Gray>{group.category} / {group.subcategory}</Gray></Td>
                    <Td>
                      {group.rarity
                        ? <RarityBadge $rarity={group.rarity}>{RARITY_LABELS[group.rarity] || group.rarity}</RarityBadge>
                        : <Gray>—</Gray>}
                    </Td>
                    <Td>{group.storeType ? <StoreBadge>{group.storeType}</StoreBadge> : <Gray>—</Gray>}</Td>
                    <Td>
                      <PriceCell>
                        {group.coinPrice !== null
                          ? <PricePill $type="coin">🪙 {group.coinPrice}</PricePill>
                          : <Gray>—</Gray>}
                        {group.gemPrice !== null
                          && <PricePill $type="gem">💎 {group.gemPrice}</PricePill>}
                      </PriceCell>
                    </Td>
                    <Td><Gray>{group.variants?.length ?? 0}</Gray></Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <Actions>
                        <Btn onClick={() => setEditing(group)}>Edit</Btn>
                        <Btn $danger onClick={() => setConfirm({ type: "group", group })}>Delete</Btn>
                      </Actions>
                    </Td>
                  </GroupRow>

                  {expanded && (
                    <tr>
                      <VariantsTd colSpan={8}>
                        <VariantsLabel>Variants ({group.variants?.length})</VariantsLabel>
                        <VariantsRow>
                          {(group.variants || []).map((v) => (
                            <VariantCard key={v.id || String(v._id)}>
                              <VariantImg src={v.thumbnailUrl || v.imageUrl} alt={group.name} />
                              <VariantMeta>{v.subcategory}{v.gender ? ` · ${v.gender}` : ""}</VariantMeta>
                              <Btn
                                $danger
                                style={{ fontSize: 11, padding: "3px 8px", marginTop: 4 }}
                                onClick={() => setConfirm({ type: "variant", id: v.id || String(v._id) })}
                              >
                                Delete
                              </Btn>
                            </VariantCard>
                          ))}
                        </VariantsRow>
                      </VariantsTd>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>

      <Pagination>
        <PgBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</PgBtn>
        <PgInfo>Page {page} / {totalPages}</PgInfo>
        <PgBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PgBtn>
      </Pagination>

      {creating && (
        <Modal onClick={() => setCreating(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Create New Item</ModalTitle>
            <CreateForm busy={busy} setBusy={setBusy} onDone={() => { setCreating(false); load(); }} onClose={() => setCreating(false)} />
          </ModalCard>
        </Modal>
      )}

      {editing && (
        <Modal onClick={() => setEditing(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Edit "{editing.name}"</ModalTitle>
            <EditGroupForm
              group={editing}
              busy={busy}
              onSave={async (update) => {
                setBusy(true);
                try { await updateItemGroup(editing.name, editing.category, update); setEditing(null); load(); }
                catch (e) { alert(e.message); }
                finally { setBusy(false); }
              }}
              onClose={() => setEditing(null)}
            />
          </ModalCard>
        </Modal>
      )}

      {confirm && (
        <Modal onClick={() => setConfirm(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {confirm.type === "group"
                ? `Delete all variants of "${confirm.group.name}"?`
                : "Delete this variant?"}
            </ModalTitle>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 20px" }}>
              {confirm.type === "group"
                ? `This will permanently delete all ${confirm.group.variants?.length} variant(s) and their S3 files.`
                : "This will permanently remove this variant and its S3 files."}
            </p>
            <Actions>
              <Btn onClick={() => setConfirm(null)}>Cancel</Btn>
              <Btn $danger disabled={busy} onClick={() => {
                if (confirm.type === "group") removeGroup(confirm.group);
                else removeVariant(confirm.id);
              }}>
                {busy ? "Deleting…" : "Delete"}
              </Btn>
            </Actions>
          </ModalCard>
        </Modal>
      )}
    </Page>
  );
}

/* ── Create Form (unchanged) ── */
function CreateForm({ busy, setBusy, onDone, onClose }) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategory, setSub]   = useState(CATEGORY_SUBCATEGORIES[CATEGORIES[0]][0]);
  const [rarity, setRarity]     = useState("");
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const fileRef = useRef();

  const subs = CATEGORY_SUBCATEGORIES[category] || [];

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!name.trim() || !file) return alert("Name and image required.");
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("category", category);
    fd.append("subcategory", subcategory);
    if (rarity) fd.append("rarity", rarity);
    fd.append("image", file);
    setBusy(true);
    try { await createItem(fd); onDone(); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <FieldRow>
        <FieldLabel>Name</FieldLabel>
        <FieldInput value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Item name" />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Category</FieldLabel>
        <FieldSelect value={category} onChange={(e) => { setCategory(e.target.value); setSub(CATEGORY_SUBCATEGORIES[e.target.value][0]); }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </FieldSelect>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Subcategory</FieldLabel>
        <FieldSelect value={subcategory} onChange={(e) => setSub(e.target.value)}>
          {subs.map((s) => <option key={s} value={s}>{s}</option>)}
        </FieldSelect>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Rarity</FieldLabel>
        <FieldSelect value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">No rarity</option>
          <option value="nonRare">Common</option>
          <option value="rare">Rare</option>
          <option value="superRare">Super Rare</option>
        </FieldSelect>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Image (PNG)</FieldLabel>
        <input ref={fileRef} type="file" accept="image/png" onChange={pickFile} style={{ color: "#aaa", fontSize: 13 }} />
        {preview && <img src={preview} alt="preview" style={{ marginTop: 8, width: 80, height: 80, objectFit: "contain", background: "#111", borderRadius: 8 }} />}
      </FieldRow>
      <Actions style={{ marginTop: 20 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn $primary disabled={busy} onClick={submit}>{busy ? "Uploading…" : "Create"}</Btn>
      </Actions>
    </>
  );
}

/* ── Edit Group Form ── */
function EditGroupForm({ group, busy, onSave, onClose }) {
  const [name, setName]                 = useState(group.name);
  const [rarity, setRarity]             = useState(group.rarity || "");
  const [storeType, setStoreType]       = useState(group.storeType || "");
  const [levelRequirement, setLevelReq] = useState(group.levelRequirement ?? "");
  const [notes, setNotes]               = useState(group.notes || "");
  const [coinPrice, setCoinPrice]       = useState(group.coinPrice ?? "");
  const [gemPrice, setGemPrice]         = useState(group.gemPrice ?? "");

  return (
    <>
      <FieldRow>
        <FieldLabel>Name</FieldLabel>
        <FieldInput value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Rarity</FieldLabel>
        <FieldSelect value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">No rarity</option>
          <option value="nonRare">Common</option>
          <option value="rare">Rare</option>
          <option value="superRare">Super Rare</option>
        </FieldSelect>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Store Type</FieldLabel>
        <FieldSelect value={storeType} onChange={(e) => setStoreType(e.target.value)}>
          <option value="">Not in store</option>
          <option value="normal">Normal Store</option>
        </FieldSelect>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Level Requirement</FieldLabel>
        <FieldInput
          type="number" min="1" max="999"
          value={levelRequirement}
          onChange={(e) => setLevelReq(e.target.value)}
          placeholder="No requirement"
        />
      </FieldRow>
      <PriceRow>
        <FieldRow style={{ flex: 1 }}>
          <FieldLabel>Coin Price (Nectar)</FieldLabel>
          <FieldInput
            type="number" min="0"
            value={coinPrice}
            onChange={(e) => setCoinPrice(e.target.value)}
            placeholder="No coin price"
          />
        </FieldRow>
        <FieldRow style={{ flex: 1 }}>
          <FieldLabel>Gem Price (Lis)</FieldLabel>
          <FieldInput
            type="number" min="0"
            value={gemPrice}
            onChange={(e) => setGemPrice(e.target.value)}
            placeholder="No gem price"
          />
        </FieldRow>
      </PriceRow>
      <FieldRow>
        <FieldLabel>Notes</FieldLabel>
        <FieldTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder="Optional store notes shown to players…"
          rows={3}
        />
      </FieldRow>
      <GroupNote>Changes apply to all {group.variants?.length} variant(s) in this group.</GroupNote>
      <Actions style={{ marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn $primary disabled={busy} onClick={() => onSave({
          newName:          name,
          rarity:           rarity || null,
          storeType:        storeType || null,
          levelRequirement: levelRequirement !== "" ? Number(levelRequirement) : null,
          notes,
          coinPrice:        coinPrice !== "" ? Number(coinPrice) : null,
          gemPrice:         gemPrice  !== "" ? Number(gemPrice)  : null,
        })}>
          {busy ? "Saving…" : "Save All Variants"}
        </Btn>
      </Actions>
    </>
  );
}

/* ── Styles ── */
const Page = styled.div``;
const Header = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;`;
const PageTitle = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;flex-shrink:0;`;
const Count = styled.span`font-size:16px;font-weight:400;color:#666;`;
const Filters = styled.div`display:flex;gap:10px;margin-left:auto;flex-wrap:wrap;align-items:center;`;
const SearchInput = styled.input`
  padding:8px 12px;border-radius:8px;border:1px solid #ffffff18;
  background:rgba(255,255,255,0.04);color:#fff;font-size:13px;width:200px;outline:none;
  &:focus{border-color:#7b2ff7;}&::placeholder{color:#444;}
`;
const FilterSelect = styled.select`
  padding:8px 10px;border-radius:8px;border:1px solid #ffffff18;
  background:#1c1c22;color:#fff;font-size:13px;outline:none;
  &:focus{border-color:#7b2ff7;}
`;
const CreateBtn = styled.button`
  padding:8px 16px;border-radius:8px;border:1px solid rgba(123,47,247,0.6);
  background:rgba(123,47,247,0.3);color:#c4a1ff;font-size:13px;font-weight:600;cursor:pointer;
  &:hover{background:rgba(123,47,247,0.5);}
`;
const ErrMsg = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const TableWrap = styled.div`overflow-x:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;font-size:13px;`;
const Th = styled.th`text-align:left;padding:10px 12px;border-bottom:1px solid #ffffff12;color:#666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;`;
const Td = styled.td`padding:10px 12px;border-bottom:1px solid #ffffff08;color:#ccc;vertical-align:middle;`;
const GroupRow = styled.tr`cursor:pointer;&:hover td{background:rgba(123,47,247,0.06);}`;
const ItemImg = styled.img`width:48px;height:48px;object-fit:contain;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const Gray = styled.span`color:#555;`;
const Actions = styled.div`display:flex;gap:6px;flex-wrap:wrap;`;
const Btn = styled.button`
  padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p)=>p.$danger?"rgba(255,80,80,0.4)":p.$primary?"rgba(123,47,247,0.8)":"#ffffff18"};
  background:${(p)=>p.$danger?"rgba(255,80,80,0.12)":p.$primary?"rgba(123,47,247,0.6)":"transparent"};
  color:${(p)=>p.$danger?"#ff8a8a":p.$primary?"#fff":"#ccc"};
  &:disabled{opacity:0.4;cursor:not-allowed;}&:hover:not(:disabled){opacity:0.8;}
`;
const PriceCell = styled.div`display:flex;gap:6px;flex-wrap:wrap;align-items:center;`;
const PricePill = styled.span`
  font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;
  background:${(p)=>p.$type==="coin"?"rgba(180,83,9,0.18)":"rgba(14,116,144,0.18)"};
  border:1px solid ${(p)=>p.$type==="coin"?"rgba(180,83,9,0.4)":"rgba(14,116,144,0.4)"};
  color:${(p)=>p.$type==="coin"?"#d97706":"#0e7490"};
`;
const VariantsTd = styled.td`padding:10px 16px 14px;border-bottom:1px solid #ffffff08;background:rgba(123,47,247,0.04);`;
const VariantsLabel = styled.div`font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:10px;`;
const VariantsRow = styled.div`display:flex;flex-wrap:wrap;gap:10px;`;
const VariantCard = styled.div`
  display:flex;flex-direction:column;align-items:center;gap:4px;
  background:#1c1c22;border:1px solid #ffffff10;border-radius:8px;
  padding:8px;
`;
const VariantImg = styled.img`width:56px;height:56px;object-fit:contain;background:#111;border-radius:5px;`;
const VariantMeta = styled.div`font-size:10px;color:#555;text-align:center;`;
const Center = styled.div`text-align:center;padding:30px;color:#555;`;
const Pagination = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn = styled.button`
  padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;
  background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:disabled{opacity:0.3;cursor:not-allowed;}&:hover:not(:disabled){background:rgba(255,255,255,0.06);}
`;
const PgInfo = styled.span`font-size:13px;color:#666;`;
const Modal = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;
const ModalCard = styled.div`background:#1c1c22;border:1px solid #ffffff18;border-radius:14px;padding:28px;width:460px;max-height:90vh;overflow-y:auto;`;
const ModalTitle = styled.h3`color:#fff;font-size:17px;margin:0 0 16px;`;
const FieldRow = styled.div`display:flex;flex-direction:column;gap:4px;margin-bottom:12px;`;
const PriceRow = styled.div`display:flex;gap:12px;margin-bottom:0;`;
const FieldLabel = styled.label`font-size:11px;font-weight:600;color:#777;text-transform:uppercase;letter-spacing:0.4px;`;
const FieldInput = styled.input`
  padding:8px 10px;border-radius:7px;border:1px solid #ffffff18;
  background:rgba(255,255,255,0.04);color:#fff;font-size:13px;outline:none;
  &:focus{border-color:#7b2ff7;}
`;
const FieldSelect = styled.select`
  padding:8px 10px;border-radius:7px;border:1px solid #ffffff18;
  background:#1c1c22;color:#fff;font-size:13px;outline:none;
  &:focus{border-color:#7b2ff7;}
`;
const FieldTextarea = styled.textarea`
  padding:8px 10px;border-radius:7px;border:1px solid #ffffff18;
  background:rgba(255,255,255,0.04);color:#fff;font-size:13px;outline:none;
  resize:vertical;font-family:inherit;
  &:focus{border-color:#7b2ff7;}
`;
const GroupNote = styled.div`font-size:11px;color:#555;margin-top:4px;`;
const StoreBadge = styled.span`
  background:rgba(123,47,247,0.25);border:1px solid rgba(123,47,247,0.5);
  color:#c4a1ff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;text-transform:capitalize;
`;
const RarityBadge = styled.span`
  font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;
  text-transform:uppercase;letter-spacing:0.4px;
  background:${(p)=>RARITY_COLORS[p.$rarity]?.bg||"transparent"};
  border:1px solid ${(p)=>RARITY_COLORS[p.$rarity]?.border||"transparent"};
  color:${(p)=>RARITY_COLORS[p.$rarity]?.color||"#aaa"};
`;
