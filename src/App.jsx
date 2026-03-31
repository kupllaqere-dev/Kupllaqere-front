import { useState, useEffect } from "react";
import Game from "./components/Game";
import HUD from "./components/HUD";
import Login from "./components/Login";
import CharacterSetup from "./components/CharacterSetup";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("fv_user");
    const token = localStorage.getItem("fv_token");
    if (saved && token) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("fv_user");
        localStorage.removeItem("fv_token");
      }
    }
  }, []);

  function handleLogin(userData, token) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
    if (token) localStorage.setItem("fv_token", token);
  }

  function handleSetupComplete(userData) {
    setUser(userData);
    localStorage.setItem("fv_user", JSON.stringify(userData));
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.needsSetup) {
    return <CharacterSetup onComplete={handleSetupComplete} />;
  }

  return (
    <>
      <HUD onLogout={() => {
        localStorage.removeItem("fv_user");
        localStorage.removeItem("fv_token");
        setUser(null);
      }} />
      <Game user={user} />
    </>
  );
}

export default App;
