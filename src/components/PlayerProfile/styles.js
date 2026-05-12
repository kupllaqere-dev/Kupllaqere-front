import styled, { keyframes, css } from "styled-components";
import { FRAME_W, FRAME_H, WL_RARITY } from "./constants";

export const C = {
  bg:       "#f7f3ff",
  surface:  "#ffffff",
  card:     "#f0eaff",
  cardHov:  "#e8deff",
  border:   "rgba(130,80,220,0.14)",
  border2:  "rgba(130,80,220,0.26)",
  accent:   "#7c3aed",
  accentLt: "#9d6ff5",
  txt:      "#2e1065",
  txt2:     "#5b3fa0",
  txt3:     "#a98fd4",
  coin:     "#b45309",
};

export const thinScrollbar = css`
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(80,40,160,0.2); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(80,40,160,0.4); }
  scrollbar-width: thin;
  scrollbar-color: rgba(80,40,160,0.2) transparent;
`;

export const fadeIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`from{background-position:-400px 0}to{background-position:400px 0}`;
export const glassShine = keyframes`
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
`;

export const SkeletonLine = styled.div`
  height: ${({ $h }) => $h || "12px"};
  width: ${({ $w }) => $w || "100%"};
  border-radius: 6px;
  background: linear-gradient(90deg, #ede9f5 25%, #ddd6f0 50%, #ede9f5 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;
export const SkeletonCircle = styled.div`
  width: ${({ $size }) => $size || "38px"};
  height: ${({ $size }) => $size || "38px"};
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, #ede9f5 25%, #ddd6f0 50%, #ede9f5 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40,15,90,0.52);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ProfileWrapper = styled.div`
  --pp-bg:          #f7f3ff;
  --pp-surface:     #ffffff;
  --pp-card:        #f0eaff;
  --pp-cardHov:     #e8deff;
  --pp-border:      rgba(130,80,220,0.14);
  --pp-border2:     rgba(130,80,220,0.26);
  --pp-accent:      #7c3aed;
  --pp-accentLt:    #9d6ff5;
  --pp-accent-rgb:  124,58,237;
  --pp-txt:         #2e1065;
  --pp-txt2:        #5b3fa0;
  --pp-txt3:        #a98fd4;
  --pp-coin:        #b45309;
  --pp-gradPanel:   linear-gradient(160deg, #fdfbff 0%, #f8f3ff 100%);
  --pp-gradSidebar: linear-gradient(160deg, #ede8ff 0%, #f4eeff 100%);
  --pp-gradCard:    linear-gradient(to top, #ddd0f8, #f8f3ff);
  --pp-gradInner:   linear-gradient(to top, #ede5ff, #ffffff);
  position: relative;
  width: min(96vw, 1400px);
  max-width: 98vw;
  height: 92vh;
  max-height: 92vh;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 32px 80px rgba(80,30,180,0.18), 0 4px 16px rgba(80,30,180,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
  animation: ${fadeIn} 0.22s ease;
`;

/* ── Sidebar ── */

export const Sidebar = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 6px;
  width: 80px;
  flex-shrink: 0;
  background: var(--pp-gradSidebar);
  border-right: 1px solid ${"var(--pp-border)"};
  border-radius: 22px 0 0 22px;
  z-index: 2;
`;

export const SidebarLogoWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 18px;
`;

export const SidebarLogoMark = styled.span`
  font-size: 16px;
  color: ${"var(--pp-accent)"};
`;

export const SidebarLogoText = styled.span`
  font-size: 8.5px;
  font-weight: 800;
  letter-spacing: 2.5px;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
`;

export const SidebarNav = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 0 8px;
  flex: 1;
`;

export const SidebarItem = styled.li`
  aspect-ratio: 1;
`;

export const SidebarBtn = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  cursor: pointer;
  gap: 4px;
  position: relative;
  overflow: hidden;
  transition: background 0.2s, box-shadow 0.2s;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.14)" : "transparent"};
  box-shadow: ${p => p.$active ? `inset 0 0 0 1px rgba(var(--pp-accent-rgb),0.38), 0 2px 8px rgba(var(--pp-accent-rgb),0.1)` : "none"};
  ${p => p.$active && css`
    &::after {
      content: '';
      position: absolute;
      right: 0; top: 22%; bottom: 22%;
      width: 2.5px;
      background: ${"var(--pp-accent)"};
      border-radius: 0 2px 2px 0;
    }
  `}
  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover:not(:disabled) {
    background: ${p => p.$danger ? "rgba(220,38,38,0.1)" : p.$active ? "rgba(var(--pp-accent-rgb),0.2)" : "rgba(var(--pp-accent-rgb),0.08)"};
  }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

export const SidebarIcon = styled.span`
  font-size: 15px;
  color: ${p => p.$active ? "var(--pp-accent)" : p.$danger ? "#dc2626" : "var(--pp-txt3)"};
  line-height: 1;
  transition: color 0.2s;
  ${SidebarBtn}:hover:not(:disabled) & { color: ${"var(--pp-txt)"}; }
`;

export const SidebarLabel = styled.span`
  font-size: 8px;
  font-weight: 700;
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt3)"};
  letter-spacing: 0.4px;
  text-transform: uppercase;
  transition: color 0.2s;
  ${SidebarBtn}:hover:not(:disabled) & { color: ${"var(--pp-txt2)"}; }
`;

export const SidebarFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding-top: 12px;
`;

export const SidebarAvatarThumb = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b21b6, #1e40af);
  border: 2px solid rgba(var(--pp-accent-rgb),0.5);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: scale(1.1); box-shadow: 0 0 16px rgba(var(--pp-accent-rgb),0.55); }
`;

export const SidebarOnlinePip = styled.div`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
  animation: pipBlink 2.4s ease-in-out infinite;
  @keyframes pipBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

export const SidebarNotifDot = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 14px;
  height: 14px;
  background: #e03131;
  border: 1.5px solid var(--pp-card);
  border-radius: 7px;
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  pointer-events: none;
  line-height: 1;
`;

/* ── Avatar Stage ── */

export const AvatarStageCol = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 14px;
  width: 350px;
  flex-shrink: 0;
  background: var(--pp-gradPanel);
  border-right: 1px solid ${"var(--pp-border)"};
  gap: 10px;
  overflow: hidden;
  position: relative;
`;

export const OutfitLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  letter-spacing: 0.6px;
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid ${"var(--pp-border2)"};
  padding: 5px 13px;
  border-radius: 20px;
  flex-shrink: 0;
`;

export const OutfitGem = styled.span`
  font-size: 7px;
  opacity: 0.65;
`;

export const StageContainer = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background: radial-gradient(ellipse 80% 45% at 50% 38%, rgba(var(--pp-accent-rgb),0.07) 0%, transparent 68%);
`;

export const StageHalo = styled.div`
  position: absolute;
  width: 190px; height: 190px;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--pp-accent-rgb),0.22) 0%, transparent 68%);
  animation: haloPulse 3.2s ease-in-out infinite;
  pointer-events: none;
  @keyframes haloPulse {
    0%,100% { opacity: 0.55; transform: translateX(-50%) scale(1); }
    50%      { opacity: 1;    transform: translateX(-50%) scale(1.09); }
  }
`;

export const StageHaloOuter = styled.div`
  position: absolute;
  width: 280px; height: 280px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 60%);
  animation: haloPulse 3.2s ease-in-out infinite;
  animation-delay: -1.6s;
  pointer-events: none;
