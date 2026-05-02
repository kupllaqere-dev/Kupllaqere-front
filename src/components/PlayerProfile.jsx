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
  removeFriend,
} from "../api/friends";
import {
  fetchGuestBookComments,
  postGuestBookComment,
  deleteGuestBookComment,
} from "../api/guestbook";
import PlayerThumbnail from "./PlayerThumbnail";
import ComposeMailModal from "./ComposeMailModal";

const FRAME_W = 510;
const FRAME_H = 900;
const ZOOM_LEVELS = [1, 1.2, 1.4, 1.6, 1.8];
const POSE_ORDER = [0, 4, 5, 3, 2, 1];
const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];
const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];
const BADGES = ["diamond", "flame", "medal", "paint", "verified"];
const BIO_MAX = 150;
const SHOWCASE_SLOTS = 5;
const DRAWER_W = 220;
const BIO_DRAWER_W = 320;
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
  onOpenMail = null,
  onOpenInventory = null,
  onOpenAppearance = null,
  onOpenFriends = null,
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

  const [leftOpen, setLeftOpen] = useState(isSelfView);

  const [showcaseItems] = useState(Array(SHOWCASE_SLOTS).fill(null));

  // Guest book state
  const [gbOpen, setGbOpen] = useState(false);
  const [gbComments, setGbComments] = useState([]);
  const [gbLoading, setGbLoading] = useState(false);
  const [gbInput, setGbInput] = useState("");
  const [gbSubmitting, setGbSubmitting] = useState(false);

  useEffect(() => { setBioDraft(bio); }, [bio]);

  // Soul mate
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

  // Friends (other-view)
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

  // Badge
  const handleBadgeClick = async (name) => {
    if (!onSaveBadge || badgeSaving) return;
    const next = selectedBadge === name ? null : name;
    setBadgeSaving(true);
    try { await onSaveBadge(next); }
    catch (err) { console.error("Badge save failed:", err); }
    finally { setBadgeSaving(false); }
  };

  // Avatar canvas
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

  const toggleLeft = () => setLeftOpen((v) => !v);

  const visibleBadges = badgesExpanded ? BADGES : BADGES.slice(0, 6);

  // Guest book
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

  return (
    <>
      {composing && !isSelfView && (
        <ComposeMailModal
          targetId={targetUserId}
          targetName={playerName}
          onClose={() => setComposing(false)}
        />
      )}
      <Overlay onClick={onClose}>
        <ProfileWrapper onClick={(e) => e.stopPropagation()}>

          {/* ── Left Drawer ── */}
          <DrawerShell $side="left">
            <DrawerBody $open={leftOpen} $side="left">
              <DrawerInner $autoWidth>
                {isSelfView ? (
                  <DrawerNav>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenInventory?.(); }}>Inventory</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenMail?.(); }}>Mail</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenAppearance?.(); }}>Appearance</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenFriends?.(); }}>Friends</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenAlbum?.(); }}>Album</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenStats?.(); }}>Stats</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenWishlist?.(); }}>Wishlist</DrawerNavBtn>
                    <DrawerNavBtn onClick={() => { onClose(); onOpenMarketplace?.(); }}>Market</DrawerNavBtn>
                  </DrawerNav>
                ) : (
                  <DrawerNav>
                    <DrawerNavBtn
                      onClick={handleFriendBtn}
                      disabled={friendBusy || friendStatus === null}
                      $danger={friendStatus === "friends"}
                    >
                      {friendBtnLabel()}
                    </DrawerNavBtn>
                    <DrawerNavBtn onClick={() => setComposing(true)}>Mail</DrawerNavBtn>
                    <DrawerNavBtn>Wishlist</DrawerNavBtn>
                    <DrawerNavBtn>Gift</DrawerNavBtn>
                    <DrawerNavBtn>Trade</DrawerNavBtn>
                    <DrawerNavBtn $danger onClick={() => {}}>Report</DrawerNavBtn>
                  </DrawerNav>
                )}
              </DrawerInner>
            </DrawerBody>
          </DrawerShell>

          {/* ── Main Panel ── */}
          <MainPanel $leftOpen={leftOpen}>
            <CloseBtn onClick={onClose}>&times;</CloseBtn>
            <DrawerToggleBtn $side="left" onClick={toggleLeft} title={leftOpen ? "Close" : "Open menu"}>
              {leftOpen ? "‹" : "›"}
            </DrawerToggleBtn>
            <PanelContent>

              {/* Avatar column */}
              <AvatarSide>
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
                <Controls>
                  <ArrowBtn onClick={zoomOut} disabled={zoomIndex === 0}>−</ArrowBtn>
                  <ArrowBtn onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1}>+</ArrowBtn>
                  <ArrowBtn onClick={turnLeft}>&larr;</ArrowBtn>
                  <PoseLabel>{POSE_LABELS[poseIndex]}</PoseLabel>
                  <ArrowBtn onClick={turnRight}>&rarr;</ArrowBtn>
                </Controls>
              </AvatarSide>

              {/* Info column */}
              <InfoSide>
                <PlayerName>{playerName || "Player"}</PlayerName>

                <StatRow>
                  <StatBox>
                    <StatLabel>Level</StatLabel>
                    <StatValue>78</StatValue>
                  </StatBox>
                  <StatBox>
                    <StatLabel>Class</StatLabel>
                    <StatValue $muted>—</StatValue>
                  </StatBox>
                </StatRow>

                {/* Badges */}
                <SectionBlock>
                  <SectionLabel>Badges</SectionLabel>
                  <BadgeGrid>
                    {visibleBadges.map((name) => (
                      <BadgePlaceholder
                        key={name}
                        $selected={selectedBadge === name}
                        $clickable={!!onSaveBadge}
                        $saving={badgeSaving}
                        onClick={() => handleBadgeClick(name)}
                        title={
                          onSaveBadge
                            ? selectedBadge === name ? "Click to unselect" : "Click to display this badge"
                            : name
                        }
                      >
                        <BadgeImg src={`/assets/badges/${name}.png`} alt={name} />
                      </BadgePlaceholder>
                    ))}
                  </BadgeGrid>
                  {BADGES.length > 6 && (
                    <BadgeExpandBtn onClick={() => setBadgesExpanded((v) => !v)}>
                      {badgesExpanded ? "Show less ▲" : "Show all ▼"}
                    </BadgeExpandBtn>
                  )}
                </SectionBlock>

                {/* Soul Mate */}
                <SectionBlock>
                  <SectionLabel>Soul Mate</SectionLabel>
                  <SoulMateBox>
                    {renderSoulMate({
                      smState, isSelfView, targetUserId, currentUserId,
                      smBusy, smError, smSendRequest, smAccept, smDecline, smCancel, smRemove,
                    })}
                  </SoulMateBox>
                </SectionBlock>

                {/* Showcase */}
                <SectionBlock>
                  <SectionLabel>Showcase</SectionLabel>
                  <ShowcaseRow>
                    {showcaseItems.map((item, i) => (
                      <ShowcaseSlot
                        key={i}
                        $clickable={isSelfView}
                        onClick={isSelfView ? () => {} : undefined}
                        title={isSelfView ? "Click to select item" : ""}
                      >
                        {item
                          ? <ShowcaseItemImg src={item.imageUrl} alt={item.name} />
                          : isSelfView
                            ? <ShowcaseAdd>+</ShowcaseAdd>
                            : null}
                      </ShowcaseSlot>
                    ))}
                  </ShowcaseRow>
                </SectionBlock>

                {/* Companion */}
                <SectionBlock>
                  <SectionLabel>Companion</SectionLabel>
                  <CompanionRow>
                    <CompanionImageBox />
                    <CompanionInfo>
                      <StatBox>
                        <StatLabel>Name</StatLabel>
                        <StatValue $muted>—</StatValue>
                      </StatBox>
                      <StatBox>
                        <StatLabel>Level</StatLabel>
                        <StatValue $muted>—</StatValue>
                      </StatBox>
                    </CompanionInfo>
                  </CompanionRow>
                </SectionBlock>
              </InfoSide>
            </PanelContent>
          </MainPanel>

          {/* ── Right Panel (About + Guest Book preview) ── */}
          <RightPanel>
            <DrawerInner $width={BIO_DRAWER_W} $split>

              {/* Top half: About / Bio */}
              <RightSection>
                <BioDrawerHeader>
                  <SectionLabel>About</SectionLabel>
                  {onSaveBio && !editingBio && (
                    <EditBtn onClick={() => { setBioDraft(bio); setBioError(null); setEditingBio(true); }}>
                      Edit
                    </EditBtn>
                  )}
                </BioDrawerHeader>
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
                ) : (
                  bio?.trim()
                    ? <Description dangerouslySetInnerHTML={{ __html: bioToHtml(bio) }} />
                    : <Description><EmptyText>No bio yet.</EmptyText></Description>
                )}
              </RightSection>

              <RightDrawerDivider />

              {/* Bottom half: Guest Book preview */}
              <RightSection $noScroll>
                <GuestBookLabelBtn onClick={() => setGbOpen((v) => !v)} $active={gbOpen}>
                  Guest Book
                  <GBToggleArrow $open={gbOpen}>▲</GBToggleArrow>
                </GuestBookLabelBtn>

                <GBPreviewList>
                  {gbLoading ? (
                    <GBEmpty>Loading…</GBEmpty>
                  ) : gbComments.length === 0 ? (
                    <GBEmpty>No comments yet.</GBEmpty>
                  ) : (
                    gbComments.slice(0, 3).map((c) => (
                      <CommentCard key={c._id}>
                        <CommentSenderTag>
                          <PlayerThumbnail playerName={c.authorName} size={22} />
                          <CommentAuthorName>{c.authorName}</CommentAuthorName>
                        </CommentSenderTag>
                        <CommentMessage>{c.message}</CommentMessage>
                      </CommentCard>
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
                      <PrimaryBtn
                        onClick={handleSubmitComment}
                        disabled={gbSubmitting || !gbInput.trim()}
                      >
                        {gbSubmitting ? "…" : "Post"}
                      </PrimaryBtn>
                    </GBInputFooter>
                  </GBInputArea>
                )}
              </RightSection>

            </DrawerInner>
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
              <GBDividerLine />
              <GBDividerGem>✦</GBDividerGem>
              <GBDividerLine />
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

        </ProfileWrapper>
      </Overlay>
    </>
  );
}

