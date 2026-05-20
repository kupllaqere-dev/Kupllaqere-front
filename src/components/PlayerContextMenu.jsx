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
  width: 200px;
  background: #1a1a2eee;
  border: 1px solid #ffffff22;
  border-radius: 12px;
  padding: 12px 10px 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75);
  transform: translate(14px, -50%);
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
`;

const AvatarCircle = styled.div`
  width: 40px;
  height: 40px;
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
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DecorativeDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #ffffff28, transparent);
  }
`;

const DiamondDot = styled.div`
  width: 5px;
  height: 5px;
  background: #ffffff40;
  transform: rotate(45deg);
  flex-shrink: 0;
`;

const ItemDivider = styled.div`
  height: 1px;
  background: #ffffff14;
  margin: 2px auto;
  width: 80%;
`;

const Btn = styled.button`
  background: transparent;
  border: none;
  color: ${(p) => (p.$danger ? "#ff6b6b" : p.$muted ? "#666" : "#bbb")};
  font-size: 12px;
  padding: 7px 10px;
  text-align: left;
  border-radius: 7px;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  transition: background 0.1s, color 0.1s;

  &:hover:not(:disabled) {
    background: #ffffff12;
    color: ${(p) => (p.$danger ? "#ff9090" : "#fff")};
  }

  &:disabled {
    opacity: 0.45;
  }

  svg {
    flex-shrink: 0;
    opacity: 0.75;
  }
`;

function IconProfile() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconAddFriend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}

function IconPending() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function IconAccept() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <polyline points="16 12 18 14 22 10" />
    </svg>
  );
}

function IconRemoveFriend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  );
}

function IconWhisper() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconBlock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

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

  function FriendIcon() {
    if (friendStatus === "friends") return <IconRemoveFriend />;
    if (friendStatus === "i_sent") return <IconPending />;
    if (friendStatus === "they_sent") return <IconAccept />;
    return <IconAddFriend />;
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
          <PlayerThumbnail playerName={playerMenu.name} size={40} />
        </AvatarCircle>
        <PlayerName>{playerMenu.name}</PlayerName>
      </Header>

      <DecorativeDivider>
        <DiamondDot />
      </DecorativeDivider>

      <Btn onClick={handleViewProfile}>
        <IconProfile />
        View Profile
      </Btn>
      <ItemDivider />
      <Btn
        onClick={handleFriendAction}
        disabled={actionPending || friendStatus === "loading"}
        $danger={friendStatus === "friends"}
        $muted={friendStatus === "i_sent"}
      >
        <FriendIcon />
        {friendBtnLabel()}
      </Btn>
      <ItemDivider />
      <Btn onClick={handleWhisper} disabled={!playerMenu.userId}>
        <IconWhisper />
        Whisper
      </Btn>
      <ItemDivider />
      <Btn $danger disabled>
        <IconBlock />
        Block
      </Btn>
    </Menu>
  );
});

export default PlayerContextMenu;
