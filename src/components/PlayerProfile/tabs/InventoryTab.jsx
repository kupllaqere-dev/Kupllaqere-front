import {
  INV_CATEGORIES, INV_CATEGORY_LABELS, INV_CATEGORY_SUBCATEGORIES,
  INV_SUBCATEGORY_LABELS, INV_CATEGORY_DECO,
} from "../constants";
import { invGetSellPrice } from "../utils";
import {
  InvContentCol, InvCatScroll, InvMsg, InvQuickNavRow, InvQuickNavBtn, InvQuickNavLabel,
  InvQuickNavRight, InvQuickNavCount, InvQuickNavArrow, InvCatGrid, InvCatCard, InvCatDeco,
  InvCatCardTop, InvCatLabel, InvCatArrow, InvCatSubList, InvCatSubItem, InvSubCount,
  InvItemScroll, InvErrTxt, InvItemList, InvItemCard, InvThumbImg, InvMidSection,
  InvItemName, InvWearingBadge, InvLockTxt, InvPricesArea, InvPricePanel, InvLevelBadge,
  InvBadgeAndPrice, InvCoinImg, InvPriceAmt, InvSellPanel,
  InvBreadcrumbCol, InvCrumbStep,
} from "../styles";

export function InvItemsArea({
  items, loading, view, isSelected, canUse, toggleEntry,
  selling, sellError, onSell, goToCategory, goToSubcategory,
  subCount, goToRecent, goToEquipped, recentCount, equippedCount,
}) {
  const isListView = view === "items" || view === "recentlyAdded" || view === "equipped";
  const emptyMsg = view === "equipped" ? "Nothing equipped." : "No items in this category.";

  return (
    <InvContentCol>
      {view === "categories" && (
        <InvCatScroll>
          {loading && <InvMsg>Loading…</InvMsg>}

          <InvQuickNavRow>
            <InvQuickNavBtn onClick={goToRecent}>
              <InvQuickNavLabel>Recently Added</InvQuickNavLabel>
              <InvQuickNavRight>
                <InvQuickNavCount>{recentCount}</InvQuickNavCount>
                <InvQuickNavArrow>→</InvQuickNavArrow>
              </InvQuickNavRight>
            </InvQuickNavBtn>
            <InvQuickNavBtn onClick={goToEquipped}>
              <InvQuickNavLabel>Equipped</InvQuickNavLabel>
              <InvQuickNavRight>
                <InvQuickNavCount>{equippedCount}</InvQuickNavCount>
                <InvQuickNavArrow>→</InvQuickNavArrow>
              </InvQuickNavRight>
            </InvQuickNavBtn>
          </InvQuickNavRow>

          <InvCatGrid>
            {INV_CATEGORIES.map(cat => (
              <InvCatCard key={cat}>
                <InvCatDeco src={INV_CATEGORY_DECO[cat]} alt="" />
                <InvCatCardTop onClick={() => goToCategory(cat)}>
                  <InvCatLabel>{INV_CATEGORY_LABELS[cat].toUpperCase()}</InvCatLabel>
                  <InvCatArrow>→</InvCatArrow>
                </InvCatCardTop>
                <InvCatSubList>
                  {INV_CATEGORY_SUBCATEGORIES[cat].map(sub => {
                    const cnt = subCount(cat, sub);
                    return (
                      <InvCatSubItem key={sub} onClick={() => goToSubcategory(cat, sub)}>
                        {INV_SUBCATEGORY_LABELS[sub] || sub}
                        {cnt > 0 && <InvSubCount>({cnt})</InvSubCount>}
                      </InvCatSubItem>
                    );
                  })}
                </InvCatSubList>
              </InvCatCard>
            ))}
          </InvCatGrid>
        </InvCatScroll>
      )}

      {isListView && (
        <InvItemScroll>
          {sellError && <InvErrTxt>{sellError}</InvErrTxt>}
          {!loading && items.length === 0 && <InvMsg>{emptyMsg}</InvMsg>}
          <InvItemList>
            {items.map(entry => {
              const selected = isSelected(entry);
              const usable = canUse(entry);
              const sp = invGetSellPrice(entry);
              const isSelling = selling === entry._id;
              return (
                <InvItemCard key={entry._id} $expanded={selected} $locked={!usable} onClick={() => toggleEntry(entry)}>
                  <InvThumbImg src={entry.thumbnailUrl || entry.imageUrl} alt={entry.name} crossOrigin="anonymous" />
                  <InvMidSection>
                    <InvItemName>{entry.name}</InvItemName>
                    {selected && <InvWearingBadge>Wearing</InvWearingBadge>}
                    {!usable && <InvLockTxt>Level {entry.levelRequirement} required</InvLockTxt>}
                  </InvMidSection>
                  <InvPricesArea>
                    <InvPricePanel>
                      {!usable && <InvLevelBadge>Level {entry.levelRequirement}</InvLevelBadge>}
                      <InvBadgeAndPrice>
                        <InvCoinImg src="/icons/Nectar.png" alt="coins" />
                        <InvPriceAmt>{sp.toLocaleString()}</InvPriceAmt>
                      </InvBadgeAndPrice>
                    </InvPricePanel>
                    <InvSellPanel onClick={e => onSell(entry, e)} disabled={isSelling}>
                      {isSelling ? "…" : "SELL"}
                    </InvSellPanel>
                  </InvPricesArea>
                </InvItemCard>
              );
            })}
          </InvItemList>
          {loading && <InvMsg>Loading…</InvMsg>}
        </InvItemScroll>
      )}
    </InvContentCol>
  );
}

export function InvBreadcrumbsBar({ crumbs }) {
  return (
    <InvBreadcrumbCol>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const clickable = !isLast && !!c.onClick;
        return (
          <InvCrumbStep key={i} $active={isLast} $clickable={clickable} onClick={clickable ? c.onClick : undefined}>
            {c.label}
          </InvCrumbStep>
        );
      })}
    </InvBreadcrumbCol>
  );
}
