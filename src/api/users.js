const API = import.meta.env.VITE_API_URL;

// Module-level cache: name -> Promise<{ gender, outfit } | null>
// Storing the promise itself deduplicates in-flight requests for the same name.
const appearanceCache = new Map();

export async function fetchPlayerAppearance(name) {
  if (!name) return null;
  if (appearanceCache.has(name)) return appearanceCache.get(name);

  const promise = fetch(`${API}/api/users/appearance/${encodeURIComponent(name)}`)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);

  appearanceCache.set(name, promise);
  return promise;
}

// Cache: userId -> { promise, expiresAt }
const statusCache = new Map();
const STATUS_TTL = 30_000;

export async function fetchUserStatus(userId, { force = false } = {}) {
  if (!userId) return { status: "offline", manualStatus: "online" };

  const cached = statusCache.get(userId);
  if (!force && cached && Date.now() < cached.expiresAt) return cached.promise;

  const token = localStorage.getItem("fv_token");
  const promise = fetch(`${API}/api/users/${encodeURIComponent(userId)}/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => (res.ok ? res.json() : { status: "offline", manualStatus: "online" }))
    .catch(() => { statusCache.delete(userId); return { status: "offline", manualStatus: "online" }; });

  statusCache.set(userId, { promise, expiresAt: Date.now() + STATUS_TTL });
  return promise;
}

export function invalidateStatusCache(userId) {
  if (userId) statusCache.delete(userId);
}

// Cache: userId -> Promise<view | null>
// Invalidated explicitly on save/clear so we never show stale lock state.
const profileViewCache = new Map();

export async function fetchProfileView(userId) {
  if (!userId) return null;
  if (profileViewCache.has(userId)) return profileViewCache.get(userId);

  const promise = fetch(`${API}/api/users/${encodeURIComponent(userId)}/profile-view`)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => { profileViewCache.delete(userId); return null; });

  profileViewCache.set(userId, promise);
  return promise;
}

export function invalidateProfileViewCache(userId) {
  if (userId) profileViewCache.delete(userId);
}

export async function saveProfileView({ poseIndex, zoomIndex, panX, panY }) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/auth/profile-view`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ poseIndex, zoomIndex, panX, panY }),
  });
  if (!res.ok) throw new Error("Failed to save profile view");
  return res.json();
}

export async function clearProfileView() {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/auth/profile-view`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to unlock profile view");
  return res.json();
}
