import styled, { keyframes, css } from "styled-components";

/* ─── Keyframes ─── */
const floatY = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const checkPulse = keyframes`
  from { opacity: 0.7; }
  to   { opacity: 1; }
`;

const panelPulse = keyframes`
  0%, 100% { box-shadow: 0 8px 32px rgba(109, 40, 217, 0.14), 0 2px 8px rgba(0,0,0,0.07); }
  50%       { box-shadow: 0 8px 40px rgba(109, 40, 217, 0.24), 0 2px 8px rgba(0,0,0,0.07); }
`;

const turnRing = keyframes`
  0%, 100% { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.45); }
  50%       { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.8); }
`;

const dotPulse = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.2); }
`;

/* ─── Palette ───────────────────────────────────────────────
   bg-panel    #F0ECFF   soft lavender
   bg-card     #FFFFFF   white
   bg-active   #F0FDF4   mint
   border      #C4B5FD   lavender
   border-act  #6EE7B7   green
   text-dark   #1E1B4B   deep indigo
   text-mid    #5B21B6   purple
   text-muted  #8B5CF6   light purple
   accent      #7C3AED   purple
   green       #059669
   red         #DC2626
────────────────────────────────────────────────────────────── */

/* ─── Window shell ─── */
export const ChessOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 60px;
  gap: 18px;
  z-index: 250;
  pointer-events: none;
`;

/* ─── Left side card (square) ─── */
export const SideCard = styled.div`
  pointer-events: all;
  position: relative;
  width: 420px;
  background: #F0ECFF;
  border: 1.5px solid #C4B5FD;
  border-radius: 20px;
  animation: ${panelPulse} 4s ease-in-out infinite;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 64px 26px 32px;
  gap: 12px;
`;

/* ─── Main board panel (square) ─── */
export const BoardPanel = styled.div`
  pointer-events: all;
  position: relative;
  width: 760px;
  height: 760px;
  background: #F0ECFF;
  border: 1.5px solid #C4B5FD;
  border-radius: 22px;
  animation: ${panelPulse} 4s ease-in-out infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  background: #EDE9FE;
  border: 1px solid #C4B5FD;
  border-radius: 50%;
  color: #7C3AED;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  font-family: inherit;
  line-height: 1;
  z-index: 5;

  &:hover {
    background: #FEE2E2;
    color: #DC2626;
    border-color: #FCA5A5;
  }
`;

/* ─── Player cards (row layout) ─── */
export const PlayerCard = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: ${({ $active }) => $active ? "#F0FDF4" : "#FFFFFF"};
  border: 1.5px solid ${({ $active }) => $active ? "#6EE7B7" : "#E0D9FF"};
  box-shadow: ${({ $active }) =>
    $active
      ? "0 0 0 3px rgba(16,185,129,0.1)"
      : "0 1px 3px rgba(0,0,0,0.06)"};
  transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
`;

export const CardAvatar = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 2.5px solid ${({ $active }) => $active ? "#34D399" : "#C4B5FD"};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EDE9FE;
  flex-shrink: 0;
  transition: border-color 0.3s;
  ${({ $active }) => $active && css`animation: ${turnRing} 2s ease-in-out infinite;`}
`;

export const CardInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const CardName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1E1B4B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
`;

export const CardRating = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #7C3AED;
  margin-top: 1px;
  letter-spacing: 0.2px;
`;

export const VsSep = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const VsLine = styled.div`
  flex: 1;
  height: 1.5px;
  background: #DDD6FE;
  border-radius: 2px;
`;

export const VsText = styled.div`
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #8B5CF6;
  text-transform: uppercase;
`;

export const GhostCard = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1.5px dashed #DDD6FE;
`;

export const GhostAvatar = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 2px dashed #C4B5FD;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #C4B5FD;
  background: #F5F3FF;
  flex-shrink: 0;
  animation: ${floatY} 3s ease-in-out infinite;
`;

export const GhostLabel = styled.div`
  font-size: 13px;
  color: #A78BFA;
  font-weight: 500;
`;

export const ColorBadge = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: ${({ $white }) => ($white ? "#78350F" : "#1F2937")};
  background: ${({ $white }) => ($white ? "#FEF3C7" : "#F3F4F6")};
  padding: 3px 9px;
  border-radius: 20px;
  border: 1px solid ${({ $white }) => ($white ? "#FCD34D" : "#D1D5DB")};
  display: inline-block;