`;

export const AvatarViewport = styled.div`
  flex: 1;
  min-height: 0;
  aspect-ratio: ${FRAME_W} / ${FRAME_H};
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 0 22px rgba(var(--pp-accent-rgb),0.1), inset 0 0 18px rgba(var(--pp-accent-rgb),0.04);
  /* background: radial-gradient(ellipse at 50% 95%, rgba(var(--pp-accent-rgb),0.07) 0%, transparent 55%); */
  position: relative;
  z-index: 2;
`;

export const AvatarCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

export const AvatarPlatform = styled.div`
  width: 64%;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(var(--pp-accent-rgb),0.95) 0%, rgba(59,130,246,0.55) 38%, transparent 72%);
  filter: blur(6px);
  margin-top: 2px;
  flex-shrink: 0;
  opacity: 0.75;
  animation: platformPulse 2.8s ease-in-out infinite alternate;
  @keyframes platformPulse {
    from { opacity: 0.55; transform: scaleX(0.94); }
    to   { opacity: 0.9;  transform: scaleX(1.06); }
  }
`;

export const StatusCard = styled.div`
  width: calc(100% + 28px);
  margin: 0 -14px;
  height: 58px;
  box-sizing: border-box;
  flex-shrink: 0;
  background: rgba(var(--pp-accent-rgb),0.04);
  border-left: none;
  border-right: none;
  border-top: 1px solid ${"var(--pp-border)"};
  border-bottom: 1px solid ${"var(--pp-border)"};
  border-radius: 0;
  padding: 9px 27px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
`;

export const StatusCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const OnlineDot = styled.span`
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 7px #22c55e;
  flex-shrink: 0;
  animation: pipBlink 2.4s ease-in-out infinite;
`;

export const OnlineLabel = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: #16a34a;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

export const StatusSep = styled.span`color: ${"var(--pp-txt3)"}; font-size: 11px;`;

export const StatusLoc = styled.span`
  font-size: 9.5px;
  color: ${"var(--pp-txt3)"};
  font-weight: 500;
`;

export const StatusText = styled.div`
  font-size: 11px;
  color: ${"var(--pp-txt2)"};
  font-style: italic;
  line-height: 1.4;
`;

const PRESENCE_DOT_COLORS = {
  online:    { bg: "#22c55e", shadow: "#22c55e" },
  away:      { bg: "#f59e0b", shadow: "#f59e0b" },
  offline:   { bg: "#6b7280", shadow: "transparent" },
  invisible: { bg: "#6b7280", shadow: "transparent" },
};

export const PresenceDot = styled.span`
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).bg};
  box-shadow: 0 0 7px ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).shadow};
  animation: ${({ $status }) => ($status === "offline" || $status === "invisible") ? "none" : "pipBlink 2.4s ease-in-out infinite"};
`;

const PRESENCE_LABEL_COLORS = { online: "#16a34a", away: "#d97706", offline: "#9ca3af", invisible: "#9ca3af" };

export const PresenceLabel = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${({ $status }) => PRESENCE_LABEL_COLORS[$status] || PRESENCE_LABEL_COLORS.offline};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

export const StatusPickerWrap = styled.div`
  position: relative;
`;

export const StatusClickTarget = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  border-radius: 5px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background 0.15s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.08); }
`;

export const StatusDropdown = styled.div`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border2)"};
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  z-index: 9999;
  min-width: 120px;
  box-shadow: 0 -4px 16px rgba(80,40,160,0.14);
`;

export const StatusOption = styled.button`
  background: ${({ $active }) => $active ? "rgba(var(--pp-accent-rgb),0.10)" : "none"};
  border: none;
  border-radius: 6px;
  color: ${"var(--pp-txt)"};
  font-size: 11px;
  font-family: inherit;
  font-weight: ${({ $active }) => $active ? "700" : "500"};
  cursor: pointer;
  padding: 6px 8px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: rgba(var(--pp-accent-rgb),0.08); }
`;

export const OptionDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) => (PRESENCE_DOT_COLORS[$status] || PRESENCE_DOT_COLORS.offline).bg};
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 12px 0;
`;

export const ArrowBtn = styled.button`
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid ${"var(--pp-border)"};
  background: rgba(var(--pp-accent-rgb),0.06);
  color: ${"var(--pp-txt2)"};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: all 0.18s;
  font-family: inherit;
  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover:not(:disabled) {
    background: rgba(var(--pp-accent-rgb),0.14);
    border-color: ${"var(--pp-border2)"};
    color: ${"var(--pp-txt)"};
    box-shadow: 0 2px 8px rgba(var(--pp-accent-rgb),0.12);
  }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:active:not(:disabled) { transform: scale(0.9); }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
`;

export const PoseLabel = styled.span`
  font-size: 8.5px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  min-width: 48px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

/* ── Profile Content ── */

export const ProfileContent = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 22px 22px 20px;
  overflow-y: auto;
  background: var(--pp-gradPanel);
  position: relative;
  ${thinScrollbar}
`;

export const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  background: rgba(var(--pp-accent-rgb),0.06);
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover {
    background: rgba(220,38,38,0.08);
    border-color: rgba(220,38,38,0.28);
    color: #dc2626;
  }
`;

export const ProfileHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${"var(--pp-border)"};
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

export const ProfileEmblem = styled.div`
  width: 50px; height: 50px;
  border-radius: 15px;
  background: linear-gradient(135deg, rgba(var(--pp-accent-rgb),0.14), rgba(59,130,246,0.08));
  border: 1px solid ${"var(--pp-border2)"};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(var(--pp-accent-rgb),0.12);
  flex-shrink: 0;
`;

export const EmblemDiamond = styled.span`
  font-size: 24px;
  color: ${"var(--pp-accent)"};
`;

export const HeaderTitles = styled.div`display: flex; flex-direction: column; gap: 5px;`;

export const PlayerName = styled.h2`
  margin: 0;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.3px;
  background: linear-gradient(120deg, #7c3aed, #c026d3, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const PlayerNameMark = styled.span`
  -webkit-text-fill-color: ${"var(--pp-accent)"};
  font-size: 20px;
`;

export const ProfileMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const LevelBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid ${"var(--pp-border2)"};
`;

export const MetaSep = styled.span`color: ${"var(--pp-txt3)"}; font-size: 11px;`;

export const RankBadgeDiamond = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #0369a1;
  background: rgba(14,165,233,0.08);
  border: 1px solid rgba(14,165,233,0.28);
  padding: 2px 9px;
  border-radius: 6px;
`;

export const ProfileStats = styled.div`
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  padding-top: 4px;
`;

export const ProfileStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

export const ProfileStatVal = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
  line-height: 1;
`;

