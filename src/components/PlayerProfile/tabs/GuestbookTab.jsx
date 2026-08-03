import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Phaser from "phaser";
import PlayerThumbnail from "../../PlayerThumbnail";
import GuestbookScene from "./helpers/GuestbookScene";
import { STICKER_ASSETS } from "./helpers/StickerAssets";
import { formatRelativeTime } from "../utils";
import {
  GuestbookRoot,
  GuestbookCanvasWrap,
  GBTwoCol,
  GBLeftWrap,
  GBRightWrap,
  GBStickerCount,
  GBCanvasBody,
  GBTray, GBTrayLabelSection, GBTrayPickerSection, GBTrayLabel, GBCarouselBtn, PickerBtn,
  DeletePopover, DeletePopoverText, DeletePopoverName,
  DeletePopoverActions, DeleteConfirmBtn, DeleteCancelBtn,
  GBRight,
  GBComposeSectionHeader, GBSectionTitle, GBHelpBtn,
  GBComposeWrap, GBComposeTextWrap, GBComposeInput,
  GBComposeBottom, GBCharCounter, GBPostBtn,
  GBMsgDivider, GBMsgLabel, GBMsgList,
  GBMsgCard, GBMsgAvatarWrap, GBMsgBody, GBMsgMeta,
  GBMsgName, GBMsgTime, GBMsgText,
  GBMsgActionBanner, GBMsgRemoveBtn, GBMsgEmpty,
  GBRightFooter, GBFooterNote,
} from "./GuestbookTab.styles";

const MSG_MAX = 200;
const PER_PAGE = 5;

/**
 * React wrapper that creates and destroys a Phaser.Game for the sticker canvas.
 *
 * Exposes an imperative handle so the parent can:
 *   - ref.current.startPlacement(assetId)
 *   - ref.current.cancelPlacement()
 *   - ref.current.confirmPlacement()  → returns placement payload | null
 *   - ref.current.adjustRotation(deg)
 *   - ref.current.adjustScale(delta)
 *   - ref.current.addStickerExternal(stickerRow)
 *   - ref.current.removeStickerExternal(stickerId)
 */
const GuestbookCanvas = forwardRef(function GuestbookCanvas(
  {
    stickers,
    currentUserId,
    profileOwnerId,
    onStickerClick,
    onPlacementDone,
    onConfirmPlacement,
  },
  ref
) {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);
  const sceneRef     = useRef(null);

  // Keep callbacks current without recreating the Phaser game
  const onStickerClickRef     = useRef(onStickerClick);
  const onPlacementDoneRef    = useRef(onPlacementDone);
  const onConfirmPlacementRef = useRef(onConfirmPlacement);
  useEffect(() => { onStickerClickRef.current     = onStickerClick; },     [onStickerClick]);
  useEffect(() => { onPlacementDoneRef.current    = onPlacementDone; },    [onPlacementDone]);
  useEffect(() => { onConfirmPlacementRef.current = onConfirmPlacement; }, [onConfirmPlacement]);

  // ── Imperative API ────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    startPlacement:       (assetId) => sceneRef.current?.startPlacement(assetId),
    cancelPlacement:      ()        => sceneRef.current?.cancelPlacement(),
    confirmPlacement:     ()        => sceneRef.current?.confirmPlacement(),
    adjustRotation:       (d)       => sceneRef.current?.adjustRotation(d),
    adjustScale:          (d)       => sceneRef.current?.adjustScale(d),
    addStickerExternal:   (s)       => sceneRef.current?.addStickerExternal(s),
    removeStickerExternal:(id)      => sceneRef.current?.removeStickerExternal(id),
    zoomIn:               ()        => sceneRef.current?.zoomIn(),
    zoomOut:              ()        => sceneRef.current?.zoomOut(),
    zoomReset:            ()        => sceneRef.current?.zoomReset(),
  }));

  // ── Mount/Destroy Phaser game ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new GuestbookScene();
    // Inject config before the game boots (accessed in preload/create)
    scene.initialStickers = stickers || [];
    scene.currentUserId   = currentUserId  || null;
    scene.profileOwnerId  = profileOwnerId || null;
    scene.stickerAssets   = STICKER_ASSETS;
    // Use refs so callbacks stay fresh without re-creating the game
    scene.onStickerClick     = (...args) => onStickerClickRef.current?.(...args);
    scene.onPlacementDone    = (...args) => onPlacementDoneRef.current?.(...args);
    scene.onConfirmPlacement = (...args) => onConfirmPlacementRef.current?.(...args);
    sceneRef.current = scene;

    const w = el.clientWidth  || 480;
    const h = el.clientHeight || 330;

    const game = new Phaser.Game({
      type:            Phaser.CANVAS,
      width:           w,
      height:          h,
      parent:          el,
      backgroundColor: 0xfdf8f0,
      transparent:     false,
      scene,
      scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      w,
        height:     h,
      },
      input: {
        activePointers: 3, // support two-finger gestures
      },
      render: {
        antialias:  true,
        pixelArt:   false,
        roundPixels: false,
      },
      // Disable the Phaser banner in the console
      banner: false,
    });
    gameRef.current = game;

    return () => {
      // Null out callbacks before destruction to avoid React "setState on unmounted" errors
      if (sceneRef.current) {
        sceneRef.current.onStickerClick  = null;
        sceneRef.current.onPlacementDone = null;
      }
      game.destroy(true);
      gameRef.current  = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only — external updates come via the imperative API

  return <GuestbookCanvasWrap ref={containerRef} />;
});

