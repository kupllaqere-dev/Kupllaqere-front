import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import RigStage from "../components/RigStage";
import { loadItemAtlas, loadImage, rawPiece } from "@avatar/CanvasRig.js";
import {
  getMySubmissions, getItemTypes, updateSubmission, uploadParts, deletePart, deleteSubmission,
} from "../api/creator";
import { labelOf, layerOf, expectedFileName } from "../lib/partFiles";
import { categoryLabel, subcategoryLabel, typeLabel } from "../lib/labels";

const STATUS_COLOR = { pending: "#f59e0b", approved: "#22c55e", declined: "#ef4444" };
const ATLAS_LABEL  = { queued: "Queued", packing: "Packing…", ready: "Packed", failed: "Packing failed" };
const ATLAS_COLOR  = { queued: "#9aa0a6", packing: "#68cfee", ready: "#4ade80", failed: "#ff7777" };
const POLL_MS = 4000;
const LIMIT = 20;

const isPacking = (s) => s.atlasStatus === "queued" || s.atlasStatus === "packing";
const flatten = (entries) => entries.flatMap((e) => (e.isSet ? e.items : [e]));

/**
 * Garments for previewing submissions: the packed atlas when it's ready, the
 * raw uploads while it's still being packed.
 */
function useGarments(subs, types) {
  const [garments, setGarments] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const key = subs.map((s) => `${s.id}:${s.atlasJsonUrl}:${s.parts.map((p) => p.url).join(",")}`).join("|");

  useEffect(() => {
    if (!types) return;
    let cancelled = false;
    setLoadError(null);
    Promise.all(subs.filter((s) => s.format === "rig").map(async (s) => {
      const layer = layerOf(s.category, s.subcategory, types);
      if (s.atlasStatus === "ready" && s.atlasJsonUrl) {
        const { pieces } = await loadItemAtlas(s.atlasJsonUrl, s.atlasUrl);
        return [...pieces].map(([part, piece]) => ({ part, layer, piece }));
      }
      return Promise.all(s.parts.map(async (p) => ({ part: p.part, layer, piece: rawPiece(await loadImage(p.url)) })));
    }))
      .then((lists) => { if (!cancelled) setGarments(lists.flat()); })
      .catch((e) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, types]);

  return { garments, loadError };
}

export default function MySubmissions() {
  const [types, setTypes]     = useState(null);
  const [data, setData]       = useState({ submissions: [], total: 0 });
  const [status, setStatus]   = useState("");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [open, setOpen]       = useState(null); // submission id or set code

  useEffect(() => { getItemTypes().then(setTypes).catch(() => {}); }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res = await getMySubmissions({ status, page, limit: LIMIT });
      setData(res);
    } catch (e) { if (!silent) setError(e.message); }
    finally { if (!silent) setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  // Keep atlas status live while anything is still being packed.
  const anyPacking = flatten(data.submissions).some(isPacking);
  useEffect(() => {
    if (!anyPacking) return;
    const id = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [anyPacking, load]);

  const replaceSub = (updated) => setData((d) => ({
    ...d,
    submissions: d.submissions.map((e) => e.isSet
      ? { ...e, items: e.items.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)) }
      : e.id === updated.id ? { ...e, ...updated } : e),
  }));

  const totalPages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <Page>
      <Header>
        <Title>Submissions <Count>({data.total})</Count></Title>
        <Tabs>
          {[["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["declined", "Declined"]].map(([v, label]) => (
            <Tab key={v} $on={status === v} onClick={() => { setStatus(v); setPage(1); setOpen(null); }}>{label}</Tab>
          ))}
        </Tabs>
      </Header>

      {error && <ErrMsg>{error}</ErrMsg>}
      {loading && <Center>Loading…</Center>}
      {!loading && data.submissions.length === 0 && <Center>No submissions yet.</Center>}

      <List>
        {data.submissions.map((entry) => entry.isSet ? (
          <SetBlock key={entry.setCode}>
            <SetHead onClick={() => setOpen((o) => (o === entry.setCode ? null : entry.setCode))}>
              <SetTag>Set</SetTag>
              <SetNames>{entry.items.map((i) => i.name).join(" · ")}</SetNames>
              <StatusBadge status={entry.status} />
              <DateText>{new Date(entry.createdAt).toLocaleDateString()}</DateText>
              <Caret>{open === entry.setCode ? "▴" : "▾"}</Caret>
            </SetHead>
            {open === entry.setCode && (
              <SetPreview items={entry.items} types={types} />
            )}
            {entry.items.map((sub) => (
              <SubmissionRow
                key={sub.id}
                sub={sub}
                nested
                types={types}
                open={open === sub.id}
                onToggle={() => setOpen((o) => (o === sub.id ? null : sub.id))}
                onChanged={replaceSub}
                onDeleted={() => { setOpen(null); load(); }}
              />
            ))}
          </SetBlock>
        ) : (
          <SubmissionRow
            key={entry.id}
            sub={entry}
            types={types}
            open={open === entry.id}
            onToggle={() => setOpen((o) => (o === entry.id ? null : entry.id))}
            onChanged={replaceSub}
            onDeleted={() => { setOpen(null); load(); }}
          />
        ))}
      </List>

      {totalPages > 1 && (
        <Pagination>
          <PgBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</PgBtn>
          <PgInfo>Page {page} / {totalPages}</PgInfo>
          <PgBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PgBtn>
        </Pagination>
      )}
    </Page>
  );
}

