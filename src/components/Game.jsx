import { useEffect, useRef, useCallback, useState } from "react";
import * as S from "./GameStyles";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  preloadMap,
  createMap,
} from "../game/MapManager";
import {
  preloadInteractables,
  createInteractables,
} from "../game/InteractableManager";
import {
  preloadLocalPlayer,
  createLocalPlayer,
  updateLocalPlayer,
  repositionLocalPlayer,
  setLocalPlayerGender,
  setLocalPlayerBadge,
} from "../game/LocalPlayer";
import MovementManager from "../game/MovementManager";
import ChatBubbleManager from "../game/ChatBubbleManager";
import EditorManager from "../game/EditorManager";
import PlayerManager from "../game/PlayerManager";
import SocketManager from "../network/SocketManager";
import MultiplayerHandler from "../game/MultiplayerHandler";
import LayerManager from "../game/LayerManager";
import GameLoop from "../game/GameLoop";
import { createPhaserGame } from "../game/PhaserConfig";
import { fetchOutfit, updateOutfit } from "../api/items";
import ChatBox from "./ChatBox";
import LoadingOverlay from "./LoadingOverlay";
import PlayerProfile from "./PlayerProfile";
import PlayerContextMenu from "./PlayerContextMenu";

const APPEARANCE_SUBS = ["eyes", "eyebrows", "nose", "mouth", "beard"];

