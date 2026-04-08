export default class MultiplayerHandler {
  constructor(socketManager, playerManager, chatBubbles, callbacks) {
    this.socket = socketManager;
    this.players = playerManager;
    this.bubbles = chatBubbles;
    this.cb = callbacks;
    this.onlinePlayersRef = [];
    this.layerManager = null; // set externally
  }

  join(name, x, y) {
    this.socket.join(name, x, y);
  }

  wire(scene, localPlayer) {
    const { socket, players, bubbles, cb } = this;

    socket.onGameState((data) => {
      const others = [];
      for (const p of data.players) {
        if (p.id === socket.id) continue;
        players.addPlayer(scene, p);
        others.push({ id: p.id, name: p.name });
        // Apply outfit for joining players
        if (p.outfit && this.layerManager) {
          const other = players.otherPlayers.get(p.id);
          if (other) this.layerManager.applyOutfit(scene, other.sprite, p.id, p.outfit);
        }
      }
      this.onlinePlayersRef = others;
      cb.setOnlinePlayers(others);
    });

    socket.onPlayerJoined((data) => {
      players.addPlayer(scene, data);
      if (data.outfit && this.layerManager) {
        const other = players.otherPlayers.get(data.id);
        if (other) this.layerManager.applyOutfit(scene, other.sprite, data.id, data.outfit);
      }
      cb.setOnlinePlayers((prev) => {
        const next = [...prev, { id: data.id, name: data.name }];
        this.onlinePlayersRef = next;
        return next;
      });
    });

    socket.onPlayerUpdated((data) => players.updatePlayer(data));

    socket.onPlayerLeft((data) => {
      if (this.layerManager) this.layerManager.clearAll(data.id);
      players.removePlayer(data.id);
      cb.setOnlinePlayers((prev) => {
        const next = prev.filter((p) => p.id !== data.id);
        this.onlinePlayersRef = next;
        return next;
      });
    });

    // When another player changes outfit
    socket.onPlayerOutfit((data) => {
      if (!this.layerManager) return;
      const other = players.otherPlayers.get(data.id);
      if (other) {
        this.layerManager.applyOutfit(scene, other.sprite, data.id, data.outfit);
      }
    });

    socket.onChatMessage((msg) => {
      cb.setChatMessages((prev) => [...prev.slice(-99), msg]);
      if (msg.from.id === socket.id) {
        bubbles.show(scene, localPlayer, msg.text);
      } else {
        players.showChatBubble(scene, msg.from.id, msg.text);
      }
    });

    socket.onChatHistory((history) => cb.setChatMessages(history));

    socket.onWhisper((whisper) => {
      const targetName =
        whisper.from.id === socket.id
          ? this.onlinePlayersRef.find((p) => p.id === whisper.to)?.name || "?"
          : whisper.from.name;
      cb.setWhisperMessages((prev) => [
        ...prev.slice(-99),
        { ...whisper, id: Date.now().toString(36), toName: targetName },
      ]);
    });

    socket.requestChatHistory();
  }

  wireTeleport(scene, localPlayer, playerManager, callbacks) {
    const { socket } = this;

    socket.onPlayerTeleported((data) => {
      const walkableZones = callbacks.onMapSwitch(scene, data.to.map);
      callbacks.onReposition(localPlayer, data.to.x, data.to.y);

      playerManager.otherPlayers.forEach((_, id) =>
        playerManager.removePlayer(id),
      );

      if (data.players) {
        const others = [];
        for (const p of data.players) {
          if (p.id === socket.id) continue;
          playerManager.addPlayer(scene, p);
          others.push({ id: p.id, name: p.name });
        }
        this.onlinePlayersRef = others;
        this.cb.setOnlinePlayers(others);
      }

      return walkableZones;
    });
  }

  teleport(mapName, x, y) {
    this.socket.teleport(x, y, mapName);
  }

  sendUpdate(x, y, frame, anim) {
    this.socket.sendUpdate(x, y, frame, anim);
  }

  sendOutfitChange(outfit) {
    this.socket.sendOutfitChange(outfit);
  }
}
