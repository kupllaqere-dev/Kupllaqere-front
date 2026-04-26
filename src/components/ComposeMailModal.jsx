import { useState } from "react";
import styled from "styled-components";
import { sendMail } from "../api/mail";

const SUBJECT_MAX = 100;
const BODY_MAX = 2000;

export default function ComposeMailModal({ targetId, targetName, onClose, onSent }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await sendMail(targetId, subject.trim(), body.trim());
      setSent(true);
      onSent?.();
    } catch (err) {
      setError(err.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>&times;</CloseBtn>
        <Title>Mail to <span>{targetName}</span></Title>

        {sent ? (
          <SentConfirm>
            <SentIcon>✓</SentIcon>
            <SentText>Mail sent!</SentText>
            <DoneBtn onClick={onClose}>Close</DoneBtn>
          </SentConfirm>
        ) : (
          <>
            <Field>
              <Label>Subject</Label>
              <SubjectInput
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={SUBJECT_MAX}
                placeholder="Enter subject…"
                disabled={sending}
              />
              <Counter>{subject.length}/{SUBJECT_MAX}</Counter>
            </Field>

            <Field>
              <Label>Message</Label>
              <BodyTextarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={BODY_MAX}
                placeholder="Write your message…"
                disabled={sending}
              />
              <Counter>{body.length}/{BODY_MAX}</Counter>
            </Field>

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <Footer>
              <CancelBtn onClick={onClose} disabled={sending}>Cancel</CancelBtn>
              <SendBtn onClick={handleSend} disabled={!canSend}>
                {sending ? "Sending…" : "Send Mail"}
              </SendBtn>
            </Footer>
          </>
        )}
      </Box>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Box = styled.div`
  position: relative;
  width: min(560px, 92vw);
  background: #49494d;
  border-radius: 14px;
  padding: 28px;
  box-sizing: border-box;
  color: #fff;
  filter: drop-shadow(0 8px 40px rgba(0, 0, 0, 0.6));
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  span { color: #c4a1ff; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SubjectInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid #ffffff22;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  padding: 9px 12px;
  outline: none;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #555; }
  &:disabled { opacity: 0.6; }
`;

const BodyTextarea = styled.textarea`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid #ffffff22;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 9px 12px;
  resize: vertical;
  min-height: 120px;
  outline: none;
  &:focus { border-color: #7b2ff7; }
  &::placeholder { color: #555; }
  &:disabled { opacity: 0.6; }
`;

const Counter = styled.div`
  font-size: 10px;
  color: #555;
  text-align: right;
`;

const ErrorMsg = styled.div`
  font-size: 12px;
  color: #ff7777;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid #ffffff22;
  color: #ccc;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: #fff; }
`;

const SendBtn = styled.button`
  background: rgba(124, 58, 237, 0.6);
  border: 1px solid rgba(124, 58, 237, 0.8);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(124, 58, 237, 0.85); }
`;

const SentConfirm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
`;

const SentIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(80, 200, 120, 0.2);
  border: 2px solid rgba(80, 200, 120, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #50c878;
`;

const SentText = styled.div`
  font-size: 15px;
  color: #ccc;
`;

const DoneBtn = styled.button`
  background: rgba(124, 58, 237, 0.6);
  border: 1px solid rgba(124, 58, 237, 0.8);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: rgba(124, 58, 237, 0.85); }
`;
