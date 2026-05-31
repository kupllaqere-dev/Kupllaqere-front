import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import EmojiPicker from "emoji-picker-react";
import PlayerThumbnail from "./PlayerThumbnail";
import PlayerContextMenu from "./PlayerContextMenu";

const KLIPY_KEY = "REEXWlCMkIFXqQdJQBzTBCsS8QNdShFb7dUCYfZSPknZA2vSlDJlJ8CpwswaPKry";

const AVATAR_BG = [
  "#4f46e5", "#7c3aed", "#0891b2", "#0d9488",
  "#059669", "#d97706", "#dc2626", "#9333ea",
  "#2563eb", "#db2777",
];

function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length];
}

const MIN_W = 560, MAX_W = 1300, MIN_H = 380, MAX_H = 900;
const NAV_W = 172;
const MEMBERS_W = 150;

const THEME_BG      = "rgba(16, 20, 36, 0.72)";
const THEME_BORDER  = "1px solid rgba(255,255,255,0.08)";
const THEME_BLUR    = "blur(14px)";
const THEME_SHADOW  = "0 0 20px rgba(139,233,255,0.05), 0 8px 32px rgba(0,0,0,0.35)";
const THEME_TEXT    = "#F2EEFF";
const THEME_TSHADOW = "0 0 10px rgba(200,162,255,0.25)";
const FONT          = "'Quicksand', sans-serif";
const PINK          = "#e879f9";
const PINK_LIGHT    = "#fce7f3";
const PINK_SHADOW   = "0 0 10px rgba(232,121,249,0.4)";
const ORANGE        = "#f97316";
const ORANGE_LIGHT  = "#fed7aa";
const ORANGE_SHADOW = "0 0 10px rgba(249,115,22,0.4)";
const CBLUE         = "#60a5fa";
const CBLUE_LIGHT   = "#dbeafe";
const CBLUE_SHADOW  = "0 0 10px rgba(96,165,250,0.4)";

const navGlow = keyframes`
  0%, 100% { background: transparent; }
  50% { background: rgba(200,162,255,0.1); }
`;

/* ─── Layout ───────────────────────────────────────────────── */

const Wrapper = styled.div`
  position: absolute;
  bottom: 20px;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 1000;
  pointer-events: none;
`;

const BottomToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-top: 4px;
  border-radius: 14px;
  background: ${THEME_BG};
  backdrop-filter: ${THEME_BLUR};
  border: ${THEME_BORDER};
  color: rgba(242,238,255,0.45);
  cursor: pointer;
  pointer-events: all;
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  box-shadow: ${THEME_SHADOW};
  transition: color 0.15s, background 0.15s;
  &:hover { color: ${THEME_TEXT}; background: rgba(30, 36, 60, 0.9); }
`;

const Panel = styled.div`
  background: ${THEME_BG};
  backdrop-filter: ${THEME_BLUR};
  border: ${THEME_BORDER};
  border-radius: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  pointer-events: all;
  box-shadow: ${THEME_SHADOW};
  overflow: hidden;
  user-select: none;
  position: relative;
  font-family: ${FONT};
  color: ${THEME_TEXT};
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 28px;
  height: 28px;
  cursor: ne-resize;
  z-index: 20;
  &::before {
    content: '';
    position: absolute;
    top: 7px;
    right: 7px;
    width: 12px;
    height: 12px;
    border-top: 2px solid rgba(242, 238, 255, 0.25);
    border-right: 2px solid rgba(242, 238, 255, 0.25);
    border-radius: 2px;
    transition: border-color 0.15s;
  }
  &:hover::before { border-color: rgba(242, 238, 255, 0.65); }
`;

const PanelBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
`;

const SideExpandBtn = styled.button`
  width: 10px;
  height: 80px;
  flex-shrink: 0;
  align-self: center;
  background: ${THEME_BG};
  backdrop-filter: ${THEME_BLUR};
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: all;
  clip-path: ${p => p.$expanded
    ? "polygon(100% 0%, 0% 50%, 100% 100%)"
    : "polygon(0% 0%, 100% 50%, 0% 100%)"};
  transition: background 0.15s, clip-path 0.2s;
  margin-left: 0;
  &:hover { background: rgba(30, 36, 60, 0.9); }
`;

/* ─── Nav Panel ─────────────────────────────────────────────── */

const NavPanel = styled.div`
  width: ${NAV_W}px;
  flex-shrink: 0;
  border-right: ${THEME_BORDER};
  overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(242, 238, 255, 0.12); border-radius: 3px; }
`;

const NavGroup = styled.div`
  margin-bottom: 4px;
`;

const NavGroupLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: rgba(242, 238, 255, 0.28);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  padding: 10px 12px 4px;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 8px;
  width: calc(100% - 16px);
  padding: 7px 8px;
  background: ${p => p.$active
    ? `linear-gradient(90deg, ${p.$color}30 0%, transparent 50%, ${p.$color}30 100%)`
    : "transparent"};
  border: 1px solid ${p => p.$active ? `${p.$color}45` : "transparent"};
  border-radius: 10px;
  color: ${p => p.$active ? THEME_TEXT : "rgba(242,238,255,0.45)"};
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  box-sizing: border-box;
  ${p => p.$glowing && css`animation: ${navGlow} 1.6s ease-in-out infinite;`}
  &:hover {
    color: ${THEME_TEXT};
    background: ${p => p.$active
      ? `linear-gradient(90deg, ${p.$color}40 0%, transparent 50%, ${p.$color}40 100%)`
      : `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)`};
    border-color: ${p => p.$active ? `${p.$color}55` : "rgba(255,255,255,0.07)"};
  }
