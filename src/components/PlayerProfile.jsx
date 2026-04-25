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

const FRAME_W = 510;
const FRAME_H = 900;

// Clockwise rotation order through idle poses
const POSE_ORDER = [0, 4, 5, 3, 2, 1]; // FRONT, FRONT_RIGHT, RIGHT, BACK, LEFT, FRONT_LEFT
const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];

const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];

const BADGES = ["diamond", "flame", "medal", "paint", "verified"];

function extractFrame(img, frameIndex, cols) {
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  return { sx: col * FRAME_W, sy: row * FRAME_H };
}

const BIO_MAX = 150;

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
}) {
  const canvasRef = useRef(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [baseImg, setBaseImg] = useState(null);
  const [layerImages, setLayerImages] = useState([]);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState(null);
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [smState, setSmState] = useState(null); // { mine, sent, received, target?, relationship? }
  const [smBusy, setSmBusy] = useState(false);
  const [smError, setSmError] = useState(null);

  const isSelfView = !!(currentUserId && targetUserId &&
    String(currentUserId) === String(targetUserId));

  useEffect(() => { setBioDraft(bio); }, [bio]);

  // Load + refresh soul mate state
  const loadSm = useCallback(async () => {
    if (!currentUserId) {
      setSmState(null);
      return;
    }
    try {
      const data = await fetchSoulMateState(targetUserId || null);
      setSmState(data);
      setSmError(null);
    } catch (err) {
      setSmError(err.message || "Failed to load soul mate state");
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => { loadSm(); }, [loadSm]);

  // Live refresh on server-pushed soulmate:refresh
  useEffect(() => {
    if (!socket?.socket) return;
    const handler = () => { loadSm(); };
    socket.socket.on("soulmate:refresh", handler);
    return () => { socket.socket.off("soulmate:refresh", handler); };
  }, [socket, loadSm]);

  const runSm = useCallback(async (fn) => {
    if (smBusy) return;
    setSmBusy(true);
    setSmError(null);
    try {
      await fn();
      await loadSm();
    } catch (err) {
      setSmError(err.message || "Action failed");
    } finally {
      setSmBusy(false);
    }
  }, [smBusy, loadSm]);

  const smSendRequest = () =>
    runSm(() => sendSoulMateRequest(targetUserId));
  const smAccept = (userId) =>
    runSm(() => acceptSoulMateRequest(userId));
  const smDecline = (userId) =>
    runSm(() => declineSoulMateRequest(userId));
  const smCancel = () =>
    runSm(() => cancelSoulMateRequest());
  const smRemove = () =>
    runSm(() => removeSoulMate());

  const handleBadgeClick = async (name) => {
    if (!onSaveBadge || badgeSaving) return;
    const next = selectedBadge === name ? null : name;
    setBadgeSaving(true);
    try {
      await onSaveBadge(next);
    } catch (err) {
      console.error("Badge save failed:", err);
    } finally {
      setBadgeSaving(false);
    }
  };

  // Load base sprite
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = gender === "male"
      ? "/assets/character-bases/men-test.png"
      : "/assets/character-bases/females.png";
    img.onload = () => setBaseImg(img);
  }, [gender]);

  // Load equipped layer images
  useEffect(() => {
    if (!outfit) {
      setLayerImages([]);
      return;
    }

    const entries = LAYER_ORDER
      .filter((cat) => outfit[cat]?.imageUrl)
      .map((cat) => ({ category: cat, url: outfit[cat].imageUrl }));

    let cancelled = false;
    Promise.all(
      entries.map(
        ({ category, url }) =>
          new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve({ category, img });
            img.onerror = () => resolve(null);
          }),
      ),
    ).then((results) => {
      if (!cancelled) setLayerImages(results.filter(Boolean));
    });

    return () => { cancelled = true; };
  }, [outfit]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.floor(baseImg.width / FRAME_W);
    const frameIndex = POSE_ORDER[poseIndex];
    const { sx, sy } = extractFrame(baseImg, frameIndex, cols);

    // Draw base
    ctx.drawImage(baseImg, sx, sy, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);

    // Draw layers in order
    for (const { img } of layerImages) {
      const layerCols = Math.floor(img.width / FRAME_W);
      const { sx: lx, sy: ly } = extractFrame(img, frameIndex, layerCols);
      ctx.drawImage(img, lx, ly, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
    }
  }, [baseImg, layerImages, poseIndex]);

  useEffect(() => { draw(); }, [draw]);

  const turnLeft = () => setPoseIndex((i) => (i - 1 + POSE_ORDER.length) % POSE_ORDER.length);
  const turnRight = () => setPoseIndex((i) => (i + 1) % POSE_ORDER.length);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Inner>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>
          <Content>
            <AvatarSide>
              <AvatarCanvas ref={canvasRef} width={FRAME_W} height={FRAME_H} />
              <Controls>
                <ArrowBtn onClick={turnLeft}>&larr;</ArrowBtn>
                <PoseLabel>{POSE_LABELS[poseIndex]}</PoseLabel>
                <ArrowBtn onClick={turnRight}>&rarr;</ArrowBtn>
              </Controls>
            </AvatarSide>

            <MiddleColumn>
              <PlayerLevel>Level 78</PlayerLevel>
              <ActionBtn type="button"> Appearance </ActionBtn>
              <ActionBtn type="button"> Inventory</ActionBtn>
              <ActionBtn type="button"> Friend List</ActionBtn>
              <ActionBtn type="button"> Mail</ActionBtn>
              <ActionBtn type="button"> Album</ActionBtn>
              <ActionBtn type="button"> Stats</ActionBtn>
              <ActionBtn type="button"> Wishlist</ActionBtn>
            </MiddleColumn>

            <InfoSide>
              <NameAndBadges>
                <PlayerName>{playerName || "Player"}</PlayerName>
                <Badges>
                  {BADGES.map((name) => (
                    <BadgePlaceholder
                      key={name}
                      $selected={selectedBadge === name}
                      $clickable={!!onSaveBadge}
                      $saving={badgeSaving}
                      onClick={() => handleBadgeClick(name)}
                      title={
                        onSaveBadge
                          ? selectedBadge === name
                            ? "Click to unselect"
                            : "Click to display this badge"
                          : name
                      }
                    >
                      <BadgeImg src={`/assets/badges/${name}.png`} alt={name} />
                    </BadgePlaceholder>
                  ))}
                </Badges>
              </NameAndBadges>
              <Divider />
              <BioHeader>
                <DescLabel>About</DescLabel>
                {onSaveBio && !editingBio && (
                  <EditBtn
                    onClick={() => {
                      setBioDraft(bio);
                      setBioError(null);
                      setEditingBio(true);
                    }}
                  >
                    Edit
                  </EditBtn>
                )}
              </BioHeader>
              {editingBio ? (
                <>
                  <BioTextarea
                    value={bioDraft}
                    maxLength={BIO_MAX}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Tell others about yourself…"
                    disabled={bioSaving}
                  />
                  <BioFooter>
                    <BioCounter>
                      {bioDraft.length}/{BIO_MAX}
                    </BioCounter>
                    <BioActions>
                      <SecondaryBtn
                        disabled={bioSaving}
                        onClick={() => {
                          setEditingBio(false);
                          setBioError(null);
                          setBioDraft(bio);
                        }}
                      >
                        Cancel
                      </SecondaryBtn>
                      <PrimaryBtn
                        disabled={bioSaving || bioDraft === bio}
                        onClick={async () => {
                          setBioSaving(true);
                          setBioError(null);
                          try {
                            await onSaveBio(bioDraft.trim());
                            setEditingBio(false);
                          } catch (err) {
                            setBioError(err.message || "Failed to save");
                          } finally {
                            setBioSaving(false);
                          }
                        }}
                      >
                        {bioSaving ? "Saving…" : "Save"}
                      </PrimaryBtn>
                    </BioActions>
                  </BioFooter>
                  {bioError && <BioErrorMsg>{bioError}</BioErrorMsg>}
                </>
              ) : (
                <Description>
                  {bio?.trim() ? bio : <EmptyOutfit>No bio yet.</EmptyOutfit>}
                </Description>
              )}

              <Divider />
              <PlaceholderGrid>
                <SoulMateBox>
                  <SoulMateLabel>Soul Mate</SoulMateLabel>
                  {renderSoulMate({
                    smState,
                    isSelfView,
                    targetUserId,
                    currentUserId,
                    smBusy,
                    smError,
                    smSendRequest,
                    smAccept,
                    smDecline,
                    smCancel,
                    smRemove,
                  })}
                </SoulMateBox>
              </PlaceholderGrid>
            </InfoSide>
          </Content>
        </Inner>
        {/* <Frame src="/assets/menus/frame.png" alt="" aria-hidden="true" /> */}
      </Modal>
    </Overlay>
  );
}

