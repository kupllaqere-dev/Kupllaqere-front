import { useState, useEffect, useRef, useCallback } from "react";
import styled, { css, keyframes } from "styled-components";
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

const CATEGORY_ICONS = {
  tops: "👕", bottoms: "👖", onePiece: "👗", coats: "🧥",
  head: "🎩", hair: "✂️", accessories: "💍", feet: "👟", hands: "🧤",
};

const CATEGORY_DECO = {
  tops: "/assets/store/tops.png",
  bottoms: "/assets/store/bottoms.png",
  onePiece: "/assets/store/onepiece.png",
  coats: "/assets/store/coats.png",
  head: "/assets/store/head.png",
  hair: "/assets/store/hair.png",
  accessories: "/assets/store/accessories.png",
  feet: "/assets/store/feet.png",
  hands: "/assets/store/hands.png",
};

const SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve",
  sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations",
  horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear",
  necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
};

const CATEGORY_SUBCATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts"],
  onePiece: ["overall", "dress"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
};

const RARITY = {
  nonRare:  { label: "Common",     bg: "rgba(120,90,180,0.1)",   border: "rgba(120,90,180,0.22)", color: "#7c5cbf" },
  rare:     { label: "Rare",       bg: "rgba(109,40,217,0.1)",   border: "rgba(109,40,217,0.3)",  color: "#7c3aed" },
  superRare:{ label: "Super Rare", bg: "rgba(217,119,6,0.1)",    border: "rgba(217,119,6,0.3)",   color: "#b45309" },
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function StoreModal({ onClose, gender, coins, gems, currentOutfit, onPurchaseComplete }) {
  const [view, setView] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState(null);
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

  const loadItems = useCallback(async (cat, sub, pg, reset, sort) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchStoreItems({ category: cat || "", subcategory: sub || "", page: pg, sort: sort || "" });
      setGroups(prev => reset ? data.groups : [...prev, ...data.groups]);
      setOwnedIds(prev => {
        const base = reset ? new Set() : new Set(prev);
        data.ownedIds.forEach(id => base.add(String(id)));
        return base;
      });
      setHasMore(data.hasMore);
    } catch { /* ignore */ }
    finally { setLoading(false); loadingRef.current = false; }
  }, []);

  useEffect(() => {
    if (view !== "items") return;
    setGroups([]); setPage(1); setExpandedGroup(null);
    loadItems(selectedCategory, selectedSubcategory, 1, true, sortBy);
  }, [view, selectedCategory, selectedSubcategory, sortBy, loadItems]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || view !== "items") return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        const next = page + 1;
        setPage(next);
        loadItems(selectedCategory, selectedSubcategory, next, false, sortBy);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, page, selectedCategory, selectedSubcategory, sortBy, view, loadItems]);

  const displayGroups = selectedSubcategory
    ? groups.filter(g => g.variants.some(v => v.subcategory === selectedSubcategory))
    : groups;

  const goHome = () => { setView("home"); setSelectedCategory(null); setSelectedSubcategory(null); setSortBy(null); };
  const goCategories = () => { setView("categories"); setSelectedCategory(null); setSelectedSubcategory(null); setSortBy(null); };
  const goToCategory = cat => { setSelectedCategory(cat); setSelectedSubcategory(null); setSortBy(null); setView("items"); };
  const goToSubcategory = (cat, sub) => { setSelectedCategory(cat); setSelectedSubcategory(sub); setSortBy(null); setView("items"); };
  const goToNew = () => { setSelectedCategory(null); setSelectedSubcategory(null); setSortBy("newest"); setView("items"); };

  const toggleGroup = key => setExpandedGroup(prev => prev === key ? null : key);

  const selectVariant = item => {
    if (ownedIds.has(String(item._id))) return;
    setPreviewOutfit(prev => ({ ...prev, [item.category]: { imageUrl: item.imageUrl } }));
    setCart(prev => [...prev.filter(c => c.category !== item.category), item]);
    setPurchaseError(null); setPurchaseSuccess(false);
  };

  const removeFromCart = item => {
    setCart(prev => prev.filter(c => c._id !== item._id));
    setPreviewOutfit(prev => {
      const next = { ...prev };
      if (currentOutfit?.[item.category]) next[item.category] = currentOutfit[item.category];
      else delete next[item.category];
      return next;
    });
  };

  const handleBuy = async currency => {
    if (!cart.length) return;
    setPurchasing(true); setPurchaseError(null);
    try {
      const result = await purchaseItems({ itemIds: cart.map(i => i._id), currency });
      setOwnedIds(prev => { const n = new Set(prev); result.purchasedIds.forEach(id => n.add(String(id))); return n; });
      setCart([]); setPurchaseSuccess(true); onPurchaseComplete?.(result);
    } catch (err) { setPurchaseError(err.message); }
    finally { setPurchasing(false); }
  };

  const cartTotal = cart.length;
  const canAffordCoins = coins >= cartTotal;
  const canAffordGems = gems >= cartTotal;

  const isNewItems = view === "items" && !selectedCategory && sortBy === "newest";

  const crumbs = [{ label: "Store", onClick: goHome }];
  if (view !== "home") {
    crumbs.push({ label: "Clothing", onClick: goCategories });
    if (isNewItems) {
      crumbs.push({ label: "New Items", onClick: null });
    } else {
      if (view === "items" && selectedCategory) crumbs.push({ label: CATEGORY_LABELS[selectedCategory], onClick: () => goToCategory(selectedCategory) });
      if (view === "items" && selectedSubcategory) crumbs.push({ label: SUBCATEGORY_LABELS[selectedSubcategory] || selectedSubcategory, onClick: null });
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Container onClick={e => e.stopPropagation()}>
        <Header>
          <HeaderLeft>
            <StoreName>Neclis Store</StoreName>
          </HeaderLeft>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        <Body>
          <Sidebar>
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <CrumbStep key={i} $active={isLast} $clickable={!isLast} onClick={!isLast && c.onClick ? c.onClick : undefined}>
                  {c.label}
                </CrumbStep>
              );
            })}
          </Sidebar>

          <ContentArea>
            {view === "home" && (
              <HomeView>
                <HomeTitle>What would you like to shop?</HomeTitle>
                <HomeBoxes>
                  <ShopBox onClick={goCategories}>
                    <ShopBoxGlow />
                    <ShopBoxIcon>👕</ShopBoxIcon>
                    <ShopBoxName>Clothing</ShopBoxName>
                    <ShopBoxSub>Browse all clothing items</ShopBoxSub>
                  </ShopBox>
                  <ShopBox $disabled>
                    <ShopBoxIcon style={{ opacity: 0.4 }}>🪑</ShopBoxIcon>
                    <ShopBoxName style={{ opacity: 0.4 }}>Furniture</ShopBoxName>
                    <ShopBoxSub style={{ opacity: 0.35 }}>Coming soon</ShopBoxSub>
                  </ShopBox>
                </HomeBoxes>
              </HomeView>
            )}

            {view === "categories" && (
              <CatScroll>
                <CatGrid>
                  <NewItemsCard onClick={goToNew}>
                    <NewItemsLeft>
                      <NewItemsEmoji>✨</NewItemsEmoji>
                      <div>
                        <NewItemsTitle>New Items</NewItemsTitle>
                        <NewItemsSub>Browse all latest arrivals, sorted by release</NewItemsSub>
                      </div>
                    </NewItemsLeft>
                    <NewItemsArrow>→</NewItemsArrow>
                  </NewItemsCard>

                  {CATEGORIES.map(cat => (
                    <CatCard key={cat}>
                      <CatCardDeco src={CATEGORY_DECO[cat]} alt="" />
                      <CatCardTop onClick={() => goToCategory(cat)}>
                        <CatLabel>{CATEGORY_LABELS[cat].toUpperCase()}</CatLabel>
                        <CatArrow>→</CatArrow>
                      </CatCardTop>
                      <CatSubList>
                        {CATEGORY_SUBCATEGORIES[cat].map(sub => (
                          <CatSubItem key={sub} onClick={() => goToSubcategory(cat, sub)}>
                            {SUBCATEGORY_LABELS[sub] || sub}
                          </CatSubItem>
                        ))}
                      </CatSubList>
                    </CatCard>
                  ))}
                </CatGrid>
              </CatScroll>
            )}

            {view === "items" && (
              <ItemScroll>
                

                {displayGroups.length === 0 && !loading && <EmptyMsg>No items found.</EmptyMsg>}

                <ItemList>
                  {displayGroups.map(group => {
                    const key = `${group.name}__${group.category}`;
                    const expanded = expandedGroup === key;
                    const first = group.variants[0];
                    const allOwned = group.variants.every(v => ownedIds.has(String(v._id)));
                    const rarity = group.rarity || first?.rarity;

                    return (
                      <ItemRow key={key} $owned={allOwned}>
                        <ItemThumb
                          src={first.thumbnailUrl || first.imageUrl}
                          alt={group.name}
                          crossOrigin="anonymous"
                        />
                        <ItemInfo onClick={() => group.variants.length > 1 ? toggleGroup(key) : selectVariant(first)}>
                          <ItemNameRow>
                            <ItemName>{group.name}</ItemName>
                            {rarity && RARITY[rarity] && (
                              <RarityTag $r={rarity}>{RARITY[rarity].label}</RarityTag>
                            )}
                          </ItemNameRow>
                          <ItemMeta>
                            {CATEGORY_LABELS[group.category]}
                            {group.variants.length > 1 && (
                              <VariantPill>{group.variants.length} colors {expanded ? "▲" : "▼"}</VariantPill>
                            )}
                          </ItemMeta>
                        </ItemInfo>
                        <ItemRight>
                          {allOwned ? (
                            <OwnedTag>Owned</OwnedTag>
                          ) : (
                            <PriceCol>
                              <PriceLine><CoinImg src="/icons/coin.png" alt="c" />1</PriceLine>
                              <PriceOr>or</PriceOr>
                              <PriceLine><GemImg src="/icons/gem.png" alt="g" />1</PriceLine>
                            </PriceCol>
                          )}
                        </ItemRight>

                        {expanded && (
                          <VariantStrip>
                            {group.variants.map(v => {
                              const owned = ownedIds.has(String(v._id));
                              const inCart = cart.some(c => c._id === v._id);
                              return (
                                <VThumb key={v._id} $owned={owned} $sel={inCart}
                                  onClick={() => !owned && selectVariant(v)}
                                  title={owned ? "Owned" : v.name}
                                >
                                  <img src={v.thumbnailUrl || v.imageUrl} alt={v.name} crossOrigin="anonymous" />
                                  {owned && <VOverlay>✓</VOverlay>}
                                  {inCart && !owned && <VSelOverlay>✓</VSelOverlay>}
                                </VThumb>
                              );
                            })}
                          </VariantStrip>
                        )}
                      </ItemRow>
                    );
                  })}
                </ItemList>

                {loading && <LoadMsg>Loading…</LoadMsg>}
                <div ref={sentinelRef} style={{ height: 1 }} />
              </ItemScroll>
            )}
          </ContentArea>

          <AvatarPanel>
            <AvatarArea>
              <AvatarCanvas gender={gender} outfit={previewOutfit} width={320} height={722} />
            </AvatarArea>
            <AvatarBottom>
              <Balance>
                <Bal><BalImg src="/icons/coin.png" />{(coins ?? 0).toLocaleString()}</Bal>
                <Bal><BalImg src="/icons/gem.png" />{(gems ?? 0).toLocaleString()}</Bal>
              </Balance>
              <CartButton onClick={() => setCartOpen(true)}>
                Cart{cartTotal > 0 ? ` (${cartTotal})` : ""}
                {cartTotal > 0 && <CartDot />}
              </CartButton>
            </AvatarBottom>

            {cartOpen && (
              <CartSlide onClick={() => setCartOpen(false)}>
                <CartBox onClick={e => e.stopPropagation()}>
                  <CartTop>
                    <CartBoxTitle>Your Cart</CartBoxTitle>
                    <CartClose onClick={() => setCartOpen(false)}>✕</CartClose>
                  </CartTop>
                  {cart.length === 0 && <CartEmpty>Cart is empty</CartEmpty>}
                  <CartItems>
                    {cart.map(item => (
                      <CartLine key={item._id}>
                        <CartImg src={item.thumbnailUrl || item.imageUrl} alt={item.name} crossOrigin="anonymous" />
                        <CartName>{item.name}</CartName>
                        <CartRm onClick={() => removeFromCart(item)}>✕</CartRm>
                      </CartLine>
                    ))}
                  </CartItems>
                  {cart.length > 0 && (
                    <>
                      <CartTotal>Total: <strong>{cartTotal}</strong> coin{cartTotal !== 1 ? "s" : ""} or gem{cartTotal !== 1 ? "s" : ""}</CartTotal>
                      {purchaseError && <ErrTxt>{purchaseError}</ErrTxt>}
                      {purchaseSuccess && <OkTxt>Purchased!</OkTxt>}
                      <BuyBtns>
                        <BuyBtn onClick={() => handleBuy("coins")} disabled={purchasing || !canAffordCoins}>
                          <BalImg src="/icons/coin.png" />{purchasing ? "…" : `Buy · ${cartTotal} coin${cartTotal !== 1 ? "s" : ""}`}
                        </BuyBtn>
                        <BuyBtn $gem onClick={() => handleBuy("gems")} disabled={purchasing || !canAffordGems}>
                          <BalImg src="/icons/gem.png" />{purchasing ? "…" : `Buy · ${cartTotal} gem${cartTotal !== 1 ? "s" : ""}`}
                        </BuyBtn>
                      </BuyBtns>
                    </>
                  )}
                </CartBox>
              </CartSlide>
            )}
          </AvatarPanel>
        </Body>
      </Container>
    </Overlay>
  );
}

