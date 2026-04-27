import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getMySubmissions, updateSubmission, reuploadVariant, deleteVariant } from "../api/creator";

const STATUS_COLOR = { pending: "#f59e0b", approved: "#22c55e", declined: "#ef4444" };

function StatusBadge({ status }) {
  return <Badge style={{ background: `${STATUS_COLOR[status]}22`, color: STATUS_COLOR[status] }}>{status}</Badge>;
}

// ── Edit modal for a single submission ───────────────────────────────────────
function EditModal({ submission, onClose, onSaved }) {
  const [name, setName]     = useState(submission.name);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const fileInputRefs       = useRef([]);

  const saveInfo = async () => {
    setBusy(true); setError(null);
    try {
      const updated = await updateSubmission(submission.id, { name });
      onSaved(updated.submission);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const reupload = async (idx, file) => {
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await reuploadVariant(submission.id, idx, fd);
      onSaved({ ...submission, variants: submission.variants.map((v, i) => i === idx ? { ...v, ...res.variant } : v) });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const removeVariant = async (idx) => {
    if (!confirm("Remove this variant?")) return;
    setBusy(true); setError(null);
    try {
      await deleteVariant(submission.id, idx);
      onSaved({ ...submission, variants: submission.variants.filter((_, i) => i !== idx) });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const isApproved = submission.status === "approved";

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <ModalTitle>Edit Submission</ModalTitle>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </ModalHeader>

        <ModalBody>
          <FieldGroup>
            <FieldLabel>Name</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              disabled={isApproved}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Category</FieldLabel>
            <InfoText>{submission.category} / {submission.subcategory}</InfoText>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Variants</FieldLabel>
            <VariantList>
              {submission.variants.map((v, i) => (
                <VariantRow key={i}>
                  {v.thumbnailUrl
                    ? <VarThumb src={v.thumbnailUrl} alt={`variant ${i + 1}`} />
                    : <VarPlaceholder>{i + 1}</VarPlaceholder>}
                  <VarActions>
                    {!isApproved && (
                      <>
                        <VarBtn
                          onClick={() => {
                            const inp = document.createElement("input");
                            inp.type = "file"; inp.accept = ".png";
                            inp.onchange = (e) => { if (e.target.files[0]) reupload(i, e.target.files[0]); };
                            inp.click();
                          }}
                          disabled={busy}
                        >Reupload</VarBtn>
                        {submission.variants.length > 1 && (
                          <VarBtn $danger onClick={() => removeVariant(i)} disabled={busy}>Remove</VarBtn>
                        )}
                      </>
                    )}
                  </VarActions>
                </VariantRow>
              ))}
            </VariantList>
          </FieldGroup>

          {submission.adminNote && (
            <FieldGroup>
              <FieldLabel>Admin note</FieldLabel>
              <AdminNote>{submission.adminNote}</AdminNote>
            </FieldGroup>
          )}

          {error && <ErrMsg>{error}</ErrMsg>}
        </ModalBody>

        <ModalFooter>
          <CancelBtn onClick={onClose}>Cancel</CancelBtn>
          {!isApproved && (
            <SaveBtn onClick={saveInfo} disabled={busy}>{busy ? "Saving…" : "Save name"}</SaveBtn>
          )}
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}

// ── Set edit view ─────────────────────────────────────────────────────────────
function SetEditModal({ setEntry, onClose, onSaved }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [names, setNames]         = useState(setEntry.items.map((it) => it.name));
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState(null);

  const isApproved = setEntry.status === "approved";
  const item       = setEntry.items[activeIdx];

  const saveName = async () => {
    setBusy(true); setError(null);
    try {
      const updated = await updateSubmission(item.id, { name: names[activeIdx] });
      const newItems = setEntry.items.map((it, i) => i === activeIdx ? { ...it, name: names[activeIdx] } : it);
      onSaved({ ...setEntry, items: newItems });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const reupload = async (varIdx, file) => {
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await reuploadVariant(item.id, varIdx, fd);
      const newItems = setEntry.items.map((it, i) =>
        i === activeIdx ? { ...it, variants: it.variants.map((v, vi) => vi === varIdx ? { ...v, ...res.variant } : v) } : it
      );
      onSaved({ ...setEntry, items: newItems });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal style={{ maxWidth: 640 }}>
        <ModalHeader>
          <ModalTitle>Edit Set</ModalTitle>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </ModalHeader>
        <ModalBody>
          <ItemTabs>
            {setEntry.items.map((it, i) => (
              <ItemTab key={i} $active={i === activeIdx} onClick={() => setActiveIdx(i)}>
                <span>{i + 1}</span>
                <small style={{ textTransform: "capitalize" }}>{it.category}</small>
              </ItemTab>
            ))}
          </ItemTabs>

          {item && (
            <>
              <FieldGroup>
                <FieldLabel>Name for item {activeIdx + 1}</FieldLabel>
                <TextInput
                  value={names[activeIdx]}
                  onChange={(e) => { const n = [...names]; n[activeIdx] = e.target.value; setNames(n); }}
                  maxLength={40}
                  disabled={isApproved}
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Category</FieldLabel>
                <InfoText>{item.category} / {item.subcategory}</InfoText>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Variants (5 required)</FieldLabel>
                <VariantList>
                  {item.variants.map((v, vi) => (
                    <VariantRow key={vi}>
                      {v.thumbnailUrl
                        ? <VarThumb src={v.thumbnailUrl} alt={`variant ${vi + 1}`} />
                        : <VarPlaceholder>{vi + 1}</VarPlaceholder>}
                      {!isApproved && (
                        <VarBtn
                          onClick={() => {
                            const inp = document.createElement("input");
                            inp.type = "file"; inp.accept = ".png";
                            inp.onchange = (e) => { if (e.target.files[0]) reupload(vi, e.target.files[0]); };
                            inp.click();
                          }}
                          disabled={busy}
                        >Reupload</VarBtn>
                      )}
                    </VariantRow>
                  ))}
                </VariantList>
              </FieldGroup>
            </>
          )}

          {setEntry.adminNote && (
            <FieldGroup>
              <FieldLabel>Admin note</FieldLabel>
              <AdminNote>{setEntry.adminNote}</AdminNote>
            </FieldGroup>
          )}

          {error && <ErrMsg>{error}</ErrMsg>}
        </ModalBody>
        <ModalFooter>
          <CancelBtn onClick={onClose}>Close</CancelBtn>
          {!isApproved && (
            <SaveBtn onClick={saveName} disabled={busy}>{busy ? "Saving…" : "Save name"}</SaveBtn>
          )}
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function MySubmissions() {
  const [data, setData]         = useState({ submissions: [], total: 0 });
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [editing, setEditing]   = useState(null); // submission or set

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getMySubmissions({ status: statusFilter, page, limit: LIMIT });
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated) => {
    if (updated.isSet) {
      setData((d) => ({ ...d, submissions: d.submissions.map((s) => s.isSet && s.setCode === updated.setCode ? updated : s) }));
    } else {
      setData((d) => ({ ...d, submissions: d.submissions.map((s) => s.id === updated.id ? updated : s) }));
    }
    setEditing(null);
    load(); // refresh to get latest
  };

  const totalPages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <Page>
      <Header>
        <PageTitle>My Submissions <Count>({data.total})</Count></PageTitle>
        <Filters>
          <FilterSelect value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
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
              <Th>Type</Th>
              <Th>Category</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7}><Center>Loading…</Center></td></tr>}
            {!loading && data.submissions.length === 0 && (
              <tr><td colSpan={7}><Center>No submissions yet.</Center></td></tr>
            )}
            {data.submissions.map((sub) =>
              sub.isSet ? (
                <tr key={sub.setCode}>
                  <Td>
                    <ThumbStack>
                      {(sub.items || []).slice(0, 3).map((it, i) =>
                        it.variants[0]?.thumbnailUrl
                          ? <StackImg key={i} src={it.variants[0].thumbnailUrl} style={{ zIndex: 3 - i, left: i * 10 }} />
                          : null
                      )}
                    </ThumbStack>
                  </Td>
                  <Td>
                    <strong>Set</strong>
                    <SetNames>{(sub.items || []).map((it) => it.name).join(", ")}</SetNames>
                  </Td>
                  <Td><TypeBadge>Set · 5 items</TypeBadge></Td>
                  <Td><Gray>{(sub.items || []).map((it) => it.category).join(", ")}</Gray></Td>
                  <Td><Gray>{new Date(sub.createdAt).toLocaleDateString()}</Gray></Td>
                  <Td>
                    <StatusBadge status={sub.status} />
                    {sub.adminNote && <NoteIcon title={sub.adminNote}>💬</NoteIcon>}
                  </Td>
                  <Td>
                    {sub.status !== "approved" && (
                      <EditBtn onClick={() => setEditing(sub)}>Edit</EditBtn>
                    )}
                  </Td>
                </tr>
              ) : (
                <tr key={sub.id}>
                  <Td>
                    {sub.variants[0]?.thumbnailUrl
                      ? <ItemImg src={sub.variants[0].thumbnailUrl} alt={sub.name} />
                      : <NoImg />}
                  </Td>
                  <Td><strong>{sub.name}</strong></Td>
                  <Td><TypeBadge>Single</TypeBadge></Td>
                  <Td><Gray>{sub.category} / {sub.subcategory}</Gray></Td>
                  <Td><Gray>{new Date(sub.createdAt).toLocaleDateString()}</Gray></Td>
                  <Td>
                    <StatusBadge status={sub.status} />
                    {sub.adminNote && <NoteIcon title={sub.adminNote}>💬</NoteIcon>}
                  </Td>
                  <Td>
                    <EditBtn onClick={() => setEditing(sub)}>Edit</EditBtn>
                  </Td>
                </tr>
              )
            )}
          </tbody>
        </Table>
      </TableWrap>

      <Pagination>
        <PgBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</PgBtn>
        <PgInfo>Page {page} / {totalPages}</PgInfo>
        <PgBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PgBtn>
      </Pagination>

      {editing && editing.isSet && (
        <SetEditModal setEntry={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
      {editing && !editing.isSet && (
        <EditModal submission={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </Page>
  );
}

/* ── Styles ── */
const Page       = styled.div`padding:32px;`;
const Header     = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;`;
const PageTitle  = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;`;
const Count      = styled.span`font-size:16px;font-weight:400;color:#666;`;
const Filters    = styled.div`display:flex;gap:10px;margin-left:auto;`;
const ErrMsg     = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const TableWrap  = styled.div`overflow-x:auto;`;
const Table      = styled.table`width:100%;border-collapse:collapse;font-size:13px;`;
const Th         = styled.th`text-align:left;padding:10px 12px;border-bottom:1px solid #ffffff12;color:#666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;`;
const Td         = styled.td`padding:10px 12px;border-bottom:1px solid #ffffff08;color:#ccc;vertical-align:middle;`;
const ItemImg    = styled.img`width:48px;height:48px;object-fit:contain;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const NoImg      = styled.div`width:48px;height:48px;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const Gray       = styled.span`color:#555;font-size:12px;`;
const Center     = styled.div`text-align:center;padding:30px;color:#555;`;
const Pagination = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn      = styled.button`padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:13px;cursor:pointer;&:disabled{opacity:0.3;cursor:not-allowed;}&:hover:not(:disabled){background:rgba(255,255,255,0.06);}`;
const PgInfo     = styled.span`font-size:13px;color:#666;`;
const Badge      = styled.span`padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;`;
const FilterSelect = styled.select`padding:8px 10px;border-radius:8px;border:1px solid #ffffff18;background:#1c1c22;color:#fff;font-size:13px;outline:none;&:focus{border-color:#68cfee;}`;
const TypeBadge  = styled.span`padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(104,207,238,0.15);color:#a8e6f5;`;
const NoteIcon   = styled.span`margin-left:6px;cursor:help;`;
const EditBtn    = styled.button`padding:5px 12px;border-radius:6px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:12px;cursor:pointer;&:hover{background:rgba(255,255,255,0.08);color:#fff;}`;
const ThumbStack = styled.div`position:relative;width:68px;height:48px;`;
const StackImg   = styled.img`position:absolute;width:40px;height:40px;object-fit:contain;background:#111;border-radius:5px;border:1px solid #ffffff12;`;
const SetNames   = styled.div`font-size:11px;color:#555;margin-top:2px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;

// Modal
const Overlay    = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;`;
const Modal      = styled.div`background:#1c1c22;border:1px solid #ffffff15;border-radius:16px;width:100%;max-width:520px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;`;
const ModalHeader= styled.div`display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #ffffff0a;`;
const ModalTitle = styled.h3`font-size:18px;font-weight:700;color:#fff;margin:0;`;
const CloseBtn   = styled.button`background:transparent;border:none;color:#666;font-size:18px;cursor:pointer;&:hover{color:#fff;}`;
const ModalBody  = styled.div`padding:20px 24px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;`;
const ModalFooter= styled.div`padding:16px 24px;border-top:1px solid #ffffff0a;display:flex;gap:10px;justify-content:flex-end;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;`;
const FieldLabel = styled.label`font-size:11px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.4px;`;
const TextInput  = styled.input`background:rgba(255,255,255,0.04);border:1px solid #ffffff15;border-radius:8px;color:#fff;font-size:14px;padding:9px 12px;outline:none;&:focus{border-color:#68cfee;}&:disabled{opacity:0.5;}`;
const InfoText   = styled.div`font-size:13px;color:#777;text-transform:capitalize;`;
const AdminNote  = styled.div`font-size:13px;color:#f59e0b;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px 12px;`;
const VariantList= styled.div`display:flex;flex-direction:column;gap:8px;`;
const VariantRow = styled.div`display:flex;align-items:center;gap:10px;`;
const VarThumb   = styled.img`width:52px;height:52px;object-fit:contain;background:#111;border-radius:6px;border:1px solid #ffffff0a;`;
const VarPlaceholder = styled.div`width:52px;height:52px;background:#111;border-radius:6px;border:1px solid #ffffff0a;display:flex;align-items:center;justify-content:center;font-size:13px;color:#444;`;
const VarActions = styled.div`display:flex;gap:6px;`;
const VarBtn     = styled.button`
  padding:5px 10px;border-radius:6px;font-size:12px;cursor:pointer;
  border:1px solid ${(p) => p.$danger ? "rgba(239,68,68,0.4)" : "#ffffff18"};
  background:transparent;
  color:${(p) => p.$danger ? "#f87171" : "#ccc"};
  &:hover:not(:disabled){background:${(p) => p.$danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.08)"};}
  &:disabled{opacity:0.4;cursor:not-allowed;}
`;
const SaveBtn    = styled.button`padding:9px 20px;border-radius:8px;border:none;background:#68cfee;color:#fff;font-size:14px;font-weight:700;cursor:pointer;&:disabled{opacity:0.5;cursor:not-allowed;}&:hover:not(:disabled){opacity:0.85;}`;
const CancelBtn  = styled.button`padding:9px 20px;border-radius:8px;border:1px solid #ffffff18;background:transparent;color:#ccc;font-size:14px;cursor:pointer;&:hover{background:rgba(255,255,255,0.06);}`;
const ItemTabs   = styled.div`display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;`;
const ItemTab    = styled.button`padding:6px 12px;border-radius:7px;cursor:pointer;display:flex;gap:6px;align-items:center;border:1px solid ${(p) => p.$active ? "rgba(104,207,238,0.6)" : "#ffffff10"};background:${(p) => p.$active ? "rgba(104,207,238,0.15)" : "transparent"};color:${(p) => p.$active ? "#a8e6f5" : "#777"};span{font-size:12px;font-weight:700;}small{font-size:11px;}&:hover{border-color:#68cfee;color:#a8e6f5;}`;
