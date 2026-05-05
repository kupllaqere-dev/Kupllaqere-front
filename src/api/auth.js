const API = import.meta.env.VITE_API_URL;

function token() {
  return localStorage.getItem("fv_token");
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function loginWithEmail(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }); // { user, token }
}

export async function register(email, password) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }); // { user, token } or { message: "Check your email..." }
}

export async function setupCharacter(name, gender) {
  return apiFetch("/api/auth/setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ name, gender }),
  }); // { user }
}

export async function loginAsGuest() {
  return apiFetch("/api/auth/guest", { method: "POST" }); // { user, token }
}

// Returns the current user's profile using a Supabase session token.
// Called after Google OAuth redirect to exchange the session for a profile.
export async function getMe(accessToken) {
  return apiFetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  }); // { user }
}

export async function lookupUser(name) {
  return apiFetch(
    `/api/auth/user?name=${encodeURIComponent(name)}`,
    { headers: { Authorization: `Bearer ${token()}` } }
  ).then((d) => d.user);
}

export async function updateBio(bio) {
  return apiFetch("/api/auth/bio", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ bio }),
  }); // { bio }
}

export async function updateBadge(badge) {
  return apiFetch("/api/auth/badge", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({ badge }),
  }); // { selectedBadge }
}