`;

/* ─── Action area ─── */
export const ActionArea = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const InviteCard = styled.div`
  width: 100%;
  padding: 18px 14px;
  background: #EDE9FE;
  border: 1.5px dashed #A78BFA;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #5B21B6;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  user-select: none;

  &:hover {
    background: #DDD6FE;
    border-color: #7C3AED;
    border-style: solid;
    color: #3B0764;
    box-shadow: 0 2px 12px rgba(124, 58, 237, 0.18);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

export const InviteBtn = styled.button`
  width: 100%;
  padding: 11px 0;
  background: #7C3AED;
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.3);

  &:hover {
    background: #6D28D9;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
`;

export const ResignBtn = styled.button`
  width: 100%;
  padding: 8px 0;
  background: #FEF2F2;
  border: 1.5px solid #FCA5A5;
  border-radius: 10px;
  color: #DC2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
  letter-spacing: 0.3px;

  &:hover {
    background: #FEE2E2;
    border-color: #F87171;
    color: #991B1B;
  }
`;

export const CancelBtn = styled.button`
  padding: 9px 20px;
  background: #F5F3FF;
  border: 1.5px solid #C4B5FD;
  border-radius: 10px;
  color: #5B21B6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  letter-spacing: 0.2px;

  &:hover {
    background: #EDE9FE;
    border-color: #7C3AED;
    color: #3B0764;
  }
`;

/* ─── Turn pill ─── */
export const TurnPill = styled.div`
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.3px;
  transition: all 0.3s;
  color: ${({ $myTurn }) => ($myTurn ? "#065F46" : "#9CA3AF")};
  background: ${({ $myTurn }) => ($myTurn ? "#ECFDF5" : "#F9FAFB")};
  border: 1.5px solid ${({ $myTurn }) => ($myTurn ? "#6EE7B7" : "#E5E7EB")};
`;

/* ─── Right panel strips ─── */
export const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
`;

export const PlayerStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  height: 80px;
  padding: 12px 16px 12px 12px;
  border-radius: 14px;
  background: ${({ $active }) => $active ? "#F0FDF4" : "#FFFFFF"};
  border: 1.5px solid ${({ $active }) => $active ? "#6EE7B7" : "#E0D9FF"};
  box-shadow: ${({ $active }) =>
    $active ? "0 0 0 3px rgba(16,185,129,0.1)" : "0 1px 3px rgba(0,0,0,0.05)"};
  transition: all 0.3s;
`;

export const StripAvatar = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 2.5px solid ${({ $active }) => $active ? "#34D399" : "#C4B5FD"};
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EDE9FE;
  transition: border-color 0.3s;
`;

export const StripInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
`;

export const StripName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1E1B4B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
`;

export const TurnDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $active }) => ($active ? "#10B981" : "#D1D5DB")};
  flex-shrink: 0;
  transition: background 0.3s;
  ${({ $active }) => $active && css`animation: ${dotPulse} 1.4s ease-in-out infinite;`}
`;

/* ─── Chess board ─── */
export const BoardWrap = styled.div`
  position: relative;
  border-radius: 4px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1);
`;

export const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 88px);
  grid-template-rows: repeat(8, 88px);
`;

export const Square = styled.div`
  width: 88px;
  height: 88px;
  background: ${({ $light, $selected, $lastMove, $legalTarget }) => {
    if ($selected)    return $light ? "#F0E87A" : "#D4CC5A";
    if ($lastMove)    return $light ? "#E8E05A" : "#C8C045";
    if ($legalTarget) return $light ? "#C8D465" : "#A8B248";
    return $light ? "#F0D9B5" : "#B58863";
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;

  &:hover { filter: brightness(1.07); }
`;

export const PieceGlyph = styled.span`
  font-size: 54px;
  line-height: 1;
  position: relative;
  z-index: 1;
  text-shadow: ${({ $white }) =>
    $white
      ? "0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)"
      : "0 1px 3px rgba(255,255,255,0.15), 0 0 1px rgba(0,0,0,0.3)"};
  pointer-events: none;
`;

export const LegalDot = styled.div`
  position: absolute;
  width: ${({ $capture }) => ($capture ? "100%" : "34%")};
  height: ${({ $capture }) => ($capture ? "100%" : "34%")};
  border-radius: ${({ $capture }) => ($capture ? "0" : "50%")};
  background: ${({ $capture }) => ($capture ? "transparent" : "rgba(0,0,0,0.18)")};
  border: ${({ $capture }) => ($capture ? "5px solid rgba(0,0,0,0.2)" : "none")};
  box-sizing: border-box;
  pointer-events: none;
  z-index: 0;
`;

export const CoordRank = styled.span`
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 9px;
  font-weight: 700;
  color: ${({ $light }) => ($light ? "#B58863" : "#F0D9B5")};
  line-height: 1;
  pointer-events: none;
  opacity: 0.8;
`;

export const CoordFile = styled.span`
  position: absolute;
  bottom: 2px;
  right: 3px;
  font-size: 9px;
  font-weight: 700;
  color: ${({ $light }) => ($light ? "#B58863" : "#F0D9B5")};
  line-height: 1;
  pointer-events: none;
  opacity: 0.8;
`;

/* ─── Board overlays ─── */
export const BoardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(240, 236, 255, 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 10;
`;

export const OverlayTitle = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #1E1B4B;
  text-align: center;
  letter-spacing: 0.2px;
`;

export const OverlaySub = styled.div`
  font-size: 14px;
  color: #5B21B6;
  text-align: center;
`;

export const OverlayBtn = styled.button`
  padding: 11px 30px;
  background: #7C3AED;
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.3);

  &:hover {
    background: #6D28D9;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
  }
`;

/* ─── Promotion picker ─── */
export const PromotionOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(240, 236, 255, 0.97);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 20;
`;

export const PromotionRow = styled.div`
  display: flex;
  gap: 12px;
`;

export const PromotionPiece = styled.div`
  width: 68px;
  height: 68px;
  background: #FFFFFF;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  cursor: pointer;
  border: 2px solid #C4B5FD;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.18s;
  user-select: none;

  &:hover {
    background: #EDE9FE;
    border-color: #7C3AED;
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
  }
`;

/* ─── Player-list overlay ─── */
export const ListOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 340px;
  max-height: 460px;
  background: #F5F3FF;
  border: 1.5px solid #C4B5FD;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 28px 22px;
  gap: 14px;
  z-index: 15;
  pointer-events: all;
  box-shadow: 0 16px 48px rgba(109, 40, 217, 0.18), 0 4px 12px rgba(0,0,0,0.1);
`;

export const ListTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: #1E1B4B;
  letter-spacing: 0.2px;
`;

export const ListScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #C4B5FD;
    border-radius: 2px;
  }
