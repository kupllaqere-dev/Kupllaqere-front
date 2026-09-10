import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Popup = styled.div`
  position: fixed;
  z-index: 1200;
  width: 268px;
  padding: 12px;
  box-sizing: border-box;
  border-radius: 14px;
  background: rgba(28, 10, 58, 0.96);
  border: 1px solid rgba(190, 150, 255, 0.35);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
  font-family: Quicksand, Nunito, Poppins, sans-serif;
  transform: translate(-50%, -118%);
`;

const Title = styled.div`
  padding: 0 2px 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #f0e2ff;
`;

const Field = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid rgba(190, 150, 255, 0.4);
  background: rgba(12, 4, 28, 0.85);
  color: #fff6dd;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  outline: none;

  &:focus {
    border-color: rgba(215, 180, 255, 0.9);
    box-shadow: 0 0 0 3px rgba(150, 80, 255, 0.22);
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const Count = styled.span`
  flex: 1;
  font-size: 11px;
  color: rgba(200, 180, 235, 0.75);
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

  background: ${({ $primary }) => ($primary ? "rgba(150, 80, 255, 0.55)" : "transparent")};
  color: ${({ $primary }) => ($primary ? "#fff" : "rgba(210, 190, 245, 0.85)")};

  &:hover {
    background: ${({ $primary }) => ($primary ? "rgba(165, 95, 255, 0.8)" : "rgba(255, 255, 255, 0.1)")};
    color: #fff;
  }
`;

/**
 * Anchored popup for renaming something in the world — currently the planter's
 * name board. Rendered into document.body, so `x`/`y` are viewport coordinates.
 */
const RenamePopup = forwardRef(function RenamePopup(
  { x, y, title, initialValue, maxLength, onSave, onClose },
  ref,
) {
  const [value, setValue] = useState(initialValue ?? "");
  const innerRef = useRef(null);
  const inputRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Phaser also listens for mousedown/pointerdown on `window` and processes any
  // event whose target isn't the canvas (see MouseManager.startListeners), so
  // without this a click in the field would additionally be hit-tested against
  // whatever sits behind the popup.
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
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    onSave(value);
    onClose();
  };

  return (
    <Popup ref={setRefs} onContextMenu={(e) => e.preventDefault()}  style={{ left: x, top: y }}>
      <Title>{title}</Title>
      <Field
        ref={inputRef}
        value={value}
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Keep Enter/Escape from reaching anything behind the popup.
          e.stopPropagation();
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") onClose();
        }}
        aria-label={title}
      />
      <Row>
        <Count>
          {value.trim().length}/{maxLength}
        </Count>
        <Button onClick={onClose}>Cancel</Button>
        <Button $primary onClick={commit}>
          Save
        </Button>
      </Row>
    </Popup>
  );
});

export default RenamePopup;
