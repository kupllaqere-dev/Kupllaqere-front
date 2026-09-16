import * as S from "./HUDStyles";
import { useState, useCallback, useEffect, useRef } from "react";
import StoreModal from "./StoreModal";
import ShopModal from "./ShopModal";
import PlayerProfile from "./PlayerProfile";
import SettingsPanel from "./SettingsPanel";
import MapsModal from "./MapsModal";
import CollectiblesModal from "./CollectiblesModal";
import NameChangeModal from "./NameChangeModal";
import PlayerThumbnail from "./PlayerThumbnail";
import GameClock from "./GameClock";
import FriendOnlineToasts from "./FriendOnlineToasts";
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
// XP is filled from the server's levelling curve (fv-game-back/lib/xp.js);
// nectar and lis have no curve of their own yet, so they stay hand-set.
const VIALS = [
  { key: "xp", label: "XP", texture: "/assets/xp/vial-liquid-xp.png" },
  { key: "nectar", label: "Nectar", texture: "/assets/xp/vial-liquid-nectar.png" },
  { key: "lis", label: "Lis", texture: "/assets/xp/vial-liquid-lis.png" },
];

// The curve runs to nine figures by level 100, which will not fit under a 36px
// vial — the readout is compact ("8.4K / 10K") and the tooltip carries the
// exact numbers.
const compactXp = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

// Destination for the Farm nav button below.
const FARM_MAP_ID = "farm";

const NAV_ITEMS = [
  { key: "store", label: "Store", icon: "/assets/ui-icons/Store.png" },
  { key: "maps", label: "Maps", icon: "/assets/ui-icons/Map.png" },
  { key: "quests", label: "Quests", icon: "/assets/ui-icons/Quests.png" },
  { key: "news", label: "News", icon: "/assets/ui-icons/News.png" },
  { key: "farm", label: "Farm", icon: "/assets/ui-icons/Farm.png" },
  { key: "collectibles", label: "Collectibles", icon: "/assets/ui-icons/Collectibles.png" },
];

