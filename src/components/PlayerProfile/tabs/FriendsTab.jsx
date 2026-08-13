import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { lookupUser } from "../../../api/auth";
import PlayerThumbnail from "../../PlayerThumbnail";
import PlayerContextMenu from "../../PlayerContextMenu";
import {
  HubPanelContainer, SkeletonCircle, SkeletonLine, PanelEmpty,
} from "../styles";
import {
  FriendsPanelInner, FriendsHeaderRow, SoulmateRow, SoulmateTag,
  SortWrap, SortBtn, SortLabelMuted, SortMenu, SortItem,
  FriendsListScroll, FriendsGroupLabel,
  FriendCard, FriendCardTop, FriendAvatarWrap, FriendAvatarCircle, FriendStatusDot,
  FriendCardInfo, FriendCardName, FriendMetaRow, FriendMetaItem, FriendMetaDot,
  FriendMetaSep, FriendCardDivider, FriendCardActions, FriendActionBtn,
  FriendAcceptBtn, FriendDeclineBtn,
  FriendsBottom, FriendsFooter, FooterBtn, FooterBtnBadge,
  AddFriendPanel, AddFriendTitle, AddFriendRow, AddFriendInput, AddFriendHint,
  SmPrimaryBtn,
} from "./FriendsTab.styles";

const SORT_OPTIONS = [
  { key: "online", label: "Online" },
  { key: "alpha",  label: "Alphabetical" },
];

/* ──────────────────────────────────────────────────────────────────────────
   TEMPORARY layout placeholders. Appended to the real lists in dev builds so
   the grid, dividers and scrolling can be eyeballed on an empty account.
   Delete this block plus the two `...PLACEHOLDER_*` spreads below to remove.
   ────────────────────────────────────────────────────────────────────────── */
const SHOW_PLACEHOLDERS = import.meta.env.DEV;

const PLACEHOLDER_FRIENDS = [
  ["Lunaria",  82, "online",  "female", "Neclis Plaza"],
  ["Hikari",   75, "online",  "female", "Celestial Garden"],
  ["Cloudy",   69, "online",  "female", "Neclis Plaza"],
  ["Momo",     63, "online",  "female", "Dreaming Shore"],
  ["Stella",   58, "online",  "female", "Neclis Plaza"],
  ["Raven",    55, "online",  "male",   "Eternal Heights"],
  ["Miyu",     54, "away",    "female", "Neclis Plaza"],
  ["Kai",      51, "away",    "male",   "Dreaming Shore"],
  ["Yuna",     47, "online",  "female", "Celestial Garden"],
  ["Sakura",   44, "away",    "female", "Moonlit Market"],
  ["Noctis",   41, "offline", "male",   ""],
  ["Aria",     38, "offline", "female", ""],
  ["Rin",      36, "offline", "female", ""],
  ["Kazu",     33, "offline", "male",   ""],
  ["Vespera",  29, "offline", "female", ""],
  ["Tsuki",    25, "offline", "female", ""],
  ["Orion",    22, "offline", "male",   ""],
  ["Nami",     18, "offline", "female", ""],
  ["Elias",    12, "offline", "male",   ""],
  ["Poppy",     6, "offline", "female", ""],
].map(([name, level, status, gender, location]) => ({
  id: `mock-${name}`, name, level, status, gender, location, mock: true,
}));

const PLACEHOLDER_SOULMATES = [
  ["Aurelia", 77, "online",  "female"],
  ["Nyx",     64, "away",    "male"],
  ["Lilium",  52, "offline", "female"],
].map(([name, level, status, gender]) => ({
  id: `mock-soul-${name}`, name, level, status, gender, mock: true,
}));

const PLACEHOLDER_REQUESTS = [
  ["Seraphine", 61, "female"],
  ["Dante",     40, "male"],
  ["Wisteria",  27, "female"],
].map(([name, level, gender]) => ({
  id: `mock-req-${name}`, name, level, gender, mock: true,
}));

function IconChevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 8 3c0 5.5-8 10.4-8 10.4z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconAddFriend() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}

