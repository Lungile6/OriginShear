const crypto = require("crypto");
const { readJson, writeJson } = require("./jsonStore");

const LOGINS_FILE = "logins.json";
const REQUESTS_FILE = "access-requests.json";

const EMPTY_LOGINS = { users: {} };
const EMPTY_REQUESTS = { requests: [] };

/**
 * Upsert a wallet that has successfully logged in (API SIWE challenge).
 */
function recordLogin({ wallet, roles = [], primaryRole = "BUYER", roleFlags = {} }) {
  if (!wallet) return null;
  const key = wallet.toLowerCase();
  const store = readJson(LOGINS_FILE, EMPTY_LOGINS);
  const now = new Date().toISOString();
  const prev = store.users[key] || {
    wallet: key,
    firstLoginAt: now,
    loginCount: 0,
  };

  store.users[key] = {
    ...prev,
    wallet: key,
    roles: Array.isArray(roles) ? roles : prev.roles || ["BUYER"],
    primaryRole: primaryRole || prev.primaryRole || "BUYER",
    isFarmer: Boolean(roleFlags.isFarmer),
    isValidator: Boolean(roleFlags.isValidator),
    isGovernment: Boolean(roleFlags.isGovernment),
    isAdmin: Boolean(roleFlags.isAdmin),
    lastLoginAt: now,
    loginCount: Number(prev.loginCount || 0) + 1,
    firstLoginAt: prev.firstLoginAt || now,
  };

  writeJson(LOGINS_FILE, store);
  return store.users[key];
}

function listLogins() {
  const store = readJson(LOGINS_FILE, EMPTY_LOGINS);
  return Object.values(store.users || {}).sort((a, b) =>
    String(b.lastLoginAt || "").localeCompare(String(a.lastLoginAt || ""))
  );
}

/**
 * Create or refresh a pending access application for a wallet + requested role.
 */
function upsertAccessRequest({ wallet, requestedRole, note = "" }) {
  const role = String(requestedRole || "").toUpperCase();
  if (!["FARMER", "VALIDATOR", "GOVERNMENT"].includes(role)) {
    const err = new Error("requestedRole must be FARMER, VALIDATOR, or GOVERNMENT");
    err.status = 400;
    throw err;
  }
  if (!wallet) {
    const err = new Error("wallet required");
    err.status = 400;
    throw err;
  }

  const key = wallet.toLowerCase();
  const store = readJson(REQUESTS_FILE, EMPTY_REQUESTS);
  const now = new Date().toISOString();

  const existing = (store.requests || []).find(
    (r) =>
      r.wallet === key &&
      r.requestedRole === role &&
      (r.status === "pending" || r.status === "reviewed")
  );

  if (existing) {
    existing.note = note || existing.note || "";
    existing.updatedAt = now;
    existing.status = "pending";
    writeJson(REQUESTS_FILE, store);
    return existing;
  }

  const request = {
    id: crypto.randomBytes(8).toString("hex"),
    wallet: key,
    requestedRole: role,
    note: String(note || "").slice(0, 500),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.requests.unshift(request);
  writeJson(REQUESTS_FILE, store);
  return request;
}

function listAccessRequests({ status } = {}) {
  const store = readJson(REQUESTS_FILE, EMPTY_REQUESTS);
  let rows = store.requests || [];
  if (status) {
    rows = rows.filter((r) => r.status === status);
  }
  return rows.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

function updateAccessRequestStatus(id, status, adminWallet) {
  const allowed = ["pending", "reviewed", "approved", "rejected"];
  if (!allowed.includes(status)) {
    const err = new Error(`status must be one of ${allowed.join(", ")}`);
    err.status = 400;
    throw err;
  }
  const store = readJson(REQUESTS_FILE, EMPTY_REQUESTS);
  const row = (store.requests || []).find((r) => r.id === id);
  if (!row) {
    const err = new Error("Access request not found");
    err.status = 404;
    throw err;
  }
  row.status = status;
  row.updatedAt = new Date().toISOString();
  row.reviewedBy = adminWallet ? adminWallet.toLowerCase() : row.reviewedBy || null;
  writeJson(REQUESTS_FILE, store);
  return row;
}

module.exports = {
  recordLogin,
  listLogins,
  upsertAccessRequest,
  listAccessRequests,
  updateAccessRequestStatus,
};
