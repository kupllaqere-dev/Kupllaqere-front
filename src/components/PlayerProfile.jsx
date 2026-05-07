import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import {
  fetchSoulMateState,
  sendSoulMateRequest,
  acceptSoulMateRequest,
  declineSoulMateRequest,
  cancelSoulMateRequest,
  removeSoulMate,
} from "../api/soulmate";
import {
  fetchFriends,
  sendFriendRequest,
  acceptFriendRequest as acceptFriend,
  cancelFriendRequest as cancelFriend,
  declineFriendRequest as declineFriend,
  removeFriend,
} from "../api/friends";
import {
  fetchGuestBookComments,
  postGuestBookComment,
  deleteGuestBookComment,
} from "../api/guestbook";
import {
  fetchConversations,
  fetchThread,
  markThreadRead,
  replyToThread,
  sendMail,
} from "../api/mail";
import { lookupUser, updatePresence } from "../api/auth";
import { fetchInventory, sellItem, fetchWishlist, removeFromWishlist } from "../api/store";
import { fetchProfileView, saveProfileView, clearProfileView, fetchUserStatus, invalidateProfileViewCache, invalidateStatusCache } from "../api/users";
import PlayerThumbnail from "./PlayerThumbnail";
import ComposeMailModal from "./ComposeMailModal";

const FRAME_W = 510;
const FRAME_H = 900;
const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6, 1.8];
const POSE_ORDER = [0, 4, 5, 3, 2, 1];
const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];
const LAYER_ORDER = ["appearance", "bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];
const BADGES = ["diamond", "flame", "medal", "paint", "verified"];

const INV_CATEGORY_LABELS = {
  tops: "Tops", bottoms: "Bottoms", onePiece: "One Piece", coats: "Coats",
  head: "Head", hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance",
};
const INV_SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations", horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear", necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
};
const INV_CATEGORY_SUBCATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts", "skirt"],
  onePiece: ["overall", "dress"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
  appearance: ["eyes", "eyebrows", "nose", "mouth", "beard"],
};
const INV_CATEGORY_DECO = {
  tops: "/assets/store/tops.png", bottoms: "/assets/store/bottoms.png",
  onePiece: "/assets/store/onepiece.png", coats: "/assets/store/coats.png",
  head: "/assets/store/head.png", hair: "/assets/store/hair.png",
  accessories: "/assets/store/accessories.png", feet: "/assets/store/feet.png",
  hands: "/assets/store/hands.png", appearance: "/assets/store/head.png",
};
const INV_CATEGORIES = Object.keys(INV_CATEGORY_LABELS);
function invGetSellPrice(entry) {
  if (entry.currency === "gems") return (entry.amountPaid || 0) * 1000;
  return Math.floor((entry.amountPaid || 0) / 2);
}
const BADGE_RARITY = { diamond: "legendary", flame: "legendary", medal: "rare", paint: "rare", verified: "common" };
const BIO_MAX = 150;
const SHOWCASE_SLOTS = 5;
const COMMENT_MAX = 100;

const PRESENCE_LABELS = {
  online:    "Online",
  away:      "Away",
  offline:   "Offline",
  invisible: "Invisible",
};

const imageCache = new Map();
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  }).catch(() => { imageCache.delete(src); return null; });
  imageCache.set(src, promise);
  return promise;
}

function extractFrame(img, frameIndex, cols) {
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  return { sx: col * FRAME_W, sy: row * FRAME_H };
}

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function bioToHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>")
    .replace(/_([^_]+?)_/g, "<u>$1</u>")
    .replace(/\n/g, "<br>");
}