function HUD({ onLogout, equipped, onEquip, onUnequip, onApplyLookBatch, playerName, onSaveName, outfit, gender, skinColor, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, email, role, socket, coins, gems, level, xp, xpForNextLevel, xpPercent, onPurchaseComplete, onBalancesChanged, onlinePlayers, currentMap, onChangeMap, seedInventory, consumables, onConsumablesChange, onDevLevelUp }) {
  // Only the hand-set vials need state — XP comes down as a prop.
  const [vialInputs, setVialInputs] = useState({ nectar: "0", lis: "0" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showCollectibles, setShowCollectibles] = useState(false);
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
    // Player mail and system mail share one badge.
    const handler = () => setUnreadCount((c) => c + 1);
    socket.socket.on("mail:new", handler);
    socket.socket.on("systemMail:new", handler);
    return () => {
      socket.socket.off("mail:new", handler);
      socket.socket.off("systemMail:new", handler);
    };
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

  // Spending an item from the Collectibles bag. Each consumable's effect is
  // implemented here, keyed by the id in fv-game-back/lib/consumables.js.
  const handleUseConsumable = useCallback((itemId) => {
    if (itemId !== "name_change") return;
    setShowCollectibles(false);
    setRenaming(true);
  }, []);

  const menuActions = {
    store: () => setShowStore(true),
    maps: () => setShowMaps(true),
    quests: () => {},
    news: () => window.open("https://platform.neclisworld.com", "_blank", "noopener,noreferrer"),
    farm: () => onChangeMap?.(FARM_MAP_ID),
    collectibles: () => setShowCollectibles(true),
  };

  // Only the Farm button has state worth spelling out in its tooltip.
  const navTitle = (key, label) =>
    key === "farm"
      ? currentMap === FARM_MAP_ID
        ? "You are at the Farm"
        : "Travel to the Farm"
      : label;

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
          gems={gems}
          onOpenProfile={handleOpenProfile}
          onBalancesChanged={onBalancesChanged}
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
          gems={gems}
          popularity={viewingProfile.popularity}
          onOpenProfile={handleOpenProfile}
          onBalancesChanged={onBalancesChanged}
        />
      )}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          playerName={playerName}
          email={email}
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
      {showCollectibles && (
        <CollectiblesModal
          onClose={() => setShowCollectibles(false)}
          seeds={seedInventory}
          consumables={consumables}
          onUseConsumable={handleUseConsumable}
        />
      )}
      {renaming && (
        <NameChangeModal
          currentName={playerName || ""}
          onConfirm={onSaveName}
          onClose={() => setRenaming(false)}
        />
      )}
      {showAngel && <AngelModal onClose={() => setShowAngel(false)} />}
      {showShop && (
        <ShopModal
          onClose={() => setShowShop(false)}
          gems={gems ?? 0}
          onPurchaseComplete={onPurchaseComplete}
          onConsumablesChange={onConsumablesChange}
        />
      )}
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
                <GameClock />
              </S.NamePlate>
              <FriendOnlineToasts socket={socket} />
            </S.AvatarBlock>

            <S.ButtonRow>
              {NAV_ITEMS.map((item, i) => (
                <S.IconButton
                  key={item.key}
                  $index={i}
                  onClick={() => menuActions[item.key]?.()}
                  title={navTitle(item.key, item.label)}
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
          <S.BuyButton onClick={() => setShowShop(true)} aria-label="Shop">
            <img src="/assets/ui-icons/Noshop.png" alt="" data-state="idle" />
            <img src="/assets/ui-icons/Shop.png" alt="" data-state="hover" />
          </S.BuyButton>
        </S.CurrencyBar>

        <S.VialDock>
          {VIALS.map(({ key, label, texture }) => {
            const isXp = key === "xp";
            // The server sends the next level's cost, null once the cap is
            // reached — and nothing at all until the first payload lands, which
            // is the case a cached fv_user from before the curve falls into.
            const cost = isXp && typeof xpForNextLevel === "number" && xpForNextLevel > 0
              ? xpForNextLevel
              : null;
            const capped = isXp && xpForNextLevel === null;
            const pct = isXp
              ? Math.max(0, Math.min(100, xpPercent ?? 0))
              : Math.max(0, Math.min(100, Number(vialInputs[key]) || 0));
            let title = `${label} ${Math.round(pct)}%`;
            if (cost) {
              title = `${label} ${Math.round(xp ?? 0).toLocaleString()} / ${cost.toLocaleString()} to level ${(level ?? 1) + 1}`;
            } else if (capped) {
              title = `${label} — level ${level ?? 1}, fully levelled`;
            }
            return (
              <S.VialColumn key={key}>
                <S.Vial title={title}>
                  <S.VialTube>
                    <S.VialFill $pct={pct} $texture={texture} />
                  </S.VialTube>
                  <S.VialGlass src="/assets/xp/vial.png" alt="" />
                </S.Vial>
                {isXp ? (
                  <S.VialReadoutWrap>
                    <S.VialInputLabel>{label}</S.VialInputLabel>
                    <S.VialReadout title={title}>
                      {cost
                        ? `${compactXp.format(Math.round(xp ?? 0))}/${compactXp.format(cost)}`
                        : capped
                          ? "MAX"
                          : `${Math.round(pct)}%`}
                    </S.VialReadout>
                  </S.VialReadoutWrap>
                ) : (
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
                )}
              </S.VialColumn>
            );
          })}
        </S.VialDock>

        <S.SettingsWrapper ref={menuRef}>
          {import.meta.env.DEV && onDevLevelUp && (
            <S.DevButton onClick={onDevLevelUp} title="Dev: play the level-up banner">
              DEV: LEVEL UP
            </S.DevButton>
          )}
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
