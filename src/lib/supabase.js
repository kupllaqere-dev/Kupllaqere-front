import { createClient } from "@supabase/supabase-js";

// Anon key only — used solely for auth (signInWithOAuth, getSession).
// All data fetching goes through the backend API, not directly via this client.
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;
