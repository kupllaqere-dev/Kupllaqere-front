import * as S from "./HUDStyles";
import { useState, useCallback, useEffect, useRef } from "react";
import StoreModal from "./StoreModal";
import ShopModal from "./ShopModal";
import PlayerProfile from "./PlayerProfile";
import SettingsPanel from "./SettingsPanel";
import MapsModal from "./MapsModal";
import CollectiblesModal from "./CollectiblesModal";
import QuestsModal from "./QuestsModal";
import NameChangeModal from "./NameChangeModal";
import PlayerThumbnail from "./PlayerThumbnail";
import GameClock from "./GameClock";
import FriendOnlineToasts from "./FriendOnlineToasts";
import AngelModal from "./AngelModal";
import ChessWindow from "./ChessWindow";
import ChessInviteNotification from "./ChessInviteNotification";
import { fetchUnreadCount } from "../api/mail";
import { lookupUser } from "../api/auth";
import { devGrant, devSpend } from "../api/dev";

const CHESS_IDLE = {
  phase: "idle",
  myColor: null,
  opponent: null,
  pendingSentTo: null,
  opponentMove: null,
  externalResult: null,
};

// Bottom-left vials, left to right. All three share the same glass sprite.
// XP fills from the server's levelling curve (fv-game-back/lib/xp.js); Nectar
// and Lis fill from spending that currency (fv-game-back/lib/vials.js) — same
// treatment, just driven by a different pair of server fields per vial.
const VIALS = [
  { key: "xp", label: "XP", texture: "/assets/xp/vial-liquid-xp.png" },
  { key: "nectar", label: "Nectar", texture: "/assets/xp/vial-liquid-nectar.png" },
  { key: "lis", label: "Lis", texture: "/assets/xp/vial-liquid-lis.png" },
];

// The numbers behind any vial can run large — the readout is compact
// ("8.4K / 10K") and the tooltip carries the exact numbers.
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

