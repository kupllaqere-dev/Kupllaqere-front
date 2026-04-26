import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { fetchInbox, fetchSent, markMailRead } from "../api/mail";
import PlayerThumbnail from "./PlayerThumbnail";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

export default function MailModal({ onClose, onUnreadChange }) {
  const [tab, setTab] = useState("inbox");
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxData, sentData] = await Promise.all([fetchInbox(), fetchSent()]);
      setInbox(inboxData);
      setSent(sentData);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleOpenMail(mail) {
    if (openId === mail.id) {
      setOpenId(null);
      return;
    }
    setOpenId(mail.id);
    if (!mail.read) {
      try {
        await markMailRead(mail.id);
        setInbox((prev) =>
          prev.map((m) => (m.id === mail.id ? { ...m, read: true } : m))
        );
        onUnreadChange?.();
      } catch {
        // silently ignore
      }
    }
  }

  const unreadCount = inbox.filter((m) => !m.read).length;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Inner>
          <CloseBtn onClick={onClose}>&times;</CloseBtn>

          <Header>
            <ModalTitle>Mailbox</ModalTitle>
            <Tabs>
              <Tab $active={tab === "inbox"} onClick={() => setTab("inbox")}>
                Inbox
                {unreadCount > 0 && <TabBadge>{unreadCount}</TabBadge>}
              </Tab>
              <Tab $active={tab === "sent"} onClick={() => setTab("sent")}>
                Sent
              </Tab>
            </Tabs>
          </Header>

          {loading ? (
            <EmptyState>Loading…</EmptyState>
          ) : tab === "inbox" ? (
            inbox.length === 0 ? (
              <EmptyState>Your inbox is empty.</EmptyState>
            ) : (
              <MailList>
                {inbox.map((mail) => (
                  <MailItem
                    key={mail.id}
                    $unread={!mail.read}
                    $open={openId === mail.id}
                    onClick={() => handleOpenMail(mail)}
                  >
                    <MailItemTop>
                      <ThumbWrap>
                        <PlayerThumbnail playerName={mail.from.name} size={42} />
                        {!mail.read && <UnreadDot />}
                      </ThumbWrap>
                      <MailMeta>
                        <MailSenderLine>
                          <SenderName>{mail.from.name}</SenderName>
                          <span> has sent you an email</span>
                        </MailSenderLine>
                        <MailSubjectLine $unread={!mail.read}>
                          {mail.subject}
                        </MailSubjectLine>
                      </MailMeta>
                      <MailTime>{formatTime(mail.createdAt)}</MailTime>
                    </MailItemTop>
                    {openId === mail.id && (
                      <MailBody>{mail.body}</MailBody>
                    )}
                  </MailItem>
                ))}
              </MailList>
            )
          ) : (
            sent.length === 0 ? (
              <EmptyState>No sent mail.</EmptyState>
            ) : (
              <MailList>
                {sent.map((mail) => (
                  <MailItem
                    key={mail.id}
                    $unread={false}
                    $open={openId === mail.id}
                    onClick={() => setOpenId(openId === mail.id ? null : mail.id)}
                  >
                    <MailItemTop>
                      <ThumbWrap>
                        <PlayerThumbnail playerName={mail.to.name} size={42} />
                      </ThumbWrap>
                      <MailMeta>
                        <MailSenderLine>
                          <span>To: </span>
                          <SenderName>{mail.to.name}</SenderName>
                        </MailSenderLine>
                        <MailSubjectLine $unread={false}>
                          {mail.subject}
                        </MailSubjectLine>
                      </MailMeta>
                      <MailTime>{formatTime(mail.createdAt)}</MailTime>
                    </MailItemTop>
                    {openId === mail.id && (
                      <MailBody>{mail.body}</MailBody>
                    )}
                  </MailItem>
                ))}
              </MailList>
            )
          )}
        </Inner>
      </Modal>
    </Overlay>
  );
}

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
  width: min(85vw, 96vh * 1.5);
  max-width: 96vw;
  max-height: 96vh;
  aspect-ratio: 1536 / 1024;
  color: #fff;
  filter: drop-shadow(0 8px 40px rgba(0, 0, 0, 0.6));
`;

const Inner = styled.div`
  border-radius: 14px;
  position: absolute;
  top: 5.5%;
  right: 2.5%;
  bottom: 5%;
  left: 2.5%;
  background: #49494d;
  padding: 28px;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1;
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
  z-index: 2;
  &:hover { color: #fff; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 4px;
`;

const Tab = styled.button`
  position: relative;
  background: ${(p) => (p.$active ? "rgba(124, 58, 237, 0.5)" : "transparent")};
  border: ${(p) => (p.$active ? "1px solid rgba(124, 58, 237, 0.6)" : "1px solid transparent")};
  color: ${(p) => (p.$active ? "#fff" : "#888")};
  font-size: 13px;
  font-weight: 600;
  padding: 6px 18px;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &:hover { color: #fff; }
`;

const TabBadge = styled.span`
  background: #e03131;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const MailList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #ffffff22; border-radius: 3px; }
`;

const MailItem = styled.div`
  background: ${(p) =>
    p.$open
      ? "rgba(124, 58, 237, 0.1)"
      : p.$unread
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(255, 255, 255, 0.02)"};
  border: 1px solid ${(p) =>
    p.$open ? "rgba(124, 58, 237, 0.4)" : "rgba(255, 255, 255, 0.06)"};
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(124, 58, 237, 0.08); border-color: rgba(124, 58, 237, 0.3); }
`;

const MailItemTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ThumbWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: visible;
`;

const UnreadDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #e03131;
  border-radius: 50%;
  border: 2px solid #49494d;
`;

const MailMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const MailSenderLine = styled.div`
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SenderName = styled.span`
  font-weight: 700;
  color: #c4a1ff;
`;

const MailSubjectLine = styled.div`
  font-size: 13px;
  font-weight: ${(p) => (p.$unread ? 700 : 400)};
  color: ${(p) => (p.$unread ? "#fff" : "#bbb")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MailTime = styled.div`
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
  white-space: nowrap;
`;

const MailBody = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ffffff10;
  font-size: 13px;
  color: #ccc;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
`;
