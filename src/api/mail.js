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

export async function fetchInbox() {
  return handle(await fetch(`${API}/api/mail/inbox`, { headers: authHeaders() }));
}

export async function fetchSent() {
  return handle(await fetch(`${API}/api/mail/sent`, { headers: authHeaders() }));
}

export async function sendMail(targetId, subject, body) {
  return handle(
    await fetch(`${API}/api/mail/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ targetId, subject, body }),
    })
  );
}

export async function markMailRead(mailId) {
  return handle(
    await fetch(`${API}/api/mail/${mailId}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    })
  );
}

export async function fetchUnreadCount() {
  return handle(await fetch(`${API}/api/mail/unread-count`, { headers: authHeaders() }));
}
