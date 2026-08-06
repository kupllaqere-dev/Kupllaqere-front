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
  BioSectionTitle, BioSectionSeparator, BioSectionText, QuoteText,
  EditableRow, InfoRowDeleteBtn,
  InfoColumnsRow, InfoColumn, InfoColumnTitle, InfoColumnSeparator, InfoColumnLine,
  InfoColumnSettingsBtn, InfoColumnSettingsMenu, InfoColumnSettingsOption,
  InfoColumnLines, InfoColumnListItem, InfoColumnBullet,
  InfoTableRows, InfoTableRow, InfoTableKey, InfoTableValue,
  InfoTableStaticDivider, TitleDividerRow, TitleDividerLine,
  ColumnDivider, BadgeSlotsRow, BadgeSlot,
} from "./BioTab.styles";

const INFO_COLUMN_STYLES = [
  { key: "text", label: "Text" },
  { key: "list", label: "List" },
  { key: "table", label: "Table" },
];

// Info columns keep a fixed number of row slots so deleting a row shifts
// the rest up and leaves an empty placeholder instead of resizing the column.
const INFO_ROW_SLOTS = 4;

const sectionDividerVisible = (section) => section.titleDividerVisible !== false;

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

function InfoColumnBlock({
  column, sectionId, colIdx, editable,
  onUpdateTitle, onUpdateLine, onUpdateStyle,
  onUpdateRowKey, onUpdateRowValue, onDeleteSlot, onToggleTitleDivider,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const style = column.style || "text";
  const lines = column.lines || [];
  const rows = (column.rows && column.rows.length)
    ? column.rows
    : lines.map((line) => ({ key: "Key", value: line }));
  const titleDividerVisible = column.titleDividerVisible !== false;

  // In edit mode always walk a fixed number of slots so a deleted row's
  // spot is backfilled by the rows below it, padded with an empty
  // placeholder at the end instead of shrinking the column.
  const rowSlots = editable ? INFO_ROW_SLOTS : rows.length;
  const lineSlots = editable ? INFO_ROW_SLOTS : lines.length;

  return (
    <InfoColumn ref={wrapRef} $editable={editable}>
      {editable && (
        <>
          <InfoColumnSettingsBtn onClick={() => setMenuOpen(v => !v)} title="Column style">⚙</InfoColumnSettingsBtn>
          {menuOpen && (
            <InfoColumnSettingsMenu>
              {INFO_COLUMN_STYLES.map(opt => (
                <InfoColumnSettingsOption
                  key={opt.key}
                  $active={style === opt.key}
                  onClick={() => { onUpdateStyle?.(sectionId, colIdx, opt.key); setMenuOpen(false); }}
                >
                  {opt.label}
                </InfoColumnSettingsOption>
              ))}
            </InfoColumnSettingsMenu>
          )}
        </>
      )}

      <EditableRow $editable={editable}>
        <EditableField
          as={InfoColumnTitle}
          editable={editable}
          value={column.title}
          onCommit={(v) => onUpdateTitle?.(sectionId, colIdx, v)}
        />
        {editable && (
          <InfoRowDeleteBtn onClick={() => onUpdateTitle?.(sectionId, colIdx, "")} title="Clear title">×</InfoRowDeleteBtn>
        )}
      </EditableRow>
      {editable ? (
        <TitleDividerRow>
          <TitleDividerLine $visible={titleDividerVisible} />
          <InfoRowDeleteBtn
            onClick={() => onToggleTitleDivider?.(sectionId, colIdx)}
            title={titleDividerVisible ? "Remove divider" : "Add divider"}
          >
            {titleDividerVisible ? "×" : "+"}
          </InfoRowDeleteBtn>
        </TitleDividerRow>
      ) : (
        titleDividerVisible && <InfoColumnSeparator />
      )}

      {style === "table" ? (
        <InfoTableRows>
          {Array.from({ length: rowSlots }, (_, ri) => {
            const row = rows[ri];
            const isEmpty = !row || (!row.key && !row.value);
            return (
              <InfoTableRow key={ri} $divider={ri > 0} $editable={editable} $empty={isEmpty}>
                {ri > 0 && <InfoTableStaticDivider />}
                <EditableField
                  as={InfoTableKey}
                  editable={editable}
                  value={row?.key ?? ""}
                  data-placeholder="Key"
                  onCommit={(v) => onUpdateRowKey?.(sectionId, colIdx, ri, v)}
                />
                <EditableField
                  as={InfoTableValue}
                  editable={editable}
                  value={row?.value ?? ""}
                  data-placeholder="Value"
                  onCommit={(v) => onUpdateRowValue?.(sectionId, colIdx, ri, v)}
                />
                {editable && !isEmpty && (
                  <InfoRowDeleteBtn onClick={() => onDeleteSlot?.(sectionId, colIdx, ri)} title="Remove row">×</InfoRowDeleteBtn>
                )}
              </InfoTableRow>
            );
          })}
        </InfoTableRows>
      ) : style === "list" ? (
        <InfoColumnLines>
          {Array.from({ length: lineSlots }, (_, li) => {
            const line = lines[li];
            const isEmpty = !line;
            return (
              <EditableRow key={li} $editable={editable} $empty={isEmpty}>
                <InfoColumnListItem>
                  <InfoColumnBullet $empty={isEmpty}>•</InfoColumnBullet>
                  <EditableField
                    as={InfoColumnLine}
                    editable={editable}
                    value={line ?? ""}
                    $align="left"
                    data-placeholder="Add text…"
                    onCommit={(v) => onUpdateLine?.(sectionId, colIdx, li, v)}
                  />
                </InfoColumnListItem>
                {editable && !isEmpty && (
                  <InfoRowDeleteBtn onClick={() => onDeleteSlot?.(sectionId, colIdx, li)} title="Remove line">×</InfoRowDeleteBtn>
                )}
              </EditableRow>
            );
          })}
        </InfoColumnLines>
      ) : (
        <InfoColumnLines>
          {Array.from({ length: lineSlots }, (_, li) => {
            const line = lines[li];
            const isEmpty = !line;
            return (
              <EditableRow key={li} $editable={editable} $empty={isEmpty}>
                <EditableField
                  as={InfoColumnLine}
                  editable={editable}
                  value={line ?? ""}
                  data-placeholder="Add text…"
                  onCommit={(v) => onUpdateLine?.(sectionId, colIdx, li, v)}
                />
                {editable && !isEmpty && (
                  <InfoRowDeleteBtn onClick={() => onDeleteSlot?.(sectionId, colIdx, li)} title="Remove line">×</InfoRowDeleteBtn>
                )}
              </EditableRow>
            );
          })}
        </InfoColumnLines>
      )}
    </InfoColumn>
  );
}

// Relative height keyed by section type (not by position), so a section
// keeps its own size as it's dragged to a different spot in the list.
const HEIGHT_RATIOS = { welcome: 20, info: 40, quote: 20, badges: 20 };

function BioSections({
  sections = [], editable = false,
  onReorder,
  onUpdateTitle, onUpdateText,
  onUpdateInfoColumnTitle, onUpdateInfoColumnLine, onUpdateInfoColumnStyle,
  onUpdateInfoColumnRowKey, onUpdateInfoColumnRowValue, onDeleteInfoColumnSlot,
  onToggleInfoColumnTitleDivider, onToggleSectionTitleDivider,
}) {
  const dragIndexRef = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  return (
    <BioSectionsWrap>
      {sections.map((section, idx) => (
        <BioSection
          key={section.id}
          $flexGrow={HEIGHT_RATIOS[section.type] ?? 20}
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
                <EditableRow $editable={editable}>
                  <EditableField
                    as={BioSectionTitle}
                    editable={editable}
                    value={section.title}
                    onCommit={(v) => onUpdateTitle?.(section.id, v)}
                  />
                  {editable && (
                    <InfoRowDeleteBtn onClick={() => onUpdateTitle?.(section.id, "")} title="Clear title">×</InfoRowDeleteBtn>
                  )}
                </EditableRow>
              )}
            </BioSectionHeaderRow>
          )}

          {section.type !== "info" && (
            editable ? (
              <TitleDividerRow>
                <TitleDividerLine $visible={sectionDividerVisible(section)} $color="var(--pp-border2)" />
                <InfoRowDeleteBtn
                  onClick={() => onToggleSectionTitleDivider?.(section.id)}
                  title={sectionDividerVisible(section) ? "Remove divider" : "Add divider"}
                >
                  {sectionDividerVisible(section) ? "×" : "+"}
                </InfoRowDeleteBtn>
              </TitleDividerRow>
            ) : (
              sectionDividerVisible(section) && <BioSectionSeparator />
            )
          )}

          {section.type === "info" ? (
            <InfoColumnsRow>
              {section.columns.map((col, ci) => (
                <Fragment key={ci}>
                  {ci > 0 && <ColumnDivider />}
                  <InfoColumnBlock
                    column={col}
                    sectionId={section.id}
                    colIdx={ci}
                    editable={editable}
                    onUpdateTitle={onUpdateInfoColumnTitle}
                    onUpdateLine={onUpdateInfoColumnLine}
                    onUpdateStyle={onUpdateInfoColumnStyle}
                    onUpdateRowKey={onUpdateInfoColumnRowKey}
                    onUpdateRowValue={onUpdateInfoColumnRowValue}
                    onDeleteSlot={onDeleteInfoColumnSlot}
                    onToggleTitleDivider={onToggleInfoColumnTitleDivider}
                  />
                </Fragment>
              ))}
            </InfoColumnsRow>
          ) : section.type === "badges" ? (
            <BadgeSlotsRow>
              {(section.slots || []).map((slot, si) => (
                <BadgeSlot key={si} />
              ))}
            </BadgeSlotsRow>
          ) : section.type === "quote" ? (
            <EditableRow $editable={editable}>
              <EditableField
                as={QuoteText}
                editable={editable}
                value={section.text}
                onCommit={(v) => onUpdateText?.(section.id, v)}
                data-placeholder="Add a favorite quote…"
              />
              {editable && (
                <InfoRowDeleteBtn onClick={() => onUpdateText?.(section.id, "")} title="Clear text">×</InfoRowDeleteBtn>
              )}
            </EditableRow>
          ) : (
            <EditableRow $editable={editable}>
              <EditableField
                as={BioSectionText}
                editable={editable}
                value={section.text}
                onCommit={(v) => onUpdateText?.(section.id, v)}
              />
              {editable && (
                <InfoRowDeleteBtn onClick={() => onUpdateText?.(section.id, "")} title="Clear text">×</InfoRowDeleteBtn>
              )}
            </EditableRow>
          )}
        </BioSection>
      ))}
    </BioSectionsWrap>
  );
}

export default function BioTab({
  canvasEditable = false,
  bioSections = [], onReorderBioSections,
  onUpdateSectionTitle, onUpdateSectionText,
  onUpdateInfoColumnTitle, onUpdateInfoColumnLine, onUpdateInfoColumnStyle,
  onUpdateInfoColumnRowKey, onUpdateInfoColumnRowValue, onDeleteInfoColumnSlot,
  onToggleInfoColumnTitleDivider, onToggleSectionTitleDivider,
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
          onUpdateInfoColumnStyle={onUpdateInfoColumnStyle}
          onUpdateInfoColumnRowKey={onUpdateInfoColumnRowKey}
          onUpdateInfoColumnRowValue={onUpdateInfoColumnRowValue}
          onDeleteInfoColumnSlot={onDeleteInfoColumnSlot}
          onToggleInfoColumnTitleDivider={onToggleInfoColumnTitleDivider}
          onToggleSectionTitleDivider={onToggleSectionTitleDivider}
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
