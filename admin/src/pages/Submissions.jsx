import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import styled from "styled-components";
import { getSubmissions, updateSubmissionStatus, updateSetStatus, repackSubmission } from "../api/admin";
import RigPreview from "../components/RigPreview";
import { useSubmissionGarments } from "../components/useSubmissionGarments";

const ATLAS_LABEL = { queued: "Atlas queued", packing: "Packing atlas…", ready: "Atlas packed", failed: "Atlas failed" };
const ATLAS_COLOR = { queued: "#9aa0a6", packing: "#c4a1ff", ready: "#4ade80", failed: "#ff7777" };
const isPacking = (s) => s.atlasStatus === "queued" || s.atlasStatus === "packing";

// ── Sprite sheet constants ────────────────────────────────────────────────────
const FRAME_W    = 510;
const FRAME_H    = 900;
const SHEET_COLS = 6;
const IDLE_FRAMES = [0, 1, 2, 3, 5, 4];
const ANIM = {
  down:  { idle: IDLE_FRAMES, walk: [18, 19, 20, 21] },
  left:  { idle: IDLE_FRAMES, walk: [6, 7, 8, 9, 10, 11] },
  right: { idle: IDLE_FRAMES, walk: [12, 13, 14, 15, 16, 17] },
  up:    { idle: IDLE_FRAMES, walk: [24, 25, 26, 27] },
};
const DIR_CYCLE = ["down", "left", "up", "right"];

const imageCache = new Map();
function loadImg(url) {
  if (!imageCache.has(url)) {
    const p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return imageCache.get(url);
}

function baseUrl(gender) {
  return gender === "male"
    ? "/assets/character-bases/men-test.png"
    : "/assets/character-bases/females_new.png";
}

// ── AvatarCanvas (legacy spritesheet submissions) ────────────────────────────
function AvatarCanvas({ gender, itemImageUrls = [] }) {
  const canvasRef               = useRef(null);
  const [dir, setDir]           = useState("down");
  const [mode, setMode]         = useState("idle");
  const [frameIdx, setFrameIdx] = useState(0);

  const frames = ANIM[dir][mode];
  const prevKeyRef = useRef(`${dir}-${mode}`);

  useEffect(() => {
    if (mode === "idle") return;
    const key = `${dir}-${mode}`;
    if (prevKeyRef.current !== key) { prevKeyRef.current = key; setFrameIdx(0); }
    const id = setInterval(() => setFrameIdx((i) => (i + 1) % frames.length), 250);
    return () => clearInterval(id);
  }, [mode, dir, frames.length]);

  useEffect(() => {
    const frameNum = frames[frameIdx] ?? frames[0];
    const col = frameNum % SHEET_COLS;
    const row = Math.floor(frameNum / SHEET_COLS);
    const sx  = col * FRAME_W;
    const sy  = row * FRAME_H;

    const urls = [baseUrl(gender), ...itemImageUrls].filter(Boolean);
    Promise.all(urls.map(loadImg)).then((imgs) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const img of imgs) {
        if (!img) continue;
        ctx.drawImage(img, sx, sy, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
      }
    });
  }, [gender, itemImageUrls, frameIdx, frames, dir]);

  const step = (delta) => {
    if (mode === "idle") {
      setFrameIdx((i) => (i - delta + IDLE_FRAMES.length) % IDLE_FRAMES.length);
    } else {
      setDir((d) => DIR_CYCLE[(DIR_CYCLE.indexOf(d) - delta + DIR_CYCLE.length) % DIR_CYCLE.length]);
    }
  };

  return (
    <AvatarWrap>
      <canvas ref={canvasRef} width={204} height={360}
        style={{ width: 204, height: 360, display: "block", imageRendering: "pixelated" }} />
      <CanvasControls>
        <TurnBtn onClick={() => step(-1)}>◀</TurnBtn>
        <DirLabel>{mode === "idle" ? `${frameIdx + 1} / ${IDLE_FRAMES.length}` : dir}</DirLabel>
        <TurnBtn onClick={() => step(1)}>▶</TurnBtn>
      </CanvasControls>
      <ModeToggle>
        <ModeBtn $active={mode === "idle"} onClick={() => setMode("idle")}>Idle</ModeBtn>
        <ModeBtn $active={mode === "walk"} onClick={() => setMode("walk")}>Walk</ModeBtn>
      </ModeToggle>
    </AvatarWrap>
  );
}

