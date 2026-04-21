import { useState } from "react";
import styled from "styled-components";
import { setupCharacter } from "../api/auth";

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 30%, #1a1028 0%, #0c0c14 70%);
`;

const Card = styled.div`
  width: 440px;
  max-width: 92vw;
  background: rgba(18, 18, 26, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  text-align: center;
`;

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
`;

const Subtitle = styled.p`
  margin: 0 0 28px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
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
  margin-bottom: 20px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: rgba(170, 59, 255, 0.5);
  }
`;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-bottom: 12px;
`;

const GenderPicker = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
`;

const GenderOption = styled.button`
  width: 100px;
  height: 120px;
  border-radius: 12px;
  border: 2px solid
    ${(p) => (p.$active ? "#a855f7" : "rgba(255,255,255,0.08)")};
  background: ${(p) =>
    p.$active ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)"};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  color: ${(p) => (p.$active ? "#fff" : "rgba(255,255,255,0.5)")};
  font-size: 13px;
  font-weight: 600;

  &:hover {
    border-color: rgba(168, 85, 247, 0.4);
  }

  .avatar-preview {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
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

const ErrorMsg = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  margin-bottom: 16px;
`;

export default function CharacterSetup({ onComplete }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("female");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await setupCharacter(name, gender);
      onComplete(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Card>
        <Title>Create Your Character</Title>
        <Subtitle>Choose a name and avatar to get started</Subtitle>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <form onSubmit={handleSubmit}>
          <InputField
            type="text"
            placeholder="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
          />

          <Label>Choose your avatar</Label>
          <GenderPicker>
            <GenderOption
              type="button"
              $active={gender === "female"}
              onClick={() => setGender("female")}
            >
              <div className="avatar-preview">
                <img
                  src="/assets/character-bases/females.png"
                  alt="female"
                  style={{
                    width: 36,
                    height: 72,
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </div>
              Female
            </GenderOption>
            <GenderOption
              type="button"
              $active={gender === "male"}
              onClick={() => setGender("male")}
            >
              <div className="avatar-preview">
                <img
                  src="/assets/character-bases/men-test.png"
                  alt="male"
                  style={{
                    width: 36,
                    height: 72,
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </div>
              Male
            </GenderOption>
          </GenderPicker>

          <PrimaryBtn type="submit" disabled={loading || !name.trim()}>
            {loading ? "Saving..." : "Enter the World"}
          </PrimaryBtn>
        </form>
      </Card>
    </Page>
  );
}
