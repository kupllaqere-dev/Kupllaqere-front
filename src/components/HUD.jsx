import * as S from "./HUDStyles";
import { useState, useRef, useEffect, useCallback } from "react";
import UploadItemModal from "./UploadItemModal";
import InventoryModal from "./InventoryModal";
import StoreModal from "./StoreModal";
import PlayerProfile from "./PlayerProfile";
import FriendsModal from "./FriendsModal";
import MailModal from "./MailModal";
import { lookupUser } from "../api/auth";
import { fetchUnreadCount } from "../api/mail";
import { fetchFriends } from "../api/friends";

function HUD({ onLogout, equipped, onEquip, onUnequip, playerName, outfit, gender, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, socket, coins, gems, level, onPurchaseComplete }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchStatus, setSearchStatus] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const refreshUnread = useCallback(() => {
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
  }, []);

  const refreshFriendRequests = useCallback(() => {
    fetchFriends()
      .then(({ received }) => setPendingFriendCount(received?.length || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchUnreadCount()
      .then(({ count }) => setUnreadCount(count))
      .catch(() => {});
    fetchFriends()
      .then(({ received }) => setPendingFriendCount(received?.length || 0))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    if (!socket?.socket) return;
    const handler = () => setUnreadCount((c) => c + 1);
    socket.socket.on("mail:new", handler);
    return () => socket.socket.off("mail:new", handler);
  }, [socket]);

  useEffect(() => {
    if (!socket?.socket) return;
    socket.socket.on("friends:refresh", refreshFriendRequests);
    return () => socket.socket.off("friends:refresh", refreshFriendRequests);
  }, [socket, refreshFriendRequests]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (!searchWrapperRef.current?.contains(e.target)) setSearchOpen(false);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [searchOpen]);

  async function handleSearchSubmit() {
    const name = searchValue.trim();
    if (!name) return;
    setSearchStatus("searching");
    try {
      const found = await lookupUser(name);
      if (!found) { setSearchStatus("notfound"); return; }
      setSearchedUser(found);
      setSearchOpen(false);
      setSearchValue("");
      setSearchStatus(null);
    } catch (err) {
      setSearchStatus("error");
      console.error(err);
    }
  }

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
        onOpenFriends={() => { setShowProfile(false); setShowFriends(true); }}
        onOpenAlbum={() => { setShowProfile(false); }}
        onOpenMarketplace={() => { setShowProfile(false); setShowStore(true); }}
        onEquip={onEquip}
        onUnequip={onUnequip}
        equipped={equipped}
        level={level}
      />
    )}
    {searchedUser && (
      <PlayerProfile
        onClose={() => setSearchedUser(null)}
        playerName={searchedUser.name}
        outfit={searchedUser.outfit}
        gender={searchedUser.gender}
        bio={searchedUser.bio}
        selectedBadge={searchedUser.selectedBadge}
        currentUserId={currentUserId}
        targetUserId={searchedUser.id}
      />
    )}
    {showMail && (
      <MailModal
        onClose={() => { setShowMail(false); refreshUnread(); }}
        onUnreadChange={refreshUnread}
      />
    )}
    {showFriends && <FriendsModal onClose={() => { setShowFriends(false); refreshFriendRequests(); }} />}
    {showUpload && <UploadItemModal onClose={() => setShowUpload(false)} />}
    {showInventory && (
      <InventoryModal
        onClose={() => setShowInventory(false)}
        onEquip={onEquip}
        onUnequip={onUnequip}
        equipped={equipped}
        currentOutfit={outfit}
        gender={gender}
        level={level}
        coins={coins ?? 0}
        gems={gems ?? 0}
        onSellComplete={onPurchaseComplete}
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

          <S.Bubble onClick={() => setShowInventory(true)}>
            <img src="/icons/inventory.png" />
          </S.Bubble>

          <S.BubbleWrapper>
            <S.Bubble onClick={() => setShowFriends(true)}>
              <img src="/icons/friends.png" />
            </S.Bubble>
            {pendingFriendCount > 0 && (
              <S.NotifBadge>{pendingFriendCount > 99 ? "99+" : pendingFriendCount}</S.NotifBadge>
            )}
          </S.BubbleWrapper>

          <S.Bubble onClick={() => setShowUpload(true)} title="Upload Item">
            <img src="/icons/upload.png" />
          </S.Bubble>

          <S.Bubble onClick={() => setShowStore(true)} title="Store">
            <img src="/icons/shop.png" />
          </S.Bubble>

          <S.ProfileWrapper ref={searchWrapperRef}>
            <S.Bubble onClick={() => setSearchOpen((p) => !p)} title="Search Player">
              <img src="/icons/search.png" />
            </S.Bubble>
            {searchOpen && (
              <S.SearchPopover>
                <S.SearchInput
                  ref={searchInputRef}
                  placeholder="Player username…"
                  value={searchValue}
                  onChange={(e) => { setSearchValue(e.target.value); setSearchStatus(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  disabled={searchStatus === "searching"}
                />
                <S.SearchHint $error={searchStatus === "notfound" || searchStatus === "error"}>
                  {searchStatus === "searching" && "Searching…"}
                  {searchStatus === "notfound" && "No player with that name."}
                  {searchStatus === "error" && "Search failed. Try again."}
                  {!searchStatus && "Press Enter to search."}
                </S.SearchHint>
              </S.SearchPopover>
            )}
          </S.ProfileWrapper>

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