export default function PlayerProfile({
  onClose,
  playerName,
  outfit,
  gender,
  bio = "",
  onSaveBio,
  selectedBadge = null,
  onSaveBadge,
  currentUserId = null,
  targetUserId = null,
  socket = null,
  unreadMailCount = 0,
  onUnreadChange = null,
  onOpenAlbum = null,
  onOpenMarketplace = null,
  onEquip = null,
  onUnequip = null,
  equipped = null,
  level = 1,
}) {
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  const isSelfView = !!(
    currentUserId && targetUserId &&
    String(currentUserId) === String(targetUserId)
  );

  const [poseIndex, setPoseIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [hasLockedView, setHasLockedView] = useState(false);
  const [viewLoaded, setViewLoaded] = useState(false);
  const [viewSaving, setViewSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panAtDrag = useRef({ x: 0, y: 0 });
  const [baseImg, setBaseImg] = useState(null);
  const [layerImages, setLayerImages] = useState([]);

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState(null);

  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgesExpanded, setBadgesExpanded] = useState(false);

  const [smState, setSmState] = useState(null);
  const [smBusy, setSmBusy] = useState(false);
  const [smError, setSmError] = useState(null);

  const [friendStatus, setFriendStatus] = useState(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const [composing, setComposing] = useState(false);

  const [showcaseItems] = useState(Array(SHOWCASE_SLOTS).fill(null));

  const [gbOpen, setGbOpen] = useState(false);
  const [gbComments, setGbComments] = useState([]);
  const [gbLoading, setGbLoading] = useState(false);
  const [gbInput, setGbInput] = useState("");
  const [gbSubmitting, setGbSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");

  const [invItems, setInvItems] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invLoaded, setInvLoaded] = useState(false);
  const [invView, setInvView] = useState("categories");
  const [invCategory, setInvCategory] = useState(null);
  const [invSubcategory, setInvSubcategory] = useState(null);
  const [invSelectedEntries, setInvSelectedEntries] = useState({});
  const [invPreviewOutfit, setInvPreviewOutfit] = useState(outfit || {});
  const [invPreviewLayerImages, setInvPreviewLayerImages] = useState([]);
  const [invSelling, setInvSelling] = useState(null);
  const [invSellError, setInvSellError] = useState(null);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);

  const [mailConversations, setMailConversations] = useState([]);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailListsLoaded, setMailListsLoaded] = useState(false);
  const [mailThread, setMailThread] = useState(null);
  const [mailThreadLoading, setMailThreadLoading] = useState(false);
  const [mailReplyBody, setMailReplyBody] = useState("");
  const [mailReplySending, setMailReplySending] = useState(false);
  const [mailReplyError, setMailReplyError] = useState(null);

  const [friendsTab, setFriendsTab] = useState("friends");
  const [friendsData, setFriendsData] = useState(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsSearch, setFriendsSearch] = useState("");

  const [userStatus, setUserStatus] = useState(null); // { status, manualStatus }
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const statusPickerRef = useRef(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => { setBioDraft(bio); }, [bio]);

  // Fetch presence status for the viewed player
  useEffect(() => {
    if (!targetUserId) return;
    fetchUserStatus(targetUserId).then(setUserStatus).catch(() => {});
  }, [targetUserId]);

  // Live status updates via socket
  useEffect(() => {
    if (!socket?.socket) return;
    const onFriendStatus = (payload) => {
      if (String(payload.userId) === String(targetUserId)) {
        setUserStatus((prev) => ({ ...prev, status: payload.status }));
      }
    };
    const onUserStatus = (payload) => {
      if (isSelfView) {
        setUserStatus((prev) => ({ ...prev, ...payload }));
      }
    };
    socket.socket.on("friend:status", onFriendStatus);
    socket.socket.on("user:status",   onUserStatus);
    return () => {
      socket.socket.off("friend:status", onFriendStatus);
      socket.socket.off("user:status",   onUserStatus);
    };
  }, [socket, targetUserId, isSelfView]);

  // Close status picker on outside click — must check both the anchor and the portal node
  useEffect(() => {
    if (!statusPickerOpen) return;
    const handler = (e) => {
      const inAnchor   = statusPickerRef.current?.contains(e.target);
      const inDropdown = statusDropdownRef.current?.contains(e.target);
      if (!inAnchor && !inDropdown) setStatusPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusPickerOpen]);

  const handleChangeStatus = async (newManualStatus) => {
    if (statusChanging) return;
    setStatusChanging(true);
    setStatusPickerOpen(false);
    try {
      const result = await updatePresence(newManualStatus);
      invalidateStatusCache(targetUserId);
      setUserStatus(result);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusChanging(false);
    }
  };

  const loadSm = useCallback(async () => {
    if (!currentUserId) { setSmState(null); return; }
    try {
      const data = await fetchSoulMateState(targetUserId || null);
      setSmState(data);
      setSmError(null);
    } catch (err) {
      setSmError(err.message || "Failed to load soul mate state");
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => { loadSm(); }, [loadSm]);

  useEffect(() => {
    if (!socket?.socket) return;
    const handler = () => loadSm();
    socket.socket.on("soulmate:refresh", handler);
    return () => socket.socket.off("soulmate:refresh", handler);
  }, [socket, loadSm]);

  const runSm = useCallback(async (fn) => {
    if (smBusy) return;
    setSmBusy(true);
    setSmError(null);
    try { await fn(); await loadSm(); }
    catch (err) { setSmError(err.message || "Action failed"); }
    finally { setSmBusy(false); }
  }, [smBusy, loadSm]);

  const smSendRequest = () => runSm(() => sendSoulMateRequest(targetUserId));
  const smAccept = (id) => runSm(() => acceptSoulMateRequest(id));
  const smDecline = (id) => runSm(() => declineSoulMateRequest(id));
  const smCancel = () => runSm(() => cancelSoulMateRequest());
  const smRemove = () => runSm(() => removeSoulMate());

  const loadFriendStatus = useCallback(async () => {
    if (!currentUserId || isSelfView || !targetUserId) return;
    try {
      const data = await fetchFriends();
      const tid = String(targetUserId);
      if (data.friends?.some((f) => String(f.id) === tid)) setFriendStatus("friends");
      else if (data.sent?.some((f) => String(f.id) === tid)) setFriendStatus("i_sent");
      else if (data.received?.some((f) => String(f.id) === tid)) setFriendStatus("they_sent");
      else setFriendStatus("none");
    } catch {
      setFriendStatus("none");
    }
  }, [currentUserId, isSelfView, targetUserId]);

  useEffect(() => { loadFriendStatus(); }, [loadFriendStatus]);

  const runFriend = useCallback(async (fn) => {
    if (friendBusy) return;
    setFriendBusy(true);
    try { await fn(); await loadFriendStatus(); }
    catch (err) { console.error(err); }
    finally { setFriendBusy(false); }
  }, [friendBusy, loadFriendStatus]);

  const handleFriendBtn = () => {
    if (friendStatus === "none") runFriend(() => sendFriendRequest(targetUserId));
    else if (friendStatus === "i_sent") runFriend(() => cancelFriend(targetUserId));
    else if (friendStatus === "they_sent") runFriend(() => acceptFriend(targetUserId));
    else if (friendStatus === "friends") runFriend(() => removeFriend(targetUserId));
  };

  const friendBtnLabel = () => {
    if (friendStatus === null) return "…";
    if (friendStatus === "none") return "Add Friend";
    if (friendStatus === "i_sent") return "Req Sent";
    if (friendStatus === "they_sent") return "Accept";
    if (friendStatus === "friends") return "Unfriend";
    return "…";
  };

  const handleBadgeClick = async (name) => {
    if (!onSaveBadge || badgeSaving) return;
    const next = selectedBadge === name ? null : name;
    setBadgeSaving(true);
    try { await onSaveBadge(next); }
    catch (err) { console.error("Badge save failed:", err); }
    finally { setBadgeSaving(false); }
  };

  useEffect(() => {
    const src = gender === "male"
      ? "/assets/character-bases/men-test.png"
      : "/assets/character-bases/females_new.png";
    loadImage(src).then((img) => { if (img) setBaseImg(img); });
  }, [gender]);

  useEffect(() => {
    if (!outfit) { setLayerImages([]); return; }
    const entries = LAYER_ORDER
      .filter((cat) => outfit[cat]?.imageUrl)
      .map((cat) => ({ category: cat, url: outfit[cat].imageUrl }));
    let cancelled = false;
    Promise.all(
      entries.map(({ category, url }) =>
        loadImage(url).then((img) => img ? { category, img } : null)
      )
    ).then((results) => {
      if (!cancelled) setLayerImages(results.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [outfit]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cols = Math.floor(baseImg.width / FRAME_W);
    const frameIndex = POSE_ORDER[poseIndex];
    const { sx, sy } = extractFrame(baseImg, frameIndex, cols);
    ctx.drawImage(baseImg, sx, sy, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
    const activeLayers = activeTab === "inventory" ? invPreviewLayerImages : layerImages;
    for (const { img } of activeLayers) {
      const layerCols = Math.floor(img.width / FRAME_W);
      const { sx: lx, sy: ly } = extractFrame(img, frameIndex, layerCols);
      ctx.drawImage(img, lx, ly, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
    }
  }, [baseImg, layerImages, invPreviewLayerImages, poseIndex, activeTab]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!invPreviewOutfit || Object.keys(invPreviewOutfit).length === 0) {
      setInvPreviewLayerImages([]); return;
    }
    const entries = LAYER_ORDER
      .filter(cat => invPreviewOutfit[cat]?.imageUrl)
      .map(cat => ({ category: cat, url: invPreviewOutfit[cat].imageUrl }));
    let cancelled = false;
    Promise.all(entries.map(({ category, url }) =>
      loadImage(url).then((img) => img ? { category, img } : null)
    )).then(results => {
      if (!cancelled) setInvPreviewLayerImages(results.filter(Boolean));
    });
    return () => { cancelled = true; };
  }, [invPreviewOutfit]);

  const applyFormat = (marker) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: ss, selectionEnd: se } = ta;
    const selected = bioDraft.substring(ss, se);
    const newText = bioDraft.substring(0, ss) + marker + selected + marker + bioDraft.substring(se);
    setBioDraft(newText);
    setTimeout(() => {
      ta.focus();
      if (ss === se) ta.setSelectionRange(ss + marker.length, ss + marker.length);
      else ta.setSelectionRange(ss + marker.length, se + marker.length);
    }, 0);
  };

  const turnLeft = () => setPoseIndex((i) => (i - 1 + POSE_ORDER.length) % POSE_ORDER.length);
  const turnRight = () => setPoseIndex((i) => (i + 1) % POSE_ORDER.length);
  const zoomOut = () => setZoomIndex((i) => Math.max(i - 1, 0));
  const zoomIn = () => setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1));

  // Load the profile owner's saved avatar view (pose, zoom, pan) on mount
  useEffect(() => {
    if (!targetUserId) return;
    fetchProfileView(targetUserId).then((view) => {
      if (view) {
        setHasLockedView(view.locked ?? false);
        if (view.locked) {
          setPoseIndex(view.poseIndex ?? 0);
          setZoomIndex(view.zoomIndex ?? 0);
          setPanX(view.panX ?? 0);
          setPanY(view.panY ?? 0);
        }
      }
      setViewLoaded(true);
    }).catch(() => { setViewLoaded(true); });
  }, [targetUserId]);

  // Drag-to-pan: track mouse globally so the drag works even when cursor leaves the viewport
  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      setPanX(panAtDrag.current.x + (e.clientX - dragStart.current.x));
      setPanY(panAtDrag.current.y + (e.clientY - dragStart.current.y));
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onViewportMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panAtDrag.current = { x: panX, y: panY };
    e.preventDefault();
  };

  const handleSaveView = async () => {
    if (viewSaving) return;
    setViewSaving(true);
    try {
      await saveProfileView({ poseIndex, zoomIndex, panX, panY });
      invalidateProfileViewCache(targetUserId);
      setHasLockedView(true);
    } catch (err) {
      console.error(err);
    } finally {
      setViewSaving(false);
    }
  };

  const handleUnlockView = async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      await clearProfileView();
      invalidateProfileViewCache(targetUserId);
      setHasLockedView(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUnlocking(false);
    }
  };

  const visibleBadges = badgesExpanded ? BADGES : BADGES.slice(0, 6);

  const loadGbComments = useCallback(async () => {
    if (!targetUserId) return;
    setGbLoading(true);
    try {
      const data = await fetchGuestBookComments(targetUserId);
      setGbComments(data.comments || []);
    } catch {
      setGbComments([]);
    } finally {
      setGbLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => { loadGbComments(); }, [loadGbComments]);

  const loadMailLists = useCallback(async () => {
    if (!isSelfView) return;
    setMailLoading(true);
    try {
      setMailConversations(await fetchConversations());
    } catch { /* ignore */ }
    finally { setMailLoading(false); setMailListsLoaded(true); }
  }, [isSelfView]);

  useEffect(() => {
    if (activeTab === "mail") loadMailLists();
    if (activeTab !== "mail") { setMailThread(null); setMailReplyBody(""); }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openMailThread = useCallback(async (threadId) => {
    setMailThreadLoading(true);
    setMailThread(null);
    try {
      const data = await fetchThread(threadId);
      setMailThread(data);
      setMailReplyBody("");
      setMailReplyError(null);
      setMailConversations(prev => prev.map(c => c.threadId === threadId ? { ...c, unreadCount: 0 } : c));
      markThreadRead(threadId).then(() => onUnreadChange?.()).catch(() => {});
    } catch { /* ignore */ }
    finally { setMailThreadLoading(false); }
  }, [onUnreadChange]);

  const handleMailReply = useCallback(async () => {
    if (!mailReplyBody.trim() || mailReplySending || !mailThread) return;
    setMailReplySending(true);
    setMailReplyError(null);
    const bodyText = mailReplyBody.trim();
    try {
      await replyToThread(mailThread.threadId, bodyText);
      setMailReplyBody("");
      const updated = await fetchThread(mailThread.threadId);
      setMailThread(updated);
      const newLast = { isFromMe: true, body: bodyText, createdAt: new Date().toISOString() };
      setMailConversations(prev => prev.map(c => c.threadId === mailThread.threadId ? { ...c, lastMessage: newLast } : c));
    } catch (err) {
      setMailReplyError(err.message || "Failed to send.");
    } finally {
      setMailReplySending(false);
    }
  }, [mailReplyBody, mailReplySending, mailThread]);

  const handleNewMailSend = useCallback(async (targetId, body) => {
    await sendMail(targetId, "Direct Message", body);
    const data = await fetchConversations();
    setMailConversations(data);
    setMailListsLoaded(true);
    const created = data.find((c) => c.otherParticipant.id === targetId);
    if (created) {
      setMailThreadLoading(true);
      setMailThread(null);
      try {
        const threadData = await fetchThread(created.threadId);
        setMailThread(threadData);
        setMailReplyBody("");
        setMailReplyError(null);
        markThreadRead(created.threadId).then(() => onUnreadChange?.()).catch(() => {});
      } catch { /* ignore */ }
      finally { setMailThreadLoading(false); }
    }
  }, [onUnreadChange]);

  const loadFriendsData = useCallback(async () => {
    if (!isSelfView) return;
    setFriendsLoading(true);
    try {
      const data = await fetchFriends();
      setFriendsData(data);
    } catch {
      setFriendsData({ friends: [], received: [], sent: [] });
    } finally {
      setFriendsLoading(false);
    }
  }, [isSelfView]);

  useEffect(() => {
    if (activeTab === "friends") loadFriendsData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "inventory" || invLoaded) return;
    setInvLoading(true);
    fetchInventory()
      .then(data => {
        const loadedItems = data.items || [];
        setInvItems(loadedItems);
        const initial = {};
        for (const [cat, itemId] of Object.entries(equipped || {})) {
          const eStr = itemId?.toString();
          const entry = loadedItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
          if (entry) initial[cat] = entry;
        }
        setInvSelectedEntries(initial);
        setInvPreviewOutfit(outfit || {});
        setInvLoaded(true);
      })
      .catch(() => {})
      .finally(() => setInvLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== "wishlist" || wishlistLoaded) return;
    setWishlistLoading(true);
    fetchWishlist()
      .then(({ items }) => { setWishlistItems(items); setWishlistLoaded(true); })
      .catch(() => {})
      .finally(() => setWishlistLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWishlistRemove = (itemId) => {
    setWishlistItems(prev => prev.filter(i => i.itemId !== itemId));
    removeFromWishlist({ itemId }).catch(() => {
      fetchWishlist().then(({ items }) => setWishlistItems(items)).catch(() => {});
    });
  };

  const handleSubmitComment = async () => {
    if (!gbInput.trim() || gbSubmitting) return;
    setGbSubmitting(true);
    try {
      await postGuestBookComment(targetUserId, gbInput.trim());
      setGbInput("");
      await loadGbComments();
    } catch (err) {
      console.error(err);
    } finally {
      setGbSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteGuestBookComment(commentId);
      setGbComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const invGoCategories = () => { setInvView("categories"); setInvCategory(null); setInvSubcategory(null); };
  const invGoToCategory = cat => { setInvCategory(cat); setInvSubcategory(null); setInvView("items"); };
  const invGoToSubcategory = (cat, sub) => { setInvCategory(cat); setInvSubcategory(sub); setInvView("items"); };
  const invGoToRecent = () => { setInvView("recentlyAdded"); setInvCategory(null); setInvSubcategory(null); };
  const invGoToEquipped = () => { setInvView("equipped"); setInvCategory(null); setInvSubcategory(null); };

  const invIsSelected = entry =>
    invSelectedEntries[entry.category]?._id?.toString() === entry._id?.toString();

  const invCanUse = entry => {
    if (entry.currency === "gems") return true;
    if (!entry.levelRequirement) return true;
    return (level ?? 1) >= entry.levelRequirement;
  };

  const invToggleEntry = entry => {
    const cat = entry.category;
    if (invIsSelected(entry)) {
      setInvSelectedEntries(prev => { const n = { ...prev }; delete n[cat]; return n; });
      setInvPreviewOutfit(prev => {
        const n = { ...prev };
        const equippedId = equipped?.[cat];
        const isCurrentlyEquipped = equippedId && (
          equippedId.toString() === entry._id?.toString() ||
          equippedId.toString() === entry.itemId?.toString()
        );
        if (!isCurrentlyEquipped && outfit?.[cat]) {
          // Tried on a non-equipped item then deselected → restore the actually equipped item
          n[cat] = outfit[cat];
        } else {
          // Deselected the currently equipped item → remove it from preview immediately
          delete n[cat];
        }
        return n;
      });
    } else {
      setInvSelectedEntries(prev => ({ ...prev, [cat]: entry }));
      setInvPreviewOutfit(prev => ({ ...prev, [cat]: { imageUrl: entry.imageUrl } }));
    }
  };

  const invHasChanges = (() => {
    for (const cat of Object.keys(equipped || {})) {
      if (!invSelectedEntries[cat]) return true;
    }
    for (const [cat, entry] of Object.entries(invSelectedEntries)) {
      const equippedId = equipped?.[cat];
      if (!equippedId) return true;
      const eStr = equippedId.toString();
      if (eStr !== entry._id?.toString() && eStr !== entry.itemId?.toString()) return true;
    }
    return false;
  })();

  const invHandleApply = () => {
    for (const cat of Object.keys(equipped || {})) {
      if (!invSelectedEntries[cat]) onUnequip?.(cat);
    }
    for (const [cat, entry] of Object.entries(invSelectedEntries)) {
      if (!invCanUse(entry)) continue;
      const equippedId = equipped?.[cat];
      if (equippedId) {
        const eStr = equippedId.toString();
        if (eStr === entry._id?.toString() || eStr === entry.itemId?.toString()) continue;
      }
      onEquip?.(entry);
    }
  };

  const invHandleReset = () => {
    const initial = {};
    for (const [cat, itemId] of Object.entries(equipped || {})) {
      const eStr = itemId?.toString();
      const entry = invItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
      if (entry) initial[cat] = entry;
    }
    setInvSelectedEntries(initial);
    setInvPreviewOutfit(outfit || {});
  };

  const invHandleNude = () => {
    setInvSelectedEntries({});
    setInvPreviewOutfit({});
  };

  const invHandleSell = async (entry, e) => {
    e.stopPropagation();
    if (invSelling) return;
    setInvSelling(entry._id);
    setInvSellError(null);
    try {
      await sellItem({ inventoryId: entry._id });
      setInvItems(prev => prev.filter(i => i._id !== entry._id));
      if (invIsSelected(entry)) {
        const cat = entry.category;
        setInvSelectedEntries(prev => { const n = { ...prev }; delete n[cat]; return n; });
        setInvPreviewOutfit(prev => {
          const n = { ...prev };
          if (outfit?.[cat]) n[cat] = outfit[cat];
          else delete n[cat];
          return n;
        });
      }
    } catch (err) {
      setInvSellError(err.message);
    } finally {
      setInvSelling(null);
    }
  };

  const invEquippedItems = Object.entries(equipped || {}).map(([, itemId]) => {
    const eStr = itemId?.toString();
    return invItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
  }).filter(Boolean);

  const invDisplayItems = (() => {
    if (invView === "items") {
      return invItems.filter(e => {
        if (invCategory && e.category !== invCategory) return false;
        if (invSubcategory && e.subcategory !== invSubcategory) return false;
        return true;
      });
    }
    if (invView === "recentlyAdded") {
      return [...invItems].sort((a, b) => {
        if (!a.acquiredAt && !b.acquiredAt) return 0;
        if (!a.acquiredAt) return 1;
        if (!b.acquiredAt) return -1;
        return new Date(b.acquiredAt) - new Date(a.acquiredAt);
      });
    }
    if (invView === "equipped") return invEquippedItems;
    return [];
  })();

  const invSubCount = (cat, sub) => invItems.filter(e => e.category === cat && e.subcategory === sub).length;

  const isNonCategoryView = invView === "items" || invView === "recentlyAdded" || invView === "equipped";
  const invCrumbs = [
    { label: "Inventory", onClick: isNonCategoryView ? invGoCategories : null },
    { label: "Clothing", onClick: isNonCategoryView ? invGoCategories : null },
  ];
  if (invView === "items") {
    if (invCategory) invCrumbs.push({
      label: INV_CATEGORY_LABELS[invCategory],
      onClick: invSubcategory ? () => invGoToCategory(invCategory) : null,
    });
    if (invSubcategory) invCrumbs.push({
      label: INV_SUBCATEGORY_LABELS[invSubcategory] || invSubcategory,
      onClick: null,
    });
  }
  if (invView === "recentlyAdded") invCrumbs.push({ label: "Recently Added", onClick: null });
  if (invView === "equipped") invCrumbs.push({ label: "Equipped", onClick: null });

  const canComment = !isSelfView && !!currentUserId;

  // const hasOutfit = outfit && Object.values(outfit).some((v) => v?.imageUrl);

  return (
    <>
      {composing && (
        <ComposeMailModal
          targetId={isSelfView ? null : targetUserId}
          targetName={isSelfView ? null : playerName}
          onClose={() => setComposing(false)}
        />
      )}

      <Overlay onClick={onClose}>
        <ProfileOuter>
        <GlobalCloseBtn onClick={onClose}>&times;</GlobalCloseBtn>
        <ProfileWrapper onClick={(e) => e.stopPropagation()}>

          {/* ── Sidebar ── */}
          <Sidebar>
            <SidebarLogoWrap>
              <SidebarLogoMark>✦</SidebarLogoMark>
              <SidebarLogoText>NW</SidebarLogoText>
            </SidebarLogoWrap>

            <SidebarNav>
              {isSelfView ? (
                <>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
                      <SidebarIcon $active={activeTab === "profile"}>◈</SidebarIcon>
                      <SidebarLabel $active={activeTab === "profile"}>Profile</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "mail"} onClick={() => setActiveTab("mail")}>
                      <SidebarIcon $active={activeTab === "mail"}>✉</SidebarIcon>
                      <SidebarLabel $active={activeTab === "mail"}>Mail</SidebarLabel>
                      {(mailListsLoaded
                        ? mailConversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
                        : unreadMailCount) > 0 && (
                        <SidebarNotifDot>
                          {mailListsLoaded
                            ? mailConversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
                            : unreadMailCount}
                        </SidebarNotifDot>
                      )}
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "look"} onClick={() => setActiveTab("look")}>
                      <SidebarIcon $active={activeTab === "look"}>✦</SidebarIcon>
                      <SidebarLabel $active={activeTab === "look"}>Look</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "friends"} onClick={() => setActiveTab("friends")}>
                      <SidebarIcon $active={activeTab === "friends"}>♡</SidebarIcon>
                      <SidebarLabel $active={activeTab === "friends"}>Friends</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn onClick={() => { onClose(); onOpenAlbum?.(); }}>
                      <SidebarIcon>▦</SidebarIcon>
                      <SidebarLabel>Album</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
                      <SidebarIcon $active={activeTab === "inventory"}>⊞</SidebarIcon>
                      <SidebarLabel $active={activeTab === "inventory"}>Inventory</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "wishlist"} onClick={() => setActiveTab("wishlist")}>
                      <SidebarIcon $active={activeTab === "wishlist"}>☆</SidebarIcon>
                      <SidebarLabel $active={activeTab === "wishlist"}>Wishlist</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn onClick={() => { onClose(); onOpenMarketplace?.(); }}>
                      <SidebarIcon>◇</SidebarIcon>
                      <SidebarLabel>Market</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                </>
              ) : (
                <>
                  <SidebarItem>
                    <SidebarBtn
                      onClick={handleFriendBtn}
                      disabled={friendBusy || friendStatus === null}
                    >
                      <SidebarIcon>♡</SidebarIcon>
                      <SidebarLabel>{friendBtnLabel()}</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn onClick={() => setComposing(true)}>
                      <SidebarIcon>✉</SidebarIcon>
                      <SidebarLabel>Mail</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn>
                      <SidebarIcon>☆</SidebarIcon>
                      <SidebarLabel>Wishlist</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn>
                      <SidebarIcon>🎁</SidebarIcon>
                      <SidebarLabel>Gift</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn>
                      <SidebarIcon>⇄</SidebarIcon>
                      <SidebarLabel>Trade</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem $danger>
                    <SidebarBtn $danger>
                      <SidebarIcon>⚑</SidebarIcon>
                      <SidebarLabel>Report</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                </>
              )}
            </SidebarNav>

            {/* <SidebarFooter>
              <SidebarAvatarThumb />
              <SidebarOnlinePip />
            </SidebarFooter> */}
          </Sidebar>

          {/* ── Avatar Stage ── */}
          <AvatarStageCol>
            {/* <OutfitLabel>
              <OutfitGem>✦</OutfitGem>
              <span>Outfit: {hasOutfit ? "Current Outfit" : "Default"}</span>
              <OutfitGem>✦</OutfitGem>
            </OutfitLabel> */}

            <StageContainer>
              <StageHalo />
              <StageHaloOuter />
              <AvatarViewport
                onMouseDown={onViewportMouseDown}
                style={{ cursor: "grab" }}
              >
                <AvatarCanvas
                  ref={canvasRef}
                  width={FRAME_W}
                  height={FRAME_H}
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${ZOOM_LEVELS[zoomIndex]})`,
                    transformOrigin: "top center",
                    visibility: viewLoaded ? "visible" : "hidden",
                  }}
                />
              </AvatarViewport>
              {/* <AvatarPlatform /> */}
            </StageContainer>

            <Controls>
              <ArrowBtn onClick={zoomOut} disabled={zoomIndex === 0}>−</ArrowBtn>
              <ArrowBtn onClick={turnLeft}>&larr;</ArrowBtn>
              {/* <PoseLabel>{POSE_LABELS[poseIndex]}</PoseLabel> */}
              <ArrowBtn onClick={turnRight}>&rarr;</ArrowBtn>
              <ArrowBtn onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1}>+</ArrowBtn>
              {isSelfView && hasLockedView && (
                <ArrowBtn onClick={handleUnlockView} disabled={unlocking} title="Remove locked profile view">🔓</ArrowBtn>
              )}
              {isSelfView && (
                <ArrowBtn onClick={handleSaveView} disabled={viewSaving} title="Lock current view as profile view">🔒</ArrowBtn>
              )}
            </Controls>

            {activeTab === "inventory" ? (
              <InvActionBar>
                <InvNudeBtn onClick={invHandleNude}>Remove All</InvNudeBtn>
                <InvResetBtn onClick={invHandleReset}>Reset</InvResetBtn>
                <InvApplyBtn onClick={invHandleApply} disabled={!invHasChanges}>Apply</InvApplyBtn>
              </InvActionBar>
            ) : (
              <StatusCard>
                <StatusCardTop>
                  {isSelfView ? (
                    <StatusPickerWrap ref={statusPickerRef}>
                      <StatusClickTarget
                        onClick={() => {
                          if (statusChanging) return;
                          setStatusPickerOpen((p) => !p);
                        }}
                        style={{ visibility: userStatus ? "visible" : "hidden" }}
                      >
                        <PresenceDot $status={userStatus?.manualStatus || "online"} />
                        <PresenceLabel $status={userStatus?.manualStatus || "online"}>
                          {PRESENCE_LABELS[userStatus?.manualStatus || "online"]}
                        </PresenceLabel>
                      </StatusClickTarget>
                      {statusPickerOpen && statusPickerRef.current && createPortal(
                        (() => {
                          const r = statusPickerRef.current.getBoundingClientRect();
                          return (
                            <StatusDropdown ref={statusDropdownRef} style={{ position: "fixed", left: r.left, bottom: window.innerHeight - r.top + 6, top: "auto" }}>
                              {[
                                { key: "online",    dot: "online",  label: "Online"    },
                                { key: "away",      dot: "away",    label: "Away"      },
                                { key: "invisible", dot: "offline", label: "Invisible" },
                              ].map(({ key, dot, label }) => (
                                <StatusOption
                                  key={key}
                                  $active={userStatus?.manualStatus === key}
                                  onClick={() => handleChangeStatus(key)}
                                >
                                  <OptionDot $status={dot} />
                                  {label}
                                </StatusOption>
                              ))}
                            </StatusDropdown>
                          );
                        })(),
                        document.body
                      )}
                    </StatusPickerWrap>
                  ) : (
                    <span style={{ visibility: userStatus ? "visible" : "hidden" }}>
                      <PresenceDot $status={userStatus?.status || "offline"} />
                      <PresenceLabel $status={userStatus?.status || "offline"}>
                        {PRESENCE_LABELS[userStatus?.status || "offline"]}
                      </PresenceLabel>
                    </span>
                  )}
                  <StatusSep>·</StatusSep>
                  <StatusLoc>Neclis Plaza</StatusLoc>
                </StatusCardTop>
                <StatusText>"{bio || "No status set"}"</StatusText>
              </StatusCard>
            )}

          </AvatarStageCol>

          {activeTab === "profile" && (<>

          {/* ── Profile Content ── */}
          <ProfileContent>

            {/* Header */}
            <ProfileHeader>
              <HeaderLeft>
                <ProfileEmblem>
                  <EmblemDiamond>◆</EmblemDiamond>
                </ProfileEmblem>
                <HeaderTitles>
                  <PlayerName>
                    {playerName || "Player"}
                    <PlayerNameMark> ✦</PlayerNameMark>
                  </PlayerName>
                  <ProfileMetaRow>
                    <LevelBadge>Lv. 78</LevelBadge>
                    <MetaSep>•</MetaSep>
                    <RankBadgeDiamond>◆ Diamond Tier</RankBadgeDiamond>
                  </ProfileMetaRow>
                </HeaderTitles>
              </HeaderLeft>
              <ProfileStats>
                <ProfileStat>
                  <ProfileStatVal>1,204</ProfileStatVal>
                  <ProfileStatLbl>Followers</ProfileStatLbl>
                </ProfileStat>
                <ProfileStat>
                  <ProfileStatVal>348</ProfileStatVal>
                  <ProfileStatLbl>Following</ProfileStatLbl>
                </ProfileStat>
                <ProfileStat>
                  <ProfileStatVal>89</ProfileStatVal>
                  <ProfileStatLbl>Days</ProfileStatLbl>
                </ProfileStat>
              </ProfileStats>
            </ProfileHeader>

            {/* Badges */}
            <SectionBlock>
              <SectionHeaderRow>
                <SectionTitle>Badges</SectionTitle>
                <SectionCountPill>{visibleBadges.length}</SectionCountPill>
              </SectionHeaderRow>
              <BadgesScrollWrap>
                <BadgesRow>
                  {visibleBadges.map((name) => (
                    <BadgeCard
                      key={name}
                      $selected={selectedBadge === name}
                      $clickable={!!onSaveBadge}
                      $saving={badgeSaving}
                      $rarity={BADGE_RARITY[name] || "common"}
                      onClick={() => handleBadgeClick(name)}
                      title={
                        onSaveBadge
                          ? selectedBadge === name ? "Click to unselect" : "Click to display this badge"
                          : name
                      }
                    >
                      <BadgeCardIconWrap>
                        <BadgeImg src={`/assets/badges/${name}.png`} alt={name} />
                      </BadgeCardIconWrap>
                      <BadgeCardName>{name.charAt(0).toUpperCase() + name.slice(1)}</BadgeCardName>
                      <BadgeCardRarity $rarity={BADGE_RARITY[name] || "common"}>
                        {BADGE_RARITY[name] || "common"}
                      </BadgeCardRarity>
                    </BadgeCard>
                  ))}
                </BadgesRow>
              </BadgesScrollWrap>
              {BADGES.length > 6 && (
                <BadgeExpandBtn onClick={() => setBadgesExpanded((v) => !v)}>
                  {badgesExpanded ? "Show less ▲" : "Show all ▼"}
                </BadgeExpandBtn>
              )}
            </SectionBlock>

            {/* Soul Mate */}
            <SectionBlock>
              <SectionHeaderRow>
                <SectionTitle>Soulmate</SectionTitle>
              </SectionHeaderRow>
              {renderSoulMate({
                smState, isSelfView, targetUserId, currentUserId,
                smBusy, smError, smSendRequest, smAccept, smDecline, smCancel, smRemove,
                playerName,
              })}
            </SectionBlock>

            {/* Showcase */}
            <SectionBlock>
              <SectionHeaderRow>
                <SectionTitle>Showcase</SectionTitle>
                {isSelfView && <SectionEditBtn>Edit</SectionEditBtn>}
              </SectionHeaderRow>
              <ShowcaseScrollWrap>
                <ShowcaseRow>
                  {showcaseItems.map((item, i) => (
                    <ShowcaseCard
                      key={i}
                      $clickable={isSelfView}
                      onClick={isSelfView ? () => {} : undefined}
                      title={isSelfView ? "Click to select item" : ""}
                    >
                      <ShowcaseCardShine />
                      {item ? (
                        <>
                          <ShowcaseItemImg src={item.imageUrl} alt={item.name} />
                          <ShowcaseCardLabel>{item.name}</ShowcaseCardLabel>
                          <ShowcaseCardType>Item</ShowcaseCardType>
                        </>
                      ) : isSelfView ? (
                        <>
                          <ShowcaseAdd>+</ShowcaseAdd>
                          <ShowcaseCardAddLabel>Add Item</ShowcaseCardAddLabel>
                        </>
                      ) : null}
                    </ShowcaseCard>
                  ))}
                </ShowcaseRow>
              </ShowcaseScrollWrap>
            </SectionBlock>

            {/* Companion */}
            <SectionBlock>
              <SectionHeaderRow>
                <SectionTitle>Companion</SectionTitle>
              </SectionHeaderRow>
              <CompanionCard>
                <CompanionPetWrap>
                  <CompanionPetAura />
                  <CompanionPetEmoji>🐱</CompanionPetEmoji>
                </CompanionPetWrap>
                <CompanionInfoBlock>
                  <CompanionNameRow>
                    <CompanionNameText>Companion</CompanionNameText>
                    <CompanionMoodText>😺 Playful</CompanionMoodText>
                  </CompanionNameRow>
                  <CompanionLevelText>Level — Familiar</CompanionLevelText>
                  <CompanionXPWrap>
                    <XPBarOuter>
                      <XPBarFill style={{ "--xp": "0%" }} />
                    </XPBarOuter>
                    <XPLabelsRow>
                      <span>XP — / —</span>
                      <span>—%</span>
                    </XPLabelsRow>
                  </CompanionXPWrap>
                </CompanionInfoBlock>
              </CompanionCard>
            </SectionBlock>

          </ProfileContent>

          {/* ── Right Panel ── */}
          <RightPanel>

            {/* About */}
            <RightSection>
              <SectionHeaderRow>
                <SectionTitle>About</SectionTitle>
                {onSaveBio && !editingBio && (
                  <SectionEditBtn onClick={() => { setBioDraft(bio); setBioError(null); setEditingBio(true); }}>
                    Edit
                  </SectionEditBtn>
                )}
              </SectionHeaderRow>
              {editingBio ? (
                <>
                  <FormatToolbar>
                    <FormatBtn title="Bold" onMouseDown={(e) => { e.preventDefault(); applyFormat("**"); }}><b>B</b></FormatBtn>
                    <FormatBtn title="Italic" onMouseDown={(e) => { e.preventDefault(); applyFormat("*"); }}><i>I</i></FormatBtn>
                    <FormatBtn title="Underline" onMouseDown={(e) => { e.preventDefault(); applyFormat("_"); }}><u>U</u></FormatBtn>
                  </FormatToolbar>
                  <BioTextarea
                    ref={textareaRef}
                    value={bioDraft}
                    maxLength={BIO_MAX}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Tell others about yourself…"
                    disabled={bioSaving}
                  />
                  <BioFooter>
                    <BioCounter>{bioDraft.length}/{BIO_MAX}</BioCounter>
                    <BioActions>
                      <SecondaryBtn
                        disabled={bioSaving}
                        onClick={() => { setEditingBio(false); setBioError(null); setBioDraft(bio); }}
                      >
                        Cancel
                      </SecondaryBtn>
                      <PrimaryBtn
                        disabled={bioSaving || bioDraft === bio}
                        onClick={async () => {
                          setBioSaving(true);
                          setBioError(null);
                          try { await onSaveBio(bioDraft.trim()); setEditingBio(false); }
                          catch (err) { setBioError(err.message || "Failed to save"); }
                          finally { setBioSaving(false); }
                        }}
                      >
                        {bioSaving ? "Saving…" : "Save"}
                      </PrimaryBtn>
                    </BioActions>
                  </BioFooter>
                  {bioError && <BioErrorMsg>{bioError}</BioErrorMsg>}
                </>
              ) : bio?.trim() ? (
                <Description dangerouslySetInnerHTML={{ __html: bioToHtml(bio) }} />
              ) : (
                <Description><EmptyText>No bio yet.</EmptyText></Description>
              )}
            </RightSection>

            <OrnamentDivider>
              <OrnamentLine /><OrnamentGem>✦</OrnamentGem><OrnamentLine />
            </OrnamentDivider>

            {/* Guestbook preview */}
            <RightSection $flex>
              <SectionHeaderRow>
                <SectionTitle>Guestbook</SectionTitle>
                <GBToggleBtn onClick={() => setGbOpen((v) => !v)} $active={gbOpen}>
                  <GBCountPill>{gbComments.length}</GBCountPill>
                  <GBToggleArrow $open={gbOpen}>▲</GBToggleArrow>
                </GBToggleBtn>
              </SectionHeaderRow>

              <GBPreviewList>
                {gbLoading ? (
                  <GBEmpty>Loading…</GBEmpty>
                ) : gbComments.length === 0 ? (
                  <GBEmpty>No comments yet.</GBEmpty>
                ) : (
                  gbComments.slice(0, 3).map((c) => (
                    <GBPreviewCard key={c._id}>
                      <GBPreviewAvatarWrap>
                        <PlayerThumbnail playerName={c.authorName} size={28} />
                      </GBPreviewAvatarWrap>
                      <GBPreviewBody>
                        <GBPreviewMeta>
                          <GBPreviewName>{c.authorName}</GBPreviewName>
                          {c.createdAt && <GBPreviewTime>{formatRelativeTime(c.createdAt)}</GBPreviewTime>}
                        </GBPreviewMeta>
                        <GBPreviewText>{c.message}</GBPreviewText>
                      </GBPreviewBody>
                    </GBPreviewCard>
                  ))
                )}
              </GBPreviewList>

              {canComment && (
                <GBInputArea>
                  <GBInput
                    value={gbInput}
                    maxLength={COMMENT_MAX}
                    onChange={(e) => setGbInput(e.target.value)}
                    placeholder="Write a comment…"
                    disabled={gbSubmitting}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                  />
                  <GBInputFooter>
                    <GBCounter $warn={gbInput.length > 90}>{gbInput.length}/{COMMENT_MAX}</GBCounter>
                    <PrimaryBtn onClick={handleSubmitComment} disabled={gbSubmitting || !gbInput.trim()}>
                      {gbSubmitting ? "…" : "Post"}
                    </PrimaryBtn>
                  </GBInputFooter>
                </GBInputArea>
              )}
            </RightSection>
          </RightPanel>

          {/* ── Guest Book Expanded Overlay ── */}
          <GuestBookOverlay $open={gbOpen} onClick={(e) => e.stopPropagation()}>
            <GBOverlayClose onClick={() => setGbOpen(false)}>&times;</GBOverlayClose>

            <GBHeader>
              <GBTitle>✦ GUEST BOOK ✦</GBTitle>
              <GBSubtitle>Leave a message for the owner. Be kind, be iconic.</GBSubtitle>
              <GBHeaderControls>
                <GBSortBtn>Recent <span style={{ fontSize: 10 }}>▾</span></GBSortBtn>
                <GBPinnedBtn>📌 Pinned (0)</GBPinnedBtn>
              </GBHeaderControls>
            </GBHeader>

            {canComment && (
              <GBComposeArea>
                <GBComposeRow>
                  <GBAvatarPlaceholder />
                  <GBComposeInputWrap>
                    <GBInput
                      value={gbInput}
                      maxLength={COMMENT_MAX}
                      onChange={(e) => setGbInput(e.target.value)}
                      placeholder="Write a message..."
                      disabled={gbSubmitting}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    />
                    <GBEmojiBtn title="Emoji">☺</GBEmojiBtn>
                  </GBComposeInputWrap>
                  <GBPostBtn onClick={handleSubmitComment} disabled={gbSubmitting || !gbInput.trim()}>
                    {gbSubmitting ? "…" : "Post"}
                  </GBPostBtn>
                </GBComposeRow>
                <GBComposeTools>
                  <GBToolBtn>Āa Style</GBToolBtn>
                  <GBToolBtn>☺ Sticker</GBToolBtn>
                  <GBToolBtn>🌙 Mood</GBToolBtn>
                  <GBCounter $warn={gbInput.length > 90} style={{ marginLeft: "auto" }}>
                    {gbInput.length}/{COMMENT_MAX}
                  </GBCounter>
                </GBComposeTools>
              </GBComposeArea>
            )}

            <GBOrnamentDivider>
              <GBDividerLine /><GBDividerGem>✦</GBDividerGem><GBDividerLine />
            </GBOrnamentDivider>

            <GBOverlayScroll>
              {gbLoading ? (
                <GBEmpty $large>Loading…</GBEmpty>
              ) : gbComments.length === 0 ? (
                <GBEmpty $large>No comments yet. Be the first!</GBEmpty>
              ) : (
                gbComments.map((c) => (
                  <GBCommentCard key={c._id}>
                    <GBCommentInner>
                      <GBCommentAvatarCol>
                        <PlayerThumbnail playerName={c.authorName} size={44} />
                      </GBCommentAvatarCol>
                      <GBCommentBody>
                        <GBCommentMeta>
                          <GBCommentName>{c.authorName}</GBCommentName>
                          {c.createdAt && (
                            <GBCommentTime>• {formatRelativeTime(c.createdAt)}</GBCommentTime>
                          )}
                        </GBCommentMeta>
                        <GBCommentText>{c.message}</GBCommentText>
                        <GBReactions>
                          <GBReactionBtn>♥ 0</GBReactionBtn>
                          <GBReactionBtn>🔥 0</GBReactionBtn>
                          <GBReactionBtn>✨ 0</GBReactionBtn>
                          <GBReactionBtn>💬 0</GBReactionBtn>
                        </GBReactions>
                      </GBCommentBody>
                      <GBCommentActions>
                        {isSelfView && (
                          <CommentDeleteBtn
                            onClick={() => handleDeleteComment(c._id)}
                            title="Delete comment"
                          >
                            &times;
                          </CommentDeleteBtn>
                        )}
                        <GBMenuDot>⋮</GBMenuDot>
                      </GBCommentActions>
                    </GBCommentInner>
                  </GBCommentCard>
                ))
              )}
            </GBOverlayScroll>

            <GBStatsFooter>
              <GBStat>
                <GBStatLabel>Total Messages</GBStatLabel>
                <GBStatValue>{gbComments.length}</GBStatValue>
              </GBStat>
              <GBStatDivider />
              <GBStat>
                <GBStatLabel>Visitors</GBStatLabel>
                <GBStatValue>—</GBStatValue>
              </GBStat>
              <GBStatDivider />
              <GBStat>
                <GBStatLabel>Most Active</GBStatLabel>
                <GBStatValue>—</GBStatValue>
              </GBStat>
              <GBLeaveGiftBtn>🎁 Leave a Gift</GBLeaveGiftBtn>
            </GBStatsFooter>
          </GuestBookOverlay>
          </>)}

          {activeTab === "mail" && isSelfView && (
            <MailPanelContent
              mailConversations={mailConversations}
              mailLoading={mailLoading}
              mailThread={mailThread}
              mailThreadLoading={mailThreadLoading}
              mailReplyBody={mailReplyBody}
              setMailReplyBody={setMailReplyBody}
              mailReplySending={mailReplySending}
              mailReplyError={mailReplyError}
              openMailThread={openMailThread}
              handleMailReply={handleMailReply}
              onNewSend={handleNewMailSend}
              onClearThread={() => setMailThread(null)}
            />
          )}

          {activeTab === "friends" && isSelfView && (
            <FriendsPanelContent
              friendsTab={friendsTab}
              setFriendsTab={setFriendsTab}
              friendsData={friendsData}
              friendsLoading={friendsLoading}
              friendsSearch={friendsSearch}
              setFriendsSearch={setFriendsSearch}
              onRefresh={loadFriendsData}
              acceptFriend={acceptFriend}
              declineFriend={declineFriend}
            />
          )}

          {activeTab === "look" && isSelfView && (
            <LookPanelContent />
          )}

          {activeTab === "wishlist" && isSelfView && (
            <WishlistPanelContent
              items={wishlistItems}
              loading={wishlistLoading}
              onRemove={handleWishlistRemove}
            />
          )}

          {activeTab === "inventory" && isSelfView && (
            <HubPanelContainer>
              <InvItemsArea
                items={invDisplayItems}
                loading={invLoading}
                view={invView}
                isSelected={invIsSelected}
                canUse={invCanUse}
                toggleEntry={invToggleEntry}
                selling={invSelling}
                sellError={invSellError}
                onSell={invHandleSell}
                goToCategory={invGoToCategory}
                goToSubcategory={invGoToSubcategory}
                subCount={invSubCount}
                goToRecent={invGoToRecent}
                goToEquipped={invGoToEquipped}
                recentCount={invItems.length}
                equippedCount={invEquippedItems.length}
              />
              <InvBreadcrumbsBar crumbs={invCrumbs} />
            </HubPanelContainer>
          )}

        </ProfileWrapper>
        </ProfileOuter>
      </Overlay>
    </>
  );
}

/* ── Wishlist panel ── */

const STORE_LABELS = { normal: "Normal Store", gem: "Gem Store", seasonal: "Seasonal Store" };
const WL_RARITY = {
  nonRare:  { label: "Common",     bg: "rgba(120,90,180,0.1)",  border: "rgba(120,90,180,0.22)", color: "#7c5cbf" },
  rare:     { label: "Rare",       bg: "rgba(109,40,217,0.1)",  border: "rgba(109,40,217,0.3)",  color: "#7c3aed" },
  superRare:{ label: "Super Rare", bg: "rgba(217,119,6,0.1)",   border: "rgba(217,119,6,0.3)",   color: "#b45309" },
};

function WishlistPanelContent({ items, loading, onRemove }) {
  return (
    <HubPanelContainer>
      <WishlistPanelInner>
        <PanelHeaderRow style={{ padding: "14px 18px" }}>
          <PanelTitle>☆ Wishlist</PanelTitle>
        </PanelHeaderRow>
        <WishlistScrollArea>
          {loading && <WishlistMsg>Loading…</WishlistMsg>}
          {!loading && items.length === 0 && <WishlistMsg>Your wishlist is empty.</WishlistMsg>}
          {!loading && items.map(item => (
            <WishlistItemCard key={item.wishlistId}>
              <InvThumbImg
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.name}
                crossOrigin="anonymous"
              />
              <InvMidSection>
                <WishlistNameRow>
                  <InvItemName>{item.name}</InvItemName>
                  <WishlistTag>{STORE_LABELS[item.storeType] || item.storeType || "Store"}</WishlistTag>
                </WishlistNameRow>
                {item.rarity && WL_RARITY[item.rarity] && (
                  <WishlistRarityBadge $r={item.rarity}>
                    {WL_RARITY[item.rarity].label}
                  </WishlistRarityBadge>
                )}
              </InvMidSection>
              <WishlistRemoveBtn onClick={() => onRemove(item.itemId)} title="Remove">✕</WishlistRemoveBtn>
            </WishlistItemCard>
          ))}
        </WishlistScrollArea>
      </WishlistPanelInner>
    </HubPanelContainer>
  );
}

/* ── Inventory panel components ── */

function InvItemsArea({ items, loading, view, isSelected, canUse, toggleEntry, selling, sellError, onSell, goToCategory, goToSubcategory, subCount, goToRecent, goToEquipped, recentCount, equippedCount }) {
  const isListView = view === "items" || view === "recentlyAdded" || view === "equipped";
  const emptyMsg = view === "equipped" ? "Nothing equipped." : "No items in this category.";

  return (
    <InvContentCol>
      {view === "categories" && (
        <InvCatScroll>
          {loading && <InvMsg>Loading…</InvMsg>}

          <InvQuickNavRow>
            <InvQuickNavBtn onClick={goToRecent}>
              <InvQuickNavLabel>Recently Added</InvQuickNavLabel>
              <InvQuickNavRight>
                <InvQuickNavCount>{recentCount}</InvQuickNavCount>
                <InvQuickNavArrow>→</InvQuickNavArrow>
              </InvQuickNavRight>
            </InvQuickNavBtn>
            <InvQuickNavBtn onClick={goToEquipped}>
              <InvQuickNavLabel>Equipped</InvQuickNavLabel>
              <InvQuickNavRight>
                <InvQuickNavCount>{equippedCount}</InvQuickNavCount>
                <InvQuickNavArrow>→</InvQuickNavArrow>
              </InvQuickNavRight>
            </InvQuickNavBtn>
          </InvQuickNavRow>

          <InvCatGrid>
            {INV_CATEGORIES.map(cat => (
              <InvCatCard key={cat}>
                <InvCatDeco src={INV_CATEGORY_DECO[cat]} alt="" />
                <InvCatCardTop onClick={() => goToCategory(cat)}>
                  <InvCatLabel>{INV_CATEGORY_LABELS[cat].toUpperCase()}</InvCatLabel>
                  <InvCatArrow>→</InvCatArrow>
                </InvCatCardTop>
                <InvCatSubList>
                  {INV_CATEGORY_SUBCATEGORIES[cat].map(sub => {
                    const cnt = subCount(cat, sub);
                    return (
                      <InvCatSubItem key={sub} onClick={() => goToSubcategory(cat, sub)}>
                        {INV_SUBCATEGORY_LABELS[sub] || sub}
                        {cnt > 0 && <InvSubCount>({cnt})</InvSubCount>}
                      </InvCatSubItem>
                    );
                  })}
                </InvCatSubList>
              </InvCatCard>
            ))}
          </InvCatGrid>
        </InvCatScroll>
      )}

      {isListView && (
        <InvItemScroll>
          {sellError && <InvErrTxt>{sellError}</InvErrTxt>}
          {!loading && items.length === 0 && <InvMsg>{emptyMsg}</InvMsg>}
          <InvItemList>
            {items.map(entry => {
              const selected = isSelected(entry);
              const usable = canUse(entry);
              const sp = invGetSellPrice(entry);
              const isSelling = selling === entry._id;
              return (
                <InvItemCard key={entry._id} $expanded={selected} $locked={!usable} onClick={() => toggleEntry(entry)}>
                  <InvThumbImg src={entry.thumbnailUrl || entry.imageUrl} alt={entry.name} crossOrigin="anonymous" />
                  <InvMidSection>
                    <InvItemName>{entry.name}</InvItemName>
                    {selected && <InvWearingBadge>Wearing</InvWearingBadge>}
                    {!usable && <InvLockTxt>Level {entry.levelRequirement} required</InvLockTxt>}
                  </InvMidSection>
                  <InvPricesArea>
                    <InvPricePanel>
                      {!usable && <InvLevelBadge>Level {entry.levelRequirement}</InvLevelBadge>}
                      <InvBadgeAndPrice>
                        <InvCoinImg src="/icons/Nectar.png" alt="coins" />
                        <InvPriceAmt>{sp.toLocaleString()}</InvPriceAmt>
                      </InvBadgeAndPrice>
                    </InvPricePanel>
                    <InvSellPanel onClick={e => onSell(entry, e)} disabled={isSelling}>
                      {isSelling ? "…" : "SELL"}
                    </InvSellPanel>
                  </InvPricesArea>
                </InvItemCard>
              );
            })}
          </InvItemList>
          {loading && <InvMsg>Loading…</InvMsg>}
        </InvItemScroll>
      )}
    </InvContentCol>
  );
}

function InvBreadcrumbsBar({ crumbs }) {
  return (
    <InvBreadcrumbCol>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const clickable = !isLast && !!c.onClick;
        return (
          <InvCrumbStep key={i} $active={isLast} $clickable={clickable} onClick={clickable ? c.onClick : undefined}>
            {c.label}
          </InvCrumbStep>
        );
      })}
    </InvBreadcrumbCol>
  );
}

/* ── Soul Mate renderer ── */
function renderSoulMate({ smState, isSelfView, targetUserId, currentUserId, smBusy, smError,
  smSendRequest, smAccept, smDecline, smCancel, smRemove, playerName }) {

  if (!currentUserId) return <SoulmateEmptyBox><SmEmpty>Sign in to use soul mates.</SmEmpty></SoulmateEmptyBox>;
  if (!smState) return <SoulmateEmptyBox><SmEmpty>Loading…</SmEmpty></SoulmateEmptyBox>;

  const { mine, sent, received = [], target, relationship } = smState;

  const FullCard = ({ name, sub, onBreakUp }) => (
    <SoulmateCard>
      <SoulmateHeartBg>♥</SoulmateHeartBg>
      <SoulmateAvatarWrap>
        <PlayerThumbnail playerName={name} size={44} />
        <SoulmateSpinRing />
      </SoulmateAvatarWrap>
      <SoulmateInfoBlock>
        <SoulmateName>{name} <SoulmateMark>♥</SoulmateMark></SoulmateName>
        <SoulmateDuration>{sub}</SoulmateDuration>
        <SoulmateMoodTag>Obsessed 💜</SoulmateMoodTag>
      </SoulmateInfoBlock>
      <SoulmateCardActions>
        <SmDangerBtn disabled={smBusy} onClick={onBreakUp}>Break Up</SmDangerBtn>
      </SoulmateCardActions>
      {smError && <SmError style={{ width: "100%", marginTop: 4 }}>{smError}</SmError>}
    </SoulmateCard>
  );

  if (isSelfView || !targetUserId) {
    if (mine) return <FullCard name={mine.name} sub="Your Soul Mate" onBreakUp={smRemove} />;
    if (received.length > 0) return (
      <SoulmateEmptyBox>
        <SmSub>Incoming requests</SmSub>
        {received.map((r) => (
          <SmRow key={r.id}>
            <SmName>{r.name}</SmName>
            <SmActions>
              <SmPrimaryBtn disabled={smBusy} onClick={() => smAccept(r.id)}>Accept</SmPrimaryBtn>
              <SmSecBtn disabled={smBusy} onClick={() => smDecline(r.id)}>Decline</SmSecBtn>
            </SmActions>
          </SmRow>
        ))}
        {smError && <SmError>{smError}</SmError>}
      </SoulmateEmptyBox>
    );
    if (sent) return (
      <SoulmateEmptyBox>
        <SmContent>
          <SmSub>Pending request to {sent.name}</SmSub>
          <SmActions><SmSecBtn disabled={smBusy} onClick={smCancel}>Cancel</SmSecBtn></SmActions>
        </SmContent>
        {smError && <SmError>{smError}</SmError>}
      </SoulmateEmptyBox>
    );
    return <SoulmateEmptyBox><SmEmpty>No soul mate yet.</SmEmpty></SoulmateEmptyBox>;
  }

  if (relationship === "soulmate") return <FullCard name={playerName || "Player"} sub="Your Soul Mate" onBreakUp={smRemove} />;
  if (relationship === "i_sent") return (
    <SoulmateEmptyBox>
      <SmContent>
        <SmSub>Request sent</SmSub>
        <SmActions><SmSecBtn disabled={smBusy} onClick={smCancel}>Cancel</SmSecBtn></SmActions>
      </SmContent>
      {smError && <SmError>{smError}</SmError>}
    </SoulmateEmptyBox>
  );
  if (relationship === "they_sent") return (
    <SoulmateEmptyBox>
      <SmContent>
        <SmSub>Wants to be your soul mate</SmSub>
        <SmActions>
          <SmPrimaryBtn disabled={smBusy} onClick={() => smAccept(targetUserId)}>Accept</SmPrimaryBtn>
          <SmSecBtn disabled={smBusy} onClick={() => smDecline(targetUserId)}>Decline</SmSecBtn>
        </SmActions>
      </SmContent>
      {smError && <SmError>{smError}</SmError>}
    </SoulmateEmptyBox>
  );
  if (target?.soulMate) return (
    <SoulmateEmptyBox>
      <SmContent>
        <SmSub>Soul mate</SmSub>
        <SmName>{target.soulMate.name}</SmName>
      </SmContent>
      {smError && <SmError>{smError}</SmError>}
    </SoulmateEmptyBox>
  );
  if (mine) return <SoulmateEmptyBox><SmEmpty>You already have a soul mate.</SmEmpty>{smError && <SmError>{smError}</SmError>}</SoulmateEmptyBox>;
  return (
    <SoulmateEmptyBox>
      <SmContent>
        <SmPrimaryBtn disabled={smBusy} onClick={smSendRequest}>Send Soul Mate Request</SmPrimaryBtn>
      </SmContent>
      {smError && <SmError>{smError}</SmError>}
    </SoulmateEmptyBox>
  );
}

/* ── Mail Panel ── */

function MailPanelContent({
  mailConversations, mailLoading,
  mailThread, mailThreadLoading, mailReplyBody, setMailReplyBody,
  mailReplySending, mailReplyError, openMailThread, handleMailReply,
  onNewSend, onClearThread,
}) {
  const messagesEndRef = useRef(null);
  const [isNew, setIsNew] = useState(false);
  const [newToInput, setNewToInput] = useState("");
  const [newResolved, setNewResolved] = useState(null);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [newBody, setNewBody] = useState("");
  const [newSending, setNewSending] = useState(false);
  const [newError, setNewError] = useState(null);

  useEffect(() => {
    if (mailThread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mailThread?.messages?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalUnread = mailConversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
  const activeThreadId = isNew ? null : mailThread?.threadId;

  function startNew() {
    setIsNew(true);
    onClearThread();
    setNewToInput("");
    setNewResolved(null);
    setLookupStatus(null);
    setNewBody("");
    setNewError(null);
  }

  async function handleLookup() {
    const name = newToInput.trim();
    if (!name) return;
    setLookupStatus("searching");
    setNewResolved(null);
    setNewError(null);
    try {
      const user = await lookupUser(name);
      if (!user) { setLookupStatus("notfound"); return; }
      const existing = mailConversations.find((c) => c.otherParticipant.id === user.id);
      if (existing) { setIsNew(false); openMailThread(existing.threadId); return; }
      setNewResolved({ id: user.id, name: user.name });
      setLookupStatus("found");
    } catch {
      setLookupStatus("error");
    }
  }

  async function handleNewSend() {
    if (!newBody.trim() || newSending || !newResolved) return;
    setNewSending(true);
    setNewError(null);
    try {
      await onNewSend(newResolved.id, newBody.trim());
      setIsNew(false);
    } catch (err) {
      setNewError(err.message || "Failed to send.");
    } finally {
      setNewSending(false);
    }
  }

  return (
    <HubPanelContainer>
      {/* ── Left: conversation list ── */}
      <MailListCol>
        <PanelHeaderRow>
          <PanelTitle>
            Messages
            {totalUnread > 0 && <TabUnreadBadge>{totalUnread > 99 ? "99+" : totalUnread}</TabUnreadBadge>}
          </PanelTitle>
          <NewMailBtn onClick={startNew}>+ New</NewMailBtn>
        </PanelHeaderRow>
        <MailThreadList>
          {mailLoading ? (
            <PanelEmpty>Loading…</PanelEmpty>
          ) : mailConversations.length === 0 ? (
            <PanelEmpty>No conversations yet.</PanelEmpty>
          ) : (
            mailConversations.map((c) => (
              <MailThreadRow
                key={c.threadId}
                $unread={c.unreadCount > 0}
                $active={activeThreadId === c.threadId}
                onClick={() => { setIsNew(false); openMailThread(c.threadId); }}
              >
                <MailThreadThumb>
                  <PlayerThumbnail playerName={c.otherParticipant.name} size={38} />
                  {c.unreadCount > 0 && <MailUnreadDot />}
                </MailThreadThumb>
                <MailThreadMeta>
                  <MailThreadMetaTop>
                    <MailThreadName $unread={c.unreadCount > 0}>{c.otherParticipant.name}</MailThreadName>
                    <MailThreadTime>{formatRelativeTime(c.lastMessage.createdAt)}</MailThreadTime>
                  </MailThreadMetaTop>
                  <MailThreadPreview>
                    {c.lastMessage.isFromMe ? "You: " : ""}{c.lastMessage.body}
                  </MailThreadPreview>
                </MailThreadMeta>
                {c.unreadCount > 0 && <MailUnreadBadge>{c.unreadCount}</MailUnreadBadge>}
              </MailThreadRow>
            ))
          )}
        </MailThreadList>
      </MailListCol>

      {/* ── Right: thread or new conversation ── */}
      <MailDetailCol>
        {isNew ? (
          <MailNewPanel>
            <MailNewTitle>New Conversation</MailNewTitle>
            <MailToRow>
              <MailToLabel>To</MailToLabel>
              <MailToInput
                value={newToInput}
                onChange={(e) => { setNewToInput(e.target.value); setLookupStatus(null); setNewResolved(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
                placeholder="Player username…"
                disabled={newSending}
                autoFocus
              />
              <MailFindBtn onClick={handleLookup} disabled={!newToInput.trim() || lookupStatus === "searching"}>
                {lookupStatus === "searching" ? "…" : "Find"}
              </MailFindBtn>
            </MailToRow>
            {lookupStatus === "found" && <MailLookupHint $ok>Found: {newResolved.name}</MailLookupHint>}
            {lookupStatus === "notfound" && <MailLookupHint>No player with that name.</MailLookupHint>}
            {lookupStatus === "error" && <MailLookupHint>Lookup failed. Try again.</MailLookupHint>}
            {newResolved && (
              <>
                <MailNewTextarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleNewSend(); }}
                  maxLength={2000}
                  placeholder={`Message ${newResolved.name}… (Ctrl+Enter to send)`}
                  disabled={newSending}
                  autoFocus
                />
                {newError && <MailReplyError>{newError}</MailReplyError>}
                <MailReplyFooter>
                  <MailReplyCounter>{newBody.length}/2000</MailReplyCounter>
                  <PrimaryBtn onClick={handleNewSend} disabled={!newBody.trim() || newSending}>
                    {newSending ? "Sending…" : "Send"}
                  </PrimaryBtn>
                </MailReplyFooter>
              </>
            )}
          </MailNewPanel>
        ) : mailThreadLoading ? (
          <MailPlaceholder><MailPlaceholderText>Loading…</MailPlaceholderText></MailPlaceholder>
        ) : !mailThread ? (
          <MailPlaceholder>
            <MailPlaceholderIcon>✉</MailPlaceholderIcon>
            <MailPlaceholderText>Select a conversation or start a new one.</MailPlaceholderText>
          </MailPlaceholder>
        ) : (
          <>
            <MailDetailHeader>
              <PlayerThumbnail playerName={mailThread.otherParticipant.name} size={28} />
              <MailDetailWith>{mailThread.otherParticipant.name}</MailDetailWith>
            </MailDetailHeader>
            <MailMessageList>
              {mailThread.messages.map((msg) => (
                <MailMessageRow key={msg.id} $mine={msg.isFromMe}>
                  {!msg.isFromMe && (
                    <MailMsgThumb><PlayerThumbnail playerName={msg.fromName} size={32} /></MailMsgThumb>
                  )}
                  <MailBubble $mine={msg.isFromMe}>
                    <MailBubbleBody>{msg.body}</MailBubbleBody>
                    <MailBubbleTime>{formatRelativeTime(msg.createdAt)}</MailBubbleTime>
                  </MailBubble>
                  {msg.isFromMe && (
                    <MailMsgThumb><PlayerThumbnail playerName={msg.fromName} size={32} /></MailMsgThumb>
                  )}
                </MailMessageRow>
              ))}
              <div ref={messagesEndRef} />
            </MailMessageList>
            <MailReplyBox>
              <MailReplyTextarea
                value={mailReplyBody}
                onChange={(e) => setMailReplyBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleMailReply(); }}
                maxLength={2000}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                disabled={mailReplySending}
                rows={3}
              />
              {mailReplyError && <MailReplyError>{mailReplyError}</MailReplyError>}
              <MailReplyFooter>
                <MailReplyCounter>{mailReplyBody.length}/2000</MailReplyCounter>
                <PrimaryBtn onClick={handleMailReply} disabled={!mailReplyBody.trim() || mailReplySending}>
                  {mailReplySending ? "Sending…" : "Send"}
                </PrimaryBtn>
              </MailReplyFooter>
            </MailReplyBox>
          </>
        )}
      </MailDetailCol>
    </HubPanelContainer>
  );
}

/* ── Friends Panel ── */

function FriendsPanelContent({
  friendsTab, setFriendsTab, friendsData, friendsLoading,
  friendsSearch, setFriendsSearch, onRefresh, acceptFriend, declineFriend,
}) {
  const [friendBusy, setFriendBusy] = useState(null);
  const [searchSubmitted, setSearchSubmitted] = useState("");

  const friends = friendsData?.friends || [];
  const received = friendsData?.received || [];

  const handleSearchKey = (e) => {
    if (e.key === "Enter") setSearchSubmitted(friendsSearch.trim().toLowerCase());
  };

  const filtered = searchSubmitted
    ? friends.filter((f) => f.name?.toLowerCase().includes(searchSubmitted))
    : friends;

  const sorted = [...filtered].sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const onlineFriends = sorted.filter((f) => f.online);
  const offlineFriends = sorted.filter((f) => !f.online);

  const runAction = async (fn, id) => {
    if (friendBusy) return;
    setFriendBusy(id);
    try { await fn(); await onRefresh(); }
    catch (err) { console.error(err); }
    finally { setFriendBusy(null); }
  };

  return (
    <HubPanelContainer>
      <FriendsPanelInner>
        <FriendsSearchRow>
          <FriendsSearchInput
            type="text"
            value={friendsSearch}
            onChange={(e) => { setFriendsSearch(e.target.value); if (!e.target.value) setSearchSubmitted(""); }}
            onKeyDown={handleSearchKey}
            placeholder="Search friends… (Enter)"
          />
          <FriendsSearchIcon>⌕</FriendsSearchIcon>
        </FriendsSearchRow>

        <PanelTabs>
          <PanelTab $active={friendsTab === "friends"} onClick={() => setFriendsTab("friends")}>
            Friends <TabCountBadge>{friends.length}</TabCountBadge>
          </PanelTab>
          <PanelTab $active={friendsTab === "invites"} onClick={() => setFriendsTab("invites")}>
            Invites {received.length > 0 && <TabUnreadBadge>{received.length}</TabUnreadBadge>}
          </PanelTab>
        </PanelTabs>

        <FriendsListScroll>
          {friendsLoading ? (
            <PanelEmpty>Loading…</PanelEmpty>
          ) : friendsTab === "friends" ? (
            filtered.length === 0 ? (
              <PanelEmpty>
                {searchSubmitted ? `No friends matching "${searchSubmitted}".` : "You have no friends yet."}
              </PanelEmpty>
            ) : (
              <>
                {onlineFriends.length > 0 && (
                  <>
                    <FriendsGroupLabel>Online — {onlineFriends.length}</FriendsGroupLabel>
                    {onlineFriends.map((f) => (
                      <FriendCardRow key={f.id}>
                        <FriendCardAvatarWrap>
                          <PlayerThumbnail playerName={f.name} size={42} />
                          <FriendOnlineDot />
                        </FriendCardAvatarWrap>
                        <FriendCardInfo>
                          <FriendCardName>{f.name}</FriendCardName>
                          <FriendCardLocation>
                            <FriendLocationDot $online />
                            {f.location || "Online"}
                          </FriendCardLocation>
                        </FriendCardInfo>
                      </FriendCardRow>
                    ))}
                  </>
                )}
                {offlineFriends.length > 0 && (
                  <>
                    <FriendsGroupLabel>Offline — {offlineFriends.length}</FriendsGroupLabel>
                    {offlineFriends.map((f) => (
                      <FriendCardRow key={f.id}>
                        <FriendCardAvatarWrap>
                          <PlayerThumbnail playerName={f.name} size={42} />
                        </FriendCardAvatarWrap>
                        <FriendCardInfo>
                          <FriendCardName>{f.name}</FriendCardName>
                          <FriendCardLocation>
                            <FriendLocationDot />
                            Offline
                          </FriendCardLocation>
                        </FriendCardInfo>
                      </FriendCardRow>
                    ))}
                  </>
                )}
              </>
            )
          ) : (
            received.length === 0 ? (
              <PanelEmpty>No pending friend requests.</PanelEmpty>
            ) : (
              received.map((f) => (
                <FriendCardRow key={f.id}>
                  <FriendCardAvatarWrap>
                    <PlayerThumbnail playerName={f.name} size={42} />
                  </FriendCardAvatarWrap>
                  <FriendCardInfo>
                    <FriendCardName>{f.name}</FriendCardName>
                    <FriendCardLocation>Wants to be your friend</FriendCardLocation>
                  </FriendCardInfo>
                  <FriendInviteActions>
                    <SmPrimaryBtn disabled={!!friendBusy} onClick={() => runAction(() => acceptFriend(f.id), f.id)}>Accept</SmPrimaryBtn>
                    <SmSecBtn disabled={!!friendBusy} onClick={() => runAction(() => declineFriend(f.id), f.id)}>Decline</SmSecBtn>
                  </FriendInviteActions>
                </FriendCardRow>
              ))
            )
          )}
        </FriendsListScroll>
      </FriendsPanelInner>
    </HubPanelContainer>
  );
}

/* ── Look Panel ── */

const LOOK_FEATURES = [
  { key: "hair",      label: "Hair" },
  { key: "eyebrows",  label: "Eyebrows" },
  { key: "eyes",      label: "Eyes" },
  { key: "nose",      label: "Nose" },
  { key: "mouth",     label: "Mouth" },
];

function LookPanelContent() {
  const [avatarWidth, setAvatarWidth] = useState(50);
  const [avatarHeight, setAvatarHeight] = useState(50);

  return (
    <HubPanelContainer>
      <LookPanelInner>
        <PanelHeaderRow>
          <PanelTitle>✦ Look</PanelTitle>
        </PanelHeaderRow>

        <LookScrollArea>
          <LookGrid>
            {/* Skin Color */}
            <LookFeatureCard>
              <LookFeatureLabel>Skin Color</LookFeatureLabel>
              <LookSlotsRow>
                <LookSlotWrap>
                  <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                  <LookSlotSubLabel>Color</LookSlotSubLabel>
                </LookSlotWrap>
              </LookSlotsRow>
            </LookFeatureCard>

            {/* Hair, Eyebrows, Eyes, Nose, Mouth */}
            {LOOK_FEATURES.map(({ key, label }) => (
              <LookFeatureCard key={key}>
                <LookFeatureLabel>{label}</LookFeatureLabel>
                <LookSlotsRow>
                  <LookSlotWrap>
                    <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                    <LookSlotSubLabel>Item</LookSlotSubLabel>
                  </LookSlotWrap>
                  <LookSlotWrap>
                    <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                    <LookSlotSubLabel>Color</LookSlotSubLabel>
                  </LookSlotWrap>
                </LookSlotsRow>
              </LookFeatureCard>
            ))}
          </LookGrid>

          {/* Body Dimensions */}
          <LookFeatureCard>
            <LookFeatureLabel>Body Size</LookFeatureLabel>
            <LookSliderRow>
              <LookSliderLabel>Width</LookSliderLabel>
              <LookSlider
                type="range"
                min={0} max={100}
                value={avatarWidth}
                onChange={e => setAvatarWidth(Number(e.target.value))}
              />
              <LookSliderValue>{avatarWidth}</LookSliderValue>
            </LookSliderRow>
            <LookSliderRow>
              <LookSliderLabel>Height</LookSliderLabel>
              <LookSlider
                type="range"
                min={0} max={100}
                value={avatarHeight}
                onChange={e => setAvatarHeight(Number(e.target.value))}
              />
              <LookSliderValue>{avatarHeight}</LookSliderValue>
            </LookSliderRow>
          </LookFeatureCard>
        </LookScrollArea>
      </LookPanelInner>
    </HubPanelContainer>
  );
}

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */

/* ── palette ── */
const C = {
  bg:       "#f7f3ff",
  surface:  "#ffffff",
  card:     "#f0eaff",
  cardHov:  "#e8deff",
  border:   "rgba(130,80,220,0.14)",
  border2:  "rgba(130,80,220,0.26)",
  accent:   "#7c3aed",
  accentLt: "#9d6ff5",
  txt:      "#2e1065",
  txt2:     "#5b3fa0",
  txt3:     "#a98fd4",
  coin:     "#b45309",
};

const thinScrollbar = css`
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(80,40,160,0.2); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(80,40,160,0.4); }
  scrollbar-width: thin;
  scrollbar-color: rgba(80,40,160,0.2) transparent;
`;

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const glassShine = keyframes`
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40,15,90,0.52);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileWrapper = styled.div`
  position: relative;
  width: min(96vw, 1400px);
  max-width: 98vw;
  height: 92vh;
  max-height: 92vh;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 32px 80px rgba(80,30,180,0.18), 0 4px 16px rgba(80,30,180,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
  animation: ${fadeIn} 0.22s ease;
`;

/* ── Sidebar ── */

const Sidebar = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 6px;
  width: 80px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #ede8ff 0%, #fce8ff 60%, #e8f0ff 100%);
  border-right: 1px solid ${C.border};
  border-radius: 22px 0 0 22px;
  z-index: 2;
`;

const SidebarLogoWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 18px;
`;

const SidebarLogoMark = styled.span`
  font-size: 16px;
  color: ${C.accent};
`;

const SidebarLogoText = styled.span`
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 2.5px;
  color: ${C.txt3};
  text-transform: uppercase;
`;

const SidebarNav = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 0 8px;
  flex: 1;
`;

const SidebarItem = styled.li`
  aspect-ratio: 1;
`;

const SidebarBtn = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  cursor: pointer;
  gap: 4px;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s;
  background: ${p => p.$active ? "rgba(124,58,237,0.14)" : "transparent"};
  box-shadow: ${p => p.$active ? `inset 0 0 0 1px rgba(124,58,237,0.38), 0 2px 8px rgba(124,58,237,0.1)` : "none"};
  ${p => p.$active && css`
    &::after {
      content: '';
      position: absolute;
      right: 0; top: 22%; bottom: 22%;
      width: 2.5px;
      background: ${C.accent};
      border-radius: 0 2px 2px 0;
    }
  `}
  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover:not(:disabled) {
    background: ${p => p.$danger ? "rgba(220,38,38,0.1)" : p.$active ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.08)"};
  }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const SidebarIcon = styled.span`
  font-size: 15px;
  color: ${p => p.$active ? C.accent : p.$danger ? "#dc2626" : C.txt3};
  line-height: 1;
  transition: color 0.2s;
  ${SidebarBtn}:hover:not(:disabled) & { color: ${C.txt}; }
`;

const SidebarLabel = styled.span`
  font-size: 8px;
  font-weight: 700;
  color: ${p => p.$active ? C.accent : C.txt3};
  letter-spacing: 0.4px;
  text-transform: uppercase;
  transition: color 0.2s;
  ${SidebarBtn}:hover:not(:disabled) & { color: ${C.txt2}; }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding-top: 12px;
`;

const SidebarAvatarThumb = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b21b6, #1e40af);
  border: 2px solid rgba(124,58,237,0.5);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: scale(1.1); box-shadow: 0 0 16px rgba(124,58,237,0.55); }
`;

const SidebarOnlinePip = styled.div`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
  animation: pipBlink 2.4s ease-in-out infinite;
  @keyframes pipBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

const SidebarNotifDot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 14px;
  height: 14px;
  background: #e03131;
  border: 1.5px solid #ede8ff;
  border-radius: 7px;
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  pointer-events: none;
  line-height: 1;
`;

/* ── Avatar Stage ── */

const AvatarStageCol = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 14px;
  width: 350px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #fdfbff 0%, #f4eeff 100%);
  border-right: 1px solid ${C.border};
  gap: 10px;
  overflow: hidden;
  position: relative;
`;

const OutfitLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: ${C.accent};
  letter-spacing: 0.6px;
  background: rgba(124,58,237,0.08);
  border: 1px solid ${C.border2};
  padding: 5px 13px;
  border-radius: 20px;
  flex-shrink: 0;
`;

const OutfitGem = styled.span`
  font-size: 7px;
  opacity: 0.65;
`;

const StageContainer = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background: radial-gradient(ellipse 80% 45% at 50% 38%, rgba(124,58,237,0.07) 0%, transparent 68%);
`;

const StageHalo = styled.div`
  position: absolute;
  width: 190px; height: 190px;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%);
  animation: haloPulse 3.2s ease-in-out infinite;
  pointer-events: none;
  @keyframes haloPulse {
    0%,100% { opacity: 0.55; transform: translateX(-50%) scale(1); }
    50%      { opacity: 1;    transform: translateX(-50%) scale(1.09); }
  }
`;

const StageHaloOuter = styled.div`
  position: absolute;
  width: 280px; height: 280px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 60%);
  animation: haloPulse 3.2s ease-in-out infinite;
  animation-delay: -1.6s;
  pointer-events: none;
`;

const AvatarViewport = styled.div`
  flex: 1;
  min-height: 0;
  aspect-ratio: ${FRAME_W} / ${FRAME_H};
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 0 22px rgba(124,58,237,0.1), inset 0 0 18px rgba(124,58,237,0.04);
  background: radial-gradient(ellipse at 50% 95%, rgba(124,58,237,0.07) 0%, transparent 55%);
  position: relative;
  z-index: 2;
`;

const AvatarCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const AvatarPlatform = styled.div`
  width: 64%;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(124,58,237,0.95) 0%, rgba(59,130,246,0.55) 38%, transparent 72%);
  filter: blur(6px);
  margin-top: 2px;
  flex-shrink: 0;
  opacity: 0.75;
  animation: platformPulse 2.8s ease-in-out infinite alternate;
  @keyframes platformPulse {
    from { opacity: 0.55; transform: scaleX(0.94); }
    to   { opacity: 0.9;  transform: scaleX(1.06); }
  }