`;

const NavIcon = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: ${p => `${p.$color}28`};
  border: 1px solid ${p => `${p.$color}38`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${p => p.$color};
`;

const NavLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NavCount = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(242,238,255,0.38);
  flex-shrink: 0;
`;

/* ─── Right Section ─────────────────────────────────────────── */

const RightSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px 0 14px;
  height: 44px;
  flex-shrink: 0;
  border-bottom: ${THEME_BORDER};
`;

const TopBarTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${THEME_TEXT};
  text-shadow: ${THEME_TSHADOW};
  white-space: nowrap;
`;

const IconBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: ${p => p.$active ? "rgba(200,162,255,0.18)" : "transparent"};
  border: none;
  color: ${p => p.$active ? THEME_TEXT : "rgba(242,238,255,0.4)"};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
  &:hover { color: ${THEME_TEXT}; background: rgba(255,255,255,0.08); }
`;

const ContentRow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
`;

/* ─── Main Area ─────────────────────────────────────────────── */

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(242, 238, 255, 0.15); border-radius: 3px; }
`;

const MsgRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.45;
  word-break: break-word;
`;

const PlayerFrame = styled.div`
  width: ${p => p.$s}px;
  height: ${p => p.$s}px;
  border-radius: 50%;
  border: 1.5px solid ${p => p.$c};
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0,0,0,0.3);
  box-shadow: 0 0 7px ${p => p.$c}55;
`;

const ClickableAvatar = styled.div`
  border-radius: 50%;
  cursor: ${p => p.$active ? "pointer" : "default"};
  transition: filter 0.15s;
  &:hover { filter: ${p => p.$active ? "drop-shadow(0 0 6px rgba(255,255,255,0.45))" : "none"}; }
`;

const MsgContent = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 2px;
`;

const MsgSender = styled.span`
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: ${p => {
    if (p.$mode === "whisper") return p.$self ? PINK        : "#f0abfc";
    if (p.$mode === "party")   return p.$self ? ORANGE      : ORANGE_LIGHT;
    if (p.$mode === "clan")    return p.$self ? CBLUE       : CBLUE_LIGHT;
    return p.$self ? "#4ade80" : "#93c5fd";
  }};
  text-shadow: ${p => {
    if (p.$mode === "whisper") return PINK_SHADOW;
    if (p.$mode === "party")   return ORANGE_SHADOW;
    if (p.$mode === "clan")    return CBLUE_SHADOW;
    return p.$self ? "0 0 10px rgba(74,222,128,0.35)" : "0 0 10px rgba(147,197,253,0.35)";
  }};
  margin-bottom: 0;
`;

const MsgSenderInner = styled.span`
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const MsgText = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${p => {
    if (p.$mode === "whisper") return PINK_LIGHT;
    if (p.$mode === "party")   return ORANGE_LIGHT;
    if (p.$mode === "clan")    return CBLUE_LIGHT;
    return THEME_TEXT;
  }};
  text-shadow: ${p => {
    if (p.$mode === "whisper") return "0 0 10px rgba(232,121,249,0.2)";
    if (p.$mode === "party")   return "0 0 10px rgba(249,115,22,0.15)";
    if (p.$mode === "clan")    return "0 0 10px rgba(96,165,250,0.15)";
    return THEME_TSHADOW;
  }};
`;

/* ─── Input Section ─────────────────────────────────────────── */

const InputSection = styled.div`
  border-top: ${THEME_BORDER};
  flex-shrink: 0;
  position: relative;
`;

const InputRow = styled.form`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
`;

const WhisperLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  color: ${PINK};
  font-family: ${FONT};
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 0 8px;
  min-height: 40px;
  transition: border-color 0.15s;
  &:focus-within {
    border-color: ${p => {
      if (p.$mode === "whisper") return "rgba(232,121,249,0.45)";
      if (p.$mode === "party")   return "rgba(249,115,22,0.45)";
      if (p.$mode === "clan")    return "rgba(96,165,250,0.45)";
      return "rgba(200,162,255,0.35)";
    }};
  }
`;

const InputField = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${p => {
    if (p.$mode === "whisper") return PINK;
    if (p.$mode === "party")   return ORANGE;
    if (p.$mode === "clan")    return CBLUE;
    return THEME_TEXT;
  }};
  font-family: ${FONT};
  font-size: 13.5px;
  font-weight: 600;
  outline: none;
  padding: 8px 6px;
  align-self: stretch;
  transition: color 0.15s;
  &::placeholder { color: rgba(242, 238, 255, 0.28); }
`;

const InlineIconBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(242,238,255,0.35);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: rgba(242,238,255,0.7); }
`;

const SendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${p => {
    if (p.$mode === "whisper") return "rgba(232,121,249,0.2)";
    if (p.$mode === "party")   return "rgba(249,115,22,0.2)";
    if (p.$mode === "clan")    return "rgba(96,165,250,0.2)";
    return "rgba(200,162,255,0.18)";
  }};
  border: 1px solid ${p => {
    if (p.$mode === "whisper") return "rgba(232,121,249,0.35)";
    if (p.$mode === "party")   return "rgba(249,115,22,0.35)";
    if (p.$mode === "clan")    return "rgba(96,165,250,0.35)";
    return "rgba(200,162,255,0.28)";
  }};
  color: ${THEME_TEXT};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background: ${p => {
      if (p.$mode === "whisper") return "rgba(232,121,249,0.35)";
      if (p.$mode === "party")   return "rgba(249,115,22,0.35)";
      if (p.$mode === "clan")    return "rgba(96,165,250,0.35)";
      return "rgba(200,162,255,0.32)";
    }};
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 6px;
  padding: 0 12px 10px;
`;

const QuickBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  color: rgba(242,238,255,0.55);
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  letter-spacing: 0.2px;
  &:hover {
    background: rgba(200,162,255,0.08);
    border-color: rgba(200,162,255,0.22);
    color: ${THEME_TEXT};
  }
`;

const CmdBadge = styled.span`
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1px;
  background: ${p => {
    if (p.$mode === "whisper") return "rgba(232,121,249,0.22)";
    if (p.$mode === "party")   return "rgba(249,115,22,0.22)";
    if (p.$mode === "clan")    return "rgba(34,197,94,0.22)";
    return "transparent";
  }};
  color: ${p => {
    if (p.$mode === "whisper") return PINK;
    if (p.$mode === "party")   return ORANGE;
    if (p.$mode === "clan")    return "#22c55e";
    return "inherit";
  }};
`;

const WhisperPrefix = styled.span`
  color: ${PINK};
  font-family: ${FONT};
  font-size: 13.5px;
  font-weight: 700;
  flex-shrink: 0;
  padding: 0 4px;
  opacity: 0.85;
  user-select: none;
`;

const WhisperNameInput = styled.input`
  width: 88px;
  flex-shrink: 0;
  background: transparent;
  border: 1.5px dashed rgba(232,121,249,0.4);
  border-radius: 6px;
  color: ${PINK};
  font-family: ${FONT};
  font-size: 12.5px;
  font-weight: 700;
  outline: none;
  padding: 8px 7px;
  transition: border-color 0.15s, border-style 0.15s;
  &::placeholder { color: rgba(232,121,249,0.3); font-weight: 600; }
  &:focus {
    border-color: rgba(232,121,249,0.75);
    border-style: solid;
  }
`;

const GifPickerWrap = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  width: 340px;
  height: 320px;
  background: rgba(12, 16, 30, 0.98);
  backdrop-filter: ${THEME_BLUR};
  border: ${THEME_BORDER};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
`;

const GifSearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: ${THEME_TEXT};
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 600;
  padding: 7px 10px;
  outline: none;
  &::placeholder { color: rgba(242,238,255,0.25); }
  &:focus { border-color: rgba(200,162,255,0.35); }
`;

const EmojiPickerWrap = styled.div`
  position: absolute;
  bottom: calc(100% + 6px);
  right: 44px;
  z-index: 200;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
`;

const ErrorMsgRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 8px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.22);
  color: rgba(239,68,68,0.9);
  font-family: ${FONT};
  font-size: 12.5px;
  font-weight: 600;
`;

/* ─── Members Panel ─────────────────────────────────────────── */

const MembersPanel = styled.div`
  width: ${p => p.$expanded ? MEMBERS_W : 0}px;
  flex-shrink: 0;
  box-shadow: ${p => p.$expanded ? "inset 1px 0 0 rgba(255,255,255,0.08)" : "none"};
  overflow: hidden;
  transition: width 0.2s ease, box-shadow 0.2s ease;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(242, 238, 255, 0.12); border-radius: 3px; }
`;

const MembersTitle = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: rgba(242,238,255,0.28);
  text-transform: uppercase;
  letter-spacing: 1.1px;
  padding: 4px 6px 8px;
`;

const MemberCard = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 9px;
  width: 100%;
  box-sizing: border-box;
  background: ${p => p.$active ? "rgba(200,162,255,0.12)" : "transparent"};
  border: 1px solid ${p => p.$active ? "rgba(200,162,255,0.28)" : "transparent"};
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  &:hover { background: rgba(255,255,255,0.05); }
`;

const MemberName = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: rgba(242,238,255,0.62);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  font-family: ${FONT};
  cursor: pointer;
  &:hover { text-decoration: underline; text-decoration-color: currentColor; }
`;

/* ─── Whisper Convo Panel ───────────────────────────────────── */

const WhisperConvoPanel = styled.div`
  width: 128px;
  flex-shrink: 0;
  border-right: ${THEME_BORDER};
  overflow-y: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(242,238,255,0.12); border-radius: 3px; }
`;

const WhisperConvoLabel = styled.div`
  font-size: 9px;
  font-weight: 700;
  color: rgba(242,238,255,0.28);
  text-transform: uppercase;
  letter-spacing: 1.1px;
  padding: 2px 4px 6px;
