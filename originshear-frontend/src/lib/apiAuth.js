import { apiClient, setApiToken, getApiTokenForWallet, API_TOKEN_KEY } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Re-export for hooks/pages that import the auth facade as a single module.
export { getApiTokenForWallet };

/** Prevents parallel MetaMask signature prompts from layout + page both authing. */
let authInFlight = null;

export function getApiToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearApiToken() {
  setApiToken(null);
}

/** Quick client-side expiry check (does not validate signature). */
function isJwtExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return false;
    // Refresh 60s early to avoid edge races.
    return payload.exp * 1000 <= Date.now() + 60_000;
  } catch {
    return true;
  }
}

/** Confirm the API still accepts this JWT (catches secret mismatch / revoked sessions). */
async function isApiTokenAccepted(token) {
  if (!token || isJwtExpired(token)) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return Boolean(data?.valid);
  } catch {
    return false;
  }
}

/**
 * Signs a challenge and stores a JWT for protected API routes.
 */
export async function authenticateApiSession(wallet, signMessageAsync) {
  if (!wallet || !signMessageAsync) {
    throw new Error("Wallet address and sign function are required.");
  }

  const challenge = await apiClient.post("/api/auth/challenge", { wallet });
  const signature = await signMessageAsync({ message: challenge.message });
  const loginPayload = await apiClient.post("/api/auth/login", {
    wallet,
    nonce: challenge.nonce,
    signature,
  });

  if (!loginPayload?.token) {
    throw new Error("Login succeeded but no session token was returned.");
  }

  setApiToken(loginPayload.token, wallet);
  return loginPayload.token;
}

/**
 * Ensure a valid JWT exists for the connected wallet before protected API calls.
 * Reuses a stored token only after verifying it with the API.
 */
export async function ensureApiSession(wallet, signMessageAsync) {
  const existing = getApiTokenForWallet(wallet);
  if (existing && (await isApiTokenAccepted(existing))) {
    return existing;
  }

  if (authInFlight) return authInFlight;

  clearApiToken();
  authInFlight = authenticateApiSession(wallet, signMessageAsync).finally(() => {
    authInFlight = null;
  });
  return authInFlight;
}