export default StoreModal;

/* ─── palette ─── */
const C = {
  bg:       "#f7f3ff",
  surface:  "#ffffff",
  card:     "#f0eaff",
  cardHov:  "#e8deff",
  border:   "rgba(130,80,220,0.14)",
  border2:  "rgba(130,80,220,0.26)",
  accent:   "#7c3aed",
  accentLt: "#9d6ff5",
  accentPk: "#c026d3",
  txt:      "#2e1065",
  txt2:     "#5b3fa0",
  txt3:     "#a98fd4",
  coin:     "#b45309",
  gem:      "#0e7490",
};

/* ─── scrollbar mixin ─── */
const thinScrollbar = css`
  &::-webkit-scrollbar { width: 4px; height: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(80,40,160,0.2); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(80,40,160,0.4); }
  scrollbar-width: thin;
  scrollbar-color: rgba(80,40,160,0.2) transparent;
`;

/* ─── animations ─── */
const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const glassShine = keyframes`
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
`;

/* ─── shell ─── */
const Overlay = styled.div`
  position:fixed;inset:0;z-index:9999;
  background:rgba(40,15,90,0.52);
  backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;
`;

const Container = styled.div`
  background:${C.surface};
  border:1px solid ${C.border};
  border-radius:22px;
  width:min(96vw,1400px);
  max-width:98vw;
  max-height:92vh;
  height:92vh;
  display:flex;flex-direction:column;
  box-shadow:0 32px 80px rgba(80,30,180,0.18),0 4px 16px rgba(80,30,180,0.1),inset 0 1px 0 rgba(255,255,255,0.9);
  overflow:hidden;
  color:${C.txt};
  animation:${fadeIn} 0.22s ease;
`;

