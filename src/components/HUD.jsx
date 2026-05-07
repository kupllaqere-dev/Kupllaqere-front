import * as S from "./HUDStyles";
import { useState, useCallback, useEffect } from "react";
import StoreModal from "./StoreModal";
import PlayerProfile from "./PlayerProfile";
import MailModal from "./MailModal";
import { fetchUnreadCount } from "../api/mail";

function HUD({ onLogout, equipped, onEquip, onUnequip, playerName, outfit, gender, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, socket, coins, gems, level, onPurchaseComplete }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(() => {
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!socket?.socket) return;
    const handler = () => setUnreadCount((c) => c + 1);
    socket.socket.on("mail:new", handler);
    return () => socket.socket.off("mail:new", handler);
  }, [socket]);

  function openMail() {
    setShowProfile(false);
    setShowMail(true);
  }

  return (
    <>
    {showProfile && (
      <PlayerProfile
        onClose={() => setShowProfile(false)}
        playerName={playerName}
        outfit={outfit}
        gender={gender}
        bio={bio}
        onSaveBio={onSaveBio}
        selectedBadge={selectedBadge}
        onSaveBadge={onSaveBadge}
        currentUserId={currentUserId}
        targetUserId={currentUserId}
        unreadMailCount={unreadCount}
        onUnreadChange={refreshUnread}
        onOpenMail={openMail}
        onOpenAppearance={() => { setShowProfile(false); }}
        onOpenAlbum={() => { setShowProfile(false); }}
        onOpenMarketplace={() => { setShowProfile(false); setShowStore(true); }}
        onEquip={onEquip}
        onUnequip={onUnequip}
        equipped={equipped}
        level={level}
      />
    )}
    {showMail && (
      <MailModal
        onClose={() => { setShowMail(false); refreshUnread(); }}
        onUnreadChange={refreshUnread}
      />
    )}
    {showStore && (
      <StoreModal
        onClose={() => setShowStore(false)}
        gender={gender}
        coins={coins ?? 0}
        gems={gems ?? 0}
        level={level ?? 1}
        currentOutfit={outfit}
        onPurchaseComplete={onPurchaseComplete}
      />
    )}
    <S.Container>
      <S.Bar>
        <div className="orb-wrapper">
          <img src="/Logo.png" className="orb-icon" />
        </div>

        <S.ButtonGroup>
          <S.BubbleWrapper>
            <S.Bubble onClick={() => setShowProfile(true)} title="Profile">
              <img src="/icons/profile.png" />
            </S.Bubble>
            {unreadCount > 0 && (
              <S.NotifBadge>{unreadCount > 99 ? "99+" : unreadCount}</S.NotifBadge>
            )}
          </S.BubbleWrapper>

          <S.Bubble onClick={() => setShowStore(true)} title="Store">
            <img src="/icons/shop.png" />
          </S.Bubble>

          <S.ProfileWrapper>
            <S.Bubble onClick={() => setSettingsOpen((prev) => !prev)}>
              <img src="/icons/settings.png" />
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
            <img src="/icons/Nectar.png" alt="coins" />
            <span>{(coins ?? 0).toLocaleString()}</span>
          </S.Currency>
          <S.Currency>
            <img src="/icons/Lis.png" alt="gems" />
            <span>{(gems ?? 0).toLocaleString()}</span>
          </S.Currency>
          <S.AngelButton>Become an Angel</S.AngelButton>
        </S.StatsGroup>
      </S.Bar>
    </S.Container>
    </>
  );
}

export default HUD;
