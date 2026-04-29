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
