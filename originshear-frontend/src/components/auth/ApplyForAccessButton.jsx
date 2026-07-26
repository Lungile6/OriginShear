import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ensureApiSession } from "../../lib/apiAuth";
import { apiClient } from "../../lib/apiClient";
import Button from "../ui/Button";
import Icon from "../ui/Icon";

/**
 * Lets a connected wallet apply for Farmer / Validator / Government access.
 * Shows up in Admin → Access applications.
 */
export default function ApplyForAccessButton({
  requestedRole,
  variant = "primary",
  label = "Apply for access in Admin panel",
}) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleApply() {
    if (!address) {
      setError("Connect your wallet first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await ensureApiSession(address, signMessageAsync);
      await apiClient.post(
        "/api/access-requests",
        { requestedRole, note: `Applied from ${requestedRole} pending screen` },
        { auth: true }
      );
      setMessage("Application submitted. An administrator can see it in Admin Access.");
    } catch (err) {
      setError(err?.message || "Could not submit application");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3">
      <Button
        type="button"
        variant={variant}
        loading={busy}
        onClick={handleApply}
        icon={<Icon name="how_to_reg" />}
      >
        {label}
      </Button>
      {message && <p className="text-body-sm text-role-farmer mt-2 text-center">{message}</p>}
      {error && <p className="text-body-sm text-error mt-2 text-center">{error}</p>}
    </div>
  );
}
