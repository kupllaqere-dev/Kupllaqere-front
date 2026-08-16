import { useState } from "react";
import supabase from "../../lib/supabase";
import { Overlay, ProfileOuter, GlobalCloseBtn } from "../PlayerProfile/styles";
import { PALETTES, paletteToVars } from "../PlayerProfile/themes";
import {
  SettingsShell,
  NavRail, NavTitle, NavItem,
  Content, ContentHeader, ContentTitle, ContentDesc, ContentBody,
  Card, FieldRow, FieldLabel, FieldHint, FieldValue, MembershipBadge,
  ActionBtn, InlineForm, InlineFormRow, Input, Message,
  PrivacyRow, PrivacyRowTitle, OptionsGroup, CheckOption, CheckBox,
  EmptyState, EmptyText,
} from "./styles";

const TABS = [
  { key: "account", label: "Account", title: "Account Settings", desc: "Your identity and sign-in details." },
  { key: "privacy", label: "Privacy", title: "Privacy Settings", desc: "Choose who can see each part of your profile." },
  { key: "game",    label: "Game",    title: "Game Settings",    desc: "Gameplay preferences." },
];

const VISIBILITY_OPTIONS = [
  { key: "everyone",     label: "Everyone"     },
  { key: "friends_only", label: "Friends Only" },
  { key: "no_one",       label: "No One"       },
];

const PRIVACY_ROWS = [
  { key: "profile", label: "Profile visibility" },
  { key: "friends", label: "Friends visibility" },
  { key: "gifts",   label: "Gifts visibility"   },
];

const PRIVACY_KEY = "fv_privacy";
const PRIVACY_DEFAULTS = { profile: "everyone", friends: "everyone", gifts: "everyone" };

/* No privacy columns on `profiles` yet, so choices live in localStorage.
   When the backend lands, swap these two for the API calls — the rest of
   the tab already speaks in { profile, friends, gifts } visibility keys. */
