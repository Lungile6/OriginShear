const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const API_TOKEN_KEY = "originshear_api_token";
export const API_WALLET_KEY = "originshear_api_wallet";

function getToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token, wallet) {
  try {
    if (token) {
      localStorage.setItem(API_TOKEN_KEY, token);
      if (wallet) localStorage.setItem(API_WALLET_KEY, wallet.toLowerCase());
    } else {
      localStorage.removeItem(API_TOKEN_KEY);
      localStorage.removeItem(API_WALLET_KEY);
    }
  } catch {
    // no-op in non-browser contexts
  }
}

export function getApiTokenForWallet(wallet) {
  const token = getToken();
  if (!token || !wallet) return null;
  try {
    const storedWallet = localStorage.getItem(API_WALLET_KEY);
    if (storedWallet && storedWallet !== wallet.toLowerCase()) return null;
  } catch {
    return null;
  }
  return token;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_BASE_URL}. Make sure the API is running (cd api && npm run dev) and open the app from http://localhost:5173 (or 5174).`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const validationMessage = Array.isArray(data?.errors)
      ? data.errors
          .map((e) => e.msg || e.message)
          .filter(Boolean)
          .join("; ")
      : "";
    const message =
      validationMessage || data?.error || data?.message || `Request failed (${res.status})`;
    if (res.status === 401) {
      // Drop stale JWTs so the next ensureApiSession() re-authenticates.
      setApiToken(null);
      if (/invalid or expired token/i.test(message)) {
        throw new Error(
          "API session expired. Approve the wallet signature prompt, then try again."
        );
      }
      if (/no token provided/i.test(message)) {
        throw new Error(
          "API sign-in required. Refresh the page and approve the wallet signature prompt, then try again."
        );
      }
    }
    throw new Error(message);
  }
  return data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...(options || {}), method: "GET" }),
  post: (path, body, options) => request(path, { ...(options || {}), method: "POST", body }),
  put: (path, body, options) => request(path, { ...(options || {}), method: "PUT", body }),
};