/* ── Soul Mate render ── */

function renderSoulMate({
  smState,
  isSelfView,
  targetUserId,
  currentUserId,
  smBusy,
  smError,
  smSendRequest,
  smAccept,
  smDecline,
  smCancel,
  smRemove,
}) {
  if (!currentUserId) return <SoulMateEmpty>Sign in to use soul mates.</SoulMateEmpty>;
  if (!smState) return <SoulMateEmpty>Loading…</SoulMateEmpty>;

  const { mine, sent, received = [], target, relationship } = smState;

  // Self-view: managing my own soul mate state
  if (isSelfView || !targetUserId) {
    if (mine) {
      return (
        <SoulMateContent>
          <SoulMateHeart>♥</SoulMateHeart>
          <SoulMateName>{mine.name}</SoulMateName>
          <SoulMateActions>
            <SmDangerBtn disabled={smBusy} onClick={smRemove}>
              Break Up
            </SmDangerBtn>
          </SoulMateActions>
          {smError && <SmError>{smError}</SmError>}
        </SoulMateContent>
      );
    }
    if (received.length > 0) {
      return (
        <SoulMateContent>
          <SoulMateSubLabel>Incoming requests</SoulMateSubLabel>
          {received.map((r) => (
            <SoulMateRequestRow key={r.id}>
              <SoulMateName>{r.name}</SoulMateName>
              <SoulMateActions>
                <SmPrimaryBtn disabled={smBusy} onClick={() => smAccept(r.id)}>
                  Accept
                </SmPrimaryBtn>
                <SmSecondaryBtn disabled={smBusy} onClick={() => smDecline(r.id)}>
                  Decline
                </SmSecondaryBtn>
              </SoulMateActions>
            </SoulMateRequestRow>
          ))}
          {smError && <SmError>{smError}</SmError>}
        </SoulMateContent>
      );
    }
    if (sent) {
      return (
        <SoulMateContent>
          <SoulMateSubLabel>Pending</SoulMateSubLabel>
          <SoulMateName>{sent.name}</SoulMateName>
          <SoulMateActions>
            <SmSecondaryBtn disabled={smBusy} onClick={smCancel}>
              Cancel
            </SmSecondaryBtn>
          </SoulMateActions>
          {smError && <SmError>{smError}</SmError>}
        </SoulMateContent>
      );
    }
    return <SoulMateEmpty>No soul mate yet.</SoulMateEmpty>;
  }

  // Other-view: managing the relationship between me and target
  if (relationship === "soulmate") {
    return (
      <SoulMateContent>
        <SoulMateHeart>♥</SoulMateHeart>
        <SoulMateSubLabel>Your Soul Mate</SoulMateSubLabel>
        <SoulMateActions>
          <SmDangerBtn disabled={smBusy} onClick={smRemove}>
            Break Up
          </SmDangerBtn>
        </SoulMateActions>
        {smError && <SmError>{smError}</SmError>}
      </SoulMateContent>
    );
  }

  if (relationship === "i_sent") {
    return (
      <SoulMateContent>
        <SoulMateSubLabel>Request sent</SoulMateSubLabel>
        <SoulMateActions>
          <SmSecondaryBtn disabled={smBusy} onClick={smCancel}>
            Cancel
          </SmSecondaryBtn>
        </SoulMateActions>
        {smError && <SmError>{smError}</SmError>}
      </SoulMateContent>
    );
  }

  if (relationship === "they_sent") {
    return (
      <SoulMateContent>
        <SoulMateSubLabel>Wants to be your soul mate</SoulMateSubLabel>
        <SoulMateActions>
          <SmPrimaryBtn disabled={smBusy} onClick={() => smAccept(targetUserId)}>
            Accept
          </SmPrimaryBtn>
          <SmSecondaryBtn disabled={smBusy} onClick={() => smDecline(targetUserId)}>
            Decline
          </SmSecondaryBtn>
        </SoulMateActions>
        {smError && <SmError>{smError}</SmError>}
      </SoulMateContent>
    );
  }

  // No direct relationship between us
  if (target?.soulMate) {
    return (
      <SoulMateContent>
        <SoulMateSubLabel>Soul mate</SoulMateSubLabel>
        <SoulMateName>{target.soulMate.name}</SoulMateName>
        {smError && <SmError>{smError}</SmError>}
      </SoulMateContent>
    );
  }

  if (mine) {
    return (
      <SoulMateContent>
        <SoulMateEmpty>You already have a soul mate.</SoulMateEmpty>
        {smError && <SmError>{smError}</SmError>}
      </SoulMateContent>
    );
  }

  return (
    <SoulMateContent>
      <SmPrimaryBtn disabled={smBusy} onClick={smSendRequest}>
        Send Soul Mate Request
      </SmPrimaryBtn>
      {smError && <SmError>{smError}</SmError>}
    </SoulMateContent>
  );
}

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* Frame source image is 1536x1024; lock the modal to that aspect ratio
   so the inner content rectangle can be inset by fixed percentages that
   match where the frame's gold border sits in the source image. */
