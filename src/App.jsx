import { useState, useRef, useCallback, useEffect } from "react";
import Game from "./components/Game";
import HUD from "./components/HUD";
import Login from "./components/Login";
import CharacterSetup from "./components/CharacterSetup";
import AuthFlow from "./auth/AuthFlow";
import { readAuthParams, isAuthLink } from "./auth/authLink";
import { updateBio, updateBadge, getMe } from "./api/auth";
import supabase from "./lib/supabase";
import { useScaling } from "./hooks/useScaling";

const viewportStyle = {
  position: "fixed",
  inset: 0,
  background: "url('/assets/menus/bg.png') center / cover no-repeat #000",
  overflow: "hidden",
};

function gameRootStyle(scale) {
  return {
    width: 1920,
    height: 1080,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: `translate(-50%, -50%) scale(${scale})`,
    transformOrigin: "center center",
    overflow: "hidden",
    willChange: "transform",
  };
}

function App() {
  const scale = useScaling();
  // Read before anything else touches the URL — see src/auth/authLink.js.
  const [authParams] = useState(readAuthParams);
  const handlingAuthLink = isAuthLink(authParams);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("fv_user");
    const token = localStorage.getItem("fv_token");
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem("fv_user");
        localStorage.removeItem("fv_token");
      }
    }
    return null;
  });
  const [equipped, setEquipped] = useState({});
  const [outfit, setOutfit] = useState({});
  const [skinColor, setSkinColor] = useState(null);
  const [gameSocket, setGameSocket] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [kickMessage, setKickMessage] = useState(null);
  const equipRef = useRef(null);
  const unequipRef = useRef(null);
  const applyLookBatchRef = useRef(null);

  function handleLogin(userData, token, refreshToken) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
    if (token) localStorage.setItem("fv_token", token);
    if (token && refreshToken) {
      // Give the Supabase client a session so it auto-refreshes like OAuth users do.
      // onAuthStateChange above will keep fv_token updated on every refresh.
      supabase.auth.setSession({ access_token: token, refresh_token: refreshToken });
    }
  }

  function handleSetupComplete(userData) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
  }

  // After Google OAuth redirect, Supabase handles the callback automatically.
  // If there's a session but no stored user, fetch the profile from the backend.
  // If there's already a user but a Supabase session exists, refresh the stored token.
  useEffect(() => {
    // On /auth/* the AuthFlow screen owns the URL and the session it carries.
    if (handlingAuthLink) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (window.location.href.includes("#")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      if (!session) return;
      if (user) {
        // Token may be stale — refresh it from the current Supabase session
        localStorage.setItem("fv_token", session.access_token);
        // Sync balance from DB in case it changed on the platform (e.g. code redemption)
        getMe(session.access_token).then(data => {
          setUser(prev => {
            const next = {
              ...prev,
              coins: data.user.coins ?? prev.coins,
              gems:  data.user.gems  ?? prev.gems,
            };
            localStorage.setItem("fv_user", JSON.stringify(next));
            return next;
          });
        }).catch(() => {});
        return;
      }
      try {
        const data = await getMe(session.access_token);
        handleLogin(data.user, session.access_token);
      } catch (err) {
        console.error("Session restore failed:", err);
        supabase.auth.signOut();
      }
    });

    // Keep fv_token in sync whenever Supabase silently refreshes the access token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) localStorage.setItem("fv_token", session.access_token);
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEquip = useCallback((item) => {
    equipRef.current?.(item);
  }, []);

  const handleUnequip = useCallback((category) => {
    unequipRef.current?.(category);
  }, []);

  const handleApplyLookBatch = useCallback((equippedSlots, clearSlots, skinColor) => {
    applyLookBatchRef.current?.(equippedSlots, clearSlots, skinColor);
  }, []);

  const handleSaveBio = useCallback(async (bio) => {
    const result = await updateBio(bio);
    setUser((prev) => {
      const next = { ...prev, bio: result.bio };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSaveBadge = useCallback(async (badge) => {
    const result = await updateBadge(badge);
    setUser((prev) => {
      const next = { ...prev, selectedBadge: result.selectedBadge };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
  }, []);

  const handlePurchaseComplete = useCallback(({ coins, gems }) => {
    setUser((prev) => {
      const next = { ...prev, coins, gems };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
  }, []);

  async function handleLogout() {
    localStorage.removeItem("fv_user");
    localStorage.removeItem("fv_token");
    await supabase.auth.signOut();
    setUser(null);
  }

  useEffect(() => {
    if (!gameSocket) return;
    const handler = () => {
      localStorage.removeItem("fv_user");
      localStorage.removeItem("fv_token");
      supabase.auth.signOut();
      setKickMessage("Your account was signed in from another device or tab.");
      setUser(null);
    };
    gameSocket.socket.on("session:kicked", handler);
    return () => gameSocket.socket.off("session:kicked", handler);
  }, [gameSocket]);

  // Sync balance changes made outside the game (e.g. platform code redemption)
  useEffect(() => {
    if (!gameSocket?.socket) return;
    const handler = ({ gems, coins }) => {
      setUser((prev) => {
        const next = {
          ...prev,
          ...(gems  !== undefined ? { gems  } : {}),
          ...(coins !== undefined ? { coins } : {}),
        };
        localStorage.setItem("fv_user", JSON.stringify(next));
        return next;
      });
    };
    gameSocket.socket.on("user:balance_update", handler);
    return () => gameSocket.socket.off("user:balance_update", handler);
  }, [gameSocket]);

  if (handlingAuthLink) {
    return <AuthFlow params={authParams} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} kickMessage={kickMessage} onKickMessageClear={() => setKickMessage(null)} />;
  }

  if (user.needsSetup) {
    return <CharacterSetup onComplete={handleSetupComplete} />;
  }

  return (
    <div style={viewportStyle}>
      <div style={gameRootStyle(scale)}>
        <Game
          user={user}
          onEquippedChange={setEquipped}
          onOutfitChange={setOutfit}
          onSkinColorChange={setSkinColor}
          equipRef={equipRef}
          unequipRef={unequipRef}
          applyLookBatchRef={applyLookBatchRef}
          onSocketReady={setGameSocket}
          onOnlinePlayersChange={setOnlinePlayers}
        />
        <HUD
          onLogout={handleLogout}
          equipped={equipped}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onApplyLookBatch={handleApplyLookBatch}
          playerName={user?.name}
          gender={user?.gender}
          outfit={outfit}
          skinColor={skinColor}
          bio={user?.bio || ""}
          onSaveBio={handleSaveBio}
          selectedBadge={user?.selectedBadge || null}
          onSaveBadge={handleSaveBadge}
          currentUserId={user?.id || null}
          email={user?.email || ""}
          isGuest={user?.isGuest ?? false}
          role={user?.role || "player"}
          socket={gameSocket}
          coins={user?.coins ?? 0}
          gems={user?.gems ?? 0}
          level={user?.level ?? 1}
          onPurchaseComplete={handlePurchaseComplete}
          onlinePlayers={onlinePlayers}
        />
      </div>
    </div>
  );
}

export default App;
