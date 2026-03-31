import * as S from "./HUDStyles";
import { useState } from "react";

function HUD({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <S.Container>
      <S.Bar>
        {/* 🔴 ADD ORB HERE */}
        <div className="orb-wrapper">
          <div className="orb-pulse"></div>
          <img src="/gate.png" className="orb-icon" />
        </div>

        <S.ButtonGroup>
          <S.ProfileWrapper>
            <S.Bubble onClick={() => setIsOpen((prev) => !prev)}>
              <img src="/icons/avatar.png"></img>
            </S.Bubble>

            {isOpen && (
              <S.Dropdown>
                <S.Bubble>
                  <img src="/icons/profile.png"></img>
                </S.Bubble>
                <S.Bubble>
                  <img src="/icons/inventory.png"></img>
                </S.Bubble>
                <S.Bubble>
                  <img src="/icons/friends.png"></img>
                </S.Bubble>
              </S.Dropdown>
            )}
          </S.ProfileWrapper>

          <S.Bubble>
            <img src="/icons/shop.png"></img>
          </S.Bubble>
          <S.Bubble>
            <img src="/icons/search.png"></img>
          </S.Bubble>
          <S.ProfileWrapper>
            <S.Bubble onClick={() => setSettingsOpen((prev) => !prev)}>
              <img src="/icons/settings.png"></img>
            </S.Bubble>

            {settingsOpen && (
              <S.Dropdown>
                <S.LogoutButton onClick={onLogout}>Logout</S.LogoutButton>
              </S.Dropdown>
            )}
          </S.ProfileWrapper>
        </S.ButtonGroup>
      </S.Bar>
    </S.Container>
  );
}

export default HUD;
