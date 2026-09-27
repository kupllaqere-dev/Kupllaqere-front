import { useEffect, useMemo, useState } from "react";
import styled, { keyframes, css } from "styled-components";

const FONT = "Quicksand, Nunito, Poppins, sans-serif";
const GOLD = "#ffd65a";
const GOLD_DIM = "#c9a23f";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 0 1px rgba(255, 214, 90, 0.35), 0 14px 30px rgba(0, 0, 0, 0.4); }
  50%      { box-shadow: 0 0 0 1px rgba(255, 214, 90, 0.6), 0 14px 34px rgba(255, 200, 60, 0.12); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(8, 7, 11, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${FONT};
`;

// Same footprint as PlayerProfile's modal (ProfileOuter), so the two panels
// read as siblings rather than one feeling like an afterthought.
const Modal = styled.div`
  position: relative;
  width: min(96%, 1600px);
  height: 92%;
  display: flex;
  border-radius: 40px;
  background:
    radial-gradient(1200px 480px at -10% -20%, rgba(255, 214, 90, 0.07), transparent 55%),
    linear-gradient(165deg, #27242c 0%, #1a1820 60%, #16141a 100%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: ${fadeIn} 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
`;

const Rail = styled.div`
  width: 108px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 10px;
  background: rgba(0, 0, 0, 0.22);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
`;

const RailTab = styled.button`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 4px 12px;
  border: none;
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(to top, rgba(255, 214, 90, 0.22) 0%, rgba(255, 214, 90, 0.05) 55%, transparent 100%)"
      : "transparent"};
  border-bottom: 2px solid ${({ $active }) => ($active ? GOLD : "transparent")};
  color: ${({ $active }) => ($active ? GOLD : "rgba(210, 207, 220, 0.55)")};
  cursor: pointer;
  font-family: ${FONT};
  transition: color 0.18s ease, background 0.18s ease;

  &:hover {
    color: ${({ $active }) => ($active ? GOLD : "#fff")};
  }
`;

const RailIcon = styled.span`
  font-size: 24px;
  line-height: 1;
  filter: ${({ $active }) => ($active ? "drop-shadow(0 0 8px rgba(255, 214, 90, 0.55))" : "none")};
`;

const RailLabel = styled.span`
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  /* Right padding clears the corner-seated CloseBtn (42px, inset 22px) plus a
     gap, so the countdown's own right edge never sits under it. */
  padding: 32px 96px 22px 40px;
`;

const HeaderIcon = styled.span`
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  border-radius: 16px;
  background: linear-gradient(160deg, rgba(255, 214, 90, 0.22), rgba(255, 214, 90, 0.04));
  border: 1px solid rgba(255, 214, 90, 0.3);
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Eyebrow = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: ${GOLD_DIM};
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${FONT};
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #fff;
`;

const Countdown = styled.div`
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: rgba(225, 222, 232, 0.6);
  white-space: nowrap;
`;

const Divider = styled.div`
  height: 1px;
  margin: 0 40px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
`;

const Board = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 26px 40px 30px;

  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const QuestCard = styled.div`
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 32px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  opacity: ${({ $claimed }) => ($claimed ? 0.55 : 1)};

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.16);
  }

  ${({ $claimable }) =>
    $claimable &&
    css`
      border-color: rgba(255, 214, 90, 0.45);
      animation: ${glow} 2.6s ease-in-out infinite;
    `}
`;

const CardIcon = styled.span`
  width: 62px;
  height: 62px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border-radius: 16px;
  background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardHeading = styled.div`
  flex: 0 0 240px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardCategory = styled.span`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${GOLD_DIM};
`;

const CardTitle = styled.span`
  font-family: ${FONT};
  font-size: 19px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardObjective = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: rgba(215, 212, 224, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardActions = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const PinBtn = styled.button`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${({ $pinned }) => ($pinned ? "rgba(255, 214, 90, 0.16)" : "rgba(255, 255, 255, 0.04)")};
  color: ${({ $pinned }) => ($pinned ? GOLD : "rgba(210, 207, 220, 0.5)")};
  font-size: 17px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { background: rgba(255, 214, 90, 0.14); color: ${GOLD}; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const ProgressPill = styled.span`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 800;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ $done }) => ($done ? GOLD : "rgba(230, 228, 236, 0.85)")};
  white-space: nowrap;
`;

const XpTag = styled.span`
  font-size: 12.5px;
  font-weight: 700;
  color: rgba(200, 197, 210, 0.55);
  white-space: nowrap;
