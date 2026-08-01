import { BIO_MAX, BADGES, BADGE_RARITY } from "../constants";
import { bbcodeToHtml } from "../bbcode";
import BBCodeEditor from "../BBCodeEditor";
import {
  HubPanelContainer,
  ProfileContent,
  SectionBlock, SectionHeaderRow, SectionTitle,
  SectionEditBtn, SectionCountPill,
  BadgesScrollWrap, BadgesRow, BadgeCard, BadgeCardIconWrap, BadgeImg, BadgeCardName, BadgeCardRarity, BadgeExpandBtn,
  CompanionCard, CompanionPetWrap, CompanionPetAura, CompanionPetEmoji,
  CompanionInfoBlock, CompanionNameRow, CompanionNameText, CompanionMoodText,
  CompanionLevelText, CompanionXPWrap, XPBarOuter, XPBarFill, XPLabelsRow,
  BioFooter, BioCounter, BioActions, SecondaryBtn, PrimaryBtn, EmptyText,
  BioErrorMsg,
  BBContent,
} from "../styles";

export default function AboutMeTab({
  bio, onSaveBio,
  editingBio, setEditingBio,
  bioDraft, setBioDraft,
  bioSaving, setBioSaving,
  bioError, setBioError,
  textareaRef,
  isSelfView,
  selectedBadge, handleBadgeClick, badgesExpanded, setBadgesExpanded, badgeSaving,
}) {
  return (
    <HubPanelContainer>
      <ProfileContent>

        {/* About Me / Bio */}
        <SectionBlock>
          <SectionHeaderRow style={{ justifyContent: "flex-end" }}>
            {isSelfView && onSaveBio && !editingBio && (
              <SectionEditBtn
                onClick={() => { setBioDraft(bio); setBioError(null); setEditingBio(true); }}
              >
                Edit
              </SectionEditBtn>
            )}
          </SectionHeaderRow>
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
          ) : bio?.trim() ? (
            <BBContent dangerouslySetInnerHTML={{ __html: bbcodeToHtml(bio) }} />
          ) : (
            <BBContent><EmptyText>No bio yet.</EmptyText></BBContent>
          )}
        </SectionBlock>

        {/* TODO: re-enable badges when ready
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
        */}

        {/* TODO: re-enable companion when ready
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
        */}

      </ProfileContent>
    </HubPanelContainer>
  );
}