`;

export const PlayerRow = styled.div`
  padding: 11px 16px;
  background: #FFFFFF;
  border: 1.5px solid #E0D9FF;
  border-radius: 12px;
  color: #2D1B69;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.16s;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.1px;

  &:hover {
    background: #EDE9FE;
    border-color: #A78BFA;
    color: #1E1B4B;
    transform: translateX(3px);
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
  }
`;

export const PlayerDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10B981;
  flex-shrink: 0;
  animation: ${dotPulse} 1.8s ease-in-out infinite;
`;

export const EmptyNote = styled.div`
  font-size: 13px;
  color: #A78BFA;
  text-align: center;
  padding: 28px 0;
  letter-spacing: 0.2px;
`;

export const ListActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

/* ─── Pending / spinner ─── */
export const PendingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  text-align: center;
`;

export const SpinnerRing = styled.div`
  width: 38px;
  height: 38px;
  border: 3px solid #DDD6FE;
  border-top-color: #7C3AED;
  border-radius: 50%;
  animation: ${spin} 0.9s linear infinite;
`;

export const PendingText = styled.div`
  font-size: 14px;
  color: #5B21B6;
  line-height: 1.6;
  letter-spacing: 0.1px;
`;

/* ─── Idle intro ─── */
export const IntroWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex: 1;
  color: #8B5CF6;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
`;

export const ChessEmoji = styled.div`
  font-size: 64px;
  line-height: 1;
  opacity: 0.5;
  animation: ${floatY} 3.5s ease-in-out infinite;
`;

/* ─── Invite notification cards ─── */
export const NotifStack = styled.div`
  position: absolute;
  bottom: 76px;
  right: 16px;
  z-index: 400;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: all;
`;

export const NotifCard = styled.div`
  background: #F5F3FF;
  border: 1.5px solid #C4B5FD;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 8px 28px rgba(109, 40, 217, 0.18), 0 2px 6px rgba(0,0,0,0.08);
  min-width: 276px;
  max-width: 316px;
`;

export const NotifTitle = styled.div`
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
  color: #7C3AED;
  margin-bottom: 6px;
  text-transform: uppercase;
`;

export const NotifBody = styled.div`
  font-size: 13px;
  color: #1E1B4B;
  margin-bottom: 12px;
  line-height: 1.5;
`;

export const NotifActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const AcceptBtn = styled.button`
  flex: 1;
  padding: 9px 0;
  background: #059669;
  border: none;
  border-radius: 10px;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);

  &:hover {
    background: #047857;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);
  }
`;

export const DeclineBtn = styled.button`
  flex: 1;
  padding: 9px 0;
  background: #FEF2F2;
  border: 1.5px solid #FCA5A5;
  border-radius: 10px;
  color: #DC2626;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18px;
  letter-spacing: 0.3px;

  &:hover {
    background: #FEE2E2;
    border-color: #F87171;
    color: #991B1B;
  }
`;

export const DeclineCard = styled.div`
  background: #FFF5F5;
  border: 1.5px solid #FCA5A5;
  border-radius: 16px;
  padding: 13px 18px;
  box-shadow: 0 8px 28px rgba(220, 38, 38, 0.1), 0 2px 6px rgba(0,0,0,0.06);
  min-width: 240px;
  max-width: 316px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const DeclineText = styled.div`
  font-size: 13px;
  color: #991B1B;
  line-height: 1.45;
`;

export const DismissBtn = styled.button`
  background: transparent;
  border: none;
  color: #FCA5A5;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  line-height: 1;
  font-family: inherit;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover { color: #DC2626; }
`;

/* ─── Check banner ─── */
export const CheckBanner = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #DC2626;
  letter-spacing: 0.5px;
  animation: ${checkPulse} 0.7s ease-in-out infinite alternate;
`;
