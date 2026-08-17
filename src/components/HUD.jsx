import * as S from "./HUDStyles";
import { useState, useCallback, useEffect, useRef } from "react";
import StoreModal from "./StoreModal";
import PlayerProfile from "./PlayerProfile";
import SettingsPanel from "./SettingsPanel";
import MapsModal from "./MapsModal";
import PlayerThumbnail from "./PlayerThumbnail";
import AngelModal from "./AngelModal";
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

// Bottom-left vials, left to right. All three share the same glass sprite.
const VIALS = [
  { key: "xp", label: "XP", texture: "/assets/xp/vial-liquid-xp.png" },
  { key: "nectar", label: "Nectar", texture: "/assets/xp/vial-liquid-nectar.png" },
  { key: "lis", label: "Lis", texture: "/assets/xp/vial-liquid-lis.png" },
];

const NAV_ITEMS = [
  { key: "store", label: "Store", icon: "/assets/ui-icons/Store.png" },
  { key: "maps", label: "Maps", icon: "/assets/ui-icons/Map.png" },
  { key: "quests", label: "Quests", icon: "/assets/ui-icons/Quests.png" },
  { key: "news", label: "News", icon: "/assets/ui-icons/News.png" },
];

function HUD({ onLogout, equipped, onEquip, onUnequip, onApplyLookBatch, playerName, onSaveName, outfit, gender, skinColor, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, email, isGuest, role, socket, coins, gems, level, xpPercent, onPurchaseComplete, onlinePlayers, currentMap, onChangeMap }) {
  // Each vial follows its own input box. XP starts from whatever the server sent
  // and re-syncs if that value later changes.
  const [vialInputs, setVialInputs] = useState(() => ({
    xp: String(Math.round(xpPercent ?? 0)),
    nectar: "0",
    lis: "0",
  }));
  const [syncedXp, setSyncedXp] = useState(xpPercent);
  if (xpPercent !== syncedXp) {
    setSyncedXp(xpPercent);
    setVialInputs((prev) => ({ ...prev, xp: String(Math.round(xpPercent ?? 0)) }));
  }
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
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

  function handleVialInput(key, e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
    setVialInputs((prev) => ({
      ...prev,
      [key]: digits === "" ? "" : String(Math.min(100, Number(digits))),
    }));
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Close the settings panel when clicking anywhere outside the HUD stack
  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [settingsOpen]);

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

  const menuActions = {
    store: () => setShowStore(true),
    maps: () => setShowMaps(true),
    quests: () => {},
    news: () => {},
  };

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
      skinColor: data?.skinColor ?? null,
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
          skinColor={skinColor}
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
          skinColor={viewingProfile.skinColor ?? null}
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
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          playerName={playerName}
          onSaveName={onSaveName}
          email={email}
          isGuest={isGuest}
          role={role}
        />
      )}
      {showMaps && (
        <MapsModal
          onClose={() => setShowMaps(false)}
          currentMap={currentMap}
          onSelectMap={onChangeMap}
        />
      )}
      {showAngel && <AngelModal onClose={() => setShowAngel(false)} />}
      {showStore && (
        <StoreModal
          onClose={() => setShowStore(false)}
          gender={gender}
          coins={coins ?? 0}
          gems={gems ?? 0}
          level={level ?? 1}
          currentOutfit={outfit}
          skinColor={skinColor}
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
          skinColor={skinColor}
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
        <S.PanelStack>
          <S.TopRow>
            <S.AvatarBlock>
              <S.AvatarRing onClick={() => setShowProfile(true)} title="Open profile">
                <S.AvatarFrame>
                  <PlayerThumbnail
                    playerName={playerName}
                    gender={gender}
                    outfit={outfit}
                    skinColor={skinColor}
                    size={S.AVATAR_SIZE}
                  />
                </S.AvatarFrame>
                {unreadCount > 0 && (
                  <S.NotifBadge>{unreadCount > 99 ? "99+" : unreadCount}</S.NotifBadge>
                )}
              </S.AvatarRing>
              <S.NamePlate>
                <S.NameRow>
                  <S.PlayerName>{playerName || "Player"}</S.PlayerName>
                  <S.PlayerLevel>Lv {level ?? 1}</S.PlayerLevel>
                </S.NameRow>
              </S.NamePlate>
            </S.AvatarBlock>

            <S.ButtonRow>
              {NAV_ITEMS.map((item, i) => (
                <S.IconButton
                  key={item.key}
                  $index={i}
                  onClick={() => menuActions[item.key]?.()}
                >
                  <img src={item.icon} alt={item.label} />
                </S.IconButton>
              ))}
            </S.ButtonRow>
          </S.TopRow>
        </S.PanelStack>

        <S.CurrencyBar>
          <S.CurrencyChip>
            <img src="/icons/Nectar.png" alt="nectar" />
            <span>{(coins ?? 0).toLocaleString()}</span>
          </S.CurrencyChip>
          <S.CurrencyChip>
            <img src="/icons/Lis.png" alt="lis" />
            <span>{(gems ?? 0).toLocaleString()}</span>
          </S.CurrencyChip>
          <S.BuyButton onClick={() => setShowStore(true)} aria-label="Shop">
            <img src="/assets/ui-icons/Noshop.png" alt="" data-state="idle" />
            <img src="/assets/ui-icons/Shop.png" alt="" data-state="hover" />
          </S.BuyButton>
        </S.CurrencyBar>

        <S.VialDock>
          {VIALS.map(({ key, label, texture }) => {
            const pct = Math.max(0, Math.min(100, Number(vialInputs[key]) || 0));
            return (
              <S.VialColumn key={key}>
                <S.Vial title={`${label} ${pct}%`}>
                  <S.VialTube>
                    <S.VialFill $pct={pct} $texture={texture} />
                  </S.VialTube>
                  <S.VialGlass src="/assets/xp/vial.png" alt="" />
                </S.Vial>
                <S.VialInputWrap>
                  <S.VialInputLabel>{label}</S.VialInputLabel>
                  <S.VialInput
                    type="text"
                    inputMode="numeric"
                    value={vialInputs[key]}
                    onChange={(e) => handleVialInput(key, e)}
                    placeholder="0"
                    aria-label={`${label} percent`}
                  />
                </S.VialInputWrap>
              </S.VialColumn>
            );
          })}
        </S.VialDock>

        <S.SettingsWrapper ref={menuRef}>
          {settingsOpen && (
            <S.MenuDropdown>
              <S.DropdownButton onClick={() => { setShowSettings(true); setSettingsOpen(false); }}>
                <span>⚙</span>
                Settings
              </S.DropdownButton>
              <S.DropdownButton onClick={toggleFullscreen}>
                <span>{isFullscreen ? "⤡" : "⤢"}</span>
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </S.DropdownButton>
              <S.LogoutButton onClick={onLogout}>Logout</S.LogoutButton>
            </S.MenuDropdown>
          )}
          <S.BottomButtons>
            <S.SettingsBtn onClick={() => setSettingsOpen((v) => !v)} title="Settings">
              <img src="/icons/settings.png" alt="Settings" />
            </S.SettingsBtn>
          </S.BottomButtons>
        </S.SettingsWrapper>
      </S.Container>
    </>
  );
}

export default HUD;
