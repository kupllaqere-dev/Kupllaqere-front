import { useState, useRef } from "react";
import { BIO_MAX, BADGES, BADGE_RARITY } from "../constants";
import { formatRelativeTime } from "../utils";
import { bbcodeToHtml } from "../bbcode";
import BBCodeEditor from "../BBCodeEditor";
import PlayerThumbnail from "../../PlayerThumbnail";
import GuestbookCanvas from "../../Guestbook/GuestbookCanvas";
import { STICKER_ASSETS } from "../../Guestbook/StickerAssets";
import {
  // Layout
  GBModalHeader, GBBannerTitle, GBCloseBtn,
  GBTwoCol,
  GBLeftWrap,
  GBRightWrap,
  GBStickerCount,
  GBCanvasBody,
  GBTray, GBTrayLabelSection, GBTrayPickerSection, GBTrayLabel, GBCarouselBtn, PickerBtn,
  // Delete
  DeletePopover, DeletePopoverText, DeletePopoverName,
  DeletePopoverActions, DeleteConfirmBtn, DeleteCancelBtn,
  // Right panel
  GBRight,
  GBComposeSectionHeader, GBSectionTitle, GBHelpBtn,
  GBComposeWrap, GBComposeTextWrap, GBComposeInput,
  GBComposeBottom, GBCharCounter, GBPostBtn,
  GBMsgDivider, GBMsgLabel, GBMsgList,
  GBMsgCard, GBMsgAvatarWrap, GBMsgBody, GBMsgMeta,
  GBMsgName, GBMsgTime, GBMsgText, GBMsgActions,
  GBMsgHeart, GBMsgDeleteBtn, GBMsgActionBanner, GBMsgRemoveBtn, GBMsgEmpty,
  GBRightFooter, GBFooterNote,
} from "../../Guestbook/styles";
import {
  ProfileContent, ProfileHeader, HeaderLeft,
  HeaderThumbnailWrap, HeaderRight, HeaderNameRow, HeaderMemberSince,
  HeaderStatsRow, HeaderStatBox, HeaderStatTop, HeaderStatLabel,
  PlayerName, PlayerNameMark, LevelBadge,
  SectionBlock, SectionHeaderRow, SectionTitle,
  SoulmateEmptyBox, SmEmpty, SoulmateCard, SoulmateHeartBg, SoulmateAvatarWrap,
  SoulmateInfoBlock, SoulmateName, SoulmateMark, SoulmateDuration,
  SoulmateCardActions, SmDangerBtn, SmError, SmSub, SmRow, SmName,
  SmActions, SmPrimaryBtn, SmSecBtn, SmContent,
  SectionCountPill,
  BadgesScrollWrap, BadgesRow, BadgeCard, BadgeCardIconWrap, BadgeImg, BadgeCardName, BadgeCardRarity, BadgeExpandBtn,
  ShowcaseScrollWrap, ShowcaseRow, ShowcaseCard, ShowcaseCardShine, ShowcaseItemImg,
  ShowcaseCardLabel, ShowcaseCardType, ShowcaseAdd, ShowcaseCardAddLabel,
  CompanionCard, CompanionPetWrap, CompanionPetAura, CompanionPetEmoji,
  CompanionInfoBlock, CompanionNameRow, CompanionNameText, CompanionMoodText,
  CompanionLevelText, CompanionXPWrap, XPBarOuter, XPBarFill, XPLabelsRow,
  RightPanel, SectionEditBtn,
  BioFooter, BioCounter, BioActions, SecondaryBtn, PrimaryBtn, EmptyText,
  GuestBookOverlay, GBOverlayClose, GBHeader, GBTitle, BioErrorMsg,
  AboutOverlay, AboutOverlayScroll,
  SidePanelNav, SidePanelBtn, SidePanelBtnIcon, SidePanelBtnImg, SidePanelBtnLabel, SidePanelBtnArrow,
  SidePanelDivider, ClubSection, ClubSectionTitle, ClubCard, ClubAvatar, ClubInfo,
  ClubName, ClubNameMark, ClubRole, ClubViewBtn,
  BBContent,
  SkeletonLine, SkeletonCircle,
} from "../styles";

function SoulmateFullCard({ name, sub, onBreakUp, smBusy, smError }) {
  return (
    <SoulmateCard>
      <SoulmateHeartBg>♥</SoulmateHeartBg>
      <SoulmateAvatarWrap>
        <PlayerThumbnail playerName={name} size={44} />
      </SoulmateAvatarWrap>
      <SoulmateInfoBlock>
        <SoulmateName>{name} <SoulmateMark>♥</SoulmateMark></SoulmateName>
        <SoulmateDuration>{sub}</SoulmateDuration>
      </SoulmateInfoBlock>
      <SoulmateCardActions>
        <SmDangerBtn disabled={smBusy} onClick={onBreakUp}>Break Up</SmDangerBtn>
      </SoulmateCardActions>
      {smError && <SmError style={{ width: "100%", marginTop: 4 }}>{smError}</SmError>}
    </SoulmateCard>
  );
}

