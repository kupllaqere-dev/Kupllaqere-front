import { useState } from "react";
import { BIO_MAX, COMMENT_MAX } from "../constants";
import { formatRelativeTime } from "../utils";
import { bbcodeToHtml } from "../bbcode";
import BBCodeEditor from "../BBCodeEditor";
import PlayerThumbnail from "../../PlayerThumbnail";
import {
  ProfileContent, ProfileHeader, HeaderLeft, ProfileEmblem, EmblemDiamond,
  HeaderTitles, PlayerName, PlayerNameMark, ProfileMetaRow, LevelBadge, MetaSep,
  RankBadgeDiamond, ProfileStats, ProfileStat, ProfileStatVal, ProfileStatLbl,
  SectionBlock, SectionHeaderRow, SectionTitle,
  SoulmateEmptyBox, SmEmpty, SoulmateCard, SoulmateHeartBg, SoulmateAvatarWrap,
  SoulmateSpinRing, SoulmateInfoBlock, SoulmateName, SoulmateMark, SoulmateDuration,
  SoulmateMoodTag, SoulmateCardActions, SmDangerBtn, SmError, SmSub, SmRow, SmName,
  SmActions, SmPrimaryBtn, SmSecBtn, SmContent,
  RightPanel, RightSection, SectionEditBtn,
  BioFooter, BioCounter, BioActions, SecondaryBtn, PrimaryBtn, EmptyText,
  OrnamentDivider, OrnamentLine, OrnamentGem, GBToggleBtn, GBCountPill, GBToggleArrow,
  GBPreviewList, GBEmpty, GBPreviewCard, GBPreviewAvatarWrap, GBPreviewBody,
  GBPreviewMeta, GBPreviewName, GBPreviewTime, GBPreviewText, GBInputArea, GBInput,
  GBInputFooter, GBCounter, GuestBookOverlay, GBOverlayClose, GBHeader, GBTitle,
  GBSubtitle, GBHeaderControls, GBSortBtn, GBPinnedBtn, GBComposeArea, GBComposeRow,
  GBAvatarPlaceholder, GBComposeInputWrap, GBEmojiBtn, GBPostBtn, GBComposeTools,
  GBToolBtn, GBOrnamentDivider, GBDividerLine, GBDividerGem, GBOverlayScroll,
  GBCommentCard, GBCommentInner, GBCommentAvatarCol, GBCommentBody, GBCommentMeta,
  GBCommentName, GBCommentTime, GBCommentText, GBReactions, GBReactionBtn,
  GBCommentActions, CommentDeleteBtn, GBMenuDot, GBStatsFooter, GBStat, GBStatLabel,
  GBStatValue, GBStatDivider, GBLeaveGiftBtn, BioErrorMsg,
  AboutToggleBtn, AboutOverlay, AboutOverlayScroll,
  BBContent,
  SkeletonLine, SkeletonCircle,
} from "../styles";

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

  const FullCard = ({ name, sub, onBreakUp }) => (
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

      </ProfileContent>

      {/* ── Right Panel ── */}
      <RightPanel>

        {/* About */}
        <RightSection>
          <SectionHeaderRow>
            <SectionTitle>About</SectionTitle>
            <AboutToggleBtn
              $active={aboutOpen}
              onClick={() => setAboutOpen(v => !v)}
              title="View about"
            >
              ▸
            </AboutToggleBtn>
          </SectionHeaderRow>
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
