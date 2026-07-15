import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ensureApiSession, getApiTokenForWallet, clearApiToken } from "../lib/apiAuth";

/**
 * Ensures a valid JWT exists whenever a wallet is connected on protected screens.
 */
export function useApiAuth({ enabled = true } = {}) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!enabled || !isConnected || !address) {
      setAuthError("");
      return;
    }

    let cancelled = false;
    setIsAuthenticating(true);
    setAuthError("");

    ensureApiSession(address, signMessageAsync)
      .catch((err) => {
        if (!cancelled) {
          clearApiToken();
          setAuthError(err?.message || "Could not sign in to the API. Protected actions may fail.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsAuthenticating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isConnected, address, signMessageAsync]);

  return { authError, isAuthenticating, hasToken: Boolean(getApiTokenForWallet(address)) };
}
