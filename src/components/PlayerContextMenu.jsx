import { useEffect, useState, forwardRef } from "react";
import styled from "styled-components";
import PlayerThumbnail from "./PlayerThumbnail";
import {
  fetchFriends,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "../api/friends";

const Menu = styled.div`
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 180px;
  background: #1a1a2eee;
  border: 1px solid #ffffff22;
  border-radius: 10px;
  padding: 14px 8px 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.65);
  transform: translate(14px, -50%);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding-bottom: 12px;
`;

const AvatarCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ffffff30;
  background: #0d0d1e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const PlayerName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 1.2;
`;

const Divider = styled.div`
  height: 1px;
  background: #ffffff18;
  margin-bottom: 6px;
`;

const Btn = styled.button`
  background: transparent;
  border: none;
  color: ${(p) => (p.$danger ? "#ff6b6b" : p.$muted ? "#666" : "#ccc")};
  font-size: 12px;
  padding: 7px 10px;
  text-align: left;
  border-radius: 6px;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  width: 100%;
  transition: background 0.1s, color 0.1s;

  &:hover:not(:disabled) {
    background: #ffffff12;
    color: ${(p) => (p.$danger ? "#ff9090" : "#fff")};
  }

  &:disabled {
    opacity: 0.45;
  }
`;

function deriveFriendStatus(data, targetUserId) {
  if (!data || !targetUserId) return "none";
  if (data.friends?.some((f) => f.id === targetUserId)) return "friends";
  if (data.sent?.some((r) => r.id === targetUserId)) return "i_sent";
  if (data.received?.some((r) => r.id === targetUserId)) return "they_sent";
  return "none";
}

const PlayerContextMenu = forwardRef(function PlayerContextMenu({
  playerMenu,
  onClose,
  onViewProfile,
  onOpenWhisper,
  playerManagerRef,
  layerManagerRef,
}, ref) {
  const [friendStatus, setFriendStatus] = useState("loading");
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (!playerMenu?.userId) {
      setFriendStatus("none");
      return;
    }
    let cancelled = false;
    fetchFriends()
      .then((data) => {
        if (!cancelled) setFriendStatus(deriveFriendStatus(data, playerMenu.userId));
      })
      .catch(() => {
        if (!cancelled) setFriendStatus("none");
      });
    return () => { cancelled = true; };
  }, [playerMenu?.userId]);

  function handleViewProfile() {
    const pm = playerManagerRef.current;
    const lm = layerManagerRef.current;
    const other = pm?.otherPlayers.get(playerMenu.id);
    if (!other) return;
    onViewProfile({
      userId: other.userId,
      name: playerMenu.name,
      gender: other.sprite.gender,
      outfit: lm.getFullOutfit(playerMenu.id),
      bio: other.bio || "",
      selectedBadge: other.selectedBadge || null,
    });
    onClose();
  }

  async function handleFriendAction() {
    if (!playerMenu?.userId || actionPending) return;
    setActionPending(true);
    try {
      if (friendStatus === "none") {
        const result = await sendFriendRequest(playerMenu.userId);
        setFriendStatus(result.status === "accepted" ? "friends" : "i_sent");
      } else if (friendStatus === "i_sent") {
        await cancelFriendRequest(playerMenu.userId);
        setFriendStatus("none");
      } else if (friendStatus === "they_sent") {
        await acceptFriendRequest(playerMenu.userId);
        setFriendStatus("friends");
      } else if (friendStatus === "friends") {
        await removeFriend(playerMenu.userId);
        setFriendStatus("none");
      }
    } catch {
      // keep existing status on error
    } finally {
      setActionPending(false);
    }
  }

  function friendBtnLabel() {
    if (actionPending) return "…";
    if (friendStatus === "loading") return "Loading…";
    if (friendStatus === "friends") return "Remove Friend";
    if (friendStatus === "i_sent") return "Pending";
    if (friendStatus === "they_sent") return "Accept Request";
    return "Add Friend";
  }

  function handleWhisper() {
    onOpenWhisper({ id: playerMenu.userId, name: playerMenu.name });
    onClose();
  }

  return (
    <Menu
      ref={ref}
      data-player-menu
      style={{ left: playerMenu.x, top: playerMenu.y }}
    >
      <Header>
        <AvatarCircle>
          <PlayerThumbnail playerName={playerMenu.name} size={60} />
        </AvatarCircle>
        <PlayerName>{playerMenu.name}</PlayerName>
      </Header>
      <Divider />
      <Btn onClick={handleViewProfile}>View Profile</Btn>
      <Btn
        onClick={handleFriendAction}
        disabled={actionPending || friendStatus === "loading"}
        $danger={friendStatus === "friends"}
        $muted={friendStatus === "i_sent"}
      >
        {friendBtnLabel()}
      </Btn>
      <Btn onClick={handleWhisper} disabled={!playerMenu.userId}>
        Whisper
      </Btn>
      <Btn $danger disabled>
        Block
      </Btn>
    </Menu>
  );
});

export default PlayerContextMenu;