// ── Rig atlas info + re-pack ─────────────────────────────────────────────────
function AtlasInfo({ submission, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const s = submission.atlasStatus || "queued";

  const repack = async () => {
    setBusy(true);
    try {
      await repackSubmission(submission.id);
      onUpdated({ ...submission, atlasStatus: "queued", atlasError: null });
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <ControlGroup>
      <ControlLabel>Atlas</ControlLabel>
      <AtlasLine>
        <AtlasState style={{ color: ATLAS_COLOR[s] }}>{ATLAS_LABEL[s]}</AtlasState>
        {s === "ready" && submission.atlasSize && <Gray>{submission.atlasSize.w}×{submission.atlasSize.h}</Gray>}
        {s === "ready" && <a href={submission.atlasUrl} target="_blank" rel="noreferrer">PNG</a>}
        {s === "ready" && <a href={submission.atlasJsonUrl} target="_blank" rel="noreferrer">JSON</a>}
        {submission.status !== "approved" && (s === "failed" || s === "ready") && (
          <RepackBtn onClick={repack} disabled={busy}>Re-pack</RepackBtn>
        )}
      </AtlasLine>
      {s === "failed" && submission.atlasError && <AtlasErr>{submission.atlasError}</AtlasErr>}
      <PartList>
        {(submission.parts || []).map((p) => (
          <PartLink key={p.part} href={p.url} target="_blank" rel="noreferrer" title={p.fileName}>{p.fileName}</PartLink>
        ))}
      </PartList>
    </ControlGroup>
  );
}

// ── Single-item Inspector ─────────────────────────────────────────────────────
function SingleInspector({ submission, onStatusChange, onUpdated }) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [busy, setBusy]             = useState(false);
  const [note, setNote]             = useState(submission.adminNote || "");

  const isRig      = submission.format === "rig";
  const gender     = submission.gender || "female";
  const variant    = submission.variants[variantIdx];
  const itemImgUrl = variant?.imageUrl || null;
  const rigSubs    = useMemo(() => (isRig ? [submission] : []), [isRig, submission]);
  const { garments, error: garmentError } = useSubmissionGarments(rigSubs);
  const notReady   = isRig && submission.atlasStatus !== "ready";

  const handleStatus = async (status) => {
    setBusy(true);
    try {
      await updateSubmissionStatus(submission.id, status, note);
      onStatusChange(submission.id, status);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <InspectorBox>
      <InspectorInner>
        {isRig
          ? <RigPreview garments={garments} note={garmentError || (notReady ? "Raw uploads — atlas not packed yet" : null)} />
          : <AvatarCanvas gender={gender} itemImageUrls={itemImgUrl ? [itemImgUrl] : []} />}
        <SidePanel>
          <ControlGroup>
            <ControlLabel>Gender</ControlLabel>
            <GenderTag>{gender === "male" ? "Male" : "Female"}</GenderTag>
          </ControlGroup>

          {isRig ? (
            <AtlasInfo submission={submission} onUpdated={onUpdated} />
          ) : (
            <ControlGroup>
              <ControlLabel>Variants</ControlLabel>
              <ThumbRow>
                {submission.variants.map((v, i) => (
                  <ThumbBtn key={i} $active={i === variantIdx} onClick={() => setVariantIdx(i)}>
                    {v.thumbnailUrl
                      ? <ThumbImg src={v.thumbnailUrl} alt={`variant ${i + 1}`} />
                      : <ThumbPlaceholder>{i + 1}</ThumbPlaceholder>}
                  </ThumbBtn>
                ))}
              </ThumbRow>
            </ControlGroup>
          )}

          <ControlGroup>
            <ControlLabel>Admin note (optional)</ControlLabel>
            <NoteInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Leave feedback for the creator…"
              maxLength={500}
            />
          </ControlGroup>

          <ActionRow>
            <ApproveBtn
              disabled={busy || submission.status === "approved" || notReady}
              title={notReady ? "Waiting for the atlas to be packed" : ""}
              onClick={() => handleStatus("approved")}
            >
              {submission.status === "approved" ? "✓ Approved" : "Approve"}
            </ApproveBtn>
            <DeclineBtn disabled={busy || submission.status === "declined"} onClick={() => handleStatus("declined")}>
              {submission.status === "declined" ? "✗ Declined" : "Decline"}
            </DeclineBtn>
          </ActionRow>
        </SidePanel>
      </InspectorInner>
    </InspectorBox>
  );
}

// ── Set Inspector ─────────────────────────────────────────────────────────────
function SetInspector({ setEntry, onSetStatusChange, onUpdated }) {
  const [activeItem, setActiveItem] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [busy, setBusy]             = useState(false);
  const [note, setNote]             = useState(setEntry.adminNote || "");

  const items  = useMemo(() => setEntry.items || [], [setEntry.items]);
  const item   = items[activeItem];
  const gender = item?.gender || "female";
  const isRig  = items.some((it) => it.format === "rig");
  const rigItems = useMemo(() => items.filter((it) => it.format === "rig"), [items]);
  const { garments, error: garmentError } = useSubmissionGarments(rigItems);
  const notReady = rigItems.some((it) => it.atlasStatus !== "ready");

  // Build all current variant URLs for the avatar (first variant of each item)
  const avatarUrls = items.map((it) => it.variants[variantIdx]?.imageUrl).filter(Boolean);

  const handleStatus = async (status) => {
    setBusy(true);
    try {
      await updateSetStatus(setEntry.setCode, status, note);
      onSetStatusChange(setEntry.setCode, status);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <InspectorBox>
      <SetBanner>Set — {items.length} items</SetBanner>
      <InspectorInner>
        {isRig
          ? <RigPreview garments={garments} note={garmentError || (notReady ? "Some atlases aren't packed yet" : null)} />
          : <AvatarCanvas gender={gender} itemImageUrls={avatarUrls} />}

        <SetItemTabs>
          {items.map((it, i) => (
            <SetTab key={i} $active={i === activeItem} onClick={() => { setActiveItem(i); setVariantIdx(0); }}>
              <span>{it.category}</span>
              <small>{it.subcategory}</small>
            </SetTab>
          ))}
        </SetItemTabs>

        <SidePanel>
          {item && (
            <>
              <ControlGroup>
                <ControlLabel>{item.name} — {item.category}/{item.subcategory}</ControlLabel>
                <GenderTag>{gender === "male" ? "Male" : "Female"}</GenderTag>
              </ControlGroup>

              {item.format === "rig" ? (
                <AtlasInfo submission={item} onUpdated={onUpdated} />
              ) : (
                <ControlGroup>
                  <ControlLabel>Variants (click to preview on avatar)</ControlLabel>
                  <ThumbRow>
                    {item.variants.map((v, i) => (
                      <ThumbBtn key={i} $active={i === variantIdx} onClick={() => setVariantIdx(i)}>
                        {v.thumbnailUrl
                          ? <ThumbImg src={v.thumbnailUrl} alt={`variant ${i + 1}`} />
                          : <ThumbPlaceholder>{i + 1}</ThumbPlaceholder>}
                      </ThumbBtn>
                    ))}
                  </ThumbRow>
                </ControlGroup>
              )}
            </>
          )}

          <ControlGroup>
            <ControlLabel>Admin note (optional)</ControlLabel>
            <NoteInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Leave feedback for the creator…"
              maxLength={500}
            />
          </ControlGroup>

          <ActionRow>
            <ApproveBtn
              disabled={busy || setEntry.status === "approved" || notReady}
              title={notReady ? "Waiting for every atlas to be packed" : ""}
              onClick={() => handleStatus("approved")}
            >
              {setEntry.status === "approved" ? "✓ Approved" : "Approve Set"}
            </ApproveBtn>
            <DeclineBtn disabled={busy || setEntry.status === "declined"} onClick={() => handleStatus("declined")}>
              {setEntry.status === "declined" ? "✗ Declined" : "Decline Set"}
            </DeclineBtn>
          </ActionRow>
        </SidePanel>
      </InspectorInner>
    </InspectorBox>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLOR = { pending: "#f59e0b", approved: "#22c55e", declined: "#ef4444" };
function StatusBadge({ status }) {
  return <Badge style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}>{status}</Badge>;
}

// ── Row for a single submission ───────────────────────────────────────────────
function contentsLabel(sub) {
  if (sub.format === "rig") {
    const s = sub.atlasStatus || "queued";
    return <span style={{ color: ATLAS_COLOR[s] }}>{sub.parts.length} parts · {ATLAS_LABEL[s].replace("Atlas ", "")}</span>;
  }
  return <Gray>{sub.variants.length} variant{sub.variants.length !== 1 ? "s" : ""}</Gray>;
}

function SingleRow({ sub, expanded, onToggle, onStatusChange, onUpdated }) {
  return (
    <>
      <tr style={{ cursor: "pointer" }} onClick={() => onToggle(sub.id)}>
        <Td>
          {sub.thumbnailUrl
            ? <ItemImg src={sub.thumbnailUrl} alt={sub.name} />
            : <NoImg />}
        </Td>
        <Td><strong>{sub.name}</strong></Td>
        <Td><Gray>{sub.category} / {sub.subcategory}</Gray></Td>
        <Td>{contentsLabel(sub)}</Td>
        <Td><Gray>{sub.uploadedBy?.name || sub.uploadedBy?.email || "—"}</Gray></Td>
        <Td><Gray>{new Date(sub.createdAt).toLocaleDateString()}</Gray></Td>
        <Td><StatusBadge status={sub.status} /></Td>
        <Td><ExpandIcon>{expanded ? "▲" : "▼"}</ExpandIcon></Td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <SingleInspector submission={sub} onStatusChange={onStatusChange} onUpdated={onUpdated} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Row for a set ─────────────────────────────────────────────────────────────
function SetRow({ setEntry, expanded, onToggle, onSetStatusChange, onUpdated }) {
  const items = setEntry.items || [];
  const isRig = items.some((it) => it.format === "rig");
  const packed = items.filter((it) => it.atlasStatus === "ready").length;
  return (
    <>
      <tr style={{ cursor: "pointer" }} onClick={() => onToggle(setEntry.setCode)}>
        <Td>
          <ThumbStack>
            {items.slice(0, 3).map((it, i) => (
              it.thumbnailUrl
                ? <StackImg key={i} src={it.thumbnailUrl} style={{ zIndex: 3 - i, left: i * 10 }} />
                : null
            ))}
          </ThumbStack>
        </Td>
        <Td>
          <strong>Set</strong>
          <SetItemNames>{(setEntry.items || []).map((it) => it.name).join(", ")}</SetItemNames>
        </Td>
        <Td><SetBadge>{items.length} items</SetBadge></Td>
        <Td>
          {isRig
            ? <Gray>{packed}/{items.length} atlases packed</Gray>
            : <Gray>{items.reduce((n, it) => n + it.variants.length, 0)} variants</Gray>}
        </Td>
        <Td><Gray>{setEntry.uploadedBy?.name || setEntry.uploadedBy?.email || "—"}</Gray></Td>
        <Td><Gray>{new Date(setEntry.createdAt).toLocaleDateString()}</Gray></Td>
        <Td><StatusBadge status={setEntry.status} /></Td>
        <Td><ExpandIcon>{expanded ? "▲" : "▼"}</ExpandIcon></Td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <SetInspector setEntry={setEntry} onSetStatusChange={onSetStatusChange} onUpdated={onUpdated} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function Submissions() {
  const [data, setData]           = useState({ submissions: [], total: 0 });
  const [statusFilter, setStatus] = useState("pending");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getSubmissions({ status: statusFilter, page, limit: LIMIT });
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = (id, status) => {
    setData((d) => ({
      ...d,
      submissions: d.submissions.map((s) => s.id === id ? { ...s, status } : s),
    }));
  };

  const handleSetStatusChange = (setCode, status) => {
    setData((d) => ({
      ...d,
      submissions: d.submissions.map((s) =>
        s.isSet && s.setCode === setCode ? { ...s, status, items: s.items.map((it) => ({ ...it, status })) } : s
      ),
    }));
  };

  const handleUpdated = (updated) => {
    setData((d) => ({
      ...d,
      submissions: d.submissions.map((s) => s.isSet
        ? { ...s, items: s.items.map((it) => (it.id === updated.id ? updated : it)) }
        : s.id === updated.id ? updated : s),
    }));
  };

  // Keep atlas status live while the worker is packing.
  const anyPacking = data.submissions.some((s) => (s.isSet ? s.items.some(isPacking) : isPacking(s)));
  useEffect(() => {
    if (!anyPacking) return;
    const id = setInterval(() => {
      getSubmissions({ status: statusFilter, page, limit: LIMIT }).then(setData).catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [anyPacking, statusFilter, page]);

  const toggle = (key) => setExpanded((e) => (e === key ? null : key));
  const totalPages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <Page>
      <Header>
        <PageTitle>Submissions <Count>({data.total.toLocaleString()})</Count></PageTitle>
        <Filters>
          <FilterSelect value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); setExpanded(null); }}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="">All</option>
          </FilterSelect>
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
              <Th>Contents</Th>
              <Th>Creator</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8}><Center>Loading…</Center></td></tr>}
            {!loading && data.submissions.length === 0 && (
              <tr><td colSpan={8}><Center>No submissions found.</Center></td></tr>
            )}
            {data.submissions.map((sub) =>
              sub.isSet
                ? <SetRow    key={sub.setCode} setEntry={sub} expanded={expanded === sub.setCode} onToggle={toggle} onSetStatusChange={handleSetStatusChange} onUpdated={handleUpdated} />
                : <SingleRow key={sub.id}      sub={sub}      expanded={expanded === sub.id}      onToggle={toggle} onStatusChange={handleStatusChange} onUpdated={handleUpdated} />
            )}
          </tbody>
        </Table>
      </TableWrap>

      <Pagination>
        <PgBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</PgBtn>
        <PgInfo>Page {page} / {totalPages}</PgInfo>
        <PgBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PgBtn>
      </Pagination>
    </Page>
  );
}

/* ── Styles ── */
const Page        = styled.div``;
const Header      = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;`;
const PageTitle   = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;flex-shrink:0;`;
const Count       = styled.span`font-size:16px;font-weight:400;color:#666;`;
const Filters     = styled.div`display:flex;gap:10px;margin-left:auto;align-items:center;`;
const ErrMsg      = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const TableWrap   = styled.div`overflow-x:auto;`;
const Table       = styled.table`width:100%;border-collapse:collapse;font-size:13px;`;
const Th          = styled.th`text-align:left;padding:10px 12px;border-bottom:1px solid #ffffff12;color:#666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;`;
const Td          = styled.td`padding:10px 12px;border-bottom:1px solid #ffffff08;color:#ccc;vertical-align:middle;`;
const ItemImg     = styled.img`width:48px;height:48px;object-fit:contain;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const NoImg       = styled.div`width:48px;height:48px;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const Gray        = styled.span`color:#555;`;
const Center      = styled.div`text-align:center;padding:30px;color:#555;`;
const Pagination  = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn       = styled.button`padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:13px;cursor:pointer;&:disabled{opacity:0.3;cursor:not-allowed;}&:hover:not(:disabled){background:rgba(255,255,255,0.06);}`;
const PgInfo      = styled.span`font-size:13px;color:#666;`;
const ExpandIcon  = styled.span`color:#555;font-size:11px;`;
const Badge       = styled.span`padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;`;
const FilterSelect= styled.select`padding:8px 10px;border-radius:8px;border:1px solid #ffffff18;background:#1c1c22;color:#fff;font-size:13px;outline:none;&:focus{border-color:#7b2ff7;}`;

// Set row
const ThumbStack    = styled.div`position:relative;width:68px;height:48px;`;
const StackImg      = styled.img`position:absolute;width:40px;height:40px;object-fit:contain;background:#111;border-radius:5px;border:1px solid #ffffff12;`;
const SetItemNames  = styled.div`font-size:11px;color:#555;margin-top:2px;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const SetBadge      = styled.span`padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(123,47,247,0.18);color:#c4a1ff;border:1px solid rgba(123,47,247,0.3);`;

// Inspector shared
const InspectorBox   = styled.div`background:#111118;border-top:1px solid #7b2ff722;border-bottom:1px solid #7b2ff722;`;
const SetBanner      = styled.div`padding:10px 32px;font-size:12px;font-weight:700;color:#c4a1ff;background:rgba(123,47,247,0.08);border-bottom:1px solid #7b2ff718;letter-spacing:0.3px;text-transform:uppercase;`;
const InspectorInner = styled.div`display:flex;gap:24px;padding:24px 32px;align-items:flex-start;flex-wrap:wrap;`;
const SidePanel      = styled.div`display:flex;flex-direction:column;gap:16px;min-width:220px;flex:1;`;
const ControlGroup   = styled.div`display:flex;flex-direction:column;gap:8px;`;
const ControlLabel   = styled.div`font-size:11px;font-weight:600;color:#777;text-transform:uppercase;letter-spacing:0.4px;`;
const GenderTag      = styled.span`display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(123,47,247,0.2);color:#c4a1ff;border:1px solid rgba(123,47,247,0.4);text-transform:capitalize;`;

// Variant thumbnails
const ThumbRow = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const ThumbBtn = styled.button`
  padding:0;background:transparent;border:2px solid ${(p) => p.$active ? "#7b2ff7" : "#ffffff18"};
  border-radius:7px;cursor:pointer;overflow:hidden;width:52px;height:52px;
  transition:border-color 0.15s;
  &:hover{border-color:#7b2ff7;}
`;
const ThumbImg         = styled.img`width:100%;height:100%;object-fit:contain;display:block;background:#111;`;
const ThumbPlaceholder = styled.div`width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px;color:#555;background:#111;`;

// Set item tabs
const SetItemTabs = styled.div`display:flex;flex-direction:column;gap:6px;min-width:140px;`;
const SetTab      = styled.button`
  padding:8px 12px;border-radius:8px;cursor:pointer;text-align:left;
  border:1px solid ${(p) => p.$active ? "rgba(123,47,247,0.7)" : "#ffffff12"};
  background:${(p) => p.$active ? "rgba(123,47,247,0.2)" : "transparent"};
  color:${(p) => p.$active ? "#c4a1ff" : "#888"};
  display:flex;flex-direction:column;gap:2px;
  span{font-size:13px;font-weight:600;text-transform:capitalize;}
  small{font-size:11px;opacity:0.7;}
  &:hover{border-color:#7b2ff7;color:#c4a1ff;}
`;

const NoteInput   = styled.textarea`
  background:rgba(255,255,255,0.03);border:1px solid #ffffff15;border-radius:8px;
  color:#ccc;font-size:13px;padding:8px 10px;resize:vertical;min-height:60px;
  outline:none;font-family:inherit;
  &:focus{border-color:#7b2ff7;}
`;
const ActionRow   = styled.div`display:flex;gap:10px;margin-top:auto;`;
const ApproveBtn  = styled.button`
  flex:1;padding:9px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;
  border:1px solid rgba(34,197,94,0.5);background:rgba(34,197,94,0.15);color:#4ade80;
  &:hover:not(:disabled){background:rgba(34,197,94,0.3);}
  &:disabled{opacity:0.45;cursor:not-allowed;}
`;
const DeclineBtn  = styled.button`
  flex:1;padding:9px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;
  border:1px solid rgba(239,68,68,0.5);background:rgba(239,68,68,0.12);color:#f87171;
  &:hover:not(:disabled){background:rgba(239,68,68,0.28);}
  &:disabled{opacity:0.45;cursor:not-allowed;}
`;

// Avatar canvas wrapper
const AvatarWrap     = styled.div`display:flex;flex-direction:column;align-items:center;gap:10px;`;
const CanvasControls = styled.div`display:flex;align-items:center;gap:10px;`;
const TurnBtn        = styled.button`padding:5px 12px;border-radius:6px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:14px;cursor:pointer;&:hover{background:rgba(255,255,255,0.08);}`;
const DirLabel       = styled.span`font-size:12px;color:#777;min-width:40px;text-align:center;text-transform:capitalize;`;
const ModeToggle     = styled.div`display:flex;gap:6px;`;
const ModeBtn        = styled.button`
  padding:5px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p) => p.$active ? "rgba(123,47,247,0.8)" : "#ffffff18"};
  background:${(p) => p.$active ? "rgba(123,47,247,0.35)" : "transparent"};
  color:${(p) => p.$active ? "#c4a1ff" : "#666"};
  &:hover{border-color:#7b2ff7;color:#c4a1ff;}
`;

// Rig atlas info
const AtlasLine  = styled.div`display:flex;align-items:center;gap:10px;font-size:12px;flex-wrap:wrap;
  a{color:#c4a1ff;font-weight:600;text-decoration:none;&:hover{text-decoration:underline;}}`;
const AtlasState = styled.span`font-weight:700;`;
const AtlasErr   = styled.div`font-size:12px;color:#ff8a8a;line-height:1.4;`;
const RepackBtn  = styled.button`
  padding:3px 10px;border-radius:6px;border:1px solid #ffffff20;background:transparent;color:#ccc;font-size:11px;cursor:pointer;
  &:hover:not(:disabled){border-color:#7b2ff7;color:#c4a1ff;}&:disabled{opacity:0.4;}
`;
const PartList = styled.div`display:flex;flex-wrap:wrap;gap:4px;`;
const PartLink = styled.a`
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;color:#999;
  padding:2px 6px;border-radius:5px;background:#ffffff08;text-decoration:none;
  &:hover{color:#c4a1ff;}
`;
