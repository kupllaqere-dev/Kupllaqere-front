import styled from "styled-components";
import { ProfileWrapper, thinScrollbar, glassShine } from "../PlayerProfile/styles";

/* Reuses the profile's shell verbatim so the two panels share one footprint
   (ProfileOuter sizes it) and one theme palette. Only the interior differs:
   the profile splits avatar-stage / content, this one nav-rail / content. */
export const SettingsShell = styled(ProfileWrapper)``;

/* ── Left nav rail ── */

export const NavRail = styled.div`
  flex-shrink: 0;
  width: 300px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 34px 18px 22px;
  background: ${"var(--pp-gradSidebar)"};
  border-right: 1px solid ${"var(--pp-border)"};
  border-radius: 40px 0 0 40px;
`;

export const NavTitle = styled.div`
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: ${"var(--pp-txt)"};
  padding: 0 12px 24px;
`;

export const NavItem = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 15px 16px;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-size: 21px;
  font-weight: ${p => (p.$active ? 800 : 600)};
  color: ${p => (p.$active ? "var(--pp-accent)" : "var(--pp-txt2)")};
  background: ${p => (p.$active ? "rgba(var(--pp-accent-rgb),0.14)" : "transparent")};
  border: 1px solid ${p => (p.$active ? "var(--pp-border2)" : "transparent")};
  transition: background 0.16s, color 0.16s, border-color 0.16s;
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover {
    background: rgba(var(--pp-accent-rgb),0.1);
    color: ${"var(--pp-accent)"};
  }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

/* ── Right content column ── */

export const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 30px 34px 26px;
  overflow: hidden;
  background: ${"var(--pp-gradPanel)"};
  border-radius: 0 40px 40px 0;
`;

export const ContentHeader = styled.div`
  flex-shrink: 0;
  padding-bottom: 20px;
  margin-bottom: 22px;
  border-bottom: 1px solid ${"var(--pp-border)"};
`;

export const ContentTitle = styled.div`
  font-size: 40px;
  font-weight: 800;
  color: ${"var(--pp-txt)"};
`;

export const ContentDesc = styled.div`
  margin-top: 9px;
  font-size: 21px;
  color: ${"var(--pp-txt3)"};
`;

export const ContentBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  ${thinScrollbar}
`;

/* ── Fields ── */

/* Deliberately transparent: the rows sit straight on the content column so the
   panel reads as two surfaces (rail + content), not three. */
export const Card = styled.div`
  max-width: 900px;
`;

export const FieldRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 0;
  & + & { border-top: 1px solid ${"var(--pp-border)"}; }
`;

export const FieldLabel = styled.div`
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: ${"var(--pp-txt3)"};
`;

export const FieldHint = styled.div`
  margin-top: 8px;
  font-size: 18px;
  color: ${"var(--pp-txt3)"};
  font-weight: 500;
`;

export const FieldValue = styled.div`
  font-size: 25px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
  text-align: right;
  overflow-wrap: anywhere;
`;

export const MembershipBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 21px;
  border-radius: 999px;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: ${p => p.$tone === "gold" ? "#8a5a00" : "var(--pp-accent)"};
  background: ${p => p.$tone === "gold" ? "rgba(234,179,8,0.16)" : "rgba(var(--pp-accent-rgb),0.12)"};
  border: 1px solid ${p => p.$tone === "gold" ? "rgba(234,179,8,0.4)" : "var(--pp-border2)"};
`;

/* ── Buttons ── */

export const ActionBtn = styled.button`
  flex-shrink: 0;
  min-width: 250px;
  height: 58px;
  padding: 0 28px;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 20px;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  transition: all 0.18s;
  background: ${p => (p.$primary ? "rgba(var(--pp-accent-rgb),0.14)" : "var(--pp-card)")};
  border: 1px solid ${p => (p.$primary ? "var(--pp-border2)" : "var(--pp-border)")};
  color: ${p => (p.$primary ? "var(--pp-accent)" : "var(--pp-txt2)")};
  &::before {
    content: '';
    position: absolute; top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }
  &:hover:not(:disabled) {
    background: rgba(var(--pp-accent-rgb),0.2);
    border-color: ${"var(--pp-border2)"};
    color: ${"var(--pp-accent)"};
  }
  &:hover:not(:disabled)::before { animation: ${glassShine} 0.52s ease-out forwards; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

export const InlineForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 0 0 20px;
`;

export const InlineFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  background: ${"var(--pp-surface)"};
  border: 1px solid ${"var(--pp-border2)"};
  border-radius: 14px;
  color: ${"var(--pp-txt)"};
  font-family: inherit;
  font-size: 21px;
  padding: 16px 20px;
  box-sizing: border-box;
  outline: none;
  caret-color: ${"var(--pp-accent)"};
  transition: border-color 0.18s, background 0.18s;
  &:focus { border-color: ${"var(--pp-border2)"}; background: ${"var(--pp-card)"}; }
  &::placeholder { color: ${"var(--pp-txt3)"}; }
`;

export const Message = styled.div`
  margin-top: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${p => (p.$error ? "#dc2626" : "#15803d")};
`;

/* ── Privacy ── */

export const PrivacyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 26px 0;
  & + & { border-top: 1px solid ${"var(--pp-border)"}; }
`;

export const PrivacyRowTitle = styled.div`
  font-size: 25px;
  font-weight: 700;
  color: ${"var(--pp-txt)"};
`;

export const OptionsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

export const CheckOption = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 20px;
  font-weight: ${p => (p.$active ? 700 : 600)};
  color: ${p => (p.$active ? "var(--pp-accent)" : "var(--pp-txt2)")};
  background: ${p => (p.$active ? "rgba(var(--pp-accent-rgb),0.1)" : "transparent")};
  border: 1px solid ${p => (p.$active ? "var(--pp-border2)" : "var(--pp-border)")};
  transition: all 0.16s;
  &:hover { background: rgba(var(--pp-accent-rgb),0.12); color: ${"var(--pp-accent)"}; }
`;

export const CheckBox = styled.span`
  width: 27px;
  height: 27px;
  flex-shrink: 0;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  background: ${p => (p.$active ? "var(--pp-accent)" : "var(--pp-surface)")};
  border: 1.5px solid ${p => (p.$active ? "var(--pp-accent)" : "var(--pp-border2)")};
  transition: background 0.16s, border-color 0.16s;
`;

/* ── Empty state ── */

export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  color: ${"var(--pp-txt3)"};
`;

export const EmptyText = styled.div`
  font-size: 25px;
  font-weight: 600;
`;
