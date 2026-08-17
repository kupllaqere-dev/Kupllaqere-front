import supabase from "../lib/supabase";

/**
 * Everything about "the user clicked a link in an auth email" lives in this
 * folder. Every such link points at /auth/callback, and App.jsx hands the page
 * over to <AuthFlow> when it sees one.
 *
 * Supabase hands the session back in one of three shapes, depending on which
 * client asked for the email and which template sent it:
 *
 *   #access_token=…&refresh_token=…  implicit — what the backend's signUp sends
 *   ?code=…                          PKCE — emails asked for by the browser
 *   ?token_hash=…&type=…             templates using {{ .TokenHash }}
 *
 * `establishSession` accepts all three so the flow doesn't care which arrived.
 */

export const AUTH_CALLBACK_PATH = "/auth/callback";

// Snapshot the URL at module load. The Supabase client wipes the hash from the
// address bar as soon as it processes it, so reading later can come up empty.
const INITIAL_URL = typeof window !== "undefined" ? window.location.href : "";

/**
 * Absolute URL to hand Supabase as `redirectTo` / `emailRedirectTo`.
 *
 * `type` is passed explicitly because PKCE links come back as a bare `?code=`
 * with nothing to say what the email was for — without it we can't tell a
 * password reset from a signup confirmation.
 */
export function authCallbackUrl(type) {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return `${window.location.origin}${AUTH_CALLBACK_PATH}${query}`;
}

/** Pull the auth parameters out of the URL this page was opened with. */
export function readAuthParams() {
  if (!INITIAL_URL) return {};

  const url = new URL(INITIAL_URL);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const query = url.searchParams;
  const pick = (key) => query.get(key) ?? hash.get(key);

  return {
    path:         url.pathname,
    code:         query.get("code"),
    tokenHash:    pick("token_hash"),
    accessToken:  hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
    type:         pick("type"),
    error:        pick("error_code") || pick("error"),
    errorMessage: pick("error_description"),
  };
}

/**
 * Did this page load come from an auth email?
 *
 * Normally keyed on the path, so Google OAuth — which comes back to "/" with
 * its own tokens and is handled by App.jsx — is left alone. Failures are the
 * exception: Supabase reports those against the Site URL rather than the
 * redirect it was given, so catch them wherever they land instead of dropping
 * the player on a login screen with no idea what went wrong.
 */
export function isAuthLink(params) {
  if (params.error) return true;
  return Boolean(params.path && params.path.startsWith("/auth/"));
}

const ERROR_MESSAGES = {
  otp_expired:     "That link has expired. Request a new one and try again.",
  access_denied:   "That link is no longer valid. Request a new one and try again.",
  invalid_request: "That link is malformed. Request a new one and try again.",
};

/** Turn the parameters from `readAuthParams` into a signed-in session. */
export async function establishSession(params) {
  if (params.error) {
    return { error: ERROR_MESSAGES[params.error] || params.errorMessage || "That link is no longer valid." };
  }

  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token:  params.accessToken,
      refresh_token: params.refreshToken,
    });
    return error ? sessionOrError(error) : {};
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return error ? sessionOrError(error) : {};
  }

  if (params.tokenHash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type:       params.type,
    });
    return error ? sessionOrError(error) : {};
  }

  return { error: "This link is missing its verification details." };
}

/**
 * A one-time code can only be redeemed once, so a refresh or a second visit
 * fails even though the link worked. If a session already exists that's what
 * happened — treat it as success instead of showing an alarming error.
 */
async function sessionOrError(error) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return {};
  return { error: ERROR_MESSAGES[error.code] || error.message || "We could not verify that link." };
}