/* ── Soul Mate renderer ── */
function renderSoulMate({ smState, isSelfView, targetUserId, currentUserId, smBusy, smError, smSendRequest, smAccept, smDecline, smCancel, smRemove }) {
  if (!currentUserId) return <SmEmpty>Sign in to use soul mates.</SmEmpty>;
  if (!smState) return <SmEmpty>Loading…</SmEmpty>;

  const { mine, sent, received = [], target, relationship } = smState;

  if (isSelfView || !targetUserId) {
    if (mine) return (
      <SmContent>
        <SmName><PlayerThumbnail playerName={mine.name} />{mine.name}</SmName>
        <SmActions>
          <SmDangerBtn disabled={smBusy} onClick={smRemove}>Break Up</SmDangerBtn>
        </SmActions>
        {smError && <SmError>{smError}</SmError>}
      </SmContent>
    );
    if (received.length > 0) return (
      <SmContent>
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
      </SmContent>
    );
    if (sent) return (
      <SmContent>
        <SmSub>Pending</SmSub>
        <SmName>{sent.name}</SmName>
        <SmActions>
          <SmSecBtn disabled={smBusy} onClick={smCancel}>Cancel</SmSecBtn>
        </SmActions>
        {smError && <SmError>{smError}</SmError>}
      </SmContent>
    );
    return <SmEmpty>No soul mate yet.</SmEmpty>;
  }

  if (relationship === "soulmate") return (
    <SmContent>
      <SmHeart>♥</SmHeart>
      <SmSub>Your Soul Mate</SmSub>
      <SmActions>
        <SmDangerBtn disabled={smBusy} onClick={smRemove}>Break Up</SmDangerBtn>
      </SmActions>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
  if (relationship === "i_sent") return (
    <SmContent>
      <SmSub>Request sent</SmSub>
      <SmActions><SmSecBtn disabled={smBusy} onClick={smCancel}>Cancel</SmSecBtn></SmActions>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
  if (relationship === "they_sent") return (
    <SmContent>
      <SmSub>Wants to be your soul mate</SmSub>
      <SmActions>
        <SmPrimaryBtn disabled={smBusy} onClick={() => smAccept(targetUserId)}>Accept</SmPrimaryBtn>
        <SmSecBtn disabled={smBusy} onClick={() => smDecline(targetUserId)}>Decline</SmSecBtn>
      </SmActions>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
  if (target?.soulMate) return (
    <SmContent>
      <SmSub>Soul mate</SmSub>
      <SmName>{target.soulMate.name}</SmName>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
  if (mine) return (
    <SmContent>
      <SmEmpty>You already have a soul mate.</SmEmpty>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
  return (
    <SmContent>
      <SmPrimaryBtn disabled={smBusy} onClick={smSendRequest}>Send Soul Mate Request</SmPrimaryBtn>
      {smError && <SmError>{smError}</SmError>}
    </SmContent>
  );
}

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  `;

const ProfileWrapper = styled.div`
  position: relative;
  max-height: 92vh;
  height: 92vh;
  display: flex;
  flex-direction: row;
  filter: drop-shadow(0 8px 40px rgba(0,0,0,0.6));
`;

/* ── Drawers ── */

const DrawerShell = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  ${p => p.$side === "left"
    ? "right: 100%;"
    : "left: 100%;"}
  display: flex;
  flex-direction: row;
  align-items: stretch;
`;

const DrawerBody = styled.div`
  ${(p) =>
    p.$side === "left"
      ? `width: fit-content; max-width: ${p.$open ? "400px" : "0"};`
      : `width: ${p.$open ? (p.$width ?? DRAWER_W) : 0}px;`}
  overflow: hidden;
  transition: ${(p) => (p.$side === "left" ? "max-width" : "width")} 0.28s ease;
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
  background: rgba(128, 128, 128, 0.5);
  flex-shrink: 0;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    ${(p) => (p.$side === "left" ? "right: 0;" : "left: 0;")}
    top: 0;
    bottom: 0;
    width: 1px;
    background: #ffffff18;
  }
`;

const DrawerInner = styled.div`
  width: ${p => p.$autoWidth ? "fit-content" : `${p.$width ?? DRAWER_W}px`};
  height: 100%;
  ${p => !p.$split && "padding: 0 16px;"}
  box-sizing: ${p => p.$autoWidth ? "content-box" : "border-box"};
  overflow-y: ${p => p.$split ? "hidden" : "auto"};
  display: flex;
  flex-direction: column;
`;

const DrawerNav = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
  padding: 8px;
`;

const DrawerNavBtn = styled.button`
  flex: 1;
  aspect-ratio: 1;
  align-self: center;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid ${p => p.$danger ? "rgba(255,80,80,0.3)" : "#ffffff18"};
  background: ${p => p.$danger ? "rgba(255,80,80,0.08)" : "rgba(255,255,255,0.04)"};
  color: ${p => p.$danger ? "#ff8a8a" : "#ccc"};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    background: ${p => p.$danger ? "rgba(255,80,80,0.18)" : "rgba(124,58,237,0.2)"};
    border-color: ${p => p.$danger ? "rgba(255,80,80,0.6)" : "#7b2ff7"};
    color: #fff;
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const BioDrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

/* ── Right Drawer sections ── */

const RightSection = styled.div`
  flex: 1;
  min-height: 0;
  padding: 20px 16px;
  overflow-y: ${p => p.$noScroll ? "hidden" : "auto"};
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
`;

const RightDrawerDivider = styled.div`
  height: 1px;
  background: #ffffff15;
  flex-shrink: 0;
`;

const RightPanel = styled.div`
  width: ${BIO_DRAWER_W}px;
  height: 100%;
  flex-shrink: 0;
  background: rgba(128, 128, 128, 0.5);
  border-radius: 0 14px 14px 0;
  overflow: hidden;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #ffffff18;
  }
`;

/* ── Main Panel ── */

const MainPanel = styled.div`
  position: relative;
  background: #49494d;
  border-radius: ${(p) => (p.$leftOpen ? "0" : "14px 0 0 14px")};
  transition: border-radius 0.28s ease;
  padding: 28px 28px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(60vw);
  max-height: 92vh;
  height: 92vh;
  overflow: hidden;
  background: rgba(128, 128, 128, 0.5);
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  z-index: 2;
  &:hover { color: #fff; }
`;

const DrawerToggleBtn = styled.button`
  position: absolute;
  ${p => p.$side === "left" ? "left: 8px;" : "right: 8px;"}
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 52px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #ffffff15;
  border-radius: 6px;
  color: #777;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  &:hover { background: rgba(124,58,237,0.2); border-color: #7b2ff7; color: #fff; }
`;

const PanelContent = styled.div`
  display: flex;
  gap: 24px;
  height: 100%;
  overflow: hidden;
`;

/* ── Avatar ── */

const AvatarSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 40%;
`;

const AvatarViewport = styled.div`
  flex: 1;
  min-height: 0;
  aspect-ratio: ${FRAME_W} / ${FRAME_H};
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #ffffff15;
`;

const AvatarCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const ArrowBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #ffffff22;
  background: rgba(255,255,255,0.05);
  color: #ccc;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover:not(:disabled) { background: rgba(124,58,237,0.3); border-color: #7b2ff7; color: #fff; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PoseLabel = styled.span`
  font-size: 10px;
  color: #888;
  min-width: 70px;
  text-align: center;
`;

/* ── Info Side ── */

const InfoSide = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
`;

const PlayerName = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
`;

const StatRow = styled.div`
  display: flex;
  gap: 10px;
`;

const StatBox = styled.div`
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid #ffffff18;
  border-radius: 10px;
  padding: 8px 12px;
`;

const StatLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.$muted ? "#555" : "#fff"};
`;

const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

/* ── Badges ── */

const BadgeGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const BadgePlaceholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 46px;
  width: 46px;
  border-radius: 12px;
  cursor: ${p => p.$clickable ? (p.$saving ? "wait" : "pointer") : "default"};
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  background: ${p => p.$selected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)"};
  border: 1px solid ${p => p.$selected ? "#c4a1ff" : "#ffffff15"};
  box-shadow: ${p => p.$selected ? "0 0 12px rgba(124,58,237,0.5)" : "none"};
  opacity: ${p => p.$saving ? 0.6 : 1};
  &:hover { transform: ${p => p.$clickable && !p.$saving ? "scale(1.1)" : "none"}; }
`;

const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

const BadgeExpandBtn = styled.button`
  align-self: flex-end;
  background: none;
  border: none;
  color: #7b6aaa;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:hover { color: #c4a1ff; }
`;

/* ── Soul Mate ── */

const SoulMateBox = styled.div`
  background: rgba(124,58,237,0.06);
  border: 1px solid #ffffff18;
  border-radius: 10px;
  padding: 10px 12px;
  min-height: 48px;
  width: 40%;
`;

const SmContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const SmEmpty = styled.div`
  font-size: 12px;
  color: #666;
`;

const SmSub = styled.div`
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
`;

const SmName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SmHeart = styled.div`
  font-size: 16px;
  color: #ff6b9b;
`;

const SmActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
`;

const SmRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #ffffff10;
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
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); }
`;

const SmSecBtn = styled.button`
  background: transparent;
  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; }
`;

const SmDangerBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255,80,80,0.4);
  color: #ff8a8a;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,80,80,0.15); color: #fff; }
`;

const SmError = styled.div`
  font-size: 11px;
  color: #ff7777;
  width: 100%;
`;

/* ── Showcase ── */

const ShowcaseRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ShowcaseSlot = styled.div`
  flex: 1;
  aspect-ratio: 1;
  background: rgba(255,255,255,0.03);
  border: 1px dashed ${p => p.$clickable ? "#ffffff30" : "#ffffff18"};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  transition: border-color 0.15s, background 0.15s;
  &:hover { ${p => p.$clickable && `background: rgba(124,58,237,0.1); border-color: #7b2ff7;`} }
`;

const ShowcaseItemImg = styled.img`
  width: 80%;
  height: 80%;
  object-fit: contain;
`;

const ShowcaseAdd = styled.div`
  font-size: 22px;
  color: #444;
  line-height: 1;
`;

/* ── Companion ── */

const CompanionRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: stretch;
`;

const CompanionImageBox = styled.div`
  height: 100%;
  aspect-ratio:1;
  background: rgba(255,255,255,0.04);
  border: 1px dashed #ffffff22;
  border-radius: 10px;
`;

const CompanionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/* ── Bio Drawer ── */

const EditBtn = styled.button`
  background: none;
  border: none;
  color: #c4a1ff;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 0;
  &:hover { color: #fff; }
`;

const FormatToolbar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
`;

const FormatBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 12px;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  cursor: pointer;
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
  border: 1px solid #ffffff22;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  box-sizing: border-box;
  outline: none;
  &:focus { border-color: #7b2ff7; }
`;

const BioFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
`;

const BioCounter = styled.span`
  font-size: 11px;
  color: #666;
`;

const BioActions = styled.div`
  display: flex;
  gap: 6px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: #bbb;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const EmptyText = styled.span`
  font-size: 12px;
  color: #555;
`;

const BioErrorMsg = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: #ff7777;
`;

const PrimaryBtn = styled.button`
  background: rgba(124,58,237,0.6);
  border: 1px solid rgba(124,58,237,0.8);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124,58,237,0.85); }
`;

const SecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; }
`;

/* ── Guest Book ── */

const GuestBookLabelBtn = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: ${p => p.$active ? "#c4a1ff" : "#888"};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
  &:hover { color: ${p => p.$active ? "#fff" : "#c4a1ff"}; }
`;

const GBToggleArrow = styled.span`
  font-size: 8px;
  transition: transform 0.25s ease;
  transform: ${p => p.$open ? "rotate(0deg)" : "rotate(180deg)"};
  display: inline-block;
`;

const GBPreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const GBEmpty = styled.div`
  font-size: ${p => p.$large ? "13px" : "12px"};
  color: #555;
  ${p => p.$large && "text-align: center; padding: 20px 0;"}
`;

const GBInputArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  ${p => p.$overlay && "padding: 16px; gap: 8px; border-top: 1px solid #ffffff12;"}
`;

const GBInput = styled.textarea`
  width: 100%;
  resize: none;
  height: 44px;
  background: rgba(255,255,255,0.05);
  border: 1px solid #ffffff20;
  border-radius: 10px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  padding: 10px 36px 10px 12px;
  box-sizing: border-box;
  outline: none;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #4a3d5e; }
`;

const GBInputFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GBCounter = styled.span`
  font-size: 10px;
  color: ${p => p.$warn ? "#e4a060" : "#555"};
`;

/* ── Comment card ── */

const CommentCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${p => p.$expanded ? "10px" : "7px"};
  background: rgba(255,255,255,0.04);
  border: 1px solid #ffffff10;
  border-radius: 8px;
  padding: ${p => p.$expanded ? "8px 10px" : "5px 8px"};
  min-width: 0;
  flex-shrink: 0;
`;

const CommentSenderTag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.22);
  border-radius: 20px;
  padding: 2px 8px 2px 2px;
  flex-shrink: 0;
  max-width: 110px;
