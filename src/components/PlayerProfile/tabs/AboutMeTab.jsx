import { useRef } from "react";
import { BADGES, BADGE_RARITY } from "../constants";
import CanvasTextElement from "./CanvasTextElement";
import {
  HubPanelContainer,
  ProfileContent,
  CanvasSurface,
  SectionBlock, SectionHeaderRow, SectionTitle,
  SectionCountPill,
  BadgesScrollWrap, BadgesRow, BadgeCard, BadgeCardIconWrap, BadgeImg, BadgeCardName, BadgeCardRarity, BadgeExpandBtn,
  CompanionCard, CompanionPetWrap, CompanionPetAura, CompanionPetEmoji,
  CompanionInfoBlock, CompanionNameRow, CompanionNameText, CompanionMoodText,
  CompanionLevelText, CompanionXPWrap, XPBarOuter, XPBarFill, XPLabelsRow,
} from "../styles";

export default function AboutMeTab({
  selectedBadge, handleBadgeClick, badgesExpanded, setBadgesExpanded, badgeSaving,
  canvasElements = [], canvasEditable = false, selectedElementId = null,
  onSelectElement, onChangeElementHtml, onChangeElementFontSize, onMoveElement,
}) {
  const canvasSurfaceRef = useRef(null);

  return (
    <HubPanelContainer>
      <ProfileContent>

        <CanvasSurface
          ref={canvasSurfaceRef}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onSelectElement?.(null); }}
        >
          {canvasElements.map((el) => (
            <CanvasTextElement
              key={el.id}
              element={el}
              editable={canvasEditable}
              selected={canvasEditable && selectedElementId === el.id}
              onSelect={onSelectElement}
              onChangeHtml={onChangeElementHtml}
              onChangeFontSize={onChangeElementFontSize}
              onMove={onMoveElement}
              containerRef={canvasSurfaceRef}
            />
          ))}
        </CanvasSurface>

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
