import { useEffect, useState, useCallback } from "react";
import { getMail, deleteMail } from "../api/admin";
import styled from "styled-components";

const LIMIT = 20;

export default function Mail() {
  const [data, setData]       = useState({ mail: [], total: 0 });
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [viewing, setViewing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMail({ page, limit: LIMIT });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    setBusy(true);
    try {
      await deleteMail(id);
      setConfirm(null);
      if (viewing?.id === id) setViewing(null);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / LIMIT));

  return (
    <Page>
      <Header>
        <PageTitle>Mail <Count>({data.total.toLocaleString()})</Count></PageTitle>
      </Header>

      {error && <ErrMsg>{error}</ErrMsg>}

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>From</Th>
              <Th>To</Th>
              <Th>Subject</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}><Center>Loading…</Center></td></tr>}
            {!loading && data.mail.length === 0 && <tr><td colSpan={5}><Center>No mail found.</Center></td></tr>}
            {data.mail.map((m) => (
              <tr key={m.id}>
                <Td><strong>{m.from?.name || m.from?.email || "—"}</strong></Td>
                <Td><Gray>{m.to?.name || m.to?.email || "—"}</Gray></Td>
                <Td>{m.subject}</Td>
                <Td><Gray>{new Date(m.createdAt).toLocaleDateString()}</Gray></Td>
                <Td>
                  <Actions>
                    <Btn onClick={() => setViewing(m)}>Read</Btn>
                    <Btn $danger onClick={() => setConfirm(m.id)}>Delete</Btn>
                  </Actions>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <Pagination>
        <PgBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</PgBtn>
        <PgInfo>Page {page} / {totalPages}</PgInfo>
        <PgBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</PgBtn>
      </Pagination>

      {/* Read modal */}
      {viewing && (
        <Modal onClick={() => setViewing(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalMeta>
              <span>From: <strong>{viewing.from?.name || viewing.from?.email}</strong></span>
              <span>To: <strong>{viewing.to?.name || viewing.to?.email}</strong></span>
              <span style={{ color: "#555", fontSize: 12 }}>{new Date(viewing.createdAt).toLocaleString()}</span>
            </ModalMeta>
            <ModalTitle>{viewing.subject}</ModalTitle>
            <MailBody>{viewing.body}</MailBody>
            <Actions style={{ marginTop: 20 }}>
              <Btn onClick={() => setViewing(null)}>Close</Btn>
              <Btn $danger disabled={busy} onClick={() => setConfirm(viewing.id)}>Delete</Btn>
            </Actions>
          </ModalCard>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirm && (
        <Modal onClick={() => setConfirm(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete this mail?</ModalTitle>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 20px" }}>This cannot be undone.</p>
            <Actions>
              <Btn onClick={() => setConfirm(null)}>Cancel</Btn>
              <Btn $danger disabled={busy} onClick={() => remove(confirm)}>
                {busy ? "Deleting…" : "Delete"}
              </Btn>
            </Actions>
          </ModalCard>
        </Modal>
      )}
    </Page>
  );
}

const Page = styled.div``;
const Header = styled.div`display:flex;align-items:center;gap:12px;margin-bottom:20px;`;
const PageTitle = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;`;
const Count = styled.span`font-size:16px;font-weight:400;color:#666;`;
const ErrMsg = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const TableWrap = styled.div`overflow-x:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;font-size:13px;`;
const Th = styled.th`text-align:left;padding:10px 12px;border-bottom:1px solid #ffffff12;color:#666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;`;
const Td = styled.td`padding:10px 12px;border-bottom:1px solid #ffffff08;color:#ccc;vertical-align:middle;`;
const Gray = styled.span`color:#555;`;
const Actions = styled.div`display:flex;gap:6px;`;
const Btn = styled.button`
  padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p)=>p.$danger?"rgba(255,80,80,0.4)":"#ffffff18"};
  background:${(p)=>p.$danger?"rgba(255,80,80,0.12)":"transparent"};
  color:${(p)=>p.$danger?"#ff8a8a":"#ccc"};
  &:disabled{opacity:0.4;cursor:not-allowed;}&:hover:not(:disabled){opacity:0.8;}
`;
const Center = styled.div`text-align:center;padding:30px;color:#555;`;
const Pagination = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn = styled.button`
  padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;
  background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:disabled{opacity:0.3;cursor:not-allowed;}&:hover:not(:disabled){background:rgba(255,255,255,0.06);}
`;
const PgInfo = styled.span`font-size:13px;color:#666;`;
const Modal = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;
const ModalCard = styled.div`background:#1c1c22;border:1px solid #ffffff18;border-radius:14px;padding:28px;width:500px;max-height:90vh;overflow-y:auto;`;
const ModalMeta = styled.div`display:flex;flex-direction:column;gap:4px;font-size:12px;color:#888;margin-bottom:12px;`;
const ModalTitle = styled.h3`color:#fff;font-size:17px;margin:0 0 12px;`;
const MailBody = styled.pre`
  white-space:pre-wrap;font-family:inherit;font-size:13px;color:#bbb;
  background:rgba(255,255,255,0.03);border-radius:8px;padding:14px;
  border:1px solid #ffffff0a;line-height:1.6;
`;
