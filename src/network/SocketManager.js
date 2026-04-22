import { io } from "socket.io-client";

// Match the server broadcast tick (50ms). Sending faster than the server
// broadcasts is wasted CPU + network; 60Hz emits can also queue WebSocket
// frames and cause perceptible main-thread stalls during movement.
const UPDATE_INTERVAL_MS = 50;

export default class SocketManager {
  constructor(url = `${import.meta.env.VITE_API_URL}`) {
    this.socket = io(url);
    this.lastSentX = 0;
    this.lastSentY = 0;
    this.lastSentFrame = 0;
    this.lastSentAnim = null;
    this.lastSentTime = 0;
  }

  join(name, x, y, map, userId, gender) {
    this.socket.emit("player:join", { name, x, y, map, userId, gender });
  }

  teleport(x, y, map) {
    this.socket.emit("player:teleport", { x, y, map });
  }

  onPlayerTeleported(callback) {
    this.socket.on("player:teleported", callback);
  }

  sendUpdate(x, y, frame, anim) {
    const px = Math.round(x);
    const py = Math.round(y);
    const normAnim = anim || null;
    const posChanged = px !== this.lastSentX || py !== this.lastSentY;
    const frameChanged = frame !== this.lastSentFrame;
    const animChanged = normAnim !== this.lastSentAnim;

    if (!posChanged && !frameChanged && !animChanged) return;

    // Send state transitions immediately (start/stop walking, direction flip).
    // Throttle pure position updates to the server tick rate.
    const now = performance.now();
    const stateTransition = animChanged || frameChanged;
    if (!stateTransition && now - this.lastSentTime < UPDATE_INTERVAL_MS) return;

    // Volatile: if the socket is mid-flush or backed up, drop stale position
    // packets rather than queueing them — the next tick's packet supersedes.
    this.socket.volatile.emit("player:update", {
      x: px,
      y: py,
      frame,
      anim: normAnim,
    });
    this.lastSentX = px;
    this.lastSentY = py;
    this.lastSentFrame = frame;
    this.lastSentAnim = normAnim;
    this.lastSentTime = now;
  }

  onGameState(callback) {
    this.socket.on("game:state", callback);
  }

  onPlayerJoined(callback) {
    this.socket.on("player:joined", callback);
  }

  onPlayersUpdated(callback) {
    this.socket.on("players:updated", callback);
  }

  onPlayerLeft(callback) {
    this.socket.on("player:left", callback);
  }

  sendChatMessage(text) {
    this.socket.emit("chat:message", { text });
  }

  onChatMessage(callback) {
    this.socket.on("chat:message", callback);
  }

  sendWhisper(toId, text) {
    this.socket.emit("chat:whisper", { to: toId, text });
  }

  onWhisper(callback) {
    this.socket.on("chat:whisper", callback);
  }

  onChatError(callback) {
    this.socket.on("chat:error", callback);
  }

  requestChatHistory() {
    this.socket.emit("chat:history");
  }

  onChatHistory(callback) {
    this.socket.on("chat:history", callback);
  }

  sendOutfitChange(outfit) {
    this.socket.emit("player:outfit", { outfit });
  }

  onPlayerOutfit(callback) {
    this.socket.on("player:outfit", callback);
  }

  onFriendsOnline(callback) {
    this.socket.on("friends:online", callback);
  }

  onFriendOnline(callback) {
    this.socket.on("friend:online", callback);
  }

  onFriendOffline(callback) {
    this.socket.on("friend:offline", callback);
  }

  onFriendsRefresh(callback) {
    this.socket.on("friends:refresh", callback);
  }

  off(event, callback) {
    this.socket.off(event, callback);
  }

  get id() {
    return this.socket.id;
  }

  disconnect() {
    this.socket.disconnect();
  }
}
