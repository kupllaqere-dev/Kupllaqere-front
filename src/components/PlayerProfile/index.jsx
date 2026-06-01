import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  fetchSoulMateState,
  sendSoulMateRequest,
  acceptSoulMateRequest,
  declineSoulMateRequest,
  cancelSoulMateRequest,
  removeSoulMate,
} from "../../api/soulmate";

const smStateCache = new Map();
import {
  fetchFriends,
  sendFriendRequest,
  acceptFriendRequest as acceptFriend,
  cancelFriendRequest as cancelFriend,
  declineFriendRequest as declineFriend,
  removeFriend,
} from "../../api/friends";
import {
  fetchGuestbookStickers,
  deleteGuestbookSticker,
  fetchGuestBookComments,
  postGuestBookComment,
  deleteGuestBookComment,
} from "../../api/guestbook";
import {
  fetchConversations,
  fetchThread,
  markThreadRead,
  replyToThread,
  sendMail,
} from "../../api/mail";
import { fetchInventory, sellItem, fetchWishlist, removeFromWishlist } from "../../api/store";
import {
  saveTheme, fetchUserStatus, updatePresence,
  fetchProfileView, saveProfileView, clearProfileView, invalidateProfileViewCache,
} from "../../api/users";
import ComposeMailModal from "../ComposeMailModal";
import AvatarCanvas from "../Avatar/AvatarCanvas";
import { avatarCompositor } from "../../game/avatar/AvatarCompositor";
import { getSlotKey, getConflictSlots } from "../../game/avatar/LayerConfig.js";

import {
  BADGES,
  INV_CATEGORY_LABELS, INV_SUBCATEGORY_LABELS, INV_CATEGORIES,
  BADGE_RARITY, SHOWCASE_SLOTS, PRESENCE_LABELS,
  LOOK_FEATURES, LOOK_FEATURE_CATEGORY, LOOK_FEATURE_SUBCATEGORY,
  ZOOM_LEVELS, POSE_ORDER,
} from "./constants";
import { PALETTES, paletteToVars } from "./themes";

import ProfileTab from "./tabs/ProfileTab";
import MailTab from "./tabs/MailTab";
import FriendsTab from "./tabs/FriendsTab";
import LookTab from "./tabs/LookTab";
import WishlistTab from "./tabs/WishlistTab";
import ThemesTab from "./tabs/ThemesTab";
import { InvItemsArea, InvBreadcrumbsBar } from "./tabs/InventoryTab";

