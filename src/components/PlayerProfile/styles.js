import styled, { keyframes, css } from "styled-components";
import { FRAME_W, FRAME_H } from "./constants";

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

/* Frosted-glass surface: blur/saturate whatever sits behind it, plus a
   faint light edge to sell the "glass" read. Only one ancestor per stack
   should carry the blur — nested translucent children just add tint on
   top of it, since stacking backdrop-filter repeatedly is wasted GPU cost. */
export const glassPanel = css`
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.38);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(60,20,120,0.14);
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
  --pp-bg: #f7f3ff;
  --pp-surface: #ffffff;
  --pp-card: #f0eaff;
  --pp-cardHov: #e8deff;
  --pp-border: rgba(130, 80, 220, 0.14);
  --pp-border2: rgba(130, 80, 220, 0.26);
  --pp-accent: #7c3aed;
  --pp-accentLt: #9d6ff5;
  --pp-accent-rgb: 124, 58, 237;
  --pp-txt: #2e1065;
  --pp-txt2: #5b3fa0;
  --pp-txt3: #a98fd4;
  --pp-coin: #b45309;
  --pp-gradSidebar: linear-gradient(160deg, #ede8ff 0%, #f4eeff 100%);
  --pp-gradPanel: var(--pp-gradSidebar);
  --pp-gradCard: linear-gradient(to top, #ddd0f8, #f8f3ff);
  --pp-gradInner: linear-gradient(to top, #ede5ff, #ffffff);
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background: #33363c;
  border-radius: 40px;
  border: 1.5px solid rgba(255,255,255,0.4);
  box-shadow:
    0 24px 70px rgba(40,15,90,0.4),
    inset 0 1px 0 rgba(255,255,255,0.3),
    inset 0 0 50px rgba(var(--pp-accent-rgb),0.08);
`;

/* ── Middle Column / Content Panel ── */

export const MiddleCol = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 20px 20px 6px;
  overflow: hidden;
`;

export const NameCard = styled.div`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 16px 22px;
`;

export const ContentPanel = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

export const ContentPanelBody = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-shadow: ${p => p.$editing
    ? "0 0 0 3px rgba(var(--pp-accent-rgb),0.45), 0 10px 36px rgba(var(--pp-accent-rgb),0.32)"
    : "none"};
  overflow: hidden;
  position: relative;
  z-index: ${p => p.$editing ? 3 : 2};
  transition: box-shadow 0.25s;
`;

export const BookmarkRail = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  flex-shrink: 0;
  padding: 0 50px;
  z-index: 1;
`;

/* ── Canvas edit mode (About Me) ── */

/* Renders as the last child of ProfileWrapper (not a sibling of it) — z-index
   only resolves against elements sharing the same stacking-context ancestor,
   so from outside ProfileWrapper no z-index could ever have punched through
   to sit above ContentPanelBody. From in here, ContentPanelBody's higher
   z-index correctly wins, staying lit and clickable while this darkens and
   blocks everything else (avatar stage, bookmarks, name card). */
export const CanvasClickBlocker = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 40px;
  background: rgba(10, 5, 25, 0.6);
  cursor: not-allowed;
`;

export const CanvasActionsRow = styled.div`
  position: absolute;
  right: 14px;
  top: 10px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CanvasEditToggleBtn = styled.button`
  all: unset;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: ${"var(--pp-accent)"};
  padding: 4px 14px;
  border-radius: 8px;
  border: 1.5px solid rgba(var(--pp-accent-rgb),0.35);
  background: rgba(var(--pp-accent-rgb),0.08);
  transition: all 0.18s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.16); border-color: ${"var(--pp-accent)"}; }
`;

export const BookmarkTab = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 72px;
  height: 72px;
  padding: 8px 4px 6px;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid ${p => p.$active ? "var(--pp-accent)" : "transparent"};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: ${p => p.$active
    ? "linear-gradient(to top, rgba(var(--pp-accent-rgb),0.48) 0%, rgba(var(--pp-accent-rgb),0.16) 25%, transparent 42%)"
    : "transparent"};
  transition: border-color 0.18s, background 0.18s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const BookmarkIconImg = styled.span`
  width: 26px; height: 26px;
  flex-shrink: 0;
  display: inline-block;
  background: ${p => p.$active ? "var(--pp-accent)" : p.$danger ? "#dc2626" : "var(--pp-txt3)"};
  mask-image: url(${p => p.$src});
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-image: url(${p => p.$src});
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
`;

export const BookmarkIcon = styled.span`
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  color: ${p => p.$active ? "var(--pp-accent)" : p.$danger ? "#dc2626" : "var(--pp-txt3)"};
  filter: drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff);
