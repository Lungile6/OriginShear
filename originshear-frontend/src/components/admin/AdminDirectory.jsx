import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ensureApiSession } from "../../lib/apiAuth";
import { apiClient } from "../../lib/apiClient";
import { shorten } from "../../lib/utils";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

function RoleTags({ user }) {
  const tags = [];
  if (user.isAdmin) tags.push("Admin");
  if (user.isFarmer) tags.push("Farmer");
  if (user.isValidator) tags.push("Validator");
  if (user.isGovernment) tags.push("Government");
  if (!tags.length) tags.push("Buyer");
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface-variant"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * Admin directory: who logged in + who applied for access.
 */
export default function AdminDirectory({ onSelectWallet }) {
  const { address } = useAccount();
  const [logins, setLogins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    try {
      await ensureApiSession(address);
      const [loginRes, reqRes] = await Promise.all([
        apiClient.get("/api/admin/logins", { auth: true }),
        apiClient.get("/api/access-requests?status=pending", { auth: true }),
      ]);
      setLogins(loginRes.data || []);
      setRequests(reqRes.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function markRequest(id, status) {
    try {
      await ensureApiSession(address);
      await apiClient.patch(`/api/access-requests/${id}`, { status }, { auth: true });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to update request");
    }
  }

  return (
    <div className="space-y-stack-md">
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">Access applications</h2>
            <p className="text-body-sm text-on-surface-variant">
              People who applied from pending/onboarding screens
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth={false}
            loading={loading}
            onClick={load}
            icon={<Icon name="refresh" />}
          >
            Refresh
          </Button>
        </div>

        {error && <p className="text-body-sm text-error mb-3">{error}</p>}

        {!loading && requests.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">No pending applications.</p>
        )}

        <ul className="space-y-3">
          {requests.map((req) => (
            <li
              key={req.id}
              className="rounded-xl border border-outline-variant bg-surface-container-low p-3"
            >
              <div className="flex justify-between gap-2 items-start">
                <div>
                  <p className="font-bold text-on-surface">{req.requestedRole}</p>
                  <code className="text-body-sm text-on-surface-variant">
                    {shorten(req.wallet, 8, 6)}
                  </code>
                  <p className="text-label-sm text-on-surface-variant mt-1">
                    Applied {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  fullWidth={false}
                  variant="navy"
                  onClick={() => onSelectWallet?.(req.wallet)}
                >
                  Manage
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  fullWidth={false}
                  variant="outline"
                  onClick={() => markRequest(req.id, "reviewed")}
                >
                  Mark reviewed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  fullWidth={false}
                  variant="primary"
                  onClick={() => markRequest(req.id, "approved")}
                >
                  Mark approved
                </Button>
                <Button
                  type="button"
                  size="sm"
                  fullWidth={false}
                  variant="outline-error"
                  onClick={() => markRequest(req.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-headline-sm font-bold text-on-surface mb-1">People who logged in</h2>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Wallets that signed in to the API, with live on-chain roles
        </p>

        {!loading && logins.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            No logins recorded yet. Users appear here after they connect and sign the API login
            challenge (e.g. farmer/validator/gov portals or Apply for access).
          </p>
        )}

        <ul className="space-y-3">
          {logins.map((user) => (
            <li
              key={user.wallet}
              className="rounded-xl border border-outline-variant bg-surface-container-low p-3"
            >
              <div className="flex justify-between gap-2 items-start">
                <div className="min-w-0">
                  <code className="text-body-sm font-semibold break-all">
                    {shorten(user.wallet, 8, 6)}
                  </code>
                  <RoleTags user={user} />
                  <p className="text-label-sm text-on-surface-variant mt-1">
                    Last login {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"} ·{" "}
                    {user.loginCount || 1} login{(user.loginCount || 1) === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  fullWidth={false}
                  variant="outline"
                  onClick={() => onSelectWallet?.(user.wallet)}
                >
                  Manage
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