`;

const StatusCard = styled.div`
  width: calc(100% + 28px);
  margin: 0 -14px;
  height: 58px;
  box-sizing: border-box;
  flex-shrink: 0;
  background: rgba(124,58,237,0.04);
  border-left: none;
  border-right: none;
  border-top: 1px solid ${C.border};
  border-bottom: 1px solid ${C.border};
  border-radius: 0;
  padding: 9px 27px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
`;

const StatusCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const OnlineDot = styled.span`
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 7px #22c55e;
  flex-shrink: 0;
  animation: pipBlink 2.4s ease-in-out infinite;
`;

const OnlineLabel = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: #16a34a;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StatusSep = styled.span`color: ${C.txt3}; font-size: 11px;`;

const StatusLoc = styled.span`
  font-size: 9.5px;
  color: ${C.txt3};
  font-weight: 500;
`;

const StatusText = styled.div`
  font-size: 11px;
  color: ${C.txt2};
  font-style: italic;
  line-height: 1.4;
`;

const PRESENCE_DOT_COLORS = {
  online:    { bg: "#22c55e", shadow: "#22c55e" },
  away:      { bg: "#f59e0b", shadow: "#f59e0b" },
  offline:   { bg: "#6b7280", shadow: "transparent" },
  invisible: { bg: "#6b7280", shadow: "transparent" },
};

const PresenceDot = styled.span`
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).bg};
  box-shadow: 0 0 7px ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).shadow};
  animation: ${({ $status }) => ($status === "offline" || $status === "invisible") ? "none" : "pipBlink 2.4s ease-in-out infinite"};