const FRAME_ASPECT = "1536 / 1024";

/* Insets (in % of modal width/height) to the inside of the gold rectangle
   in frame.png. Tune these if the inner edge isn't pixel-perfect. */
const INSET_TOP = "5.5%";
const INSET_RIGHT = "2.5%";
const INSET_BOTTOM = "5%";
const INSET_LEFT = "2.5%";

const Modal = styled.div`
  position: relative;
  width: min(85vw, 96vh * 1.5);
  max-width: 96vw;
  max-height: 96vh;
  aspect-ratio: ${FRAME_ASPECT};
  color: #fff;
  filter: drop-shadow(0 8px 40px rgba(0, 0, 0, 0.6));
`;

const Inner = styled.div`
  position: absolute;
  top: ${INSET_TOP};
  right: ${INSET_RIGHT};
  bottom: ${INSET_BOTTOM};
  left: ${INSET_LEFT};
  background: #49494d;
  padding: 28px;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1;
`;

const Frame = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  z-index: 2;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  z-index: 2;
  &:hover { color: #fff; }
`;

const Content = styled.div`
  display: flex;
  gap: 28px;
  align-items: flex-start;
`;

const AvatarSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const AvatarCanvas = styled.canvas`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #ffffff15;
  border-radius: 12px;
  width: 400px;
  max-width: 100%;
  height: auto;
  aspect-ratio: ${FRAME_W} / ${FRAME_H};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
`;

const ArrowBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #ffffff22;
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: rgba(124, 58, 237, 0.3);
    border-color: #7b2ff7;
    color: #fff;
  }
`;

const PoseLabel = styled.span`
  font-size: 11px;
  color: #888;
  min-width: 80px;
  text-align: center;
`;

const MiddleColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
  gap: 12px;
  flex-shrink: 0;
  width: 100px;
  margin-top: 100px;
`;

const PlayerLevel = styled.div`
  margin-top: -100px;
  font-size: 22px;
  font-weight: 300;
  color: white;
`;

const ActionBtn = styled.button`
  width: 100px;
  height: 30px;
  border-radius: 16px;

  background: linear-gradient(
    to top,
    rgba(113, 22, 216, 0.18) 0%,
    rgba(113, 22, 216, 0.08) 40%,
    rgba(211, 65, 167, 0.534) 100%
  );

  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;


  &:hover {
    background: rgba(124, 58, 237, 0.25);
    border-color: #7b2ff7;
    color: #fff;
  }
`;

const InfoSide = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlaceholderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const PlaceholderBox = styled.div`
  /* aspect-ratio: 1; */
  width: 100%;
  height: 100px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed #ffffff22;
  border-radius: 10px;
`;

const SoulMateBox = styled.div`
  width: 100%;
  min-height: 100px;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid #ffffff22;
  border-radius: 10px;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SoulMateLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #c4a1ff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SoulMateSubLabel = styled.div`
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SoulMateContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SoulMateEmpty = styled.div`
  font-size: 12px;
  color: #777;
`;

const SoulMateName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const SoulMateHeart = styled.div`
  font-size: 18px;
  color: #ff6b9b;
`;

const SoulMateRequestRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid #ffffff10;
  &:last-child { border-bottom: none; }
`;

const SoulMateActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const SmPrimaryBtn = styled.button`
  background: rgba(124, 58, 237, 0.6);
  border: 1px solid rgba(124, 58, 237, 0.8);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124, 58, 237, 0.85); }
