import { useState, useEffect } from "react";
import styled from "styled-components";
import { fetchItems } from "../api/items";

const CATEGORY_LABELS = {
  tops: "Tops",
  bottoms: "Bottoms",
  coats: "Coats",
  head: "Head",
  hair: "Hair",
  accessories: "Accessories",
  feet: "Feet",
  hands: "Hands",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function InventoryModal({ onClose, onEquip, onUnequip, equipped }) {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("tops");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems()
      .then((data) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => item.category === activeTab);

  const isEquipped = (item) => equipped[item.category] === item._id;

  const handleClick = (item) => {
    if (isEquipped(item)) {
      onUnequip(item.category);
    } else {
      onEquip(item);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>&times;</CloseBtn>
        <Title>Inventory</Title>

        <Tabs>
          {CATEGORIES.map((cat) => (
            <Tab
              key={cat}
              $active={activeTab === cat}
              onClick={() => setActiveTab(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </Tab>
          ))}
        </Tabs>

        <ItemGrid>
          {loading && <Empty>Loading...</Empty>}
          {!loading && filtered.length === 0 && (
            <Empty>No items in this category</Empty>
          )}
          {filtered.map((item) => (
            <ItemCard
              key={item._id}
              $equipped={isEquipped(item)}
              onClick={() => handleClick(item)}
            >
              <ItemImg src={item.imageUrl} alt={item.name} crossOrigin="anonymous" />
              <ItemName>{item.name}</ItemName>
              <ItemSub>
                {item.subcategory.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </ItemSub>
              {isEquipped(item) && <EquippedBadge>Equipped</EquippedBadge>}
            </ItemCard>
          ))}
        </ItemGrid>
      </Modal>
    </Overlay>
  );
}

export default InventoryModal;

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  background: #1a1a2e;
  border: 1px solid #ffffff22;
  border-radius: 14px;
  padding: 28px;
  width: 600px;
  max-width: 94vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  color: #fff;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  &:hover { color: #fff; }
`;

const Title = styled.h2`
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  background: ${(p) => (p.$active ? "linear-gradient(135deg, #7b2ff7, #c471ed)" : "#12121f")};
  border: 1px solid ${(p) => (p.$active ? "#7b2ff7" : "#ffffff22")};
  color: ${(p) => (p.$active ? "#fff" : "#aaa")};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    color: #fff;
    border-color: #7b2ff7;
  }
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
`;

const ItemCard = styled.div`
  background: ${(p) => (p.$equipped ? "#2a1f4e" : "#12121f")};
  border: 2px solid ${(p) => (p.$equipped ? "#7b2ff7" : "#ffffff15")};
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.15s;
  &:hover {
    border-color: #7b2ff7;
    transform: translateY(-2px);
  }
`;

const ItemImg = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 6px;
`;

const ItemName = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const ItemSub = styled.div`
  font-size: 10px;
  color: #888;
  margin-top: 2px;
`;

const EquippedBadge = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: #7b2ff7;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
`;

const Empty = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  color: #666;
  padding: 40px 0;
  font-size: 14px;
`;
