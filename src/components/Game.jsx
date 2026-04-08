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
import ChatBox from "./ChatBox";

export default function Game({ user, onEquippedChange, equipRef, unequipRef }) {
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
  const teleportRef = useRef(null);
  const equippedRef = useRef({});

  useEffect(() => {
    const socketManager = new SocketManager();
    socketRef.current = socketManager;

    const playerManager = new PlayerManager();
    playerManager.onPlayerClick = (id, name, clientX, clientY) => {
      setPlayerMenu((prev) =>
        prev && prev.id === id ? null : { id, name, x: clientX, y: clientY },
      );
    };

    const movement = new MovementManager(MAP_WIDTH, MAP_HEIGHT);
    const chatBubbles = new ChatBubbleManager();
    const layerManager = new LayerManager();
    layerManagerRef.current = layerManager;

    const mp = new MultiplayerHandler(socketManager, playerManager, chatBubbles, {
      setChatMessages,
      setWhisperMessages,
      setOnlinePlayers,
    });
    mp.layerManager = layerManager;
    mpRef.current = mp;

    let localPlayer;
    let cursors;
    let walkableZones = [];
    let editor;

    function preload() {
      this.load.on("loaderror", (file) => {
        if (file.key !== "colliders") console.error("Load error:", file.key);
      });
      preloadMap(this);
      preloadInteractables(this);
      preloadLocalPlayer(this);
    }

    function create() {
      sceneRef.current = this;
      walkableZones = createMap(this);

      localPlayer = createLocalPlayer(this, 700, 900, user?.name || "Player");
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

      // Multiplayer
      mp.join(user?.name || "Player", localPlayer.sprite.x, localPlayer.sprite.y, user?.id);
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

      // Load saved outfit from DB
      const scene = this;
      fetchOutfit()
        .then((data) => {
          if (!data.outfit) return;
          const outfitMap = {};
          for (const [cat, item] of Object.entries(data.outfit)) {
            if (item && item.itemId) {
              outfitMap[cat] = item.itemId;
              layerManager.equip(scene, localPlayer.sprite, "local", cat, item.imageUrl, item.itemId);
            }
          }
          equippedRef.current = outfitMap;
          onEquippedChange(outfitMap);
        })
        .catch(() => {});
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

      // Update all layer sprites to follow their base sprites
      layerManager.update(localPlayer.sprite, "local");
      for (const [id, { sprite }] of playerManager.otherPlayers) {
        layerManager.update(sprite, id);
      }
    }

    const game = createPhaserGame(gameRef.current, { preload, create, update });

    return () => {
      chatBubbles.destroy();
      layerManager.destroy();
      socketManager.disconnect();
      game.destroy(true);
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
      {playerMenu && (
        <S.PlayerMenu
          data-player-menu
          style={{ left: playerMenu.x, top: playerMenu.y }}
        >
          <S.PlayerMenuName>{playerMenu.name}</S.PlayerMenuName>
          <S.PlayerMenuButton>View Info</S.PlayerMenuButton>
          <S.PlayerMenuButton>Add Friend</S.PlayerMenuButton>
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
              teleportRef.current?.("old-town", 700, 900);
              setObjectMenu(null);
            }}
          >
            Interact
          </S.PlayerMenuButton>
        </S.PlayerMenu>
      )}
      <ChatBox
        messages={chatMessages}
        whispers={whisperMessages}
        players={onlinePlayers}
        myId={socketRef.current?.id}
        onSend={handleSend}
        onWhisper={handleWhisper}
      />
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
