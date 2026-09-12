const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

export async function fetchStoreItems({ category = "", subcategory = "", page = 1, sort = "" } = {}) {
  const params = new URLSearchParams({ page });
  if (category) params.set("category", category);
  if (subcategory) params.set("subcategory", subcategory);
  if (sort) params.set("sort", sort);
  const res = await fetch(`${API}/api/store?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch store items");
  return res.json(); // { groups, total, page, hasMore, ownedIds }
}

export async function fetchInventory() {
  const res = await fetch(`${API}/api/store/inventory`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json(); // { items }
}

/**
 * The shop's real-money catalogue: { currency, lisPacks, membership }.
 * Prices are integer cents of `currency` and are owned by the server
 * (fv-game-back/lib/shopCatalogue.js) — never re-price these client-side.
 */
export async function fetchShopCatalogue() {
  const res = await fetch(`${API}/api/store/catalogue`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load the shop catalogue");
  return res.json();
}

/**
 * Clothing-inventory capacity: { slots, used, available, max, expansion }.
 * `expansion` is what the shop's Account tab sells — { amount, cost, currency }.
 * Seeds and crops are a separate bag and are not counted here.
 */
export async function fetchInventorySlots() {
  const res = await fetch(`${API}/api/store/inventory/slots`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load inventory slots");
  return res.json();
}

/** Buys one expansion pack. Resolves to the same shape plus the new gem balance. */
export async function purchaseInventorySlots() {
  const res = await fetch(`${API}/api/store/inventory/slots/purchase`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Purchase failed");
  }
  return res.json();
}

export async function sellItem({ inventoryId }) {
  const res = await fetch(`${API}/api/store/sell`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ inventoryId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Sell failed");
  }
  return res.json();
}

export async function fetchWishlist() {
  const res = await fetch(`${API}/api/store/wishlist`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch wishlist");
  return res.json(); // { items }
}

export async function addToWishlist({ itemId }) {
  const res = await fetch(`${API}/api/store/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ itemId }),
  });
  if (!res.ok) throw new Error("Failed to add to wishlist");
  return res.json();
}

export async function removeFromWishlist({ itemId }) {
  const res = await fetch(`${API}/api/store/wishlist/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove from wishlist");
  return res.json();
}

// items: [{ id, currency: "coins"|"gems" }]
export async function purchaseItems({ items }) {
  const res = await fetch(`${API}/api/store/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Purchase failed");
  }
  return res.json(); // { success, coins, gems, purchasedIds }
}
