import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/admin";
import styled from "styled-components";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Card>
        <Logo>Neclis<Purple>Admin</Purple></Logo>
        <Subtitle>Sign in to your admin account</Subtitle>
        <Form onSubmit={submit}>
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            autoFocus
          />
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <SubmitBtn type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </SubmitBtn>
        </Form>
      </Card>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #18181d;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  width: 380px;
  background: #1c1c22;
  border: 1px solid #ffffff12;
  border-radius: 16px;
  padding: 40px;
`;

const Logo = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
`;

const Purple = styled.span`
  color: #7b2ff7;
  margin-left: 6px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 28px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 10px;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid #ffffff18;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.15s;

  &::placeholder { color: #444; }
  &:focus { border-color: #7b2ff7; }
`;

const ErrorMsg = styled.div`
  font-size: 13px;
  color: #ff7777;
  margin-top: 6px;
`;

const SubmitBtn = styled.button`
  margin-top: 20px;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: #7b2ff7;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { opacity: 0.85; }
`;
