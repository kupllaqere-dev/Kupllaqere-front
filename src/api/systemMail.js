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

export async function fetchSystemMail() {
  return handle(await fetch(`${API}/api/system-mail`, { headers: authHeaders() }));
}

export async function markSystemMailRead(id) {
  return handle(
    await fetch(`${API}/api/system-mail/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    })
  );
}

/** Resolves to the claimed mail plus the balances the payout left behind. */
export async function claimSystemMail(id) {
  return handle(
    await fetch(`${API}/api/system-mail/${encodeURIComponent(id)}/claim`, {
      method: "POST",
      headers: authHeaders(),
    })
  );
}

/** Rejects with the server's message while the mail still holds an unclaimed reward. */
export async function deleteSystemMail(id) {
  return handle(
    await fetch(`${API}/api/system-mail/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
  );
}
