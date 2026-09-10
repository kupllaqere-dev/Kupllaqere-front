const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

async function post(path, body) {
  const res = await fetch(`${API}/api/farm${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Farm request failed");
  }
  return res.json();
}

/**
 * The player's planter: its name, its occupied plots, and the server's clock.
 * Plots carry `plantedAt`/`readyAt` as epoch ms — growth is derived from those,
 * so a crop sown before the player logged out comes back part-grown.
 */
export async function fetchFarm() {
  const res = await fetch(`${API}/api/farm`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load your farm");
  return res.json(); // { name, growMs, plotCount, now, plots }
}

/** Sows one seed from the bag. Resolves with { plot, seedId, count }. */
export function plantSeed(plotIndex, seedId) {
  return post("/plant", { plotIndex, seedId });
}

/**
 * Takes a ripe plot. Resolves with the reward plus the balances the server now
 * holds: { reward, coins, gems, level, xp, xpForNextLevel, maxLevel, xpPercent }.
 * xp is XP into the current level and xpForNextLevel what the curve charges for
 * the next one (null at maxLevel) — see fv-game-back/lib/xp.js.
 */
export function harvestPlot(plotIndex) {
  return post("/harvest", { plotIndex });
}

/** Renames the plaque. Resolves with the name the server actually stored. */
export function renameFarm(name) {
  return post("/name", { name });
}
