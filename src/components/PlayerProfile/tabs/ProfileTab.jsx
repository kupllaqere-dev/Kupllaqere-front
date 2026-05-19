import { useState } from "react";
import { BIO_MAX, COMMENT_MAX, BADGES, BADGE_RARITY } from "../constants";
import { formatRelativeTime } from "../utils";
import { bbcodeToHtml } from "../bbcode";
import BBCodeEditor from "../BBCodeEditor";
import PlayerThumbnail from "../../PlayerThumbnail";
import {
  ProfileContent, ProfileHeader, HeaderLeft,
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
  GBInput, GBEmpty,
  GBCounter, GuestBookOverlay, GBOverlayClose, GBHeader, GBTitle,
  GBSubtitle, GBHeaderControls, GBSortBtn, GBPinnedBtn, GBComposeArea, GBComposeRow,
  GBAvatarPlaceholder, GBComposeInputWrap, GBEmojiBtn, GBPostBtn, GBComposeTools,
  GBToolBtn, GBOrnamentDivider, GBDividerLine, GBDividerGem, GBOverlayScroll,
  GBCommentCard, GBCommentInner, GBCommentAvatarCol, GBCommentBody, GBCommentMeta,
  GBCommentName, GBCommentTime, GBCommentText, GBReactions, GBReactionBtn,
  GBCommentActions, CommentDeleteBtn, GBMenuDot, GBStatsFooter, GBStat, GBStatLabel,
  GBStatValue, GBStatDivider, GBLeaveGiftBtn, BioErrorMsg,
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
  targetUserId, currentUserId,
  selectedBadge, handleBadgeClick, badgesExpanded, setBadgesExpanded, badgeSaving,
  showcaseItems,
  gbOpen, setGbOpen,
  gbComments, gbLoading,
  gbInput, setGbInput,
  gbSubmitting,
  handleSubmitComment,
  handleDeleteComment,
  canComment,
}) {
  const [aboutOpen, setAboutOpen] = useState(false);

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
          <HeaderLeft>
            <PlayerName>
              {playerName || "Player"}
              <PlayerNameMark> ✦</PlayerNameMark>
            </PlayerName>
            <LevelBadge>Lv. 78</LevelBadge>
          </HeaderLeft>
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
    </>
  );
}
