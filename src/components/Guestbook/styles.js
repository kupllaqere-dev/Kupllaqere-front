import styled, { keyframes, css } from "styled-components";

// ── Animations ────────────────────────────────────────────────────────────
const pop = keyframes`
  0%   { transform: scale(0.75); opacity: 0; }
  70%  { transform: scale(1.08); }
  100% { transform: scale(1);    opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(-4px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

// ── Top modal header ──────────────────────────────────────────────────────

export const GBModalHeader = styled.div`
  flex-shrink: 0;
  height: 80px;
  background: var(--pp-gradSidebar);
  border-bottom: 1.5px solid var(--pp-border);
  display: flex;
  align-items: center;
  padding: 0 18px 0 20px;
  gap: 14px;
  position: relative;
`;

export const GBVisitorChip = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255,255,255,0.45);
  border: 1px solid var(--pp-border);
  border-radius: 24px;
  padding: 3px 10px 3px 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--pp-txt2);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const GBBannerTitle = styled.h2`
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 26px;
  font-weight: 800;
  color: var(--pp-txt);
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;

  &::before, &::after {
    content: "✦";
    font-size: 11px;
    color: var(--pp-accentLt);
    opacity: 0.7;
  }
`;

export const GBCloseBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(180,80,80,0.1);
  border: 1.5px solid rgba(180,80,80,0.22);
  border-radius: 50%;
  color: #b05040;
  font-size: 17px;
  cursor: pointer;
  transition: background 0.14s, transform 0.1s;
  &:hover  { background: rgba(180,80,80,0.2); transform: scale(1.08); }
  &:active { transform: scale(0.9); }
`;

// ── Two-column body ───────────────────────────────────────────────────────

export const GBTwoCol = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 6px;
  padding: 4px 16px 16px;
  background: rgba(var(--pp-accent-rgb), 0.06);
  overflow: hidden;
`;

// ── Outer wrappers ────────────────────────────────────────────────────────

export const GBLeftWrap = styled.div`
  width: 54%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradCard);
  border-radius: 16px;
  border: 1px solid var(--pp-border2);
  box-shadow: 4px 4px 10px rgba(0,0,0,0.12);
  padding: 14px 10px;
  overflow: hidden;
`;

export const GBRightWrap = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-gradCard);
  border-radius: 16px;
  border: 1px solid var(--pp-border2);
  box-shadow: 4px 4px 10px rgba(0,0,0,0.12);
  padding: 14px 10px;
  overflow: hidden;
`;

// ── LEFT — sticker canvas ─────────────────────────────────────────────────

export const GBLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  background: var(--pp-surface);
  border-radius: 10px;
  border: 1px solid var(--pp-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
`;

export const GBRings = styled.div``;
export const GBRing  = styled.div``;

export const GBNotebook = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-surface);
  position: relative;
  overflow: hidden;
`;

export const GBCanvasTopBar    = styled.div``;
export const GBCanvasBadge     = styled.span``;

export const GBStickerCount = styled.span`
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 10;
  font-size: 14px;
  font-weight: 700;
  color: var(--pp-accent);
  pointer-events: none;
`;

export const GBCanvasBody = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
`;

export const GBZoomControls = styled.div``;
export const GBZoomBtn      = styled.button``;

export const DeletePopover = styled.div`
  position: absolute;
  z-index: 50;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--pp-surface);
  border: 1.5px solid var(--pp-border2);
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.14);
  padding: 13px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  min-width: 200px;
  animation: ${pop} 0.17s ease;
`;

export const DeletePopoverText = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--pp-txt2);
  text-align: center;
  line-height: 1.5;
`;

export const DeletePopoverName    = styled.span`font-weight: 700; color: var(--pp-accent);`;
export const DeletePopoverActions = styled.div`display: flex; gap: 8px;`;

export const DeleteConfirmBtn = styled.button`
  all: unset;
  padding: 5px 14px;
  font-size: 12px; font-weight: 700;
  background: #c43b3b; color: #fff;
  border-radius: 8px; cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #a52e2e; }
`;

export const DeleteCancelBtn = styled.button`
  all: unset;
  padding: 5px 12px;
  font-size: 12px; font-weight: 600;
  background: var(--pp-card);
  border: 1px solid var(--pp-border);
  color: var(--pp-txt2);
  border-radius: 8px; cursor: pointer;
  &:hover { background: var(--pp-cardHov); }
`;

// ── Sticker tray ──────────────────────────────────────────────────────────

export const GBTray = styled.div`
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--pp-accentLt), var(--pp-accent));
  border: 1.5px solid var(--pp-accentLt);
  border-radius: 10px;
  margin: 10px 6px 6px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
`;

export const GBTrayLabelSection = styled.div`
  flex-shrink: 0;
  background: rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
`;

export const GBTrayPickerSection = styled.div`
  flex: 1;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
`;

export const GBTrayLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
  letter-spacing: 0.3px;
`;

export const PickerScroll = styled.div`
  flex: 1;
  display: flex;
  gap: 5px;
  overflow-x: auto;
  overflow-y: hidden;