`;

const PRESENCE_LABEL_COLORS = { online: "#16a34a", away: "#d97706", offline: "#9ca3af", invisible: "#9ca3af" };

const PresenceLabel = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${({ $status }) => PRESENCE_LABEL_COLORS[$status] || PRESENCE_LABEL_COLORS.offline};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StatusPickerWrap = styled.div`
  position: relative;
`;

const StatusClickTarget = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  border-radius: 5px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background 0.15s;
  &:hover { background: rgba(124,58,237,0.08); }
`;

const StatusDropdown = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border2};
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  z-index: 9999;
  min-width: 120px;
  box-shadow: 0 -4px 16px rgba(80,40,160,0.14);
`;

const StatusOption = styled.button`
  background: ${({ $active }) => $active ? "rgba(124,58,237,0.10)" : "none"};
  border: none;
  border-radius: 6px;
  color: ${C.txt};
  font-size: 11px;
  font-family: inherit;
  font-weight: ${({ $active }) => $active ? "700" : "500"};
  cursor: pointer;
  padding: 6px 8px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: rgba(124,58,237,0.08); }
`;

const OptionDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).bg};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 12px 0;
`;

const ArrowBtn = styled.button`
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid ${C.border};
  background: rgba(124,58,237,0.06);
  color: ${C.txt2};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.18s;
  font-family: inherit;
  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover:not(:disabled) {
    background: rgba(124,58,237,0.14);
    border-color: ${C.border2};
    color: ${C.txt};
    box-shadow: 0 2px 8px rgba(124,58,237,0.12);
  }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:active:not(:disabled) { transform: scale(0.9); }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
`;


