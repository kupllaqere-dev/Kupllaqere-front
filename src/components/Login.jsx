import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  loginWithEmail,
  register,
  loginAsGuest,
  loginWithGoogle,
} from "../api/auth";

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

// ── Component ──

export default function Login({ onLogin }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

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
      onLogin(data.user, data.token);
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
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const googleBtnRef = useRef(null);
  const googleInitRef = useRef(false);

  useEffect(() => {
    if (googleInitRef.current) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    function initGoogle() {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      googleInitRef.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setLoading(true);
          setError("");
          try {
            const data = await loginWithGoogle(response.credential);
            onLogin(data.user, data.token);
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        width: 328,
        text: "continue_with",
      });
    }

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [onLogin]);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(regEmail, regPassword);
      onLogin(data.user, data.token);
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
          <img src="/gate.png" alt="logo" />
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

        <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />

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
          <button type="button" onClick={() => setShowRegister(true)}>
            Register
          </button>
        </BottomLink>
      </Card>

      {showRegister && (
        <Overlay onClick={() => setShowRegister(false)}>
          <Modal
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative" }}
          >
            <CloseBtn onClick={() => setShowRegister(false)}>x</CloseBtn>
            <h2>Create Account</h2>

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
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}
