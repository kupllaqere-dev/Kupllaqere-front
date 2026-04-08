import { useState, useRef, useCallback } from "react";
import Game from "./components/Game";
import HUD from "./components/HUD";
import Login from "./components/Login";
import CharacterSetup from "./components/CharacterSetup";

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
      />
      <Game
        user={user}
        onEquippedChange={setEquipped}
        equipRef={equipRef}
        unequipRef={unequipRef}
      />
    </>
  );
}

export default App;