const PoseLabel = styled.span`
  font-size: 8.5px;
  font-weight: 700;
  color: ${C.txt3};
  min-width: 48px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

/* ── Profile Content ── */

const ProfileContent = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 22px 22px 20px;
  overflow-y: auto;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  position: relative;
  ${thinScrollbar}
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  background: rgba(120,80,220,0.06);
  border: 1px solid ${C.border};
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.txt3};
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover {
    background: rgba(220,38,38,0.08);
    border-color: rgba(220,38,38,0.28);
    color: #dc2626;
  }
`;

/* Profile Header */

const ProfileHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${C.border};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ProfileEmblem = styled.div`
  width: 50px; height: 50px;
  border-radius: 15px;
  background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(59,130,246,0.08));
  border: 1px solid ${C.border2};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(124,58,237,0.12);
  flex-shrink: 0;
`;

const EmblemDiamond = styled.span`
  font-size: 24px;
  color: ${C.accent};
`;

const HeaderTitles = styled.div`display: flex; flex-direction: column; gap: 5px;`;

const PlayerName = styled.h2`
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.3px;
  background: linear-gradient(120deg, #7c3aed, #c026d3, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PlayerNameMark = styled.span`
  -webkit-text-fill-color: ${C.accent};
  font-size: 20px;
`;

const ProfileMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const LevelBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${C.accent};
  background: rgba(124,58,237,0.1);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid ${C.border2};
`;

