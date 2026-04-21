import * as S from "./HUDStyles";
import { useState } from "react";
import UploadItemModal from "./UploadItemModal";
import InventoryModal from "./InventoryModal";
import PlayerProfile from "./PlayerProfile";
import FriendsModal from "./FriendsModal";

function HUD({ onLogout, equipped, onEquip, onUnequip, playerName, outfit, gender }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  return (
    <>
    {showProfile && (
      <PlayerProfile
        onClose={() => setShowProfile(false)}
        playerName={playerName}
        outfit={outfit}
        gender={gender}
      />
    )}
    {showFriends && <FriendsModal onClose={() => setShowFriends(false)} />}
    {showUpload && <UploadItemModal onClose={() => setShowUpload(false)} />}
    {showInventory && (
      <InventoryModal
        onClose={() => setShowInventory(false)}
        onEquip={onEquip}
        onUnequip={onUnequip}
        equipped={equipped}
      />
    )}
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
                <S.Bubble onClick={() => { setShowProfile(true); setIsOpen(false); }}>
                  <img src="/icons/profile.png"></img>
                </S.Bubble>
                <S.Bubble onClick={() => { setShowInventory(true); setIsOpen(false); }}>
                  <img src="/icons/inventory.png"></img>
                </S.Bubble>
                <S.Bubble onClick={() => { setShowFriends(true); setIsOpen(false); }}>
                  <img src="/icons/friends.png"></img>
                </S.Bubble>
              </S.Dropdown>
            )}
          </S.ProfileWrapper>

          <S.Bubble onClick={() => setShowUpload(true)} title="Upload Item">
            <img src="/icons/upload.png"></img>
          </S.Bubble>
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

        <S.Spacer />

        <S.StatsGroup>
          <S.LevelBar>
            <S.LevelLabel>Lv 1</S.LevelLabel>
            <S.LevelTrack>
              <S.LevelFill style={{ width: "35%" }} />
            </S.LevelTrack>
          </S.LevelBar>

          <S.Currency>
            <img src="/icons/coin.png" alt="coins" />
            <span>1,250</span>
          </S.Currency>

          <S.Currency>
            <img src="/icons/gem.png" alt="gems" />
            <span>30</span>
          </S.Currency>

          <S.AngelButton>Become an Angel</S.AngelButton>
        </S.StatsGroup>
      </S.Bar>
    </S.Container>
    </>
  );
}

export default HUD;