`;

export const PickerBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 46px; height: 46px;
  display: flex; align-items: center; justify-content: center;
  font-size: 30px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
  box-shadow: ${p => p.$active
    ? "0 0 0 2.5px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.18)"
    : "none"};
  border: 2px solid ${p => p.$active ? "rgba(255,255,255,0.8)" : "transparent"};
  animation: ${p => p.$active ? css`${pop} 0.2s ease both` : "none"};
  &:hover  { transform: scale(1.18) translateY(-2px); }
  &:active { transform: scale(0.9); }
`;

export const GBCarouselBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.22);
  border: 1.5px solid rgba(255,255,255,0.4);
  border-radius: 50%;
  color: rgba(255,255,255,0.95);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.12s, opacity 0.12s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.38); }
  &:disabled { opacity: 0.3; cursor: default; }
`;

export const GBTrayMoreBtn = styled.button`
  all: unset;
  flex-shrink: 0;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.22);
  border: 1.5px solid rgba(255,255,255,0.35);
  border-radius: 8px;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,0.36); }
`;

export const PlacementToolbar = styled.div`
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--pp-accentLt), var(--pp-accent));
  border-radius: 10px;
  margin: 10px 6px 6px;
  padding: 7px 12px 8px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  animation: ${slideUp} 0.16s ease;
`;

export const PlacementHint = styled.span`
  font-size: 10.5px; color: rgba(255,255,255,0.85); font-style: italic; flex: 1; text-align: center;
`;
export const ToolGroup = styled.div`display: flex; gap: ${p => p.$gap ?? 3}px; align-items: center;`;
export const ToolBtn = styled.button`
  all: unset; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; background: rgba(255,255,255,0.22); border: 1.5px solid rgba(255,255,255,0.35);
  border-radius: 8px; color: rgba(255,255,255,0.95); cursor: pointer;
  transition: background 0.12s, transform 0.1s;
  &:hover  { background: rgba(255,255,255,0.38); transform: scale(1.08); }
  &:active { transform: scale(0.9); }
`;
export const ConfirmBtn = styled.button`
  all: unset; padding: 6px 14px; font-size: 12.5px; font-weight: 700;
  background: rgba(255,255,255,0.92); color: var(--pp-accent); border-radius: 10px; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  &:hover  { box-shadow: 0 4px 14px rgba(0,0,0,0.22); transform: translateY(-1px); }
  &:active { transform: scale(0.95); }
`;
export const CancelBtn = styled.button`
  all: unset; padding: 6px 12px; font-size: 12.5px; font-weight: 600;
  background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.9); border-radius: 10px; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.3); }
  &:active { transform: scale(0.95); }
`;

// ── RIGHT — messages panel ────────────────────────────────────────────────

export const GBRight = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--pp-surface);
  border-radius: 10px;
  border: 1px solid var(--pp-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
`;

export const GBComposeSectionHeader = styled.div`
  flex-shrink: 0;
  padding: 12px 18px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const GBSectionTitle = styled.span`
  font-size: 12.5px; font-weight: 800; color: var(--pp-txt2);
  letter-spacing: 0.5px; text-transform: uppercase;
`;

export const GBHelpBtn = styled.button`
  all: unset;
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--pp-accent-rgb), 0.1);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.28);
  border-radius: 50%;
  font-size: 9.5px; color: var(--pp-accent); cursor: pointer;
  &:hover { background: rgba(var(--pp-accent-rgb), 0.2); }
`;

export const GBComposeWrap = styled.div`
  flex-shrink: 0; padding: 8px 14px 6px; display: flex; gap: 8px; align-items: flex-start;
`;

export const GBComposeTextWrap = styled.div`
  flex: 1;
  position: relative;
`;

export const GBComposeInput = styled.textarea`
  width: 100%; box-sizing: border-box;
  min-height: 72px; max-height: 96px; resize: none;
  padding: 8px 10px 34px;
  font-family: inherit; font-size: 12.5px; color: var(--pp-txt);
  background: var(--pp-card);
  border: 1.5px solid var(--pp-border); border-radius: 10px; outline: none;
  transition: border-color 0.14s; line-height: 1.45; display: block;
  &::placeholder { color: var(--pp-txt3); }
  &:focus { border-color: var(--pp-accentLt); background: var(--pp-surface); }
`;

export const GBComposeBottom = styled.div`
  position: absolute; bottom: 6px; right: 8px; left: 8px; z-index: 1;
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
`;

export const GBCharCounter = styled.span`
  font-size: 10.5px;
  color: ${p => p.$warn ? "#c0402a" : "var(--pp-txt3)"};
`;

export const GBPostBtn = styled.button`
  all: unset;
  padding: 6px 18px; font-size: 12.5px; font-weight: 700;
  background: linear-gradient(135deg, var(--pp-accent), var(--pp-accentLt));
  color: #fff; border-radius: 10px; cursor: pointer;
  box-shadow: 0 2px 8px rgba(var(--pp-accent-rgb), 0.3);
  transition: box-shadow 0.14s, transform 0.1s, opacity 0.12s;
  &:hover:not(:disabled)  { box-shadow: 0 4px 14px rgba(var(--pp-accent-rgb), 0.48); transform: translateY(-1px); }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.55; cursor: default; }
