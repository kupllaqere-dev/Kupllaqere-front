import * as S from "./HUDStyles";
import { useState, useCallback, useEffect, useRef } from "react";
import StoreModal from "./StoreModal";
import PlayerProfile from "./PlayerProfile";
import MapsModal from "./MapsModal";
import AngelModal from "./AngelModal";
import PlayerThumbnail from "./PlayerThumbnail";
import ChessWindow from "./ChessWindow";
import ChessInviteNotification from "./ChessInviteNotification";
import { fetchUnreadCount } from "../api/mail";
import { lookupUser } from "../api/auth";

const CHESS_IDLE = {
  phase: "idle",
  myColor: null,
  opponent: null,
  pendingSentTo: null,
  opponentMove: null,
  externalResult: null,
};

function HUD({ onLogout, equipped, onEquip, onUnequip, onApplyLookBatch, playerName, outfit, gender, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, socket, coins, gems, level, onPurchaseComplete, onlinePlayers }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showAngel, setShowAngel] = useState(false);
  const [showChess, setShowChess] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Chess state
  const [chessState, setChessState] = useState(CHESS_IDLE);
  const [chessRating, setChessRating] = useState(1000);
  const [pendingInvite, setPendingInvite] = useState(null); // { inviterSocketId, inviter }
  const [declineMsg, setDeclineMsg] = useState(null);
  const declineDismissRef = useRef(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const refreshUnread = useCallback(() => {
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!socket?.socket) return;
    const handler = () => setUnreadCount((c) => c + 1);
    socket.socket.on("mail:new", handler);
    return () => socket.socket.off("mail:new", handler);
  }, [socket]);

  // ── Chess socket events ──────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onInvite = (data) => {
      setPendingInvite(data); // { inviterSocketId, inviter: { name, gender, outfit } }
    };

    const onDecline = ({ declinerName }) => {
      setChessState((prev) =>
        prev.phase === "pending_sent" ? { ...CHESS_IDLE } : prev
      );
      setDeclineMsg(`${declinerName} declined your chess invitation.`);
      clearTimeout(declineDismissRef.current);
      declineDismissRef.current = setTimeout(() => setDeclineMsg(null), 5000);
    };

    const onAccept = ({ accepterSocketId, accepter }) => {
      setChessState({
        phase: "playing",
        myColor: "w", // inviter plays white
        opponent: { socketId: accepterSocketId, ...accepter },
        pendingSentTo: null,
        opponentMove: null,
        externalResult: null,
      });
      setShowChess(true);
    };

    const onMove = ({ from, to, promotion }) => {
      setChessState((prev) =>
        prev.phase === "playing"
          ? { ...prev, opponentMove: { from, to, promotion, _ts: Date.now() } }
          : prev
      );
    };

    const onResign = () => {
      setChessState((prev) =>
        prev.phase === "playing"
          ? { ...prev, phase: "game_over", externalResult: "opponent_resigned" }
          : prev
      );
    };

    const onRating = ({ rating }) => setChessRating(rating);

    socket.onChessInviteReceived(onInvite);
    socket.onChessDeclineReceived(onDecline);
    socket.onChessAcceptReceived(onAccept);
    socket.onChessMoveReceived(onMove);
    socket.onChessResignReceived(onResign);
    socket.onChessRating(onRating);

    return () => {
      socket.off("chess:invite:received", onInvite);
      socket.off("chess:decline:received", onDecline);
      socket.off("chess:accept:received", onAccept);
      socket.off("chess:move:received", onMove);
      socket.off("chess:resign:received", onResign);
      socket.off("chess:rating", onRating);
    };
  }, [socket]);

  // Detect if opponent disconnects during a chess game
  useEffect(() => {
    if (!socket?.socket) return;
    const onLeft = ({ id }) => {
      setChessState((prev) => {
        if (prev.phase === "playing" && prev.opponent?.socketId === id) {
          return { ...prev, phase: "game_over", externalResult: "opponent_disconnected" };
        }
        return prev;
      });
    };
    socket.socket.on("player:left", onLeft);
    return () => socket.socket.off("player:left", onLeft);
  }, [socket]);

  // ── Chess action handlers ────────────────────────────
  const handleSendInvite = useCallback((targetSocketId, targetName) => {
    socket?.sendChessInvite(targetSocketId);
    setChessState({
      ...CHESS_IDLE,
      phase: "pending_sent",
      pendingSentTo: { socketId: targetSocketId, name: targetName },
    });
  }, [socket]);

  const handleCancelInvite = useCallback(() => {
    setChessState(CHESS_IDLE);
  }, []);

  const handleAcceptInvite = useCallback((inviterSocketId, inviter) => {
    socket?.sendChessAccept(inviterSocketId);
    setPendingInvite(null);
    setChessState({
      phase: "playing",
      myColor: "b", // accepter plays black
      opponent: { socketId: inviterSocketId, ...inviter },
      pendingSentTo: null,
      opponentMove: null,
      externalResult: null,
    });
    setShowChess(true);
  }, [socket]);

  const handleDeclineInvite = useCallback((inviterSocketId) => {
    socket?.sendChessDecline(inviterSocketId);
    setPendingInvite(null);
  }, [socket]);

  const handleChessMove = useCallback((from, to, promotion) => {
    const opponentSocketId = chessState.opponent?.socketId;
    if (!opponentSocketId) return;
    socket?.sendChessMove(opponentSocketId, from, to, promotion);
  }, [socket, chessState.opponent]);

  const handleResign = useCallback(() => {
    const opponentSocketId = chessState.opponent?.socketId;
    if (opponentSocketId) socket?.sendChessResign(opponentSocketId);
    setChessState((prev) => ({ ...prev, phase: "game_over", externalResult: "resigned" }));
  }, [socket, chessState.opponent]);

  const handleChessGameOver = useCallback((result) => {
    const opponentSocketId = chessState.opponent?.socketId;
    if (!opponentSocketId) return;
    if (result === "win") {
      socket?.sendChessGameOver(opponentSocketId, "win");
    } else if (result === "draw" && chessState.myColor === "w") {
      socket?.sendChessGameOver(opponentSocketId, "draw");
    }
  }, [socket, chessState.opponent, chessState.myColor]);

  const handleCloseChessResult = useCallback(() => {
    setChessState(CHESS_IDLE);
    setShowChess(false);
  }, []);

  async function handleOpenProfile(user) {
    let data = user;
    if (user?.name && !user?.gender) {
      try { data = await lookupUser(user.name) || user; } catch { /* use what we have */ }
    }
    setViewingProfile({
      userId: data?.id ?? data?.userId,
      name: data?.name ?? "",
      outfit: data?.outfit ?? {},
      gender: data?.gender ?? "girl",
      bio: data?.bio ?? "",
      selectedBadge: data?.selectedBadge ?? null,
      level: data?.level ?? 1,
      popularity: data?.popularity ?? 0,
    });
  }

  return (
    <>
      {showProfile && (
        <PlayerProfile
          onClose={() => setShowProfile(false)}
          playerName={playerName}
          outfit={outfit}
          gender={gender}
          bio={bio}
          onSaveBio={onSaveBio}
          selectedBadge={selectedBadge}
          onSaveBadge={onSaveBadge}
          currentUserId={currentUserId}
          currentUserName={playerName}
          targetUserId={currentUserId}
          unreadMailCount={unreadCount}
          onUnreadChange={refreshUnread}
          onOpenAppearance={() => { setShowProfile(false); }}
          onOpenAlbum={() => { setShowProfile(false); }}
          onOpenMarketplace={() => { setShowProfile(false); setShowStore(true); }}
          onEquip={onEquip}
          onUnequip={onUnequip}
          onApplyLookBatch={onApplyLookBatch}
          equipped={equipped}
          level={level}
          onOpenProfile={handleOpenProfile}
        />
      )}
      {viewingProfile && (
        <PlayerProfile
          onClose={() => setViewingProfile(null)}
          playerName={viewingProfile.name}
          outfit={viewingProfile.outfit}
          gender={viewingProfile.gender}
          bio={viewingProfile.bio}
          selectedBadge={viewingProfile.selectedBadge}
          currentUserId={currentUserId}
          currentUserName={playerName}
          targetUserId={viewingProfile.userId}
          socket={socket}
          level={viewingProfile.level}
          popularity={viewingProfile.popularity}
        />
      )}
      {showMaps && <MapsModal onClose={() => setShowMaps(false)} />}
      {showAngel && <AngelModal onClose={() => setShowAngel(false)} />}
      {showStore && (
        <StoreModal
          onClose={() => setShowStore(false)}
          gender={gender}
          coins={coins ?? 0}
          gems={gems ?? 0}
          level={level ?? 1}
          currentOutfit={outfit}
          onPurchaseComplete={onPurchaseComplete}
        />
      )}

      {showChess && (
        <ChessWindow
          onClose={() => setShowChess(false)}
          chessState={chessState}
          onSendInvite={handleSendInvite}
          onCancelInvite={handleCancelInvite}
          onChessMove={handleChessMove}
          onResign={handleResign}
          onCloseResult={handleCloseChessResult}
          onGameOver={handleChessGameOver}
          onlinePlayers={onlinePlayers}
          mySocketId={socket?.id}
          playerName={playerName}
          gender={gender}
          outfit={outfit}
          myRating={chessRating}
        />
      )}

      <ChessInviteNotification
        invite={pendingInvite}
        declineMsg={declineMsg}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        onDismissDecline={() => setDeclineMsg(null)}
      />

      <S.Container>
        <S.LogoWrapper>
          <img src="/Logo.png" className="logo-img" />
        </S.LogoWrapper>

        <S.TopBar>
          <S.SidePanel>
            <S.NavBubbleWrapper>
              <S.NavButton onClick={() => setShowProfile(true)}>
                <img src="/assets/menus/about.png" />
                <span>Profile</span>
              </S.NavButton>
              {unreadCount > 0 && (
                <S.NotifBadge>{unreadCount > 99 ? "99+" : unreadCount}</S.NotifBadge>
              )}
            </S.NavBubbleWrapper>
            <S.NavButton onClick={() => setShowStore(true)}>
              <img src="/icons/shop.png" />
              <span>Store</span>
            </S.NavButton>
            <S.NavButton onClick={() => setShowMaps(true)}>
              <span className="nav-emoji">🗺</span>
              <span>Maps</span>
            </S.NavButton>
            <S.NavButton onClick={() => {}}>
              <span className="nav-emoji">📜</span>
              <span>Quests</span>
            </S.NavButton>
          </S.SidePanel>

          <S.PlayerCenter>
            <S.AvatarFrame>
              <PlayerThumbnail playerName={playerName} gender={gender} outfit={outfit} size={70} />
            </S.AvatarFrame>
            <S.PlayerName>{playerName || "Player"}</S.PlayerName>
            <S.LevelSection>
              <S.PlayerLevel>Lv {level ?? 1}</S.PlayerLevel>
              <S.LevelTrack>
                <S.LevelFill style={{ width: "35%" }} />
              </S.LevelTrack>
            </S.LevelSection>
          </S.PlayerCenter>

          <S.SidePanel>
            <S.CurrencyCol>
              <S.Currency>
                <img src="/icons/Nectar.png" alt="coins" />
                <span>{(coins ?? 0).toLocaleString()}</span>
              </S.Currency>
              <S.Currency>
                <img src="/icons/Lis.png" alt="gems" />
                <span>{(gems ?? 0).toLocaleString()}</span>
              </S.Currency>
            </S.CurrencyCol>
          </S.SidePanel>
        </S.TopBar>

        <S.SettingsWrapper>
          {settingsOpen && (
            <S.Dropdown>
              <S.LogoutButton onClick={onLogout}>Logout</S.LogoutButton>
            </S.Dropdown>
          )}
          <S.BottomButtons>
            <S.SettingsBtn
              onClick={() => setShowChess((v) => !v)}
              title="Chess"
              style={{ fontSize: "22px", color: "#fff" }}
            >
              ♟
            </S.SettingsBtn>
            <S.SettingsBtn onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <span style={{ fontSize: "20px", color: "#fff" }}>{isFullscreen ? "⤡" : "⤢"}</span>
            </S.SettingsBtn>
            <S.SettingsBtn onClick={() => setSettingsOpen((prev) => !prev)}>
              <img src="/icons/settings.png" />
            </S.SettingsBtn>
          </S.BottomButtons>
        </S.SettingsWrapper>
      </S.Container>
    </>
  );
}

export default HUD;