export const ProfileStatLbl = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const SectionTitle = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

export const SectionCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  padding: 1px 6px;
  border-radius: 10px;
`;

export const SectionEditBtn = styled.button`
  all: unset;
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  cursor: pointer;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: color 0.2s;
  &:hover { color: ${"var(--pp-accentLt)"}; }
`;

export const BadgesScrollWrap = styled.div`
  overflow-x: auto;
  padding-bottom: 5px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--pp-accent-rgb),0.28); border-radius: 3px; }
`;

export const BadgesRow = styled.div`
  display: flex;
  gap: 9px;
  width: max-content;
`;

export const BadgeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 12px 9px;
  border-radius: 12px;
  border: 1px solid ${p => {
    if (p.$selected) return "rgba(var(--pp-accent-rgb),0.5)";
    if (p.$rarity === "legendary") return "rgba(234,179,8,0.38)";
    if (p.$rarity === "rare") return "rgba(59,130,246,0.28)";
    return "var(--pp-border)";
  }};
  background: ${p => p.$selected ? "rgba(var(--pp-accent-rgb),0.08)" : "var(--pp-surface)"};
  cursor: ${p => p.$clickable ? (p.$saving ? "wait" : "pointer") : "default"};
  min-width: 72px;
  position: relative;
  overflow: hidden;
  opacity: ${p => p.$saving ? 0.6 : 1};
  box-shadow: ${p => p.$selected ? "0 4px 14px rgba(var(--pp-accent-rgb),0.18)" : "0 1px 4px rgba(100,50,200,0.06)"};
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  &:hover {
    transform: ${p => p.$clickable && !p.$saving ? "translateY(-3px) scale(1.04)" : "none"};
    box-shadow: ${p => {
      if (!p.$clickable || p.$saving) return "none";
      return "0 6px 20px rgba(var(--pp-accent-rgb),0.18)";
    }};
  }
`;

export const BadgeCardIconWrap = styled.div`
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const BadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

export const BadgeCardName = styled.div`
  font-size: 8.5px;
  font-weight: 700;
  color: ${"var(--pp-txt2)"};
  text-align: center;
`;

export const BadgeCardRarity = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${p => {
    if (p.$rarity === "legendary") return "#b45309";
    if (p.$rarity === "rare") return "#0369a1";
    return "var(--pp-txt3)";
  }};
`;

export const BadgeExpandBtn = styled.button`
  all: unset;
  align-self: flex-end;
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  padding: 0;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const SoulmateCard = styled.div`
  background: linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(var(--pp-accent-rgb),0.06) 100%);
  border: 1px solid rgba(236,72,153,0.22);
  border-radius: 14px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 13px;
  position: relative;
  overflow: hidden;
  flex-wrap: wrap;
  box-shadow: 0 2px 12px rgba(236,72,153,0.08);
`;

export const SoulmateHeartBg = styled.span`
  position: absolute;
  right: -8px;
  top: -14px;
  font-size: 80px;
  opacity: 0.04;
  color: #ec4899;
  pointer-events: none;
  line-height: 1;
  animation: smHeartPulse 1.8s ease-in-out infinite;
  @keyframes smHeartPulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.1); }
  }
`;

export const SoulmateAvatarWrap = styled.div`position: relative; flex-shrink: 0;`;

export const SoulmateSpinRing = styled.div`
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #ec4899;
  border-right-color: #a855f7;
  animation: spinRing 3.2s linear infinite;
  @keyframes spinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export const SoulmateInfoBlock = styled.div`flex: 1; min-width: 0;`;

export const SoulmateName = styled.div`font-size: 15px; font-weight: 800; color: ${"var(--pp-txt)"};`;

export const SoulmateMark = styled.span`color: #ec4899;`;

export const SoulmateDuration = styled.div`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  margin: 3px 0 6px;
`;

export const SoulmateMoodTag = styled.div`
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid ${"var(--pp-border)"};
  padding: 2px 8px;
  border-radius: 10px;
`;

export const SoulmateCardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

export const SoulmateEmptyBox = styled.div`
  background: rgba(var(--pp-accent-rgb),0.04);
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  padding: 12px 14px;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ShowcaseScrollWrap = styled.div`
  overflow-x: auto;
  padding-bottom: 5px;
  &::-webkit-scrollbar { height: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--pp-accent-rgb),0.28); border-radius: 3px; }
`;

export const ShowcaseRow = styled.div`
  display: flex;
  gap: 10px;
  width: max-content;
`;

export const ShowcaseCard = styled.div`
  width: 98px; height: 116px;
  border-radius: 12px;
  border: 1px dashed ${"var(--pp-border)"};
  background: ${"var(--pp-surface)"};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  position: relative;
  overflow: hidden;
  padding: 8px;
  transition: transform 0.22s, box-shadow 0.22s, border-color 0.2s;
  &:hover {
    ${p => p.$clickable && css`
      border-style: solid;
      border-color: ${"var(--pp-border2)"};
      box-shadow: 0 6px 20px rgba(var(--pp-accent-rgb),0.14);
    `}
  }
`;

export const ShowcaseCardShine = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 10%, rgba(var(--pp-accent-rgb),0.18), transparent 65%);
  opacity: 0;
  transition: opacity 0.22s;
  pointer-events: none;
  ${ShowcaseCard}:hover & { opacity: 1; }
`;

export const ShowcaseItemImg = styled.img`
  width: 80%; height: 80%;
  object-fit: contain;
`;

export const ShowcaseCardLabel = styled.div`
  font-size: 8.5px;
  font-weight: 700;
  color: ${"var(--pp-txt2)"};
  text-align: center;
`;

export const ShowcaseCardType = styled.div`
  font-size: 7.5px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

export const ShowcaseAdd = styled.div`
  font-size: 22px;
  color: ${"var(--pp-border2)"};
  line-height: 1;
  ${ShowcaseCard}:hover & { color: ${"var(--pp-accent)"}; }
`;

export const ShowcaseCardAddLabel = styled.div`
  font-size: 8px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

export const CompanionCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(var(--pp-accent-rgb),0.05), rgba(59,130,246,0.03));
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 14px;
  padding: 14px 16px;
`;

export const CompanionPetWrap = styled.div`position: relative; flex-shrink: 0;`;

export const CompanionPetAura = styled.div`
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--pp-accent-rgb),0.28) 0%, transparent 70%);
  animation: auraBreath 3.2s ease-in-out infinite;
  @keyframes auraBreath { 0%,100% { transform: scale(1); opacity: 0.48; } 50% { transform: scale(1.18); opacity: 0.9; } }
`;

export const CompanionPetEmoji = styled.span`
  font-size: 40px;
  line-height: 1;
  display: block;
  position: relative;
  z-index: 1;
  animation: petBounce 2.6s ease-in-out infinite;
  @keyframes petBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
`;

export const CompanionInfoBlock = styled.div`
  flex: 1; min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const CompanionNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const CompanionNameText = styled.span`font-size: 14px; font-weight: 800; color: ${"var(--pp-txt)"};`;

export const CompanionMoodText = styled.span`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const CompanionLevelText = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  letter-spacing: 0.3px;
`;

