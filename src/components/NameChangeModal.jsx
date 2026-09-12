import { useState } from "react";
import styled, { keyframes } from "styled-components";

/* Spending a Name Change from the Collectibles bag. Two steps on purpose: the
   item is consumed by the rename and there is no undo, so typing a name and
   confirming it are separate decisions. */

const NAME_MAX = 20;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(20, 6, 45, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Popup = styled.div`
  width: min(92%, 380px);
  padding: 22px;
  box-sizing: border-box;
  border-radius: 18px;
  background: linear-gradient(165deg, rgba(62, 24, 126, 0.98), rgba(28, 10, 58, 0.98));
  border: 1.5px solid rgba(190, 150, 255, 0.4);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(150, 60, 245, 0.2);
  animation: ${fadeIn} 0.18s ease;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #f3e8ff;
`;

const Sub = styled.p`
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(205, 180, 245, 0.72);
`;

const Field = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid rgba(190, 150, 255, 0.4);
  background: rgba(12, 4, 28, 0.85);
  color: #fff6dd;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  outline: none;

  &:focus {
    border-color: rgba(215, 180, 255, 0.9);
    box-shadow: 0 0 0 3px rgba(150, 80, 255, 0.22);
  }
`;

/* The name as typed, echoed back at the confirm step so what is about to be
   committed is unmistakable. */
const Preview = styled.div`
  padding: 13px 15px;
  border-radius: 10px;
  background: rgba(12, 4, 28, 0.7);
  border: 1.5px solid rgba(190, 150, 255, 0.32);
  font-size: 17px;
  font-weight: 900;
  text-align: center;
  word-break: break-word;
  color: #fff6dd;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
`;

const Count = styled.span`
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  color: rgba(200, 180, 235, 0.6);
`;

const Button = styled.button`
  padding: 9px 18px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $primary }) => ($primary ? "linear-gradient(180deg, #9b37f0, #6d21c0)" : "transparent")};
  border-color: ${({ $primary }) => ($primary ? "rgba(220,170,255,0.55)" : "rgba(190,150,255,0.3)")};
  color: ${({ $primary }) => ($primary ? "#fff" : "rgba(210, 190, 245, 0.85)")};

  &:hover:not(:disabled) {
    background: ${({ $primary }) => ($primary ? "linear-gradient(180deg, #ad4fff, #7c2ada)" : "rgba(255, 255, 255, 0.08)")};
    color: #fff;
  }

  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const Message = styled.div`
  margin-top: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #ff9d9d;
`;

export default function NameChangeModal({ currentName = "", onConfirm, onClose }) {
  const [step, setStep] = useState("enter"); // "enter" | "confirm"
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const trimmed = value.trim();
  const unchanged = trimmed === currentName;
  const canAccept = trimmed.length > 0 && !unchanged;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError(err.message);
      setStep("enter"); // let them fix a taken name without losing the popup
    } finally {
      setBusy(false);
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Popup onClick={(e) => e.stopPropagation()}>
        {step === "enter" ? (
          <>
            <Title>Name Change</Title>
            <Sub>
              Pick your new display name. This uses up the item, so nothing is
              spent until you confirm on the next step.
            </Sub>
            <Field
              autoFocus
              value={value}
              maxLength={NAME_MAX}
              placeholder={currentName || "New name"}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAccept) setStep("confirm");
                else if (e.key === "Escape") onClose();
              }}
              aria-label="New display name"
            />
            <Row>
              <Count>
                {trimmed.length}/{NAME_MAX}
                {unchanged && trimmed.length > 0 && " · that's your name already"}
              </Count>
              <Button onClick={onClose}>Decline</Button>
              <Button $primary disabled={!canAccept} onClick={() => setStep("confirm")}>
                Accept
              </Button>
            </Row>
            {error && <Message>{error}</Message>}
          </>
        ) : (
          <>
            <Title>Change your name to this?</Title>
            <Sub>
              Your Name Change item is used up when you confirm, and this cannot
              be undone.
            </Sub>
            <Preview>{trimmed}</Preview>
            <Row>
              <Count />
              <Button disabled={busy} onClick={() => setStep("enter")}>Back</Button>
              <Button $primary disabled={busy} onClick={handleConfirm}>
                {busy ? "Changing…" : "Confirm"}
              </Button>
            </Row>
            {error && <Message>{error}</Message>}
          </>
        )}
      </Popup>
    </Overlay>
  );
}
