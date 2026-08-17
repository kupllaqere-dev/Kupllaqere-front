import { useState } from "react";
import supabase from "../lib/supabase";
import {
  Logo, Title, Text, Form, InputField, PrimaryBtn, ErrorMsg, SuccessMsg, Hint,
} from "./styles";

/**
 * Shown once a recovery link has been redeemed — the user already has a
 * session at this point, so all that's left is to set the new password on it.
 */
export default function ResetPassword({ email, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err.message || "Could not update your password.");
      setSaving(false);
    }
  }

  return (
    <>
      <Logo>
        <img src="/Logo.png" alt="logo" />
      </Logo>
      <Title>Choose a new password</Title>
      <Text>{email ? `Setting a new password for ${email}.` : "Pick something you'll remember."}</Text>

      <Form onSubmit={handleSubmit}>
        <InputField
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <InputField
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Hint>At least 6 characters.</Hint>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        {done  && <SuccessMsg>Password updated. Taking you to the game…</SuccessMsg>}

        <PrimaryBtn type="submit" disabled={saving || done}>
          {saving ? "Saving..." : "Update Password"}
        </PrimaryBtn>
      </Form>
    </>
  );
}
