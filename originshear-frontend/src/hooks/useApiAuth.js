import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  ensureApiSession,
  getApiTokenForWallet,
  clearApiToken,
  hasValidApiSession,
} from "../lib/apiAuth";

/**
 * Tracks API JWT state for protected screens.
 * Never auto-prompts the wallet — user must click Sign in.
 */
export function useApiAuth({ enabled = true } = {}) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (!enabled || !isConnected || !address) {
      setAuthError("");
      setHasToken(false);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);
    setAuthError("");

    hasValidApiSession(address)
      .then((valid) => {
        if (!cancelled) setHasToken(valid);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isConnected, address]);

  async function signIn() {
    if (!address) {
      setAuthError("Connect your wallet first.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");
    try {
      await ensureApiSession(address, signMessageAsync);
      setHasToken(true);
    } catch (err) {
      clearApiToken();
      setHasToken(false);
      setAuthError(err?.message || "Could not sign in to the API. Protected actions may fail.");
    } finally {
      setIsAuthenticating(false);
    }
  }

  const needsSignIn = Boolean(enabled && isConnected && address && !hasToken && !isChecking);

  return {
    authError,
    isAuthenticating,
    isChecking,
    hasToken: hasToken || Boolean(getApiTokenForWallet(address)),
    needsSignIn,
    signIn,
  };
}
