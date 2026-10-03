const BASE = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "fv_creator_token";

export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const token = getToken();
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(!isForm ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `HTTP ${res.status}`);
    err.details = body.errors || [];
    throw err;
  }
  return res.json();
}

export async function creatorLogin(email, password) {
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
  const userRoles = data.user?.roles ?? [data.user?.role];
  if (!userRoles.includes("creator") && !userRoles.includes("admin")) {
    throw new Error("This account does not have creator access.");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function creatorLogout() {
  clearToken();
}

export const getMe = () => request("/api/creator/me");

// Body parts, item types and the parts each one needs.
export const getItemTypes = () => request("/api/creator/item-types");

export const getMySubmissions = (params = {}) =>
  request(`/api/creator/submissions?${new URLSearchParams(params)}`);

// formData: files[] (Name-body_part.png) + manifest JSON listing each item's files
export const submitItems = (formData) =>
  request("/api/creator/submit", { method: "POST", body: formData });

export const updateSubmission = (id, data) =>
  request(`/api/creator/submissions/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// formData: files[] — adds or replaces body parts, then re-packs the atlas
export const uploadParts = (id, formData) =>
  request(`/api/creator/submissions/${id}/parts`, { method: "POST", body: formData });

export const deletePart = (id, part) =>
  request(`/api/creator/submissions/${id}/parts/${encodeURIComponent(part)}`, { method: "DELETE" });

export const deleteSubmission = (id) =>
  request(`/api/creator/submissions/${id}`, { method: "DELETE" });
