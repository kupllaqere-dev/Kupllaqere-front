import { forwardRef, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { getRarity } from "../game/PlanterSystem";

const Menu = styled.div`
  position: fixed;
  z-index: 1200;
  width: 232px;
  padding: 8px;
  box-sizing: border-box;
  border-radius: 14px;
  background: rgba(28, 10, 58, 0.95);
  border: 1px solid rgba(190, 150, 255, 0.35);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  font-family: Quicksand, Nunito, Poppins, sans-serif;
  transform: translate(-50%, -108%);
`;

const Title = styled.div`
  padding: 2px 6px 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #f0e2ff;
`;

const ItemRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: rgba(235, 220, 255, 0.9);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: rgba(150, 80, 255, 0.28);
    color: #fff;
  }

  span[data-emoji] {
    font-size: 20px;
    line-height: 1;
  }

  span[data-name] {
    flex: 1;
  }
`;

// Coins and XP are visually distinct so the two seed types read apart at a glance.
const Reward = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 3px 7px;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $type }) => ($type === "xp" ? "#bfe9ff" : "#ffe9a8")};
  background: ${({ $type }) =>
    $type === "xp" ? "rgba(60, 150, 220, 0.22)" : "rgba(255, 190, 40, 0.16)"};
  border: 1px solid
    ${({ $type }) => ($type === "xp" ? "rgba(120, 200, 255, 0.45)" : "rgba(255, 200, 70, 0.4)")};
`;

// How many of this seed are left in the bag. Fruit rows carry no count.
const Count = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  color: rgba(235, 220, 255, 0.85);
`;

// A thin rarity stripe down the row, so scarce seeds stand out in the list.
const Rarity = styled.span`
  width: 3px;
  align-self: stretch;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`;

const Empty = styled.div`
  padding: 10px 8px 12px;
  font-size: 12px;
  color: rgba(200, 180, 235, 0.8);
`;

const Footer = styled.div`
  padding: 8px 8px 2px;
  margin-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 11px;
  color: rgba(200, 180, 235, 0.75);
`;

function rewardLabel({ type, amount }) {
  return type === "xp" ? `+${amount} XP` : `+${amount.toLocaleString()} coins`;
}

/**
 * Anchored popup for choosing what to plant — a seed in a planter plot, or a
 * fruit on the tree. `items` supply `{ id, name, icon, reward }`, plus an
 * optional `rarity` and `count` for things held in a limited stock.
 * `empty` is shown when there is nothing to pick.
 * Rendered into document.body, so `x`/`y` are viewport coordinates.
 */
const PlantPicker = forwardRef(function PlantPicker(
  { x, y, title, items, empty, footer, onPick, onClose },
  ref,
) {
  const innerRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Phaser also listens for mousedown/pointerdown on `window` and processes any
  // event whose target isn't the canvas (see MouseManager.startListeners). The
  // popup floats above the bed, so without this a click on a seed row would
  // additionally be hit-tested against whichever plot sits behind the popup —
  // which for a front-row plot is a plot further back, reopening the menu there.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const swallow = (e) => e.stopPropagation();
    el.addEventListener("mousedown", swallow);
    el.addEventListener("pointerdown", swallow);
    el.addEventListener("touchstart", swallow);
    return () => {
      el.removeEventListener("mousedown", swallow);
      el.removeEventListener("pointerdown", swallow);
      el.removeEventListener("touchstart", swallow);
    };
  }, []);

  return (
    <Menu ref={setRefs} style={{ left: x, top: y }} onContextMenu={(e) => e.preventDefault()}>
      <Title>{title}</Title>
      {items.length === 0 && <Empty>{empty}</Empty>}
      {items.map((item) => (
        <ItemRow
          key={item.id}
          onClick={() => {
            onPick(item.id);
            onClose();
          }}
        >
          {item.rarity && <Rarity $color={getRarity(item.rarity).color} />}
          <span data-emoji>{item.icon}</span>
          <span data-name>{item.name}</span>
          {item.count !== undefined && <Count>x{item.count}</Count>}
          <Reward $type={item.reward.type}>{rewardLabel(item.reward)}</Reward>
        </ItemRow>
      ))}
      {items.length > 0 && <Footer>{footer}</Footer>}
    </Menu>
  );
});

export default PlantPicker;