function StatusBadge({ status }) {
  return <Badge style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}>{status}</Badge>;
}

function AtlasChip({ sub }) {
  if (sub.format !== "rig") return <AtlasTag style={{ color: "#777" }}>Legacy sheet</AtlasTag>;
  const s = sub.atlasStatus || "queued";
  return <AtlasTag style={{ color: ATLAS_COLOR[s] }} title={sub.atlasError || ""}>{ATLAS_LABEL[s]}</AtlasTag>;
}

function SubmissionRow({ sub, nested, types, open, onToggle, onChanged, onDeleted }) {
  return (
    <>
      <Row $nested={nested} $open={open} onClick={onToggle}>
        <Thumb>{sub.thumbnailUrl ? <img src={sub.thumbnailUrl} alt="" /> : <Placeholder>{isPacking(sub) ? "…" : ""}</Placeholder>}</Thumb>
        <RowText>
          <RowName>{sub.name}</RowName>
          <RowType>{typeLabel(sub.category, sub.subcategory)} · {sub.gender}</RowType>
        </RowText>
        <AtlasChip sub={sub} />
        {!nested && <StatusBadge status={sub.status} />}
        {!nested && <DateText>{new Date(sub.createdAt).toLocaleDateString()}</DateText>}
        <Caret>{open ? "▴" : "▾"}</Caret>
      </Row>
      {open && <Detail sub={sub} types={types} onChanged={onChanged} onDeleted={onDeleted} />}
    </>
  );
}

function SetPreview({ items, types }) {
  const { garments, loadError } = useGarments(items, types);
  return (
    <SetStage>
      <RigStage garments={garments} overlay={loadError ? `Couldn't load: ${loadError}` : null} compact />
    </SetStage>
  );
}