export default function Game({ user, onEquippedChange, onOutfitChange, equipRef, unequipRef, applyLookBatchRef, onSocketReady }) {
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const sceneRef = useRef(null);
  const localPlayerRef = useRef(null);
  const layerManagerRef = useRef(null);
  const mpRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [whisperMessages, setWhisperMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [playerMenu, setPlayerMenu] = useState(null);
  const [objectMenu, setObjectMenu] = useState(null);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [socketReady, setSocketReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingReady, setLoadingReady] = useState(false);
  const teleportRef = useRef(null);
  const equippedRef = useRef({});
  const outfitRef = useRef({});
  const outfitSaveTimerRef = useRef(null);
  const pendingOutfitPayloadRef = useRef(null);
  const playerMenuDomRef = useRef(null);
  const playerMenuTargetRef = useRef(null);
  const playerManagerRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let game = null;
    let socketManager = null;
    let layerManager = null;
    let chatBubbles = null;

    let assetsLoaded = false;
    let stateReceived = false;
    const updateReady = () => {
      if (assetsLoaded && stateReceived) setLoadingReady(true);
    };

    (async () => {
      const outfitData = await fetchOutfit().catch(() => null);
      if (cancelled) return;
      const savedOutfit = outfitData?.outfit || null;
      setLoadProgress((p) => Math.max(p, 0.1));

      socketManager = new SocketManager();
      socketRef.current = socketManager;
      setSocketReady(true);
      onSocketReady?.(socketManager);

      socketManager.socket.on("game:state", () => {
        stateReceived = true;
        setLoadProgress((p) => Math.max(p, 0.95));
        updateReady();
      });

      const playerManager = new PlayerManager();
      playerManagerRef.current = playerManager;
      playerManager.onPlayerClick = (id, name, clientX, clientY, userId) => {
        setPlayerMenu((prev) => {
          if (prev && prev.id === id) {
            playerMenuTargetRef.current = null;
            return null;
          }
          playerMenuTargetRef.current = id;
          return { id, name, x: clientX, y: clientY, userId, status: null };
        });
      };

      const movement = new MovementManager(MAP_WIDTH, MAP_HEIGHT);
      chatBubbles = new ChatBubbleManager();
      layerManager = new LayerManager();
      layerManagerRef.current = layerManager;

      const mp = new MultiplayerHandler(socketManager, playerManager, chatBubbles, {
        setChatMessages,
        setWhisperMessages,
        setOnlinePlayers,
      });
      mp.layerManager = layerManager;
      playerManager.layerManager = layerManager;
      mp.onBioUpdate = (userId, bio) => {
        setViewedProfile((prev) =>
          prev && String(prev.userId) === String(userId) ? { ...prev, bio } : prev,
        );
      };
      mp.onBadgeUpdate = (userId, badge) => {
        setViewedProfile((prev) =>
          prev && String(prev.userId) === String(userId) ? { ...prev, selectedBadge: badge } : prev,
        );
      };
      mpRef.current = mp;

      let localPlayer;
      let cursors;
      let walkableZones = [];
      let editor;

      function preload() {
        this.load.on("loaderror", (file) => {
          if (file.key !== "colliders") console.error("Load error:", file.key);
        });
        this.load.on("progress", (value) => {
          setLoadProgress(0.1 + value * 0.75);
        });
        preloadMap(this);
        preloadInteractables(this);
        preloadLocalPlayer(this);

        if (savedOutfit) {
          for (const [, item] of Object.entries(savedOutfit)) {
            if (item?.imageUrl && item?.itemId) {
              this.load.spritesheet(`item_${item.itemId}`, item.imageUrl, {
                frameWidth: 510,
                frameHeight: 900,
              });
            }
          }
        }
      }

      function create() {
        sceneRef.current = this;
        walkableZones = createMap(this);

        localPlayer = createLocalPlayer(this, 500, 800, user?.name || "Player", layerManager, user?.gender);
        localPlayerRef.current = localPlayer;

        cursors = this.input.keyboard.createCursorKeys();
        // createCursorKeys auto-captures arrows + SPACE + SHIFT, which calls
        // preventDefault on them globally — that breaks typing spaces (and
        // shift-modified chars) inside any HTML input/textarea overlay. We
        // don't use space/shift for movement, so release them.
        this.input.keyboard.removeCapture(["SPACE", "SHIFT"]);
        this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        // Snap the camera to the player (lerp=1). Lerping the camera while
        // the player moves makes the two desync by a fractional amount each
        // frame — combined with any pixel rounding that produced visible
        // wobble. With snap, player screen position is stable → no wobble.
        // Second arg is `roundPixels` on the camera itself; keep it off to
        // match the global config so sub-pixel motion renders smoothly.
        this.cameras.main.startFollow(localPlayer.sprite, false, 1, 1);

        editor = new EditorManager(this, localPlayer.sprite, walkableZones);

        createInteractables(this, (pos) => {
          setObjectMenu((prev) => (prev ? null : pos));
        });

        this.input.on("pointerdown", (pointer) => {
          movement.handleClick(this, pointer, walkableZones);
        });

        // Apply outfit synchronously — textures were preloaded
        if (savedOutfit) {
          const outfitMap = {};
          const fullOutfit = {};
          for (const [cat, item] of Object.entries(savedOutfit)) {
            if (item && item.itemId) {
              outfitMap[cat] = item.itemId;
              fullOutfit[cat] = { itemId: item.itemId, imageUrl: item.imageUrl };
              layerManager.equip(this, localPlayer.sprite, "local", cat, item.imageUrl, item.itemId);
            }
          }
          equippedRef.current = outfitMap;
          outfitRef.current = fullOutfit;
          onEquippedChange(outfitMap);
          onOutfitChange(fullOutfit);
        }

        // Multiplayer
        mp.onLocalGender = (gender) => setLocalPlayerGender(localPlayer, gender);
        mp.onLocalBadge = (userId, badge) => {
          if (user?.id && String(userId) === String(user.id)) {
            setLocalPlayerBadge(this, localPlayer, badge);
          }
        };
        if (user?.selectedBadge) {
          setLocalPlayerBadge(this, localPlayer, user.selectedBadge);
        }
        mp.join(user?.name || "Player", localPlayer.sprite.x, localPlayer.sprite.y, user?.id, user?.gender);
        mp.wire(this, localPlayer.sprite);
        mp.wireTeleport(this, localPlayer, playerManager, {
          onMapSwitch: (scene, mapName) => {
            walkableZones = createMap(scene, mapName);
            scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
            scene.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
            createInteractables(
              scene,
              (pos) => setObjectMenu((prev) => (prev ? null : pos)),
              mapName,
            );
            return walkableZones;
          },
          onReposition: repositionLocalPlayer,
        });

        teleportRef.current = (mapName, x, y) => mp.teleport(mapName, x, y);

        assetsLoaded = true;
        setLoadProgress((p) => Math.max(p, 0.85));
        updateReady();
      }

      const gameLoop = new GameLoop();

      function update(_time, delta) {
        if (editor.panCamera(cursors)) return;

        // ─── Fixed-timestep simulation ───────────────────────────────
        // Runs at a deterministic 60Hz regardless of render framerate.
        // This decouples movement speed from frame hitches and high-refresh
        // monitors, and ensures the networked send cadence is stable.
        const alpha = gameLoop.run(delta, () => {
          movement.step(localPlayer.sprite, cursors, walkableZones, 1 / 60);

          // Client-side prediction: local player position is authoritative
          // until/unless the server contradicts it (see onLocalAuthoritative).
          // Send the LOGICAL position, not the interpolated render position —
          // the sim is the source of truth. SocketManager throttles internally.
          mp.sendUpdate(
            localPlayer.sprite._logicalX,
            localPlayer.sprite._logicalY,
            Number(localPlayer.sprite.frame.name),
            movement.currentAnim,
          );
        });

        // Render-time interpolation: smooth motion at any display refresh
        // rate. Without this, fixed-timestep sim → visible stutter on 120/144Hz
        // monitors (and subtle stutter at 60Hz from frame-delta jitter).
        movement.applyRender(localPlayer.sprite, alpha);

        // ─── Render-rate visual updates ──────────────────────────────
        // These must run every frame for smooth visuals at any refresh rate.
        // Scale smoothing and remote interpolation use `delta` so they're
        // frame-rate-independent.
        updateLocalPlayer(localPlayer, delta);
        chatBubbles.updatePosition(localPlayer.sprite);
        playerManager.interpolate(delta);

        layerManager.update(localPlayer.sprite, "local");
        for (const [id, { sprite }] of playerManager.otherPlayers) {
          layerManager.update(sprite, id);
        }

        // Keep the player menu attached to the clicked player as they move
        const menuTargetId = playerMenuTargetRef.current;
        const menuEl = playerMenuDomRef.current;
        if (menuTargetId && menuEl) {
          const other = playerManager.otherPlayers.get(menuTargetId);
          if (other) {
            const cam = this.cameras.main;
            const rect = this.game.canvas.getBoundingClientRect();
            const worldX = other.sprite.x;
            const worldY = other.sprite.y - other.sprite.displayHeight / 2;
            const screenX = (worldX - cam.worldView.x) * cam.zoom + rect.left;
            const screenY = (worldY - cam.worldView.y) * cam.zoom + rect.top;
            menuEl.style.left = `${screenX}px`;
            menuEl.style.top = `${screenY}px`;
          }
        }
      }

      if (cancelled) return;
      game = createPhaserGame(gameRef.current, { preload, create, update });
    })();

    return () => {
      cancelled = true;
      chatBubbles?.destroy();
      layerManager?.destroy();
      socketManager?.disconnect();
      game?.destroy(true);
    };
  }, []);

  const handleEquip = useCallback((item) => {
    const scene = sceneRef.current;
    const lp = localPlayerRef.current;
    const lm = layerManagerRef.current;
    const mp = mpRef.current;
    if (!scene || !lp || !lm) return;

    const slotKey = item.category === "appearance" ? item.subcategory : item.category;
    const effectiveId = item.itemId ?? item._id;

    lm.equip(scene, lp.sprite, "local", slotKey, item.imageUrl, effectiveId);

    const next = { ...equippedRef.current };
    next[slotKey] = item._id ?? effectiveId;
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    nextOutfit[slotKey] = { itemId: effectiveId, imageUrl: item.imageUrl };
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    // Use nextOutfit directly — getOutfitPayload(lm) is unreliable here because
    // LayerManager._createLayerSprite is async when textures aren't yet cached.
    mp.sendOutfitChange(nextOutfit);
    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  const handleUnequip = useCallback((categoryOrSlot) => {
    const lm = layerManagerRef.current;
    const mp = mpRef.current;
    if (!lm) return;

    const slotsToRemove = categoryOrSlot === "appearance"
      ? ["appearance", ...APPEARANCE_SUBS]
      : [categoryOrSlot];

    for (const slot of slotsToRemove) lm.unequip("local", slot);

    const next = { ...equippedRef.current };
    for (const slot of slotsToRemove) delete next[slot];
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    for (const slot of slotsToRemove) delete nextOutfit[slot];
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    mp.sendOutfitChange(nextOutfit);
    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  const handleApplyLookBatch = useCallback((equippedSlots, clearSlots) => {
    const scene = sceneRef.current;
    const lp = localPlayerRef.current;
    const lm = layerManagerRef.current;
    const mp = mpRef.current;
    if (!scene || !lp || !lm) return;

    // Clear explicitly removed slots (face subs handled inside unequip → rebake)
    for (const slotKey of clearSlots) lm.unequip("local", slotKey);

    for (const [slotKey, item] of Object.entries(equippedSlots)) {
      const effectiveId = item.itemId ?? item._id;
      lm.equip(scene, lp.sprite, "local", slotKey, item.imageUrl, effectiveId);
    }

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

    mp.sendOutfitChange(nextOutfit);
    pendingOutfitPayloadRef.current = nextOutfit;
    clearTimeout(outfitSaveTimerRef.current);
    outfitSaveTimerRef.current = setTimeout(() => updateOutfit(pendingOutfitPayloadRef.current).catch(() => {}), 50);
  }, []);

  equipRef.current = handleEquip;
  unequipRef.current = handleUnequip;
  if (applyLookBatchRef) applyLookBatchRef.current = handleApplyLookBatch;

  const handleSend = useCallback((text) => {
    socketRef.current?.sendChatMessage(text);
  }, []);

  const handleWhisper = useCallback((toId, text) => {
    socketRef.current?.sendWhisper(toId, text);
  }, []);

  useEffect(() => {
    if (!playerMenu && !objectMenu) return;
    const handleClick = (e) => {
      if (playerMenu && !e.target.closest("[data-player-menu]")) {
        playerMenuTargetRef.current = null;
        setPlayerMenu(null);
      }
      if (objectMenu && !e.target.closest("[data-object-menu]")) {
        setObjectMenu(null);
      }
    };
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [playerMenu, objectMenu]);

  return (
    <S.Container>
      <S.GameWrapper ref={gameRef} />
      <LoadingOverlay progress={loadProgress} ready={loadingReady} />
      {playerMenu && (
        <PlayerContextMenu
          ref={playerMenuDomRef}
          playerMenu={playerMenu}
          onClose={() => {
            playerMenuTargetRef.current = null;
            setPlayerMenu(null);
          }}
          onViewProfile={(profile) => setViewedProfile(profile)}
          onOpenWhisper={({ id, name }) => chatBoxRef.current?.openWhisper({ id, name })}
          playerManagerRef={playerManagerRef}
          layerManagerRef={layerManagerRef}
        />
      )}
      {objectMenu && (
        <S.PlayerMenu
          data-object-menu
          style={{ left: objectMenu.x, top: objectMenu.y }}
        >
          <S.PlayerMenuName>Butterfly</S.PlayerMenuName>
          <S.PlayerMenuButton
            onClick={() => {
              teleportRef.current?.("mainmap", 700, 900);
              setObjectMenu(null);
            }}
          >
            Interact
          </S.PlayerMenuButton>
        </S.PlayerMenu>
      )}
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

