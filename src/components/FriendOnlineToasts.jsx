import { useEffect, useRef, useState } from "react";
import * as S from "./HUDStyles";
import PlayerThumbnail from "./PlayerThumbnail";

// How long a toast stays up before it starts fading, and how long the fade runs
// (kept in sync with FRIEND_TOAST_OUT in HUDStyles).
const VISIBLE_MS = 4600;
const EXIT_MS = 280;
const MAX_VISIBLE = 3;

// `friend:online` only fires on a friend's first socket, so one connect is one
// toast. The payload carries the whole look ({ id, name, gender, skinColor,
// outfit }), so the thumbnail renders without a lookup round-trip.
export default function FriendOnlineToasts({ socket }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!socket?.socket) return;

    const track = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)); };

    const onFriendOnline = (friend) => {
      if (!friend?.id) return;
      const key = `${friend.id}-${Date.now()}`;
      setToasts((prev) => [
        // A reconnect replaces that friend's own toast instead of stacking on it.
        ...prev.filter((t) => String(t.id) !== String(friend.id)),
        {
          key,
          id: friend.id,
          name: friend.name || "A friend",
          gender: friend.gender,
          outfit: friend.outfit,
          skinColor: friend.skinColor ?? null,
          leaving: false,
        },
      ].slice(-MAX_VISIBLE));

      track(() => {
        setToasts((prev) => prev.map((t) => (t.key === key ? { ...t, leaving: true } : t)));
        track(() => setToasts((prev) => prev.filter((t) => t.key !== key)), EXIT_MS);
      }, VISIBLE_MS);
    };

    socket.socket.on("friend:online", onFriendOnline);
    return () => socket.socket.off("friend:online", onFriendOnline);
  }, [socket]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  if (toasts.length === 0) return null;

  return (
    <S.FriendToastStack>
      {toasts.map((t) => (
        <S.FriendToast key={t.key} $leaving={t.leaving}>
          <S.FriendToastAvatar>
            <PlayerThumbnail
              playerName={t.name}
              gender={t.gender}
              outfit={t.outfit}
              skinColor={t.skinColor}
              size={38}
            />
            <S.FriendToastDot />
          </S.FriendToastAvatar>
          <S.FriendToastText>
            <S.FriendToastName title={t.name}>{t.name}</S.FriendToastName>
            <S.FriendToastSub>is now online</S.FriendToastSub>
          </S.FriendToastText>
        </S.FriendToast>
      ))}
    </S.FriendToastStack>
  );
}
