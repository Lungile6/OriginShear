import { apiClient, setApiToken, API_TOKEN_KEY } from "./apiClient";

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

  setApiToken(loginPayload.token);
  return loginPayload.token;
}
