import { forwardRef, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";

const Popup = styled.div`
  position: fixed;
  z-index: 1200;
  width: 248px;
  padding: 14px;
  box-sizing: border-box;
  border-radius: 14px;
  background: rgba(34, 32, 30, 0.96);
  border: 1px solid rgba(216, 178, 106, 0.45);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  font-family: Quicksand, Nunito, Poppins, sans-serif;
  transform: translate(-50%, -118%);
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #f4dcae;
`;

const Note = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(225, 218, 205, 0.75);
`;

const Divider = styled.div`
  height: 1px;
  margin: 12px 0;
  background: rgba(216, 178, 106, 0.22);
`;

const Line = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(225, 218, 205, 0.85);

  & + & {
    margin-top: 6px;
  }
`;

const Amount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  color: ${({ $short }) => ($short ? "#ff8f7a" : "#f4dcae")};
`;

const LisIcon = styled.img`
  width: 18px;
  height: 18px;
  object-fit: contain;
`;

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
`;

const Button = styled.button`
  padding: 7px 14px;
  border-radius: 9px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;

  background: ${({ $primary }) => ($primary ? "#c99a45" : "transparent")};
  color: ${({ $primary }) => ($primary ? "#231d14" : "rgba(225, 218, 205, 0.85)")};

  &:hover:not(:disabled) {
    background: ${({ $primary }) => ($primary ? "#ddb15c" : "rgba(255, 255, 255, 0.08)")};
    color: ${({ $primary }) => ($primary ? "#231d14" : "#fff")};
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

/**
 * Anchored confirmation for buying something in the world with Lis — the
 * Farm's extra planters. Rendered into document.body, so `x`/`y` are viewport
 * coordinates.
 */
const UnlockPopup = forwardRef(function UnlockPopup(
  { x, y, title, price, balance, onConfirm, onClose },
  ref,
) {
  const innerRef = useRef(null);
  const short = balance < price;

  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Phaser listens for mousedown/pointerdown on `window` too (see RenamePopup),
  // so keep clicks in here from reaching whatever sits behind the popup.
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

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Popup ref={setRefs} onContextMenu={(e) => e.preventDefault()} style={{ left: x, top: y }}>
      <Title>{title}</Title>
      <Note>25 more plots to grow in.</Note>
      <Divider />
      <Line>
        Price
        <Amount>
          <LisIcon src="/icons/Lis.png" alt="" />
          {price.toLocaleString()}
        </Amount>
      </Line>
      <Line>
        You have
        <Amount $short={short}>
          <LisIcon src="/icons/Lis.png" alt="" />
          {balance.toLocaleString()}
        </Amount>
      </Line>
      <Row>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          $primary
          disabled={short}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {short ? "Not enough Lis" : "Unlock"}
        </Button>
      </Row>
    </Popup>
  );
});

export default UnlockPopup;