export const CompanionXPWrap = styled.div`display: flex; flex-direction: column; gap: 4px;`;

export const XPBarOuter = styled.div`
  height: 5px;
  background: rgba(130,80,220,0.1);
  border-radius: 3px;
  overflow: hidden;
`;

export const XPBarFill = styled.div`
  height: 100%;
  width: var(--xp, 0%);
  background: linear-gradient(90deg, #5b21b6, #a855f7, #ec4899);
  border-radius: 3px;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.36) 50%, transparent 100%);
    background-size: 60px 100%;
    animation: xpShimmer 2s linear infinite;
    @keyframes xpShimmer { from { background-position: -60px 0; } to { background-position: 200px 0; } }
  }
`;

export const XPLabelsRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: ${"var(--pp-txt3)"};
  font-weight: 600;
`;

/* ── Right Panel ── */

export const RightPanel = styled.aside`
  display: flex;
  flex-direction: column;
  width: 290px;
  flex-shrink: 0;
  background: var(--pp-gradPanel);
  border-left: 1px solid ${"var(--pp-border)"};
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const RightSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 20px 17px;
  flex: ${p => p.$flex ? "1" : "0 0 auto"};
  min-height: 0;
  overflow-y: ${p => p.$flex ? "hidden" : "auto"};
  ${thinScrollbar}
`;

export const OrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 17px;
  flex-shrink: 0;
`;

export const OrnamentLine = styled.div`flex: 1; height: 1px; background: ${"var(--pp-border)"};`;

export const OrnamentGem = styled.span`font-size: 9px; color: ${"var(--pp-accentLt)"};`;

export const GBToggleBtn = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  cursor: pointer;
`;

export const GBCountPill = styled.span`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  padding: 1px 7px;
  border-radius: 10px;
`;

export const GBToggleArrow = styled.span`
  font-size: 8px;
  color: ${"var(--pp-txt3)"};
  transition: transform 0.25s ease;
  transform: ${p => p.$open ? "rotate(0deg)" : "rotate(180deg)"};
  display: inline-block;
`;

export const GBPreviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--pp-accent-rgb),0.28); border-radius: 3px; }
`;

export const GBPreviewCard = styled.div`
  display: flex;
  gap: 9px;
  padding: 9px 11px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  transition: border-color 0.18s, background 0.18s;
  &:hover { background: ${"var(--pp-card)"}; border-color: ${"var(--pp-border2)"}; }
`;

export const GBPreviewAvatarWrap = styled.div`
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 50%;
  overflow: hidden;
`;

export const GBPreviewBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;`;

export const GBPreviewMeta = styled.div`display: flex; align-items: center; gap: 6px;`;

export const GBPreviewName = styled.span`font-size: 11px; font-weight: 700; color: ${"var(--pp-accent)"};`;

export const GBPreviewTime = styled.span`font-size: 9.5px; color: ${"var(--pp-txt3)"};`;

export const GBPreviewText = styled.p`
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: ${"var(--pp-txt2)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const GBEmpty = styled.div`
  font-size: ${p => p.$large ? "13px" : "11.5px"};
  color: ${"var(--pp-txt3)"};
  ${p => p.$large && "text-align: center; padding: 20px 0;"}
`;

export const GBInputArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
`;

export const GBInput = styled.textarea`
  width: 100%;
  resize: none;
  height: 44px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 12px;
  line-height: 1.4;
  padding: 10px 36px 10px 12px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb),0.08); }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const GBInputFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const GBCounter = styled.span`
  font-size: 10px;
  color: ${p => p.$warn ? "#b45309" : "var(--pp-txt3)"};
`;

export const PrimaryBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid rgba(var(--pp-accent-rgb),0.3);
  color: ${"var(--pp-accent)"};
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-border2)"}; transform: translateY(-1px); }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:active:not(:disabled) { transform: translateY(0); }
`;

export const SecondaryBtn = styled.button`
  background: transparent;
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt3)"};
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${"var(--pp-card)"}; color: ${"var(--pp-txt2)"}; border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const FormatToolbar = styled.div`display: flex; gap: 4px; margin-bottom: 4px;`;

export const FormatBtn = styled.button`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt2)"};
  font-size: 12px;
  width: 26px; height: 26px;
  border-radius: 5px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  &:hover { background: ${"var(--pp-card)"}; border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-accent)"}; }
`;

export const BioTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 10px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb),0.08); }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const BioFooter = styled.div`display: flex; align-items: center; justify-content: space-between; margin-top: 6px;`;

export const BioCounter = styled.span`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const BioActions = styled.div`display: flex; gap: 6px;`;

export const Description = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${"var(--pp-txt2)"};
  line-height: 1.7;
  white-space: pre-wrap;
`;

export const EmptyText = styled.span`font-size: 12px; color: ${"var(--pp-txt3)"};`;

export const BioErrorMsg = styled.div`margin-top: 6px; font-size: 11px; color: #dc2626;`;

export const BBContent = styled.div`
  font-size: 13px;
  color: ${"var(--pp-txt2)"};
  line-height: 1.7;
  word-break: break-word;
  & img { max-width: 100%; border-radius: 6px; }
  & a { color: ${"var(--pp-accent)"}; text-decoration: underline; }
  & details > summary { list-style: none; }
  & details > summary::-webkit-details-marker { display: none; }
`;

export const BBToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  padding: 7px 9px;
  background: ${"var(--pp-card)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  flex-shrink: 0;
`;

export const BBToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const BBToolBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt2)"};
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.1)" : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  &:hover {
    background: rgba(var(--pp-accent-rgb),0.1);
    border-color: rgba(var(--pp-accent-rgb),0.35);
    color: ${"var(--pp-accent)"};
  }
`;

export const BBToolSep = styled.div`
  width: 1px;
  height: 18px;
  background: ${"var(--pp-border)"};
  margin: 0 3px;
  flex-shrink: 0;
`;

export const BBColorPanel = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  z-index: 40;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(5, 22px);
  gap: 5px;
  box-shadow: 0 6px 20px rgba(100,50,200,0.18);
`;

export const BBColorSwatch = styled.button`
  all: unset;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.18);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  &:hover { transform: scale(1.3); box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
`;

export const BBSizePanel = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  z-index: 40;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  box-shadow: 0 6px 20px rgba(100,50,200,0.18);
  min-width: 100px;
`;

export const BBSizeOption = styled.button`
  all: unset;
  padding: 5px 10px;
  border-radius: 7px;
  cursor: pointer;
  color: ${"var(--pp-txt)"};
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.1s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.08); color: ${"var(--pp-accent)"}; }
`;

export const BBTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  resize: vertical;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-top: none;
  border-radius: 0 0 8px 8px;
  color: ${"var(--pp-txt)"};
  font-family: monospace, inherit;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 12px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; box-shadow: 0 0 0 2px rgba(var(--pp-accent-rgb),0.08); }
  &::placeholder { color: ${"var(--pp-txt3)"}; font-family: inherit; }
