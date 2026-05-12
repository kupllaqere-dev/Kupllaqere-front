import { STORE_LABELS, WL_RARITY } from "../constants";
import {
  HubPanelContainer, WishlistPanelInner, PanelHeaderRow, PanelTitle,
  WishlistScrollArea, WishlistMsg, WishlistItemCard, InvThumbImg, InvMidSection,
  WishlistNameRow, InvItemName, WishlistTag, WishlistRarityBadge, WishlistRemoveBtn,
} from "../styles";

export default function WishlistTab({ items, loading, onRemove }) {
  return (
    <HubPanelContainer>
      <WishlistPanelInner>
        <PanelHeaderRow style={{ padding: "14px 18px" }}>
          <PanelTitle>☆ Wishlist</PanelTitle>
        </PanelHeaderRow>
        <WishlistScrollArea>
          {loading && <WishlistMsg>Loading…</WishlistMsg>}
          {!loading && items.length === 0 && <WishlistMsg>Your wishlist is empty.</WishlistMsg>}
          {!loading && items.map(item => (
            <WishlistItemCard key={item.wishlistId}>
              <InvThumbImg
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.name}
                crossOrigin="anonymous"
              />
              <InvMidSection>
                <WishlistNameRow>
                  <InvItemName>{item.name}</InvItemName>
                  <WishlistTag>{STORE_LABELS[item.storeType] || item.storeType || "Store"}</WishlistTag>
                </WishlistNameRow>
                {item.rarity && WL_RARITY[item.rarity] && (
                  <WishlistRarityBadge $r={item.rarity}>
                    {WL_RARITY[item.rarity].label}
                  </WishlistRarityBadge>
                )}
              </InvMidSection>
              <WishlistRemoveBtn onClick={() => onRemove(item.itemId)} title="Remove">✕</WishlistRemoveBtn>
            </WishlistItemCard>
          ))}
        </WishlistScrollArea>
      </WishlistPanelInner>
    </HubPanelContainer>
  );
}
