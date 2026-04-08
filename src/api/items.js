const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

export async function uploadItem({ file, name, category, subcategory }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("name", name);
  formData.append("category", category);
  formData.append("subcategory", subcategory);

  const res = await fetch(`${API}/api/items/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

export async function fetchItems() {
  const res = await fetch(`${API}/api/items`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json(); // expects { items: [...] }
}

export async function updateOutfit(outfit) {
  const res = await fetch(`${API}/api/items/outfit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ outfit }),
  });
  if (!res.ok) throw new Error("Failed to update outfit");
  return res.json();
}

export async function fetchOutfit() {
  const res = await fetch(`${API}/api/items/outfit`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch outfit");
  return res.json(); // expects { outfit: { tops: { itemId, imageUrl }, ... } }
}