`;

export const BookmarkLabel = styled.span`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  color: ${p => p.$active ? "var(--pp-accent)" : p.$danger ? "#dc2626" : "var(--pp-txt3)"};
`;

export const BookmarkNotifDot = styled.span`
  position: absolute;
  top: 5px;
  right: 6px;
  min-width: 14px;
  height: 14px;
  background: #e03131;
  border: 1.5px solid var(--pp-surface);
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

export const HeaderNameRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 22px;
  flex-wrap: wrap;
`;

export const HeaderMemberSince = styled.div`
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
  letter-spacing: 0.2px;
`;

export const HeaderStatsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const HeaderStatBox = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 6px;
`;

export const HeaderStatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.25);
  line-height: 1;
  white-space: nowrap;
`;

export const HeaderStatWord = styled.span`
  font-family: "Birthstone", cursive;
  font-weight: 400;
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
  font-size: 36px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.3px;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.25);
`;

export const ProfileMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const LevelBadge = styled.span`
  font-size: 19px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
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

export const SoulmateAvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--pp-accent);
`;

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
  overflow: hidden;
`;

export const ShowcaseRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

export const ShowcaseCard = styled.div`
  flex: 1; min-width: 0; height: 110px;
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

export const CanvasSecondaryBtn = styled(SecondaryBtn)`
  background: #ffffff;
  color: ${"var(--pp-txt2)"};
  border-color: rgba(var(--pp-accent-rgb),0.22);
  &:hover:not(:disabled) { background: #f3edff; color: ${"var(--pp-txt)"}; }
`;

export const CanvasPrimaryBtn = styled(PrimaryBtn)`
  background: #ffffff;
  color: ${"var(--pp-accent)"};
  border-color: rgba(var(--pp-accent-rgb),0.35);
  &:hover:not(:disabled) { background: #f3edff; }
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

export const ProfileOuter = styled.div`
  position: relative;
  width: min(96%, 1600px);
  max-width: 98%;
  height: 92%;
  display: flex;
  flex-direction: column;

  /* Sits exactly behind the outermost box-shadow ring on ProfileWrapper
     (which extends 10px past this box), so any antialiasing seam between
     the stacked rings reveals white instead of the modal's dark backdrop. */
  &::before {
    content: '';
    position: absolute;
    inset: -8px;
    /* background: #fff; */
    border-radius: 50px;
    z-index: -1;
  }
`;

/* Seated inside the wrapper's 40px corner: the circle is inset far enough along
   the diagonal that its edge tracks the border's curve. */
export const GlobalCloseBtn = styled.button`
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 30;
  background: ${"var(--pp-card)"};
  border: 1px solid ${"var(--pp-border)"};
  border-radius: 50%;
  width: 42px; height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${"var(--pp-txt3)"};
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
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
  border-radius: 0 0 18px 18px;
  overflow: hidden;`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
  letter-spacing: 0.2px;
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

export const PanelEmpty = styled.div`
  padding: 28px 14px;
  font-size: 12px;
  color: ${"var(--pp-txt3)"};
  text-align: center;
`;

/* ── Mail panel ── */

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

/* ── Inventory action bar ── */

export const InvActionBar = styled.div`
  width: calc(100% + 28px);
  margin: 0 -14px;
  height: 58px;
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 27px;
  background: rgba(var(--pp-accent-rgb),0.04);
  border-left: none;
  border-right: none;
  border-top: 1px solid ${"var(--pp-border)"};
  border-bottom: 1px solid ${"var(--pp-border)"};
  overflow: hidden;
`;

export const InvNudeBtn = styled.button`
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(220,38,38,0.3);
  background: rgba(220,38,38,0.07);
  color: #dc2626;
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 15px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ── Avatar Stage Column ── */

export const AvatarStageCol = styled.section`
  width: 450px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 14px;
  margin: 20px;
  background: transparent;
  border-radius: 26px;
  border: 1.5px solid rgba(255,255,255,0.4);
  gap: 10px;
  overflow: hidden;
  position: relative;
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

export const AvatarViewport = styled.div`
  flex: 1;
  min-height: 0;
  aspect-ratio: 510 / 900;
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 0 22px rgba(var(--pp-accent-rgb),0.1), inset 0 0 18px rgba(var(--pp-accent-rgb),0.04);
  position: relative;
  z-index: 2;
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 4px 0;
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
  transition: background 0.18s, border-color 0.18s, color 0.18s, box-shadow 0.18s;
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
  &:active:not(:disabled) { background: rgba(var(--pp-accent-rgb),0.22); box-shadow: none; }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
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
