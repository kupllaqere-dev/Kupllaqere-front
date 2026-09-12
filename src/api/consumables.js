const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

/**
 * One-shot items the player has bought, plus the catalogue that describes
 * them: { catalogue, owned: { itemId: count } }. They live in the Collectibles
 * bag next to seeds and are spent from there.
 */
export async function fetchConsumables() {
  const res = await fetch(`${API}/api/consumables`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load your items");
  return res.json();
}

/** Buys one of `id` with Lis. Resolves to { success, gems, owned }. */
export async function purchaseConsumable(id) {
  const res = await fetch(`${API}/api/consumables/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Purchase failed");
  }
  return res.json();
}