`;

export const SmContent = styled.div`display: flex; flex-wrap: wrap; align-items: center; gap: 8px;`;

export const SmEmpty = styled.div`font-size: 12px; color: ${"var(--pp-txt3)"};`;

export const SmSub = styled.div`
  font-size: 9.5px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
`;

export const SmName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${"var(--pp-txt)"};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const SmActions = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-left: auto;`;

export const SmRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid ${"var(--pp-border)"};
  &:last-child { border-bottom: none; }
`;

export const SmPrimaryBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid rgba(var(--pp-accent-rgb),0.3);
  color: ${"var(--pp-accent)"};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const SmSecBtn = styled.button`
  background: transparent;
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt3)"};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: ${"var(--pp-card)"}; color: ${"var(--pp-txt2)"}; border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const SmDangerBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(220,38,38,0.3);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.5); }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const SmError = styled.div`font-size: 11px; color: #dc2626;`;

export const GuestBookOverlay = styled.div`
  position: absolute;
  top: 0; bottom: 0;
  left: 470px; right: 0;
  z-index: 20;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  border: 1px solid ${"var(--pp-border)"};
  box-shadow: -4px 0 24px rgba(100,50,200,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${p => p.$open ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${p => p.$open ? "auto" : "none"};
`;

export const GBOverlayClose = styled.button`
  all: unset;
  position: absolute;
  top: 12px; right: 14px;
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  color: ${"var(--pp-txt2)"};
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.15s;
  &:hover { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.28); color: #dc2626; }
`;

export const GBHeader = styled.div`padding: 22px 24px 0; flex-shrink: 0;`;