`;

export const GBMsgDivider = styled.div`
  flex-shrink: 0; margin: 12px 14px 6px;
  display: flex; align-items: center; gap: 0;
  &::after {
    content: ''; flex: 1; height: 1.5px; margin-left: 8px;
    background: linear-gradient(to right, transparent 0%, var(--pp-accentLt) 15%, var(--pp-accentLt) 85%, transparent 100%);
    opacity: 0.6;
  }
`;

export const GBMsgLabel = styled.span`
  font-size: 11.5px; font-weight: 800; color: #fff;
  background: var(--pp-accent);
  padding: 3px 12px; letter-spacing: 0.5px;
`;

export const GBMsgList = styled.div`
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 0 14px 10px; display: flex; flex-direction: column; gap: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--pp-accent-rgb), 0.22) transparent;
  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--pp-accent-rgb), 0.22); border-radius: 4px; }
`;

export const GBMsgCard = styled.div`
  background: rgba(var(--pp-accent-rgb), 0.06);
  border: 1px solid var(--pp-border2);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex; gap: 9px; align-items: flex-start;
  animation: ${fadeIn} 0.22s ease;
  transition: background 0.12s, box-shadow 0.15s;
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  box-shadow: ${p => p.$selected ? "0 4px 12px rgba(var(--pp-accent-rgb), 0.18)" : "none"};
  &:hover { background: rgba(var(--pp-accent-rgb), 0.11); }
`;

export const GBMsgAvatarWrap = styled.div`flex-shrink: 0;`;

export const GBMsgBody = styled.div`
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;
`;

export const GBMsgMeta = styled.div`display: flex; align-items: baseline; gap: 5px;`;

export const GBMsgName = styled.span`
  font-size: 12px; font-weight: 700; color: var(--pp-txt);
  &::before { content: "☆ "; font-size: 9px; color: var(--pp-accentLt); }
`;

export const GBMsgTime = styled.span`font-size: 10.5px; color: var(--pp-txt3);`;

export const GBMsgText = styled.p`
  margin: 0; font-size: 12px; color: var(--pp-txt2); line-height: 1.5; word-break: break-word;
`;

export const GBMsgActions = styled.div`display: flex; justify-content: flex-end; margin-top: 4px;`;

export const GBMsgHeart = styled.button`
  all: unset; display: flex; align-items: center; gap: 3px;
  font-size: 11px; color: var(--pp-txt3); cursor: default;
  padding: 2px 5px; border-radius: 6px;
`;

export const GBMsgDeleteBtn = styled.button`
  all: unset; font-size: 17px; color: var(--pp-txt3);
  cursor: pointer; flex-shrink: 0; padding: 0 2px 3px; line-height: 1;
  opacity: 0.6; transition: opacity 0.12s, color 0.12s;
  &:hover { opacity: 1; color: #c43b3b; }
`;

export const GBMsgActionBanner = styled.div`
  margin: 0 20px; overflow: hidden;
  max-height: ${p => p.$open ? "60px" : "0"};
  opacity:    ${p => p.$open ? "1"   : "0"};
  transition: max-height 0.22s ease-out, opacity 0.18s ease-out;
`;

export const GBMsgRemoveBtn = styled.button`
  all: unset; display: block; width: 100%; box-sizing: border-box;
  text-align: center; font-size: 11.5px; font-weight: 700;
  color: #c43b3b; cursor: pointer; padding: 4px 0;
  background: rgba(196,59,59,0.1);
  border: 1px solid rgba(196,59,59,0.22); border-top: none;
  border-radius: 0 0 8px 8px;
  transition: background 0.12s;
  &:hover { background: rgba(196,59,59,0.2); }
`;

export const GBMsgEmpty = styled.div`
  text-align: center; padding: 30px 0; font-size: 12.5px;
  color: var(--pp-txt3); font-style: italic;
`;

export const GBRightFooter = styled.div`
  flex-shrink: 0; padding: 7px 16px;
  border-top: 1px solid var(--pp-border);
  background: rgba(var(--pp-accent-rgb), 0.04);
  display: flex; align-items: center; justify-content: space-between;
`;

export const GBFooterNote = styled.span`font-size: 10.5px; color: var(--pp-txt3); font-style: italic;`;

export const GBStickerCanvas = styled.div`
  flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; overflow: hidden;
`;

export const GBStickerFooter = styled.div`
  flex-shrink: 0; padding: 8px 20px; display: flex; align-items: center;
  justify-content: space-between; border-top: 1px solid var(--pp-border);
  background: rgba(255,255,255,0.6); gap: 10px;
`;

export const GBStickerStat = styled.span`font-size: 11px; color: var(--pp-txt3);`;
