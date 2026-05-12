import { useState, useEffect } from "react";
import { lookupUser } from "../../../api/auth";
import PlayerThumbnail from "../../PlayerThumbnail";
import {
  HubPanelContainer, FriendsPanelInner, FriendsSearchRow, FriendsSearchInput,
  FriendsSearchIcon, FriendsSearchHint, PanelTabs, PanelTab, TabCountBadge,
  TabUnreadBadge, FriendsListScroll, FriendCardTile, SkeletonCircle, SkeletonLine,
  PanelEmpty, FriendsGroupLabel, MailThumbWrap, MailThreadThumb, MailStatusDot,
  FriendCardRow, FriendCardAvatarWrap, FriendCardInfo, FriendCardName,
  FriendCardLocation, FriendInviteActions, SmPrimaryBtn, SmSecBtn,
} from "../styles";

export default function FriendsTab({
  friendsTab, setFriendsTab, friendsData, friendsLoading,
  friendsSearch, setFriendsSearch, onRefresh, acceptFriend, declineFriend,
  socket, onOpenProfile,
}) {
  const [friendBusy, setFriendBusy] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [onlineMap, setOnlineMap] = useState(() => new Map());

  const friends = friendsData?.friends || [];
  const received = friendsData?.received || [];

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

  const getFriendStatus = (f) => onlineMap.get(String(f.id)) || (f.online ? "online" : "offline");
  const isOnline = (f) => { const s = getFriendStatus(f); return s === "online" || s === "away"; };

  const handleSearchKey = (e) => { if (e.key === "Enter") handleSearch(); };
  const handleSearch = async () => {
    const name = friendsSearch.trim();
    if (!name) return;
    setSearchStatus("searching");
    try {
      const user = await lookupUser(name);
      if (!user) { setSearchStatus("notfound"); return; }
      setSearchStatus(null);
      onOpenProfile?.(user);
    } catch {
      setSearchStatus("error");
    }
  };

  const handleFriendClick = (f) => {
    onOpenProfile?.({ id: f.id, name: f.name });
  };

  const sorted = [...friends].sort((a, b) => {
    const ao = isOnline(a), bo = isOnline(b);
    if (ao && !bo) return -1;
    if (!ao && bo) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const onlineFriends = sorted.filter((f) => isOnline(f));
  const offlineFriends = sorted.filter((f) => !isOnline(f));

  const runAction = async (fn, id) => {
    if (friendBusy) return;
    setFriendBusy(id);
    try { await fn(); await onRefresh(); }
    catch (err) { console.error(err); }
    finally { setFriendBusy(null); }
  };

  return (
    <HubPanelContainer>
      <FriendsPanelInner>
        <FriendsSearchRow>
          <FriendsSearchInput
            type="text"
            value={friendsSearch}
            onChange={(e) => { setFriendsSearch(e.target.value); setSearchStatus(null); }}
            onKeyDown={handleSearchKey}
            placeholder="Search all players… (Enter)"
          />
          <FriendsSearchIcon onClick={handleSearch} style={{ cursor: "pointer", pointerEvents: "auto" }}>⌕</FriendsSearchIcon>
        </FriendsSearchRow>
        {searchStatus === "searching" && <FriendsSearchHint>Searching…</FriendsSearchHint>}
        {searchStatus === "notfound" && <FriendsSearchHint $error>No player found.</FriendsSearchHint>}
        {searchStatus === "error" && <FriendsSearchHint $error>Search failed.</FriendsSearchHint>}

        <PanelTabs>
          <PanelTab $active={friendsTab === "friends"} onClick={() => setFriendsTab("friends")}>
            Friends <TabCountBadge>{friends.length}</TabCountBadge>
          </PanelTab>
          <PanelTab $active={friendsTab === "invites"} onClick={() => setFriendsTab("invites")}>
            Invites {received.length > 0 && <TabUnreadBadge>{received.length}</TabUnreadBadge>}
          </PanelTab>
        </PanelTabs>

        <FriendsListScroll>
          {friendsLoading ? (
            [0,1,2,3,4,5].map(i => (
              <FriendCardTile key={i} style={{ pointerEvents: "none" }}>
                <SkeletonCircle $size="38px" />
                <SkeletonLine $w="60%" $h="10px" />
              </FriendCardTile>
            ))
          ) : friendsTab === "friends" ? (
            friends.length === 0 ? (
              <PanelEmpty style={{ gridColumn: "1 / -1" }}>You have no friends yet.</PanelEmpty>
            ) : (
              <>
                {onlineFriends.length > 0 && (
                  <>
                    <FriendsGroupLabel>Online — {onlineFriends.length}</FriendsGroupLabel>
                    {onlineFriends.map((f) => (
                      <FriendCardTile key={f.id} onClick={() => handleFriendClick(f)}>
                        <MailThumbWrap>
                          <MailThreadThumb>
                            <PlayerThumbnail playerName={f.name} size={38} />
                          </MailThreadThumb>
                          <MailStatusDot $status={getFriendStatus(f)} />
                        </MailThumbWrap>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#2e1065", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{f.name}</p>
                      </FriendCardTile>
                    ))}
                  </>
                )}
                {offlineFriends.length > 0 && (
                  <>
                    <FriendsGroupLabel>Offline — {offlineFriends.length}</FriendsGroupLabel>
                    {offlineFriends.map((f) => (
                      <FriendCardTile key={f.id} onClick={() => handleFriendClick(f)} $offline>
                        <MailThumbWrap>
                          <MailThreadThumb>
                            <PlayerThumbnail playerName={f.name} size={38} />
                          </MailThreadThumb>
                          <MailStatusDot $status={getFriendStatus(f)} />
                        </MailThumbWrap>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#2e1065", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{f.name}</p>
                      </FriendCardTile>
                    ))}
                  </>
                )}
              </>
            )
          ) : (
            received.length === 0 ? (
              <PanelEmpty style={{ gridColumn: "1 / -1" }}>No pending friend requests.</PanelEmpty>
            ) : (
              received.map((f) => (
                <FriendCardRow key={f.id}>
                  <FriendCardAvatarWrap style={{ width: 42, height: 42 }}>
                    <PlayerThumbnail playerName={f.name} size={42} />
                  </FriendCardAvatarWrap>
                  <FriendCardInfo>
                    <FriendCardName style={{ textAlign: "left" }}>{f.name}</FriendCardName>
                    <FriendCardLocation>Wants to be your friend</FriendCardLocation>
                  </FriendCardInfo>
                  <FriendInviteActions>
                    <SmPrimaryBtn disabled={!!friendBusy} onClick={() => runAction(() => acceptFriend(f.id), f.id)}>Accept</SmPrimaryBtn>
                    <SmSecBtn disabled={!!friendBusy} onClick={() => runAction(() => declineFriend(f.id), f.id)}>Decline</SmSecBtn>
                  </FriendInviteActions>
                </FriendCardRow>
              ))
            )
          )}
        </FriendsListScroll>
      </FriendsPanelInner>
    </HubPanelContainer>
  );
}
