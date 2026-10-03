import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import RigStage from "../components/RigStage";
import { getSharedRig } from "@avatar/RigView.js";
import { rawPiece, renderTemplate, bodyPartRects } from "@avatar/CanvasRig.js";
import { getItemTypes, submitItems } from "../api/creator";
import { inspectFile, checkItem, layerOf, labelOf, expectedFileName, NAME_EXAMPLE } from "../lib/partFiles";
import { categoryLabel, subcategoryLabel, typeLabel } from "../lib/labels";

// Collects every file in a drop, walking into dropped folders.
async function filesFromDrop(dataTransfer) {
  const entries = [...(dataTransfer.items || [])].map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
  if (!entries.length) return [...dataTransfer.files];
  const out = [];
  async function walk(entry) {
    if (entry.name.startsWith(".")) return;
    if (entry.isFile) {
      out.push(await new Promise((resolve, reject) => entry.file(resolve, reject)));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let batch;
      do {
        batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        for (const e of batch) await walk(e);
      } while (batch.length);
    }
  }
  for (const e of entries) await walk(e);
  return out;
}

// Each item is its own drop zone: whatever is dropped on it becomes its
// pieces, one per body part, regardless of the name in the file.
let nextItemId = 1;
// `hidden` only takes an item off the preview avatar — it is still submitted.
const newItem = () => ({ id: nextItemId++, name: "", category: null, subcategory: null, files: [], hidden: false });

// Submitting is switched off for now — flip back to true to re-enable it.
const SUBMIT_ENABLED = false;

function itemStatus(it) {
  if (!it.files.length) return "Empty";
  if (!it.check.rule) return "Needs type";
  if (!it.name.trim()) return "Needs name";
  return "Ready";
}

async function downloadTemplate() {
  const rig = await getSharedRig();
  const canvas = renderTemplate(rig);
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "neclis_body_template_600x900.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
}

