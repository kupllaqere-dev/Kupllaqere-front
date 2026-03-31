import { useEffect, useRef, useCallback, useState } from "react";
import Phaser from "phaser";
import * as S from "./GameStyles";
import { MAP_WIDTH, MAP_HEIGHT, preloadMap, createMap } from "../game/MapManager";
import { preloadInteractables, createInteractables } from "../game/InteractableManager";
import MovementManager from "../game/MovementManager";
import ChatBubbleManager from "../game/ChatBubbleManager";
import EditorManager from "../game/EditorManager";
import PlayerManager, { FRAME } from "../game/PlayerManager";
import SocketManager from "../network/SocketManager";
import ChatBox from "./ChatBox";

export default function Game({ user }) {
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [whisperMessages, setWhisperMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const onlinePlayersRef = useRef([]);
  const [playerMenu, setPlayerMenu] = useState(null);
  const [objectMenu, setObjectMenu] = useState(null);

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

    let player;
    let nameText;
    let cursors;
    let walkableZones = [];
    let editor;

    function preload() {
      this.load.on("loaderror", (file) => {
        if (file.key !== "colliders") console.error("Load error:", file.key);
      });
      preloadMap(this);
      preloadInteractables(this);
      this.load.spritesheet(
        "player",
        "/assets/character-bases/kupllaqere-female.png",
        { frameWidth: 425, frameHeight: 850 },
      );
    }

    function create() {
      walkableZones = createMap(this);

      player = this.add.sprite(700, 900, "player", FRAME.FRONT);
      player.setOrigin(0.5, 1);
      player.setScale(0.4);
      player.setInteractive({ pixelPerfect: true });
      player.on("pointerover", () => player.postFX.addGlow(0xffffff, 3, 0));
      player.on("pointerout", () => player.postFX.clear());

      nameText = this.add
        .text(player.x, player.y + 8, user?.name || "Player", {
          fontSize: "12px",
          color: "#ffffff",
          backgroundColor: "#00000088",
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5, 0)
        .setDepth(51);

      cursors = this.input.keyboard.createCursorKeys();
      this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
      this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
      this.cameras.main.startFollow(player, true, 1, 1);

      editor = new EditorManager(this, player, walkableZones);

      createInteractables(this, (pos) => {
        setObjectMenu((prev) => (prev ? null : pos));
      });

      this.input.on("pointerdown", (pointer) => {
        movement.handleClick(this, pointer, walkableZones);
      });

      // --- Multiplayer setup ---
      socketManager.join(user?.name || "Player", player.x, player.y);

      socketManager.onGameState((data) => {
        const others = [];
        for (const p of data.players) {
          if (p.id === socketManager.id) continue;
          playerManager.addPlayer(this, p);
          others.push({ id: p.id, name: p.name });
        }
        onlinePlayersRef.current = others;
        setOnlinePlayers(others);
      });

      socketManager.onPlayerJoined((data) => {
        playerManager.addPlayer(this, data);
        setOnlinePlayers((prev) => {
          const next = [...prev, { id: data.id, name: data.name }];
          onlinePlayersRef.current = next;
          return next;
        });
      });
      socketManager.onPlayerUpdated((data) => playerManager.updatePlayer(data));
      socketManager.onPlayerLeft((data) => {
        playerManager.removePlayer(data.id);
        setOnlinePlayers((prev) => {
          const next = prev.filter((p) => p.id !== data.id);
          onlinePlayersRef.current = next;
          return next;
        });
      });

      socketManager.onChatMessage((msg) => {
        setChatMessages((prev) => [...prev.slice(-99), msg]);
        if (msg.from.id === socketManager.id) {
          chatBubbles.show(this, player, msg.text);
        } else {
          playerManager.showChatBubble(this, msg.from.id, msg.text);
        }
      });

      socketManager.onChatHistory((history) => setChatMessages(history));

      socketManager.onWhisper((whisper) => {
        const targetName =
          whisper.from.id === socketManager.id
            ? onlinePlayersRef.current.find((p) => p.id === whisper.to)?.name || "?"
            : whisper.from.name;
        setWhisperMessages((prev) => [
          ...prev.slice(-99),
          { ...whisper, id: Date.now().toString(36), toName: targetName },
        ]);
      });

      socketManager.requestChatHistory();
    }

    function update(_time, delta) {
      if (editor.panCamera(cursors)) return;

      movement.update(player, cursors, walkableZones, delta);
      socketManager.sendUpdate(player.x, player.y, Number(player.frame.name));

      player.setDepth(player.y);
      nameText.setPosition(player.x, player.y + 8);
      nameText.setDepth(player.y + 1);
      chatBubbles.updatePosition(player);
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scene: { preload, create, update },
    });

    return () => {
      chatBubbles.destroy();
      socketManager.disconnect();
      game.destroy(true);
    };
  }, []);

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
          <S.PlayerMenuButton onClick={() => setObjectMenu(null)}>
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
