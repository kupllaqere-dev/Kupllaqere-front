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

export async function fetchGuestBookComments(userId) {
  const res = await fetch(`${API}/api/guestbook/${encodeURIComponent(userId)}`, {
    headers: authHeaders(),
  });
  return handle(res);
}

export async function postGuestBookComment(userId, message) {
  const res = await fetch(`${API}/api/guestbook/${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  });
  return handle(res);
}

export async function deleteGuestBookComment(commentId) {
  const res = await fetch(`${API}/api/guestbook/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res);
}
