import ChatBubbleManager from "./ChatBubbleManager.js";

export default class MultiplayerHandler {
  constructor(socketManager, callbacks) {
    this.socket  = socketManager;
    this.cb      = callbacks;
    this.onlinePlayersRef = [];
    this.onNameUpdate  = null;
    this.onBioUpdate   = null;
    this.onBadgeUpdate = null;
    this.onMapChange   = null;

    // Set via setGameObjects() in Phaser create()
    this.scene             = null;
    this.playerManager     = null;
    this.localSprite       = null;
    this.localChatBubble   = new ChatBubbleManager();
  }

  // Called from Phaser create() once the scene is ready.
  setGameObjects(scene, playerManager) {
    this.scene         = scene;
    this.playerManager = playerManager;

    // Forward click on a remote player to the profile viewer.
    this.playerManager.onPlayerClick = (id, name, clientX, clientY, userId) => {
      if (this.onPlayerClick) this.onPlayerClick(id, name, clientX, clientY, userId);
    };
  }

  join(name, userId, gender, x, y, map) {
    this.socket.join(name, userId, gender, x, y, map);
  }

  /** Tell the server we're switching map rooms. */
  changeMap(map, x, y) {
    this.socket.changeMap(map, x, y);
  }

  // Replaces the roster and sprite set with the occupants of the map we're in.
  // Used both on initial join and on every map switch.
  _populate(players) {
    const { socket, cb } = this;
    const others = (players || [])
      .filter(p => p.id !== socket.id)
      .map(p => ({ id: p.id, name: p.name, userId: p.userId || null }));
    this.onlinePlayersRef = others;
    cb.setOnlinePlayers(others);

    if (!this.scene || !this.playerManager) return;
    for (const p of (players || [])) {
      if (p.id === socket.id) continue;
      this.playerManager.addPlayer(this.scene, {
        id:            p.id,
        name:          p.name,
        x:             p.x    ?? 1500,
        y:             p.y    ?? 700,
        gender:        p.gender || "female",
        outfit:        p.outfit || {},
        skinColor:     p.skinColor || null,
        userId:        p.userId || null,
        selectedBadge: p.selectedBadge || null,
      });
    }
  }

  wire() {
    const { socket, cb } = this;

    socket.onGameState((data) => {
      this._populate(data.players);
    });

    // Server finished moving us into the new room — the roster it sends is the
    // authoritative occupant list for that map.
    socket.onMapChanged((data) => {
      this.playerManager?.clearAll();
      this._populate(data.players);
      this.onMapChange?.(data.map);
    });

    socket.onPlayerJoined((data) => {
      cb.setOnlinePlayers(prev => {
        const next = [...prev, { id: data.id, name: data.name, userId: data.userId || null }];
        this.onlinePlayersRef = next;
        return next;
      });

      if (this.scene && this.playerManager) {
        this.playerManager.addPlayer(this.scene, {
          id:            data.id,
          name:          data.name,
          x:             data.x    ?? 1500,
          y:             data.y    ?? 700,
          gender:        data.gender || "female",
          outfit:        data.outfit || {},
          skinColor:     data.skinColor || null,
          userId:        data.userId || null,
          selectedBadge: data.selectedBadge || null,
        });
      }
    });

    socket.onPlayerLeft((data) => {
      cb.setOnlinePlayers(prev => {
        const next = prev.filter(p => p.id !== data.id);
        this.onlinePlayersRef = next;
        return next;
      });
      this.playerManager?.removePlayer(data.id);
    });

    socket.onPlayerMove?.((data) => {
      this.playerManager?.pushSnapshot(data);
    });

    socket.onPlayerOutfit((data) => {
      const other = this.playerManager?.otherPlayers.get(data.id);
      if (!other) return;
      this.playerManager.applyOutfit(data.id, other.sprite.gender, data.outfit || {}, data.skinColor ?? null);
    });

    socket.onPlayerName((data) => {
      const name = data.name || "";
      this.onNameUpdate?.(data.userId, name);

      cb.setOnlinePlayers(prev => {
        const next = prev.map(p => (p.id === data.id ? { ...p, name } : p));
        this.onlinePlayersRef = next;
        return next;
      });

      this.playerManager?.updateName(data.id, name);
    });

    socket.onPlayerBio((data) => {
      this.onBioUpdate?.(data.userId, data.bio || "");
    });

    socket.onPlayerBadge((data) => {
      this.onBadgeUpdate?.(data.userId, data.badge || null);
      if (this.scene && this.playerManager) {
        this.playerManager.updateBadge(this.scene, data.id, data.badge);
      }
    });

    socket.onChatMessage((msg) => {
      cb.setChatMessages(prev => [...prev.slice(-29), msg]);
      if (!this.scene || !msg.text) return;
      const senderId = msg.from?.id;
      if (senderId === socket.id) {
        if (this.localSprite) this.localChatBubble.show(this.scene, this.localSprite, msg.text);
      } else {
        this.playerManager?.showChatBubble(this.scene, senderId, msg.text);
      }
    });

    socket.onWhisper((whisper) => {
      const targetName =
        whisper.from.id === socket.id
          ? this.onlinePlayersRef.find(p => p.id === whisper.to)?.name || "?"
          : whisper.from.name;
      cb.setWhisperMessages(prev => [
        ...prev.slice(-29),
        { ...whisper, id: Date.now().toString(36), toName: targetName },
      ]);
    });
  }

  sendOutfitChange(outfit, skinColor = null) {
    this.socket.sendOutfitChange(outfit, skinColor);
  }

  sendMove(data) {
    this.socket.sendMove?.(data);
  }
}