const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 24px;
  border-bottom:1px solid ${C.border};
  flex-shrink:0;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
`;

const HeaderLeft = styled.div`display:flex;align-items:center;gap:10px;`;

const StoreName = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.2px;
  background: linear-gradient(120deg, #7c3aed, #c026d3, #0ea5e9);
  /* background:  #ff7eb9; */
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CloseBtn = styled.button`
  background:rgba(120,80,220,0.08);border:1px solid ${C.border};
  color:${C.txt2};font-size:13px;cursor:pointer;
  width:30px;height:30px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
  &:hover{background:rgba(120,80,220,0.16);color:${C.txt};}
`;

const Body = styled.div`display:flex;flex:1;overflow:hidden;`;

/* ─── sidebar ─── */
const Sidebar = styled.div`
  width:168px;flex-shrink:0;
  border-right:1px solid ${C.border};
  padding:16px 10px;
  display:flex;flex-direction:column;gap:8px;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
`;

const SidebarLabel = styled.div`
  font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:0.8px;color:${C.txt3};margin-bottom:6px;padding:0 6px;
`;

const CrumbStep = styled.button`
  position: relative;
  overflow: hidden;
  background: ${p => p.$active
    ? "linear-gradient(145deg,rgba(124,58,237,0.16),rgba(157,111,245,0.1))"
    : "linear-gradient(145deg,rgba(255,255,255,0.72),rgba(237,230,255,0.55))"};
  border: 1px solid ${p => p.$active ? "rgba(124,58,237,0.38)" : "rgba(124,58,237,0.18)"};
  border-radius: 14px;
  color: ${p => p.$active ? C.txt : C.txt2};
  font-size: 24px;
  font-weight: 600;
  padding: 60px 14px;
  min-height: 64px;
  text-align: left;
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.65);
  transition: transform .18s, box-shadow .18s, border-color .18s, background .18s;

  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -60%;
    width: 32%;
    height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }

  ${p => p.$clickable && css`
    &:hover {
      border-color: rgba(124,58,237,0.48);
      background: linear-gradient(145deg,rgba(124,58,237,0.12),rgba(157,111,245,0.07));
      box-shadow: 0 6px 20px rgba(124,58,237,0.16), inset 0 1px 0 rgba(255,255,255,0.75);
      transform: translateY(-2px);
      color: ${C.txt};
    }
    &:hover::before {
      animation: ${glassShine} 0.52s ease-out forwards;
    }
  `}
