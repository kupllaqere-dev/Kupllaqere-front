import { useState } from "react";
import styled from "styled-components";
import { loginWithEmail, register, loginAsGuest } from "../api/auth";
import supabase from "../lib/supabase";

// ── Styled Components ──

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, #1a1028 0%, #0c0c14 70%);
  overflow: hidden;
  position: relative;
`;

const Card = styled.div`
  width: 400px;
  max-width: 92vw;
  background: rgba(18, 18, 26, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;

  img {
    width: 80px;
    height: 80px;
    margin-bottom: 12px;
  }

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }

  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.4);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: rgba(170, 59, 255, 0.5);
  }
`;

const PrimaryBtn = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleBtn = styled.button`
  width: 100%;
  padding: 11px 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const GuestBtn = styled.button`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const BottomLink = styled.div`
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);

  button {
    background: none;
    border: none;
    color: #a855f7;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 0;
    margin-left: 4px;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMsg = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
`;

const SuccessMsg = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #86efac;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
`;

// ── Register Modal ──

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  width: 420px;
  max-width: 92vw;
  background: rgba(18, 18, 26, 0.96);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 36px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);

  h2 {
    margin: 0 0 24px;
    font-size: 22px;
    color: #fff;
    font-weight: 700;
    text-align: center;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 20px;
  cursor: pointer;

  &:hover {
    color: #fff;
  }
`;

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

// ── Component ──

export default function Login({ onLogin }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register form state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginWithEmail(email, password);
      onLogin(data.user, data.token, data.refreshToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError("");
    setLoading(true);
    try {
      const data = await loginAsGuest();
      onLogin(data.user, data.token, data.refreshToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) throw oauthError;
      // Browser redirects to Google — loading state stays until page unloads
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(regEmail, regPassword);
      if (!data.token) {
        // Email confirmation required — no session returned yet
        setRegSuccess(true);
        return;
      }
      onLogin(data.user, data.token, data.refreshToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Card>
        <Logo>
          <img src="/Logo.png" alt="logo" />
          <h1>FV Game</h1>
          <p>Enter the world</p>
        </Logo>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Form onSubmit={handleLogin}>
          <InputField
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PrimaryBtn type="submit" disabled={loading}>
            {loading ? "Loading..." : "Log In"}
          </PrimaryBtn>
        </Form>

        <Divider>or</Divider>

        <GoogleBtn type="button" onClick={handleGoogleLogin} disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </GoogleBtn>

        <GuestBtn
          type="button"
          onClick={handleGuest}
          disabled={loading}
          style={{ marginTop: 10 }}
        >
          Play as Guest
        </GuestBtn>

        <BottomLink>
          Don't have an account?
          <button type="button" onClick={() => { setShowRegister(true); setError(""); }}>
            Register
          </button>
        </BottomLink>
      </Card>

      {showRegister && (
        <Overlay onClick={() => { setShowRegister(false); setRegSuccess(false); }}>
          <Modal
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <CloseBtn onClick={() => { setShowRegister(false); setRegSuccess(false); }}>x</CloseBtn>
            <h2>Create Account</h2>

            {regSuccess ? (
              <SuccessMsg>
                Account created! Check your email to confirm, then log in.
              </SuccessMsg>
            ) : (
              <>
                {error && <ErrorMsg style={{ marginBottom: 16 }}>{error}</ErrorMsg>}

                <Form onSubmit={handleRegister}>
                  <InputField
                    type="email"
                    placeholder="Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                  <InputField
                    type="password"
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <PrimaryBtn type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Account"}
                  </PrimaryBtn>
                </Form>
              </>
            )}
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}
