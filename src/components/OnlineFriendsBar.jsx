import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { fetchFriends } from "../api/friends";
import PlayerThumbnail from "./PlayerThumbnail";

export default function OnlineFriendsBar({ socket }) {
  const [onlineMap, setOnlineMap] = useState(() => new Map());

  const refreshFromServer = useCallback(() => {
    fetchFriends()
      .then((data) => {
        setOnlineMap(() => {
          const next = new Map();
          for (const f of data.friends || []) {
            if (f.online) next.set(String(f.id), f);
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  useEffect(() => {
    if (!socket) return;

    const handleList = (list) => {
      setOnlineMap((prev) => {
        const next = new Map(prev);
        for (const f of list || []) {
          next.set(String(f.id), f);
        }
        return next;
      });
    };

    const handleOnline = (f) => {
      if (!f?.id) return;
      setOnlineMap((prev) => {
        const next = new Map(prev);
        next.set(String(f.id), f);
        return next;
      });
    };

    const handleOffline = ({ id } = {}) => {
      if (!id) return;
      setOnlineMap((prev) => {
        if (!prev.has(String(id))) return prev;
        const next = new Map(prev);
        next.delete(String(id));
        return next;
      });
    };

    socket.onFriendsOnline(handleList);
    socket.onFriendOnline(handleOnline);
    socket.onFriendOffline(handleOffline);
    socket.onFriendsRefresh(refreshFromServer);

    return () => {
      socket.off("friends:online", handleList);
      socket.off("friend:online", handleOnline);
      socket.off("friend:offline", handleOffline);
      socket.off("friends:refresh", refreshFromServer);
    };
  }, [socket, refreshFromServer]);

  const friends = Array.from(onlineMap.values());
  if (friends.length === 0) return null;

  return (
    <Bar>
      {friends.map((f) => (
        <Item key={f.id} title={f.name || "Unknown"}>
          <Avatar>
            <PlayerThumbnail outfit={f.outfit} gender={f.gender} size={52} />
            <Dot />
          </Avatar>
          <Name>{f.name || ""}</Name>
        </Item>
      ))}
    </Bar>
  );
}

const Bar = styled.div`
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;

  display: flex;
  gap: 10px;
  padding: 10px 14px;
  max-width: 90vw;
  overflow-x: auto;

  background: rgba(18, 18, 31, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid #ffffff22;
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
  pointer-events: auto;

  scrollbar-width: thin;
  scrollbar-color: #ffffff33 transparent;
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 60px;
  cursor: pointer;
  transition: transform 0.15s;
  &:hover { transform: translateY(-2px); }
`;

const Avatar = styled.div`
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2a2a3e, #1a1a2e);
  border: 1px solid #ffffff22;

  canvas {
    position: absolute;
    inset: 0;
    border-radius: 50%;
  }
`;

const Dot = styled.span`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3fdd7c;
  border: 2px solid #12121f;
`;

const Name = styled.span`
  font-size: 10px;
  color: #ddd;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