`;

const SmSecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); color: #fff; }
`;

const SmDangerBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff8a8a;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255, 80, 80, 0.15); color: #fff; }
`;

const SmError = styled.div`
  font-size: 11px;
  color: #ff7777;
`;

const NameAndBadges = styled.div`
 display: flex;
 gap: 16px;
 justify-content: space-between;
`;

const PlayerName = styled.h2`
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: white;
`;

const Badges = styled.div`
  display: flex;
  gap: 10px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
`;

const BadgePlaceholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  width: 50px;
  border-radius: 24px;
  cursor: ${(p) => (p.$clickable ? (p.$saving ? "wait" : "pointer") : "default")};
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  background: ${(p) => (p.$selected ? "rgba(124, 58, 237, 0.25)" : "transparent")};
  box-shadow: ${(p) => (p.$selected ? "0 0 0 2px #c4a1ff, 0 0 12px rgba(124, 58, 237, 0.5)" : "none")};
  opacity: ${(p) => (p.$saving ? 0.6 : 1)};

  &:hover {
    transform: ${(p) => (p.$clickable && !p.$saving ? "scale(1.1)" : "none")};
  }
`;

const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

const Divider = styled.div`
  height: 1px;
  background: #ffffff15;
  margin: 14px 0;
`;

const DescLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: #bbb;
  line-height: 1.5;
`;

const EmptyOutfit = styled.span`
  font-size: 12px;
  color: #666;
`;

const BioHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

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

const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 70px;
  resize: vertical;
  background: rgba(255, 255, 255, 0.04);
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

const PrimaryBtn = styled.button`
  background: rgba(124, 58, 237, 0.6);
  border: 1px solid rgba(124, 58, 237, 0.8);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124, 58, 237, 0.85); }
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
  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); color: #fff; }
`;

const BioErrorMsg = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: #ff7777;
`;