const MetaSep = styled.span`color: ${C.txt3}; font-size: 11px;`;

const RankBadgeDiamond = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #0369a1;
  background: rgba(14,165,233,0.08);
  border: 1px solid rgba(14,165,233,0.28);
  padding: 2px 9px;
  border-radius: 6px;
`;

const ProfileStats = styled.div`
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  padding-top: 4px;
`;

const ProfileStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const ProfileStatVal = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: ${C.txt};
  line-height: 1;
`;

const ProfileStatLbl = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

/* Sections */

const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const SectionTitle = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

const SectionCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${C.accent};
  background: rgba(124,58,237,0.1);
  padding: 1px 6px;
  border-radius: 10px;
`;

const SectionEditBtn = styled.button`
  all: unset;
  font-size: 9.5px;
  font-weight: 700;
  color: ${C.accent};
  cursor: pointer;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: color 0.2s;
  &:hover { color: ${C.accentLt}; }
`;

/* Badges */

const BadgesScrollWrap = styled.div`
  overflow-x: auto;
  padding-bottom: 5px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const BadgesRow = styled.div`
  display: flex;
  gap: 9px;
  width: max-content;
`;

const BadgeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 12px 9px;
  border-radius: 12px;
  border: 1px solid ${p => {
    if (p.$selected) return "rgba(124,58,237,0.5)";
    if (p.$rarity === "legendary") return "rgba(234,179,8,0.38)";
    if (p.$rarity === "rare") return "rgba(59,130,246,0.28)";
    return C.border;
  }};
  background: ${p => p.$selected ? "rgba(124,58,237,0.08)" : C.surface};
  cursor: ${p => p.$clickable ? (p.$saving ? "wait" : "pointer") : "default"};
  min-width: 72px;
  position: relative;
  overflow: hidden;
  opacity: ${p => p.$saving ? 0.6 : 1};
  box-shadow: ${p => p.$selected ? "0 4px 14px rgba(124,58,237,0.18)" : "0 1px 4px rgba(100,50,200,0.06)"};
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover {
    transform: ${p => p.$clickable && !p.$saving ? "translateY(-3px) scale(1.04)" : "none"};
    box-shadow: ${p => {
      if (!p.$clickable || p.$saving) return "none";
      return "0 6px 20px rgba(124,58,237,0.18)";
    }};
  }
`;

const BadgeCardIconWrap = styled.div`
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

const BadgeCardName = styled.div`
  font-size: 8.5px;
  font-weight: 700;
  color: ${C.txt2};
  text-align: center;
`;

const BadgeCardRarity = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${p => {
    if (p.$rarity === "legendary") return "#b45309";
    if (p.$rarity === "rare") return "#0369a1";
    return C.txt3;
  }};
`;

const BadgeExpandBtn = styled.button`
  all: unset;
  align-self: flex-end;
  font-size: 10px;
  font-weight: 600;
  color: ${C.txt3};
  cursor: pointer;
  padding: 0;
  &:hover { color: ${C.accent}; }
`;

/* Soulmate */

const SoulmateCard = styled.div`
  background: linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(124,58,237,0.06) 100%);
  border: 1px solid rgba(236,72,153,0.22);
  border-radius: 14px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 13px;
  position: relative;
  overflow: hidden;
  flex-wrap: wrap;
  box-shadow: 0 2px 12px rgba(236,72,153,0.08);
