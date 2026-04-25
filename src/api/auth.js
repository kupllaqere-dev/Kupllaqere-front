export async function loginWithEmail(email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }
  return res.json(); // expects { user: { id, name, email, gender, avatar }, token }
}

export async function register(email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Registration failed");
  }
  return res.json(); // expects { user: { id, email, needsSetup: true }, token }
}

export async function setupCharacter(name, gender) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, gender }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Setup failed");
  }
  return res.json(); // expects { user: { id, name, email, gender, avatar } }
}

export async function loginAsGuest() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/guest`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Guest login failed");
  }
  return res.json(); // expects { user: { id, name: "guest_1234" }, token }
}

export async function lookupUser(name) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/auth/user?name=${encodeURIComponent(name)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Lookup failed");
  }
  const data = await res.json();
  return data.user;
}

export async function updateBio(bio) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/bio`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bio }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Bio update failed");
  }
  return res.json(); // { bio }
}

export async function updateBadge(badge) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/badge`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ badge }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Badge update failed");
  }
  return res.json(); // { selectedBadge }
}

export async function loginWithGoogle(credential) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Google login failed");
  }
  return res.json(); // expects { user, token }
}