function SoulMate({ smState, isSelfView, targetUserId, currentUserId, smBusy, smError,
  smSendRequest, smAccept, smDecline, smCancel, smRemove, playerName }) {

  if (!currentUserId) return <SoulmateEmptyBox><SmEmpty>Sign in to use soul mates.</SmEmpty></SoulmateEmptyBox>;
  if (!smState) return (
    <SoulmateEmptyBox style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <SkeletonCircle $size="44px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonLine $h="14px" $w="55%" />
        <SkeletonLine $h="11px" $w="35%" />
      </div>
    </SoulmateEmptyBox>
  );

  const { mine, sent, received = [], target, relationship } = smState;

  if (isSelfView || !targetUserId) {
    if (mine) return <SoulmateFullCard name={mine.name} sub="Your Soul Mate" onBreakUp={smRemove} smBusy={smBusy} smError={smError} />;
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

  if (relationship === "soulmate") return <SoulmateFullCard name={playerName || "Player"} sub="Your Soul Mate" onBreakUp={smRemove} smBusy={smBusy} smError={smError} />;
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

export default function ProfileTab({
  playerName,
  bio, onSaveBio,
  editingBio, setEditingBio,
  bioDraft, setBioDraft,
  bioSaving, setBioSaving,
  bioError, setBioError,
  textareaRef,
  isSelfView,
  smState, smBusy, smError,
  smSendRequest, smAccept, smDecline, smCancel, smRemove,
  targetUserId, currentUserId, currentUserName,
  selectedBadge, handleBadgeClick, badgesExpanded, setBadgesExpanded, badgeSaving,
  showcaseItems,
  // ── Sticker guestbook ──────────────────────────────────────────
  gbOpen, setGbOpen,
  gbStickers,
  gbStickersLoading,
  gbPlacingAssetId, setGbPlacingAssetId,
  gbDeleteTarget, setGbDeleteTarget,
  canvasRef,
  onGbStickerSelect,
  onGbConfirm,
  onGbCancel,
  onGbDeleteConfirm,
  // ── Messages ───────────────────────────────────────────────────
  gbComments, gbLoading,
  gbInput, setGbInput,
  gbSubmitting,
  handleSubmitComment,
  handleDeleteComment,
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [stickerPage, setStickerPage] = useState(0);
  const [selectedMsgId, setSelectedMsgId] = useState(null);

  const MSG_MAX = 200;
  const PER_PAGE = 5;
  const totalPages = Math.ceil(STICKER_ASSETS.length / PER_PAGE);
  const pageStickers = STICKER_ASSETS.slice(stickerPage * PER_PAGE, (stickerPage + 1) * PER_PAGE);
  const stickersFull = (gbStickers?.length ?? 0) >= 100;
  const canPlace = !!currentUserId && !isSelfView && !stickersFull;

  const handleCloseAbout = () => {
    setAboutOpen(false);
    if (editingBio) {
      setEditingBio(false);
      setBioDraft(bio);
      setBioError(null);
    }
  };

  return (
    <>
      {/* ── Profile Content ── */}
      <ProfileContent>

        {/* Header */}
        <ProfileHeader>
          <HeaderThumbnailWrap>
            <PlayerThumbnail playerName={playerName} size={130} />
          </HeaderThumbnailWrap>
          <HeaderRight>
            <HeaderNameRow>
              <PlayerName>
                {playerName || "Player"}
                <PlayerNameMark> ✦</PlayerNameMark>
              </PlayerName>
              <LevelBadge>Lv. 78</LevelBadge>
            </HeaderNameRow>
            <HeaderMemberSince>Member since May 2024</HeaderMemberSince>
            <HeaderStatsRow>
              <HeaderStatBox>
                <HeaderStatTop>⭐ 1,204</HeaderStatTop>
                <HeaderStatLabel>Popularity</HeaderStatLabel>
              </HeaderStatBox>
              <HeaderStatBox>
                <HeaderStatTop>👥 48</HeaderStatTop>
                <HeaderStatLabel>Friends</HeaderStatLabel>
              </HeaderStatBox>
              <HeaderStatBox>
                <HeaderStatTop>♥ 320</HeaderStatTop>
                <HeaderStatLabel>Likes</HeaderStatLabel>
              </HeaderStatBox>
            </HeaderStatsRow>
          </HeaderRight>
        </ProfileHeader>

        {/* Badges */}
        <SectionBlock>
          <SectionHeaderRow>
            <SectionTitle>Badges</SectionTitle>
            <SectionCountPill>{badgesExpanded ? BADGES.length : Math.min(BADGES.length, 6)}</SectionCountPill>
          </SectionHeaderRow>
          <BadgesScrollWrap>
            <BadgesRow>
              {(badgesExpanded ? BADGES : BADGES.slice(0, 6)).map((name) => (
                <BadgeCard
                  key={name}
                  $selected={selectedBadge === name}
                  $clickable={!!handleBadgeClick}
                  $saving={badgeSaving}
                  $rarity={BADGE_RARITY[name] || "common"}
                  onClick={() => handleBadgeClick?.(name)}
                  title={handleBadgeClick ? (selectedBadge === name ? "Click to unselect" : "Click to display this badge") : name}
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
            <BadgeExpandBtn onClick={() => setBadgesExpanded(v => !v)}>
              {badgesExpanded ? "Show less ▲" : "Show all ▼"}
            </BadgeExpandBtn>
          )}
        </SectionBlock>

        {/* Soul Mate */}
        <SectionBlock>
          <SectionHeaderRow>
            <SectionTitle>Soulmate</SectionTitle>
          </SectionHeaderRow>
          <SoulMate
            smState={smState}
            isSelfView={isSelfView}
            targetUserId={targetUserId}
            currentUserId={currentUserId}
            smBusy={smBusy}
            smError={smError}
            smSendRequest={smSendRequest}
            smAccept={smAccept}
            smDecline={smDecline}
            smCancel={smCancel}
            smRemove={smRemove}
            playerName={playerName}
          />
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
              <CompanionLevelText>Level — · Familiar</CompanionLevelText>
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
        <SidePanelNav>
          <SidePanelBtn onClick={() => setAboutOpen(v => !v)}>
            <SidePanelBtnIcon><SidePanelBtnImg $src="/assets/menus/about.png" $size={22} /></SidePanelBtnIcon>
            <SidePanelBtnLabel>About</SidePanelBtnLabel>
            <SidePanelBtnArrow>›</SidePanelBtnArrow>
          </SidePanelBtn>
          <SidePanelBtn onClick={() => setGbOpen(v => !v)}>
            <SidePanelBtnIcon><SidePanelBtnImg $src="/assets/menus/guestbook.png" $size={22} /></SidePanelBtnIcon>
            <SidePanelBtnLabel>Guestbook</SidePanelBtnLabel>
            <SidePanelBtnArrow>›</SidePanelBtnArrow>
          </SidePanelBtn>
        </SidePanelNav>

        <SidePanelDivider />

        <ClubSectionTitle style={{ padding: "0 14px", marginBottom: 6 }}>Club</ClubSectionTitle>
        <ClubSection>
          <ClubCard>
            <ClubAvatar>🏛️</ClubAvatar>
            <ClubInfo>
              <ClubName>Neclis's</ClubName>
              <ClubRole>Member</ClubRole>
            </ClubInfo>
          </ClubCard>
          <ClubViewBtn>View Club</ClubViewBtn>
        </ClubSection>
      </RightPanel>

      {/* ── About Expanded Overlay ── */}
      <AboutOverlay $open={aboutOpen} onClick={(e) => e.stopPropagation()}>
        <GBOverlayClose onClick={handleCloseAbout}>&times;</GBOverlayClose>
        <GBHeader>
          <GBTitle>✦ ABOUT ✦</GBTitle>
        </GBHeader>
        <AboutOverlayScroll>
          {editingBio ? (
            <>
              <BBCodeEditor
                value={bioDraft}
                onChange={setBioDraft}
                textareaRef={textareaRef}
                disabled={bioSaving}
              />
              <BioFooter style={{ marginTop: 8 }}>
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
            <>
              {onSaveBio && (
                <SectionEditBtn
                  style={{ display: "block", marginBottom: 14 }}
                  onClick={() => { setBioDraft(bio); setBioError(null); setEditingBio(true); }}
                >
                  Edit
                </SectionEditBtn>
              )}
              {bio?.trim() ? (
                <BBContent dangerouslySetInnerHTML={{ __html: bbcodeToHtml(bio) }} />
              ) : (
                <BBContent><EmptyText>No bio yet.</EmptyText></BBContent>
              )}
            </>
          )}
        </AboutOverlayScroll>
      </AboutOverlay>

      {/* ── Sticker + Message Guestbook ── */}
      <GuestBookOverlay $open={gbOpen} onClick={(e) => e.stopPropagation()}>

        {/* ── Top header bar ── */}
        <GBModalHeader>
          <GBCloseBtn
            onClick={() => { onGbCancel?.(); setGbOpen(false); }}
            aria-label="Close guestbook"
          >
            ✕
          </GBCloseBtn>
          <GBBannerTitle>Guestbook</GBBannerTitle>
        </GBModalHeader>

        {/* ── Two-column body ── */}
        <GBTwoCol>

          {/* ── LEFT — Sticker Canvas ── */}
          <GBLeftWrap>
              {/* Phaser canvas */}
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

                {/* Sticker count badge — top-right corner of canvas */}
                <GBStickerCount>
                  ♥ {gbStickers?.length ?? 0} / 100
                </GBStickerCount>

                {/* Delete confirmation */}
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

              {/* Sticker tray — always visible */}
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

            {/* Compose */}
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

            {/* Messages list */}
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
      </GuestBookOverlay>
    </>
  );
}
