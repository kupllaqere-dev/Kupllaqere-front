import { useState, useEffect, useRef, useCallback } from "react";
import styled, { css, keyframes } from "styled-components";
import AvatarCanvas from "./AvatarCanvas";
import { POSE_COUNT } from "../constants/poses";
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
  appearance: "Appearance",
};

const CATEGORY_ICONS = {
  tops: "👕", bottoms: "👖", onePiece: "👗", coats: "🧥",
  head: "🎩", hair: "✂️", accessories: "💍", feet: "👟", hands: "🧤",
  appearance: "👁️",
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
  appearance: "/assets/store/head.png",
};

const SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve",
  sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations",
  horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear",
  necklace: "Necklace", bags: "Bags", nails: "Nails",
  shoes: "Shoes", boots: "Boots", slipOns: "Slip-Ons", socks: "Socks",
  gloves: "Gloves", handheld: "Handheld",
  eyes: "Eyes", eyebrows: "Eyebrows", nose: "Nose", mouth: "Mouth", beard: "Beard",
};

const CATEGORY_SUBCATEGORIES = {
  tops: ["longSleeve", "shortSleeve", "sleeveless", "baggy"],
  bottoms: ["pants", "skinny", "shorts", "skirt"],
  onePiece: ["overall", "dress"],
  coats: ["jackets", "vests", "hoodie"],
  head: ["hats", "sunglasses", "decorations", "horns", "halos"],
  hair: ["short", "medium", "long", "facial"],
  accessories: ["bracelets", "belts", "neckwear", "necklace", "bags", "nails"],
  feet: ["shoes", "boots", "slipOns", "socks"],
  hands: ["gloves", "handheld"],
  appearance: ["eyes", "eyebrows", "nose", "mouth", "beard"],
};

