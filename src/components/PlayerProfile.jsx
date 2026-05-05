import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
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
  fetchInbox,
  fetchSent,
  fetchThread,
  markThreadRead,
  replyToThread,
} from "../api/mail";
import PlayerThumbnail from "./PlayerThumbnail";
import ComposeMailModal from "./ComposeMailModal";

const FRAME_W = 510;
const FRAME_H = 900;
const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6, 1.8];
const POSE_ORDER = [0, 4, 5, 3, 2, 1];
const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];
const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];
const BADGES = ["diamond", "flame", "medal", "paint", "verified"];
const BADGE_RARITY = { diamond: "legendary", flame: "legendary", medal: "rare", paint: "rare", verified: "common" };
const BIO_MAX = 150;
const SHOWCASE_SLOTS = 5;
const COMMENT_MAX = 100;

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
  onOpenStats = null,
  onOpenWishlist = null,
  onOpenMarketplace = null,
}) {
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  const isSelfView = !!(
    currentUserId && targetUserId &&
    String(currentUserId) === String(targetUserId)
  );

  const [poseIndex, setPoseIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);
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

  const [mailTab, setMailTab] = useState("inbox");
  const [mailInbox, setMailInbox] = useState([]);
  const [mailSent, setMailSent] = useState([]);
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

  useEffect(() => { setBioDraft(bio); }, [bio]);

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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = gender === "male"
      ? "/assets/character-bases/men-test.png"
      : "/assets/character-bases/females_new.png";
    img.onload = () => setBaseImg(img);
  }, [gender]);

  useEffect(() => {
    if (!outfit) { setLayerImages([]); return; }
    const entries = LAYER_ORDER
      .filter((cat) => outfit[cat]?.imageUrl)
      .map((cat) => ({ category: cat, url: outfit[cat].imageUrl }));
    let cancelled = false;
    Promise.all(
      entries.map(({ category, url }) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => resolve({ category, img });
          img.onerror = () => resolve(null);
        })
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
    for (const { img } of layerImages) {
      const layerCols = Math.floor(img.width / FRAME_W);
      const { sx: lx, sy: ly } = extractFrame(img, frameIndex, layerCols);
      ctx.drawImage(img, lx, ly, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
    }
  }, [baseImg, layerImages, poseIndex]);

  useEffect(() => { draw(); }, [draw]);

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
      const [inboxData, sentData] = await Promise.all([fetchInbox(), fetchSent()]);
      setMailInbox(inboxData);
      setMailSent(sentData);
    } catch { /* ignore */ }
    finally { setMailLoading(false); setMailListsLoaded(true); }
  }, [isSelfView]);

  useEffect(() => {
    if (activeTab === "mail") loadMailLists();
    if (activeTab !== "mail") { setMailThread(null); setMailReplyBody(""); }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const openMailThread = useCallback(async (threadId) => {
    setMailThreadLoading(true);
    try {
      const data = await fetchThread(threadId);
      setMailThread(data);
      setMailReplyBody("");
      setMailReplyError(null);
      // Zero out this thread's unread count locally — no full list reload
      setMailInbox(prev => prev.map(t => t.threadId === threadId ? { ...t, unreadCount: 0 } : t));
      setMailSent(prev => prev.map(t => t.threadId === threadId ? { ...t, unreadCount: 0 } : t));
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
      // Update the preview in the thread list without reloading everything
      const newLast = { isFromMe: true, body: bodyText, createdAt: new Date().toISOString() };
      setMailInbox(prev => prev.map(t => t.threadId === mailThread.threadId ? { ...t, lastMessage: newLast } : t));
      setMailSent(prev => prev.map(t => t.threadId === mailThread.threadId ? { ...t, lastMessage: newLast } : t));
    } catch (err) {
      setMailReplyError(err.message || "Failed to send.");
    } finally {
      setMailReplySending(false);
    }
  }, [mailReplyBody, mailReplySending, mailThread]);

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
        <ProfileWrapper onClick={(e) => e.stopPropagation()}>
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
                      <SidebarIcon $active={activeTab === "profile"}>◈</SidebarIcon>
                      <SidebarLabel $active={activeTab === "profile"}>Profile</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn $active={activeTab === "mail"} onClick={() => setActiveTab("mail")}>
                      <SidebarIcon $active={activeTab === "mail"}>✉</SidebarIcon>
                      <SidebarLabel $active={activeTab === "mail"}>Mail</SidebarLabel>
                      {(mailListsLoaded
                        ? mailInbox.reduce((s, t) => s + (t.unreadCount || 0), 0)
                        : unreadMailCount) > 0 && (
                        <SidebarNotifDot>
                          {mailListsLoaded
                            ? mailInbox.reduce((s, t) => s + (t.unreadCount || 0), 0)
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
                    <SidebarBtn onClick={() => { onClose(); onOpenStats?.(); }}>
                      <SidebarIcon>◉</SidebarIcon>
                      <SidebarLabel>Stats</SidebarLabel>
                    </SidebarBtn>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarBtn onClick={() => { onClose(); onOpenWishlist?.(); }}>
                      <SidebarIcon>☆</SidebarIcon>
                      <SidebarLabel>Wishlist</SidebarLabel>
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
              <AvatarViewport>
                <AvatarCanvas
                  ref={canvasRef}
                  width={FRAME_W}
                  height={FRAME_H}
                  style={{
                    transform: `scale(${ZOOM_LEVELS[zoomIndex]})`,
                    transformOrigin: "top center",
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
            </Controls>

            <StatusCard>
              <StatusCardTop>
                <OnlineDot />
                <OnlineLabel>Online</OnlineLabel>
                <StatusSep>·</StatusSep>
                <StatusLoc>Neclis Plaza</StatusLoc>
              </StatusCardTop>
              <StatusText>"living in a dream sequence ✨"</StatusText>
            </StatusCard>

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
              mailTab={mailTab}
              setMailTab={setMailTab}
              mailInbox={mailInbox}
              mailSent={mailSent}
              mailLoading={mailLoading}
              mailThread={mailThread}
              mailThreadLoading={mailThreadLoading}
              mailReplyBody={mailReplyBody}
              setMailReplyBody={setMailReplyBody}
              mailReplySending={mailReplySending}
              mailReplyError={mailReplyError}
              openMailThread={openMailThread}
              handleMailReply={handleMailReply}
              onBack={() => setMailThread(null)}
              setComposing={setComposing}
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

        </ProfileWrapper>
      </Overlay>
    </>
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
  mailTab, setMailTab, mailInbox, mailSent, mailLoading,
  mailThread, mailThreadLoading, mailReplyBody, setMailReplyBody,
  mailReplySending, mailReplyError, openMailThread, handleMailReply,
  onBack, setComposing,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (mailThread) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mailThread?.messages?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentList = mailTab === "inbox" ? mailInbox : mailSent;
  const inboxUnread = mailInbox.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <HubPanelContainer>
      <MailListCol>
        <PanelHeaderRow>
          <PanelTitle>✉ Mail</PanelTitle>
          <NewMailBtn onClick={() => setComposing(true)}>+ New</NewMailBtn>
        </PanelHeaderRow>
        <PanelTabs>
          <PanelTab $active={mailTab === "inbox"} onClick={() => setMailTab("inbox")}>
            Inbox
            {inboxUnread > 0 && <TabUnreadBadge>{inboxUnread > 99 ? "99+" : inboxUnread}</TabUnreadBadge>}
          </PanelTab>
          <PanelTab $active={mailTab === "sent"} onClick={() => setMailTab("sent")}>Sent</PanelTab>
        </PanelTabs>
        <MailThreadList>
          {mailLoading ? (
            <PanelEmpty>Loading…</PanelEmpty>
          ) : currentList.length === 0 ? (
            <PanelEmpty>{mailTab === "inbox" ? "Your inbox is empty." : "No sent mail."}</PanelEmpty>
          ) : (
            currentList.map((t) => (
              <MailThreadRow
                key={t.threadId}
                $unread={t.unreadCount > 0}
                $active={mailThread?.threadId === t.threadId}
                onClick={() => openMailThread(t.threadId)}
              >
                <MailThreadThumb>
                  <PlayerThumbnail playerName={t.otherParticipant.name} size={38} />
                  {t.unreadCount > 0 && <MailUnreadDot />}
                </MailThreadThumb>
                <MailThreadMeta>
                  <MailThreadMetaTop>
                    <MailThreadName $unread={t.unreadCount > 0}>{t.otherParticipant.name}</MailThreadName>
                    <MailThreadTime>{formatRelativeTime(t.lastMessage.createdAt)}</MailThreadTime>
                  </MailThreadMetaTop>
                  <MailThreadSubject $unread={t.unreadCount > 0}>{t.subject}</MailThreadSubject>
                  <MailThreadPreview>
                    {t.lastMessage.isFromMe ? "You: " : ""}{t.lastMessage.body}
                  </MailThreadPreview>
                </MailThreadMeta>
                {t.unreadCount > 0 && <MailUnreadBadge>{t.unreadCount}</MailUnreadBadge>}
              </MailThreadRow>
            ))
          )}
        </MailThreadList>
      </MailListCol>

      <MailDetailCol>
        {!mailThread ? (
          <MailPlaceholder>
            <MailPlaceholderIcon>✉</MailPlaceholderIcon>
            <MailPlaceholderText>Select a conversation to read</MailPlaceholderText>
          </MailPlaceholder>
        ) : mailThreadLoading ? (
          <MailPlaceholder><MailPlaceholderText>Loading…</MailPlaceholderText></MailPlaceholder>
        ) : (
          <>
            <MailDetailHeader>
              <MailBackBtn onClick={onBack}>← Back</MailBackBtn>
              <MailDetailSubject>{mailThread.subject}</MailDetailSubject>
              <MailDetailWith>
                <PlayerThumbnail playerName={mailThread.otherParticipant.name} size={26} />
                <span>{mailThread.otherParticipant.name}</span>
              </MailDetailWith>
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
                  {mailReplySending ? "Sending…" : "Send Reply"}
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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.82);
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
  filter: drop-shadow(0 20px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 1px rgba(124,58,237,0.18));
`;

/* ── Sidebar ── */

const Sidebar = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 6px;
  width: 80px;
  flex-shrink: 0;
  background: rgba(8,5,16,0.97);
  backdrop-filter: blur(28px);
  border-right: 1px solid rgba(255,255,255,0.055);
  border-radius: 14px 0 0 14px;
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
  color: #c084fc;
  text-shadow: 0 0 14px rgba(192,132,252,0.7);
`;

const SidebarLogoText = styled.span`
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 2.5px;
  color: rgba(255,255,255,0.22);
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
  /* padding: 9px 4px 8px; */
  border-radius: 12px;
  cursor: pointer;
  gap: 4px;
  position: relative;
  transition: background 0.2s, box-shadow 0.2s;
  background: ${p => p.$active ? "rgba(124,58,237,0.18)" : "transparent"};
  box-shadow: ${p => p.$active ? "inset 0 0 0 1px rgba(124,58,237,0.4), 0 0 12px rgba(124,58,237,0.1)" : "none"};
  ${p => p.$active && `
    &::before {
      content: '';
      position: absolute;
      right: 0; top: 22%; bottom: 22%;
      width: 2.5px;
      background: #a855f7;
      border-radius: 0 2px 2px 0;
      box-shadow: 0 0 8px #a855f7;
    }
  `}
  &:hover:not(:disabled) {
    background: ${p => p.$danger ? "rgba(255,80,80,0.1)" : p.$active ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.1)"};
  }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

const SidebarIcon = styled.span`
  font-size: 15px;
  color: ${p => p.$active ? "#c084fc" : p.$danger ? "rgba(255,130,130,0.7)" : "rgba(255,255,255,0.32)"};
  line-height: 1;
  transition: color 0.2s, text-shadow 0.2s;
  text-shadow: ${p => p.$active ? "0 0 10px rgba(192,132,252,0.7)" : "none"};
  ${SidebarBtn}:hover:not(:disabled) & { color: #e4d0ff; }
`;

const SidebarLabel = styled.span`
  font-size: 8px;
  font-weight: 700;
  color: ${p => p.$active ? "#c084fc" : "rgba(255,255,255,0.25)"};
  letter-spacing: 0.4px;
  text-transform: uppercase;
  transition: color 0.2s;
  ${SidebarBtn}:hover:not(:disabled) & { color: rgba(255,255,255,0.65); }
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
  border: 1.5px solid rgba(8,5,16,0.97);
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
  width: 260px;
  flex-shrink: 0;
  background: linear-gradient(160deg, rgba(10,6,20,0.97) 0%, rgba(7,4,14,0.94) 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255,255,255,0.055);
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
  color: #c084fc;
  letter-spacing: 0.6px;
  background: rgba(124,58,237,0.1);
  border: 1px solid rgba(124,58,237,0.28);
  padding: 5px 13px;
  border-radius: 20px;
  flex-shrink: 0;
  text-shadow: 0 0 8px rgba(192,132,252,0.5);
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
  background: radial-gradient(ellipse 80% 45% at 50% 38%, rgba(124,58,237,0.1) 0%, transparent 68%);
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
  /* border: 1px solid rgba(124,58,237,0.28); */
  box-shadow: 0 0 22px rgba(124,58,237,0.12), inset 0 0 28px rgba(124,58,237,0.06);
  background: radial-gradient(ellipse at 50% 95%, rgba(124,58,237,0.1) 0%, transparent 55%);
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
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  /* border-radius: 12px; */
  padding: 9px 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
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
  color: #4ade80;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StatusSep = styled.span`color: rgba(255,255,255,0.2); font-size: 11px;`;

const StatusLoc = styled.span`
  font-size: 9.5px;
  color: rgba(255,255,255,0.3);
  font-weight: 500;
`;

const StatusText = styled.div`
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  line-height: 1.4;
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
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.55);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  font-family: inherit;
  &:hover:not(:disabled) {
    background: rgba(124,58,237,0.25);
    border-color: rgba(124,58,237,0.6);
    color: #fff;
    box-shadow: 0 0 10px rgba(124,58,237,0.25);
  }
  &:active:not(:disabled) { transform: scale(0.9); }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
`;

const PoseLabel = styled.span`
  font-size: 8.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.28);
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
  background: linear-gradient(160deg, rgba(12,8,24,0.97) 0%, rgba(8,5,16,0.94) 100%);
  backdrop-filter: blur(24px);
  position: relative;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover {
    background: rgba(255,80,80,0.12);
    border-color: rgba(255,80,80,0.35);
    color: #ff8a8a;
  }
`;

/* Profile Header */

const ProfileHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ProfileEmblem = styled.div`
  width: 50px; height: 50px;
  border-radius: 15px;
  background: linear-gradient(135deg, rgba(124,58,237,0.38), rgba(59,130,246,0.18));
  border: 1px solid rgba(124,58,237,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 22px rgba(124,58,237,0.28);
  flex-shrink: 0;
`;

const EmblemDiamond = styled.span`
  font-size: 24px;
  color: #a78bfa;
  animation: emblemPulse 3s ease-in-out infinite;
  @keyframes emblemPulse {
    0%,100% { text-shadow: 0 0 10px rgba(167,139,250,0.7); }
    50%      { text-shadow: 0 0 22px rgba(167,139,250,1), 0 0 36px rgba(124,58,237,0.5); }
  }
`;

const HeaderTitles = styled.div`display: flex; flex-direction: column; gap: 5px;`;

const PlayerName = styled.h2`
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, #ffffff 0%, #d4b8ff 55%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 10px rgba(168,85,247,0.3));
`;

const PlayerNameMark = styled.span`
  -webkit-text-fill-color: #a855f7;
  text-shadow: 0 0 12px rgba(168,85,247,0.8);
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
  color: #c084fc;
  background: rgba(124,58,237,0.14);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(124,58,237,0.32);
`;

const MetaSep = styled.span`color: rgba(255,255,255,0.2); font-size: 11px;`;

const RankBadgeDiamond = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #93c5fd;
  background: rgba(59,130,246,0.1);
  border: 1px solid rgba(59,130,246,0.35);
  padding: 2px 9px;
  border-radius: 6px;
  text-shadow: 0 0 8px rgba(147,197,253,0.45);
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
  color: #f0eaff;
  line-height: 1;
`;

const ProfileStatLbl = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
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
  color: rgba(255,255,255,0.32);
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

const SectionCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: #9333ea;
  background: rgba(124,58,237,0.14);
  padding: 1px 6px;
  border-radius: 10px;
`;

const SectionEditBtn = styled.button`
  all: unset;
  font-size: 9.5px;
  font-weight: 700;
  color: #7c3aed;
  cursor: pointer;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: color 0.2s;
  &:hover { color: #c084fc; }
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
    if (p.$selected) return "#c4a1ff";
    if (p.$rarity === "legendary") return "rgba(234,179,8,0.38)";
    if (p.$rarity === "rare") return "rgba(59,130,246,0.32)";
    return "rgba(255,255,255,0.08)";
  }};
  background: rgba(255,255,255,0.04);
  cursor: ${p => p.$clickable ? (p.$saving ? "wait" : "pointer") : "default"};
  min-width: 72px;
  position: relative;
  overflow: hidden;
  opacity: ${p => p.$saving ? 0.6 : 1};
  box-shadow: ${p => {
    if (p.$selected) return "0 0 14px rgba(124,58,237,0.55)";
    if (p.$rarity === "legendary") return "0 0 8px rgba(234,179,8,0.22)";
    if (p.$rarity === "rare") return "0 0 7px rgba(59,130,246,0.18)";
    return "none";
  }};
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover {
    transform: ${p => p.$clickable && !p.$saving ? "translateY(-3px) scale(1.05)" : "none"};
    box-shadow: ${p => {
      if (!p.$clickable || p.$saving) return "none";
      if (p.$rarity === "legendary") return "0 0 18px rgba(234,179,8,0.5)";
      if (p.$rarity === "rare") return "0 0 16px rgba(59,130,246,0.45)";
      return "0 0 12px rgba(124,58,237,0.35)";
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
  color: rgba(255,255,255,0.55);
  text-align: center;
`;

const BadgeCardRarity = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${p => {
    if (p.$rarity === "legendary") return "#fbbf24";
    if (p.$rarity === "rare") return "#60a5fa";
    return "rgba(255,255,255,0.25)";
  }};
`;

const BadgeExpandBtn = styled.button`
  all: unset;
  align-self: flex-end;
  font-size: 10px;
  font-weight: 600;
  color: #7b6aaa;
  cursor: pointer;
  padding: 0;
  &:hover { color: #c4a1ff; }
`;

/* Soulmate */

const SoulmateCard = styled.div`
  background: linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(124,58,237,0.1) 100%);
  border: 1px solid rgba(236,72,153,0.22);
  border-radius: 14px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 13px;
  position: relative;
  overflow: hidden;
  flex-wrap: wrap;
  box-shadow: 0 0 16px rgba(236,72,153,0.06), inset 0 0 14px rgba(124,58,237,0.04);
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

const SoulmateName = styled.div`font-size: 15px; font-weight: 800; color: #f0d0ff;`;

const SoulmateMark = styled.span`
  color: #ec4899;
  text-shadow: 0 0 8px rgba(236,72,153,0.8);
`;

const SoulmateDuration = styled.div`
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  margin: 3px 0 6px;
`;

const SoulmateMoodTag = styled.div`
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  color: #c084fc;
  background: rgba(192,132,252,0.1);
  border: 1px solid rgba(192,132,252,0.24);
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
  border: 1px solid rgba(255,255,255,0.07);
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
  border: 1px solid ${p => p.$clickable ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"};
  border-style: ${p => p.$clickable ? "dashed" : "dashed"};
  background: rgba(255,255,255,0.03);
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
  transform-style: preserve-3d;
  &:hover {
    ${p => p.$clickable && `
      border-style: solid;
      border-color: rgba(124,58,237,0.45);
      box-shadow: 0 8px 26px rgba(124,58,237,0.2), 0 0 0 1px rgba(124,58,237,0.15);
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
  color: rgba(255,255,255,0.55);
  text-align: center;
`;

const ShowcaseCardType = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ShowcaseAdd = styled.div`
  font-size: 22px;
  color: rgba(255,255,255,0.12);
  line-height: 1;
  ${ShowcaseCard}:hover & { color: rgba(124,58,237,0.55); }
`;

const ShowcaseCardAddLabel = styled.div`
  font-size: 8px;
  font-weight: 600;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

/* Companion */

const CompanionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.04));
  border: 1px solid rgba(255,255,255,0.07);
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

const CompanionNameText = styled.span`font-size: 14px; font-weight: 800; color: #e4d0ff;`;

const CompanionMoodText = styled.span`font-size: 11px; color: rgba(255,255,255,0.4);`;

const CompanionLevelText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.28);
  letter-spacing: 0.3px;
`;

const CompanionXPWrap = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const XPBarOuter = styled.div`
  height: 5px;
  background: rgba(255,255,255,0.06);
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
  color: rgba(255,255,255,0.25);
  font-weight: 600;
`;

/* ── Right Panel ── */

const RightPanel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 290px;
  flex-shrink: 0;
  background: linear-gradient(160deg, rgba(10,6,20,0.97) 0%, rgba(6,3,14,0.94) 100%);
  backdrop-filter: blur(24px);
  border-left: 1px solid rgba(124,58,237,0.2);
  border-radius: 0 14px 14px 0;
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
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const OrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 17px;
  flex-shrink: 0;
`;

const OrnamentLine = styled.div`flex: 1; height: 1px; background: rgba(255,255,255,0.06);`;

const OrnamentGem = styled.span`font-size: 9px; color: rgba(124,58,237,0.38);`;

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
  color: #7c3aed;
  background: rgba(124,58,237,0.14);
  padding: 1px 7px;
  border-radius: 10px;
`;

const GBToggleArrow = styled.span`
  font-size: 8px;
  color: rgba(255,255,255,0.3);
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
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.065);
  border-radius: 10px;
  transition: border-color 0.18s, background 0.18s;
  &:hover { background: rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.22); }
`;

const GBPreviewAvatarWrap = styled.div`
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  overflow: hidden;
`;

const GBPreviewBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;`;

const GBPreviewMeta = styled.div`display: flex; align-items: center; gap: 6px;`;

const GBPreviewName = styled.span`font-size: 11px; font-weight: 700; color: #c084fc;`;

const GBPreviewTime = styled.span`font-size: 9.5px; color: rgba(255,255,255,0.2);`;

const GBPreviewText = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: rgba(255,255,255,0.45);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const GBEmpty = styled.div`
  font-size: ${p => p.$large ? "13px" : "11.5px"};
  color: rgba(255,255,255,0.22);
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
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  padding: 10px 36px 10px 12px;
  box-sizing: border-box;
  outline: none;
  caret-color: #c084fc;
  &:focus { border-color: rgba(124,58,237,0.5); }
  &::placeholder { color: rgba(255,255,255,0.2); }
`;

const GBInputFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GBCounter = styled.span`
  font-size: 10px;
  color: ${p => p.$warn ? "#e4a060" : "rgba(255,255,255,0.22)"};
`;

/* Shared buttons */

const PrimaryBtn = styled.button`
  background: rgba(124,58,237,0.6);
  border: 1px solid rgba(124,58,237,0.8);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); box-shadow: 0 0 12px rgba(124,58,237,0.4); transform: translateY(-1px); }
  &:active:not(:disabled) { transform: translateY(0); }
`;

const SecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; border-color: rgba(255,255,255,0.2); }
`;

/* Bio editing */

const FormatToolbar = styled.div`display: flex; gap: 4px; margin-bottom: 4px;`;

const FormatBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  width: 26px; height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: rgba(124,58,237,0.3); border-color: #7b2ff7; color: #fff; }
`;

const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
  box-sizing: border-box;
  outline: none;
  caret-color: #c084fc;
  &:focus { border-color: rgba(124,58,237,0.5); }
`;

const BioFooter = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: 6px;`;

const BioCounter = styled.span`font-size: 11px; color: rgba(255,255,255,0.25);`;

const BioActions = styled.div`display: flex; gap: 6px;`;

const Description = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  white-space: pre-wrap;
`;

const EmptyText = styled.span`font-size: 12px; color: rgba(255,255,255,0.2);`;

const BioErrorMsg = styled.div`margin-top: 6px; font-size: 11px; color: #ff7777;`;

/* Soulmate sub-components (action states) */

const SmContent = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`;

const SmEmpty = styled.div`font-size: 12px; color: rgba(255,255,255,0.25);`;

const SmSub = styled.div`
  font-size: 9.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
`;

const SmName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #f0eaff;
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
  border-bottom: 1px solid rgba(255,255,255,0.07);
  &:last-child { border-bottom: none; }
`;

const SmPrimaryBtn = styled.button`
  background: rgba(124,58,237,0.6);
  border: 1px solid rgba(124,58,237,0.8);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); box-shadow: 0 0 10px rgba(124,58,237,0.4); }
`;

const SmSecBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.55);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #fff; }
`;

const SmDangerBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,80,80,0.35);
  color: #ff8a8a;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,80,80,0.14); border-color: rgba(255,80,80,0.6); }
`;

const SmError = styled.div`font-size: 11px; color: #ff7777;`;

/* ── Guest Book Expanded Overlay ── */

const GuestBookOverlay = styled.div`
  position: absolute;
  top: 0; bottom: 0; right: 0;
  left: 30%;
  z-index: 20;
  background: linear-gradient(160deg, rgba(14,8,26,0.99) 0%, rgba(9,5,18,0.99) 100%);
  border-radius: 0 14px 14px 0;
  border: 1px solid rgba(124,58,237,0.32);
  box-shadow: inset 0 0 80px rgba(124,58,237,0.05), -4px 0 24px rgba(0,0,0,0.4);
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
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover { background: rgba(255,80,80,0.12); border-color: rgba(255,80,80,0.35); color: #ff8a8a; }
`;

const GBHeader = styled.div`padding: 22px 24px 0; flex-shrink: 0;`;

const GBTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #e4d0ff;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
`;

const GBSubtitle = styled.p`
  margin: 5px 0 14px;
  font-size: 11px;
  color: rgba(255,255,255,0.25);
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
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.15); border-color: #7b2ff7; color: #fff; }
`;

const GBPinnedBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.15); border-color: #7b2ff7; color: #fff; }
`;

const GBComposeArea = styled.div`
  margin: 0 16px 4px;
  padding: 12px 14px 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  flex-shrink: 0;
`;

const GBComposeRow = styled.div`display: flex; align-items: center; gap: 10px;`;

const GBAvatarPlaceholder = styled.div`
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(124,58,237,0.18);
  border: 2px solid rgba(124,58,237,0.28);
  flex-shrink: 0;
`;

const GBComposeInputWrap = styled.div`flex: 1; position: relative;`;

const GBEmojiBtn = styled.button`
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255,255,255,0.25);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: #c4a1ff; }
`;

const GBPostBtn = styled.button`
  background: #5b21b6;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  transition: background 0.15s, box-shadow 0.15s;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #6d28d9; box-shadow: 0 0 14px rgba(124,58,237,0.4); }
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
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  &:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
`;

const GBOrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  flex-shrink: 0;
`;

const GBDividerLine = styled.div`flex: 1; height: 1px; background: rgba(255,255,255,0.06);`;

const GBDividerGem = styled.span`color: rgba(124,58,237,0.45); font-size: 11px;`;

const GBCommentCard = styled.div`
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  &:hover {
    border-color: rgba(124,58,237,0.28);
    background: rgba(124,58,237,0.04);
    box-shadow: 0 0 14px rgba(124,58,237,0.07);
  }
`;

const GBCommentInner = styled.div`display: flex; gap: 12px; align-items: flex-start;`;

const GBCommentAvatarCol = styled.div`flex-shrink: 0;`;

const GBCommentBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;`;

const GBCommentMeta = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

const GBCommentName = styled.span`font-size: 14px; font-weight: 700; color: #c4a1ff;`;

const GBCommentTime = styled.span`font-size: 11px; color: rgba(255,255,255,0.2);`;

const GBCommentText = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
  line-height: 1.55;
  word-break: break-word;
`;

const GBReactions = styled.div`display: flex; gap: 14px; margin-top: 2px;`;

const GBReactionBtn = styled.button`
  all: unset;
  font-size: 12px;
  color: rgba(255,255,255,0.22);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s, transform 0.15s;
  &:hover { color: #c4a1ff; transform: scale(1.2); }
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
  color: rgba(255,255,255,0.2);
  font-size: 15px;
  cursor: pointer;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #ff7777; background: rgba(255,80,80,0.12); }
`;

const GBMenuDot = styled.button`
  all: unset;
  color: rgba(255,255,255,0.15);
  font-size: 18px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover { color: rgba(255,255,255,0.6); }
`;

const GBOverlayScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.25); border-radius: 2px; }
`;

const GBStatsFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
  background: rgba(0,0,0,0.18);
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
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const GBStatValue = styled.div`font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.8);`;

const GBStatDivider = styled.div`width: 1px; height: 32px; background: rgba(255,255,255,0.06); flex-shrink: 0;`;

const GBLeaveGiftBtn = styled.button`
  margin-left: auto;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.3);
  color: #c4a1ff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.28); border-color: #7b2ff7; color: #fff; }
`;

/* ── Global close button (always visible regardless of tab) ── */

const GlobalCloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 30;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  &:hover {
    background: rgba(255,80,80,0.12);
    border-color: rgba(255,80,80,0.35);
    color: #ff8a8a;
  }
`;

/* ── Hub panel shared container ── */

const HubPanelContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 0 14px 14px 0;
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
  color: #e4d0ff;
  letter-spacing: 0.2px;
`;

const PanelTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 14px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.055);
`;

const PanelTab = styled.button`
  position: relative;
  background: ${p => p.$active ? "rgba(124,58,237,0.22)" : "transparent"};
  border: 1px solid ${p => p.$active ? "rgba(124,58,237,0.45)" : "transparent"};
  color: ${p => p.$active ? "#c084fc" : "rgba(255,255,255,0.35)"};
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
  &:hover { color: #e4d0ff; background: rgba(124,58,237,0.12); }
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
  background: rgba(124,58,237,0.22);
  color: #a78bfa;
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
  color: rgba(255,255,255,0.22);
  text-align: center;
`;

/* ── Mail panel ── */

const MailListCol = styled.div`
  width: 290px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, rgba(10,6,20,0.97) 0%, rgba(7,4,14,0.94) 100%);
  border-right: 1px solid rgba(255,255,255,0.055);
  overflow: hidden;
`;

const NewMailBtn = styled.button`
  background: rgba(124,58,237,0.18);
  border: 1px solid rgba(124,58,237,0.45);
  color: #c084fc;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  &:hover { background: rgba(124,58,237,0.35); border-color: #7c3aed; color: #fff; }
`;

const MailThreadList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 3px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const MailThreadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.$active ? "rgba(124,58,237,0.16)" : p.$unread ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)"};
  border: 1px solid ${p => p.$active ? "rgba(124,58,237,0.42)" : "rgba(255,255,255,0.05)"};
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.28); }
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
  border: 2px solid rgba(10,6,20,0.97);
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
  color: ${p => p.$unread ? "#c4a1ff" : "rgba(255,255,255,0.65)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MailThreadTime = styled.div`
  font-size: 10px;
  color: rgba(255,255,255,0.22);
  flex-shrink: 0;
  white-space: nowrap;
`;

const MailThreadSubject = styled.div`
  font-size: 11px;
  font-weight: ${p => p.$unread ? "600" : "400"};
  color: ${p => p.$unread ? "#f0eaff" : "rgba(255,255,255,0.45)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const MailThreadPreview = styled.div`
  font-size: 10.5px;
  color: rgba(255,255,255,0.22);
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
  background: linear-gradient(160deg, rgba(12,8,24,0.97) 0%, rgba(8,5,16,0.94) 100%);
  border-radius: 0 14px 14px 0;
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
  opacity: 0.1;
  color: #c084fc;
`;

const MailPlaceholderText = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,0.2);
`;

const MailDetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.055);
  flex-shrink: 0;
`;

const MailBackBtn = styled.button`
  all: unset;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: #c084fc; }
`;

const MailDetailSubject = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: #f0eaff;
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const MailDetailWith = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  flex-shrink: 0;
  padding-right: 42px;
`;

const MailMessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
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
  background: ${p => p.$mine ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.07)"};
  border: 1px solid ${p => p.$mine ? "rgba(124,58,237,0.55)" : "rgba(255,255,255,0.1)"};
  border-radius: ${p => p.$mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
  padding: 10px 13px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const MailBubbleBody = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  line-height: 1.5;
  word-break: break-word;
`;

const MailBubbleTime = styled.div`
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  text-align: right;
`;

const MailReplyBox = styled.div`
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(255,255,255,0.055);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MailReplyTextarea = styled.textarea`
  width: 100%;
  resize: none;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: #c084fc;
  &:focus { border-color: rgba(124,58,237,0.5); background: rgba(255,255,255,0.055); }
  &::placeholder { color: rgba(255,255,255,0.2); }
  &:disabled { opacity: 0.5; }
`;

const MailReplyFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MailReplyCounter = styled.div`font-size: 11px; color: rgba(255,255,255,0.22);`;

const MailReplyError = styled.div`font-size: 11px; color: #ff7777;`;

/* ── Friends panel ── */

const FriendsPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 20px 0;
  gap: 14px;
  background: linear-gradient(160deg, rgba(12,8,24,0.97) 0%, rgba(8,5,16,0.94) 100%);
  border-radius: 0 14px 14px 0;
  overflow: hidden;
`;

const FriendsSearchRow = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const FriendsSearchInput = styled.input`
  width: 100%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  padding: 10px 38px 10px 16px;
  box-sizing: border-box;
  outline: none;
  caret-color: #c084fc;
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: rgba(124,58,237,0.5); background: rgba(124,58,237,0.06); }
  &::placeholder { color: rgba(255,255,255,0.2); }
`;

const FriendsSearchIcon = styled.span`
  position: absolute;
  right: 13px; top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.25);
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
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const FriendsGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 2px 2px;
`;

const FriendCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 11px 14px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    background: rgba(124,58,237,0.08);
    border-color: rgba(124,58,237,0.28);
    box-shadow: 0 2px 12px rgba(124,58,237,0.1);
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
  border: 2px solid rgba(12,8,24,0.97);
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
  color: #f0eaff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const FriendCardLocation = styled.div`
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FriendLocationDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: ${p => p.$online ? "#22c55e" : "rgba(255,255,255,0.18)"};
  flex-shrink: 0;
`;

const FriendInviteActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

/* ── Look Panel ── */

const LookPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, rgba(10,6,20,0.97) 0%, rgba(7,4,14,0.94) 100%);
  border-radius: 0 14px 14px 0;
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
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.28); border-radius: 3px; }
`;

const LookGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const LookFeatureCard = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 13px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LookFeatureLabel = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.32);
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
  background: rgba(255,255,255,0.04);
  border: 1px dashed rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  position: relative;
  overflow: hidden;
  &:hover {
    border-style: solid;
    border-color: rgba(124,58,237,0.5);
    background: rgba(124,58,237,0.07);
    box-shadow: 0 0 12px rgba(124,58,237,0.14);
  }
`;

const LookSlotPlus = styled.span`
  font-size: 22px;
  color: rgba(255,255,255,0.12);
  line-height: 1;
  pointer-events: none;
  ${LookSlot}:hover & { color: rgba(124,58,237,0.55); }
`;

const LookSlotSubLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.18);
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
  color: rgba(255,255,255,0.35);
  min-width: 42px;
`;

const LookSlider = styled.input`
  flex: 1;
  accent-color: #a855f7;
  cursor: pointer;
  height: 4px;
`;

const LookSliderValue = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  min-width: 28px;
  text-align: right;
`;