`;

const SoulmateHeartBg = styled.span`
  position: absolute;
  right: -8px;
  top: -14px;
  font-size: 80px;
  opacity: 0.04;
  color: #ec4899;
  pointer-events: none;
  line-height: 1;
  animation: smHeartPulse 1.8s ease-in-out infinite;
  @keyframes smHeartPulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.1); }
  }
`;

const SoulmateAvatarWrap = styled.div`position: relative; flex-shrink: 0;`;

const SoulmateSpinRing = styled.div`
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #ec4899;
  border-right-color: #a855f7;
  animation: spinRing 3.2s linear infinite;
  @keyframes spinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const SoulmateInfoBlock = styled.div`flex: 1; min-width: 0;`;

const SoulmateName = styled.div`font-size: 15px; font-weight: 800; color: ${C.txt};`;

const SoulmateMark = styled.span`color: #ec4899;`;

const SoulmateDuration = styled.div`
  font-size: 10px;
  color: ${C.txt3};
  margin: 3px 0 6px;
`;

const SoulmateMoodTag = styled.div`
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  color: ${C.accent};
  background: rgba(124,58,237,0.08);
  border: 1px solid ${C.border};
  padding: 2px 8px;
  border-radius: 10px;
`;

const SoulmateCardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

const SoulmateEmptyBox = styled.div`
  background: rgba(124,58,237,0.04);
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 12px 14px;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/* Showcase */

const ShowcaseScrollWrap = styled.div`
  overflow-x: auto;
  padding-bottom: 5px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const ShowcaseRow = styled.div`
  display: flex;
  gap: 10px;
  width: max-content;
`;

const ShowcaseCard = styled.div`
  width: 98px; height: 116px;
  border-radius: 12px;
  border: 1px dashed ${C.border};
  background: ${C.surface};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  position: relative;
  overflow: hidden;
  padding: 8px;
  transition: transform 0.22s, box-shadow 0.22s, border-color 0.2s;
  &:hover {
    ${p => p.$clickable && css`
      border-style: solid;
      border-color: ${C.border2};
      box-shadow: 0 6px 20px rgba(124,58,237,0.14);
    `}
  }
`;

const ShowcaseCardShine = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 10%, rgba(124,58,237,0.18), transparent 65%);
  opacity: 0;
  transition: opacity 0.22s;
  pointer-events: none;
  ${ShowcaseCard}:hover & { opacity: 1; }
`;

const ShowcaseItemImg = styled.img`
  width: 80%; height: 80%;
  object-fit: contain;
`;

const ShowcaseCardLabel = styled.div`
  font-size: 8.5px;
  font-weight: 700;
  color: ${C.txt2};
  text-align: center;
`;

const ShowcaseCardType = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ShowcaseAdd = styled.div`
  font-size: 22px;
  color: ${C.border2};
  line-height: 1;
  ${ShowcaseCard}:hover & { color: ${C.accent}; }
`;

const ShowcaseCardAddLabel = styled.div`
  font-size: 8px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

/* Companion */

const CompanionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(59,130,246,0.03));
  border: 1px solid ${C.border};
  border-radius: 14px;
  padding: 14px 16px;
`;

const CompanionPetWrap = styled.div`position: relative; flex-shrink: 0;`;

const CompanionPetAura = styled.div`
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%);
  animation: auraBreath 3.2s ease-in-out infinite;
  @keyframes auraBreath { 0%,100% { transform: scale(1); opacity: 0.48; } 50% { transform: scale(1.18); opacity: 0.9; } }
`;

const CompanionPetEmoji = styled.span`
  font-size: 40px;
  line-height: 1;
  display: block;
  position: relative;
  z-index: 1;
  animation: petBounce 2.6s ease-in-out infinite;
  @keyframes petBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
`;

const CompanionInfoBlock = styled.div`
  flex: 1; min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const CompanionNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const CompanionNameText = styled.span`font-size: 14px; font-weight: 800; color: ${C.txt};`;

const CompanionMoodText = styled.span`font-size: 11px; color: ${C.txt3};`;

const CompanionLevelText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${C.txt3};
  letter-spacing: 0.3px;
`;

const CompanionXPWrap = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const XPBarOuter = styled.div`
  height: 5px;
  background: rgba(130,80,220,0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const XPBarFill = styled.div`
  height: 100%;
  width: var(--xp, 0%);
  background: linear-gradient(90deg, #5b21b6, #a855f7, #ec4899);
  border-radius: 3px;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.36) 50%, transparent 100%);
    background-size: 60px 100%;
    animation: xpShimmer 2s linear infinite;
    @keyframes xpShimmer { from { background-position: -60px 0; } to { background-position: 200px 0; } }
  }
`;

const XPLabelsRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: ${C.txt3};
  font-weight: 600;
`;

/* ── Right Panel ── */

const RightPanel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 290px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #fdfbff 0%, #f4eeff 100%);
  border-left: 1px solid ${C.border};
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

const RightSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 20px 17px;
  flex: ${p => p.$flex ? "1" : "0 0 auto"};
  min-height: 0;
  overflow-y: ${p => p.$flex ? "hidden" : "auto"};
  ${thinScrollbar}
`;

const OrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 17px;
  flex-shrink: 0;
`;

const OrnamentLine = styled.div`flex: 1; height: 1px; background: ${C.border};`;

const OrnamentGem = styled.span`font-size: 9px; color: ${C.accentLt};`;

/* Guestbook preview */

const GBToggleBtn = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  cursor: pointer;
`;

const GBCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${C.accent};
  background: rgba(124,58,237,0.1);
  padding: 1px 7px;
  border-radius: 10px;
`;

const GBToggleArrow = styled.span`
  font-size: 8px;
  color: ${C.txt3};
  transition: transform 0.25s ease;
  transform: ${p => p.$open ? "rotate(0deg)" : "rotate(180deg)"};
  display: inline-block;
`;

const GBPreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const GBPreviewCard = styled.div`
  display: flex;
  gap: 9px;
  padding: 9px 11px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  transition: border-color 0.18s, background 0.18s;
  &:hover { background: ${C.card}; border-color: ${C.border2}; }
`;

const GBPreviewAvatarWrap = styled.div`
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  overflow: hidden;
`;

const GBPreviewBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;`;

const GBPreviewMeta = styled.div`display: flex; align-items: center; gap: 6px;`;

const GBPreviewName = styled.span`font-size: 11px; font-weight: 700; color: ${C.accent};`;

const GBPreviewTime = styled.span`font-size: 9.5px; color: ${C.txt3};`;

const GBPreviewText = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: ${C.txt2};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GBEmpty = styled.div`
  font-size: ${p => p.$large ? "13px" : "11.5px"};
  color: ${C.txt3};
  ${p => p.$large && "text-align: center; padding: 20px 0;"}
`;

const GBInputArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

const GBInput = styled.textarea`
  width: 100%;
  resize: none;
  height: 44px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  padding: 10px 36px 10px 12px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${C.accent};
  &:focus { border-color: ${C.border2}; box-shadow: 0 0 0 2px rgba(124,58,237,0.08); }
  &::placeholder { color: ${C.txt3}; }
`;

const GBInputFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GBCounter = styled.span`
  font-size: 10px;
  color: ${p => p.$warn ? "#b45309" : C.txt3};
`;

/* Shared buttons */

const PrimaryBtn = styled.button`
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.3);
  color: ${C.accent};
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.18); border-color: ${C.border2}; transform: translateY(-1px); }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:active:not(:disabled) { transform: translateY(0); }
`;

const SecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid ${C.border};
  color: ${C.txt3};
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${C.card}; color: ${C.txt2}; border-color: ${C.border2}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

/* Bio editing */

const FormatToolbar = styled.div`display: flex; gap: 4px; margin-bottom: 4px;`;

const FormatBtn = styled.button`
  background: ${C.surface};
  border: 1px solid ${C.border};
  color: ${C.txt2};
  font-size: 12px;
  width: 26px; height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { background: ${C.card}; border-color: ${C.border2}; color: ${C.accent}; }
`;

const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${C.accent};
  &:focus { border-color: ${C.border2}; box-shadow: 0 0 0 2px rgba(124,58,237,0.08); }
  &::placeholder { color: ${C.txt3}; }
`;

const BioFooter = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: 6px;`;

const BioCounter = styled.span`font-size: 11px; color: ${C.txt3};`;

const BioActions = styled.div`display: flex; gap: 6px;`;

const Description = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${C.txt2};
  line-height: 1.7;
  white-space: pre-wrap;
`;

const EmptyText = styled.span`font-size: 12px; color: ${C.txt3};`;

const BioErrorMsg = styled.div`margin-top: 6px; font-size: 11px; color: #dc2626;`;

/* Soulmate sub-components (action states) */

const SmContent = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`;

const SmEmpty = styled.div`font-size: 12px; color: ${C.txt3};`;

const SmSub = styled.div`
  font-size: 9.5px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
`;

const SmName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${C.txt};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SmActions = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-left: auto;`;

const SmRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`;

const SmPrimaryBtn = styled.button`
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.3);
  color: ${C.accent};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.18); border-color: ${C.border2}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const SmSecBtn = styled.button`
  background: transparent;
  border: 1px solid ${C.border};
  color: ${C.txt3};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${C.card}; color: ${C.txt2}; border-color: ${C.border2}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const SmDangerBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(220,38,38,0.3);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.5); }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const SmError = styled.div`font-size: 11px; color: #dc2626;`;

/* ── Guest Book Expanded Overlay ── */

const GuestBookOverlay = styled.div`
  position: absolute;
  top: 0; bottom: 0; right: 0;
  left: 30%;
  z-index: 20;
  background: linear-gradient(160deg, #fdfbff 0%, #f4eeff 100%);
  border-radius: 0 22px 22px 0;
  border: 1px solid ${C.border};
  box-shadow: -4px 0 24px rgba(100,50,200,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: right bottom;
  transform: ${p => p.$open ? "scale(1)" : "scale(0)"};
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${p => p.$open ? "auto" : "none"};
`;

const GBOverlayClose = styled.button`
  all: unset;
  position: absolute;
  top: 12px; right: 14px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(120,80,220,0.08);
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt2};
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.28); color: #dc2626; }
`;

const GBHeader = styled.div`padding: 22px 24px 0; flex-shrink: 0;`;

const GBTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(120deg, #7c3aed, #c026d3, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
`;

const GBSubtitle = styled.p`
  margin: 5px 0 14px;
  font-size: 11px;
  color: ${C.txt3};
  text-align: center;
  letter-spacing: 0.3px;
`;

const GBHeaderControls = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 14px;
`;

const GBSortBtn = styled.button`
  background: ${C.surface};
  border: 1px solid ${C.border};
  color: ${C.txt2};
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: ${C.card}; border-color: ${C.border2}; color: ${C.txt}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const GBPinnedBtn = styled.button`
  background: ${C.surface};
  border: 1px solid ${C.border};
  color: ${C.txt2};
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: ${C.card}; border-color: ${C.border2}; color: ${C.txt}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const GBComposeArea = styled.div`
  margin: 0 16px 4px;
  padding: 12px 14px 8px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 14px;
  flex-shrink: 0;
`;

const GBComposeRow = styled.div`display: flex; align-items: center; gap: 10px;`;

const GBAvatarPlaceholder = styled.div`
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(124,58,237,0.1);
  border: 2px solid ${C.border2};
  flex-shrink: 0;
`;

const GBComposeInputWrap = styled.div`flex: 1; position: relative;`;

const GBEmojiBtn = styled.button`
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${C.txt3};
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: ${C.accent}; }
`;

const GBPostBtn = styled.button`
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.3);
  color: ${C.accent};
  font-size: 14px;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.18); border-color: ${C.border2}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const GBComposeTools = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding-top: 8px;
`;

const GBToolBtn = styled.button`
  background: none;
  border: none;
  color: ${C.txt3};
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  &:hover { background: ${C.card}; color: ${C.txt2}; }
`;

const GBOrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  flex-shrink: 0;
`;

const GBDividerLine = styled.div`flex: 1; height: 1px; background: ${C.border};`;

const GBDividerGem = styled.span`color: ${C.accentLt}; font-size: 11px;`;

const GBCommentCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  &:hover {
    border-color: ${C.border2};
    background: ${C.card};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

const GBCommentInner = styled.div`display: flex; gap: 12px; align-items: flex-start;`;

const GBCommentAvatarCol = styled.div`flex-shrink: 0;`;

const GBCommentBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;`;

const GBCommentMeta = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

const GBCommentName = styled.span`font-size: 14px; font-weight: 700; color: ${C.accent};`;

const GBCommentTime = styled.span`font-size: 11px; color: ${C.txt3};`;

const GBCommentText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${C.txt2};
  line-height: 1.55;
  word-break: break-word;
`;

const GBReactions = styled.div`display: flex; gap: 14px; margin-top: 2px;`;

const GBReactionBtn = styled.button`
  all: unset;
  font-size: 12px;
  color: ${C.txt3};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s, transform 0.15s;
  &:hover { color: ${C.accent}; transform: scale(1.2); }
  &:active { transform: scale(0.88); }
`;

const GBCommentActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const CommentDeleteBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 18px; height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.txt3};
  font-size: 15px;
  cursor: pointer;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
`;

const GBMenuDot = styled.button`
  all: unset;
  color: ${C.txt3};
  font-size: 18px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover { color: ${C.txt}; }
`;

const GBOverlayScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${thinScrollbar}
`;

const GBStatsFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid ${C.border};
  flex-shrink: 0;
  background: linear-gradient(135deg, #ede8ff, #fce8ff, #e8f0ff);
`;

const GBStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 16px;
  &:first-child { padding-left: 0; }
`;

const GBStatLabel = styled.div`
  font-size: 10px;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const GBStatValue = styled.div`font-size: 20px; font-weight: 700; color: ${C.txt};`;

const GBStatDivider = styled.div`width: 1px; height: 32px; background: ${C.border}; flex-shrink: 0;`;

const GBLeaveGiftBtn = styled.button`
  margin-left: auto;
  background: rgba(124,58,237,0.08);
  border: 1px solid ${C.border};
  color: ${C.accent};
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(124,58,237,0.16); border-color: ${C.border2}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

/* ── Global close button (always visible regardless of tab) ── */

const ProfileOuter = styled.div`
  position: relative;
`;

const GlobalCloseBtn = styled.button`
  position: absolute;
  top: -14px;
  right: -14px;
  z-index: 30;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  width: 30px; height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.txt3};
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(100,50,200,0.1);
  &:hover {
    background: #ffe4e4;
    border-color: rgba(220,38,38,0.35);
    color: #dc2626;
  }
`;

/* ── Hub panel shared container ── */

const HubPanelContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 0 22px 22px 0;
`;

const PanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 18px 14px;
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: ${C.txt};
  letter-spacing: 0.2px;
`;

const PanelTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 14px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid ${C.border};
`;

const PanelTab = styled.button`
  position: relative;
  overflow: hidden;
  background: ${p => p.$active ? "rgba(124,58,237,0.12)" : "transparent"};
  border: 1px solid ${p => p.$active ? C.border2 : "transparent"};
  color: ${p => p.$active ? C.accent : C.txt3};
  font-size: 12px;
  font-weight: ${p => p.$active ? "700" : "500"};
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { color: ${C.txt}; background: ${C.card}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const TabUnreadBadge = styled.span`
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

