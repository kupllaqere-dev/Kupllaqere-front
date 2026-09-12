import { useState, useRef, useCallback, useEffect } from "react";
import Game from "./components/Game";
import HUD from "./components/HUD";
import Login from "./components/Login";
import LevelUpNotification from "./components/LevelUpNotification";
import CharacterSetup from "./components/CharacterSetup";
import AuthFlow from "./auth/AuthFlow";
import { readAuthParams, isAuthLink } from "./auth/authLink";
import { updateName, updateBio, updateBadge, getMe } from "./api/auth";
import { fetchSeeds } from "./api/seeds";
import { fetchConsumables } from "./api/consumables";
import supabase from "./lib/supabase";
import { useScaling } from "./hooks/useScaling";
import { DEFAULT_MAP } from "./game/MapManager";

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
  const [currentMap, setCurrentMap] = useState(DEFAULT_MAP);
  // Seeds picked up in the Garden, as { seedId: count }. The server is the
  // authority; this mirrors it so the HUD and the planter can read it without
  // a round trip.
  const [seedInventory, setSeedInventory] = useState({});
  // Bought one-shot items, sharing the Collectibles bag with seeds:
  // { catalogue, owned: { itemId: count } }.
  const [consumables, setConsumables] = useState({ catalogue: [], owned: {} });
  // Bumped once per level gained; LevelUpNotification replays on every change.
  const [levelUpTick, setLevelUpTick] = useState(0);
  const triggerLevelUp = useCallback(() => setLevelUpTick((n) => n + 1), []);
  // Every payload that can move progression funnels through `user.level`, so
  // watching it here catches a level gained from a harvest, a getMe sync or a
  // socket update without each of those having to fire the banner itself.
  // Compared during render rather than in an effect so the banner starts on the
  // same commit that shows the new level.
  const [seenLevel, setSeenLevel] = useState(() => user?.level ?? null);
  const currentLevel = user?.level ?? null;
  if (currentLevel !== seenLevel) {
    setSeenLevel(currentLevel);
    // The first reading only seeds the baseline — a page load at level 7 is not
    // a level-up. A drop (admin edit, account switch) just re-seeds as well.
    if (seenLevel !== null && currentLevel !== null && currentLevel > seenLevel) {
      triggerLevelUp();
    }
  }
  const equipRef = useRef(null);
  const unequipRef = useRef(null);
  const applyLookBatchRef = useRef(null);
  const changeMapRef = useRef(null);

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
              level: data.user.level ?? prev.level,
              inventorySlots: data.user.inventorySlots ?? prev.inventorySlots,
              // Progression is server-side now, so the stored copy follows it.
              xp: data.user.xp ?? prev.xp,
              // Legitimately null at the cap, so this one can't lean on ??.
              xpForNextLevel:
                data.user.xpForNextLevel !== undefined
                  ? data.user.xpForNextLevel
                  : prev.xpForNextLevel,
              maxLevel: data.user.maxLevel ?? prev.maxLevel,
              xpPercent: data.user.xpPercent ?? prev.xpPercent,
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

  const handleChangeMap = useCallback((mapId) => {
    changeMapRef.current?.(mapId);
  }, []);

  // Renaming consumes a "name_change" item (see fv-game-back/routes/auth.js),
  // so the count the server reports back replaces what the bag was showing.
  const handleSaveName = useCallback(async (name) => {
    const result = await updateName(name);
    setUser((prev) => {
      const next = { ...prev, name: result.name };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
    setConsumables((prev) => ({
      ...prev,
      owned: { ...prev.owned, name_change: result.nameChangesLeft ?? 0 },
    }));
    return result.name;
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

  // Progression lives on the server (fv-game-back/lib/xp.js). Every payload that
  // touches XP carries `xp` — what has been banked into the current level — and
  // `xpForNextLevel`, what the curve charges for the next one, null once
  // maxLevel is reached. The front end never reproduces the table; the two
  // handlers below just carry those numbers through to the HUD's vial.
  //
  // Tree fruit, front-end only: bumps the in-memory balance so the HUD reflects
  // the payout. Deliberately not persisted — the planter's harvests go through
  // the server instead (see handleBalancesChanged).
  const handleCoinsEarned = useCallback((amount) => {
    setUser((prev) => (prev ? { ...prev, coins: (prev.coins ?? 0) + amount } : prev));
  }, []);

  // Likewise for XP fruit. It fills the current level's share of the curve and
  // stops there: the client doesn't carry the XP table, so it can't know what
  // the level after this one costs, and this payout was never banked anyway.
  // The next authoritative payload (getMe, or a planter harvest) settles the
  // real level and XP — see handleBalancesChanged.
  const handleXpEarned = useCallback((amount) => {
    setUser((prev) => {
      if (!prev) return prev;
      const needed = prev.xpForNextLevel;
      // Null at the level cap, undefined until the server has said otherwise —
      // either way there is no room on the curve to advance into.
      if (!needed) return prev;
      const xp = Math.min((prev.xp ?? 0) + amount, needed);
      return { ...prev, xp, xpPercent: (xp / needed) * 100 };
    });
  }, []);

  // Both pickups and sowings report the new total for that one seed, so the
  // mirror never has to guess at a delta.
  const handleSeedCountChange = useCallback((seedId, count) => {
    setSeedInventory((prev) => {
      const next = { ...prev };
      if (count > 0) next[seedId] = count;
      else delete next[seedId];
      return next;
    });
  }, []);

  // A planter harvest is banked server-side, so the numbers it sends back are
  // the real ones — they replace the local balance rather than adding to it.
  const handleBalancesChanged = useCallback(({ coins, gems, level, xp, xpForNextLevel, maxLevel, xpPercent }) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        ...(coins !== undefined ? { coins } : {}),
        ...(gems !== undefined ? { gems } : {}),
        ...(level !== undefined ? { level } : {}),
        ...(xp !== undefined ? { xp } : {}),
        ...(xpForNextLevel !== undefined ? { xpForNextLevel } : {}),
        ...(maxLevel !== undefined ? { maxLevel } : {}),
        ...(xpPercent !== undefined ? { xpPercent } : {}),
      };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
  }, []);

  // Buying clothes moves both balances; buying a shop upgrade moves only one,
  // and the inventory expansion also changes the wardrobe's capacity — so each
  // field is applied only when the caller actually sent it.
  const handlePurchaseComplete = useCallback(({ coins, gems, inventorySlots }) => {
    setUser((prev) => {
      const next = {
        ...prev,
        ...(coins !== undefined ? { coins } : {}),
        ...(gems !== undefined ? { gems } : {}),
        ...(inventorySlots !== undefined ? { inventorySlots } : {}),
      };
      localStorage.setItem("fv_user", JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user || user.needsSetup) return;
    fetchSeeds()
      .then(({ seeds }) => setSeedInventory(seeds || {}))
      .catch(() => {});
    fetchConsumables()
      .then((data) => setConsumables(data))
      .catch(() => {});
  }, [user?.id, user?.needsSetup]); // eslint-disable-line react-hooks/exhaustive-deps

  // The shop hands back the new counts after a purchase; the bag mirrors them
  // rather than refetching.
  const handleConsumablesChange = useCallback((owned) => {
    setConsumables((prev) => ({ ...prev, owned }));
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
          changeMapRef={changeMapRef}
          onSocketReady={setGameSocket}
          onOnlinePlayersChange={setOnlinePlayers}
          onMapChange={setCurrentMap}
          onCoinsEarned={handleCoinsEarned}
          onXpEarned={handleXpEarned}
          seedInventory={seedInventory}
          onSeedCountChange={handleSeedCountChange}
          onBalancesChanged={handleBalancesChanged}
        />
        <HUD
          onLogout={handleLogout}
          equipped={equipped}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onApplyLookBatch={handleApplyLookBatch}
          playerName={user?.name}
          onSaveName={handleSaveName}
          gender={user?.gender}
          outfit={outfit}
          skinColor={skinColor}
          bio={user?.bio || ""}
          onSaveBio={handleSaveBio}
          selectedBadge={user?.selectedBadge || null}
          onSaveBadge={handleSaveBadge}
          currentUserId={user?.id || null}
          email={user?.email || ""}
          role={user?.role || "player"}
          socket={gameSocket}
          coins={user?.coins ?? 0}
          gems={user?.gems ?? 0}
          level={user?.level ?? 1}
          xp={user?.xp ?? 0}
          xpForNextLevel={user?.xpForNextLevel}
          xpPercent={user?.xpPercent ?? 0}
          onPurchaseComplete={handlePurchaseComplete}
          onlinePlayers={onlinePlayers}
          currentMap={currentMap}
          onChangeMap={handleChangeMap}
          seedInventory={seedInventory}
          consumables={consumables}
          onConsumablesChange={handleConsumablesChange}
          onDevLevelUp={triggerLevelUp}
        />
        <LevelUpNotification trigger={levelUpTick} level={user?.level ?? 1} />
      </div>
    </div>
  );
}

export default App;
