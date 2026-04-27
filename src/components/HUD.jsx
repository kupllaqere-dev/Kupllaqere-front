import * as S from "./HUDStyles";
import { useState, useRef, useEffect, useCallback } from "react";
import UploadItemModal from "./UploadItemModal";
import InventoryModal from "./InventoryModal";
import PlayerProfile from "./PlayerProfile";
import FriendsModal from "./FriendsModal";
import MailModal from "./MailModal";
import { lookupUser } from "../api/auth";
import { fetchUnreadCount } from "../api/mail";

function HUD({ onLogout, equipped, onEquip, onUnequip, playerName, outfit, gender, bio, onSaveBio, selectedBadge, onSaveBadge, currentUserId, socket }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
        onOpenMail={openMail}
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
        <div className="orb-wrapper">
          <div className="orb-pulse"></div>
          <img src="/gate.png" className="orb-icon" />
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

          <S.Bubble onClick={() => setShowFriends(true)}>
            <img src="/icons/friends.png" />
          </S.Bubble>

          <S.Bubble onClick={() => setShowUpload(true)} title="Upload Item">
            <img src="/icons/upload.png" />
          </S.Bubble>

          <S.Bubble>
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
