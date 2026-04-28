import { useState, useEffect } from "react";
import styled from "styled-components";
import AvatarCanvas from "./AvatarCanvas";
import { fetchInventory } from "../api/store";

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

function InventoryModal({ onClose, onEquip, onUnequip, equipped, currentOutfit, gender }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  // previewOutfit: category -> { imageUrl }
  const [previewOutfit, setPreviewOutfit] = useState(currentOutfit || {});

  useEffect(() => {
    fetchInventory()
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "all"
    ? items
    : items.filter((item) => item.category === activeCategory);

  const isPreviewSelected = (item) =>
    previewOutfit[item.category]?.imageUrl === item.imageUrl;

  const toggleItem = (item) => {
    setPreviewOutfit((prev) => {
      if (prev[item.category]?.imageUrl === item.imageUrl) {
        const next = { ...prev };
        delete next[item.category];
        return next;
      }
      return { ...prev, [item.category]: { imageUrl: item.imageUrl } };
    });
  };

  const handleApply = () => {
    // Find categories to unequip (in current equipped but not in previewOutfit)
    const currentCategories = Object.keys(equipped || {});
    for (const cat of currentCategories) {
      if (!previewOutfit[cat]) {
        onUnequip(cat);
      }
    }
    // Find items to equip (in previewOutfit)
    for (const [cat, { imageUrl }] of Object.entries(previewOutfit)) {
      const item = items.find((i) => i.category === cat && i.imageUrl === imageUrl);
      if (item) {
        onEquip(item);
      }
    }
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Inventory</Title>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>
        </Header>

        <Body>
          {/* Left: category sidebar + item grid */}
          <LeftPanel>
            <Sidebar>
              <CatBtn $active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                All
              </CatBtn>
              {CATEGORIES.map((cat) => (
                <CatBtn key={cat} $active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
                  {CATEGORY_LABELS[cat]}
                </CatBtn>
              ))}
            </Sidebar>

            <ItemArea>
              {loading && <Empty>Loading…</Empty>}
              {!loading && filtered.length === 0 && (
                <Empty>{activeCategory === "all" ? "Your inventory is empty." : "No items in this category."}</Empty>
              )}
              {filtered.map((item) => {
                const selected = isPreviewSelected(item);
                return (
                  <ItemCard key={item._id} $selected={selected} onClick={() => toggleItem(item)}>
                    <ItemImg src={item.thumbnailUrl || item.imageUrl} alt={item.name} crossOrigin="anonymous" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ItemName>{item.name}</ItemName>
                      <ItemSub>{CATEGORY_LABELS[item.category] || item.category}</ItemSub>
                    </div>
                    {selected && <SelectedBadge>On</SelectedBadge>}
                  </ItemCard>
                );
              })}
            </ItemArea>
          </LeftPanel>

          {/* Right: avatar preview + apply */}
          <RightPanel>
            <AvatarFill>
              <AvatarCanvas gender={gender} outfit={previewOutfit} width={320} height={722} />
            </AvatarFill>

            <Actions>
              <ApplyBtn onClick={handleApply}>Apply Outfit</ApplyBtn>
              <ResetBtn onClick={() => setPreviewOutfit(currentOutfit || {})}>Reset</ResetBtn>
            </Actions>
          </RightPanel>
        </Body>
      </Container>
    </Overlay>
  );
}

export default InventoryModal;

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

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 130px;
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
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Empty = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  color: #555;
  padding: 40px 0;
  font-size: 14px;
`;

const ItemCard = styled.div`
  background: ${(p) => p.$selected ? "#2a1f4e" : "#18182a"};
  border: 2px solid ${(p) => p.$selected ? "#7b2ff7" : "#ffffff14"};
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  transition: all 0.12s;
  &:hover { border-color: #7b2ff7; }
`;

const ItemImg = styled.img`
  width: 52px;
  height: 52px;
  object-fit: contain;
  flex-shrink: 0;
`;

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const ItemSub = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 2px;
`;

const SelectedBadge = styled.div`
  background: #7b2ff7;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
`;

const RightPanel = styled.div`
  width: 370px;
  flex-shrink: 0;
  border-left: 1px solid #ffffff10;
  display: flex;
  flex-direction: column;
`;

const AvatarFill = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 12px 0 4px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 16px 14px;
  border-top: 1px solid #ffffff0e;
  flex-shrink: 0;
`;

const ApplyBtn = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #7b2ff7, #c471ed);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.12s;
  &:hover { opacity: 0.85; }
`;

const ResetBtn = styled.button`
  padding: 10px 16px;
  border-radius: 9px;
  border: 1px solid #ffffff18;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  &:hover { color: #fff; border-color: #ffffff33; }
`;
