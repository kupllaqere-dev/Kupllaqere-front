import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { SEEDS, getRarity } from "../game/PlanterSystem";

// Fixed-size bag. Seeds picked up in the Garden fill it in catalogue order;
// everything else collectible can claim the remaining slots later.
const SLOT_COUNT = 64;
const COLS = 8;

const PANEL_BG = "#3b1478";
const PANEL_BG_HOVER = "#4d1f9c";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40, 15, 90, 0.52);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  width: min(94%, 720px);
  max-height: 88%;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: ${PANEL_BG};
  border: 2px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 32px 80px rgba(80, 30, 180, 0.35), 0 0 40px rgba(140, 70, 245, 0.25);
  animation: ${fadeIn} 0.22s ease;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
`;

const Count = styled.span`
  margin-left: auto;
  margin-right: 36px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: rgba(210, 175, 255, 0.9);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${COLS}, 1fr);
  gap: 8px;
  padding: 18px 20px 22px;
  overflow-y: auto;
`;

const Slot = styled.button`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.24);
  border: 1.5px solid ${({ $rarity }) => $rarity || "rgba(180, 120, 255, 0.35)"};
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease,
    box-shadow 0.15s ease;

  img {
    width: 82%;
    height: 82%;
    object-fit: contain;
    pointer-events: none;
  }

  &:hover {
    background: ${PANEL_BG_HOVER};
    border-color: rgba(235, 210, 255, 0.95);
    box-shadow: 0 0 12px rgba(180, 120, 255, 0.55);
  }

  &:active { transform: scale(0.94); }

  ${({ $selected }) =>
    $selected &&
    css`
      background: rgba(155, 55, 240, 0.34);
      border-color: rgba(235, 210, 255, 0.95);
      box-shadow: 0 0 18px rgba(185, 40, 255, 0.55), inset 0 0 14px rgba(160, 60, 255, 0.25);
    `}
`;

// Stack size, tucked into the corner of the slot the way a bag would show it.
const Stack = styled.span`
  position: absolute;
  right: 3px;
  bottom: 2px;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  pointer-events: none;
`;

const FooterName = styled.span`
  font-weight: 800;
  color: #f0e2ff;
`;

const FooterTag = styled.span`
  margin-left: 8px;
  font-weight: 700;
  color: ${({ $color }) => $color};
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 20px 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: rgba(210, 175, 255, 0.75);
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.45);
  color: rgba(255, 255, 255, 0.85);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(0, 0, 0, 0.7); }
`;

export default function CollectiblesModal({ onClose, seeds = {} }) {
  const [selected, setSelected] = useState(null);

  // One slot per kind held, stacked — a bagful of Sunflower seeds is one slot
  // reading "x12", not twelve slots.
  const held = SEEDS.filter((seed) => (seeds[seed.id] ?? 0) > 0).map((seed) => ({
    ...seed,
    count: seeds[seed.id],
  }));

  const slots = Array(SLOT_COUNT).fill(null);
  held.slice(0, SLOT_COUNT).forEach((item, i) => { slots[i] = item; });

  const filled = held.length;
  const selectedItem = selected == null ? null : slots[selected];
  const tier = selectedItem ? getRarity(selectedItem.rarity) : null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Collectibles</Title>
          <Count>{filled} / {SLOT_COUNT}</Count>
        </Header>

        <Grid>
          {slots.map((item, i) => (
            <Slot
              key={i}
              $selected={selected === i}
              $rarity={item ? getRarity(item.rarity).color : null}
              onClick={() => setSelected(i)}
              title={item ? `${item.name} seed x${item.count}` : `Empty slot ${i + 1}`}
            >
              {item?.icon}
              {item && item.count > 1 && <Stack>{item.count}</Stack>}
            </Slot>
          ))}
        </Grid>

        <Footer>
          {selectedItem ? (
            <>
              <FooterName>{selectedItem.name} seed</FooterName>
              <FooterTag $color={tier.color}>{tier.label}</FooterTag>
              <FooterTag $color="rgba(200, 180, 235, 0.75)">
                x{selectedItem.count} · sow it in the Farm planter
              </FooterTag>
            </>
          ) : filled === 0 ? (
            "Nothing collected yet — seeds drop in the Garden."
          ) : (
            "Select a slot to inspect it."
          )}
        </Footer>

        <CloseBtn onClick={onClose}>&times;</CloseBtn>
      </Modal>
    </Overlay>
  );
}
