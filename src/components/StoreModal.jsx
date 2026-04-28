import { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import AvatarCanvas from "./AvatarCanvas";
import { fetchStoreItems, purchaseItems } from "../api/store";

const CATEGORY_LABELS = {
  tops: "Tops",
  bottoms: "Bottoms",
  onePiece: "One Piece",
  coats: "Coats",
  head: "Head",
  hair: "Hair",
  accessories: "Accessories",
  feet: "Feet",
  hands: "Hands",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function StoreModal({ onClose, gender, coins, gems, currentOutfit, onPurchaseComplete }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [groups, setGroups] = useState([]);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [previewOutfit, setPreviewOutfit] = useState(currentOutfit || {});
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadItems = useCallback(async (cat, pg, reset) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchStoreItems({ category: cat === "all" ? "" : cat, page: pg });
      setGroups((prev) => reset ? data.groups : [...prev, ...data.groups]);
      setOwnedIds((prev) => {
        const next = reset ? new Set(data.ownedIds) : new Set([...prev, ...data.ownedIds]);
        return next;
      });
      setHasMore(data.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setGroups([]);
    setPage(1);
    setExpandedGroup(null);
    loadItems(activeCategory, 1, true);
  }, [activeCategory, loadItems]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadItems(activeCategory, nextPage, false);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, page, activeCategory, loadItems]);

  const toggleGroup = (key) => setExpandedGroup((prev) => (prev === key ? null : key));

  const selectVariant = (item) => {
    if (ownedIds.has(String(item._id))) return;
    setPreviewOutfit((prev) => ({ ...prev, [item.category]: { imageUrl: item.imageUrl } }));
    setCart((prev) => [...prev.filter((c) => c.category !== item.category), item]);
    setPurchaseError(null);
    setPurchaseSuccess(false);
  };

  const removeFromCart = (item) => {
    setCart((prev) => prev.filter((c) => c._id !== item._id));
    setPreviewOutfit((prev) => {
      const next = { ...prev };
      if (currentOutfit?.[item.category]) next[item.category] = currentOutfit[item.category];
      else delete next[item.category];
      return next;
    });
  };

  const handleBuy = async (currency) => {
    if (cart.length === 0) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const result = await purchaseItems({ itemIds: cart.map((i) => i._id), currency });
      setOwnedIds((prev) => {
        const next = new Set(prev);
        result.purchasedIds.forEach((id) => next.add(String(id)));
        return next;
      });
      setCart([]);
      setPurchaseSuccess(true);
      onPurchaseComplete?.(result);
    } catch (err) {
      setPurchaseError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const cartTotal = cart.length;
  const canAffordCoins = coins >= cartTotal;
  const canAffordGems = gems >= cartTotal;

  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Store</Title>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>
        </Header>

        <Body>
          {/* Left: category sidebar */}
          <Sidebar>
            <CatBtn $active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All</CatBtn>
            {CATEGORIES.map((cat) => (
              <CatBtn key={cat} $active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
                {CATEGORY_LABELS[cat]}
              </CatBtn>
            ))}
          </Sidebar>

          {/* Center: item grid */}
          <ItemArea>
            {groups.length === 0 && !loading && <EmptyMsg>No items available.</EmptyMsg>}
            {groups.map((group) => {
              const groupKey = `${group.name}__${group.category}`;
              const isExpanded = expandedGroup === groupKey;
              const firstVariant = group.variants[0];
              const allOwned = group.variants.every((v) => ownedIds.has(String(v._id)));

              return (
                <GroupWrapper key={groupKey}>
                  <GroupCard
                    $owned={allOwned}
                    onClick={() => group.variants.length > 1 ? toggleGroup(groupKey) : selectVariant(firstVariant)}
                  >
                    <Thumb src={firstVariant.thumbnailUrl || firstVariant.imageUrl} alt={group.name} crossOrigin="anonymous" />
                    <GroupInfo>
                      <GroupName>{group.name}</GroupName>
                      <GroupSub>{CATEGORY_LABELS[group.category] || group.category}</GroupSub>
                      {group.variants.length > 1 && (
                        <VariantCount>{group.variants.length} variants {isExpanded ? "▲" : "▼"}</VariantCount>
                      )}
                    </GroupInfo>
                    <PriceTag>
                      {allOwned ? (
                        <OwnedLabel>Owned</OwnedLabel>
                      ) : (
                        <PriceInner>
                          <PriceRow><CoinIcon src="/icons/coin.png" alt="coin" />1</PriceRow>
                          <PriceOr>or</PriceOr>
                          <PriceRow><GemIcon src="/icons/gem.png" alt="gem" />1</PriceRow>
                        </PriceInner>
                      )}
                    </PriceTag>
                  </GroupCard>

                  {isExpanded && (
                    <VariantRow>
                      {group.variants.map((v) => {
                        const owned = ownedIds.has(String(v._id));
                        const inCart = cart.some((c) => c._id === v._id);
                        return (
                          <VariantThumb key={v._id} $owned={owned} $selected={inCart}
                            onClick={() => !owned && selectVariant(v)}
                            title={owned ? "Already owned" : v.name}
                          >
                            <img src={v.thumbnailUrl || v.imageUrl} alt={v.name} crossOrigin="anonymous" />
                            {owned && <OwnedOverlay>✓</OwnedOverlay>}
                            {inCart && !owned && <SelectedOverlay>✓</SelectedOverlay>}
                          </VariantThumb>
                        );
                      })}
                    </VariantRow>
                  )}
                </GroupWrapper>
              );
            })}
            {loading && <LoadingMsg>Loading…</LoadingMsg>}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </ItemArea>

          {/* Right: avatar panel */}
          <RightPanel>
            <AvatarFill>
              <AvatarCanvas gender={gender} outfit={previewOutfit} width={320} height={722} />
            </AvatarFill>

            <RightBottom>
              <BalanceRow>
                <BalanceItem><img src="/icons/coin.png" alt="coins" />{(coins ?? 0).toLocaleString()}</BalanceItem>
                <BalanceItem><img src="/icons/gem.png" alt="gems" />{(gems ?? 0).toLocaleString()}</BalanceItem>
              </BalanceRow>
              <CartBtn onClick={() => setCartOpen(true)}>
                Cart{cartTotal > 0 ? ` (${cartTotal})` : ""}
                {cartTotal > 0 && <CartDot />}
              </CartBtn>
            </RightBottom>

            {/* Cart overlay */}
            {cartOpen && (
              <CartOverlay onClick={() => setCartOpen(false)}>
                <CartPanel onClick={(e) => e.stopPropagation()}>
                  <CartHeader>
                    <CartTitle>Cart ({cartTotal})</CartTitle>
                    <CloseCartBtn onClick={() => setCartOpen(false)}>&times;</CloseCartBtn>
                  </CartHeader>

                  {cart.length === 0 && <CartEmpty>No items in cart.</CartEmpty>}
                  <CartList>
                    {cart.map((item) => (
                      <CartItem key={item._id}>
                        <CartThumb src={item.thumbnailUrl || item.imageUrl} alt={item.name} crossOrigin="anonymous" />
                        <CartItemName>{item.name}</CartItemName>
                        <RemoveBtn onClick={() => removeFromCart(item)}>×</RemoveBtn>
                      </CartItem>
                    ))}
                  </CartList>

                  {cart.length > 0 && (
                    <>
                      <CostLine>Total: <strong>{cartTotal}</strong> coin{cartTotal !== 1 ? "s" : ""} or gem{cartTotal !== 1 ? "s" : ""}</CostLine>
                      {purchaseError && <ErrorMsg>{purchaseError}</ErrorMsg>}
                      {purchaseSuccess && <SuccessMsg>Purchased!</SuccessMsg>}
                      <BuyRow>
                        <BuyBtn onClick={() => handleBuy("coins")} disabled={purchasing || !canAffordCoins}
                          title={!canAffordCoins ? `Need ${cartTotal} coins, have ${coins}` : ""}>
                          <img src="/icons/coin.png" alt="" />
                          {purchasing ? "…" : `Buy with ${cartTotal} coin${cartTotal !== 1 ? "s" : ""}`}
                        </BuyBtn>
                        <BuyBtn $gem onClick={() => handleBuy("gems")} disabled={purchasing || !canAffordGems}
                          title={!canAffordGems ? `Need ${cartTotal} gems, have ${gems}` : ""}>
                          <img src="/icons/gem.png" alt="" />
                          {purchasing ? "…" : `Buy with ${cartTotal} gem${cartTotal !== 1 ? "s" : ""}`}
                        </BuyBtn>
                      </BuyRow>
                    </>
                  )}
                </CartPanel>
              </CartOverlay>
            )}
          </RightPanel>
        </Body>
      </Container>
    </Overlay>
  );
}

export default StoreModal;

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  background: #13131f;
  border: 1px solid #ffffff1a;
  border-radius: 16px;
  width: min(85vw, 96vh * 1.5);
  max-width: 96vw;
  max-height: 96vh;
  height: 96vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 60px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  color: #fff;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #ffffff12;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #c471ed, #7b2ff7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 26px;
  cursor: pointer;
  line-height: 1;
  &:hover { color: #fff; }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 140px;
  flex-shrink: 0;
  border-right: 1px solid #ffffff10;
  padding: 12px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CatBtn = styled.button`
  background: ${(p) => p.$active ? "linear-gradient(135deg, #7b2ff7, #c471ed)" : "transparent"};
  border: 1px solid ${(p) => p.$active ? "#7b2ff7" : "#ffffff14"};
  color: ${(p) => p.$active ? "#fff" : "#888"};
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.12s;
  &:hover { color: #fff; border-color: #7b2ff7; }
`;

const ItemArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EmptyMsg = styled.div`
  text-align: center;
  color: #555;
  padding: 40px 0;
  font-size: 14px;
`;

const LoadingMsg = styled.div`
  text-align: center;
  color: #555;
  padding: 16px 0;
  font-size: 13px;
`;

const GroupWrapper = styled.div``;

const GroupCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.$owned ? "#ffffff0a" : "#ffffff14"};
  background: ${(p) => p.$owned ? "#0d0d1a" : "#18182a"};
  cursor: pointer;
  transition: all 0.12s;
  opacity: ${(p) => p.$owned ? 0.6 : 1};
  &:hover { border-color: ${(p) => p.$owned ? "#ffffff14" : "#7b2ff7"}; }
`;

const Thumb = styled.img`
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: 6px;
  background: #0c0c18;
  flex-shrink: 0;
`;

const GroupInfo = styled.div`flex: 1; min-width: 0;`;

const GroupName = styled.div`
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GroupSub = styled.div`font-size: 11px; color: #666; margin-top: 2px;`;

const VariantCount = styled.div`font-size: 10px; color: #7b2ff7; margin-top: 3px;`;

const PriceTag = styled.div`flex-shrink: 0; text-align: right;`;

const PriceInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #ccc;
`;

const CoinIcon = styled.img`width: 14px; height: 14px; object-fit: contain;`;
const GemIcon = styled.img`width: 14px; height: 14px; object-fit: contain;`;
const PriceOr = styled.div`font-size: 9px; color: #444;`;
const OwnedLabel = styled.div`font-size: 11px; font-weight: 600; color: #555;`;

const VariantRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px 12px 8px 76px;
  flex-wrap: wrap;
`;

const VariantThumb = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 7px;
  overflow: hidden;
  cursor: ${(p) => p.$owned ? "default" : "pointer"};
  border: 2px solid ${(p) => p.$selected ? "#7b2ff7" : p.$owned ? "#ffffff10" : "#ffffff1a"};
  background: #0c0c18;
  transition: all 0.12s;
  opacity: ${(p) => p.$owned ? 0.5 : 1};
  &:hover { border-color: ${(p) => p.$owned ? "#ffffff10" : "#7b2ff7"}; }
  img { width: 100%; height: 100%; object-fit: contain; }
`;

const OwnedOverlay = styled.div`
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #666;
`;

const SelectedOverlay = styled.div`
  position: absolute; inset: 0;
  background: rgba(123,47,247,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #c4a1ff;
`;

const RightPanel = styled.div`
  width: 370px;
  flex-shrink: 0;
  border-left: 1px solid #ffffff10;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const AvatarFill = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 12px 0 4px;
`;

const RightBottom = styled.div`
  padding: 10px 16px 14px;
  border-top: 1px solid #ffffff0e;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const BalanceRow = styled.div`
  display: flex;
  gap: 12px;
  flex: 1;
`;

const BalanceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  img { width: 16px; height: 16px; object-fit: contain; }
`;

const CartBtn = styled.button`
  position: relative;
  padding: 9px 18px;
  border-radius: 9px;
  border: 1px solid rgba(123,47,247,0.6);
  background: rgba(123,47,247,0.25);
  color: #c4a1ff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
  &:hover { background: rgba(123,47,247,0.45); }
`;

const CartDot = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b6b;
`;

/* ── Cart overlay ── */

const CartOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10;
  display: flex;
  align-items: flex-end;
`;

const CartPanel = styled.div`
  width: 100%;
  background: #1a1a2e;
  border-top: 1px solid #ffffff18;
  border-radius: 14px 14px 0 0;
  padding: 18px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 70%;
  overflow-y: auto;
`;

const CartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CartTitle = styled.div`font-size: 15px; font-weight: 700; color: #fff;`;

const CloseCartBtn = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  &:hover { color: #fff; }
`;

const CartEmpty = styled.div`font-size: 13px; color: #555; text-align: center; padding: 8px 0;`;

const CartList = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const CartItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #12121f;
  border-radius: 8px;
  padding: 7px 10px;
`;

const CartThumb = styled.img`
  width: 36px; height: 36px;
  object-fit: contain;
  border-radius: 5px;
  background: #0c0c18;
  flex-shrink: 0;
`;

const CartItemName = styled.div`
  font-size: 13px;
  color: #ccc;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #555;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  &:hover { color: #ff6b6b; }
`;

const CostLine = styled.div`
  font-size: 13px;
  color: #888;
  strong { color: #fff; }
`;

const ErrorMsg = styled.div`font-size: 12px; color: #ff7777;`;
const SuccessMsg = styled.div`font-size: 12px; color: #7bff9e; font-weight: 600;`;

const BuyRow = styled.div`display: flex; gap: 8px;`;

const BuyBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 9px;
  border: 1px solid ${(p) => p.$gem ? "rgba(124,210,255,0.4)" : "rgba(255,200,50,0.4)"};
  background: ${(p) => p.$gem ? "rgba(124,210,255,0.1)" : "rgba(255,200,50,0.1)"};
  color: ${(p) => p.$gem ? "#7cd2ff" : "#ffc832"};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s;
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.8; }
  img { width: 16px; height: 16px; object-fit: contain; }
`;