`;

const CrumbArrow = styled.span`font-size:10px;color:${C.txt3};margin-right:1px;`;

/* ─── content ─── */
const ContentArea = styled.div`flex:1;overflow:hidden;display:flex;flex-direction:column;`;

/* HOME */
const HomeView = styled.div`
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:32px;padding:40px;
  background:linear-gradient(160deg,#fdfbff 0%,#f4eeff 100%);
`;

const HomeTitle = styled.div`
  font-size:22px;font-weight:600;color:${C.txt};letter-spacing:0.2px;
`;

const HomeBoxes = styled.div`display:flex;gap:24px;flex-wrap:wrap;justify-content:center;`;

const ShopBox = styled.div`
  position:relative;overflow:hidden;
  width:210px;height:220px;
  background:${p => p.$disabled
    ? "linear-gradient(145deg,#faf6ff,#f5f0ff)"
    : "linear-gradient(145deg,#f0e8ff,#e8dcff)"};
  border:1px solid ${p => p.$disabled ? C.border : "rgba(124,58,237,0.28)"};
  border-radius:18px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  cursor:${p => p.$disabled ? "default" : "pointer"};
  opacity:${p => p.$disabled ? 0.5 : 1};
  transition:all .2s;
  ${p => !p.$disabled && css`
    &:hover{
      border-color:rgba(124,58,237,0.55);
      transform:translateY(-3px);
      box-shadow:0 12px 40px rgba(124,58,237,0.15);
    }
  `}
`;

const ShopBoxGlow = styled.div`
  position:absolute;top:-40px;left:50%;transform:translateX(-50%);
  width:130px;height:130px;border-radius:50%;
  background:radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%);
  pointer-events:none;
