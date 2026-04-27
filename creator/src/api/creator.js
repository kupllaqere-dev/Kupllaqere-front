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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
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

export const getMySubmissions = (params = {}) =>
  request(`/api/creator/submissions?${new URLSearchParams(params)}`);

export const submitSingle = (formData) =>
  request("/api/creator/submit", { method: "POST", body: formData });

export const submitSet = (formData) =>
  request("/api/creator/submit", { method: "POST", body: formData });

export const updateSubmission = (id, data) =>
  request(`/api/creator/submissions/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const reuploadVariant = (id, idx, formData) =>
  request(`/api/creator/submissions/${id}/variant/${idx}`, { method: "POST", body: formData });

export const deleteVariant = (id, idx) =>
  request(`/api/creator/submissions/${id}/variant/${idx}`, { method: "DELETE" });
