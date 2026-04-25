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

export async function fetchSoulMateState(targetId) {
  const url = targetId
    ? `${API}/api/soulmate?targetId=${encodeURIComponent(targetId)}`
    : `${API}/api/soulmate`;
  const res = await fetch(url, { headers: authHeaders() });
  return handle(res);
}

export async function sendSoulMateRequest(targetId) {
  const res = await fetch(`${API}/api/soulmate/request`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ targetId }),
  });
  return handle(res);
}

export async function acceptSoulMateRequest(userId) {
  const res = await fetch(`${API}/api/soulmate/accept`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

export async function declineSoulMateRequest(userId) {
  const res = await fetch(`${API}/api/soulmate/decline`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

export async function cancelSoulMateRequest() {
  const res = await fetch(`${API}/api/soulmate/cancel`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handle(res);
}

export async function removeSoulMate() {
  const res = await fetch(`${API}/api/soulmate`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}
