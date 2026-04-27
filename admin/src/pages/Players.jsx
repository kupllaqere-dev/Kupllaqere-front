import { useEffect, useState, useCallback } from "react";
import { getPlayers, updatePlayer, deletePlayer } from "../api/admin";
import styled from "styled-components";

const LIMIT = 20;

export default function Players() {
  const [data, setData]       = useState({ players: [], total: 0 });
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [editing, setEditing] = useState(null); // player being edited
  const [busy, setBusy]       = useState(false);
  const [confirm, setConfirm] = useState(null); // id to delete

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlayers({ search, page, limit: LIMIT });
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const patch = async (id, update) => {
    setBusy(true);
    try {
      await updatePlayer(id, update);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await deletePlayer(id);
      setConfirm(null);
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
        <PageTitle>Players <Count>({data.total.toLocaleString()})</Count></PageTitle>
        <SearchInput
          placeholder="Search by name or email…"
          value={search}
          onChange={handleSearch}
        />
      </Header>

      {error && <ErrMsg>{error}</ErrMsg>}

      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Coins</Th>
              <Th>Gems</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8}><Center>Loading…</Center></td></tr>
            )}
            {!loading && data.players.length === 0 && (
              <tr><td colSpan={8}><Center>No players found.</Center></td></tr>
            )}
            {data.players.map((p) => (
              <tr key={p.id}>
                <Td>
                  <NameCell>
                    {p.isOnline && <OnlineDot title="Online" />}
                    <strong>{p.name || <Gray>—</Gray>}</strong>
                    {p.isGuest && <Badge $color="#666">guest</Badge>}
                  </NameCell>
                </Td>
                <Td><Gray>{p.email || "—"}</Gray></Td>
                <Td>
                  <RolePips>
                    {(p.roles ?? [p.role]).map((r) => (
                      <Badge key={r} $color={r === "admin" ? "#7b2ff7" : r === "creator" ? "#f97316" : "#444"}>
                        {r}
                      </Badge>
                    ))}
                  </RolePips>
                </Td>
                <Td>
                  {p.isBanned
                    ? <Badge $color="#cc3333">banned</Badge>
                    : <Badge $color="#2a5c2a">active</Badge>}
                </Td>
                <Td>{p.coins ?? 0}</Td>
                <Td>{p.gems ?? 0}</Td>
                <Td><Gray>{new Date(p.createdAt).toLocaleDateString()}</Gray></Td>
                <Td>
                  <Actions>
                    <Btn onClick={() => setEditing(p)}>Edit</Btn>
                    <Btn
                      $danger={!p.isBanned}
                      $warn={p.isBanned}
                      disabled={busy}
                      onClick={() => patch(p.id, { isBanned: !p.isBanned })}
                    >
                      {p.isBanned ? "Unban" : "Ban"}
                    </Btn>
                    <Btn $danger disabled={busy} onClick={() => setConfirm(p.id)}>
                      Delete
                    </Btn>
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

      {/* Edit modal */}
      {editing && (
        <Modal onClick={() => setEditing(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Edit — {editing.name || editing.email}</ModalTitle>
            <EditForm
              player={editing}
              busy={busy}
              onSave={async (update) => {
                await patch(editing.id, update);
                setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          </ModalCard>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {confirm && (
        <Modal onClick={() => setConfirm(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete player?</ModalTitle>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 20px" }}>
              This cannot be undone.
            </p>
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

const ALL_ROLES = ["player", "admin", "creator"];
const ROLE_COLOR = { admin: "#7b2ff7", creator: "#f97316", player: "#444" };

function EditForm({ player, busy, onSave, onClose }) {
  const [name, setName]   = useState(player.name || "");
  const [roles, setRoles] = useState(() => player.roles ?? [player.role ?? "player"]);
  const [coins, setCoins] = useState(player.coins ?? 0);
  const [gems, setGems]   = useState(player.gems ?? 0);

  const toggleRole = (r) => {
    setRoles((prev) => {
      if (r === "player") return prev; // player is always included
      return prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r];
    });
  };

  const save = () => {
    const finalRoles = roles.includes("player") ? roles : ["player", ...roles];
    onSave({ name, roles: finalRoles, coins: Number(coins), gems: Number(gems) });
  };

  return (
    <>
      <FieldRow>
        <FieldLabel>Name</FieldLabel>
        <FieldInput value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Roles</FieldLabel>
        <RoleCheckboxes>
          {ALL_ROLES.map((r) => (
            <RoleCheck key={r} $color={ROLE_COLOR[r]}>
              <input
                type="checkbox"
                checked={roles.includes(r)}
                disabled={r === "player"}
                onChange={() => toggleRole(r)}
              />
              {r}
            </RoleCheck>
          ))}
        </RoleCheckboxes>
      </FieldRow>
      <FieldRow>
        <FieldLabel>Coins</FieldLabel>
        <FieldInput type="number" value={coins} onChange={(e) => setCoins(e.target.value)} min={0} />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Gems</FieldLabel>
        <FieldInput type="number" value={gems} onChange={(e) => setGems(e.target.value)} min={0} />
      </FieldRow>
      <Actions style={{ marginTop: 20 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn $primary disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</Btn>
      </Actions>
    </>
  );
}

/* ── Styles ── */
const Page = styled.div``;
const Header = styled.div`display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap;`;
const PageTitle = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;`;
const Count = styled.span`font-size:16px;font-weight:400;color:#666;`;
const SearchInput = styled.input`
  margin-left:auto;padding:8px 12px;border-radius:8px;
  border:1px solid #ffffff18;background:rgba(255,255,255,0.04);
  color:#fff;font-size:13px;width:240px;outline:none;
  &:focus{border-color:#7b2ff7;}
  &::placeholder{color:#444;}
`;
const ErrMsg = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const TableWrap = styled.div`overflow-x:auto;`;
const Table = styled.table`
  width:100%;border-collapse:collapse;font-size:13px;
`;
const Th = styled.th`
  text-align:left;padding:10px 12px;
  border-bottom:1px solid #ffffff12;
  color:#666;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;
`;
const Td = styled.td`
  padding:10px 12px;border-bottom:1px solid #ffffff08;color:#ccc;vertical-align:middle;
`;
const NameCell = styled.div`display:flex;align-items:center;gap:8px;`;
const OnlineDot = styled.span`
  width:8px;height:8px;border-radius:50%;background:#55cc88;flex-shrink:0;
`;
const Badge = styled.span`
  font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;
  background:${(p)=>p.$color};color:#fff;text-transform:uppercase;letter-spacing:0.3px;
`;
const Gray = styled.span`color:#555;`;
const Actions = styled.div`display:flex;gap:6px;flex-wrap:wrap;`;
const Btn = styled.button`
  padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;
  border:1px solid ${(p)=>p.$danger?"rgba(255,80,80,0.4)":p.$warn?"rgba(255,170,68,0.4)":p.$primary?"rgba(123,47,247,0.8)":"#ffffff18"};
  background:${(p)=>p.$danger?"rgba(255,80,80,0.12)":p.$warn?"rgba(255,170,68,0.12)":p.$primary?"rgba(123,47,247,0.6)":"transparent"};
  color:${(p)=>p.$danger?"#ff8a8a":p.$warn?"#ffaa44":p.$primary?"#fff":"#ccc"};
  &:disabled{opacity:0.4;cursor:not-allowed;}
  &:hover:not(:disabled){opacity:0.8;}
`;
const Center = styled.div`text-align:center;padding:30px;color:#555;`;
const Pagination = styled.div`display:flex;align-items:center;gap:12px;margin-top:20px;`;
const PgBtn = styled.button`
  padding:6px 14px;border-radius:7px;border:1px solid #ffffff18;
  background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:disabled{opacity:0.3;cursor:not-allowed;}
  &:hover:not(:disabled){background:rgba(255,255,255,0.06);}
`;
const PgInfo = styled.span`font-size:13px;color:#666;`;
const Modal = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;
  display:flex;align-items:center;justify-content:center;
`;
const ModalCard = styled.div`
  background:#1c1c22;border:1px solid #ffffff18;border-radius:14px;padding:28px;width:380px;
`;
const ModalTitle = styled.h3`color:#fff;font-size:17px;margin:0 0 16px;`;
const FieldRow = styled.div`display:flex;flex-direction:column;gap:4px;margin-bottom:12px;`;
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
const RolePips = styled.div`display:flex;gap:4px;flex-wrap:wrap;`;
const RoleCheckboxes = styled.div`display:flex;flex-direction:column;gap:8px;margin-top:4px;`;
const RoleCheck = styled.label`
  display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;
  color:${(p) => p.$color};font-weight:600;text-transform:capitalize;
  input{cursor:pointer;accent-color:${(p) => p.$color};width:15px;height:15px;}
  &:has(input:disabled){opacity:0.45;cursor:not-allowed;}
`;
