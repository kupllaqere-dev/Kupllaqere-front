import { STORE_LABELS, WL_RARITY } from "../constants";
import { HubPanelContainer, InvThumbImg, InvMidSection, InvItemName } from "../styles";
import {
  WishlistPanelInner,
  WishlistScrollArea, WishlistMsg, WishlistItemCard,
  WishlistNameRow, WishlistTag, WishlistRarityBadge, WishlistRemoveBtn,
} from "./WishlistTab.styles";

export default function WishlistTab({ items, loading, onRemove }) {
  return (
    <HubPanelContainer>
      <WishlistPanelInner>
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
