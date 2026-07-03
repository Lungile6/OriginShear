const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const API_TOKEN_KEY = "originshear_api_token";

function getToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token) {
  try {
    if (token) localStorage.setItem(API_TOKEN_KEY, token);
    else localStorage.removeItem(API_TOKEN_KEY);
  } catch {
    // no-op in non-browser contexts
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const apiClient = {
  get: (path, options) => request(path, { ...(options || {}), method: "GET" }),
  post: (path, body, options) => request(path, { ...(options || {}), method: "POST", body }),
  put: (path, body, options) => request(path, { ...(options || {}), method: "PUT", body }),
};