function IconRequests() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export default function FriendsTab({
  friendsTab, setFriendsTab, friendsData, friendsLoading,
  friendsSearch, setFriendsSearch, onRefresh, acceptFriend, declineFriend,
  socket, onOpenProfile, onMessage,
}) {
  const [friendBusy, setFriendBusy] = useState(null);
  const [onlineMap, setOnlineMap] = useState(() => new Map());
  const [playerMenu, setPlayerMenu] = useState(null);
  const [sortBy, setSortBy] = useState("online");
  const [sortOpen, setSortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const playerMenuRef = useRef(null);
  const sortRef = useRef(null);
  const addInputRef = useRef(null);

  const showRequests = friendsTab === "requests";

  useEffect(() => {
    if (!playerMenu) return;
    function onDown(e) {
      if (!playerMenuRef.current?.contains(e.target)) setPlayerMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [playerMenu]);

  useEffect(() => {
    if (!sortOpen) return;
    function onDown(e) {
      if (!sortRef.current?.contains(e.target)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [sortOpen]);

  useEffect(() => {
    if (addOpen) addInputRef.current?.focus();
  }, [addOpen]);

  useEffect(() => {
    if (showRequests) setSortOpen(false);
  }, [showRequests]);

  function openPlayerMenu(player, e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerMenu({ ...player, x: rect.right, y: rect.top });
  }

  const friends = [...(friendsData?.friends || []), ...(SHOW_PLACEHOLDERS ? PLACEHOLDER_FRIENDS : [])];
  const received = [...(friendsData?.received || []), ...(SHOW_PLACEHOLDERS ? PLACEHOLDER_REQUESTS : [])];
  const soulmates = SHOW_PLACEHOLDERS ? PLACEHOLDER_SOULMATES : [];

  useEffect(() => {
    if (!socket?.socket) return;
    const handleList = (list) => {
      setOnlineMap((prev) => {
        const next = new Map(prev);
        for (const f of list || []) next.set(String(f.id), f.status || (f.online ? "online" : "offline"));
        return next;
      });
    };
    const handleOnline = (f) => {
      if (!f?.id) return;
      setOnlineMap((prev) => new Map(prev).set(String(f.id), f.status || "online"));
    };
    const handleOffline = ({ id } = {}) => {
      if (!id) return;
      setOnlineMap((prev) => new Map(prev).set(String(id), "offline"));
    };
    const handleStatus = ({ userId, status } = {}) => {
      if (!userId || !status) return;
      setOnlineMap((prev) => new Map(prev).set(String(userId), status));
    };
    socket.socket.on("friends:online", handleList);
    socket.socket.on("friend:online", handleOnline);
    socket.socket.on("friend:offline", handleOffline);
    socket.socket.on("friend:status", handleStatus);
    return () => {
      socket.socket.off("friends:online", handleList);
      socket.socket.off("friend:online", handleOnline);
      socket.socket.off("friend:offline", handleOffline);
      socket.socket.off("friend:status", handleStatus);
    };
  }, [socket]);

  const getFriendStatus = (f) => onlineMap.get(String(f.id)) || f.status || (f.online ? "online" : "offline");
  const isOnline = (f) => { const s = getFriendStatus(f); return s === "online" || s === "away"; };

  const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
  const alphaFriends = [...friends].sort(byName);
  const onlineFriends = alphaFriends.filter(isOnline);
  const offlineFriends = alphaFriends.filter((f) => !isOnline(f));

  // Flat render list: group labels + cards, so both sort modes share one grid.
  const groups = sortBy === "online"
    ? [
        { key: "online",  label: `Online — ${onlineFriends.length}`,   items: onlineFriends },
        { key: "offline", label: `Offline — ${offlineFriends.length}`, items: offlineFriends },
      ].filter((g) => g.items.length > 0)
    : [{ key: "all", label: `All Friends — ${alphaFriends.length}`, items: alphaFriends }];

  const runAction = async (fn, id) => {
    if (friendBusy) return;
    setFriendBusy(id);
    try { await fn(); await onRefresh(); }
    catch (err) { console.error(err); }
    finally { setFriendBusy(null); }
  };

  const handleAddLookup = async () => {
    const name = friendsSearch.trim();
    if (!name) return;
    setLookupStatus("searching");
    try {
      const user = await lookupUser(name);
      if (!user) { setLookupStatus("notfound"); return; }
      setLookupStatus(null);
      setAddOpen(false);
      setFriendsSearch("");
      onOpenProfile?.(user);
    } catch {
      setLookupStatus("error");
    }
  };

  const renderCard = (f, { request = false, soulmate = false } = {}) => {
    const status = request ? null : getFriendStatus(f);
    const menuData = { id: f.id, userId: f.id, name: f.name };
    // Placeholder rows are inert: no lookups, no requests to the API.
    const act = (fn) => (f.mock ? undefined : fn);
    return (
      <FriendCard key={f.id} $soulmate={soulmate} $dim={!request && !soulmate && status === "offline"}>
        <FriendCardTop>
          <FriendAvatarWrap onClick={act((e) => openPlayerMenu(menuData, e))} title={f.name}>
            <FriendAvatarCircle>
              <PlayerThumbnail playerName={f.name} size={46} gender={f.mock ? f.gender : undefined} />
            </FriendAvatarCircle>
            {!request && <FriendStatusDot $status={status} />}
          </FriendAvatarWrap>
          <FriendCardInfo>
            <FriendCardName onClick={act(() => onOpenProfile?.({ id: f.id, userId: f.id, name: f.name }))}>
              {f.name}
            </FriendCardName>
            <FriendMetaRow>
              {!request && <FriendMetaDot $status={status} />}
              <FriendMetaItem>Lv. {f.level ?? 1}</FriendMetaItem>
              {soulmate ? (
                <>
                  <FriendMetaSep />
                  <SoulmateTag><IconHeart />Soulmate</SoulmateTag>
                </>
              ) : request ? (
                <>
                  <FriendMetaSep />
                  <FriendMetaItem>Wants to be friends</FriendMetaItem>
                </>
              ) : f.location ? (
                <>
                  <FriendMetaSep />
                  <FriendMetaItem title={f.location}><IconPin />{f.location}</FriendMetaItem>
                </>
              ) : null}
            </FriendMetaRow>
          </FriendCardInfo>
        </FriendCardTop>

        <FriendCardDivider />

        <FriendCardActions>
          {request ? (
            <>
              <FriendAcceptBtn
                disabled={!!friendBusy}
                onClick={act(() => runAction(() => acceptFriend(f.id), f.id))}
              >
                Accept
              </FriendAcceptBtn>
              <FriendDeclineBtn
                disabled={!!friendBusy}
                onClick={act(() => runAction(() => declineFriend(f.id), f.id))}
              >
                Decline
              </FriendDeclineBtn>
            </>
          ) : (
            <>
              <FriendActionBtn title={`Message ${f.name}`} onClick={act(() => onMessage?.({ id: f.id, name: f.name }))}>
                <IconMessage /> Message
              </FriendActionBtn>
              <FriendActionBtn title="Options" onClick={act((e) => openPlayerMenu(menuData, e))}>
                <IconSettings /> Options
              </FriendActionBtn>
            </>
          )}
        </FriendCardActions>
      </FriendCard>
    );
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label;

  return (
    <HubPanelContainer>
      <FriendsPanelInner>
        {/* Stays put across both views so switching lists doesn't shift the panel. */}
        {soulmates.length > 0 && (
          <SoulmateRow>
            {soulmates.map((f) => renderCard(f, { soulmate: true }))}
          </SoulmateRow>
        )}

        <FriendsHeaderRow>
          <SortWrap ref={sortRef} $hidden={showRequests} aria-hidden={showRequests}>
            <SortBtn
              $open={sortOpen}
              tabIndex={showRequests ? -1 : 0}
              onClick={() => setSortOpen((v) => !v)}
            >
              <SortLabelMuted>Sort by:</SortLabelMuted>
              {sortLabel}
              <IconChevron />
            </SortBtn>
            {sortOpen && (
              <SortMenu>
                {SORT_OPTIONS.map((o) => (
                  <SortItem
                    key={o.key}
                    $active={sortBy === o.key}
                    onClick={() => { setSortBy(o.key); setSortOpen(false); }}
                  >
                    {o.label}
                  </SortItem>
                ))}
              </SortMenu>
            )}
          </SortWrap>
        </FriendsHeaderRow>

        <FriendsListScroll>
          {friendsLoading ? (
            [0,1,2,3,4,5,6,7,8].map((i) => (
              <FriendCard key={i} style={{ pointerEvents: "none" }}>
                <FriendCardTop>
                  <SkeletonCircle $size="46px" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                    <SkeletonLine $w="65%" $h="11px" />
                    <SkeletonLine $w="45%" $h="9px" />
                  </div>
                </FriendCardTop>
                <FriendCardDivider />
                <SkeletonLine $w="100%" $h="26px" />
              </FriendCard>
            ))
          ) : showRequests ? (
            received.length === 0 ? (
              <PanelEmpty style={{ gridColumn: "1 / -1" }}>No pending friend requests.</PanelEmpty>
            ) : (
              <>
                <FriendsGroupLabel>Pending — {received.length}</FriendsGroupLabel>
                {received.map((f) => renderCard(f, { request: true }))}
              </>
            )
          ) : friends.length === 0 ? (
            <PanelEmpty style={{ gridColumn: "1 / -1" }}>You have no friends yet.</PanelEmpty>
          ) : (
            groups.map((g) => (
              <div key={g.key} style={{ display: "contents" }}>
                <FriendsGroupLabel>{g.label}</FriendsGroupLabel>
                {g.items.map((f) => renderCard(f))}
              </div>
            ))
          )}
        </FriendsListScroll>

        <FriendsBottom>
          {addOpen && (
            <AddFriendPanel>
              <AddFriendTitle>Add Friend</AddFriendTitle>
              <AddFriendRow>
                <AddFriendInput
                  ref={addInputRef}
                  value={friendsSearch}
                  onChange={(e) => { setFriendsSearch(e.target.value); setLookupStatus(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddLookup();
                    if (e.key === "Escape") { setAddOpen(false); setLookupStatus(null); }
                  }}
                  placeholder="Player username…"
                />
                <SmPrimaryBtn
                  onClick={handleAddLookup}
                  disabled={!friendsSearch.trim() || lookupStatus === "searching"}
                >
                  {lookupStatus === "searching" ? "…" : "Find"}
                </SmPrimaryBtn>
              </AddFriendRow>
              {lookupStatus === "notfound" && <AddFriendHint $error>No player with that name.</AddFriendHint>}
              {lookupStatus === "error" && <AddFriendHint $error>Lookup failed. Try again.</AddFriendHint>}
              {!lookupStatus && <AddFriendHint>Opens their profile — send the request from there.</AddFriendHint>}
            </AddFriendPanel>
          )}

          <FriendsFooter>
            <FooterBtn
              $active={addOpen}
              onClick={() => { setAddOpen((v) => !v); setLookupStatus(null); }}
            >
              <IconAddFriend /> Add Friend
            </FooterBtn>
            <FooterBtn
              $active={showRequests}
              onClick={() => setFriendsTab(showRequests ? "friends" : "requests")}
            >
              <IconRequests />
              {showRequests ? "Back to Friends" : "Friend Requests"}
              {received.length > 0 && <FooterBtnBadge>{received.length}</FooterBtnBadge>}
            </FooterBtn>
          </FriendsFooter>
        </FriendsBottom>
      </FriendsPanelInner>

      {playerMenu && createPortal(
        <PlayerContextMenu
          ref={playerMenuRef}
          playerMenu={playerMenu}
          onClose={() => setPlayerMenu(null)}
          onViewProfile={(data) => { onOpenProfile?.(data); setPlayerMenu(null); }}
        />,
        document.body
      )}
    </HubPanelContainer>
  );
}
