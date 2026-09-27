const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

/**
 * Testing-only helpers behind the HUD's DEV buttons (fv-game-back/routes/dev.js).
 * The backend refuses both outside development, so these only ever work
 * against a local server.
 */

/** Tops up a balance with no vial effect. Resolves to { success, coins, gems }. */
export async function devGrant(currency, amount) {
  const res = await fetch(`${API}/api/dev/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currency, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Dev grant failed");
  }
  return res.json();
}

/**
 * Deducts a balance and records it toward the matching vial, like a real
 * purchase would. Resolves to { success, coins, gems, vial? }.
 */
export async function devSpend(currency, amount) {
  const res = await fetch(`${API}/api/dev/spend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currency, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Dev spend failed");
  }
  return res.json();
}
