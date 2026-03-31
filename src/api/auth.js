export async function loginWithEmail(email, password) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
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
  const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
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
  const res = await fetch(`${import.meta.env.VITE_API_URL}/setup`, {
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
  const res = await fetch(`${import.meta.env.VITE_API_URL}/guest`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Guest login failed");
  }
  return res.json(); // expects { user: { id, name: "guest_1234" }, token }
}

export async function loginWithGoogle(credential) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/google`, {
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