export default function Create() {
  const [types, setTypes]         = useState(null);
  const [typesError, setTypesError] = useState(null);
  const [bodyRects, setBodyRects] = useState(null);

  const [rawItems, setRawItems]   = useState(() => [newItem()]);
  const [rejected, setRejected]   = useState([]); // uploads with an error
  const [selected, setSelected]   = useState(null);
  const [overId, setOverId]       = useState(null); // item being dragged over
  const [gender, setGender]       = useState("female");
  const [asSet, setAsSet]         = useState(true);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  useEffect(() => {
    getItemTypes().then(setTypes).catch((e) => setTypesError(e.message));
    getSharedRig().then((rig) => setBodyRects(bodyPartRects(rig))).catch(() => {});
  }, []);

  // ── items, with their pieces in body order and where they stand ──
  const items = useMemo(() => {
    if (!types) return [];
    const order = types.bodyParts.map((p) => p.name);
    return rawItems.map((it) => {
      const files = [...it.files].sort((a, b) => order.indexOf(a.part) - order.indexOf(b.part));
      const parts = files.map((f) => f.part);
      const check = checkItem(parts, it.category, it.subcategory, types);
      return { ...it, files, parts, check, complete: check.complete && !!it.name.trim() };
    });
  }, [rawItems, types]);

  const current = items.find((it) => it.id === selected) || items[0] || null;

  // Every uploaded piece goes on the avatar straight away, unless its item is
  // hidden — handy for comparing two shirts one at a time.
  const garments = useMemo(() => items
    .filter((it) => !it.hidden)
    .flatMap((it) => it.files.map((f) => ({
      part:  f.part,
      layer: layerOf(it.category, it.subcategory, types),
      piece: rawPiece(f.image),
    }))), [items, types]);

  const updateItem = (id, fn) => setRawItems((prev) => prev.map((it) => (it.id === id ? fn(it) : it)));

  // ── adding / removing ──
  const addFiles = useCallback(async (itemId, list) => {
    if (!types || !list.length) return;
    setError(null); setSuccess(null);
    const inspected = await Promise.all([...list].map((f) => inspectFile(f, types, bodyRects)));
    const good = inspected.filter((e) => !e.error);
    const bad  = inspected.filter((e) => e.error);

    if (good.length) {
      setRawItems((prev) => prev.map((it) => {
        if (it.id !== itemId) return it;
        // A piece for a part the item already has replaces it — and so does a
        // later file for the same part within this drop.
        const incoming = new Map(good.map((g) => [g.part, g]));
        const replaced = it.files.filter((f) => incoming.has(f.part));
        replaced.forEach((f) => URL.revokeObjectURL(f.url));
        good.filter((g) => incoming.get(g.part) !== g).forEach((g) => URL.revokeObjectURL(g.url));
        return {
          ...it,
          name:  it.name || good[0].itemName,
          files: [...it.files.filter((f) => !incoming.has(f.part)), ...incoming.values()],
        };
      }));
      setSelected(itemId);
    }
    if (bad.length) setRejected((prev) => [...bad, ...prev].slice(0, 40));
  }, [types, bodyRects]);

  const removeFile = (itemId, fileId) => updateItem(itemId, (it) => {
    const f = it.files.find((p) => p.id === fileId);
    if (f) URL.revokeObjectURL(f.url);
    return { ...it, files: it.files.filter((p) => p.id !== fileId) };
  });

  const addItem = () => {
    const it = newItem();
    setRawItems((prev) => [...prev, it]);
    setSelected(it.id);
  };

  const removeItem = (id) => {
    setRawItems((prev) => {
      prev.find((it) => it.id === id)?.files.forEach((f) => URL.revokeObjectURL(f.url));
      const rest = prev.filter((it) => it.id !== id);
      return rest.length ? rest : [newItem()];
    });
    if (selected === id) setSelected(null);
  };

  const clearAll = () => {
    rawItems.forEach((it) => it.files.forEach((f) => URL.revokeObjectURL(f.url)));
    setRawItems([newItem()]); setRejected([]); setSelected(null);
  };

  const dropOn = (itemId) => async (e) => {
    e.preventDefault();
    setOverId(null);
    addFiles(itemId, await filesFromDrop(e.dataTransfer));
  };

  // ── submit ──
  const filled     = items.filter((it) => it.files.length);
  const incomplete = filled.filter((it) => !it.complete);
  const canSubmit  = SUBMIT_ENABLED && filled.length > 0 && !incomplete.length && !busy;
  const maxItems   = types?.maxItemsPerSubmit ?? 10;

  const submit = async () => {
    setError(null); setSuccess(null);
    if (filled.length > maxItems) return setError(`At most ${maxItems} items per submission.`);
    if (incomplete.length) return setError(`${incomplete[0].name || "An item"} isn't finished yet.`);

    // Files go up in one flat list; each item names its own by position.
    const fd = new FormData();
    let index = 0;
    const manifestItems = filled.map((it) => ({
      name:        it.name.trim(),
      category:    it.category,
      subcategory: it.subcategory,
      files:       it.files.map((f) => { fd.append("files", f.file, f.fileName); return index++; }),
    }));
    fd.append("manifest", JSON.stringify({ gender, asSet: asSet && filled.length > 1, items: manifestItems }));

    setBusy(true);
    try {
      const res = await submitItems(fd);
      const n = res.submissions.length;
      setSuccess(`${n === 1 ? `"${res.submissions[0].name}"` : `${n} items`} submitted${res.setCode ? " as a set" : ""}. The atlas is being packed now.`);
      clearAll();
    } catch (e) {
      setError(e.details?.length > 1 ? `${e.message} (+${e.details.length - 1} more)` : e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── stage notice ──
  let overlay = null;
  if (!filled.length) overlay = "Drop body-part PNGs on an item to try them on the avatar.";

  if (typesError) {
    return <Page><Fatal>Couldn't load item types: {typesError}</Fatal></Page>;
  }

  return (
    <Page>
      <TopBar>
        <div>
          <Title>New upload</Title>
          <Sub>One 600×900 PNG per body part, named <Mono>Name-body_part.png</Mono></Sub>
        </div>
        <TopActions>
          <GenderSelect value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </GenderSelect>
          {filled.length > 1 && (
            <Check>
              <input type="checkbox" checked={asSet} onChange={(e) => setAsSet(e.target.checked)} />
              Submit as a set
            </Check>
          )}
          <SubmitBtn onClick={submit} disabled={!canSubmit} title={SUBMIT_ENABLED ? undefined : "Submitting is turned off for now"}>
            {busy ? "Uploading…" : filled.length > 1 ? `Submit ${filled.length} items` : "Submit item"}
          </SubmitBtn>
        </TopActions>
      </TopBar>

      {(error || success) && (
        <Banner $error={!!error}>
          {error || <>{success} <Link to="/submissions">View submissions →</Link></>}
          <BannerClose onClick={() => { setError(null); setSuccess(null); }}>✕</BannerClose>
        </Banner>
      )}

      <Cols>
        {/* ── Left: items, each one a drop zone ── */}
        <Left>
          <SectionHead>
            <span>Items <Dim>({items.length})</Dim></span>
            {filled.length > 0 && <LinkBtn onClick={clearAll}>Clear all</LinkBtn>}
          </SectionHead>

          <ItemList>
            {items.map((it, i) => (
              <ItemZone
                key={it.id}
                item={it}
                index={i}
                types={types}
                active={current?.id === it.id}
                over={overId === it.id}
                onSelect={() => setSelected(it.id)}
                onDragOver={(e) => { e.preventDefault(); if (overId !== it.id) setOverId(it.id); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverId(null); }}
                onDrop={dropOn(it.id)}
                onAddFiles={(list) => addFiles(it.id, list)}
                onRemoveFile={(fileId) => removeFile(it.id, fileId)}
                onToggleHidden={() => updateItem(it.id, (x) => ({ ...x, hidden: !x.hidden }))}
              />
            ))}
          </ItemList>

          <AddItemBtn onClick={addItem} disabled={!types}>+ Add item</AddItemBtn>

          {rejected.length > 0 && (
            <>
              <SectionHead>
                <span>Not accepted <Dim>({rejected.length})</Dim></span>
                <LinkBtn onClick={() => setRejected([])}>Dismiss</LinkBtn>
              </SectionHead>
              <RejectList>
                {rejected.map((r) => (
                  <RejectRow key={r.id}>
                    <Mono>{r.fileName}</Mono>
                    <span>{r.error}</span>
                  </RejectRow>
                ))}
              </RejectList>
            </>
          )}

          <Guide>
            <summary>Naming & canvas rules</summary>
            <GuideBody>
              <p>Paint each piece on the <b>600×900</b> body template, in place, on a transparent background — one PNG per body part the item covers.</p>
              <p>Name it <Mono>Name-body_part.png</Mono>: the name first, a hyphen, then the body part with underscores:</p>
              <Example>{NAME_EXAMPLE}</Example>
              <p>Body parts:</p>
              <Tokens>
                {types?.bodyParts.map((p) => <Token key={p.name}>{p.token}</Token>)}
              </Tokens>
              <p>Drop an item's pieces onto that item — add as many as it needs. Use <b>+ Add item</b> for the next one. Each piece shows on the avatar as soon as it's added.</p>
              <TemplateBtn onClick={downloadTemplate}>Download body template</TemplateBtn>
            </GuideBody>
          </Guide>
        </Left>

        {/* ── Middle: the avatar ── */}
        <Middle>
          <RigStage garments={garments} overlay={overlay} />
        </Middle>

        {/* ── Right: the selected item ── */}
        <Right>
          {!current || !types ? (
            <Empty style={{ padding: "8px 0" }}>Select an item to edit it.</Empty>
          ) : (
            <ItemDetail
              key={current.id}
              item={current}
              index={items.indexOf(current)}
              types={types}
              onMeta={(patch) => updateItem(current.id, (it) => ({ ...it, ...patch }))}
              onAddFiles={(list) => addFiles(current.id, list)}
              onRemoveFile={(fileId) => removeFile(current.id, fileId)}
              onRemoveItem={() => removeItem(current.id)}
            />
          )}
        </Right>
      </Cols>
    </Page>
  );
}

// ── One item on the left: its pieces, and a place to drop more ─────────────
function ItemZone({ item, index, types, active, over, onSelect, onDragOver, onDragLeave, onDrop, onAddFiles, onRemoveFile, onToggleHidden }) {
  const inputRef = useRef(null);
  return (
    <Zone $active={active} $over={over} onClick={onSelect} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <ZoneHead>
        <ItemText>
          <ItemName>{item.name || <Dim>Item {index + 1}</Dim>}</ItemName>
          <ItemType>
            {item.category ? typeLabel(item.category, item.subcategory) : "No category yet"}
            {item.hidden && <Dim> · hidden</Dim>}
          </ItemType>
        </ItemText>
        <Chip $ok={item.complete}>{itemStatus(item)}</Chip>
        {item.files.length > 0 && (
          <EyeBtn
            $off={item.hidden}
            onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
            title={item.hidden ? "Show on the avatar" : "Hide from the avatar"}
            aria-label={item.hidden ? "Show on the avatar" : "Hide from the avatar"}
          >
            {item.hidden ? <EyeOffIcon /> : <EyeIcon />}
          </EyeBtn>
        )}
      </ZoneHead>

      {item.files.length > 0 && (
        <Pieces $hidden={item.hidden}>
          {item.files.map((f) => (
            <Piece key={f.id} title={f.fileName}>
              <PieceThumb>{f.thumb && <img src={f.thumb} alt="" />}</PieceThumb>
              <PieceLabel>{labelOf(f.part)}</PieceLabel>
              <PieceRemove
                onClick={(e) => { e.stopPropagation(); onRemoveFile(f.id); }}
                title="Remove piece"
              >✕</PieceRemove>
            </Piece>
          ))}
        </Pieces>
      )}

      <DropStrip
        $over={over}
        onClick={(e) => { e.stopPropagation(); onSelect(); inputRef.current?.click(); }}
      >
        {!types ? "Loading…" : over ? "Drop to add to this item"
          : item.files.length ? "+ Drop more pieces or browse" : "Drop PNGs or a folder here, or browse"}
      </DropStrip>
      <input
        ref={inputRef}
        type="file"
        accept=".png,image/png"
        multiple
        hidden
        onChange={(e) => { onAddFiles([...e.target.files]); e.target.value = ""; }}
      />
    </Zone>
  );
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── Selected item ────────────────────────────────────────────────────────────
function ItemDetail({ item, index, types, onMeta, onAddFiles, onRemoveFile, onRemoveItem }) {
  const inputRef = useRef(null);
  const { rule, suggested } = item.check;
  const byPart = new Map(item.files.map((f) => [f.part, f]));

  // Rows: what's uploaded, then the parts this category usually also covers.
  const rows = [
    ...item.files.map((f) => ({ part: f.part, kind: "uploaded" })),
    ...suggested.map((p) => ({ part: p, kind: "suggested" })),
  ];

  return (
    <>
      <Field>
        <Label>Item name</Label>
        <Input
          value={item.name}
          placeholder={`Item ${index + 1}`}
          maxLength={types.maxNameLength}
          onChange={(e) => onMeta({ name: e.target.value })}
        />
      </Field>

      <Field>
        <Label>Category</Label>
        <Select
          value={item.category || ""}
          onChange={(e) => onMeta({ category: e.target.value || null, subcategory: null })}
        >
          <option value="">Choose a category…</option>
          {Object.keys(types.categories).map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </Select>
        {item.category && (
          <Pills>
            {types.categories[item.category].map((s) => (
              <Pill key={s} $on={item.subcategory === s} onClick={() => onMeta({ subcategory: s })}>
                {subcategoryLabel(s)}
              </Pill>
            ))}
          </Pills>
        )}
        {!item.category && <Hint $warn>Pick a category before submitting.</Hint>}
        {item.category && !item.subcategory && <Hint $warn>Pick a type within {categoryLabel(item.category)}.</Hint>}
      </Field>

      <Field>
        <PartsHead>
          <Label>Pieces</Label>
          <LinkBtn onClick={() => inputRef.current?.click()}>+ Add pieces</LinkBtn>
          <input
            ref={inputRef}
            type="file"
            accept=".png,image/png"
            multiple
            hidden
            onChange={(e) => { onAddFiles([...e.target.files]); e.target.value = ""; }}
          />
        </PartsHead>
        {!rows.length && <Hint>No pieces yet — drop PNGs on this item on the left.</Hint>}
        {rule && suggested.length > 0 && <Hint>{subcategoryLabel(item.subcategory)} usually also covers the parts below — they're optional.</Hint>}
        <Parts>
          {rows.map(({ part, kind }) => {
            const f = byPart.get(part);
            const state = f ? "ok" : "optional";
            return (
              <PartRow key={part}>
                <Dot $state={state}>{state === "ok" ? "✓" : ""}</Dot>
                <PartThumb>{f?.thumb && <img src={f.thumb} alt="" />}</PartThumb>
                <PartText>
                  <PartName>
                    {labelOf(part)}
                    {kind === "suggested" && <Dim> · usually included</Dim>}
                  </PartName>
                  <PartFile title={f ? f.fileName : `e.g. ${expectedFileName(item.name, part, types)}`}>
                    {f ? f.fileName : expectedFileName(item.name, part, types)}
                  </PartFile>
                  {f?.warning && <PartWarn>{f.warning}</PartWarn>}
                </PartText>
                {f && <RemoveBtn onClick={() => onRemoveFile(f.id)} title="Remove">✕</RemoveBtn>}
              </PartRow>
            );
          })}
        </Parts>
      </Field>

      <DangerBtn onClick={onRemoveItem}>Remove item</DangerBtn>
    </>
  );
}

/* ── Styles ── */
const ACCENT = "#68cfee";

const Page = styled.div`display:flex;flex-direction:column;height:100%;overflow:hidden;`;
const Fatal = styled.div`margin:40px;color:#ff7777;font-size:14px;`;

const TopBar = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;
  padding:18px 24px;border-bottom:1px solid #ffffff0a;flex-shrink:0;
`;
const Title = styled.h1`font-size:19px;font-weight:800;color:#fff;`;
const Sub = styled.div`font-size:12px;color:#777;margin-top:3px;`;
const TopActions = styled.div`display:flex;align-items:center;gap:12px;`;
const GenderSelect = styled.select`
  background:#1c1c22;border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:13px;
  padding:8px 10px;outline:none;cursor:pointer;&:focus{border-color:${ACCENT};}
`;
const Check = styled.label`display:flex;align-items:center;gap:6px;font-size:13px;color:#aaa;cursor:pointer;user-select:none;`;
const SubmitBtn = styled.button`
  padding:9px 20px;border-radius:9px;border:1.5px solid rgba(104,207,238,0.6);
  background:rgba(104,207,238,0.1);color:${ACCENT};font-size:14px;font-weight:700;cursor:pointer;
  &:hover:not(:disabled){background:rgba(104,207,238,0.2);border-color:${ACCENT};}
  &:disabled{opacity:0.35;cursor:not-allowed;}
`;

const Banner = styled.div`
  display:flex;align-items:center;gap:10px;margin:12px 24px 0;padding:10px 14px;border-radius:8px;font-size:13px;
  color:${(p) => p.$error ? "#ff8a8a" : "#4ade80"};
  background:${(p) => p.$error ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)"};
  border:1px solid ${(p) => p.$error ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"};
  a{color:inherit;font-weight:700;}
`;
const BannerClose = styled.button`margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;opacity:0.7;&:hover{opacity:1;}`;

const Cols = styled.div`display:flex;flex:1;min-height:0;`;
const Left = styled.div`
  width:290px;flex-shrink:0;border-right:1px solid #ffffff0a;overflow-y:auto;padding:16px;
  display:flex;flex-direction:column;gap:10px;
`;
const Middle = styled.div`flex:1;min-width:0;padding:16px;display:flex;flex-direction:column;`;
const Right = styled.div`
  width:330px;flex-shrink:0;border-left:1px solid #ffffff0a;overflow-y:auto;padding:16px 18px;
  display:flex;flex-direction:column;gap:18px;
`;


const SectionHead = styled.div`
  display:flex;align-items:center;justify-content:space-between;margin-top:8px;
  font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.5px;
`;
const Dim = styled.span`color:#555;font-weight:500;`;
const LinkBtn = styled.button`
  background:none;border:none;color:${ACCENT};font-size:12px;font-weight:600;cursor:pointer;padding:0;
  text-transform:none;letter-spacing:0;&:hover{text-decoration:underline;}
`;
const Empty = styled.div`font-size:12px;color:#555;line-height:1.5;`;

const ItemList = styled.div`display:flex;flex-direction:column;gap:8px;`;
const Zone = styled.div`
  display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:10px;cursor:pointer;transition:all 0.15s;
  border:1.5px ${(p) => p.$over ? "dashed" : "solid"} ${(p) => p.$over ? ACCENT : p.$active ? "rgba(104,207,238,0.45)" : "#ffffff10"};
  background:${(p) => p.$over ? "rgba(104,207,238,0.1)" : p.$active ? "rgba(104,207,238,0.06)" : "rgba(255,255,255,0.02)"};
  &:hover{border-color:${(p) => p.$over ? ACCENT : "rgba(104,207,238,0.35)"};}
`;
const ZoneHead = styled.div`display:flex;align-items:center;gap:10px;`;
const EyeBtn = styled.button`
  display:flex;align-items:center;justify-content:center;width:26px;height:26px;flex-shrink:0;
  border-radius:6px;border:none;cursor:pointer;
  background:${(p) => p.$off ? "rgba(255,255,255,0.06)" : "transparent"};
  color:${(p) => p.$off ? "#666" : "#aaa"};
  &:hover{color:${ACCENT};background:rgba(104,207,238,0.1);}
  svg{width:16px;height:16px;}
`;
const Pieces = styled.div`display:flex;flex-direction:column;opacity:${(p) => p.$hidden ? 0.4 : 1};`;
const Piece = styled.div`
  display:flex;align-items:center;gap:8px;padding:4px 0;
  & + &{border-top:1px solid #ffffff08;}
`;
const PieceThumb = styled.div`
  width:26px;height:26px;border-radius:5px;background:#111;flex-shrink:0;overflow:hidden;
  img{width:100%;height:100%;object-fit:contain;}
`;
const PieceLabel = styled.div`flex:1;min-width:0;font-size:12px;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const PieceRemove = styled.button`
  background:none;border:none;color:#555;font-size:11px;cursor:pointer;padding:2px 4px;
  &:hover{color:#ff7777;}
`;
const DropStrip = styled.div`
  border:1px dashed ${(p) => p.$over ? ACCENT : "#ffffff22"};border-radius:8px;padding:9px 8px;
  text-align:center;font-size:11.5px;font-weight:600;color:${(p) => p.$over ? ACCENT : "#777"};
  &:hover{border-color:${ACCENT};color:${ACCENT};}
`;
const AddItemBtn = styled.button`
  padding:9px;border-radius:9px;border:1px dashed #ffffff25;background:transparent;color:#aaa;
  font-size:13px;font-weight:700;cursor:pointer;
  &:hover:not(:disabled){border-color:${ACCENT};color:${ACCENT};}
  &:disabled{opacity:0.4;cursor:default;}
`;
const ItemText = styled.div`flex:1;min-width:0;`;
const ItemName = styled.div`font-size:13px;font-weight:700;color:#ddd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const ItemType = styled.div`font-size:11px;color:#666;margin-top:1px;`;
const Chip = styled.span`
  font-size:10px;font-weight:700;padding:3px 7px;border-radius:10px;white-space:nowrap;
  color:${(p) => p.$ok ? "#4ade80" : "#f5b14a"};
  background:${(p) => p.$ok ? "rgba(34,197,94,0.12)" : "rgba(245,177,74,0.12)"};
`;

const RejectList = styled.div`display:flex;flex-direction:column;`;
const RejectRow = styled.div`
  display:flex;flex-direction:column;gap:2px;padding:7px 0;font-size:11px;color:#ff8a8a;line-height:1.4;
  & + &{border-top:1px solid #ffffff08;}
  code{color:#bbb;word-break:break-all;}
`;

const Mono = styled.code`font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:0.92em;color:#cfd8dc;`;

const Guide = styled.details`
  margin-top:auto;border-top:1px solid #ffffff0a;padding-top:10px;
  summary{font-size:12px;font-weight:700;color:#999;cursor:pointer;}
`;
const GuideBody = styled.div`
  display:flex;flex-direction:column;gap:8px;margin-top:10px;font-size:12px;color:#888;line-height:1.5;
  b{color:#ccc;}
`;
const Example = styled.code`
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;
  padding:6px 9px;border-radius:6px;background:rgba(104,207,238,0.08);color:#a8e6f5;
`;
const Tokens = styled.div`display:flex;flex-wrap:wrap;gap:4px;`;
const Token = styled.code`
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;
  padding:2px 6px;border-radius:5px;background:#ffffff0a;color:#bbb;
`;
const TemplateBtn = styled.button`
  padding:8px;border-radius:8px;border:1px solid #ffffff20;background:transparent;color:#ccc;
  font-size:12px;font-weight:600;cursor:pointer;&:hover{border-color:${ACCENT};color:${ACCENT};}
`;

const Field = styled.div`display:flex;flex-direction:column;gap:7px;`;
const Label = styled.div`font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.4px;display:flex;align-items:center;gap:6px;`;
const Input = styled.input`
  background:rgba(255,255,255,0.04);border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:14px;
  padding:9px 12px;outline:none;&:focus{border-color:${ACCENT};}
`;
const Select = styled.select`
  background:#1c1c22;border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:13px;
  padding:8px 10px;outline:none;cursor:pointer;&:focus{border-color:${ACCENT};}
`;
const Pills = styled.div`display:flex;flex-wrap:wrap;gap:5px;`;
const Pill = styled.button`
  padding:5px 10px;border-radius:14px;font-size:12px;cursor:pointer;
  border:1px solid ${(p) => p.$on ? "rgba(104,207,238,0.7)" : "#ffffff15"};
  background:${(p) => p.$on ? "rgba(104,207,238,0.15)" : "transparent"};
  color:${(p) => p.$on ? "#a8e6f5" : "#888"};
  &:hover{color:#a8e6f5;}
`;
const Hint = styled.div`
  font-size:11px;line-height:1.45;
  color:${(p) => p.$ok ? "#4ade80" : p.$warn ? "#f5b14a" : "#666"};
`;

const PartsHead = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Parts = styled.div`display:flex;flex-direction:column;`;
const PartRow = styled.div`
  display:flex;align-items:center;gap:9px;padding:8px 0;
  & + &{border-top:1px solid #ffffff08;}
`;
const DOT = {
  ok:       ["#4ade80", "rgba(34,197,94,0.15)"],
  optional: ["#555", "transparent"],
};
const Dot = styled.span`
  width:18px;height:18px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:800;
  color:${(p) => DOT[p.$state][0]};background:${(p) => DOT[p.$state][1]};
  border:1px solid ${(p) => p.$state === "optional" ? "#ffffff20" : "transparent"};
`;
const PartThumb = styled.div`
  width:34px;height:34px;border-radius:6px;background:#111;flex-shrink:0;overflow:hidden;
  img{width:100%;height:100%;object-fit:contain;}
`;
const PartText = styled.div`flex:1;min-width:0;`;
const PartName = styled.div`font-size:12px;font-weight:700;color:#ccc;`;
const PartFile = styled.div`
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;color:#666;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;
`;
const PartWarn = styled.div`font-size:10.5px;color:#f5b14a;line-height:1.4;margin-top:3px;`;
const RemoveBtn = styled.button`
  background:none;border:none;color:#555;font-size:12px;cursor:pointer;padding:4px;
  &:hover{color:#ff7777;}
`;
const DangerBtn = styled.button`
  margin-top:auto;padding:9px;border-radius:8px;border:1px solid #ffffff12;background:transparent;
  color:#777;font-size:12px;font-weight:600;cursor:pointer;
  &:hover{color:#ff7777;border-color:rgba(255,80,80,0.4);}
`;
