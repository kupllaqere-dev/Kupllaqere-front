import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  fetchFriends,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "../api/friends";
import PlayerThumbnail from "./PlayerThumbnail";

const TABS = [
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "received", label: "Invites Received" },
  { key: "sent", label: "Invites Sent" },
];

export default function FriendsModal({ onClose }) {
  const [data, setData] = useState({ friends: [], received: [], sent: [] });
  const [activeTab, setActiveTab] = useState("online");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchFriends()
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      await fetchFriends().then(setData);
    } catch {
      // ignore — keep current state
    } finally {
      setBusyId(null);
    }
  };

  const online = data.friends.filter((f) => f.online);
  const offline = data.friends.filter((f) => !f.online);

  const counts = {
    online: online.length,
    offline: offline.length,
    received: data.received.length,
    sent: data.sent.length,
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>&times;</CloseBtn>
        <Title>Friends</Title>

        <Tabs>
          {TABS.map((t) => (
            <Tab
              key={t.key}
              $active={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              <Count>{counts[t.key]}</Count>
            </Tab>
          ))}
        </Tabs>

        <List>
          {loading && <Empty>Loading...</Empty>}

          {!loading && activeTab === "online" && (
            online.length === 0 ? (
              <Empty>No friends online</Empty>
            ) : (
              online.map((f) => (
                <Row key={f.id}>
                  <Avatar>
                    <PlayerThumbnail outfit={f.outfit} gender={f.gender} />
                    <Dot $online />
                  </Avatar>
                  <NameCol>
                    <Name>{f.name || "Unknown"}</Name>
                    <Sub $online>Online</Sub>
                  </NameCol>
                  <Actions>
                    <DangerBtn
                      disabled={busyId === f.id}
                      onClick={() => run(f.id, () => removeFriend(f.id))}
                    >
                      Remove
                    </DangerBtn>
                  </Actions>
                </Row>
              ))
            )
          )}

          {!loading && activeTab === "offline" && (
            offline.length === 0 ? (
              <Empty>No offline friends</Empty>
            ) : (
              offline.map((f) => (
                <Row key={f.id}>
                  <Avatar>
                    <PlayerThumbnail outfit={f.outfit} gender={f.gender} />
                    <Dot />
                  </Avatar>
                  <NameCol>
                    <Name>{f.name || "Unknown"}</Name>
                    <Sub>Offline</Sub>
                  </NameCol>
                  <Actions>
                    <DangerBtn
                      disabled={busyId === f.id}
                      onClick={() => run(f.id, () => removeFriend(f.id))}
                    >
                      Remove
                    </DangerBtn>
                  </Actions>
                </Row>
              ))
            )
          )}

          {!loading && activeTab === "received" && (
            data.received.length === 0 ? (
              <Empty>No pending invites</Empty>
            ) : (
              data.received.map((f) => (
                <Row key={f.id}>
                  <Avatar>
                    <PlayerThumbnail outfit={f.outfit} gender={f.gender} />
                  </Avatar>
                  <NameCol>
                    <Name>{f.name || "Unknown"}</Name>
                    <Sub>Wants to be friends</Sub>
                  </NameCol>
                  <Actions>
                    <PrimaryBtn
                      disabled={busyId === f.id}
                      onClick={() => run(f.id, () => acceptFriendRequest(f.id))}
                    >
                      Accept
                    </PrimaryBtn>
                    <DangerBtn
                      disabled={busyId === f.id}
                      onClick={() => run(f.id, () => declineFriendRequest(f.id))}
                    >
                      Decline
                    </DangerBtn>
                  </Actions>
                </Row>
              ))
            )
          )}

          {!loading && activeTab === "sent" && (
            data.sent.length === 0 ? (
              <Empty>No outgoing invites</Empty>
            ) : (
              data.sent.map((f) => (
                <Row key={f.id}>
                  <Avatar>
                    <PlayerThumbnail outfit={f.outfit} gender={f.gender} />
                  </Avatar>
                  <NameCol>
                    <Name>{f.name || "Unknown"}</Name>
                    <Sub>Request pending</Sub>
                  </NameCol>
                  <Actions>
                    <DangerBtn
                      disabled={busyId === f.id}
                      onClick={() => run(f.id, () => cancelFriendRequest(f.id))}
                    >
                      Cancel
                    </DangerBtn>
                  </Actions>
                </Row>
              ))
            )
          )}
        </List>
      </Modal>
    </Overlay>
  );
}

/* ── Styles ── */

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
  padding: 28px;
  width: 520px;
  max-width: 94vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
  &:hover { color: #fff; }
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  background: ${(p) => (p.$active ? "linear-gradient(135deg, #7b2ff7, #c471ed)" : "#12121f")};
  border: 1px solid ${(p) => (p.$active ? "#7b2ff7" : "#ffffff22")};
  color: ${(p) => (p.$active ? "#fff" : "#aaa")};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &:hover {
    color: #fff;
    border-color: #7b2ff7;
  }
`;

const Count = styled.span`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 700;
`;

const List = styled.div`
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #12121f;
  border: 1px solid #ffffff15;
  border-radius: 10px;
  padding: 10px 12px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a3e, #1a1a2e);
  border: 1px solid #ffffff22;
  position: relative;
  flex-shrink: 0;

  canvas {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }
`;

const Dot = styled.span`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => (p.$online ? "#3fdd7c" : "#555")};
  border: 2px solid #12121f;
`;

const NameCol = styled.div`
  flex: 1;
  min-width: 0;
`;

const Name = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Sub = styled.div`
  font-size: 11px;
  color: ${(p) => (p.$online ? "#3fdd7c" : "#888")};
  margin-top: 2px;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
`;

const PrimaryBtn = styled.button`
  background: linear-gradient(135deg, #7b2ff7, #c471ed);
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const DangerBtn = styled.button`
  background: #2a1a1a;
  border: 1px solid #ff6b6b55;
  color: #ff8888;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: #3a2a2a;
    color: #ffaaaa;
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Empty = styled.div`
  text-align: center;
  color: #666;
  padding: 40px 0;
  font-size: 13px;
`;