`;

const WhisperConvoItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 6px;
  border-radius: 9px;
  background: ${p => p.$active ? "rgba(168,85,247,0.16)" : "transparent"};
  border: 1px solid ${p => p.$active ? "rgba(168,85,247,0.38)" : "transparent"};
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.2); }
`;

const WhisperConvoFrame = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid ${p => p.$active ? "rgba(168,85,247,0.55)" : "rgba(168,85,247,0.22)"};
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(0,0,0,0.3);
`;

const WhisperConvoName = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$active ? THEME_TEXT : "rgba(242,238,255,0.55)"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  font-family: ${FONT};
`;

/* ─── Icons ─────────────────────────────────────────────────── */

const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 3.5L9 10.5H4v3h4.5L7 20.5h3l1.5-7H16l-1.5 7h3l1.5-7H23v-3h-4.5l1.5-7h-3l-1.5 7H11z"/>
  </svg>
);

const IconWhisperTab = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>
);

const IconPartyTab = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const IconClanTab = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
  </svg>
);

const IconAnnounce = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconMembers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

/* ─── Tab definitions ───────────────────────────────────────── */

const TAB_DEFS = [
  { group: "CHANNELS", id: "general",      label: "General",       hasCount: true,  color: "#3b82f6", Icon: IconHash        },
  { group: "CHANNELS", id: "whisper",       label: "Whisper",       hasCount: false, color: "#a855f7", Icon: IconWhisperTab  },
  { group: "GROUPS",   id: "party",         label: "Party",         hasCount: true,  color: "#f97316", Icon: IconPartyTab    },
  { group: "GROUPS",   id: "clan",          label: "Clan",          hasCount: true,  color: "#22c55e", Icon: IconClanTab     },
  { group: "SYSTEM",   id: "announcements", label: "Announcements", hasCount: false, color: "#f59e0b", Icon: IconAnnounce   },
];
const GROUPS = ["CHANNELS", "GROUPS", "SYSTEM"];

/* ─── GIF Picker ────────────────────────────────────────────── */

function GifPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const delay = query.trim() ? 400 : 0;
    const t = setTimeout(() => {
      const url = query.trim()
        ? `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/search?q=${encodeURIComponent(query.trim())}&per_page=24`
        : `https://api.klipy.com/api/v1/${KLIPY_KEY}/gifs/trending?per_page=24`;
      setLoading(true);
      fetch(url)
        .then(r => r.json())
        .then(d => { if (!cancelled) { setGifs(d.data?.data || []); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });
    }, delay);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  return (
    <GifPickerWrap>
      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <GifSearchInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search GIFs..."
          onKeyDown={e => e.stopPropagation()}
          onKeyUp={e => e.stopPropagation()}
          autoFocus
        />
      </div>
      <div style={{
        flex: 1, overflowY: "auto", padding: 8,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, alignContent: "start",
      }}>
        {loading && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 24, color: "rgba(242,238,255,0.3)", fontFamily: FONT, fontSize: 12 }}>
            Loading...
          </div>
        )}
        {!loading && gifs.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 24, color: "rgba(242,238,255,0.3)", fontFamily: FONT, fontSize: 12 }}>
            No results
          </div>
        )}
        {!loading && gifs.map(gif => (
          <img
            key={gif.id}
            src={gif.file.sm.gif.url}
            alt={gif.title}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 7, cursor: "pointer", display: "block" }}
            onClick={() => onSelect(gif)}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          />
        ))}
      </div>
    </GifPickerWrap>
  );
}

/* ─── Component ─────────────────────────────────────────────── */

