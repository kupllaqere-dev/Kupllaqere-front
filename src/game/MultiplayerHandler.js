export default class MultiplayerHandler {
  constructor(socketManager, playerManager, chatBubbles, callbacks) {
    this.socket = socketManager;
    this.players = playerManager;
    this.bubbles = chatBubbles;
    this.cb = callbacks;
    this.onlinePlayersRef = [];
    this.layerManager = null; // set externally
    this.onLocalGender = null; // set externally — called when server confirms local gender
    // Hook invoked when the server echoes our own state back in a broadcast.
    // Consumers should treat this as authoritative and smooth-correct rather
    // than snap. Null = client movement is the source of truth.
    this.onLocalAuthoritative = null;
  }

  join(name, x, y, userId, gender) {
    this.socket.join(name, x, y, undefined, userId, gender);
  }

  wire(scene, localPlayer) {
    const { socket, players, bubbles, cb } = this;

    socket.onGameState((data) => {
      if (data.you?.gender && this.onLocalGender) {
        this.onLocalGender(data.you.gender);
      }
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

    socket.onPlayersUpdated((batch) => {
      const receiveTime = performance.now();
      for (const data of batch) {
        if (data.id === socket.id) {
          // Authoritative echo of our own state — feeds reconciliation.
          this.onLocalAuthoritative?.(data, receiveTime);
          continue;
        }
        players.pushSnapshot(data, receiveTime);
      }
    });

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
          if (p.outfit && this.layerManager) {
            const other = playerManager.otherPlayers.get(p.id);
            if (other) this.layerManager.applyOutfit(scene, other.sprite, p.id, p.outfit);
          }
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
