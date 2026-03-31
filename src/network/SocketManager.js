import { io } from "socket.io-client";

export default class SocketManager {
  constructor(url = `${import.meta.env.VITE_API_URL}`) {
    this.socket = io(url);
    this.lastSentX = 0;
    this.lastSentY = 0;
    this.lastSentFrame = 0;
  }

  join(name, x, y) {
    this.socket.emit("player:join", { name, x, y });
  }

  sendUpdate(x, y, frame) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (
      px !== this.lastSentX ||
      py !== this.lastSentY ||
      frame !== this.lastSentFrame
    ) {
      this.socket.emit("player:update", { x: px, y: py, frame });
      this.lastSentX = px;
      this.lastSentY = py;
      this.lastSentFrame = frame;
    }
  }

  onGameState(callback) {
    this.socket.on("game:state", callback);
  }

  onPlayerJoined(callback) {
    this.socket.on("player:joined", callback);
  }

  onPlayerUpdated(callback) {
    this.socket.on("player:updated", callback);
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

  get id() {
    return this.socket.id;
  }

  disconnect() {
    this.socket.disconnect();
  }
}