const TabCountBadge = styled.span`
  background: rgba(124,58,237,0.12);
  color: ${C.accent};
  font-size: 9px;
  font-weight: 700;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

const PanelEmpty = styled.div`
  padding: 28px 14px;
  font-size: 12px;
  color: ${C.txt3};
  text-align: center;
`;

/* ── Mail panel ── */

const MailListCol = styled.div`
  width: 290px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #ede8ff 0%, #f4eeff 100%);
  border-right: 1px solid ${C.border};
  overflow: hidden;
`;

const NewMailBtn = styled.button`
  background: rgba(124,58,237,0.1);
  border: 1px solid ${C.border2};
  color: ${C.accent};
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(124,58,237,0.18); border-color: ${C.accent}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const MailThreadList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 3px;
  ${thinScrollbar}
`;

const MailThreadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.$active ? "rgba(124,58,237,0.12)" : p.$unread ? C.card : C.surface};
  border: 1px solid ${p => p.$active ? C.border2 : C.border};
  /* border-radius: 10px; */
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: ${C.card}; border-color: ${C.border2}; }
`;

const MailThreadThumb = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 38px; height: 38px;
`;

const MailUnreadDot = styled.div`
  position: absolute;
  top: -2px; right: -2px;
  width: 9px; height: 9px;
  background: #e03131;
  border-radius: 50%;
  border: 2px solid ${C.bg};
`;

const MailThreadMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MailThreadMetaTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
`;

const MailThreadName = styled.div`
  font-size: 12px;
  font-weight: ${p => p.$unread ? "700" : "500"};
  color: ${p => p.$unread ? C.accent : C.txt2};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MailThreadTime = styled.div`
  font-size: 10px;
  color: ${C.txt3};
  flex-shrink: 0;
  white-space: nowrap;
`;

const MailThreadSubject = styled.div`
  font-size: 11px;
  font-weight: ${p => p.$unread ? "600" : "400"};
  color: ${p => p.$unread ? C.txt : C.txt2};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MailThreadPreview = styled.div`
  font-size: 10.5px;
  color: ${C.txt3};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MailUnreadBadge = styled.div`
  flex-shrink: 0;
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

const MailDetailCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

const MailPlaceholder = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const MailPlaceholderIcon = styled.div`
  font-size: 42px;
  opacity: 0.3;
  color: ${C.accentLt};
`;

const MailPlaceholderText = styled.div`
  font-size: 13px;
  color: ${C.txt3};
`;

const MailDetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${C.border};
  flex-shrink: 0;
`;

const MailBackBtn = styled.button`
  all: unset;
  font-size: 12px;
  font-weight: 600;
  color: ${C.txt3};
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: ${C.accent}; }
`;

const MailDetailSubject = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: ${C.txt};
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const MailDetailWith = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${C.txt};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MailMessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  ${thinScrollbar}
`;

const MailMessageRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  justify-content: ${p => p.$mine ? "flex-end" : "flex-start"};
`;

const MailMsgThumb = styled.div`flex-shrink: 0;`;

const MailBubble = styled.div`
  max-width: 68%;
  background: ${p => p.$mine ? "rgba(124,58,237,0.12)" : C.surface};
  border: 1px solid ${p => p.$mine ? C.border2 : C.border};
  border-radius: ${p => p.$mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
  padding: 10px 13px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const MailBubbleBody = styled.div`
  font-size: 13px;
  color: ${C.txt};
  line-height: 1.5;
  word-break: break-word;
`;

const MailBubbleTime = styled.div`
  font-size: 10px;
  color: ${C.txt3};
  text-align: right;
`;

const MailReplyBox = styled.div`
  padding: 12px 18px 14px;
  border-top: 1px solid ${C.border};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MailReplyTextarea = styled.textarea`
  width: 100%;
  resize: none;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${C.accent};
  &:focus { border-color: ${C.border2}; background: ${C.card}; }
  &::placeholder { color: ${C.txt3}; }
  &:disabled { opacity: 0.5; }
`;

const MailReplyFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MailReplyCounter = styled.div`font-size: 11px; color: ${C.txt3};`;

const MailReplyError = styled.div`font-size: 11px; color: #dc2626;`;

const MailNewPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 22px 20px;
  gap: 14px;
  overflow-y: auto;
  ${thinScrollbar}
`;

const MailNewTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${C.txt};
  flex-shrink: 0;
`;

const MailToRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const MailToLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  width: 20px;
`;

const MailToInput = styled.input`
  flex: 1;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  &:focus { border-color: ${C.border2}; background: ${C.card}; }
  &::placeholder { color: ${C.txt3}; }
  &:disabled { opacity: 0.5; }
`;

const MailFindBtn = styled.button`
  background: rgba(124,58,237,0.1);
  border: 1px solid ${C.border2};
  color: ${C.accent};
  font-size: 12px;
  font-weight: 700;
  padding: 0 14px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.18); }
`;

const MailLookupHint = styled.div`
  font-size: 12px;
  color: ${({ $ok }) => ($ok ? "#16a34a" : "#dc2626")};
  flex-shrink: 0;
`;

const MailNewTextarea = styled.textarea`
  flex: 1;
  min-height: 120px;
  resize: none;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 10px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${C.accent};
  &:focus { border-color: ${C.border2}; background: ${C.card}; }
  &::placeholder { color: ${C.txt3}; }
  &:disabled { opacity: 0.5; }
`;

/* ── Friends panel ── */

const FriendsPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 20px 0;
  gap: 14px;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

const FriendsSearchRow = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const FriendsSearchInput = styled.input`
  width: 100%;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  color: ${C.txt};
  font-family: inherit;
  font-size: 13px;
  padding: 10px 38px 10px 16px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${C.accent};
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: ${C.border2}; background: ${C.card}; }
  &::placeholder { color: ${C.txt3}; }
`;

const FriendsSearchIcon = styled.span`
  position: absolute;
  right: 13px; top: 50%;
  transform: translateY(-50%);
  color: ${C.txt3};
  font-size: 18px;
  pointer-events: none;
`;

const FriendsListScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 16px;
  ${thinScrollbar}
`;

const FriendsGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 2px 2px;
`;

const FriendCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 11px 14px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    background: ${C.card};
    border-color: ${C.border2};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

const FriendCardAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 42px; height: 42px;
`;

const FriendOnlineDot = styled.div`
  position: absolute;
  bottom: 1px; right: 1px;
  width: 10px; height: 10px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid ${C.surface};
  box-shadow: 0 0 6px #22c55e;
`;

const FriendCardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const FriendCardName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${C.txt};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const FriendCardLocation = styled.div`
  font-size: 11px;
  color: ${C.txt3};
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FriendLocationDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: ${p => p.$online ? "#22c55e" : C.border2};
  flex-shrink: 0;
`;

const FriendInviteActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

/* ── Wishlist Panel ── */

const WishlistPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

const WishlistScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${thinScrollbar}
`;

const WishlistMsg = styled.div`
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: ${C.txt3};
`;

const WishlistItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: linear-gradient(to top, #ddd0f8, #f8f3ff);
  border: 1px solid ${C.border};
  min-height: 88px;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${C.border2}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

const WishlistNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const WishlistRarityBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 2px 7px; border-radius: 4px;
  width: fit-content;
  background: ${p => WL_RARITY[p.$r]?.bg};
  border: 1px solid ${p => WL_RARITY[p.$r]?.border};
  color: ${p => WL_RARITY[p.$r]?.color};
`;

const WishlistTag = styled.div`
  display: inline-block;
  flex-shrink: 0;
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.4px;
  color: ${C.accent};
  background: rgba(124,58,237,0.08);
  border: 1px solid rgba(124,58,237,0.18);
  border-radius: 4px;
  padding: 2px 7px;
`;

const WishlistRemoveBtn = styled.button`
  background: none; border: none; cursor: pointer; flex-shrink: 0;
  font-size: 13px; color: ${C.txt3};
  padding: 4px 8px; border-radius: 6px; margin-right: 4px;
  transition: color .13s, background .13s;
  &:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
`;

/* ── Look Panel ── */

const LookPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

const LookScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${thinScrollbar}
`;

const LookGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const LookFeatureCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  padding: 13px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LookFeatureLabel = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

const LookSlotsRow = styled.div`
  display: flex;
  gap: 8px;
`;

const LookSlotWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

const LookSlot = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background: ${C.card};
  border: 1px dashed ${C.border2};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  position: relative;
  overflow: hidden;
  &:hover {
    border-style: solid;
    border-color: ${C.accent};
    background: rgba(124,58,237,0.1);
    box-shadow: 0 0 12px rgba(124,58,237,0.14);
  }
`;

const LookSlotPlus = styled.span`
  font-size: 22px;
  color: ${C.txt3};
  line-height: 1;
  pointer-events: none;
  ${LookSlot}:hover & { color: ${C.accent}; }
`;

const LookSlotSubLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${C.txt3};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const LookSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LookSliderLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${C.txt2};
  min-width: 42px;
`;

const LookSlider = styled.input`
  flex: 1;
  accent-color: ${C.accent};
  cursor: pointer;
  height: 4px;
`;

const LookSliderValue = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${C.txt3};
  min-width: 28px;
  text-align: right;
`;

/* ── Inventory action bar (below avatar) ── */

const InvActionBar = styled.div`
  width: 100%;
  height: 58px;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  overflow: hidden;
`;

const InvNudeBtn = styled.button`
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(220,38,38,0.3);
  background: rgba(220,38,38,0.07);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(220,38,38,0.14); border-color: rgba(220,38,38,0.5); }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const InvResetBtn = styled.button`
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid ${C.border};
  background: transparent;
  color: ${C.txt3};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { color: ${C.txt2}; border-color: ${C.border2}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const InvApplyBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(124,58,237,0.3);
  background: rgba(124,58,237,0.1);
  color: ${C.accent};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.18); border-color: ${C.border2}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

/* ── Inventory panel (items area) ── */

const InvContentCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
`;

const InvCatScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  ${thinScrollbar}
`;

const InvCatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const InvCatCard = styled.div`
  position: relative;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${C.border2}; box-shadow: 0 4px 18px rgba(100,50,200,0.1); }
`;

const InvCatDeco = styled.img`
  position: absolute;
  z-index: 1;
  right: -8px;
  bottom: 0;
  height: 78%;
  width: auto;
  object-fit: contain;
  opacity: 0.07;
  filter: saturate(0);
  pointer-events: none;
  transition: transform 0.2s;
  ${InvCatCard}:hover & { transform: translateX(-4px) scale(1.05); }
`;

const InvCatCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid ${C.border};
  background: rgba(124,58,237,0.05);
  transition: background 0.13s;
  &:hover { background: rgba(124,58,237,0.1); }
`;

const InvCatLabel = styled.span`font-size: 13px; font-weight: 700; color: ${C.txt}; flex: 1;`;
const InvCatArrow = styled.span`font-size: 13px; color: ${C.txt3}; transition: transform 0.13s; ${InvCatCardTop}:hover & { transform: translateX(2px); }`;

const InvCatSubList = styled.div`padding: 8px 14px 10px; display: flex; flex-direction: column; gap: 1px;`;

const InvCatSubItem = styled.div`
  font-size: 11.5px;
  color: ${C.txt2};
  padding: 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  transition: color 0.1s;
  &:hover { color: ${C.accent}; font-weight: 600; }
`;

const InvSubCount = styled.span`font-size: 10px; color: ${C.txt3}; font-weight: 500;`;

const InvQuickNavRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
`;

const InvQuickNavBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: ${C.border2};
    background: ${C.card};
    box-shadow: 0 4px 18px rgba(100,50,200,0.1);
  }
`;

const InvQuickNavLabel = styled.span`
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: ${C.txt};
`;

const InvQuickNavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InvQuickNavCount = styled.span`
  font-size: 11px;
  color: ${C.txt3};
  font-weight: 500;
`;

const InvQuickNavArrow = styled.span`
  font-size: 13px;
  color: ${C.txt3};
  transition: transform 0.13s;
  ${InvQuickNavBtn}:hover & { transform: translateX(2px); color: ${C.accent}; }
`;

const InvItemScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${thinScrollbar}
`;

const InvMsg = styled.div`text-align: center; color: ${C.txt3}; padding: 20px 0; font-size: 13px;`;
const InvErrTxt = styled.div`font-size: 12px; color: #dc2626; padding: 8px 12px;`;

const InvItemList = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const InvItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: linear-gradient(to top, #ddd0f8, #f8f3ff);
  border: 1px solid ${p => p.$expanded ? C.border2 : C.border};
  min-height: 88px;
  cursor: pointer;
  opacity: ${p => p.$locked ? 0.65 : 1};
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${C.border2}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

const InvThumbImg = styled.img`flex-shrink: 0; width: 76px; height: 76px; object-fit: contain;`;

const InvMidSection = styled.div`
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  background: linear-gradient(to top, #ede5ff, #ffffff);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  align-self: stretch;
  gap: 4px;
`;

const InvItemName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${C.txt};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const InvWearingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: ${C.accent};
  background: rgba(124,58,237,0.1);
  border: 1px solid ${C.border2};
  border-radius: 4px;
  padding: 2px 7px;
  width: fit-content;
`;

const InvLockTxt = styled.div`font-size: 10px; font-weight: 600; color: #dc2626;`;

const InvPricesArea = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  flex-shrink: 0;
  align-self: stretch;
  width: 35%;
`;

const InvPricePanel = styled.div`
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(to top, #ede5ff, #ffffff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 24px;
  width: 50%;
`;

const InvLevelBadge = styled.div`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  padding: 4px 12px;
  border-radius: 4px;
  align-self: stretch;
  text-align: center;
  background: rgba(220,38,38,0.1);
  color: #dc2626;
  border: 1px solid rgba(220,38,38,0.3);
  text-wrap: nowrap;
`;

const InvBadgeAndPrice = styled.div`display: flex; gap: 6px; align-items: center;`;

const InvCoinImg = styled.img`width: 32px; height: 32px; object-fit: contain;`;

const InvPriceAmt = styled.div`font-size: 13px; font-weight: 700; color: ${C.coin};`;

const InvSellPanel = styled.button`
  width: 50%;
  border-radius: 10px;
  background: linear-gradient(to top, #ede5ff, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: ${C.txt3};
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: box-shadow 0.13s, color 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { box-shadow: 0 2px 10px rgba(120,60,220,0.12); color: ${C.accent}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ── Inventory breadcrumbs sidebar ── */

const InvBreadcrumbCol = styled.div`
  width: 160px;
  flex-shrink: 0;
  border-left: 1px solid ${C.border};
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: linear-gradient(160deg, #ede8ff 0%, #f4eeff 100%);
  border-radius: 0 22px 22px 0;
  overflow-y: auto;
  ${thinScrollbar}
`;

const InvCrumbStep = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.$active ? C.accent : C.txt3};
  background: ${p => p.$active
    ? "linear-gradient(145deg, rgba(124,58,237,0.14), rgba(157,111,245,0.08))"
    : C.surface};
  border: 1px solid ${p => p.$active ? C.border2 : C.border};
  box-shadow: ${p => p.$active ? "0 0 18px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.6)" : "none"};
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  transition: all 0.18s;
  word-break: break-word;
  line-height: 1.3;
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  ${p => p.$clickable && css`
    &:hover {
      background: rgba(124,58,237,0.1);
      border-color: rgba(124,58,237,0.35);
      color: ${C.accent};
      box-shadow: 0 4px 14px rgba(124,58,237,0.14);
      transform: translateY(-2px);
    }
    &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
  `}
`;
