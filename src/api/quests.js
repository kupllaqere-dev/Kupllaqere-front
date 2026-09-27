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

export async function fetchQuests() {
  return handle(await fetch(`${API}/api/quests`, { headers: authHeaders() }));
}

export async function claimQuest(questKey) {
  return handle(
    await fetch(`${API}/api/quests/claim`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ questKey }),
    })
  );
}

export async function setQuestPin(questKey, pinned) {
  return handle(
    await fetch(`${API}/api/quests/pin`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ questKey, pinned }),
    })
  );
}
