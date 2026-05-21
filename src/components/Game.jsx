import { useEffect, useRef, useCallback, useState } from "react";
import * as S from "./GameStyles";
import { preloadMap, createMap, MAP_WIDTH, MAP_HEIGHT } from "../game/MapManager";
import SocketManager from "../network/SocketManager";
import MultiplayerHandler from "../game/MultiplayerHandler";
import { createPhaserGame } from "../game/PhaserConfig";
import { fetchOutfit, updateOutfit } from "../api/items";
import ChatBox from "./ChatBox";
import LoadingOverlay from "./LoadingOverlay";
import PlayerProfile from "./PlayerProfile";
import WorldAvatarSystem from "../game/avatar/WorldAvatarSystem";
import PlayerManager from "../game/PlayerManager";
import MovementManager from "../game/MovementManager";
import GameLoop from "../game/GameLoop";
import {
  preloadLocalPlayer,
  createLocalPlayer,
  updateLocalPlayer,
} from "../game/LocalPlayer";

const APPEARANCE_SUBS = ["eyes", "eyebrows", "nose", "mouth", "beard"];
const SPAWN_X = MAP_WIDTH / 2;
const SPAWN_Y = MAP_HEIGHT * 0.65;

export default function Game({ user, onEquippedChange, onOutfitChange, equipRef, unequipRef, applyLookBatchRef, onSocketReady }) {
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const mpRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [whisperMessages, setWhisperMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingReady, setLoadingReady] = useState(false);
  const equippedRef = useRef({});
  const outfitRef = useRef({});
  const outfitSaveTimerRef = useRef(null);
  const pendingOutfitPayloadRef = useRef(null);
  const chatBoxRef = useRef(null);

  // Phaser-side refs — written in create(), read in React callbacks.
  const worldAvatarSystemRef = useRef(null);
  const localSpriteRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let game = null;
    let socketManager = null;

    let assetsLoaded = false;
    let stateReceived = false;
    const updateReady = () => {
      if (assetsLoaded && stateReceived) setLoadingReady(true);
    };

    (async () => {
      const outfitData = await fetchOutfit().catch(() => null);
      if (cancelled) return;
      const savedOutfit = outfitData?.outfit || null;
      setLoadProgress(p => Math.max(p, 0.1));

      socketManager = new SocketManager();
      socketRef.current = socketManager;
      onSocketReady?.(socketManager);

      socketManager.socket.on("game:state", () => {
        stateReceived = true;
        setLoadProgress(p => Math.max(p, 0.95));
        updateReady();
      });

      const mp = new MultiplayerHandler(socketManager, {
        setChatMessages,
        setWhisperMessages,
        setOnlinePlayers,
      });

      mp.onBioUpdate = (userId, bio) => {
        setViewedProfile(prev =>
          prev && String(prev.userId) === String(userId) ? { ...prev, bio } : prev
        );
      };
      mp.onBadgeUpdate = (userId, badge) => {
        setViewedProfile(prev =>
          prev && String(prev.userId) === String(userId) ? { ...prev, selectedBadge: badge } : prev
        );
      };
      mp.onPlayerClick = (id, name, clientX, clientY, userId) => {
        const other = mp.playerManager?.otherPlayers.get(id);
        setViewedProfile({
          name,
          userId,
          gender:        other?.sprite?.gender || "female",
          outfit:        other ? {} : {},
          bio:           other?.bio || "",
          selectedBadge: other?.selectedBadge || null,
        });
      };
      mpRef.current = mp;

      if (savedOutfit) {
        const outfitMap = {};
        const fullOutfit = {};
        for (const [cat, item] of Object.entries(savedOutfit)) {
          if (item?.itemId) {
            outfitMap[cat] = item.itemId;
            fullOutfit[cat] = { itemId: item.itemId, imageUrl: item.imageUrl };
          }
        }
        equippedRef.current = outfitMap;
        outfitRef.current = fullOutfit;
        onEquippedChange(outfitMap);
        onOutfitChange(fullOutfit);
      }

      function preload() {
        this.load.on("loaderror", file => {
          if (file.key !== "colliders") console.error("Load error:", file.key);
        });
        this.load.on("progress", value => setLoadProgress(0.1 + value * 0.75));
        preloadMap(this);
        preloadLocalPlayer(this);
      }

      function create() {
        const walkableZones = createMap(this);

        const avatarSys  = new WorldAvatarSystem(this);
        const playerMgr  = new PlayerManager();
        const movement   = new MovementManager(MAP_WIDTH, MAP_HEIGHT);
        const gameLoop   = new GameLoop();
        const cursors    = this.input.keyboard.createCursorKeys();

        worldAvatarSystemRef.current = avatarSys;

        const gender = user?.gender || "female";
        const localP = createLocalPlayer(this, SPAWN_X, SPAWN_Y, user?.name || "Player", gender);
        localSpriteRef.current = localP.sprite;

        // Build composited avatar; sprite shows base character until ready.
        avatarSys.rebuild("local", gender, outfitRef.current).then(key => {
          if (!localP.sprite.scene) return;
          localP.sprite.setTexture(key);
          localP.sprite._animKey = name => avatarSys.animKey("local", name);
        }).catch(() => {});

        // Camera follows local player.
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.startFollow(localP.sprite, true, 0.1, 0.1);

        // Click-to-move.
        this.input.on("pointerdown", pointer => {
          movement.handleClick(this, pointer, walkableZones);
        });

        mp.setGameObjects(this, avatarSys, playerMgr);
        mp.join(user?.name || "Player", user?.id, gender);
        mp.wire();

        let lastSentX = SPAWN_X;
        let lastSentY = SPAWN_Y;

        this.events.on("update", (_, delta) => {
          const alpha = gameLoop.run(delta, dt => {
            movement.step(localP.sprite, cursors, walkableZones, dt);

            // Send position update on change.
            const lx = localP.sprite._logicalX;
            const ly = localP.sprite._logicalY;
            if (lx !== lastSentX || ly !== lastSentY || movement.currentAnimName !== null) {
              mp.sendMove({
                x:    lx,
                y:    ly,
                anim: movement.currentAnimName,
                frame: Number(localP.sprite.frame.name),
              });
              lastSentX = lx;
              lastSentY = ly;
            }
          });

          movement.applyRender(localP.sprite, alpha);
          updateLocalPlayer(localP, delta);
          playerMgr.interpolate(delta);
        });

        assetsLoaded = true;
        setLoadProgress(p => Math.max(p, 0.85));
        updateReady();
      }

      if (cancelled) return;
      game = createPhaserGame(gameRef.current, { preload, create });
    })();

    return () => {
      cancelled = true;
      socketManager?.disconnect();
      game?.destroy(true);
      worldAvatarSystemRef.current = null;
      localSpriteRef.current = null;
    };
  }, []);

  const handleEquip = useCallback((item) => {
    const mp      = mpRef.current;
    const slotKey = item.category === "appearance" ? item.subcategory : item.category;
    const effectiveId = item.itemId ?? item._id;

    const next = { ...equippedRef.current };
    next[slotKey] = item._id ?? effectiveId;
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    nextOutfit[slotKey] = { itemId: effectiveId, imageUrl: item.imageUrl };
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit);
    _rebuildLocalAvatar(nextOutfit);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  const handleUnequip = useCallback((categoryOrSlot) => {
    const mp = mpRef.current;

    const slotsToRemove = categoryOrSlot === "appearance"
      ? ["appearance", ...APPEARANCE_SUBS]
      : [categoryOrSlot];

    const next = { ...equippedRef.current };
    for (const slot of slotsToRemove) delete next[slot];
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    for (const slot of slotsToRemove) delete nextOutfit[slot];
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit);
    _rebuildLocalAvatar(nextOutfit);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  const handleApplyLookBatch = useCallback((equippedSlots, clearSlots) => {
    const mp = mpRef.current;

    const next = { ...equippedRef.current };
    for (const slotKey of clearSlots) delete next[slotKey];
    for (const [slotKey, item] of Object.entries(equippedSlots)) {
      next[slotKey] = item._id ?? item.itemId;
    }
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    for (const slotKey of clearSlots) delete nextOutfit[slotKey];
    for (const [slotKey, item] of Object.entries(equippedSlots)) {
      nextOutfit[slotKey] = { itemId: item.itemId ?? item._id, imageUrl: item.imageUrl };
    }
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp?.sendOutfitChange(nextOutfit);
    _rebuildLocalAvatar(nextOutfit);

    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  // Rebuilds the local player's Phaser texture whenever outfit changes.
  function _rebuildLocalAvatar(outfit) {
    const avatarSys = worldAvatarSystemRef.current;
    const sprite    = localSpriteRef.current;
    if (!avatarSys || !sprite) return;
    const gender = user?.gender || "female";
    avatarSys.rebuild("local", gender, outfit).then(key => {
      if (!sprite.scene) return;
      sprite.setTexture(key);
      sprite._animKey = name => avatarSys.animKey("local", name);
    }).catch(() => {});
  }

  equipRef.current = handleEquip;
  unequipRef.current = handleUnequip;
  if (applyLookBatchRef) applyLookBatchRef.current = handleApplyLookBatch;

  const handleSend = useCallback((text) => {
    socketRef.current?.sendChatMessage(text);
  }, []);

  const handleWhisper = useCallback((toId, text) => {
    socketRef.current?.sendWhisper(toId, text);
  }, []);

  return (
    <S.Container>
      <S.GameWrapper ref={gameRef} />
      <LoadingOverlay progress={loadProgress} ready={loadingReady} />
      <ChatBox
        ref={chatBoxRef}
        messages={chatMessages}
        whispers={whisperMessages}
        players={onlinePlayers}
        myId={socketRef.current?.id}
        myName={user?.name || "Player"}
        onSend={handleSend}
        onWhisper={handleWhisper}
      />
      {viewedProfile && (
        <PlayerProfile
          onClose={() => setViewedProfile(null)}
          playerName={viewedProfile.name}
          outfit={viewedProfile.outfit}
          gender={viewedProfile.gender}
          bio={viewedProfile.bio}
          selectedBadge={viewedProfile.selectedBadge}
          currentUserId={user?.id || null}
          targetUserId={viewedProfile.userId || null}
          socket={socketRef.current}
        />
      )}
    </S.Container>
  );
}
