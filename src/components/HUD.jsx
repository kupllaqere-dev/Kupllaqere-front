import * as S from "./HUDStyles";
import { useState, useCallback, useEffect } from "react";
import StoreModal from "./StoreModal";
import PlayerProfile from "./PlayerProfile";
import MapsModal from "./MapsModal";
import AngelModal from "./AngelModal";
import PlayerThumbnail from "./PlayerThumbnail";
import { fetchUnreadCount } from "../api/mail";
import { lookupUser } from "../api/auth";

function HUD({ onLogout, equipped, onEquip, onUnequip, onApplyLookBatch, playerName, outfit, gender, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, socket, coins, gems, level, onPurchaseComplete }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showAngel, setShowAngel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

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

  async function handleOpenProfile(user) {
    let data = user;
    if (user?.name && !user?.gender) {
      try { data = await lookupUser(user.name) || user; } catch { /* use what we have */ }
    }
    setViewingProfile({
      userId: data?.id ?? data?.userId,
      name: data?.name ?? "",
      outfit: data?.outfit ?? {},
      gender: data?.gender ?? "girl",
      bio: data?.bio ?? "",
      selectedBadge: data?.selectedBadge ?? null,
      level: data?.level ?? 1,
    });
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
          onOpenAppearance={() => { setShowProfile(false); }}
          onOpenAlbum={() => { setShowProfile(false); }}
          onOpenMarketplace={() => { setShowProfile(false); setShowStore(true); }}
          onEquip={onEquip}
          onUnequip={onUnequip}
          onApplyLookBatch={onApplyLookBatch}
          equipped={equipped}
          level={level}
          onOpenProfile={handleOpenProfile}
        />
      )}
      {viewingProfile && (
        <PlayerProfile
          onClose={() => setViewingProfile(null)}
          playerName={viewingProfile.name}
          outfit={viewingProfile.outfit}
          gender={viewingProfile.gender}
          bio={viewingProfile.bio}
          selectedBadge={viewingProfile.selectedBadge}
          currentUserId={currentUserId}
          targetUserId={viewingProfile.userId}
          socket={socket}
          level={viewingProfile.level}
        />
      )}
      {showMaps && <MapsModal onClose={() => setShowMaps(false)} />}
      {showAngel && <AngelModal onClose={() => setShowAngel(false)} />}
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
        <S.LogoWrapper>
          <img src="/Logo.png" className="logo-img" />
        </S.LogoWrapper>

        <S.NavGroup>
          <S.NavBubbleWrapper>
            <S.NavButton onClick={() => setShowProfile(true)}>
              <img src="/assets/menus/about.png" />
              <span>Profile</span>
            </S.NavButton>
            {unreadCount > 0 && (
              <S.NotifBadge>{unreadCount > 99 ? "99+" : unreadCount}</S.NotifBadge>
            )}
          </S.NavBubbleWrapper>

          <S.NavButton onClick={() => setShowStore(true)}>
            <img src="/icons/shop.png" />
            <span>Store</span>
          </S.NavButton>

          <S.NavButton onClick={() => setShowMaps(true)}>
            <span className="nav-emoji">🗺</span>
            <span>Maps</span>
          </S.NavButton>

          <S.NavButton onClick={() => {}}>
            <span className="nav-emoji">📜</span>
            <span>Quests</span>
          </S.NavButton>
        </S.NavGroup>

        <S.PlayerBoxWrapper>
          <S.PlayerBox>
            <S.PlayerBoxTop>
              <S.AvatarFrame>
                <PlayerThumbnail playerName={playerName} gender={gender} outfit={outfit} size={52} />
              </S.AvatarFrame>
              <S.PlayerInfo>
                <S.PlayerName>{playerName || "Player"}</S.PlayerName>
                <S.LevelSection>
                  <S.PlayerLevel>Lv {level ?? 1}</S.PlayerLevel>
                  <S.LevelTrack>
                    <S.LevelFill style={{ width: "35%" }} />
                  </S.LevelTrack>
                </S.LevelSection>
              </S.PlayerInfo>
            </S.PlayerBoxTop>
            <S.CurrencyRow>
              <S.Currency>
                <img src="/icons/Nectar.png" alt="coins" />
                <span>{(coins ?? 0).toLocaleString()}</span>
              </S.Currency>
              <S.Currency>
                <img src="/icons/Lis.png" alt="gems" />
                <span>{(gems ?? 0).toLocaleString()}</span>
              </S.Currency>
            </S.CurrencyRow>
          </S.PlayerBox>
          <S.AngelStrip type="button" onClick={() => setShowAngel(true)}>✦ Become an Angel</S.AngelStrip>
        </S.PlayerBoxWrapper>

        <S.SettingsWrapper>
          {settingsOpen && (
            <S.Dropdown>
              <S.LogoutButton onClick={onLogout}>Logout</S.LogoutButton>
            </S.Dropdown>
          )}
          <S.BottomButtons>
            <S.SettingsBtn onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <span style={{ fontSize: "20px", color: "#fff" }}>{isFullscreen ? "⤡" : "⤢"}</span>
            </S.SettingsBtn>
            <S.SettingsBtn onClick={() => setSettingsOpen((prev) => !prev)}>
              <img src="/icons/settings.png" />
            </S.SettingsBtn>
          </S.BottomButtons>
        </S.SettingsWrapper>
      </S.Container>
    </>
  );
}

export default HUD;