const RARITY = {
  nonRare:  { label: "Common",     bg: "rgba(120,90,180,0.1)",   border: "rgba(120,90,180,0.22)", color: "#7c5cbf" },
  rare:     { label: "Rare",       bg: "rgba(109,40,217,0.1)",   border: "rgba(109,40,217,0.3)",  color: "#7c3aed" },
  superRare:{ label: "Super Rare", bg: "rgba(217,119,6,0.1)",    border: "rgba(217,119,6,0.3)",   color: "#b45309" },
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function StoreModal({ onClose, gender, coins, gems, level, currentOutfit, onPurchaseComplete }) {
  const [view, setView] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [previewOutfit, setPreviewOutfit] = useState(currentOutfit || {});
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [pose, setPose] = useState(0);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);
  const maxPose = (POSE_COUNT[gender] ?? 5) - 1;

  const loadItems = useCallback(async (cat, sub, pg, reset, sort) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await fetchStoreItems({ category: cat || "", subcategory: sub || "", page: pg, sort: sort || "" });
      setGroups(prev => reset ? data.groups : [...prev, ...data.groups]);
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

  const previewItem = item => {
    setPreviewOutfit(prev => ({ ...prev, [item.category]: { imageUrl: item.imageUrl } }));
  };

  const addToCart = item => {
    setCart(prev => [...prev, { ...item, cartId: crypto.randomUUID() }]);
    setPurchaseError(null); setPurchaseSuccess(false);
    previewItem(item);
  };

  const removeFromCart = item => {
    setCart(prev => { const i = prev.findIndex(c => c.cartId === item.cartId); return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)]; });
    setPreviewOutfit(prev => {
      const next = { ...prev };
      if (currentOutfit?.[item.category]) next[item.category] = currentOutfit[item.category];
      else delete next[item.category];
      return next;
    });
  };

  const handlePurchase = async () => {
    if (!cart.length) return;
    setPurchasing(true); setPurchaseError(null);
    try {
      const result = await purchaseItems({
        items: cart.map(i => ({ id: i._id, currency: i.chosenCurrency })),
      });
      setCart([]); setPurchaseSuccess(true); onPurchaseComplete?.(result);
    } catch (err) { setPurchaseError(err.message); }
    finally { setPurchasing(false); }
  };

  const cartTotal     = cart.length;
  const totalCoinCost = cart.filter(i => i.chosenCurrency === "coins").reduce((s, i) => s + (i.coinPrice || 0), 0);
  const totalGemCost  = cart.filter(i => i.chosenCurrency === "gems").reduce((s, i) => s + (i.gemPrice  || 0), 0);
  const canAfford = coins >= totalCoinCost && gems >= totalGemCost;

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
                    const rarity = group.rarity;
                    const lvlReq = group.levelRequirement ?? null;
                    const hasLevel = lvlReq !== null;
                    const meetsLevel = !hasLevel || (level ?? 1) >= lvlReq;
                    const selVariant = selectedVariants[key] || first;

                    const coinPrice = group.coinPrice ?? null;
                    const gemPrice  = group.gemPrice  ?? null;

                    const handleCardClick = () => {
                      toggleGroup(key);
                      previewItem(selVariant);
                    };

                    return (
                      <ItemGroup key={key}>
                        <ItemCard
                          $expanded={expanded}
                          onClick={handleCardClick}
                        >
                          <CardThumbImg
                            src={selVariant.thumbnailUrl || selVariant.imageUrl}
                            alt={group.name}
                            crossOrigin="anonymous"
                          />
                          <CardMidSection>
                            <ItemName>{group.name}</ItemName>
                          </CardMidSection>
                          <CardPricesArea>
                            <CardPricePanel>
                              {coinPrice !== null && (
                                <>
                                  <LevelBadge $met={meetsLevel}>
                                    {hasLevel ? `Level ${lvlReq}` : "No Level"}
                                  </LevelBadge>
                                  <BadgeAndPrice>
                                    <CoinImg src="/icons/Nectar.png" alt="coins" />
                                    <CardPriceAmt>{coinPrice}</CardPriceAmt>
                                  </BadgeAndPrice>
                                </>
                              )}
                            </CardPricePanel>
                            <CardPricePanel>
                              {gemPrice !== null && (
                                <>
                                  <LevelBadge $met={true}>No Level</LevelBadge>
                                  <BadgeAndPrice>
                                    <GemImg src="/icons/Lis.png" alt="gems" />
                                    <CardPriceAmt $gem>{gemPrice}</CardPriceAmt>
                                  </BadgeAndPrice>
                                </>
                              )}
                            </CardPricePanel>
                          </CardPricesArea>
                        </ItemCard>

                        {expanded && (
                          <ExpandedArea>
                            {((rarity && RARITY[rarity]) || group.notes) && (
                              <ExpandInfoBox>
                                {rarity && RARITY[rarity] && (
                                  <ExpandInfoRow>
                                    <ExpandLabel>Rarity</ExpandLabel>
                                    <RarityRect $r={rarity}>
                                      {RARITY[rarity].label}
                                    </RarityRect>
                                  </ExpandInfoRow>
                                )}
                                {rarity && RARITY[rarity] && group.notes && (
                                  <ExpandDivider />
                                )}
                                {group.notes && (
                                  <ExpandInfoRow>
                                    <ExpandLabel>Notes</ExpandLabel>
                                    <ExpandNotesTxt>
                                      {group.notes}
                                    </ExpandNotesTxt>
                                  </ExpandInfoRow>
                                )}
                              </ExpandInfoBox>
                            )}

                            {group.variants.length > 1 && (
                              <ExpandInfoBox>
                                <ExpandInfoRow>
                                  <ExpandVariantsRow>
                                    {group.variants.map((v) => (
                                      <ExpandVImg
                                        key={v._id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVariants((prev) => ({ ...prev, [key]: v }));
                                          previewItem(v);
                                        }}
                                        title={v.name}
                                      >
                                        <img
                                          src={v.thumbnailUrl || v.imageUrl}
                                          alt={v.name}
                                          crossOrigin="anonymous"
                                        />
                                      </ExpandVImg>
                                    ))}
                                  </ExpandVariantsRow>
                                </ExpandInfoRow>
                              </ExpandInfoBox>
                            )}
                          </ExpandedArea>
                        )}

                        {expanded && (coinPrice !== null || gemPrice !== null) && (
                          <AddButtonsBar>
                            <ButtonsGroup>
                              {coinPrice !== null && (
                                <AddVariantBtn
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({ ...selVariant, coinPrice, gemPrice, chosenCurrency: "coins" });
                                  }}
                                >
                                  <CoinImg src="/icons/Nectar.png" alt="coins" />
                                  <span>ADD</span>
                                </AddVariantBtn>
                              )}
                              {gemPrice !== null && (
                                <AddVariantBtn
                                  $gem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({ ...selVariant, coinPrice, gemPrice, chosenCurrency: "gems" });
                                  }}
                                >
                                  <GemImg src="/icons/Lis.png" alt="gems" />
                                  <span>ADD</span>
                                </AddVariantBtn>
                              )}
                            </ButtonsGroup>
                          </AddButtonsBar>
                        )}
                      </ItemGroup>
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
              <AvatarBg src="/store-background.png" alt="" />
              <AvatarCanvas gender={gender} outfit={previewOutfit} width={320} height={722} pose={pose} />
            </AvatarArea>
            <PoseBar>
              <PoseArrow onClick={() => setPose(p => p === maxPose ? 0 : p + 1)}>‹</PoseArrow>
              {Array.from({ length: maxPose + 1 }).map((_, i) => (
                <PoseDot key={i} $active={i === pose} onClick={() => setPose(i)} />
              ))}
              <PoseArrow onClick={() => setPose(p => p === 0 ? maxPose : p - 1)}>›</PoseArrow>
            </PoseBar>
            <AvatarBottom>
              <Balance>
                <Bal><BalImg src="/icons/Nectar.png" />{(coins ?? 0).toLocaleString()}</Bal>
                <Bal><BalImg src="/icons/Lis.png" />{(gems ?? 0).toLocaleString()}</Bal>
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
                      <CartLine key={item.cartId}>
                        <CartImg src={item.thumbnailUrl || item.imageUrl} alt={item.name} crossOrigin="anonymous" />
                        <CartName>{item.name}</CartName>
                        <CartCurrency>
                          <BalImg src={item.chosenCurrency === "coins" ? "/icons/Nectar.png" : "/icons/Lis.png"} />
                          <CartPrice $gem={item.chosenCurrency === "gems"}>
                            {item.chosenCurrency === "coins" ? item.coinPrice : item.gemPrice}
                          </CartPrice>
                        </CartCurrency>
                        <CartRm onClick={() => removeFromCart(item)}>✕</CartRm>
                      </CartLine>
                    ))}
                  </CartItems>
                  {cart.length > 0 && (
                    <>
                      <CartTotal>
                        {totalCoinCost > 0 && <CartTotalChunk><BalImg src="/icons/Nectar.png" /><strong>{totalCoinCost}</strong></CartTotalChunk>}
                        {totalCoinCost > 0 && totalGemCost > 0 && <span style={{ color: "inherit", opacity: 0.5 }}>+</span>}
                        {totalGemCost > 0 && <CartTotalChunk $gem><BalImg src="/icons/Lis.png" /><strong>{totalGemCost}</strong></CartTotalChunk>}
                      </CartTotal>
                      {purchaseError && <ErrTxt>{purchaseError}</ErrTxt>}
                      {purchaseSuccess && <OkTxt>Purchased!</OkTxt>}
                      <BuyBtns>
                        <BuyBtn onClick={handlePurchase} disabled={purchasing || !canAfford}>
                          {purchasing ? "…" : "Purchase"}
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
  flex:1;overflow-y:auto;padding: 6px;display:flex;flex-direction:column;gap:0;
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

const ItemGroup = styled.div`display:flex;flex-direction:column;gap:0;`;

const ItemCard = styled.div`
  display:flex;align-items:center;gap:5px;padding:5px;
  border-radius:${p => p.$expanded ? "14px 14px 0 0" : "14px"};
  background:linear-gradient(to top,#ddd0f8,#f8f3ff);
  border:1px solid ${C.border};
  border-bottom:${p => p.$expanded ? `1px solid transparent` : `1px solid ${C.border}`};
  min-height:88px;cursor:pointer;
  transition:border-color .15s,box-shadow .15s;
  &:hover{border-color:${C.border2};box-shadow:0 2px 10px rgba(120,60,220,0.1);}
`;

const CardThumbImg = styled.img`
  flex-shrink:0;width:76px;height:76px;object-fit:contain;
`;

const CardMidSection = styled.div`
  flex:1;min-width:0;border-radius:10px;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;align-items:center;
  padding:8px 12px;align-self:stretch;
`;

const ItemName = styled.div`
  font-size:13px;font-weight:700;color:${C.txt};
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`;

const CardPricesArea = styled.div`
  display:flex;flex-direction:row;gap:5px;flex-shrink:0;align-self:stretch;
  width:35%;
`;

const CardPricePanel = styled.div`
  border-radius:10px;overflow:hidden;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;flex-direction:column;align-items:center;
  gap:6px;padding:12px 24px;
  width: 50%;
`;

const BadgeAndPrice = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const CardPriceAmt = styled.div`
  font-size:13px;font-weight:700;
  color:${p => p.$gem ? C.gem : C.coin};
`;

const CardOwnedPanel = styled.div`
  border-radius:10px;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;align-items:center;justify-content:center;
  padding:8px 12px;align-self:stretch;
  font-size:11px;font-weight:600;color:${C.txt3};
`;

const CoinImg = styled.img`width:32px;height:32px;object-fit:contain;`;
const GemImg = styled.img`width:32px;height:32px;object-fit:contain;`;

const LevelBadge = styled.div`
  font-size:14px;font-weight:700;line-height:1.2;
  padding:4px 12px;border-radius:4px;
  align-self:stretch;text-align:center;
  background:${p => p.$met ? "rgba(100,100,120,0.1)" : "rgba(220,38,38,0.1)"};
  color:${p => p.$met ? "#888" : "#dc2626"};
  border:1px solid ${p => p.$met ? "rgba(100,100,120,0.2)" : "rgba(220,38,38,0.3)"};
  text-wrap: nowrap;
`;

/* ── expanded area ── */
const ExpandedArea = styled.div`
  border:1px solid ${C.border};border-top:none;
  border-radius:0 0 0 14px;
  background:linear-gradient(to top,#e8dcff,#f8f3ff);
  /* padding:10px 12px 12px; */
  display:flex;flex-direction:column;gap:10px;
`;

const ExpandInfoBox = styled.div`
  /* background:linear-gradient(to top,#ede5ff,#ffffff); */
  border-radius: 10px;
  overflow: hidden;
  padding: 9px 12px;

  &:nth-child(2) {
    padding: 0;
    border-radius: 0 0 10px 10px;
  }
`;
const ExpandInfoRow = styled.div`
  display:flex;align-items:center;gap:10px;
  flex-wrap:wrap;
`;
const ExpandDivider = styled.div`height:1px;background:${C.border};margin: 10px 0`;
const ExpandLabel = styled.div`
  font-size:10px;font-weight:700;color:${C.txt3};
  text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;
`;

const RarityRect = styled.div`
  display:inline-flex;align-items:center;padding:4px 12px;border-radius:6px;
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
  background:${p => RARITY[p.$r]?.bg};
  border:1px solid ${p => RARITY[p.$r]?.border};
  color:${p => RARITY[p.$r]?.color};
`;

const ExpandNotesTxt = styled.div`font-size:12px;color:${C.txt2};line-height:1.5;flex:1;`;

const ExpandVariantsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  background: #ded1fd;
  width: 100%;
  /* border-radius: 8px; */
  padding: 12px 8px;
`;

const ExpandVImg = styled.div`
  position:relative;width:70px;height:70px;
  cursor:pointer;
  border-radius:6px;overflow:hidden;
  transition:transform .12s;
  &:hover{transform:scale(1.12);}
  img{width:100%;height:100%;object-fit:contain;display:block;}
`;

const ExpandVOverlay = styled.div`
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:14px;color:${C.txt3};background:rgba(240,235,255,0.5);
`;

const AddButtonsBar = styled.div`
  display:flex;justify-content:flex-end;
  width:100%;
  `;
  
  const ButtonsGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 35%;
  gap: 5px;
`;

const AddVariantBtn = styled.button`
  width:50%;border-radius:0 0 10px 10px;padding:7px 0;
  font-size:12px;font-weight:700;cursor:pointer;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  color:${p => p.$gem ? C.gem : C.coin};
  border:1px solid ${C.border};
  transition:border-color .13s,background .13s;
  &:hover{border-color:${C.border2};background:${C.card};}
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  overflow:hidden;position:relative;
`;

const AvatarBg = styled.img`
  position:absolute;inset:0;width:100%;height:100%;object-fit:contain;
  pointer-events:none;user-select:none;
  opacity: 60%;
`;

const PoseBar = styled.div`
  display:flex;align-items:center;justify-content:center;gap:8px;
  padding:8px 12px;border-top:1px solid ${C.border};
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
  flex-shrink:0;
`;

const PoseArrow = styled.button`
  background:rgba(124,58,237,0.08);border:1px solid ${C.border};
  color:${C.txt2};font-size:18px;line-height:1;
  width:28px;height:28px;border-radius:7px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .13s;
  &:hover{background:rgba(124,58,237,0.16);color:${C.txt};}
`;

const PoseDot = styled.button`
  width:${p => p.$active ? 18 : 8}px;
  height:8px;
  border-radius:4px;
  border:none;cursor:pointer;padding:0;
  background:${p => p.$active ? C.accent : "rgba(124,58,237,0.2)"};
  transition:all .18s;
  &:hover{background:${p => p.$active ? C.accent : "rgba(124,58,237,0.4)"};}
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

const CartCurrency = styled.div`display:flex;align-items:center;gap:3px;flex-shrink:0;`;
const CartPrice = styled.span`font-size:12px;font-weight:700;color:${p => p.$gem ? C.gem : C.coin};`;

const CartTotal = styled.div`
  display:flex;align-items:center;gap:8px;
  font-size:12px;color:${C.txt2};
  strong{color:${C.txt};}
`;
const CartTotalChunk = styled.div`
  display:flex;align-items:center;gap:4px;
  font-size:13px;font-weight:700;
  color:${p => p.$gem ? C.gem : C.coin};
  img{width:16px;height:16px;}
`;
const ErrTxt = styled.div`font-size:12px;color:#dc2626;`;
const OkTxt = styled.div`font-size:12px;color:#059669;font-weight:600;`;

const BuyBtns = styled.div`display:flex;gap:8px;`;
const BuyBtn = styled.button`
  flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 8px;border-radius:9px;
  border:1px solid rgba(124,58,237,0.3);
  background:rgba(124,58,237,0.1);
  color:${C.accent};
  font-size:12px;font-weight:600;cursor:pointer;transition:opacity .13s;
  &:disabled{opacity:0.3;cursor:not-allowed;}
  &:not(:disabled):hover{opacity:0.7;}
  img{width:15px;height:15px;object-fit:contain;}
`;
