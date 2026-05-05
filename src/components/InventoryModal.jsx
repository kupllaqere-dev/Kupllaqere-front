import { useState, useEffect, useMemo } from "react";
import styled, { css, keyframes } from "styled-components";
import AvatarCanvas from "./AvatarCanvas";
import { POSE_COUNT } from "../constants/poses";
import { fetchInventory, sellItem } from "../api/store";

const CATEGORY_LABELS = {
  tops: "Tops", bottoms: "Bottoms", onePiece: "One Piece", coats: "Coats",
  head: "Head", hair: "Hair", accessories: "Accessories", feet: "Feet", hands: "Hands",
  appearance: "Appearance",
};

const CATEGORY_DECO = {
  tops: "/assets/store/tops.png", bottoms: "/assets/store/bottoms.png",
  onePiece: "/assets/store/onepiece.png", coats: "/assets/store/coats.png",
  head: "/assets/store/head.png", hair: "/assets/store/hair.png",
  accessories: "/assets/store/accessories.png", feet: "/assets/store/feet.png",
  hands: "/assets/store/hands.png", appearance: "/assets/store/head.png",
};

const SUBCATEGORY_LABELS = {
  longSleeve: "Long Sleeve", shortSleeve: "Short Sleeve", sleeveless: "Sleeveless", baggy: "Baggy",
  pants: "Pants", skinny: "Skinny", shorts: "Shorts", skirt: "Skirt",
  overall: "Overall", dress: "Dress",
  jackets: "Jackets", vests: "Vests", hoodie: "Hoodie",
  hats: "Hats", sunglasses: "Sunglasses", decorations: "Decorations", horns: "Horns", halos: "Halos",
  short: "Short", medium: "Medium", long: "Long", facial: "Facial",
  bracelets: "Bracelets", belts: "Belts", neckwear: "Neckwear", necklace: "Necklace", bags: "Bags", nails: "Nails",
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

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function getSellPrice(entry) {
  if (entry.currency === "coins") return Math.floor((entry.amountPaid || 0) / 2);
  return (entry.amountPaid || 0) * 1000;
}

function InventoryModal({ onClose, onEquip, onUnequip, equipped, currentOutfit, gender, level, onSellComplete }) {
  const [view, setView] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState({});
  const [previewAvatar, setPreviewAvatar] = useState(currentOutfit || {});
  const [selling, setSelling] = useState(null);
  const [sellError, setSellError] = useState(null);
  const [pose, setPose] = useState(0);
  const maxPose = (POSE_COUNT[gender] ?? 5) - 1;

  useEffect(() => {
    fetchInventory()
      .then(data => {
        const loadedItems = data.items || [];
        setItems(loadedItems);
        const initial = {};
        for (const [cat, itemId] of Object.entries(equipped || {})) {
          const eStr = itemId?.toString();
          const entry = loadedItems.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
          if (entry) initial[cat] = entry;
        }
        setSelectedEntries(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayItems = view === "items"
    ? items.filter(e => {
        if (selectedCategory && e.category !== selectedCategory) return false;
        if (selectedSubcategory && e.subcategory !== selectedSubcategory) return false;
        return true;
      })
    : [];

  const subCount = (cat, sub) => items.filter(e => e.category === cat && e.subcategory === sub).length;

  const goCategories = () => { setView("categories"); setSelectedCategory(null); setSelectedSubcategory(null); };
  const goToCategory = cat => { setSelectedCategory(cat); setSelectedSubcategory(null); setView("items"); };
  const goToSubcategory = (cat, sub) => { setSelectedCategory(cat); setSelectedSubcategory(sub); setView("items"); };

  const isSelected = entry =>
    selectedEntries[entry.category]?._id?.toString() === entry._id?.toString();

  const canUse = entry => {
    if (entry.currency === "gems") return true;
    if (!entry.levelRequirement) return true;
    return (level ?? 1) >= entry.levelRequirement;
  };

  const toggleEntry = entry => {
    const cat = entry.category;
    if (isSelected(entry)) {
      setSelectedEntries(prev => { const n = { ...prev }; delete n[cat]; return n; });
      setPreviewAvatar(prev => {
        const n = { ...prev };
        if (currentOutfit?.[cat]) n[cat] = currentOutfit[cat];
        else delete n[cat];
        return n;
      });
    } else {
      setSelectedEntries(prev => ({ ...prev, [cat]: entry }));
      setPreviewAvatar(prev => ({ ...prev, [cat]: { imageUrl: entry.imageUrl } }));
    }
  };

  const handleApply = () => {
    const currentCats = Object.keys(equipped || {});
    for (const cat of currentCats) {
      if (!selectedEntries[cat]) onUnequip(cat);
    }
    for (const [cat, entry] of Object.entries(selectedEntries)) {
      if (!canUse(entry)) continue;
      const equippedId = equipped?.[cat];
      if (equippedId) {
        const eStr = equippedId.toString();
        if (eStr === entry._id?.toString() || eStr === entry.itemId?.toString()) continue;
      }
      onEquip(entry);
    }
  };

  const handleReset = () => {
    const initial = {};
    for (const [cat, itemId] of Object.entries(equipped || {})) {
      const eStr = itemId?.toString();
      const entry = items.find(i => i._id?.toString() === eStr || i.itemId?.toString() === eStr);
      if (entry) initial[cat] = entry;
    }
    setSelectedEntries(initial);
    setPreviewAvatar(currentOutfit || {});
  };

  const handleNude = () => {
    setSelectedEntries({});
    setPreviewAvatar({});
  };

  const handleSell = async (entry, e) => {
    e.stopPropagation();
    if (selling) return;
    setSelling(entry._id);
    setSellError(null);
    try {
      const result = await sellItem({ inventoryId: entry._id });
      setItems(prev => prev.filter(i => i._id !== entry._id));
      if (isSelected(entry)) {
        const cat = entry.category;
        setSelectedEntries(prev => { const n = { ...prev }; delete n[cat]; return n; });
        setPreviewAvatar(prev => {
          const n = { ...prev };
          if (currentOutfit?.[cat]) n[cat] = currentOutfit[cat];
          else delete n[cat];
          return n;
        });
      }
      onSellComplete?.(result);
    } catch (err) {
      setSellError(err.message);
    } finally {
      setSelling(null);
    }
  };

  const hasChanges = useMemo(() => {
    for (const cat of Object.keys(equipped || {})) {
      if (!selectedEntries[cat]) return true;
    }
    for (const [cat, entry] of Object.entries(selectedEntries)) {
      const equippedId = equipped?.[cat];
      if (!equippedId) return true;
      const eStr = equippedId.toString();
      if (eStr !== entry._id?.toString() && eStr !== entry.itemId?.toString()) return true;
    }
    return false;
  }, [selectedEntries, equipped]);

  const crumbs = [
    { label: "Inventory", onClick: view === "items" ? goCategories : null },
    { label: "Clothing", onClick: view === "items" ? goCategories : null },
  ];
  if (view === "items") {
    if (selectedCategory) crumbs.push({
      label: CATEGORY_LABELS[selectedCategory],
      onClick: selectedSubcategory ? () => goToCategory(selectedCategory) : null,
    });
    if (selectedSubcategory) crumbs.push({
      label: SUBCATEGORY_LABELS[selectedSubcategory] || selectedSubcategory,
      onClick: null,
    });
  }

  return (
    <Overlay onClick={onClose}>
      <Container onClick={e => e.stopPropagation()}>
        <Header>
          <HeaderLeft>
            <InvName>Inventory</InvName>
          </HeaderLeft>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>

        <Body>
          <Sidebar>
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              const clickable = !isLast && !!c.onClick;
              return (
                <CrumbStep key={i} $active={isLast} $clickable={clickable} onClick={clickable ? c.onClick : undefined}>
                  {c.label}
                </CrumbStep>
              );
            })}
          </Sidebar>

          <ContentArea>
            {view === "categories" && (
              <CatScroll>
                {loading && <LoadMsg>Loading…</LoadMsg>}
                <CatGrid>
                  {CATEGORIES.map(cat => (
                    <CatCard key={cat}>
                      <CatCardDeco src={CATEGORY_DECO[cat]} alt="" />
                      <CatCardTop onClick={() => goToCategory(cat)}>
                        <CatLabel>{CATEGORY_LABELS[cat].toUpperCase()}</CatLabel>
                        <CatArrow>→</CatArrow>
                      </CatCardTop>
                      <CatSubList>
                        {CATEGORY_SUBCATEGORIES[cat].map(sub => {
                          const cnt = subCount(cat, sub);
                          return (
                            <CatSubItem key={sub} onClick={() => goToSubcategory(cat, sub)}>
                              {SUBCATEGORY_LABELS[sub] || sub}
                              {cnt > 0 && <SubCount>({cnt})</SubCount>}
                            </CatSubItem>
                          );
                        })}
                      </CatSubList>
                    </CatCard>
                  ))}
                </CatGrid>
              </CatScroll>
            )}

            {view === "items" && (
              <ItemScroll>
                {sellError && <ErrTxt>{sellError}</ErrTxt>}
                {!loading && displayItems.length === 0 && <EmptyMsg>No items in this category.</EmptyMsg>}
                <ItemList>
                  {displayItems.map(entry => {
                    const selected = isSelected(entry);
                    const usable = canUse(entry);
                    const sp = getSellPrice(entry);
                    const isSelling = selling === entry._id;
                    return (
                      <ItemCard key={entry._id} $expanded={selected} $locked={!usable} onClick={() => toggleEntry(entry)}>
                        <CardThumbImg
                          src={entry.thumbnailUrl || entry.imageUrl}
                          alt={entry.name}
                          crossOrigin="anonymous"
                        />
                        <CardMidSection>
                          <ItemName>{entry.name}</ItemName>
                          {selected && <WearingBadge>Wearing</WearingBadge>}
                          {!usable && <LevelLockTxt>Level {entry.levelRequirement} required</LevelLockTxt>}
                        </CardMidSection>
                        <CardPricesArea>
                          <CardPricePanel>
                            {!usable && (
                              <LevelBadge $met={false}>Level {entry.levelRequirement}</LevelBadge>
                            )}
                            <BadgeAndPrice>
                              <CoinImg src="/icons/Nectar.png" alt="coins" />
                              <CardPriceAmt>{sp.toLocaleString()}</CardPriceAmt>
                            </BadgeAndPrice>
                          </CardPricePanel>
                          <SellPanel
                            onClick={e => handleSell(entry, e)}
                            disabled={isSelling}
                          >
                            {isSelling ? "…" : "SELL"}
                          </SellPanel>
                        </CardPricesArea>
                      </ItemCard>
                    );
                  })}
                </ItemList>
                {loading && <LoadMsg>Loading…</LoadMsg>}
              </ItemScroll>
            )}
          </ContentArea>

          <AvatarPanel>
            <AvatarArea>
              <AvatarBg src="/inventory-background.png" alt="" />
              <AvatarCanvas gender={gender} outfit={previewAvatar} width={320} height={722} pose={pose} />
            </AvatarArea>
            <PoseBar>
              <PoseArrow onClick={() => setPose(p => p === maxPose ? 0 : p + 1)}>‹</PoseArrow>
              {Array.from({ length: maxPose + 1 }).map((_, i) => (
                <PoseDot key={i} $active={i === pose} onClick={() => setPose(i)} />
              ))}
              <PoseArrow onClick={() => setPose(p => p === 0 ? maxPose : p - 1)}>›</PoseArrow>
            </PoseBar>
            <AvatarBottom>
              <NudeBtn onClick={handleNude}>Remove All</NudeBtn>
              <ResetBtn onClick={handleReset}>Reset</ResetBtn>
              <ApplyBtn onClick={handleApply} disabled={!hasChanges}>Apply
              </ApplyBtn>
            </AvatarBottom>
          </AvatarPanel>
        </Body>
      </Container>
    </Overlay>
  );
}

export default InventoryModal;

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
  txt:      "#2e1065",
  txt2:     "#5b3fa0",
  txt3:     "#a98fd4",
  coin:     "#b45309",
};

const thinScrollbar = css`
  &::-webkit-scrollbar { width: 4px; height: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(80,40,160,0.2); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(80,40,160,0.4); }
  scrollbar-width: thin;
  scrollbar-color: rgba(80,40,160,0.2) transparent;
`;

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const glassShine = keyframes`
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
`;

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

const InvName = styled.h2`
  margin:0;font-size:28px;font-weight:900;letter-spacing:0.2px;
  background:linear-gradient(120deg,#7c3aed,#c026d3,#0ea5e9);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
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

const Sidebar = styled.div`
  width:168px;flex-shrink:0;
  border-right:1px solid ${C.border};
  padding:16px 10px;
  display:flex;flex-direction:column;gap:8px;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
`;

const CrumbStep = styled.button`
  position:relative;overflow:hidden;
  background:${p => p.$active
    ? "linear-gradient(145deg,rgba(124,58,237,0.16),rgba(157,111,245,0.1))"
    : "linear-gradient(145deg,rgba(255,255,255,0.72),rgba(237,230,255,0.55))"};
  border:1px solid ${p => p.$active ? "rgba(124,58,237,0.38)" : "rgba(124,58,237,0.18)"};
  border-radius:14px;
  color:${p => p.$active ? C.txt : C.txt2};
  font-size:24px;font-weight:600;
  padding:60px 14px;min-height:64px;
  text-align:left;
  cursor:${p => p.$clickable ? "pointer" : "default"};
  display:flex;align-items:center;justify-content:center;gap:6px;
  box-shadow:0 2px 8px rgba(124,58,237,0.08),inset 0 1px 0 rgba(255,255,255,0.65);
  transition:transform .18s,box-shadow .18s,border-color .18s,background .18s;

  &::before {
    content:'';position:absolute;top:-20%;left:-60%;
    width:32%;height:140%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent);
    transform:skewX(-18deg) translateX(-100%);
    pointer-events:none;
  }

  ${p => p.$clickable && css`
    &:hover {
      border-color:rgba(124,58,237,0.48);
      background:linear-gradient(145deg,rgba(124,58,237,0.12),rgba(157,111,245,0.07));
      box-shadow:0 6px 20px rgba(124,58,237,0.16),inset 0 1px 0 rgba(255,255,255,0.75);
      transform:translateY(-2px);
      color:${C.txt};
    }
    &:hover::before { animation:${glassShine} 0.52s ease-out forwards; }
  `}
`;

const ContentArea = styled.div`flex:1;overflow:hidden;display:flex;flex-direction:column;`;

const CatScroll = styled.div`
  flex:1;overflow-y:auto;padding:24px;
  background:linear-gradient(160deg,#fdfbff 0%,#f8f3ff 100%);
  ${thinScrollbar}
`;

const CatGrid = styled.div`
  display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;
`;

const CatCard = styled.div`
  position:relative;
  background:${C.surface};border:1px solid ${C.border};border-radius:14px;
  overflow:hidden;transition:border-color .15s,box-shadow .15s;
  &:hover{border-color:rgba(124,58,237,0.35);box-shadow:0 4px 18px rgba(100,50,200,0.1);}
`;

const CatCardDeco = styled.img`
  position:absolute;z-index:1;right:-10px;bottom:0;
  height:80%;width:auto;object-fit:contain;
  opacity:0.11;user-select:none;filter:saturate(0);pointer-events:none;
  transition:transform 0.2s ease,scale 0.2s ease;
  ${CatCard}:hover & { transform:translateX(-5px);scale:1.05; }
`;

const CatCardTop = styled.div`
  display:flex;align-items:center;gap:10px;
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
  padding:13px 14px;cursor:pointer;
  border-bottom:1px solid ${C.border};
  transition:background 0.13s;
  &:hover{background:linear-gradient(120deg,#ae97ff,#f8c8ff,#bfd5ff);}
`;

const CatLabel = styled.span`font-size:16px;font-weight:700;color:${C.txt};flex:1;`;
const CatArrow = styled.span`font-size:14px;color:${C.txt3};transition:transform .13s;${CatCardTop}:hover &{transform:translateX(2px);}`;

const CatSubList = styled.div`padding:8px 14px 12px;display:flex;flex-direction:column;gap:1px;`;

const CatSubItem = styled.div`
  font-size:12px;color:${C.txt2};padding:4px 0;
  cursor:pointer;transition:color .1s;
  width:fit-content;display:flex;align-items:center;gap:5px;
  &:hover{color:${C.accent};font-weight:700;}
`;

const SubCount = styled.span`
  font-size:11px;color:${C.txt3};font-weight:500;
`;

const ItemScroll = styled.div`
  flex:1;overflow-y:auto;padding:6px;display:flex;flex-direction:column;gap:0;
  background:linear-gradient(160deg,#fdfbff 0%,#f8f3ff 100%);
  ${thinScrollbar}
`;

const EmptyMsg = styled.div`text-align:center;color:${C.txt3};padding:48px 0;font-size:14px;`;
const LoadMsg = styled.div`text-align:center;color:${C.txt3};padding:16px;font-size:13px;`;
const ErrTxt = styled.div`font-size:12px;color:#dc2626;padding:8px 12px;`;

const ItemList = styled.div`display:flex;flex-direction:column;gap:6px;`;

const ItemCard = styled.div`
  display:flex;align-items:center;gap:5px;padding:5px;
  border-radius:14px;
  background:linear-gradient(to top,#ddd0f8,#f8f3ff);
  border:1px solid ${p => p.$expanded ? "rgba(124,58,237,0.45)" : C.border};
  min-height:88px;cursor:pointer;
  opacity:${p => p.$locked ? 0.65 : 1};
  transition:border-color .15s,box-shadow .15s;
  &:hover{border-color:${C.border2};box-shadow:0 2px 10px rgba(120,60,220,0.1);}
`;

const CardThumbImg = styled.img`flex-shrink:0;width:76px;height:76px;object-fit:contain;`;

const CardMidSection = styled.div`
  flex:1;min-width:0;border-radius:10px;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;flex-direction:column;justify-content:center;
  padding:8px 12px;align-self:stretch;gap:4px;
`;

const ItemName = styled.div`
  font-size:13px;font-weight:700;color:${C.txt};
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`;

const WearingBadge = styled.div`
  display:inline-flex;align-items:center;
  font-size:10px;font-weight:700;color:${C.accent};
  background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);
  border-radius:4px;padding:2px 7px;width:fit-content;
`;

const LevelLockTxt = styled.div`font-size:10px;font-weight:600;color:#dc2626;`;

const CardPricesArea = styled.div`
  display:flex;flex-direction:row;gap:5px;flex-shrink:0;align-self:stretch;
  width:35%;
`;

const CardPricePanel = styled.div`
  border-radius:10px;overflow:hidden;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:6px;padding:12px 24px;
  width:50%;
`;

const BadgeAndPrice = styled.div`display:flex;gap:6px;align-items:center;`;

const CardPriceAmt = styled.div`font-size:13px;font-weight:700;color:${C.coin};`;

const CoinImg = styled.img`width:32px;height:32px;object-fit:contain;`;

const LevelBadge = styled.div`
  font-size:12px;font-weight:700;line-height:1.2;
  padding:4px 10px;border-radius:4px;
  align-self:stretch;text-align:center;
  background:rgba(220,38,38,0.1);color:#dc2626;
  border:1px solid rgba(220,38,38,0.3);
  text-wrap:nowrap;
`;

const SellPanel = styled.button`
  width:50%;border-radius:10px;
  background:linear-gradient(to top,#ede5ff,#ffffff);
  display:flex;align-items:center;justify-content:center;
  border:1px solid ${C.border};
  cursor:pointer;
  font-size:12px;font-weight:700;color:${C.accent};
  transition:background .13s,border-color .13s;
  &:hover:not(:disabled){background:${C.card};border-color:${C.border2};}
  &:disabled{opacity:0.5;cursor:not-allowed;}
`;

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
  opacity: 50%;
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
  display:flex;align-items:center;gap:8px;flex-shrink:0;
`;

const Balance = styled.div`display:flex;gap:10px;flex:1;`;
const Bal = styled.div`
  display:flex;align-items:center;gap:5px;
  font-size:13px;font-weight:600;color:${C.txt2};
`;
const BalImg = styled.img`width:16px;height:16px;object-fit:contain;`;

const ApplyBtn = styled.button`
  position:relative;padding:8px 16px;border-radius:9px;
  border:1px solid rgba(124,58,237,0.3);
  background:rgba(124,58,237,0.1);
  color:${C.accent};font-size:13px;font-weight:600;cursor:pointer;
  white-space:nowrap;transition:all .14s;
  &:hover:not(:disabled){background:rgba(124,58,237,0.18);}
  &:disabled{opacity:0.38;cursor:not-allowed;border-color:${C.border};}
`;

const NudeBtn = styled.button`
  padding:8px 12px;border-radius:9px;
  border:1px solid rgba(220,38,38,0.3);
  background:rgba(220,38,38,0.07);
  color:#dc2626;font-size:12px;cursor:pointer;
  white-space:nowrap;transition:all .13s;flex:1;
  &:hover{background:rgba(220,38,38,0.14);border-color:rgba(220,38,38,0.5);}
`;

const ResetBtn = styled.button`
  padding:8px 12px;border-radius:9px;
  border:1px solid ${C.border};
  background:transparent;
  color:${C.txt3};font-size:12px;cursor:pointer;
  white-space:nowrap;transition:all .13s;
  &:hover{color:${C.txt2};border-color:${C.border2};}
`;