export const GBTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(120deg, #7c3aed, #c026d3, #0ea5e9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
`;

export const GBSubtitle = styled.p`
  margin: 5px 0 14px;
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  text-align: center;
  letter-spacing: 0.3px;
`;

export const GBHeaderControls = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 14px;
`;

export const GBSortBtn = styled.button`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt2)"};
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: ${"var(--pp-card)"}; border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-txt)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const GBPinnedBtn = styled.button`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-txt2)"};
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: ${"var(--pp-card)"}; border-color: ${"var(--pp-border2)"}; color: ${"var(--pp-txt)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const GBComposeArea = styled.div`
  margin: 0 16px 4px;
  padding: 12px 14px 8px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 14px;
  flex-shrink: 0;
`;

export const GBComposeRow = styled.div`display: flex; align-items: center; gap: 10px;`;

export const GBAvatarPlaceholder = styled.div`
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 2px solid ${"var(--pp-border2)"};
  flex-shrink: 0;
`;

export const GBComposeInputWrap = styled.div`flex: 1; position: relative;`;

export const GBEmojiBtn = styled.button`
  position: absolute;
  right: 8px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const GBPostBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid rgba(var(--pp-accent-rgb),0.3);
  color: ${"var(--pp-accent)"};
  font-size: 14px;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const GBComposeTools = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding-top: 8px;
`;

export const GBToolBtn = styled.button`
  background: none;
  border: none;
  color: ${"var(--pp-txt3)"};
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  &:hover { background: ${"var(--pp-card)"}; color: ${"var(--pp-txt2)"}; }
`;

export const GBOrnamentDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  flex-shrink: 0;
`;

export const GBDividerLine = styled.div`flex: 1; height: 1px; background: ${"var(--pp-border)"};`;

export const GBDividerGem = styled.span`color: ${"var(--pp-accentLt)"}; font-size: 11px;`;

export const GBCommentCard = styled.div`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  &:hover {
    border-color: ${"var(--pp-border2)"};
    background: ${"var(--pp-card)"};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

export const GBCommentInner = styled.div`display: flex; gap: 12px; align-items: flex-start;`;

export const GBCommentAvatarCol = styled.div`flex-shrink: 0;`;

export const GBCommentBody = styled.div`flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px;`;

export const GBCommentMeta = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

export const GBCommentName = styled.span`font-size: 14px; font-weight: 700; color: ${"var(--pp-accent)"};`;

export const GBCommentTime = styled.span`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const GBCommentText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${"var(--pp-txt2)"};
  line-height: 1.55;
  word-break: break-word;
`;

export const GBReactions = styled.div`display: flex; gap: 14px; margin-top: 2px;`;

export const GBReactionBtn = styled.button`
  all: unset;
  font-size: 12px;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s, transform 0.15s;
  &:hover { color: ${"var(--pp-accent)"}; transform: scale(1.2); }
  &:active { transform: scale(0.88); }
`;

export const GBCommentActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

export const CommentDeleteBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 18px; height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${"var(--pp-txt3)"};
  font-size: 15px;
  cursor: pointer;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
`;

export const GBMenuDot = styled.button`
  all: unset;
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover { color: ${"var(--pp-txt)"}; }
`;

export const GBOverlayScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${thinScrollbar}
`;

export const GBStatsFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
  background: var(--pp-gradSidebar);
`;

export const GBStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 16px;
  &:first-child { padding-left: 0; }
`;

export const GBStatLabel = styled.div`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const GBStatValue = styled.div`font-size: 20px; font-weight: 700; color: ${"var(--pp-txt)"};`;

export const GBStatDivider = styled.div`width: 1px; height: 32px; background: ${"var(--pp-border)"}; flex-shrink: 0;`;

export const GBLeaveGiftBtn = styled.button`
  margin-left: auto;
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid ${"var(--pp-border)"};
  color: ${"var(--pp-accent)"};
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(var(--pp-accent-rgb),0.16); border-color: ${"var(--pp-border2)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const AboutToggleBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt3)"};
  background: ${p => p.$active
    ? "linear-gradient(145deg, rgba(var(--pp-accent-rgb),0.14), rgba(157,111,245,0.08))"
    : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  box-shadow: ${p => p.$active ? "0 0 18px rgba(var(--pp-accent-rgb),0.12), inset 0 1px 0 rgba(255,255,255,0.6)" : "none"};
  cursor: pointer;
  margin-left: auto;
  transition: all 0.18s;
  transform: ${p => p.$active ? "rotate(90deg)" : "rotate(0deg)"};
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover {
    background: rgba(var(--pp-accent-rgb),0.1);
    border-color: rgba(var(--pp-accent-rgb),0.35);
    color: ${"var(--pp-accent)"};
    box-shadow: 0 4px 14px rgba(var(--pp-accent-rgb),0.14);
  }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const AboutOverlay = styled.div`
  position: absolute;
  top: 0; bottom: 0;
  left: 470px; right: 0;
  z-index: 20;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  border: 1px solid ${"var(--pp-border)"};
  box-shadow: -4px 0 24px rgba(100,50,200,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${p => p.$open ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${p => p.$open ? "auto" : "none"};
`;

export const AboutOverlayScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 24px 24px;
  ${thinScrollbar}
`;

export const ProfileOuter = styled.div`
  position: relative;
`;

export const GlobalCloseBtn = styled.button`
  position: absolute;
  top: -14px;
  right: -14px;
  z-index: 30;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  width: 30px; height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(100,50,200,0.1);
  &:hover {
    background: #ffe4e4;
    border-color: rgba(220,38,38,0.35);
    color: #dc2626;
  }
`;

export const HubPanelContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 0 22px 22px 0;
`;

export const PanelHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 18px 14px;
  flex-shrink: 0;
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
  letter-spacing: 0.2px;
`;

export const PanelTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 14px 10px;
  flex-shrink: 0;
  border-bottom: 1px solid ${"var(--pp-border)"};
`;

export const PanelTab = styled.button`
  position: relative;
  overflow: hidden;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.12)" : "transparent"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "transparent"};
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt3)"};
  font-size: 12px;
  font-weight: ${p => p.$active ? "700" : "500"};
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { color: ${"var(--pp-txt)"}; background: ${"var(--pp-card)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const TabUnreadBadge = styled.span`
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const TabCountBadge = styled.span`
  background: rgba(var(--pp-accent-rgb),0.12);
  color: ${"var(--pp-accent)"};
  font-size: 9px;
  font-weight: 700;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const PanelEmpty = styled.div`
  padding: 28px 14px;
  font-size: 12px;
  color: ${"var(--pp-txt3)"};
  text-align: center;
`;

/* ── Mail panel ── */

export const MailListCol = styled.div`
  width: 290px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradSidebar);
  border-right: 1px solid ${"var(--pp-border)"};
  overflow: hidden;
`;

export const NewMailBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  color: ${"var(--pp-accent)"};
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: all 0.18s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-accent)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const MailThreadList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 3px;
  ${thinScrollbar}
`;

export const MailThreadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${p => p.$active ? "rgba(var(--pp-accent-rgb),0.12)" : p.$unread ? "var(--pp-card)" : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(138, 75, 245, 0.03); border-color: ${"var(--pp-border2)"}; }
`;

export const MailThumbWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 38px; height: 38px;
`;

export const MailThreadThumb = styled.div`
  width: 38px; height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid ${"var(--pp-border2)"};
  background: ${"var(--pp-card)"};
  canvas { border-radius: 50%; }
`;

export const MailUnreadDot = styled.div`
  position: absolute;
  top: -2px; right: -2px;
  width: 9px; height: 9px;
  background: #e03131;
  border-radius: 50%;
  border: 2px solid ${"var(--pp-bg)"};
`;

const MAIL_STATUS_COLOR = {
  online:    { bg: "#22c55e", shadow: "0 0 5px #22c55e" },
  away:      { bg: "#f59e0b", shadow: "0 0 5px #f59e0b" },
  offline:   { bg: "#9ca3af", shadow: "none" },
  invisible: { bg: "#9ca3af", shadow: "none" },
};
export const MailStatusDot = styled.div`
  position: absolute;
  bottom: -1px; right: -1px;
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid ${"var(--pp-bg)"};
  background: ${({ $status }) => (MAIL_STATUS_COLOR[$status] || MAIL_STATUS_COLOR.offline).bg};
  box-shadow: ${({ $status }) => (MAIL_STATUS_COLOR[$status] || MAIL_STATUS_COLOR.offline).shadow};
`;

export const MailThreadMeta = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MailThreadMetaTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
`;

export const MailThreadName = styled.div`
  font-size: 12px;
  font-weight: ${p => p.$unread ? "700" : "500"};
  color: ${p => p.$unread ? "var(--pp-accent)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadTime = styled.div`
  font-size: 10px;
  color: ${"var(--pp-txt3)"};
  flex-shrink: 0;
  white-space: nowrap;
`;

export const MailThreadSubject = styled.div`
  font-size: 11px;
  font-weight: ${p => p.$unread ? "600" : "400"};
  color: ${p => p.$unread ? "var(--pp-txt)" : "var(--pp-txt2)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailThreadPreview = styled.div`
  font-size: 10.5px;
  color: ${"var(--pp-txt3)"};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

export const MailUnreadBadge = styled.div`
  flex-shrink: 0;
  background: rgba(224,49,49,0.85);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px; height: 16px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
`;

export const MailDetailCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const MailPlaceholder = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const MailPlaceholderIcon = styled.div`
  font-size: 42px;
  opacity: 0.3;
  color: ${"var(--pp-accentLt)"};
`;

export const MailPlaceholderText = styled.div`
  font-size: 13px;
  color: ${"var(--pp-txt3)"};
`;

export const MailDetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
`;

export const MailBackBtn = styled.button`
  all: unset;
  font-size: 12px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: ${"var(--pp-accent)"}; }
`;

export const MailDetailSubject = styled.div`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

export const MailDetailWith = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${"var(--pp-txt)"};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MailMessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${thinScrollbar}
`;

export const MailLoadingMore = styled.div`
  text-align: center;
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  padding: 4px 0 8px;
`;

export const MailMessageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  margin-top: 12px;
  &:first-child { margin-top: 0; }
`;

export const MailMsgThumb = styled.div`
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: ${"var(--pp-card)"};
`;

export const MailMsgContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const MailMsgHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

export const MailMsgName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.$mine ? "var(--pp-accent)" : "var(--pp-txt2)"};
`;

export const MailBubbleBody = styled.div`
  font-size: 13px;
  color: ${"var(--pp-txt)"};
  line-height: 1.5;
  word-break: break-word;
`;

export const MailBubbleTime = styled.span`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
`;

export const MailMessageCompact = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 1px 0;
  padding-left: 52px;
  position: relative;
  &:hover > span:first-child {
    opacity: 1;
  }
`;

export const MailCompactTime = styled.span`
  position: absolute;
  left: 0;
  width: 42px;
  text-align: center;
  font-size: 9px;
  white-space: nowrap;
  color: ${"var(--pp-txt3)"};
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.1s;
  top: 50%;
  transform: translateY(-50%);
`;

export const MailReplyBox = styled.div`
  padding: 12px 18px 14px;
  border-top: 1px solid ${"var(--pp-border)"};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MailReplyTextarea = styled.textarea`
  width: 100%;
  resize: none;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

export const MailReplyFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const MailReplyCounter = styled.div`font-size: 11px; color: ${"var(--pp-txt3)"};`;

export const MailReplyError = styled.div`font-size: 11px; color: #dc2626;`;

export const MailNewPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 22px 20px;
  gap: 14px;
  overflow-y: auto;
  ${thinScrollbar}
`;

export const MailNewTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  flex-shrink: 0;
`;

export const MailToRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const MailToLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  width: 20px;
`;

export const MailToInput = styled.input`
  flex: 1;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 8px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

export const MailFindBtn = styled.button`
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  color: ${"var(--pp-accent)"};
  font-size: 12px;
  font-weight: 700;
  padding: 0 14px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: inherit;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); }
`;

export const MailLookupHint = styled.div`
  font-size: 12px;
  color: ${({ $ok }) => ($ok ? "#16a34a" : "#dc2626")};
  flex-shrink: 0;
`;

export const MailNewTextarea = styled.textarea`
  flex: 1;
  min-height: 120px;
  resize: none;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 10px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 14px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
  &:disabled { opacity: 0.5; }
`;

/* ── Friends panel ── */

export const FriendsPanelInner = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 22px 20px 0;
  gap: 14px;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const FriendsSearchRow = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const FriendsSearchInput = styled.input`
  width: 100%;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 13px;
  padding: 10px 38px 10px 16px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const FriendsSearchIcon = styled.span`
  position: absolute;
  right: 13px; top: 50%;
  transform: translateY(-50%);
  color: ${"var(--pp-txt3)"};
  font-size: 18px;
  pointer-events: none;
`;

export const FriendsSearchHint = styled.div`
  font-size: 11px;
  color: ${p => p.$error ? "#ef4444" : "var(--pp-txt3)"};
  padding: 2px 2px 0;
  flex-shrink: 0;
`;

export const FriendsListScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-content: start;
  padding-bottom: 16px;
  ${thinScrollbar}
`;

export const FriendsGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 2px 2px;
  grid-column: 1 / -1;
`;

export const FriendCardTile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 0;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.18s;
  opacity: ${p => p.$offline ? 0.6 : 1};
  min-width: 0;
  &:hover {
    background: ${"var(--pp-card)"};
    border-color: ${"var(--pp-border2)"};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

export const FriendCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 0;
  padding: 11px 14px;
  grid-column: 1 / -1;
  cursor: pointer;
  transition: all 0.18s;
  &:hover {
    background: ${"var(--pp-card)"};
    border-color: ${"var(--pp-border2)"};
    box-shadow: 0 2px 12px rgba(100,50,200,0.08);
  }
`;

export const FriendCardAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 60px; height: 60px;
`;

export const FriendOnlineDot = styled.div`
  position: absolute;
  bottom: 2px; right: 2px;
  width: 11px; height: 11px;
  background: ${p => p.$color || "#22c55e"};
  border-radius: 50%;
  border: 2px solid ${"var(--pp-surface)"};
  box-shadow: 0 0 6px #22c55e;
`;

export const FriendCardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const FriendCardName = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: ${"var(--pp-txt)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 5px;
`;

export const FriendCardLocation = styled.div`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const FriendLocationDot = styled.span`
  width: 6px; height: 6px;
  border-radius: 50%;
  background: ${p => p.$online ? "#22c55e" : "var(--pp-border2)"};
  flex-shrink: 0;
`;

export const FriendInviteActions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

/* ── Wishlist Panel ── */

export const WishlistPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const WishlistScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${thinScrollbar}
`;

export const WishlistMsg = styled.div`
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: ${"var(--pp-txt3)"};
`;

export const WishlistItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: var(--pp-gradCard);
  border: 1px solid ${"var(--pp-border)"};
  min-height: 88px;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

export const WishlistNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

export const WishlistRarityBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 2px 7px; border-radius: 4px;
  width: fit-content;
  background: ${p => WL_RARITY[p.$r]?.bg};
  border: 1px solid ${p => WL_RARITY[p.$r]?.border};
  color: ${p => WL_RARITY[p.$r]?.color};
`;

export const WishlistTag = styled.div`
  display: inline-block;
  flex-shrink: 0;
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.4px;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.08);
  border: 1px solid rgba(var(--pp-accent-rgb),0.18);
  border-radius: 4px;
  padding: 2px 7px;
`;

export const WishlistRemoveBtn = styled.button`
  background: none; border: none; cursor: pointer; flex-shrink: 0;
  font-size: 13px; color: ${"var(--pp-txt3)"};
  padding: 4px 8px; border-radius: 6px; margin-right: 4px;
  transition: color .13s, background .13s;
  &:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
`;

/* ── Look Panel ── */

export const LookPanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const LookScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  ${thinScrollbar}
`;

export const LookGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

export const LookFeatureCard = styled.div`
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  padding: 13px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const LookFeatureLabel = styled.div`
  font-size: 9.5px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.9px;
`;

export const LookSlotsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const LookSlotWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
`;

export const LookSlot = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 10px;
  background: ${"var(--pp-card)"};
  border: 1px dashed ${"var(--pp-border2)"};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  position: relative;
  overflow: hidden;
  &:hover {
    border-style: solid;
    border-color: ${"var(--pp-accent)"};
    background: rgba(var(--pp-accent-rgb),0.1);
    box-shadow: 0 0 12px rgba(var(--pp-accent-rgb),0.14);
  }
`;

export const LookSlotPlus = styled.span`
  font-size: 22px;
  color: ${"var(--pp-txt3)"};
  line-height: 1;
  pointer-events: none;
  ${LookSlot}:hover & { color: ${"var(--pp-accent)"}; }
`;

export const LookSlotSubLabel = styled.div`
  font-size: 9px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const LookSliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const LookSliderLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${"var(--pp-txt2)"};
  min-width: 42px;
`;

export const LookSlider = styled.input`
  flex: 1;
  accent-color: ${"var(--pp-accent)"};
  cursor: pointer;
  height: 4px;
`;

export const LookSliderValue = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${"var(--pp-txt3)"};
  min-width: 28px;
  text-align: right;
`;

/* ── Inventory action bar ── */

export const InvActionBar = styled.div`
  width: 100%;
  height: 58px;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  overflow: hidden;
`;

export const InvNudeBtn = styled.button`
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(220,38,38,0.3);
  background: rgba(220,38,38,0.07);
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { background: rgba(220,38,38,0.14); border-color: rgba(220,38,38,0.5); }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const InvResetBtn = styled.button`
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid ${"var(--pp-border)"};
  background: transparent;
  color: ${"var(--pp-txt3)"};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover { color: ${"var(--pp-txt2)"}; border-color: ${"var(--pp-border2)"}; }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

export const InvApplyBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(var(--pp-accent-rgb),0.3);
  background: rgba(var(--pp-accent-rgb),0.1);
  color: ${"var(--pp-accent)"};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  position: relative; overflow: hidden;
  transition: all 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.18); border-color: ${"var(--pp-border2)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;

/* ── Inventory panel ── */

export const InvContentCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--pp-gradPanel);
`;

export const InvCatScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  ${thinScrollbar}
`;

