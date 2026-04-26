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