`;

const CommentAuthorName = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #c4a1ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
`;

const CommentMessage = styled.span`
  font-size: ${p => p.$expanded ? "13px" : "11px"};
  color: #ccc;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
`;

const CommentDeleteBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #ff7777; background: rgba(255,80,80,0.12); }
`;

/* ── Guest Book expanded overlay ── */

const GuestBookOverlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 30%;
  z-index: 20;
  background: linear-gradient(160deg, #130b24 0%, #0e0918 100%);
  border-radius: 0 14px 14px 0;
  border: 1px solid rgba(124,58,237,0.28);
  box-shadow: inset 0 0 80px rgba(124,58,237,0.04);
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
  top: 12px;
  right: 14px;
  color: #555;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  z-index: 2;
  &:hover { color: #fff; }
`;

const GBHeader = styled.div`
  padding: 22px 24px 0;
  flex-shrink: 0;
`;

const GBTitle = styled.h2`
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: #e4d0ff;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
`;

const GBSubtitle = styled.p`
  margin: 5px 0 14px;
  font-size: 11px;
  color: #5a4870;
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
  border: 1px solid #ffffff15;
  color: #bbb;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.15); border-color: #7b2ff7; color: #fff; }
`;

const GBPinnedBtn = styled.button`
  background: rgba(255,255,255,0.05);
  border: 1px solid #ffffff15;
  color: #bbb;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.15); border-color: #7b2ff7; color: #fff; }
`;