import {
  Overlay, ProfileOuter, GlobalCloseBtn, ProfileWrapper,
  Sidebar, SidebarLogoWrap, SidebarLogoMark, SidebarLogoText,
  SidebarNav, SidebarItem, SidebarBtn, SidebarIcon, SidebarLabel, SidebarNotifDot,
  InvActionBar, InvNudeBtn, InvResetBtn, InvApplyBtn,
  HubPanelContainer,
  AvatarStageCol, StageContainer, AvatarViewport, Controls, ArrowBtn,
  StatusCard, StatusCardTop, StatusSep, StatusLoc, StatusText,
  PresenceDot, PresenceLabel,
  StatusPickerWrap, StatusClickTarget, StatusDropdown, StatusOption, OptionDot,
} from "./styles";

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
  currentUserName = "",
  targetUserId = null,
  socket = null,
  unreadMailCount = 0,
  onUnreadChange = null,
  onOpenAlbum = null,
  onOpenMarketplace = null,
  onEquip = null,
  onUnequip = null,
  onApplyLookBatch = null,
  equipped = null,
  level = 1,
  onOpenProfile = null,
}) {
  const textareaRef = useRef(null);

  const isSelfView = !!(
    currentUserId && targetUserId &&
    String(currentUserId) === String(targetUserId)
  );


  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState(null);

  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgesExpanded, setBadgesExpanded] = useState(false);

  const [smState, setSmState] = useState(() => smStateCache.get(targetUserId ?? "self") ?? null);
  const [smBusy, setSmBusy] = useState(false);
  const [smError, setSmError] = useState(null);

  const [friendStatus, setFriendStatus] = useState(null);
  const [friendBusy, setFriendBusy] = useState(false);

  const [composing, setComposing] = useState(false);

  const [showcaseItems] = useState(Array(SHOWCASE_SLOTS).fill(null));

  const [gbOpen, setGbOpen] = useState(false);
  // stickers
  const [gbStickers, setGbStickers] = useState([]);
  const [gbStickersLoading, setGbStickersLoading] = useState(false);
  const [gbPlacingAssetId, setGbPlacingAssetId] = useState(null);
  const [gbDeleteTarget, setGbDeleteTarget] = useState(null);
  const canvasRef = useRef(null);
  // messages
  const [gbComments, setGbComments] = useState([]);
  const [gbLoading, setGbLoading] = useState(false);
  const [gbInput, setGbInput] = useState("");
  const [gbSubmitting, setGbSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
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
  const panCurrentRef = useRef({ x: 0, y: 0 });
  const dragLayerRef = useRef(null);
  const zoomIndexRef = useRef(zoomIndex);
  const POSE_COUNT = POSE_ORDER.length;

  const [lookSelectedEntries, setLookSelectedEntries] = useState({});

  const [invItems, setInvItems] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invLoaded, setInvLoaded] = useState(false);
  const [invView, setInvView] = useState("categories");
  const [invCategory, setInvCategory] = useState(null);
  const [invSubcategory, setInvSubcategory] = useState(null);
  const [invSelectedEntries, setInvSelectedEntries] = useState({});
  const [invSelling, setInvSelling] = useState(null);
  const [invSellError, setInvSellError] = useState(null);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [themeIdx, setThemeIdx] = useState(() => {
    try {
      const saved = localStorage.getItem("fv_theme");
      if (saved) {
        const idx = PALETTES.findIndex(p => p.name === saved);
        if (idx >= 0) return idx;
      }
    } catch { /* ignore */ }
    return 0;
  });

  const [mailConversations, setMailConversations] = useState([]);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailListsLoaded, setMailListsLoaded] = useState(false);
  const [mailThread, setMailThread] = useState(null);
  const [mailThreadLoading, setMailThreadLoading] = useState(false);
  const [mailThreadCache, setMailThreadCache] = useState({});
  const [mailReplyBody, setMailReplyBody] = useState("");
  const [mailReplySending, setMailReplySending] = useState(false);
  const [mailReplyError, setMailReplyError] = useState(null);

  const [friendsTab, setFriendsTab] = useState("friends");
  const [friendsData, setFriendsData] = useState(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [friendsSearch, setFriendsSearch] = useState("");

  const [userStatus, setUserStatus] = useState(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const statusPickerRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Outfit shown in the avatar stage — reflects pending inventory/look selections
  // live, before the user hits Apply. Same outfit hash = instant compositor cache hit.
  const displayOutfit = useMemo(() => {
    if (activeTab === "inventory") {
      if (!invLoaded) return outfit || {};
      const base = { ...(outfit || {}) };
      for (const cat of Object.keys(equipped || {})) {
        if (!invSelectedEntries[cat]) delete base[cat];
      }
      for (const [slot, entry] of Object.entries(invSelectedEntries)) {
        base[slot] = { itemId: entry.itemId ?? entry._id, imageUrl: entry.imageUrl };
      }
      return base;
    }
    if (activeTab === "look") {
      const base = { ...(outfit || {}) };
      for (const [slot, entry] of Object.entries(lookSelectedEntries)) {
        if (entry === null) delete base[slot];
        else if (entry) base[slot] = { itemId: entry.itemId ?? entry._id, imageUrl: entry.imageUrl };
      }
      return base;
    }
    return outfit || {};
  }, [activeTab, outfit, equipped, invSelectedEntries, lookSelectedEntries, invLoaded]);

  useEffect(() => { setBioDraft(bio); }, [bio]);

  useEffect(() => {
    if (!targetUserId) return;
    fetchUserStatus(targetUserId).then(setUserStatus).catch(() => {});
  }, [targetUserId]);

  useEffect(() => {
    if (!socket?.socket) return;
    const onFriendStatus = (payload) => {
      if (String(payload.userId) === String(targetUserId))
        setUserStatus(prev => ({ ...prev, ...payload }));
    };
    const onUserStatus = (payload) => {
      if (isSelfView) setUserStatus(prev => ({ ...prev, ...payload }));
    };
    socket.socket.on("friend:status", onFriendStatus);
    socket.socket.on("user:status",   onUserStatus);
    return () => {
      socket.socket.off("friend:status", onFriendStatus);
      socket.socket.off("user:status",   onUserStatus);
    };
  }, [socket, targetUserId, isSelfView]);

  useEffect(() => {
    if (!statusPickerOpen) return;
    const handler = (e) => {
      if (!statusPickerRef.current?.contains(e.target) && !statusDropdownRef.current?.contains(e.target))
        setStatusPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusPickerOpen]);

  useEffect(() => {
    if (!targetUserId) { setViewLoaded(true); return; }
    setViewLoaded(false);
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

  useEffect(() => { zoomIndexRef.current = zoomIndex; }, [zoomIndex]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const rawX = panAtDrag.current.x + (e.clientX - dragStart.current.x);
      const rawY = panAtDrag.current.y + (e.clientY - dragStart.current.y);
      const viewport = dragLayerRef.current?.parentElement;
      const limitX = viewport ? viewport.clientWidth * 0.5 : Infinity;
      const limitY = viewport ? viewport.clientHeight * 0.5 : Infinity;
      const x = Math.max(-limitX, Math.min(limitX, rawX));
      const y = Math.max(-limitY, Math.min(limitY, rawY));
      panCurrentRef.current = { x, y };
      if (dragLayerRef.current) {
        dragLayerRef.current.style.transform =
          `translate(${x}px, ${y}px) scale(${ZOOM_LEVELS[zoomIndexRef.current]})`;
      }
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setPanX(panCurrentRef.current.x);
      setPanY(panCurrentRef.current.y);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleChangeStatus = async (newStatus) => {
    if (statusChanging) return;
    setStatusChanging(true);
    setStatusPickerOpen(false);
    try {
      const result = await updatePresence(newStatus);
      setUserStatus(result);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusChanging(false);
    }
  };

  const turnLeft = useCallback(() => setPoseIndex(p => (p === 0 ? POSE_COUNT - 1 : p - 1)), [POSE_COUNT]);
  const turnRight = useCallback(() => setPoseIndex(p => (p + 1) % POSE_COUNT), [POSE_COUNT]);
  const zoomOut = useCallback(() => setZoomIndex(z => Math.max(0, z - 1)), []);
  const zoomIn = useCallback(() => setZoomIndex(z => Math.min(ZOOM_LEVELS.length - 1, z + 1)), []);

  const onViewportMouseDown = useCallback((e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panAtDrag.current = { x: panX, y: panY };
    panCurrentRef.current = { x: panX, y: panY };
    e.preventDefault();
  }, [panX, panY]);

  const handleSaveView = useCallback(async () => {
    if (viewSaving) return;
    setViewSaving(true);
    try {
      await saveProfileView({ poseIndex, zoomIndex, panX, panY });
      setHasLockedView(true);
      invalidateProfileViewCache(targetUserId);
    } catch (err) {
      console.error("Failed to save view:", err);
    } finally {
      setViewSaving(false);
    }
  }, [viewSaving, poseIndex, zoomIndex, panX, panY, targetUserId]);

  const handleUnlockView = useCallback(async () => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      await clearProfileView();
      setHasLockedView(false);
      invalidateProfileViewCache(targetUserId);
    } catch (err) {
      console.error("Failed to unlock view:", err);
    } finally {
      setUnlocking(false);
    }
  }, [unlocking, targetUserId]);

  const loadSm = useCallback(async () => {
    if (!currentUserId) { setSmState(null); return; }
    try {
      const data = await fetchSoulMateState(targetUserId || null);
      smStateCache.set(targetUserId ?? "self", data);
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


  // Look tab: reset/init selections on tab enter; reinit once inventory loads
  useEffect(() => {
    if (activeTab !== "look") return;
    if (!invLoaded) { setLookSelectedEntries({}); return; }
    const initial = {};
    for (const feat of LOOK_FEATURES) {
      const itemId = equipped?.[feat.key];
      if (itemId) {
        const eStr = itemId.toString();
        const item = invItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
        if (item) initial[feat.key] = item;
      }
    }
    setLookSelectedEntries(initial);
  }, [activeTab, invLoaded]); // eslint-disable-line react-hooks/exhaustive-deps


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

  const handleSelectTheme = useCallback((idx) => {
    setThemeIdx(idx);
    const name = PALETTES[idx].name;
    try { localStorage.setItem("fv_theme", name); } catch { /* ignore */ }
    saveTheme(name).catch(() => {});
  }, [targetUserId]);

  // ── Sticker guestbook: initial load ────────────────────────────────────
  const loadGbStickers = useCallback(async () => {
    if (!targetUserId) return;
    setGbStickersLoading(true);
    try {
      const data = await fetchGuestbookStickers(targetUserId);
      setGbStickers(data.stickers || []);
    } catch {
      setGbStickers([]);
    } finally {
      setGbStickersLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => { loadGbStickers(); }, [loadGbStickers]);

  // ── Guestbook messages ───────────────────────────────────────────────────
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

  // ── Sticker guestbook: realtime socket room ─────────────────────────────
  useEffect(() => {
    if (!socket || !gbOpen || !targetUserId) return;

    socket.joinGuestbook(targetUserId);

    const handleStickerAdded = (sticker) => {
      setGbStickers(prev => {
        if (prev.some(s => s.id === sticker.id)) return prev;
        return [...prev, sticker];
      });
      canvasRef.current?.addStickerExternal(sticker);
    };

    const handleStickerDeleted = ({ stickerId }) => {
      setGbStickers(prev => prev.filter(s => s.id !== stickerId));
      canvasRef.current?.removeStickerExternal(stickerId);
    };

    socket.onGuestbookStickerAdded(handleStickerAdded);
    socket.onGuestbookStickerDeleted(handleStickerDeleted);

    return () => {
      socket.leaveGuestbook(targetUserId);
      socket.off("guestbook:stickerAdded", handleStickerAdded);
      socket.off("guestbook:stickerDeleted", handleStickerDeleted);
    };
  }, [gbOpen, targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMailLists = useCallback(async () => {
    if (!isSelfView) return;
    setMailLoading(true);
    try {
      const convos = await fetchConversations();
      setMailConversations(convos);
      convos.forEach((c) => {
        fetchThread(c.threadId, { limit: 20 }).then((data) => {
          setMailThreadCache((prev) => ({ ...prev, [c.threadId]: data }));
        }).catch(() => {});
      });
    } catch { /* ignore */ }
    finally { setMailLoading(false); setMailListsLoaded(true); }
  }, [isSelfView]);

  useEffect(() => {
    if (activeTab === "mail" && !mailListsLoaded) loadMailLists();
    if (activeTab !== "mail") { setMailThread(null); setMailReplyBody(""); }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openMailThread = useCallback(async (threadId) => {
    const cached = mailThreadCache[threadId];
    if (cached) {
      setMailThread(cached);
      setMailReplyBody("");
      setMailReplyError(null);
      setMailConversations(prev => prev.map(c => c.threadId === threadId ? { ...c, unreadCount: 0 } : c));
      markThreadRead(threadId).then(() => onUnreadChange?.()).catch(() => {});
      return;
    }
    setMailThreadLoading(true);
    setMailThread(null);
    try {
      const data = await fetchThread(threadId, { limit: 20 });
      setMailThread(data);
      setMailThreadCache((prev) => ({ ...prev, [threadId]: data }));
      setMailReplyBody("");
      setMailReplyError(null);
      setMailConversations(prev => prev.map(c => c.threadId === threadId ? { ...c, unreadCount: 0 } : c));
      markThreadRead(threadId).then(() => onUnreadChange?.()).catch(() => {});
    } catch { /* ignore */ }
    finally { setMailThreadLoading(false); }
  }, [mailThreadCache, onUnreadChange]);

  const handleMailReply = useCallback(async () => {
    if (!mailReplyBody.trim() || mailReplySending || !mailThread) return;
    setMailReplySending(true);
    setMailReplyError(null);
    const bodyText = mailReplyBody.trim();
    try {
      await replyToThread(mailThread.threadId, bodyText);
      setMailReplyBody("");
      const updated = await fetchThread(mailThread.threadId, { limit: 20 });
      setMailThread(updated);
      setMailThreadCache((prev) => ({ ...prev, [mailThread.threadId]: updated }));
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
        const threadData = await fetchThread(created.threadId, { limit: 20 });
        setMailThread(threadData);
        setMailThreadCache((prev) => ({ ...prev, [created.threadId]: threadData }));
        setMailReplyBody("");
        setMailReplyError(null);
        markThreadRead(created.threadId).then(() => onUnreadChange?.()).catch(() => {});
      } catch { /* ignore */ }
      finally { setMailThreadLoading(false); }
    }
  }, [onUnreadChange]);

  const handleLoadMoreMessages = useCallback(async (threadId, beforeTimestamp) => {
    try {
      const older = await fetchThread(threadId, { limit: 20, before: beforeTimestamp });
      setMailThread((prev) => {
        if (!prev || prev.threadId !== threadId) return prev;
        return { ...prev, messages: [...older.messages, ...prev.messages], hasMore: older.hasMore };
      });
    } catch { /* ignore */ }
  }, []);

  const loadFriendsData = useCallback(async () => {
    if (!isSelfView) return;
    setFriendsLoading(true);
    try {
      const data = await fetchFriends();
      setFriendsData(data);
      setFriendsLoaded(true);
    } catch {
      setFriendsData({ friends: [], received: [], sent: [] });
    } finally {
      setFriendsLoading(false);
    }
  }, [isSelfView]);

  useEffect(() => {
    if (activeTab !== "friends" || friendsLoaded) return;
    loadFriendsData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if ((activeTab !== "inventory" && activeTab !== "look") || invLoaded) return;
    setInvLoading(true);
    fetchInventory()
      .then(data => {
        const loadedItems = data.items || [];
        setInvItems(loadedItems);
        const initial = {};
        for (const [slotKey, itemId] of Object.entries(equipped || {})) {
          const eStr = itemId?.toString();
          const entry = loadedItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
          if (entry) initial[slotKey] = entry;
        }
        setInvSelectedEntries(initial);
        setInvLoaded(true);
      })
      .catch(() => {})
      .finally(() => setInvLoading(false));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!invLoaded || activeTab !== "inventory") return;
    const initial = {};
    for (const [slotKey, itemId] of Object.entries(equipped || {})) {
      const eStr = itemId?.toString();
      const entry = invItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
      if (entry) initial[slotKey] = entry;
    }
    setInvSelectedEntries(initial);
  }, [activeTab, equipped, outfit]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Sticker placement ───────────────────────────────────────────────────
  const handleGbStickerSelect = (assetId) => {
    setGbPlacingAssetId(assetId);
    canvasRef.current?.startPlacement(assetId);
  };

  const handleGbConfirm = (payload) => {
    if (!payload || !targetUserId || !socket) return;
    socket.sendGuestbookSticker({ profileUserId: targetUserId, ...payload });
    setGbPlacingAssetId(null);
  };

  const handleGbCancel = () => {
    canvasRef.current?.cancelPlacement();
    setGbPlacingAssetId(null);
  };

  const handleGbDeleteConfirm = (stickerId) => {
    if (!socket) return;
    socket.deleteGuestbookSticker(stickerId);
    setGbDeleteTarget(null);
  };

  // ── Message handlers ────────────────────────────────────────────────────
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
      setGbComments(prev => prev.filter(c => (c._id ?? c.id) !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const lookSelectEntry = (featureKey, entry) => {
    setLookSelectedEntries(prev => ({ ...prev, [featureKey]: entry || null }));
  };

  const lookHasChanges = LOOK_FEATURES.some(feat => {
    const entry = lookSelectedEntries[feat.key];
    if (entry === undefined) return false;
    const equippedId = equipped?.[feat.key];
    if (entry === null) return !!equippedId;
    if (!equippedId) return true;
    const eStr = equippedId.toString();
    return eStr !== entry._id?.toString() && eStr !== entry.itemId?.toString();
  });

  const lookHandleApply = () => {
    const equippedSlots = {};
    const clearSlots = [];
    for (const feat of LOOK_FEATURES) {
      const entry = lookSelectedEntries[feat.key];
      if (entry) equippedSlots[feat.key] = entry;
      else if (entry === null) clearSlots.push(feat.key);
    }
    onApplyLookBatch?.(equippedSlots, clearSlots);
  };

  const lookHandleReset = () => {
    const initial = {};
    for (const feat of LOOK_FEATURES) {
      const itemId = equipped?.[feat.key];
      if (itemId) {
        const eStr = itemId.toString();
        const item = invItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
        if (item) initial[feat.key] = item;
      }
    }
    setLookSelectedEntries(initial);
  };

  const lookHandleRemoveAll = () => {
    const cleared = {};
    for (const feat of LOOK_FEATURES) cleared[feat.key] = null;
    setLookSelectedEntries(cleared);
  };

  const invGoCategories = () => { setInvView("categories"); setInvCategory(null); setInvSubcategory(null); };
  const invGoToCategory = cat => { setInvCategory(cat); setInvSubcategory(null); setInvView("items"); };
  const invGoToSubcategory = (cat, sub) => { setInvCategory(cat); setInvSubcategory(sub); setInvView("items"); };
  const invGoToRecent = () => { setInvView("recentlyAdded"); setInvCategory(null); setInvSubcategory(null); };
  const invGoToEquipped = () => { setInvView("equipped"); setInvCategory(null); setInvSubcategory(null); };

  const handleInvHover = useCallback((entry) => {
    const slotKey = getSlotKey(entry.category, entry.subcategory);
    const previewOutfit = {
      ...(outfit || {}),
      [slotKey]: { itemId: entry.itemId ?? entry._id, imageUrl: entry.imageUrl },
    };
    avatarCompositor.compositeIdle(gender || "female", previewOutfit).catch(() => {});
  }, [outfit, gender]);

  const invIsSelected = entry =>
    invSelectedEntries[getSlotKey(entry.category, entry.subcategory)]?._id?.toString() === entry._id?.toString();

  const invCanUse = entry => {
    if (entry.currency === "gems") return true;
    if (!entry.levelRequirement) return true;
    return (level ?? 1) >= entry.levelRequirement;
  };

  const invToggleEntry = entry => {
    const slotKey = getSlotKey(entry.category, entry.subcategory);
    if (invIsSelected(entry)) {
      setInvSelectedEntries(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
    } else {
      const conflictSlots = getConflictSlots(entry.category, invSelectedEntries);
      setInvSelectedEntries(prev => {
        const n = { ...prev };
        for (const slot of conflictSlots) delete n[slot];
        n[slotKey] = entry;
        return n;
      });
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
  };

  const invHandleNude = () => {
    setInvSelectedEntries({});
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
        const slotKey = getSlotKey(entry.category, entry.subcategory);
        setInvSelectedEntries(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
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
        <ProfileWrapper onClick={(e) => e.stopPropagation()} style={paletteToVars(PALETTES[themeIdx])}>
          <GlobalCloseBtn onClick={onClose}>&times;</GlobalCloseBtn>

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
                      <SidebarIcon $active={activeTab === "profile"}>♟</SidebarIcon>
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
                      <SidebarIcon $active={activeTab === "look"}>◎</SidebarIcon>
                      <SidebarLabel $active={activeTab === "look"}>Look</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "friends"} onClick={() => setActiveTab("friends")}>
                      <SidebarIcon $active={activeTab === "friends"}>⁂</SidebarIcon>
                      <SidebarLabel $active={activeTab === "friends"}>Friends</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
                      <SidebarIcon $active={activeTab === "inventory"}>⌐</SidebarIcon>
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
                    <SidebarBtn $active={activeTab === "themes"} onClick={() => setActiveTab("themes")}>
                      <SidebarIcon $active={activeTab === "themes"}>◑</SidebarIcon>
                      <SidebarLabel $active={activeTab === "themes"}>Themes</SidebarLabel>
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
          </Sidebar>

          {/* ── Avatar Stage ── */}
          <AvatarStageCol>
            <StageContainer>
              <AvatarViewport
                onMouseDown={onViewportMouseDown}
                style={{ cursor: "grab" }}
              >
                <div
                  ref={dragLayerRef}
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `translate(${panX}px, ${panY}px) scale(${ZOOM_LEVELS[zoomIndex]})`,
                    transformOrigin: "top center",
                    visibility: viewLoaded ? "visible" : "hidden",
                  }}
                >
                  <AvatarCanvas
                    gender={gender || "female"}
                    outfit={displayOutfit}
                    poseIndex={poseIndex}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </AvatarViewport>
            </StageContainer>

            <Controls>
              <ArrowBtn onClick={zoomOut} disabled={zoomIndex === 0}>−</ArrowBtn>
              <ArrowBtn onClick={turnRight}>&larr;</ArrowBtn>
              <ArrowBtn onClick={turnLeft}>&rarr;</ArrowBtn>
              <ArrowBtn onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1}>+</ArrowBtn>
              {isSelfView && (hasLockedView ? (
                <ArrowBtn onClick={handleUnlockView} disabled={unlocking} title="Unlock view">🔓</ArrowBtn>
              ) : (
                <ArrowBtn onClick={handleSaveView} disabled={viewSaving} title="Lock view">🔒</ArrowBtn>
              ))}
            </Controls>

            {isSelfView && (activeTab === "inventory" || activeTab === "look") ? (
              <InvActionBar>
                <InvNudeBtn onClick={activeTab === "look" ? lookHandleRemoveAll : invHandleNude}>Remove All</InvNudeBtn>
                <InvResetBtn onClick={activeTab === "look" ? lookHandleReset : invHandleReset}>Reset</InvResetBtn>
                <InvApplyBtn
                  onClick={activeTab === "look" ? lookHandleApply : invHandleApply}
                  disabled={activeTab === "look" ? !lookHasChanges : !invHasChanges}
                >Apply</InvApplyBtn>
              </InvActionBar>
            ) : (
              <StatusCard>
                <StatusCardTop>
                  {isSelfView ? (
                    <StatusPickerWrap ref={statusPickerRef}>
                      <StatusClickTarget
                        onClick={() => { if (!statusChanging) setStatusPickerOpen(p => !p); }}
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
                                <StatusOption key={key} $active={userStatus?.manualStatus === key} onClick={() => handleChangeStatus(key)}>
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
                    <span style={{ visibility: userStatus ? "visible" : "hidden", display: "flex", alignItems: "center", gap: 5 }}>
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

          <div style={{ display: activeTab === "profile" ? "contents" : "none" }}>
            <ProfileTab
              onOpenProfile={onOpenProfile}
              playerName={playerName}
              bio={bio}
              onSaveBio={onSaveBio}
              editingBio={editingBio}
              setEditingBio={setEditingBio}
              bioDraft={bioDraft}
              setBioDraft={setBioDraft}
              bioSaving={bioSaving}
              setBioSaving={setBioSaving}
              bioError={bioError}
              setBioError={setBioError}
              textareaRef={textareaRef}
              isSelfView={isSelfView}
              smState={smState}
              smBusy={smBusy}
              smError={smError}
              smSendRequest={smSendRequest}
              smAccept={smAccept}
              smDecline={smDecline}
              smCancel={smCancel}
              smRemove={smRemove}
              targetUserId={targetUserId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              selectedBadge={selectedBadge}
              handleBadgeClick={handleBadgeClick}
              badgesExpanded={badgesExpanded}
              setBadgesExpanded={setBadgesExpanded}
              badgeSaving={badgeSaving}
              showcaseItems={showcaseItems}
              gbOpen={gbOpen}
              setGbOpen={setGbOpen}
              gbStickers={gbStickers}
              gbStickersLoading={gbStickersLoading}
              gbPlacingAssetId={gbPlacingAssetId}
              setGbPlacingAssetId={setGbPlacingAssetId}
              gbDeleteTarget={gbDeleteTarget}
              setGbDeleteTarget={setGbDeleteTarget}
              canvasRef={canvasRef}
              onGbStickerSelect={handleGbStickerSelect}
              onGbConfirm={handleGbConfirm}
              onGbCancel={handleGbCancel}
              onGbDeleteConfirm={handleGbDeleteConfirm}
              gbComments={gbComments}
              gbLoading={gbLoading}
              gbInput={gbInput}
              setGbInput={setGbInput}
              gbSubmitting={gbSubmitting}
              handleSubmitComment={handleSubmitComment}
              handleDeleteComment={handleDeleteComment}
            />
          </div>

          {isSelfView && (
            <div style={{ display: activeTab === "mail" ? "contents" : "none" }}>
              <MailTab
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
                onLoadMore={handleLoadMoreMessages}
                socket={socket}
                onOpenProfile={onOpenProfile}
              />
            </div>
          )}

          {isSelfView && (
            <div style={{ display: activeTab === "friends" ? "contents" : "none" }}>
              <FriendsTab
                friendsTab={friendsTab}
                setFriendsTab={setFriendsTab}
                friendsData={friendsData}
                friendsLoading={friendsLoading}
                friendsSearch={friendsSearch}
                setFriendsSearch={setFriendsSearch}
                onRefresh={loadFriendsData}
                acceptFriend={acceptFriend}
                declineFriend={declineFriend}
                socket={socket}
                onOpenProfile={onOpenProfile}
              />
            </div>
          )}

          {isSelfView && (
            <div style={{ display: activeTab === "look" ? "contents" : "none" }}>
              <LookTab
                invItems={invItems}
                invLoading={invLoading}
                lookSelectedEntries={lookSelectedEntries}
                onSelectItem={lookSelectEntry}
              />
            </div>
          )}

          {isSelfView && (
            <div style={{ display: activeTab === "wishlist" ? "contents" : "none" }}>
              <WishlistTab
                items={wishlistItems}
                loading={wishlistLoading}
                onRemove={handleWishlistRemove}
              />
            </div>
          )}

          {isSelfView && (
            <div style={{ display: activeTab === "themes" ? "contents" : "none" }}>
              <ThemesTab themeIdx={themeIdx} setThemeIdx={handleSelectTheme} />
            </div>
          )}

          {isSelfView && (
            <div style={{ display: activeTab === "inventory" ? "contents" : "none" }}>
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
                  onHoverItem={handleInvHover}
                />
                <InvBreadcrumbsBar crumbs={invCrumbs} />
              </HubPanelContainer>
            </div>
          )}

        </ProfileWrapper>
        </ProfileOuter>
      </Overlay>
    </>
  );
}
