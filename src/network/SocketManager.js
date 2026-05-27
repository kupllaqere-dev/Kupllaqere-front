import { io } from "socket.io-client";

export default class SocketManager {
  constructor(url = `${import.meta.env.VITE_API_URL}`) {
    this.socket = io(url);
  }

  join(name, userId, gender) {
    this.socket.emit("player:join", { name, userId, gender });
  }

  onGameState(callback) {
    this.socket.on("game:state", callback);
  }

  onPlayerJoined(callback) {
    this.socket.on("player:joined", callback);
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

  sendMove(data) {
    this.socket.emit("player:move", data);
  }

  onPlayerMove(callback) {
    this.socket.on("player:move", callback);
  }

  sendOutfitChange(outfit) {
    this.socket.emit("player:outfit", { outfit });
  }

  onPlayerOutfit(callback) {
    this.socket.on("player:outfit", callback);
  }

  onPlayerBio(callback) {
    this.socket.on("player:bio", callback);
  }

  onPlayerBadge(callback) {
    this.socket.on("player:badge", callback);
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

  onFriendStatus(callback) {
    this.socket.on("friend:status", callback);
  }

  onUserStatus(callback) {
    this.socket.on("user:status", callback);
  }

  onSoulMateRefresh(callback) {
    this.socket.on("soulmate:refresh", callback);
  }

  onMailNew(callback) {
    this.socket.on("mail:new", callback);
  }

  // ── Chess ──────────────────────────────────────────
  sendChessInvite(targetSocketId) {
    this.socket.emit("chess:invite", { targetSocketId });
  }

  sendChessDecline(inviterSocketId) {
    this.socket.emit("chess:decline", { inviterSocketId });
  }

  sendChessAccept(inviterSocketId) {
    this.socket.emit("chess:accept", { inviterSocketId });
  }

  sendChessMove(opponentSocketId, from, to, promotion) {
    this.socket.emit("chess:move", { opponentSocketId, from, to, promotion });
  }

  sendChessResign(opponentSocketId) {
    this.socket.emit("chess:resign", { opponentSocketId });
  }

  onChessInviteReceived(callback) {
    this.socket.on("chess:invite:received", callback);
  }

  onChessDeclineReceived(callback) {
    this.socket.on("chess:decline:received", callback);
  }

  onChessAcceptReceived(callback) {
    this.socket.on("chess:accept:received", callback);
  }

  onChessMoveReceived(callback) {
    this.socket.on("chess:move:received", callback);
  }

  onChessResignReceived(callback) {
    this.socket.on("chess:resign:received", callback);
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
