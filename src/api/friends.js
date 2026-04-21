const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export async function fetchFriends() {
  const res = await fetch(`${API}/api/friends`, { headers: authHeaders() });
  return handle(res); // { friends, received, sent }
}

export async function sendFriendRequest(targetId) {
  const res = await fetch(`${API}/api/friends/request`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ targetId }),
  });
  return handle(res);
}

export async function acceptFriendRequest(userId) {
  const res = await fetch(`${API}/api/friends/accept`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

export async function declineFriendRequest(userId) {
  const res = await fetch(`${API}/api/friends/decline`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

export async function cancelFriendRequest(userId) {
  const res = await fetch(`${API}/api/friends/cancel`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

export async function removeFriend(userId) {
  const res = await fetch(`${API}/api/friends/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}