const GBComposeArea = styled.div`
  margin: 0 16px 4px;
  padding: 12px 14px 8px;
  background: rgba(255,255,255,0.025);
  border: 1px solid #ffffff0d;
  border-radius: 14px;
  flex-shrink: 0;
`;

const GBComposeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GBAvatarPlaceholder = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(124,58,237,0.18);
  border: 2px solid rgba(124,58,237,0.28);
  flex-shrink: 0;
`;

const GBComposeInputWrap = styled.div`
  flex: 1;
  position: relative;
`;

const GBEmojiBtn = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #555;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: #c4a1ff; }
`;

const GBPostBtn = styled.button`
  background: #6b2fd6;
  border: none;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #7b3ff5; }
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
  color: #6a5880;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  &:hover { background: rgba(255,255,255,0.06); color: #bbb; }
`;

const GBOrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  flex-shrink: 0;
`;

const GBDividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: #ffffff0f;
`;

const GBDividerGem = styled.span`
  color: rgba(124,58,237,0.45);
  font-size: 11px;
`;

const GBCommentCard = styled.div`
  background: rgba(255,255,255,0.025);
  border: 1px solid #ffffff0d;
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.15s;
  &:hover { border-color: rgba(124,58,237,0.22); }
`;

const GBCommentInner = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const GBCommentAvatarCol = styled.div`
  flex-shrink: 0;
`;

const GBCommentBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const GBCommentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const GBCommentName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #c4a1ff;
`;

const GBCommentTime = styled.span`
  font-size: 11px;
  color: #4a3d5e;
`;

const GBCommentText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #c0b8d0;
  line-height: 1.55;
  word-break: break-word;
`;

const GBReactions = styled.div`
  display: flex;
  gap: 14px;
  margin-top: 2px;
`;

const GBReactionBtn = styled.button`
  all: unset;
  font-size: 12px;
  color: #5a4d70;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s;
  &:hover { color: #c4a1ff; }
`;

const GBCommentActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const GBMenuDot = styled.button`
  all: unset;
  color: #3d3252;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s;
  &:hover { color: #bbb; }
`;

const GBStatsFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #ffffff0d;
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
  color: #4a3d5e;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const GBStatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #ddd;
`;

const GBStatDivider = styled.div`
  width: 1px;
  height: 32px;
  background: #ffffff0f;
  flex-shrink: 0;
`;

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
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.28); border-color: #7b2ff7; color: #fff; }
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
