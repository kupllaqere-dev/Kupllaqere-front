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
} from "../game/LocalPlayer";
import MovementManager from "../game/MovementManager";
import ChatBubbleManager from "../game/ChatBubbleManager";
import EditorManager from "../game/EditorManager";
import PlayerManager from "../game/PlayerManager";
import SocketManager from "../network/SocketManager";
import MultiplayerHandler from "../game/MultiplayerHandler";
import LayerManager from "../game/LayerManager";
import { createPhaserGame } from "../game/PhaserConfig";
import { fetchOutfit, updateOutfit } from "../api/items";
import { sendFriendRequest } from "../api/friends";
import ChatBox from "./ChatBox";
import OnlineFriendsBar from "./OnlineFriendsBar";
import LoadingOverlay from "./LoadingOverlay";

export default function Game({ user, onEquippedChange, onOutfitChange, equipRef, unequipRef }) {
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
  const [socketReady, setSocketReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingReady, setLoadingReady] = useState(false);
  const teleportRef = useRef(null);
  const equippedRef = useRef({});
  const outfitRef = useRef({});
  const playerMenuDomRef = useRef(null);
  const playerMenuTargetRef = useRef(null);
  const playerManagerRef = useRef(null);

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
        this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
        this.cameras.main.startFollow(localPlayer.sprite, true, 1, 1);

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
        mp.join(user?.name || "Player", localPlayer.sprite.x, localPlayer.sprite.y, user?.id, user?.gender);
        mp.wire(this, localPlayer.sprite);
        mp.wireTeleport(this, localPlayer, playerManager, {
          onMapSwitch: (scene, mapName) => {
            walkableZones = createMap(scene, mapName);
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

      function update(_time, delta) {
        if (editor.panCamera(cursors)) return;

        movement.update(localPlayer.sprite, cursors, walkableZones, delta);
        mp.sendUpdate(
          localPlayer.sprite.x,
          localPlayer.sprite.y,
          Number(localPlayer.sprite.frame.name),
          movement.currentAnim,
        );

        updateLocalPlayer(localPlayer);
        chatBubbles.updatePosition(localPlayer.sprite);

        // Smoothly interpolate remote player positions
        playerManager.interpolate(delta);

        // Update all layer sprites to follow their base sprites
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

    // Equip locally on the Phaser sprite
    lm.equip(scene, lp.sprite, "local", item.category, item.imageUrl, item._id);

    // Update equipped state
    const next = { ...equippedRef.current, [item.category]: item._id };
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current, [item.category]: { itemId: item._id, imageUrl: item.imageUrl } };
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    const changePayload = { ...getOutfitPayload(lm), [item.category]: { itemId: item._id, imageUrl: item.imageUrl } };

    mp.sendOutfitChange(changePayload);
    updateOutfit(changePayload).catch(() => {});
  }, []);

  const handleUnequip = useCallback((category) => {
    const lm = layerManagerRef.current;
    const mp = mpRef.current;
    if (!lm) return;

    lm.unequip("local", category);

    const next = { ...equippedRef.current };
    delete next[category];
    equippedRef.current = next;
    onEquippedChange(next);

    const nextOutfit = { ...outfitRef.current };
    delete nextOutfit[category];
    outfitRef.current = nextOutfit;
    onOutfitChange(nextOutfit);

    const changePayload = getOutfitPayload(lm);
    delete changePayload[category];

    mp.sendOutfitChange(changePayload);
    updateOutfit(changePayload).catch(() => {});
  }, []);

  equipRef.current = handleEquip;
  unequipRef.current = handleUnequip;

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
        <S.PlayerMenu
          ref={playerMenuDomRef}
          data-player-menu
          style={{ left: playerMenu.x, top: playerMenu.y }}
        >
          <S.PlayerMenuName>{playerMenu.name}</S.PlayerMenuName>
          <S.PlayerMenuButton>View Info</S.PlayerMenuButton>
          <S.PlayerMenuButton
            disabled={!playerMenu.userId || playerMenu.status === "pending"}
            onClick={async () => {
              if (!playerMenu.userId) return;
              setPlayerMenu((prev) => prev && { ...prev, status: "pending" });
              try {
                const result = await sendFriendRequest(playerMenu.userId);
                setPlayerMenu((prev) =>
                  prev && { ...prev, status: result.status === "accepted" ? "accepted" : "sent" },
                );
              } catch (err) {
                setPlayerMenu((prev) =>
                  prev && { ...prev, status: "error", error: err.message },
                );
              }
            }}
          >
            {playerMenu.status === "pending" && "Sending…"}
            {playerMenu.status === "sent" && "Request Sent"}
            {playerMenu.status === "accepted" && "Friends!"}
            {playerMenu.status === "error" && (playerMenu.error || "Failed")}
            {!playerMenu.status && "Add Friend"}
          </S.PlayerMenuButton>
          <S.PlayerMenuButton $danger>Block</S.PlayerMenuButton>
        </S.PlayerMenu>
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
      {/* <ChatBox
        messages={chatMessages}
        whispers={whisperMessages}
        players={onlinePlayers}
        myId={socketRef.current?.id}
        onSend={handleSend}
        onWhisper={handleWhisper}
      /> */}
      {socketReady && <OnlineFriendsBar socket={socketRef.current} />}
    </S.Container>
  );
}

/** Build the full outfit payload from current layers */
function getOutfitPayload(layerManager) {
  const layers = layerManager.layers.get("local");
  if (!layers) return {};
  const payload = {};
  for (const [category, { key, imageUrl }] of layers) {
    const itemId = key.replace("item_", "");
    payload[category] = { itemId, imageUrl };
  }
  return payload;
}