`;

const ShopBoxIcon = styled.div`font-size:52px;line-height:1;`;
const ShopBoxName = styled.div`font-size:18px;font-weight:700;color:${C.txt};`;
const ShopBoxSub = styled.div`font-size:12px;color:${C.txt2};`;

/* CATEGORIES */
const CatScroll = styled.div`
  flex:1;overflow-y:auto;padding:24px;
  background:linear-gradient(160deg,#fdfbff 0%,#f8f3ff 100%);
  ${thinScrollbar}
`;

const CatGridTitle = styled.div`
  font-size:15px;font-weight:600;color:${C.txt};margin-bottom:18px;
`;

const CatGrid = styled.div`
  display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;
`;

/* New Items featured banner — spans full grid width */
const NewItemsCard = styled.div`
  grid-column: 1 / -1;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
  border:1px solid rgba(124,58,237,0.25);
  border-radius:14px;
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 22px;
  cursor:pointer;
  transition:all .17s;
  &:hover{
    border-color:rgba(124,58,237,0.5);
    box-shadow:0 4px 24px rgba(124,58,237,0.12);
    transform:translateY(-1px);
  }
`;

const NewItemsLeft = styled.div`display:flex;align-items:center;gap:14px;`;
const NewItemsEmoji = styled.span`font-size:26px;line-height:1;`;
const NewItemsTitle = styled.div`font-size:14px;font-weight:700;color:${C.txt};`;
const NewItemsSub = styled.div`font-size:11px;color:${C.txt2};margin-top:2px;`;
const NewItemsArrow = styled.span`font-size:18px;color:${C.txt3};transition:transform .15s;${NewItemsCard}:hover &{transform:translateX(3px);}`;

const CatCard = styled.div`
  position:relative;
  background:${C.surface};border:1px solid ${C.border};border-radius:14px;
  overflow:hidden;transition:border-color .15s,box-shadow .15s;
  &:hover{border-color:rgba(124,58,237,0.35);box-shadow:0 4px 18px rgba(100,50,200,0.1);}
`;

const CatCardDeco = styled.img`
  position: absolute;
  z-index: 1;
  right: -10px;
  bottom: 0;
  height: 80%;
  width: auto;
  object-fit: contain;
  opacity: 0.11;
  user-select: none;
  filter: saturate(0);
  pointer-events: none;
  transition: transform 0.2s ease, scale 0.2s ease;

  ${CatCard}:hover & {
    transform: translateX(-5px);
    scale: 1.05;
  }
`;

const CatCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #ede8ff, #fce8ff, #e8f0ff);
  padding: 13px 14px;
  cursor: pointer;
  border-bottom: 1px solid ${C.border};
  transition: background 0.13s;
  &:hover {
    background: linear-gradient(120deg, #ae97ff, #f8c8ff, #bfd5ff);
  }
`;

const CatEmoji = styled.span`font-size:18px;line-height:1;`;
const CatLabel = styled.span`font-size:16px;font-weight:700;color:${C.txt};flex:1;`;
const CatArrow = styled.span`font-size:14px;color:${C.txt3};transition:transform .13s;${CatCardTop}:hover &{transform:translateX(2px);}`;

const CatSubList = styled.div`padding:8px 14px 12px;display:flex;flex-direction:column;gap:1px;`;

const CatSubItem = styled.div`
  font-size:12px;color:${C.txt2};padding:4px 0;
  cursor:pointer;transition:color .1s;
  width:fit-content;
  &:hover{
  color:${C.accent};
  font-weight: 700;
  }
`;

/* ITEMS */
const ItemScroll = styled.div`
  flex:1;overflow-y:auto;padding:20px 20px 12px;display:flex;flex-direction:column;gap:0;
  background:linear-gradient(160deg,#fdfbff 0%,#f8f3ff 100%);
  ${thinScrollbar}
`;

const ItemListHeader = styled.div`
  display:flex;align-items:baseline;gap:10px;margin-bottom:14px;flex-shrink:0;
`;
const ItemListTitle = styled.div`font-size:16px;font-weight:700;color:${C.txt};`;
const ItemCount = styled.div`font-size:12px;color:${C.txt3};`;

const EmptyMsg = styled.div`text-align:center;color:${C.txt3};padding:48px 0;font-size:14px;`;
const LoadMsg = styled.div`text-align:center;color:${C.txt3};padding:16px;font-size:13px;`;

const ItemList = styled.div`display:flex;flex-direction:column;gap:6px;`;

const ItemRow = styled.div`
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
  padding:10px 14px;
  background:${p => p.$owned ? "rgba(120,80,220,0.03)" : C.surface};
  border:1px solid ${C.border};
  border-radius:12px;opacity:${p => p.$owned ? 0.6 : 1};
  transition:border-color .13s,background .13s;
  &:hover{border-color:rgba(124,58,237,0.3);background:${p => p.$owned ? "rgba(120,80,220,0.04)" : C.card};}
`;

const ItemThumb = styled.img`
  width:64px;height:64px;object-fit:contain;
  border-radius:10px;background:rgba(120,80,220,0.06);flex-shrink:0;
`;

const ItemInfo = styled.div`flex:1;min-width:0;cursor:pointer;`;

const ItemNameRow = styled.div`display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;`;

const ItemName = styled.div`
  font-size:13px;font-weight:600;color:${C.txt};
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`;

const RarityTag = styled.span`
  font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;
  white-space:nowrap;text-transform:uppercase;letter-spacing:0.4px;
  background:${p => RARITY[p.$r]?.bg};
  border:1px solid ${p => RARITY[p.$r]?.border};
  color:${p => RARITY[p.$r]?.color};
`;

const ItemMeta = styled.div`font-size:11px;color:${C.txt2};display:flex;align-items:center;gap:8px;`;

const VariantPill = styled.span`
  background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.22);
  color:${C.accent};font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;
`;

const ItemRight = styled.div`flex-shrink:0;`;

const OwnedTag = styled.div`font-size:11px;font-weight:600;color:${C.txt3};`;

const PriceCol = styled.div`display:flex;flex-direction:column;align-items:flex-end;gap:2px;`;
const PriceLine = styled.div`display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${C.txt};`;
const PriceOr = styled.div`font-size:9px;color:${C.txt3};text-align:right;`;
const CoinImg = styled.img`width:14px;height:14px;object-fit:contain;`;
const GemImg = styled.img`width:14px;height:14px;object-fit:contain;`;

const VariantStrip = styled.div`
  width:100%;display:flex;gap:8px;padding:8px 0 2px 78px;flex-wrap:wrap;
`;

const VThumb = styled.div`
  position:relative;width:46px;height:46px;border-radius:8px;overflow:hidden;
  cursor:${p => p.$owned ? "default" : "pointer"};
  border:2px solid ${p => p.$sel ? C.accent : p.$owned ? "transparent" : C.border};
  background:rgba(120,80,220,0.06);
  transition:border-color .12s;opacity:${p => p.$owned ? 0.45 : 1};
  &:hover{border-color:${p => p.$owned ? "transparent" : C.accent};}
  img{width:100%;height:100%;object-fit:contain;}
`;

const VOverlay = styled.div`
  position:absolute;inset:0;background:rgba(240,235,255,0.6);
  display:flex;align-items:center;justify-content:center;font-size:14px;color:${C.txt3};
`;
const VSelOverlay = styled.div`
  position:absolute;inset:0;background:rgba(124,58,237,0.22);
  display:flex;align-items:center;justify-content:center;font-size:14px;color:${C.accent};
`;

/* ─── avatar panel ─── */
const AvatarPanel = styled.div`
  width:340px;flex-shrink:0;
  border-left:1px solid ${C.border};
  display:flex;flex-direction:column;
  position:relative;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
`;

const AvatarArea = styled.div`
  flex:1;display:flex;align-items:center;justify-content:center;
  overflow:hidden;padding:12px 0 4px;
`;

const AvatarBottom = styled.div`
  padding:12px 16px 16px;border-top:1px solid ${C.border};
  display:flex;align-items:center;gap:10px;flex-shrink:0;
`;

const Balance = styled.div`display:flex;gap:14px;flex:1;`;
const Bal = styled.div`
  display:flex;align-items:center;gap:5px;
  font-size:13px;font-weight:600;color:${C.txt2};
`;
const BalImg = styled.img`width:16px;height:16px;object-fit:contain;`;

const CartButton = styled.button`
  position:relative;padding:8px 16px;border-radius:9px;
  border:1px solid rgba(124,58,237,0.3);
  background:rgba(124,58,237,0.1);
  color:${C.accent};font-size:13px;font-weight:600;cursor:pointer;
  white-space:nowrap;transition:all .14s;
  &:hover{background:rgba(124,58,237,0.18);}
`;

const CartDot = styled.div`
  position:absolute;top:-3px;right:-3px;
  width:8px;height:8px;border-radius:50%;background:#ef4444;
`;

/* ─── cart slide ─── */
const CartSlide = styled.div`
  position:absolute;inset:0;z-index:20;
  background:rgba(200,185,240,0.35);
  backdrop-filter:blur(4px);
  display:flex;align-items:flex-end;
`;

const CartBox = styled.div`
  width:100%;
  background:linear-gradient(180deg,#fdfbff 0%,#f5eeff 100%);
  border-top:1px solid ${C.border};
  border-radius:16px 16px 0 0;
  padding:18px 18px 22px;
  display:flex;flex-direction:column;gap:10px;
  max-height:72%;overflow-y:auto;
  animation:${fadeIn} 0.2s ease;
  box-shadow:0 -8px 32px rgba(100,50,200,0.1);
  ${thinScrollbar}
`;

const CartTop = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const CartBoxTitle = styled.div`font-size:15px;font-weight:700;color:${C.txt};`;
const CartClose = styled.button`
  background:transparent;border:none;color:${C.txt2};font-size:14px;cursor:pointer;
  &:hover{color:${C.txt};}
`;

const CartEmpty = styled.div`font-size:13px;color:${C.txt3};text-align:center;padding:8px;`;
const CartItems = styled.div`display:flex;flex-direction:column;gap:6px;`;

const CartLine = styled.div`
  display:flex;align-items:center;gap:10px;
  background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.12);
  border-radius:8px;padding:7px 10px;
`;

const CartImg = styled.img`width:34px;height:34px;object-fit:contain;border-radius:6px;background:rgba(120,80,220,0.08);flex-shrink:0;`;
const CartName = styled.div`font-size:12px;color:${C.txt};flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
const CartRm = styled.button`
  background:none;border:none;color:${C.txt3};font-size:14px;cursor:pointer;padding:0;flex-shrink:0;
  &:hover{color:#ef4444;}
`;

const CartTotal = styled.div`font-size:12px;color:${C.txt2};strong{color:${C.txt};}`;
const ErrTxt = styled.div`font-size:12px;color:#dc2626;`;
const OkTxt = styled.div`font-size:12px;color:#059669;font-weight:600;`;

const BuyBtns = styled.div`display:flex;gap:8px;`;
const BuyBtn = styled.button`
  flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 8px;border-radius:9px;
  border:1px solid ${p => p.$gem ? "rgba(14,116,144,0.3)" : "rgba(180,83,9,0.3)"};
  background:${p => p.$gem ? "rgba(14,116,144,0.08)" : "rgba(180,83,9,0.08)"};
  color:${p => p.$gem ? C.gem : C.coin};
  font-size:12px;font-weight:600;cursor:pointer;transition:opacity .13s;
  &:disabled{opacity:0.3;cursor:not-allowed;}
  &:not(:disabled):hover{opacity:0.7;}
  img{width:15px;height:15px;object-fit:contain;}
`;
