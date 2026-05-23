import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { fetchWishlist, removeFromWishlist } from "../api/store";

const STORE_LABELS = {
  normal: "Normal Store",
  gem: "Gem Store",
  seasonal: "Seasonal Store",
};

function storeLabel(type) {
  return STORE_LABELS[type] || (type ? type : "Store");
}

export default function WishlistModal({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(new Set());

  useEffect(() => {
    fetchWishlist()
      .then(({ items }) => setItems(items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (itemId) => {
    setRemoving(prev => new Set(prev).add(itemId));
    try {
      await removeFromWishlist({ itemId });
      setItems(prev => prev.filter(i => i.itemId !== itemId));
    } catch { /* ignore */ }
    finally {
      setRemoving(prev => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Container onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Wishlist</Title>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>
        <Body>
          {loading && <StatusMsg>Loading…</StatusMsg>}
          {!loading && items.length === 0 && (
            <StatusMsg>Your wishlist is empty.</StatusMsg>
          )}
          {!loading && items.length > 0 && (
            <List>
              {items.map(item => (
                <Item key={item.wishlistId}>
                  <Thumb
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.name}
                    crossOrigin="anonymous"
                  />
                  <Info>
                    <ItemName>{item.name}</ItemName>
                    <StoreTag>{storeLabel(item.storeType)}</StoreTag>
                  </Info>
                  <RemoveBtn
                    onClick={() => handleRemove(item.itemId)}
                    disabled={removing.has(item.itemId)}
                    title="Remove from wishlist"
                  >
                    ✕
                  </RemoveBtn>
                </Item>
              ))}
            </List>
          )}
        </Body>
      </Container>
    </Overlay>
  );
}

/* ─── palette (matches StoreModal) ─── */
const C = {
  bg:      "#f7f3ff",
  surface: "#ffffff",
  border:  "rgba(130,80,220,0.14)",
  border2: "rgba(130,80,220,0.26)",
  accent:  "#7c3aed",
  txt:     "#2e1065",
  txt2:    "#5b3fa0",
  txt3:    "#a98fd4",
};

const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

const Overlay = styled.div`
  position:fixed;inset:0;z-index:9999;
  background:rgba(40,15,90,0.52);
  backdrop-filter:blur(10px);
  display:flex;align-items:center;justify-content:center;
`;

const Container = styled.div`
  background:${C.surface};
  border:1px solid ${C.border};
  border-radius:18px;
  width:min(92%,480px);
  max-height:80%;
  display:flex;flex-direction:column;
  box-shadow:0 24px 64px rgba(80,30,180,0.18),inset 0 1px 0 rgba(255,255,255,0.9);
  overflow:hidden;
  color:${C.txt};
  animation:${fadeIn} 0.2s ease;
`;

const Header = styled.div`
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;
  border-bottom:1px solid ${C.border};
  background:linear-gradient(135deg,#ede8ff,#fce8ff,#e8f0ff);
  flex-shrink:0;
`;

const Title = styled.h2`
  margin:0;font-size:20px;font-weight:900;letter-spacing:0.2px;
  background:linear-gradient(120deg,#7c3aed,#c026d3,#0ea5e9);
  -webkit-text-fill-color:transparent;
  -webkit-background-clip:text;
`;

const CloseBtn = styled.button`
  background:none;border:none;cursor:pointer;
  font-size:16px;color:${C.txt3};padding:4px 8px;border-radius:6px;
  transition:color .13s,background .13s;
  &:hover{color:${C.txt};background:rgba(124,58,237,0.08);}
`;

const Body = styled.div`
  flex:1;overflow-y:auto;padding:12px 16px;
  &::-webkit-scrollbar{width:4px;}
  &::-webkit-scrollbar-thumb{background:rgba(80,40,160,0.2);border-radius:4px;}
`;

const StatusMsg = styled.div`
  text-align:center;padding:40px 0;
  font-size:13px;color:${C.txt3};
`;

const List = styled.div`display:flex;flex-direction:column;gap:8px;`;

const Item = styled.div`
  display:flex;align-items:center;gap:12px;
  padding:10px 12px;border-radius:10px;
  border:1px solid ${C.border};
  background:linear-gradient(135deg,#f9f6ff,#fff);
  transition:border-color .13s;
  &:hover{border-color:${C.border2};}
`;

const Thumb = styled.img`
  width:52px;height:52px;object-fit:contain;border-radius:7px;
  background:rgba(124,58,237,0.05);flex-shrink:0;
`;

const Info = styled.div`flex:1;min-width:0;`;

const ItemName = styled.div`
  font-size:13px;font-weight:700;color:${C.txt};
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
`;

const StoreTag = styled.div`
  margin-top:3px;display:inline-block;
  font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;
  color:${C.accent};background:rgba(124,58,237,0.08);
  border:1px solid rgba(124,58,237,0.18);border-radius:4px;
  padding:2px 7px;
`;

const RemoveBtn = styled.button`
  background:none;border:none;cursor:pointer;flex-shrink:0;
  font-size:13px;color:${C.txt3};padding:4px 8px;border-radius:6px;
  transition:color .13s,background .13s;
  &:hover:not(:disabled){color:#ef4444;background:rgba(239,68,68,0.08);}
  &:disabled{opacity:0.4;cursor:default;}
`;
