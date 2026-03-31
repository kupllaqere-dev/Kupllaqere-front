import { useEffect, useRef, useCallback, useState } from "react";
import Phaser from "phaser";
import * as S from "./GameStyles";
import EditorManager from "../game/EditorManager";
import PlayerManager, { FRAME } from "../game/PlayerManager";
import SocketManager from "../network/SocketManager";
import ChatBox from "./ChatBox";

const MAP_WIDTH = 5000;
const MAP_HEIGHT = 1000;

function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export default function Game({ user }) {
  const gameRef = useRef(null);
  const socketRef = useRef(null);
  const sceneRef = useRef(null);
  const playerRef = useRef(null);
  const chatBubbleRef = useRef(null);
  const chatTimerRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [whisperMessages, setWhisperMessages] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const onlinePlayersRef = useRef([]);
  const [playerMenu, setPlayerMenu] = useState(null);

  useEffect(() => {
    const socketManager = new SocketManager();
    socketRef.current = socketManager;
    const playerManager = new PlayerManager();
    playerManager.onPlayerClick = (id, name, clientX, clientY) => {
      setPlayerMenu((prev) =>
        prev && prev.id === id ? null : { id, name, x: clientX, y: clientY },
      );
    };

    let player;
    let nameText;
    let cursors;
    let walkableZones = [];
    let editor;

    function preload() {
      this.load.on("loaderror", (file) => {
        if (file.key !== "colliders") console.error("Load error:", file.key);
      });
      this.load.image("parallax1", "/assets/maps/parallax/layer1.webp");
      this.load.image("parallax2", "/assets/maps/parallax/layer2.webp");
      this.load.image("parallax3", "/assets/maps/parallax/layer3.webp");
      this.load.spritesheet(
        "player",
        "/assets/character-bases/kupllaqere-female.png",
        {
          frameWidth: 425,
          frameHeight: 850,
        },
      );
      this.load.json("colliders", "/assets/maps/old-town/colliders.json");
    }

    function create() {
      // Parallax background layers (layer3 = farthest, layer1 = closest)
      const LAYER_W = 1578;
      const LAYER_H = 714;
      const scaleY = MAP_HEIGHT / LAYER_H;
      const scaledW = LAYER_W * scaleY;
      const tilesNeeded = Math.ceil(MAP_WIDTH / scaledW) + 1;

      const layers = [
        { key: "parallax3", scroll: 0.2 },
        { key: "parallax2", scroll: 0.5 },
        { key: "parallax1", scroll: 1 },
      ];

      layers.forEach(({ key, scroll }, layerIdx) => {
        for (let i = 0; i < tilesNeeded; i++) {
          this.add
            .image(scaledW * i + scaledW / 2, MAP_HEIGHT / 2, key)
            .setScale(scaleY)
            .setScrollFactor(scroll)
            .setDepth(-10 + layerIdx);
        }
      });

      const collidersData = this.cache.json.get("colliders");
      if (collidersData?.walkableZones) {
        walkableZones = collidersData.walkableZones.map((z) => z.points);
      }

      player = this.add.sprite(700, 900, "player", FRAME.FRONT);
      player.setOrigin(0.5, 1);
      player.setScale(0.4);
      player.setInteractive({ pixelPerfect: true });
      player.on("pointerover", () => player.postFX.addGlow(0xffffff, 3, 0));
      player.on("pointerout", () => player.postFX.clear());

      const playerName = user?.name || "Player";
      nameText = this.add
        .text(player.x, player.y + 8, playerName, {
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

      sceneRef.current = this;
      playerRef.current = player;

      const showLocalBubble = (scene, text) => {
        if (chatBubbleRef.current) chatBubbleRef.current.destroy();
        if (chatTimerRef.current) clearTimeout(chatTimerRef.current);

        const bubble = scene.add
          .text(player.x, player.y - player.displayHeight - 10, text, {
            fontSize: "11px",
            color: "#ffffff",
            backgroundColor: "#222222dd",
            padding: { x: 8, y: 5 },
            wordWrap: { width: 180 },
            align: "center",
          })
          .setOrigin(0.5, 1)
          .setDepth(100);
        chatBubbleRef.current = bubble;
        chatTimerRef.current = setTimeout(() => {
          bubble.destroy();
          chatBubbleRef.current = null;
        }, 5000);
      };

      socketManager.onChatMessage((msg) => {
        setChatMessages((prev) => [...prev.slice(-99), msg]);
        if (msg.from.id === socketManager.id) {
          showLocalBubble(this, msg.text);
        } else {
          playerManager.showChatBubble(this, msg.from.id, msg.text);
        }
      });

      socketManager.onChatHistory((history) => {
        setChatMessages(history);
      });

      socketManager.onWhisper((whisper) => {
        const targetName =
          whisper.from.id === socketManager.id
            ? onlinePlayersRef.current.find((p) => p.id === whisper.to)?.name ||
              "?"
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

      const speed = 300;
      const dt = delta / 1000;
      const left = cursors.left.isDown;
      const right = cursors.right.isDown;
      const up = cursors.up.isDown;
      const down = cursors.down.isDown;

      let dx = left ? -speed * dt : right ? speed * dt : 0;
      let dy = up ? -speed * dt : down ? speed * dt : 0;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      const curX = player.x;
      const curY = player.y;
      let newX = Phaser.Math.Clamp(curX + dx, 0, MAP_WIDTH);
      let newY = Phaser.Math.Clamp(curY + dy, 0, MAP_HEIGHT);

      if (walkableZones.length > 0 && (dx !== 0 || dy !== 0)) {
        const fullOk = walkableZones.some((z) => pointInPolygon(newX, newY, z));
        if (fullOk) {
          player.setPosition(newX, newY);
        } else {
          const xOk =
            dx !== 0 &&
            walkableZones.some((z) => pointInPolygon(newX, curY, z));
          const yOk =
            dy !== 0 &&
            walkableZones.some((z) => pointInPolygon(curX, newY, z));
          if (xOk) player.setPosition(newX, curY);
          else if (yOk) player.setPosition(curX, newY);
        }
      } else {
        player.setPosition(newX, newY);
      }

      let frame = Number(player.frame.name);
      if (left && down) frame = FRAME.FRONT_LEFT;
      else if (right && down) frame = FRAME.FRONT_RIGHT;
      else if (left && up) frame = FRAME.BACK;
      else if (right && up) frame = FRAME.BACK;
      else if (left) frame = FRAME.LEFT;
      else if (right) frame = FRAME.RIGHT;
      else if (down) frame = FRAME.FRONT;
      else if (up) frame = FRAME.BACK;
      player.setFrame(frame);

      socketManager.sendUpdate(player.x, player.y, frame);

      player.setDepth(player.y);
      nameText.setPosition(player.x, player.y + 8);
      nameText.setDepth(player.y + 1);

      if (chatBubbleRef.current) {
        chatBubbleRef.current.setPosition(
          player.x,
          player.y - player.displayHeight - 10,
        );
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scene: { preload, create, update },
    };

    const game = new Phaser.Game(config);

    return () => {
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
    if (!playerMenu) return;
    const handleClick = (e) => {
      if (e.target.closest("[data-player-menu]")) return;
      setPlayerMenu(null);
    };
    window.addEventListener("pointerdown", handleClick);
    return () => window.removeEventListener("pointerdown", handleClick);
  }, [playerMenu]);

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