`;

const ClaimBtn = styled.button`
  padding: 11px 24px;
  border-radius: 11px;
  cursor: pointer;
  font-family: ${FONT};
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #2a1c00;
  background: linear-gradient(180deg, #ffe27a, #ffb020);
  border: 1px solid rgba(255, 230, 150, 0.6);
  box-shadow: 0 4px 12px rgba(255, 176, 32, 0.25);
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover { filter: brightness(1.06); transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: default; filter: none; transform: none; }
`;

const ClaimedTag = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: rgba(150, 210, 165, 0.85);
  white-space: nowrap;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(200, 197, 210, 0.5);
  font-size: 13.5px;
  font-weight: 600;
  text-align: center;
  padding: 20px;
`;

const EmptyIcon = styled.span`
  font-size: 44px;
  opacity: 0.45;
`;

const PinHint = styled.div`
  padding: 0 40px 22px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(200, 197, 210, 0.4);
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 20;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    transform: scale(1.05);
  }
`;

const TABS = [
  { key: "story", label: "Story", icon: "📖" },
  { key: "daily", label: "Daily", icon: "☀️" },
  { key: "events", label: "Events", icon: "🎉" },
];

const TZ = "Europe/Paris";

// Mirrors fv-game-back/lib/quests.js's questDayKey: quests reset at 12:00 on
// the same Europe/Paris clock the HUD shows, not at midnight.
function msUntilReset(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  const secondsPastMidnight =
    (Number(parts.hour) % 24) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const secondsPastNoon = ((secondsPastMidnight - 12 * 3600) % 86400 + 86400) % 86400;
  return (86400 - secondsPastNoon) * 1000;
}

function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `⏱ Resets in ${hours}h ${minutes}m`;
}

export default function QuestsModal({ onClose, quests, onClaim, onTogglePin }) {
  const [activeTab, setActiveTab] = useState("daily");
  const [busyKey, setBusyKey] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const list = quests?.quests ?? [];
  const countdown = useMemo(() => formatCountdown(msUntilReset(new Date(now))), [now]);
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label;

  async function handleClaim(questKey) {
    if (busyKey) return;
    setBusyKey(questKey);
    try {
      await onClaim?.(questKey);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleTogglePin(questKey, pinned) {
    if (busyKey) return;
    setBusyKey(questKey);
    try {
      await onTogglePin?.(questKey, pinned);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Rail>
          {TABS.map((tab) => (
            <RailTab key={tab.key} $active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
              <RailIcon $active={activeTab === tab.key}>{tab.icon}</RailIcon>
              <RailLabel>{tab.label}</RailLabel>
            </RailTab>
          ))}
        </Rail>

        <Content>
          <Header>
            <HeaderIcon>{TABS.find((t) => t.key === activeTab)?.icon}</HeaderIcon>
            <HeaderText>
              <Eyebrow>Quests</Eyebrow>
              <Title>{activeLabel}</Title>
            </HeaderText>
            {activeTab === "daily" && <Countdown>{countdown}</Countdown>}
          </Header>
          <Divider />

          {activeTab !== "daily" ? (
            <EmptyState>
              <EmptyIcon>🔒</EmptyIcon>
              <span>{activeLabel} quests are coming soon.</span>
            </EmptyState>
          ) : list.length === 0 ? (
            <EmptyState>
              <EmptyIcon>☀️</EmptyIcon>
              <span>Loading today's quests…</span>
            </EmptyState>
          ) : (
            <>
              <Board>
                {list.map((quest) => {
                  const claimable = quest.completed && !quest.claimed;
                  return (
                    <QuestCard key={quest.key} $claimed={quest.claimed} $claimable={claimable}>
                      <CardIcon>{quest.icon}</CardIcon>
                      <CardHeading>
                        <CardCategory>Daily</CardCategory>
                        <CardTitle>{quest.title}</CardTitle>
                      </CardHeading>

                      <CardObjective>{quest.label}</CardObjective>

                      <CardActions>
                        <ProgressPill $done={claimable || quest.claimed}>
                          {quest.progress} / {quest.target}
                        </ProgressPill>
                        <XpTag>+{quest.xp} XP</XpTag>
                        {quest.claimed ? (
                          <ClaimedTag>✓ Claimed</ClaimedTag>
                        ) : claimable ? (
                          <ClaimBtn disabled={busyKey === quest.key} onClick={() => handleClaim(quest.key)}>
                            {busyKey === quest.key ? "…" : "Claim"}
                          </ClaimBtn>
                        ) : null}
                        <PinBtn
                          $pinned={quest.pinned}
                          disabled={busyKey === quest.key}
                          title={quest.pinned ? "Unpin from HUD" : "Pin to HUD"}
                          onClick={() => handleTogglePin(quest.key, !quest.pinned)}
                        >
                          {quest.pinned ? "★" : "☆"}
                        </PinBtn>
                      </CardActions>
                    </QuestCard>
                  );
                })}
              </Board>
              <PinHint>Pinned quests track live on your HUD.</PinHint>
            </>
          )}
        </Content>

        <CloseBtn onClick={onClose}>&times;</CloseBtn>
      </Modal>
    </Overlay>
  );
}