export const InvCatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const InvCatCard = styled.div`
  position: relative;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 4px 18px rgba(100,50,200,0.1); }
`;

export const InvCatDeco = styled.img`
  position: absolute;
  z-index: 1;
  right: -8px;
  bottom: 0;
  height: 78%;
  width: auto;
  object-fit: contain;
  opacity: 0.07;
  filter: saturate(0);
  pointer-events: none;
  transition: transform 0.2s;
  ${InvCatCard}:hover & { transform: translateX(-4px) scale(1.05); }
`;

export const InvCatCardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid ${"var(--pp-border)"};
  background: rgba(var(--pp-accent-rgb),0.05);
  transition: background 0.13s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.1); }
`;

export const InvCatLabel = styled.span`font-size: 13px; font-weight: 700; color: ${"var(--pp-txt)"}; flex: 1;`;
export const InvCatArrow = styled.span`font-size: 13px; color: ${"var(--pp-txt3)"}; transition: transform 0.13s; ${InvCatCardTop}:hover & { transform: translateX(2px); }`;

export const InvCatSubList = styled.div`padding: 8px 14px 10px; display: flex; flex-direction: column; gap: 1px;`;

export const InvCatSubItem = styled.div`
  font-size: 11.5px;
  color: ${"var(--pp-txt2)"};
  padding: 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  transition: color 0.1s;
  &:hover { color: ${"var(--pp-accent)"}; font-weight: 600; }