function HUD({ onLogout, equipped, onEquip, onUnequip, onApplyLookBatch, playerName, onSaveName, outfit, gender, skinColor, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, email, role, socket, coins, gems, level, xp, xpForNextLevel, xpPercent, nectarPct, nectarProgress, nectarNeeded, nectarFlyTick, lisPct, lisProgress, lisNeeded, lisFlyTick, onPurchaseComplete, onBalancesChanged, onlinePlayers, currentMap, onChangeMap, seedInventory, consumables, onConsumablesChange, onDevLevelUp, quests, onClaimQuest, onTogglePinQuest }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showCollectibles, setShowCollectibles] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
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

  // Per-vial pct/progress/needed, keyed the same way as VIALS above.
  const VIAL_VALUES = {
    xp: { pct: xpPercent, progress: xp, needed: xpForNextLevel },
    nectar: { pct: nectarPct, progress: nectarProgress, needed: nectarNeeded },
    lis: { pct: lisPct, progress: lisProgress, needed: lisNeeded },
  };

  // Fly-to-Collectibles animation: a completed vial (nectarFlyTick/lisFlyTick
  // bumped in App.jsx once per vial filled) plays a shrink-and-fly flourish
  // from its spot in the dock to the Collectibles nav icon. The dock's own
  // vial already shows its post-rollover (reset) fill by the time this fires,
  // so the clone is a pure visual — it doesn't drive any real state.
  const vialRefs = useRef({});
  const collectiblesBtnRef = useRef(null);
  const prevFlyTicksRef = useRef({ nectar: nectarFlyTick, lis: lisFlyTick });
  const [flyingVial, setFlyingVial] = useState(null);

  useEffect(() => {
    const prev = prevFlyTicksRef.current;
    const changedKey =
      nectarFlyTick !== prev.nectar ? "nectar" : lisFlyTick !== prev.lis ? "lis" : null;
    prev.nectar = nectarFlyTick;
    prev.lis = lisFlyTick;
    if (!changedKey) return;

    const fromEl = vialRefs.current[changedKey];
    const toEl = collectiblesBtnRef.current;
    if (!fromEl || !toEl) return;

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const id = `${changedKey}-${Date.now()}`;

    setFlyingVial({
      id,
      key: changedKey,
      startStyle: {
        left: fromRect.left,
        top: fromRect.top,
        width: fromRect.width,
        height: fromRect.height,
      },
    });

    // Two frames so the browser paints the start position before the
    // transition-driving transform below lands — one frame isn't reliably
    // enough for the initial styles to have committed yet.
    let raf2 = null;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const dx = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
        const dy = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
        setFlyingVial((cur) =>
          cur && cur.id === id
            ? { ...cur, endStyle: { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 } }
            : cur
        );
      });
    });
    const timeout = setTimeout(() => {
      setFlyingVial((cur) => (cur && cur.id === id ? null : cur));
    }, 550);

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2 !== null) cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
  }, [nectarFlyTick, lisFlyTick]);

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

  // DEV buttons: top up a balance, or spend it through the same path a real
  // purchase would (fv-game-back/lib/vials.js) so the Nectar/Lis vials can be
  // filled without buying anything for real.
  const handleDevGrant = useCallback(async (currency, amount) => {
    try {
      const data = await devGrant(currency, amount);
      onBalancesChanged?.({ coins: data.coins, gems: data.gems });
    } catch (err) {
      console.error("Dev grant failed:", err);
    }
  }, [onBalancesChanged]);

  const handleDevSpend = useCallback(async (currency, amount) => {
    try {
      const data = await devSpend(currency, amount);
      onBalancesChanged?.({ coins: data.coins, gems: data.gems, vial: data.vial });
    } catch (err) {
      console.error("Dev spend failed:", err);
    }
  }, [onBalancesChanged]);

  const menuActions = {
    store: () => setShowStore(true),
    maps: () => setShowMaps(true),
    quests: () => setShowQuests(true),
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
      {showQuests && (
        <QuestsModal
          onClose={() => setShowQuests(false)}
          quests={quests}
          onClaim={onClaimQuest}
          onTogglePin={onTogglePinQuest}
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
                </S.NameRow>
                <GameClock />
              </S.NamePlate>
              <FriendOnlineToasts socket={socket} />

              {(quests?.quests ?? []).some((q) => q.pinned) && (
                <S.PinnedQuestDock>
                  {quests.quests
                    .filter((q) => q.pinned)
                    .map((q) => {
                      const claimable = q.completed && !q.claimed;
                      return (
                        <S.PinnedQuestRow
                          key={q.key}
                          $claimable={claimable}
                          onClick={() => claimable && onClaimQuest?.(q.key)}
                        >
                          <S.PinnedQuestHeader>
                            <S.PinnedQuestHeaderTitle>Daily - {q.title}</S.PinnedQuestHeaderTitle>
                            <S.PinnedQuestActions>
                              <S.PinnedQuestActionBtn
                                title="Open Quests"
                                onClick={(e) => { e.stopPropagation(); setShowQuests(true); }}
                              >
                                ⤢
                              </S.PinnedQuestActionBtn>
                              <S.PinnedQuestActionBtn
                                title="Unpin from HUD"
                                onClick={(e) => { e.stopPropagation(); onTogglePinQuest?.(q.key, false); }}
                              >
                                ✕
                              </S.PinnedQuestActionBtn>
                            </S.PinnedQuestActions>
                          </S.PinnedQuestHeader>
                          <S.PinnedQuestMain>
                            <S.PinnedQuestObjective>{q.label}</S.PinnedQuestObjective>
                            <S.PinnedQuestStats>
                              <S.PinnedQuestCount $done={claimable || q.claimed}>
                                {q.progress} / {q.target}
                              </S.PinnedQuestCount>
                              {claimable && <S.PinnedQuestClaim>Claim</S.PinnedQuestClaim>}
                            </S.PinnedQuestStats>
                          </S.PinnedQuestMain>
                        </S.PinnedQuestRow>
                      );
                    })}
                </S.PinnedQuestDock>
              )}
            </S.AvatarBlock>

            <S.ButtonRow>
              {NAV_ITEMS.map((item, i) => (
                <S.IconButton
                  key={item.key}
                  $index={i}
                  ref={item.key === "collectibles" ? collectiblesBtnRef : undefined}
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
            const v = VIAL_VALUES[key];
            // The server sends what the next fill costs, null once XP hits the
            // level cap (Nectar/Lis never cap) — and nothing at all until the
            // first payload lands, which is the case a cached fv_user from
            // before the curve falls into.
            const cost = typeof v.needed === "number" && v.needed > 0 ? v.needed : null;
            const capped = isXp && v.needed === null;
            const pct = Math.max(0, Math.min(100, v.pct ?? 0));
            let title = `${label} ${Math.round(pct)}%`;
            if (cost) {
              title = isXp
                ? `${label} ${Math.round(v.progress ?? 0).toLocaleString()} / ${cost.toLocaleString()} to level ${(level ?? 1) + 1}`
                : `${label} ${Math.round(v.progress ?? 0).toLocaleString()} / ${cost.toLocaleString()} to the next vial`;
            } else if (capped) {
              title = `${label} — level ${level ?? 1}, fully levelled`;
            }
            return (
              <S.VialColumn key={key} ref={(el) => { vialRefs.current[key] = el; }}>
                <S.Vial title={title}>
                  <S.VialTube>
                    <S.VialFill $pct={pct} $texture={texture} />
                  </S.VialTube>
                  <S.VialGlass src="/assets/xp/vial.png" alt="" />
                </S.Vial>
                <S.VialReadoutWrap>
                  <S.VialInputLabel>{label}</S.VialInputLabel>
                  <S.VialReadout title={title}>
                    {cost
                      ? `${compactXp.format(Math.round(v.progress ?? 0))}/${compactXp.format(cost)}`
                      : capped
                        ? "MAX"
                        : `${Math.round(pct)}%`}
                  </S.VialReadout>
                </S.VialReadoutWrap>
              </S.VialColumn>
            );
          })}
        </S.VialDock>
        {flyingVial && (
          <S.VialFlyClone
            style={{
              left: flyingVial.startStyle.left,
              top: flyingVial.startStyle.top,
              width: flyingVial.startStyle.width,
              height: flyingVial.startStyle.height,
              transform: flyingVial.endStyle?.transform ?? "translate(0, 0) scale(1)",
              opacity: flyingVial.endStyle?.opacity ?? 1,
            }}
          >
            <S.VialGlass src="/assets/xp/vial.png" alt="" />
          </S.VialFlyClone>
        )}

        <S.SettingsWrapper ref={menuRef}>
          {import.meta.env.DEV && (
            <>
              <S.DevButton onClick={() => handleDevGrant("coins", 5000)} title="Dev: add 5,000 coins">
                GET 5K NECTAR
              </S.DevButton>
              <S.DevButton onClick={() => handleDevGrant("gems", 50)} title="Dev: add 50 Lis">
                GET 50 LIS
              </S.DevButton>
              <S.DevButton onClick={() => handleDevSpend("coins", 5000)} title="Dev: spend 5,000 coins, filling the Nectar vial">
                SPEND 5K NECTAR
              </S.DevButton>
              <S.DevButton onClick={() => handleDevSpend("gems", 50)} title="Dev: spend 50 Lis, filling the Lis vial">
                SPEND 50 LIS
              </S.DevButton>
            </>
          )}
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
