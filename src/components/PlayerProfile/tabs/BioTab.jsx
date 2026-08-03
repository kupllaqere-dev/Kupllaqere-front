import { Fragment, useEffect, useRef, useState } from "react";
import { BADGES, BADGE_RARITY } from "../constants";
import { HubPanelContainer } from "../styles";
import {
  ProfileContent,
  SectionBlock, SectionHeaderRow, SectionTitle,
  SectionCountPill,
  BadgesScrollWrap, BadgesRow, BadgeCard, BadgeCardIconWrap, BadgeImg, BadgeCardName, BadgeCardRarity, BadgeExpandBtn,
  CompanionCard, CompanionPetWrap, CompanionPetAura, CompanionPetEmoji,
  CompanionInfoBlock, CompanionNameRow, CompanionNameText, CompanionMoodText,
  CompanionLevelText, CompanionXPWrap, XPBarOuter, XPBarFill, XPLabelsRow,
  BioSectionsWrap, BioSection, BioSectionHeaderRow, BioSectionDragHandle,
  BioSectionTitle, BioSectionSeparator, BioSectionText,
  InfoColumnsRow, InfoColumn, InfoColumnTitle, InfoColumnSeparator, InfoColumnLine,
  ColumnDivider, FunFactsRow, FunFactItem, FunFactSymbol, FunFactText,
} from "./BioTab.styles";

// Uncontrolled contentEditable: only overwrite textContent while the field
// isn't focused, or every keystroke would reset the caret to the start as
// React reconciles the value prop.
function EditableField({ as: Component, editable, value, onCommit, ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    const next = value ?? "";
    if (ref.current.textContent !== next) ref.current.textContent = next;
  }, [value]);

  return (
    <Component
      ref={ref}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      $editable={editable}
      onInput={(e) => onCommit(e.currentTarget.textContent)}
      {...rest}
    />
  );
}

// Relative height split by position (not by section identity), so
// reordering sections carries the ratio along with the slot: 20% / 40% / 20% / 20%.
const HEIGHT_RATIOS = [20, 40, 20, 20];

function BioSections({
  sections = [], editable = false,
  onReorder,
  onUpdateTitle, onUpdateText,
  onUpdateInfoColumnTitle, onUpdateInfoColumnLine,
  onUpdateFunFactSymbol, onUpdateFunFactText,
}) {
  const dragIndexRef = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  return (
    <BioSectionsWrap>
      {sections.map((section, idx) => (
        <BioSection
          key={section.id}
          $flexGrow={HEIGHT_RATIOS[idx] ?? 20}
          $dragOver={editable && dragOverIdx === idx}
          $dragging={editable && draggingIdx === idx}
          onDragOver={(e) => {
            if (!editable) return;
            e.preventDefault();
            if (dragOverIdx !== idx) setDragOverIdx(idx);
          }}
          onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null); }}
          onDrop={(e) => {
            if (!editable) return;
            e.preventDefault();
            const from = dragIndexRef.current;
            dragIndexRef.current = null;
            setDragOverIdx(null);
            setDraggingIdx(null);
            if (from == null || from === idx) return;
            onReorder?.(from, idx);
          }}
        >
          {(editable || section.type !== "info") && (
            <BioSectionHeaderRow>
              {editable && (
                <BioSectionDragHandle
                  draggable
                  onDragStart={(e) => {
                    dragIndexRef.current = idx;
                    setDraggingIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => { dragIndexRef.current = null; setDraggingIdx(null); setDragOverIdx(null); }}
                  title="Drag to reorder"
                >
                  ✥
                </BioSectionDragHandle>
              )}
              {section.type !== "info" && (
                <EditableField
                  as={BioSectionTitle}
                  editable={editable}
                  value={section.title}
                  onCommit={(v) => onUpdateTitle?.(section.id, v)}
                />
              )}
            </BioSectionHeaderRow>
          )}

          {section.type !== "info" && <BioSectionSeparator />}

          {section.type === "info" ? (
            <InfoColumnsRow>
              {section.columns.map((col, ci) => (
                <Fragment key={ci}>
                  {ci > 0 && <ColumnDivider />}
                  <InfoColumn>
                    <EditableField
                      as={InfoColumnTitle}
                      editable={editable}
                      value={col.title}
                      onCommit={(v) => onUpdateInfoColumnTitle?.(section.id, ci, v)}
                    />
                    <InfoColumnSeparator />
                    {col.lines.map((line, li) => (
                      <EditableField
                        key={li}
                        as={InfoColumnLine}
                        editable={editable}
                        value={line}
                        onCommit={(v) => onUpdateInfoColumnLine?.(section.id, ci, li, v)}
                      />
                    ))}
                  </InfoColumn>
                </Fragment>
              ))}
            </InfoColumnsRow>
          ) : section.type === "funfacts" ? (
            <FunFactsRow>
              {section.columns.map((col, ci) => (
                <Fragment key={ci}>
                  {ci > 0 && <ColumnDivider />}
                  <FunFactItem>
                    <EditableField
                      as={FunFactSymbol}
                      editable={editable}
                      value={col.symbol}
                      onCommit={(v) => onUpdateFunFactSymbol?.(section.id, ci, v)}
                    />
                    <EditableField
                      as={FunFactText}
                      editable={editable}
                      value={col.text}
                      onCommit={(v) => onUpdateFunFactText?.(section.id, ci, v)}
                    />
                  </FunFactItem>
                </Fragment>
              ))}
            </FunFactsRow>
          ) : (
            <EditableField
              as={BioSectionText}
              editable={editable}
              value={section.text}
              onCommit={(v) => onUpdateText?.(section.id, v)}
            />
          )}
        </BioSection>
      ))}
    </BioSectionsWrap>
  );
}

export default function BioTab({
  selectedBadge, handleBadgeClick, badgesExpanded, setBadgesExpanded, badgeSaving,
  canvasEditable = false,
  bioSections = [], onReorderBioSections,
  onUpdateSectionTitle, onUpdateSectionText,
  onUpdateInfoColumnTitle, onUpdateInfoColumnLine,
  onUpdateFunFactSymbol, onUpdateFunFactText,
}) {
  return (
    <HubPanelContainer>
      <ProfileContent>

        <BioSections
          sections={bioSections}
          editable={canvasEditable}
          onReorder={onReorderBioSections}
          onUpdateTitle={onUpdateSectionTitle}
          onUpdateText={onUpdateSectionText}
          onUpdateInfoColumnTitle={onUpdateInfoColumnTitle}
          onUpdateInfoColumnLine={onUpdateInfoColumnLine}
          onUpdateFunFactSymbol={onUpdateFunFactSymbol}
          onUpdateFunFactText={onUpdateFunFactText}
        />

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