`;

export const InvSubCount = styled.span`font-size: 10px; color: ${"var(--pp-txt3)"}; font-weight: 500;`;

export const InvQuickNavRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
`;

export const InvQuickNavBtn = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  &:hover {
    border-color: ${"var(--pp-border2)"};
    background: ${"var(--pp-card)"};
    box-shadow: 0 4px 18px rgba(100,50,200,0.1);
  }
`;

export const InvQuickNavLabel = styled.span`
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
`;

export const InvQuickNavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const InvQuickNavCount = styled.span`
  font-size: 11px;
  color: ${"var(--pp-txt3)"};
  font-weight: 500;
`;

export const InvQuickNavArrow = styled.span`
  font-size: 13px;
  color: ${"var(--pp-txt3)"};
  transition: transform 0.13s;
  ${InvQuickNavBtn}:hover & { transform: translateX(2px); color: ${"var(--pp-accent)"}; }
`;

export const InvItemScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  ${thinScrollbar}
`;

export const InvMsg = styled.div`text-align: center; color: ${"var(--pp-txt3)"}; padding: 20px 0; font-size: 13px;`;
export const InvErrTxt = styled.div`font-size: 12px; color: #dc2626; padding: 8px 12px;`;

export const InvItemList = styled.div`display: flex; flex-direction: column; gap: 6px;`;

export const InvItemCard = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 14px;
  background: var(--pp-gradCard);
  border: 1px solid ${p => p.$expanded ? "var(--pp-border2)" : "var(--pp-border)"};
  min-height: 88px;
  cursor: pointer;
  opacity: ${p => p.$locked ? 0.65 : 1};
  transition: border-color 0.15s, box-shadow 0.15s;
  &:hover { border-color: ${"var(--pp-border2)"}; box-shadow: 0 2px 10px rgba(120,60,220,0.1); }
`;

export const InvThumbImg = styled.img`flex-shrink: 0; width: 76px; height: 76px; object-fit: contain;`;

export const InvMidSection = styled.div`
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  background: var(--pp-gradInner);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  align-self: stretch;
  gap: 4px;
`;

export const InvItemName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const InvWearingBadge = styled.div`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  color: ${"var(--pp-accent)"};
  background: rgba(var(--pp-accent-rgb),0.1);
  border: 1px solid ${"var(--pp-border2)"};
  border-radius: 4px;
  padding: 2px 7px;
  width: fit-content;
`;

export const InvLockTxt = styled.div`font-size: 10px; font-weight: 600; color: #dc2626;`;

export const InvPricesArea = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  flex-shrink: 0;
  align-self: stretch;
  width: 35%;
`;

export const InvPricePanel = styled.div`
  border-radius: 10px;
  overflow: hidden;
  background: var(--pp-gradInner);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 24px;
  width: 50%;
`;

export const InvLevelBadge = styled.div`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  padding: 4px 12px;
  border-radius: 4px;
  align-self: stretch;
  text-align: center;
  background: rgba(220,38,38,0.1);
  color: #dc2626;
  border: 1px solid rgba(220,38,38,0.3);
  text-wrap: nowrap;
`;

export const InvBadgeAndPrice = styled.div`display: flex; gap: 6px; align-items: center;`;

export const InvCoinImg = styled.img`width: 32px; height: 32px; object-fit: contain;`;

export const InvPriceAmt = styled.div`font-size: 13px; font-weight: 700; color: ${"var(--pp-coin)"};`;

export const InvSellPanel = styled.button`
  width: 50%;
  border-radius: 10px;
  background: var(--pp-gradInner);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: ${"var(--pp-txt3)"};
  font-family: inherit;
  position: relative; overflow: hidden;
  transition: box-shadow 0.13s, color 0.13s;
  &::before { content:''; position:absolute; top:-20%; left:-60%; width:32%; height:140%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent); transform:skewX(-18deg) translateX(-100%); pointer-events:none; }
  &:hover:not(:disabled) { box-shadow: 0 2px 10px rgba(120,60,220,0.12); color: ${"var(--pp-accent)"}; }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ── Inventory breadcrumbs sidebar ── */

export const InvBreadcrumbCol = styled.div`
  width: 160px;
  flex-shrink: 0;
  border-left: 1px solid ${"var(--pp-border)"};
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--pp-gradSidebar);
  border-radius: 0 22px 22px 0;
  overflow-y: auto;
  ${thinScrollbar}
`;

export const InvCrumbStep = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.$active ? "var(--pp-accent)" : "var(--pp-txt3)"};
  background: ${p => p.$active
    ? "linear-gradient(145deg, rgba(var(--pp-accent-rgb),0.14), rgba(157,111,245,0.08))"
    : "var(--pp-surface)"};
  border: 1px solid ${p => p.$active ? "var(--pp-border2)" : "var(--pp-border)"};
  box-shadow: ${p => p.$active ? "0 0 18px rgba(var(--pp-accent-rgb),0.12), inset 0 1px 0 rgba(255,255,255,0.6)" : "none"};
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  transition: all 0.18s;
  word-break: break-word;
  line-height: 1.3;
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  ${p => p.$clickable && css`
    &:hover {
      background: rgba(var(--pp-accent-rgb),0.1);
      border-color: rgba(var(--pp-accent-rgb),0.35);
      color: ${"var(--pp-accent)"};
      box-shadow: 0 4px 14px rgba(var(--pp-accent-rgb),0.14);
      transform: translateY(-2px);
    }
    &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
  `}
`;

/* ── Theme picker ── */

export const ThemePanelInner = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradPanel);
  border-radius: 0 22px 22px 0;
  overflow: hidden;
`;

export const ThemeGrid = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-content: start;
  ${thinScrollbar}
`;

export const ThemeSwatch = styled.button`
  all: unset;
  box-sizing: border-box;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid ${p => p.$active ? p.$accent : "transparent"};
  box-shadow: ${p => p.$active ? `0 0 0 2px ${p.$accent}44, 0 4px 14px ${p.$accent}33` : "0 2px 8px rgba(0,0,0,0.08)"};
  transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
  background: ${p => p.$bg};
  display: flex;
  flex-direction: column;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.14); }
`;

export const ThemeSwatchTop = styled.div`
  height: 44px;
  background: ${p => p.$card};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 10px;
`;

export const ThemeSwatchDot = styled.div`
  width: 10px; height: 10px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

export const ThemeSwatchBottom = styled.div`
  padding: 8px 10px 9px;
  background: ${p => p.$bg};
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const ThemeSwatchName = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${p => p.$txt};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ThemeSwatchBar = styled.div`
  height: 3px;
  border-radius: 2px;
  background: ${p => p.$accent};
  width: ${p => p.$w || "60%"};
  opacity: 0.7;
`;
