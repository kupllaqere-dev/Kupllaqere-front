const API = import.meta.env.VITE_API_URL;

export async function fetchUserStatus(userId) {
  if (!userId) return { status: "offline", manualStatus: "online" };
  const token = localStorage.getItem("fv_token");
  return fetch(`${API}/api/users/${encodeURIComponent(userId)}/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => (res.ok ? res.json() : { status: "offline", manualStatus: "online" }))
    .catch(() => ({ status: "offline", manualStatus: "online" }));
}

const profileViewCache = new Map();

export async function fetchProfileView(userId) {
  if (!userId) return null;
  if (profileViewCache.has(userId)) return profileViewCache.get(userId);
  const promise = fetch(`${API}/api/users/${encodeURIComponent(userId)}/profile-view`)
    .then(res => (res.ok ? res.json() : null))
    .catch(() => { profileViewCache.delete(userId); return null; });
  profileViewCache.set(userId, promise);
  return promise;
}

export function invalidateProfileViewCache(userId) {
  if (userId) profileViewCache.delete(userId);
}

export async function saveProfileView({ poseIndex, zoomIndex }) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/auth/profile-view`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ poseIndex, zoomIndex }),
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

export async function updatePresence(status) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/auth/presence`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update presence");
  return res.json();
}

export async function saveTheme(themeName) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/auth/theme`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ themeName }),
  });
  if (!res.ok) throw new Error("Failed to save theme");
  return res.json();
}

export async function fetchLikeState(targetUserId) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/users/${encodeURIComponent(targetUserId)}/like-state`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { liked: false, popularity: 0 };
  return res.json();
}

export async function toggleLike(targetUserId) {
  const token = localStorage.getItem("fv_token");
  const res = await fetch(`${API}/api/users/${encodeURIComponent(targetUserId)}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to toggle like");
  return res.json();
}

