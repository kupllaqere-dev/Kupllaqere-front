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

/** The ten trinkets and the two memberships, with the prices the server charges. */
export async function fetchGiftCatalogue() {
  return handle(await fetch(`${API}/api/gifts/catalogue`, { headers: authHeaders() }));
}

/** A profile's gift shelf, newest first. Public, like the profile itself. */
export async function fetchReceivedGifts(userId) {
  return handle(await fetch(`${API}/api/gifts/received/${encodeURIComponent(userId)}`));
}

/**
 * Buys one catalogue product for another player.
 * Resolves to { gift, gems, membership } — `gems` is the sender's balance after
 * paying, so the HUD can take it as-is rather than subtracting locally.
 * Rejects with the server's message when the Lis don't cover it.
 */
export async function sendGift(recipientId, giftId) {
  return handle(
    await fetch(`${API}/api/gifts/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ recipientId, giftId }),
    })
  );
}
