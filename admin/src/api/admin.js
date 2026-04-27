const BASE = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "fv_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function adminLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }
  const data = await res.json();
  if (data.user?.role !== "admin") throw new Error("This account does not have admin access.");
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function adminLogout() {
  localStorage.removeItem(TOKEN_KEY);
}

// Stats
export const getStats = () => request("/api/admin/stats");

// Players
export const getPlayers = (params = {}) =>
  request(`/api/admin/players?${new URLSearchParams(params)}`);
export const getPlayer = (id) => request(`/api/admin/players/${id}`);
export const updatePlayer = (id, data) =>
  request(`/api/admin/players/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deletePlayer = (id) =>
  request(`/api/admin/players/${id}`, { method: "DELETE" });

// Items
export const getItems = (params = {}) =>
  request(`/api/admin/items?${new URLSearchParams(params)}`);
export const createItem = (formData) =>
  request("/api/admin/items", { method: "POST", body: formData });
export const updateItem = (id, data) =>
  request(`/api/admin/items/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteItem = (id) =>
  request(`/api/admin/items/${id}`, { method: "DELETE" });

// Online
export const getOnline = () => request("/api/admin/online");

// Mail
export const getMail = (params = {}) =>
  request(`/api/admin/mail?${new URLSearchParams(params)}`);
export const deleteMail = (id) =>
  request(`/api/admin/mail/${id}`, { method: "DELETE" });