// ── One submission, expanded ─────────────────────────────────────────────────
function Detail({ sub, types, onChanged, onDeleted }) {
  const subs = useMemo(() => [sub], [sub]);
  const { garments, loadError } = useGarments(subs, types);
  const [name, setName]         = useState(sub.name);
  const [category, setCategory] = useState(sub.category);
  const [subcategory, setSubcategory] = useState(sub.subcategory);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState(null);
  const addRef = useRef(null);

  const locked = sub.status === "approved";
  const isRig  = sub.format === "rig";
  const rule   = types?.rules[`${category}/${subcategory}`];
  const dirty  = name.trim() !== sub.name || category !== sub.category || subcategory !== sub.subcategory;

  const run = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const save = () => run(async () => {
    const res = await updateSubmission(sub.id, { name: name.trim(), category, subcategory });
    onChanged(res.submission);
  });

  const upload = (fileList) => run(async () => {
    const fd = new FormData();
    for (const f of fileList) fd.append("files", f, f.name);
    const res = await uploadParts(sub.id, fd);
    onChanged(res.submission);
  });

  const removePart = (part) => run(async () => {
    const res = await deletePart(sub.id, part);
    onChanged(res.submission);
  });

  const withdraw = () => {
    const msg = sub.isSet ? "Withdraw the whole set? This deletes every item in it." : `Withdraw "${sub.name}"? This deletes it.`;
    if (!confirm(msg)) return;
    run(async () => { await deleteSubmission(sub.id); onDeleted(); });
  };

  const byPart = new Map(sub.parts.map((p) => [p.part, p]));
  // What's uploaded, then the parts this type usually also covers.
  const rows = [
    ...sub.parts.map((p) => ({ part: p.part, kind: "uploaded" })),
    ...(rule ? [...rule.required, ...rule.optional] : [])
      .filter((part) => !byPart.has(part))
      .map((part) => ({ part, kind: "suggested" })),
  ];

  let overlay = null;
  if (!isRig) overlay = "Legacy spritesheet item — it can't be shown on the new avatar.";
  else if (loadError) overlay = `Couldn't load the preview: ${loadError}`;
  else if (sub.atlasStatus !== "ready") overlay = "Showing your raw uploads while the atlas is packed.";

  return (
    <DetailBox>
      <DetailStage>
        <RigStage garments={garments} overlay={overlay} compact />
      </DetailStage>

      <DetailSide>
        {sub.adminNote && (
          <Note $declined={sub.status === "declined"}>
            <NoteHead>Note from the team</NoteHead>
            {sub.adminNote}
          </Note>
        )}

        {isRig && (
          <Block>
            <Label>Atlas</Label>
            <AtlasLine>
              <AtlasChip sub={sub} />
              {sub.atlasStatus === "ready" && sub.atlasSize && <Dim>{sub.atlasSize.w}×{sub.atlasSize.h}px · {sub.parts.length} frames</Dim>}
              {sub.atlasStatus === "ready" && (
                <>
                  <a href={sub.atlasUrl} target="_blank" rel="noreferrer">PNG</a>
                  <a href={sub.atlasJsonUrl} target="_blank" rel="noreferrer">JSON</a>
                </>
              )}
            </AtlasLine>
            {sub.atlasStatus === "failed" && sub.atlasError && <ErrText>{sub.atlasError}</ErrText>}
          </Block>
        )}

        <Block>
          <Label>Name</Label>
          <Input value={name} maxLength={types?.maxNameLength ?? 40} disabled={locked} onChange={(e) => setName(e.target.value)} />
        </Block>

        {types && (
          <Block>
            <Label>Item type</Label>
            <TypeRow>
              <Select
                value={category}
                disabled={locked}
                onChange={(e) => { setCategory(e.target.value); setSubcategory(types.categories[e.target.value][0]); }}
              >
                {Object.keys(types.categories).map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </Select>
              <Select value={subcategory} disabled={locked} onChange={(e) => setSubcategory(e.target.value)}>
                {(types.categories[category] || []).map((s) => <option key={s} value={s}>{subcategoryLabel(s)}</option>)}
              </Select>
            </TypeRow>
          </Block>
        )}

        {!locked && dirty && (
          <SaveBtn onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save changes"}</SaveBtn>
        )}

        {isRig && types && (
          <Block>
            <PartsHead>
              <Label>Body parts</Label>
              {!locked && <LinkBtn onClick={() => addRef.current?.click()} disabled={busy}>Replace / add files</LinkBtn>}
              <input ref={addRef} type="file" accept=".png,image/png" multiple hidden
                onChange={(e) => { if (e.target.files.length) upload([...e.target.files]); e.target.value = ""; }} />
            </PartsHead>
            {!locked && <Dim>Upload files named <code>Name-body_part.png</code> — a part you already have is replaced.</Dim>}
            <Parts>
              {rows.map(({ part, kind }) => {
                const p = byPart.get(part);
                return (
                  <PartRow key={part}>
                    <PartDot $state={p ? "ok" : "optional"} />
                    <PartText>
                      <PartName>{labelOf(part)}{kind === "suggested" && <Dim> · usually included</Dim>}</PartName>
                      <PartFile>{p ? p.fileName : expectedFileName(sub.name, part)}</PartFile>
                    </PartText>
                    {p && <a href={p.url} target="_blank" rel="noreferrer">view</a>}
                    {p && !locked && sub.parts.length > 1 && (
                      <RemoveBtn onClick={() => removePart(part)} disabled={busy} title="Remove this part">✕</RemoveBtn>
                    )}
                  </PartRow>
                );
              })}
            </Parts>
          </Block>
        )}

        {error && <ErrText>{error}</ErrText>}

        {!locked && <WithdrawBtn onClick={withdraw} disabled={busy}>{sub.isSet ? "Withdraw set" : "Withdraw"}</WithdrawBtn>}
      </DetailSide>
    </DetailBox>
  );
}

/* ── Styles ── */
const ACCENT = "#68cfee";

const Page = styled.div`padding:24px 28px;max-width:1100px;`;
const Header = styled.div`display:flex;align-items:center;gap:16px;margin-bottom:18px;flex-wrap:wrap;`;
const Title = styled.h1`font-size:20px;font-weight:800;color:#fff;`;
const Count = styled.span`font-size:15px;font-weight:400;color:#666;`;
const Tabs = styled.div`display:flex;gap:4px;margin-left:auto;`;
const Tab = styled.button`
  padding:6px 13px;border-radius:7px;border:none;font-size:13px;font-weight:600;cursor:pointer;
  background:${(p) => p.$on ? "rgba(104,207,238,0.15)" : "transparent"};
  color:${(p) => p.$on ? "#a8e6f5" : "#777"};
  &:hover{color:#a8e6f5;}
`;
const ErrMsg = styled.div`color:#ff7777;font-size:13px;margin-bottom:12px;`;
const Center = styled.div`text-align:center;padding:40px;color:#555;font-size:13px;`;

const List = styled.div`border-top:1px solid #ffffff0c;`;
const Row = styled.div`
  display:flex;align-items:center;gap:14px;padding:10px 8px;cursor:pointer;
  padding-left:${(p) => p.$nested ? "36px" : "8px"};
  border-bottom:1px solid #ffffff0a;
  background:${(p) => p.$open ? "rgba(104,207,238,0.05)" : "transparent"};
  &:hover{background:rgba(255,255,255,0.03);}
`;
const Thumb = styled.div`
  width:44px;height:44px;border-radius:7px;background:#111;flex-shrink:0;overflow:hidden;
  img{width:100%;height:100%;object-fit:contain;}
`;
const Placeholder = styled.div`width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555;`;
const RowText = styled.div`flex:1;min-width:0;`;
const RowName = styled.div`font-size:14px;font-weight:700;color:#ddd;`;
const RowType = styled.div`font-size:12px;color:#666;margin-top:2px;text-transform:none;`;
const Badge = styled.span`padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;text-transform:capitalize;`;
const AtlasTag = styled.span`font-size:11px;font-weight:700;white-space:nowrap;`;
const DateText = styled.span`font-size:12px;color:#555;width:80px;text-align:right;`;
const Caret = styled.span`color:#555;font-size:12px;width:12px;`;

const SetBlock = styled.div``;
const SetHead = styled.div`
  display:flex;align-items:center;gap:12px;padding:12px 8px;cursor:pointer;border-bottom:1px solid #ffffff0a;
  &:hover{background:rgba(255,255,255,0.03);}
`;
const SetTag = styled.span`font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:${ACCENT};
  padding:3px 8px;border-radius:6px;background:rgba(104,207,238,0.12);`;
const SetNames = styled.span`flex:1;font-size:13px;color:#bbb;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const SetStage = styled.div`height:420px;padding:14px 8px;border-bottom:1px solid #ffffff0a;`;

const DetailBox = styled.div`
  display:flex;gap:22px;padding:18px 8px 22px 36px;border-bottom:1px solid #ffffff0a;
  background:rgba(255,255,255,0.015);flex-wrap:wrap;
`;
const DetailStage = styled.div`width:340px;height:480px;flex-shrink:0;`;
const DetailSide = styled.div`flex:1;min-width:260px;display:flex;flex-direction:column;gap:16px;`;
const Block = styled.div`display:flex;flex-direction:column;gap:7px;`;
const Label = styled.div`font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.4px;`;
const Dim = styled.span`font-size:12px;color:#666;code{color:#aaa;}`;
const AtlasLine = styled.div`
  display:flex;align-items:center;gap:10px;font-size:12px;
  a{color:${ACCENT};font-weight:600;text-decoration:none;&:hover{text-decoration:underline;}}
`;
const Note = styled.div`
  padding:10px 12px;border-radius:8px;font-size:13px;line-height:1.5;color:#ddd;
  background:${(p) => p.$declined ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)"};
  border-left:3px solid ${(p) => p.$declined ? "#ef4444" : "#ffffff30"};
`;
const NoteHead = styled.div`font-size:11px;font-weight:700;color:#999;margin-bottom:3px;`;
const Input = styled.input`
  background:rgba(255,255,255,0.04);border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:14px;
  padding:8px 11px;outline:none;&:focus{border-color:${ACCENT};}&:disabled{opacity:0.6;}
`;
const TypeRow = styled.div`display:flex;gap:8px;`;
const Select = styled.select`
  flex:1;background:#1c1c22;border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:13px;
  padding:8px 10px;outline:none;&:focus{border-color:${ACCENT};}&:disabled{opacity:0.6;}
`;
const SaveBtn = styled.button`
  align-self:flex-start;padding:8px 16px;border-radius:8px;border:1.5px solid rgba(104,207,238,0.6);
  background:rgba(104,207,238,0.1);color:${ACCENT};font-size:13px;font-weight:700;cursor:pointer;
  &:disabled{opacity:0.4;cursor:not-allowed;}
`;
const PartsHead = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const LinkBtn = styled.button`
  background:none;border:none;color:${ACCENT};font-size:12px;font-weight:600;cursor:pointer;padding:0;
  &:hover{text-decoration:underline;}&:disabled{opacity:0.4;}
`;
const Parts = styled.div`display:flex;flex-direction:column;`;
const PartRow = styled.div`
  display:flex;align-items:center;gap:10px;padding:7px 0;font-size:12px;
  & + &{border-top:1px solid #ffffff08;}
  a{color:#777;font-size:11px;&:hover{color:${ACCENT};}}
`;
const PART_DOT = { ok: "#4ade80", optional: "#444" };
const PartDot = styled.span`width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${(p) => PART_DOT[p.$state]};`;
const PartText = styled.div`flex:1;min-width:0;`;
const PartName = styled.div`font-weight:700;color:#ccc;`;
const PartFile = styled.div`font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const RemoveBtn = styled.button`background:none;border:none;color:#555;cursor:pointer;font-size:12px;&:hover{color:#ff7777;}`;
const ErrText = styled.div`font-size:12px;color:#ff8a8a;line-height:1.45;`;
const WithdrawBtn = styled.button`
  align-self:flex-start;margin-top:auto;padding:7px 14px;border-radius:8px;border:1px solid #ffffff15;
  background:transparent;color:#777;font-size:12px;font-weight:600;cursor:pointer;
  &:hover{color:#ff7777;border-color:rgba(255,80,80,0.4);}
`;

const Pagination = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn = styled.button`
  padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:disabled{opacity:0.3;cursor:not-allowed;}
`;
const PgInfo = styled.span`font-size:13px;color:#666;`;