export default function GuestbookTab({
  isSelfView,
  currentUserId,
  currentUserName,
  targetUserId,
  canvasRef,
  gbStickers,
  gbStickersLoading,
  gbPlacingAssetId,
  setGbPlacingAssetId,
  gbDeleteTarget,
  setGbDeleteTarget,
  onGbStickerSelect,
  onGbConfirm,
  onGbDeleteConfirm,
  gbComments,
  gbLoading,
  gbInput,
  setGbInput,
  gbSubmitting,
  handleSubmitComment,
  handleDeleteComment,
}) {
  const [stickerPage, setStickerPage] = useState(0);
  const [selectedMsgId, setSelectedMsgId] = useState(null);

  const totalPages = Math.ceil(STICKER_ASSETS.length / PER_PAGE);
  const pageStickers = STICKER_ASSETS.slice(stickerPage * PER_PAGE, (stickerPage + 1) * PER_PAGE);
  const stickersFull = (gbStickers?.length ?? 0) >= 100;
  const canPlace = !!currentUserId && !isSelfView && !stickersFull;

  return (
    <GuestbookRoot>
      <GBTwoCol>

        {/* ── LEFT — Sticker Canvas ── */}
        <GBLeftWrap>
          <GBCanvasBody>
            {gbStickersLoading ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#b09070", fontSize: 12 }}>
                Loading canvas…
              </div>
            ) : (
              <GuestbookCanvas
                ref={canvasRef}
                stickers={gbStickers}
                currentUserId={currentUserId}
                profileOwnerId={targetUserId}
                onStickerClick={(stickerId, placedByUserId) =>
                  setGbDeleteTarget({ stickerId, placedByUserId })
                }
                onPlacementDone={() => setGbPlacingAssetId(null)}
                onConfirmPlacement={onGbConfirm}
              />
            )}

            <GBStickerCount>
              ♥ {gbStickers?.length ?? 0} / 100
            </GBStickerCount>

            {gbDeleteTarget && (
              <DeletePopover>
                <DeletePopoverText>
                  Remove sticker by{" "}
                  <DeletePopoverName>
                    {gbStickers?.find(s => s.id === gbDeleteTarget.stickerId)?.placed_by_name || "a player"}
                  </DeletePopoverName>
                  ?
                </DeletePopoverText>
                <DeletePopoverActions>
                  <DeleteCancelBtn onClick={() => setGbDeleteTarget(null)}>Keep</DeleteCancelBtn>
                  <DeleteConfirmBtn onClick={() => onGbDeleteConfirm(gbDeleteTarget.stickerId)}>
                    Remove
                  </DeleteConfirmBtn>
                </DeletePopoverActions>
              </DeletePopover>
            )}
          </GBCanvasBody>

          <GBTray>
            <GBTrayLabelSection>
              <GBTrayLabel>
                {canPlace ? "Add a Sticker" : stickersFull ? "Canvas full" : "View only"}
              </GBTrayLabel>
            </GBTrayLabelSection>
            {canPlace && (
              <GBTrayPickerSection>
                <GBCarouselBtn
                  onClick={() => setStickerPage(p => Math.max(0, p - 1))}
                  disabled={stickerPage === 0}
                  aria-label="Previous stickers"
                >
                  ‹
                </GBCarouselBtn>
                {pageStickers.map(({ id, emoji, label }) => (
                  <PickerBtn
                    key={id}
                    $active={gbPlacingAssetId === id}
                    title={label}
                    onClick={() => onGbStickerSelect(id)}
                    aria-label={label}
                  >
                    {emoji}
                  </PickerBtn>
                ))}
                <GBCarouselBtn
                  onClick={() => setStickerPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={stickerPage >= totalPages - 1}
                  aria-label="Next stickers"
                >
                  ›
                </GBCarouselBtn>
              </GBTrayPickerSection>
            )}
          </GBTray>
        </GBLeftWrap>

        {/* ── RIGHT — Messages ── */}
        <GBRightWrap>
          <GBRight>

            <GBComposeSectionHeader>
              <GBSectionTitle>{isSelfView ? "Messages from visitors" : "Leave a Message"}</GBSectionTitle>
              <GBHelpBtn title="Messages are public and permanent">?</GBHelpBtn>
            </GBComposeSectionHeader>

            {currentUserId && !isSelfView ? (
              <GBComposeWrap>
                <GBMsgAvatarWrap>
                  <PlayerThumbnail playerName={currentUserName} size={48} />
                </GBMsgAvatarWrap>
                <GBComposeTextWrap>
                  <GBComposeInput
                    value={gbInput}
                    maxLength={MSG_MAX}
                    onChange={(e) => setGbInput(e.target.value)}
                    placeholder="Write something sweet…"
                    disabled={gbSubmitting}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    rows={2}
                  />
                  <GBComposeBottom>
                    <GBCharCounter $warn={(gbInput?.length ?? 0) > MSG_MAX * 0.9}>
                      {gbInput?.length ?? 0} / {MSG_MAX}
                    </GBCharCounter>
                    <GBPostBtn
                      onClick={handleSubmitComment}
                      disabled={gbSubmitting || !gbInput?.trim()}
                    >
                      {gbSubmitting ? "…" : "Post"}
                    </GBPostBtn>
                  </GBComposeBottom>
                </GBComposeTextWrap>
              </GBComposeWrap>
            ) : (
              <div style={{ padding: "8px 18px 4px", fontSize: 11.5, color: "#b09070", fontStyle: "italic" }}>
                {isSelfView ? "View messages left for you below." : "Sign in to leave a message."}
              </div>
            )}

            <GBMsgDivider>
              <GBMsgLabel>Messages</GBMsgLabel>
            </GBMsgDivider>

            <GBMsgList>
              {gbLoading ? (
                <GBMsgEmpty>Loading…</GBMsgEmpty>
              ) : !gbComments?.length ? (
                <GBMsgEmpty>No messages yet — be the first! 🌸</GBMsgEmpty>
              ) : (
                gbComments.map((c) => {
                  const msgId = c._id ?? c.id;
                  const isSelected = selectedMsgId === msgId;
                  return (
                    <div key={msgId}>
                      <GBMsgCard
                        $clickable={isSelfView}
                        $selected={isSelected}
                        onClick={() => isSelfView && setSelectedMsgId(isSelected ? null : msgId)}
                      >
                        <GBMsgAvatarWrap>
                          <PlayerThumbnail playerName={c.authorName ?? c.author_name} size={48} />
                        </GBMsgAvatarWrap>
                        <GBMsgBody>
                          <GBMsgMeta>
                            <GBMsgName>{c.authorName ?? c.author_name}</GBMsgName>
                            {(c.createdAt ?? c.created_at) && (
                              <GBMsgTime>{formatRelativeTime(c.createdAt ?? c.created_at)}</GBMsgTime>
                            )}
                          </GBMsgMeta>
                          <GBMsgText>{c.message}</GBMsgText>
                        </GBMsgBody>
                      </GBMsgCard>
                      {isSelfView && (
                        <GBMsgActionBanner $open={isSelected}>
                          <GBMsgRemoveBtn onClick={() => { handleDeleteComment(msgId); setSelectedMsgId(null); }}>
                            Remove
                          </GBMsgRemoveBtn>
                        </GBMsgActionBanner>
                      )}
                    </div>
                  );
                })
              )}
            </GBMsgList>

            <GBRightFooter>
              <GBFooterNote>Keep messages kind and friendly!</GBFooterNote>
              <GBFooterNote>{MSG_MAX} characters max</GBFooterNote>
            </GBRightFooter>
          </GBRight>
        </GBRightWrap>

      </GBTwoCol>
    </GuestbookRoot>
  );
}