const ChatBox = forwardRef(function ChatBox({ messages, whispers, players, myId, myName, onSend, onWhisper, onViewProfile }, ref) {
  const [tab, setTab] = useState("general");
  const [text, setText] = useState("");
  const [whisperPartner, setWhisperPartner] = useState(null);
  const [whisperCmdTarget, setWhisperCmdTarget] = useState(null);
  const [seenWhisperCount, setSeenWhisperCount] = useState(whispers.length);
  const [size, setSize] = useState({ width: 740, height: 500 });
  const [minimized, setMinimized] = useState(true);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [localErrors, setLocalErrors] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [playerMenu, setPlayerMenu] = useState(null);
  const playerMenuRef = useRef(null);
  const inputRef = useRef(null);
  const nameInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const sizeRef = useRef(size);
  const instantScrollRef = useRef(true);
  const emojiPickerRef = useRef(null);
  const gifPickerRef = useRef(null);

  useEffect(() => { sizeRef.current = size; }, [size]);

  useEffect(() => {
    if (!playerMenu) return;
    function onDown(e) {
      if (!playerMenuRef.current?.contains(e.target)) setPlayerMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [playerMenu]);

  function openPlayerMenu(player, e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerMenu({ ...player, x: rect.right, y: rect.top });
  }

  useImperativeHandle(ref, () => ({
    openWhisper({ id, name }) {
      instantScrollRef.current = true;
      setTab("whisper");
      setSeenWhisperCount(whispers.length);
      setWhisperPartner({ id, name });
      setTimeout(() => inputRef.current?.focus(), 50);
    },
  }), [whispers.length]);

  useEffect(() => {
    if (whisperCmdTarget) inputRef.current?.focus();
  }, [whisperCmdTarget]);

  const unreadWhisper = tab !== "whisper" && whispers.length > seenWhisperCount;

  const whisperConvos = useMemo(() => {
    const map = new Map();
    for (const msg of whispers) {
      const isMe = msg.from?.id === myId;
      const pid  = isMe ? msg.to    : msg.from?.id;
      const name = isMe ? (msg.toName || "?") : (msg.from?.name || "?");
      if (pid && !map.has(pid)) map.set(pid, { id: pid, name });
    }
    return [...map.values()];
  }, [whispers, myId]);

  const visibleWhispers = useMemo(() => {
    if (!whisperPartner) return whispers;
    return whispers.filter(msg => {
      const isMe = msg.from?.id === myId;
      return (isMe ? msg.to : msg.from?.id) === whisperPartner.id;
    });
  }, [whispers, whisperPartner, myId]);

  const allPlayers = useMemo(
    () => [{ id: myId, name: myName || "You" }, ...players],
    [myId, myName, players],
  );
  const otherPlayers = useMemo(
    () => players.filter(p => p.id !== myId),
    [players, myId],
  );

  const activeMessages = tab === "general" ? messages
    : tab === "whisper" ? visibleWhispers
    : [];

  const membersForTab = useMemo(() => {
    if (tab === "whisper") return whisperConvos;
    if (tab === "general") return allPlayers;
    return [];
  }, [tab, allPlayers, whisperConvos]);

  function tabCount(id) {
    if (id === "general") return allPlayers.length;
    if (id === "party" || id === "clan") return 0;
    return null;
  }

  const currentTabLabel = TAB_DEFS.find(t => t.id === tab)?.label ?? "Chat";

  useEffect(() => {
    const behavior = instantScrollRef.current ? "instant" : "smooth";
    instantScrollRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, [activeMessages.length, tab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localErrors.length]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function handlePointerDown(e) {
      if (e.target !== inputRef.current) inputRef.current?.blur();
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!showEmojiPicker && !showGifPicker) return;
    function handle(e) {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target))
        setShowEmojiPicker(false);
      if (showGifPicker && gifPickerRef.current && !gifPickerRef.current.contains(e.target))
        setShowGifPicker(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showEmojiPicker, showGifPicker]);

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.width;
    const startH = sizeRef.current.height;
    const extraW = membersExpanded ? MEMBERS_W : 0;
    let rafId = null;
    if (panelRef.current) panelRef.current.style.transition = "none";
    function onMove(ev) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const newW = Math.max(MIN_W, Math.min(MAX_W, startW + (ev.clientX - startX)));
        const newH = Math.max(MIN_H, Math.min(MAX_H, startH + (startY - ev.clientY)));
        sizeRef.current = { width: newW, height: newH };
        if (panelRef.current) {
          panelRef.current.style.width  = (newW + extraW) + "px";
          panelRef.current.style.height = newH + "px";
        }
      });
    }
    function onUp() {
      if (rafId) cancelAnimationFrame(rafId);
      if (panelRef.current) panelRef.current.style.transition = "width 0.2s ease";
      setSize({ ...sizeRef.current });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function handleTabChange(newTab) {
    instantScrollRef.current = true;
    setTab(newTab);
    if (newTab === "whisper") {
      setSeenWhisperCount(whispers.length);
      setWhisperPartner(null);
    }
  }

  function handleTextChange(e) {
    const val = e.target.value;
    if (!whisperCmdTarget) {
      const m = val.match(/^\/w (\S+) /);
      if (m) {
        const player = otherPlayers.find(p => (p.name || "").toLowerCase() === m[1].toLowerCase());
        if (player) {
          setWhisperCmdTarget(player);
          if (tab === "whisper") setWhisperPartner({ id: player.id, name: player.name });
          setText(val.slice(m[0].length));
          return;
        }
      }
    }
    setText(val);
  }

  function addLocalError(message) {
    const id = Date.now();
    setLocalErrors(prev => [...prev, { id, message }]);
    setTimeout(() => setLocalErrors(prev => prev.filter(e => e.id !== id)), 5000);
  }

  function handleSubmit(e) {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    if (whisperCmdTarget) {
      // whisperCmdTarget may lack an id if the player wasn't online when the
      // name was committed — re-check at send time.
      let targetId = whisperCmdTarget.id;
      if (!targetId) {
        const found = otherPlayers.find(
          p => (p.name || "").toLowerCase() === (whisperCmdTarget.name || "").toLowerCase()
        );
        targetId = found?.id;
      }
      if (targetId) {
        onWhisper(targetId, msg);
      } else {
        addLocalError(`Whisper couldn't be sent, ${whisperCmdTarget.name} is not online`);
      }
      setWhisperCmdTarget(null);
      setText("");
      return;
    }
    if (tab === "whisper") {
      const target = whisperPartner?.id;
      if (target) onWhisper(target, msg);
    } else {
      onSend(msg);
    }
    setText("");
  }

  function insertCmd(cmd) {
    setText(cmd);
    inputRef.current?.focus();
  }

  // Detect a pending /command prefix in the raw input text.
  // Match /w, /p, /c with or without a trailing space so the UI appears
  // as soon as the user finishes typing the command letter.
  const pendingCmdMode = !whisperCmdTarget
    ? /^\/w(\s|$)/.test(text) ? "whisper"
      : /^\/p(\s|$)/.test(text) ? "party"
      : /^\/c(\s|$)/.test(text) ? "clan"
      : null
    : null;

  // Effective color-mode for the input area
  let inputMode = null;
  if (whisperCmdTarget)        inputMode = "whisper";
  else if (pendingCmdMode)     inputMode = pendingCmdMode;
  else if (tab === "whisper")  inputMode = "whisper";

  // Whisper needs a name before it becomes a real whisper
  const showWhisperHint = pendingCmdMode === "whisper" && !whisperCmdTarget;

  return (
    <Wrapper>
      {!minimized && (
        <div style={{ display: "flex", alignItems: "center" }}>
        <Panel ref={panelRef} style={{ width: size.width + (membersExpanded ? MEMBERS_W : 0), height: size.height, transition: "width 0.2s ease" }}>
          <ResizeHandle onMouseDown={startResize} title="Drag to resize" />

          <PanelBody>

            {/* ── Left Nav ── */}
            <NavPanel>
              <div style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 800,
                color: THEME_TEXT,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                textShadow: THEME_TSHADOW,
                flexShrink: 0,
              }}>
                Chat
              </div>
              {GROUPS.map(group => (
                <NavGroup key={group}>
                  <NavGroupLabel>{group}</NavGroupLabel>
                  {TAB_DEFS.filter(t => t.group === group).map(item => {
                    const count = tabCount(item.id);
                    return (
                      <NavItem
                        key={item.id}
                        $active={tab === item.id}
                        $color={item.color}
                        $glowing={item.id === "whisper" && unreadWhisper}
                        onClick={() => handleTabChange(item.id)}
                      >
                        <NavIcon $color={item.color}><item.Icon /></NavIcon>
                        <NavLabel>{item.label}</NavLabel>
                        {count !== null && (
                          <NavCount>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                            </svg>
                            {count}
                          </NavCount>
                        )}
                      </NavItem>
                    );
                  })}
                </NavGroup>
              ))}
            </NavPanel>

            {/* ── Right Section ── */}
            <RightSection>

              {/* TopBar */}
              <TopBar>
                <TopBarTitle>{currentTabLabel}</TopBarTitle>
                <IconBtn
                  type="button"
                  $active={membersExpanded}
                  title={membersExpanded ? "Hide members" : "Show members"}
                  onClick={() => setMembersExpanded(v => !v)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {membersExpanded
                      ? <polyline points="15 18 9 12 15 6" />
                      : <polyline points="9 18 15 12 9 6" />}
                  </svg>
                </IconBtn>
                <div style={{ flex: 1 }} />
                <IconBtn type="button" title="Settings (coming soon)">
                  <IconSettings />
                </IconBtn>
              </TopBar>

              {/* Content row: messages + optional members panel */}
              <ContentRow>

                {/* Whisper conversation list — only visible on whisper tab */}
                {tab === "whisper" && (
                  <WhisperConvoPanel>
                    <WhisperConvoLabel>Chats</WhisperConvoLabel>
                    {whisperConvos.length === 0 && (
                      <span style={{ color: "rgba(242,238,255,0.25)", fontSize: 11, fontFamily: FONT, padding: "0 4px" }}>
                        No chats yet
                      </span>
                    )}
                    {whisperConvos.map(p => {
                      const isActive = whisperPartner?.id === p.id;
                      return (
                        <WhisperConvoItem
                          key={p.id}
                          type="button"
                          $active={isActive}
                          onClick={() => setWhisperPartner(prev => prev?.id === p.id ? null : p)}
                        >
                          <WhisperConvoFrame $active={isActive}>
                            <PlayerThumbnail playerName={p.name} size={34} />
                          </WhisperConvoFrame>
                          <WhisperConvoName $active={isActive}>{p.name}</WhisperConvoName>
                        </WhisperConvoItem>
                      );
                    })}
                  </WhisperConvoPanel>
                )}

                <MainArea>
                  <MessagesArea>
                    {activeMessages.length === 0 && (
                      <span style={{
                        color: "rgba(242,238,255,0.3)", fontStyle: "italic",
                        fontSize: 13, fontFamily: FONT, fontWeight: 600,
                      }}>
                        {tab === "general"      ? "No messages yet..."
                          : tab === "whisper"
                            ? whisperPartner
                              ? `No whispers with ${whisperPartner.name} yet...`
                              : "No whispers yet..."
                          : tab === "announcements" ? "No announcements..."
                          : "No messages yet..."}
                      </span>
                    )}
                    {activeMessages.map((msg, i) => {
                      const isSelf = msg.from?.id === myId;
                      const msgMode = tab === "whisper" ? "whisper"
                        : tab === "party" ? "party"
                        : tab === "clan"  ? "clan"
                        : "general";
                      const fc = msgMode === "whisper"
                        ? "rgba(232,121,249,0.55)"
                        : msgMode === "party"
                          ? "rgba(249,115,22,0.55)"
                          : msgMode === "clan"
                            ? "rgba(96,165,250,0.5)"
                            : isSelf ? "rgba(74,222,128,0.55)" : "rgba(147,197,253,0.45)";
                      const msgPlayer = msg.from ? {
                        id: msg.from.id,
                        userId: players.find(p => p.id === msg.from.id)?.userId ?? null,
                        name: msg.from.name,
                      } : null;
                      return (
                        <MsgRow key={msg.id || i}>
                          <PlayerFrame $s={38} $c={fc}>
                            <ClickableAvatar $active onClick={(e) => openPlayerMenu(msgPlayer, e)}>
                              <PlayerThumbnail playerName={msg.from?.name} size={38} />
                            </ClickableAvatar>
                          </PlayerFrame>
                          <MsgContent>
                            <MsgSender $self={isSelf} $mode={msgMode}>
                              <MsgSenderInner onClick={(e) => openPlayerMenu(msgPlayer, e)}>
                                {msg.from?.name || "???"}
                              </MsgSenderInner>
                            </MsgSender>
                            {msg.text?.startsWith("https://static.klipy.com")
                              ? <img src={msg.text} alt="GIF" style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, display: "block", marginTop: 3 }} onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })} />
                              : <MsgText $mode={msgMode}>{msg.text}</MsgText>
                            }
                          </MsgContent>
                        </MsgRow>
                      );
                    })}
                    {localErrors.map(err => (
                      <ErrorMsgRow key={err.id}>
                        ⚠ {err.message}
                      </ErrorMsgRow>
                    ))}
                    <div ref={messagesEndRef} />
                  </MessagesArea>

                  <InputSection>
                    {showEmojiPicker && (
                      <EmojiPickerWrap ref={emojiPickerRef}>
                        <EmojiPicker
                          theme="dark"
                          height={300}
                          previewConfig={{ showPreview: false }}
                          skinTonesDisabled
                          onEmojiClick={emojiData => {
                            setText(prev => prev + emojiData.emoji);
                            setShowEmojiPicker(false);
                            inputRef.current?.focus();
                          }}
                        />
                      </EmojiPickerWrap>
                    )}
                    {showGifPicker && (
                      <div ref={gifPickerRef}>
                        <GifPicker onSelect={gif => {
                          const url = gif.file.hd.gif.url;
                          if (tab === "whisper" && whisperPartner?.id) onWhisper(whisperPartner.id, url);
                          else onSend(url);
                          setShowGifPicker(false);
                        }} />
                      </div>
                    )}
                    <InputRow onSubmit={handleSubmit}>
                      <InputWrapper $mode={inputMode}>
                        {(whisperCmdTarget || (tab === "whisper" && whisperPartner)) && (
                          <WhisperLabel>
                            →&nbsp;{whisperCmdTarget?.name ?? whisperPartner?.name}
                            {whisperCmdTarget && (
                              <button
                                type="button"
                                onClick={() => { setWhisperCmdTarget(null); setText(""); inputRef.current?.focus(); }}
                                style={{
                                  background: "none", border: "none",
                                  color: "rgba(232,121,249,0.5)", cursor: "pointer",
                                  fontSize: 15, padding: "0 1px", lineHeight: 1, fontFamily: FONT,
                                }}
                              >×</button>
                            )}
                          </WhisperLabel>
                        )}
                        {showWhisperHint && (
                          <>
                            <WhisperPrefix>/w</WhisperPrefix>
                            <WhisperNameInput
                              ref={nameInputRef}
                              autoFocus
                              value={text.replace(/^\/w\s?/, "")}
                              placeholder="username"
                              onChange={e => setText("/w " + e.target.value)}
                              onKeyDown={e => {
                                e.stopPropagation();
                                if (e.key === " " || e.key === "Tab") {
                                  e.preventDefault();
                                  const nameVal = e.target.value.trim();
                                  if (nameVal) {
                                    const player = otherPlayers.find(
                                      p => (p.name || "").toLowerCase() === nameVal.toLowerCase()
                                    );
                                    // Commit the name regardless of online status;
                                    // handleSubmit will check again at send time.
                                    setWhisperCmdTarget(player ?? { name: nameVal });
                                    if (player && tab === "whisper") {
                                      setWhisperPartner({ id: player.id, name: player.name });
                                    }
                                  }
                                  setText("");
                                  requestAnimationFrame(() => inputRef.current?.focus());
                                }
                              }}
                              onKeyUp={e => e.stopPropagation()}
                              maxLength={50}
                            />
                            <div
                              style={{ flex: 1, display: "flex", alignItems: "center", cursor: "text", paddingLeft: 8 }}
                              onClick={() => {
                                const nameVal = text.replace(/^\/w\s?/, "").trim();
                                if (nameVal) {
                                  const player = otherPlayers.find(
                                    p => (p.name || "").toLowerCase() === nameVal.toLowerCase()
                                  );
                                  setWhisperCmdTarget(player ?? { name: nameVal });
                                  if (player && tab === "whisper") {
                                    setWhisperPartner({ id: player.id, name: player.name });
                                  }
                                  setText("");
                                  requestAnimationFrame(() => inputRef.current?.focus());
                                } else {
                                  nameInputRef.current?.focus();
                                }
                              }}
                            >
                              <span style={{ color: "rgba(242,238,255,0.18)", fontFamily: FONT, fontSize: 13.5, fontWeight: 600 }}>
                                message...
                              </span>
                            </div>
                          </>
                        )}
                        {!showWhisperHint && (
                          <InputField
                            ref={inputRef}
                            value={text}
                            onChange={handleTextChange}
                            onKeyDown={e => e.stopPropagation()}
                            onKeyUp={e => e.stopPropagation()}
                            placeholder={
                              whisperCmdTarget ? "Type your whisper..."
                                : tab === "whisper"
                                  ? whisperPartner ? "Type a message..."
                                                   : "Type a message..."
                                  : "Type a message..."
                            }
                            $mode={inputMode}
                            maxLength={200}
                          />
                        )}
                        <InlineIconBtn type="button" title="Emoji" onClick={() => { setShowEmojiPicker(v => !v); setShowGifPicker(false); }}>
                          😊
                        </InlineIconBtn>
                        <InlineIconBtn type="button" title="GIF" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "-0.5px" }} onClick={() => { setShowGifPicker(v => !v); setShowEmojiPicker(false); }}>
                          GIF
                        </InlineIconBtn>
                      </InputWrapper>
                      <SendBtn type="submit" $mode={inputMode} title="Send">
                        <IconSend />
                      </SendBtn>
                    </InputRow>

                    {tab === "general" && <QuickActions>
                      <QuickBtn type="button" onClick={() => { setText(""); setWhisperCmdTarget(null); inputRef.current?.focus(); }}>
                        General
                      </QuickBtn>
                      <QuickBtn type="button" onClick={() => insertCmd("/w ")}>
                        <CmdBadge $mode="whisper">/w</CmdBadge>
                        Whisper
                      </QuickBtn>
                      <QuickBtn type="button" onClick={() => insertCmd("/p ")}>
                        <CmdBadge $mode="party">/p</CmdBadge>
                        Party
                      </QuickBtn>
                      <QuickBtn type="button" onClick={() => insertCmd("/c ")}>
                        <CmdBadge $mode="clan">/c</CmdBadge>
                        Clan
                      </QuickBtn>
                    </QuickActions>}
                  </InputSection>
                </MainArea>

                {/* Members panel (expandable) */}
                <MembersPanel $expanded={membersExpanded}>
                  <div style={{
                    width: MEMBERS_W,
                    padding: "8px 6px",
                    boxSizing: "border-box",
                    opacity: membersExpanded ? 1 : 0,
                    transition: membersExpanded ? "opacity 0.15s ease 0.05s" : "none",
                    overflowY: "auto",
                    height: "100%",
                  }}>
                    <MembersTitle>
                      {tab === "whisper"
                        ? `Chats (${membersForTab.length})`
                        : `Online (${membersForTab.length})`}
                    </MembersTitle>
                    {membersForTab.length === 0 && (
                      <div style={{ color: "rgba(242,238,255,0.28)", fontSize: 11, fontFamily: FONT, padding: "0 4px" }}>
                        {tab === "whisper" ? "No whispers yet" : "No one here"}
                      </div>
                    )}
                    {membersForTab.map(p => {
                      const isActive = tab === "whisper" && whisperPartner?.id === p.id;
                      const memberPlayer = { id: p.id, userId: p.userId ?? null, name: p.name };
                      return (
                        <MemberCard
                          key={p.id ?? p.name}
                          type="button"
                          $active={isActive}
                          onClick={() => {
                            if (tab === "whisper") {
                              setWhisperPartner(prev => prev?.id === p.id ? null : p);
                            }
                          }}
                        >
                          <PlayerFrame $s={34} $c={avatarColor(p.name) + "88"}>
                            <ClickableAvatar $active onClick={(e) => openPlayerMenu(memberPlayer, e)}>
                              <PlayerThumbnail playerName={p.name} size={34} />
                            </ClickableAvatar>
                          </PlayerFrame>
                          <MemberName $clickable onClick={(e) => openPlayerMenu(memberPlayer, e)}>
                            {p.name}
                          </MemberName>
                        </MemberCard>
                      );
                    })}
                  </div>
                </MembersPanel>
              </ContentRow>
            </RightSection>
          </PanelBody>
        </Panel>
        </div>
      )}
      <BottomToggleBtn onClick={() => setMinimized(m => !m)} title={minimized ? "Open Chat" : "Minimise"}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </BottomToggleBtn>
      {playerMenu && createPortal(
        <PlayerContextMenu
          ref={playerMenuRef}
          playerMenu={playerMenu}
          onClose={() => setPlayerMenu(null)}
          onViewProfile={(data) => { onViewProfile?.(data); setPlayerMenu(null); }}
          onOpenWhisper={(p) => {
            setPlayerMenu(null);
            setTab("whisper");
            setWhisperPartner({ id: p.id, name: p.name });
          }}
        />,
        document.body
      )}
    </Wrapper>
  );
});

export default ChatBox;
