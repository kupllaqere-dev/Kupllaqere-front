import { useState } from "react";
import styled from "styled-components";
import PlayerThumbnail from "../../PlayerThumbnail";
import GuestbookCanvas from "../../Guestbook/GuestbookCanvas";
import { STICKER_ASSETS } from "../../Guestbook/StickerAssets";
import { formatRelativeTime } from "../utils";
import {
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
} from "../../Guestbook/styles";

const GuestbookRoot = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0 0 18px 18px;
  background: var(--pp-gradPanel);
  overflow: hidden;
`;

const MSG_MAX = 200;
const PER_PAGE = 5;

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
