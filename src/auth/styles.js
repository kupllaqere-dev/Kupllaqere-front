import styled from "styled-components";

// Same visual language as the login screen — these pages sit either side of it.

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, #1a1028 0%, #0c0c14 70%);
  overflow: hidden;
  position: relative;
`;

export const Card = styled.div`
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
  text-align: center;
`;

export const Logo = styled.div`
  margin-bottom: 24px;

  img {
    width: 64px;
    height: 64px;
  }
`;

export const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
`;

export const Text = styled.p`
  margin: 0 0 22px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.45);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
`;

export const InputField = styled.input`
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

export const PrimaryBtn = styled.button`
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

export const GhostBtn = styled.button`
  background: none;
  border: none;
  color: #a855f7;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
  margin-top: 20px;

  &:hover {
    text-decoration: underline;
  }
`;

export const ErrorMsg = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
`;

export const SuccessMsg = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #86efac;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
`;

export const Hint = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
`;

export const Spinner = styled.div`
  width: 30px;
  height: 30px;
  margin: 4px auto 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: auth-spin 700ms linear infinite;

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }
`;