function loadPrivacy() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRIVACY_KEY) || "{}");
    return { ...PRIVACY_DEFAULTS, ...saved };
  } catch {
    return { ...PRIVACY_DEFAULTS };
  }
}
function savePrivacy(next) {
  try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

function currentPalette() {
  try {
    const saved = localStorage.getItem("fv_theme");
    const found = PALETTES.find(p => p.name === saved);
    if (found) return found;
  } catch { /* ignore */ }
  return PALETTES[0];
}

export default function SettingsPanel({
  onClose,
  playerName = "",
  email = "",
  isGuest = false,
  role = "player",
}) {
  const [activeTab, setActiveTab] = useState("account");
  const [privacy, setPrivacy] = useState(loadPrivacy);

  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { text, error }

  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null); // { text, error }

  const membership = isGuest ? "Guest" : role === "admin" ? "Admin" : "Standard";

  const setVisibility = (rowKey, value) => {
    setPrivacy(prev => {
      const next = { ...prev, [rowKey]: value };
      savePrivacy(next);
      return next;
    });
  };

  const handleResetPassword = async () => {
    if (resetBusy || !email) return;
    setResetBusy(true);
    setResetMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetMsg({ text: `Reset link sent to ${email}.`, error: false });
    } catch (err) {
      setResetMsg({ text: err.message || "Could not send the reset email.", error: true });
    } finally {
      setResetBusy(false);
    }
  };

  const handleChangeEmail = async () => {
    const value = newEmail.trim().toLowerCase();
    if (emailBusy) return;
    if (!value || !value.includes("@")) {
      setEmailMsg({ text: "Enter a valid email address.", error: true });
      return;
    }
    if (value === email.toLowerCase()) {
      setEmailMsg({ text: "That is already your email address.", error: true });
      return;
    }
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: value });
      if (error) throw error;
      setEmailMsg({ text: `Confirmation link sent to ${value}. The change applies once you confirm it.`, error: false });
      setNewEmail("");
    } catch (err) {
      setEmailMsg({ text: err.message || "Could not change the email address.", error: true });
    } finally {
      setEmailBusy(false);
    }
  };

  const tab = TABS.find(t => t.key === activeTab) || TABS[0];

  return (
    <Overlay onClick={onClose}>
      <ProfileOuter>
        <SettingsShell onClick={(e) => e.stopPropagation()} style={paletteToVars(currentPalette())}>
          <GlobalCloseBtn onClick={onClose}>&times;</GlobalCloseBtn>

          <NavRail>
            <NavTitle>Settings</NavTitle>
            {TABS.map(t => (
              <NavItem key={t.key} $active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </NavItem>
            ))}
          </NavRail>

          <Content>
            <ContentHeader>
              <ContentTitle>{tab.title}</ContentTitle>
              <ContentDesc>{tab.desc}</ContentDesc>
            </ContentHeader>

            <ContentBody>
              {activeTab === "account" && (
                <Card>
                  <FieldRow>
                    <div>
                      <FieldLabel>In-game name</FieldLabel>
                      <FieldHint>Your display name is permanent.</FieldHint>
                    </div>
                    <FieldValue>{playerName || "—"}</FieldValue>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <FieldLabel>Membership</FieldLabel>
                      <FieldHint>
                        {isGuest
                          ? "Guest accounts lose progress when the session ends."
                          : "Your current account tier."}
                      </FieldHint>
                    </div>
                    <MembershipBadge $tone={membership === "Admin" ? "gold" : "accent"}>
                      {membership}
                    </MembershipBadge>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <FieldHint>Used to sign in and to recover your account.</FieldHint>
                    </div>
                    <FieldValue>{isGuest ? "—" : (email || "—")}</FieldValue>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <FieldLabel>Password</FieldLabel>
                      <FieldHint>
                        {isGuest
                          ? "Not available on guest accounts."
                          : "We email you a link to set a new one."}
                      </FieldHint>
                      {resetMsg && <Message $error={resetMsg.error}>{resetMsg.text}</Message>}
                    </div>
                    <ActionBtn onClick={handleResetPassword} disabled={isGuest || !email || resetBusy}>
                      {resetBusy ? "Sending…" : "Reset Password"}
                    </ActionBtn>
                  </FieldRow>

                  <FieldRow>
                    <div>
                      <FieldLabel>Change email</FieldLabel>
                      <FieldHint>
                        {isGuest
                          ? "Not available on guest accounts."
                          : "The new address has to be confirmed before it takes effect."}
                      </FieldHint>
                    </div>
                    <ActionBtn
                      $primary={emailFormOpen}
                      onClick={() => {
                        setEmailFormOpen(v => !v);
                        setEmailMsg(null);
                      }}
                      disabled={isGuest}
                    >
                      {emailFormOpen ? "Cancel" : "Change Email"}
                    </ActionBtn>
                  </FieldRow>

                  {emailFormOpen && !isGuest && (
                    <InlineForm>
                      <InlineFormRow>
                        <Input
                          type="email"
                          value={newEmail}
                          placeholder="New email address"
                          onChange={(e) => setNewEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleChangeEmail(); }}
                        />
                        <ActionBtn $primary onClick={handleChangeEmail} disabled={emailBusy}>
                          {emailBusy ? "Sending…" : "Send Confirmation"}
                        </ActionBtn>
                      </InlineFormRow>
                      {emailMsg && <Message $error={emailMsg.error}>{emailMsg.text}</Message>}
                    </InlineForm>
                  )}
                </Card>
              )}

              {activeTab === "privacy" && (
                <Card>
                  {PRIVACY_ROWS.map(row => (
                    <PrivacyRow key={row.key}>
                      <PrivacyRowTitle>{row.label}</PrivacyRowTitle>
                      <OptionsGroup role="radiogroup" aria-label={row.label}>
                        {VISIBILITY_OPTIONS.map(opt => {
                          const active = privacy[row.key] === opt.key;
                          return (
                            <CheckOption
                              key={opt.key}
                              $active={active}
                              role="radio"
                              aria-checked={active}
                              onClick={() => setVisibility(row.key, opt.key)}
                            >
                              <CheckBox $active={active}>{active ? "✓" : ""}</CheckBox>
                              {opt.label}
                            </CheckOption>
                          );
                        })}
                      </OptionsGroup>
                    </PrivacyRow>
                  ))}
                </Card>
              )}

              {activeTab === "game" && (
                <EmptyState>
                  <EmptyText>No game settings yet.</EmptyText>
                </EmptyState>
              )}
            </ContentBody>
          </Content>
        </SettingsShell>
      </ProfileOuter>
    </Overlay>
  );
}
