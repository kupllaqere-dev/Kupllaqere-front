const API = import.meta.env.VITE_API_URL;

function authHeaders() {
  const token = localStorage.getItem("fv_token");
  return { Authorization: `Bearer ${token}` };
}

/** Seeds this player has picked up: { catalogue, seeds: { seedId: count } }. */
export async function fetchSeeds() {
  const res = await fetch(`${API}/api/seeds`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch seeds");
  return res.json();
}
