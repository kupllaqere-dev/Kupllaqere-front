import { useState, useRef, useCallback } from "react";
import Game from "./components/Game";
import HUD from "./components/HUD";
import Login from "./components/Login";
import CharacterSetup from "./components/CharacterSetup";
import { updateBio, updateBadge } from "./api/auth";

function App() {
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
  const equipRef = useRef(null);
  const unequipRef = useRef(null);

  function handleLogin(userData, token) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
    if (token) localStorage.setItem("fv_token", token);
  }

  function handleSetupComplete(userData) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
  }

  const handleEquip = useCallback((item) => {
    equipRef.current?.(item);
  }, []);

  const handleUnequip = useCallback((category) => {
    unequipRef.current?.(category);
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.needsSetup) {
    return <CharacterSetup onComplete={handleSetupComplete} />;
  }

  return (
    <>
      <HUD
        onLogout={() => {
          localStorage.removeItem("fv_user");
          localStorage.removeItem("fv_token");
          setUser(null);
        }}
        equipped={equipped}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        playerName={user?.name}
        gender={user?.gender}
        outfit={outfit}
        bio={user?.bio || ""}
        onSaveBio={handleSaveBio}
        selectedBadge={user?.selectedBadge || null}
        onSaveBadge={handleSaveBadge}
        currentUserId={user?.id || null}
      />
      <Game
        user={user}
        onEquippedChange={setEquipped}
        onOutfitChange={setOutfit}
        equipRef={equipRef}
        unequipRef={unequipRef}
      />
    </>
  );
}

export default App;
