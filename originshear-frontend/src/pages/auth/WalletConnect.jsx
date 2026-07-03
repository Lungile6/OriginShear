import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { useNetworkGuard } from "../../hooks/useNetworkGuard";
import { apiClient, setApiToken } from "../../lib/apiClient";

export default function WalletConnect() {
  const navigate = useNavigate();
  const { isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { isWrongNetwork } = useNetworkGuard();
  const [connectingId, setConnectingId] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!isConnected) return;
    if (isWrongNetwork) {
      navigate("/error/wrong-network", { replace: true });
      return;
    }
    navigate("/role-select", { replace: true });
  }, [isConnected, isWrongNetwork, navigate]);

  async function notifyWalletEvent({ event, connectorName, wallet, errorMessage }) {
    try {
      await apiClient.post("/api/auth/wallet-event", {
        event,
        connector: connectorName,
        wallet,
        error: errorMessage,
      });
    } catch {
      // Silent fail: connect flow should continue even if API is unavailable.
    }
  }

  async function authenticateApiSession(wallet) {
    try {
      const challenge = await apiClient.post("/api/auth/challenge", { wallet });

      const signature = await signMessageAsync({ message: challenge.message });

      const loginPayload = await apiClient.post("/api/auth/login", {
        wallet,
        nonce: challenge.nonce,
        signature,
      });
      if (loginPayload?.token) {
        setApiToken(loginPayload.token);
      }
    } catch {
      // Keep wallet UX resilient even if API auth is unavailable.
    }
  }

  function handleConnect(connector) {
    setLocalError("");

    setConnectingId(connector.uid);
    notifyWalletEvent({
      event: "connect_clicked",
      connectorName: connector.name,
    });
    connect(
      { connector },
      {
        onError: (err) => {
          setConnectingId(null);
          notifyWalletEvent({
            event: "connect_failed",
            connectorName: connector.name,
            errorMessage: err?.message || "Unknown wallet connection error",
          });
          const msg = err?.message?.toLowerCase?.() || "";
          if (msg.includes("provider not found")) {
            setLocalError(
              "Wallet provider not found. Open this app in a browser with MetaMask extension, or use Valora in-app browser."
            );
          }
        },
        onSuccess: (data) => {
          setConnectingId(null);
          notifyWalletEvent({
            event: "connect_success",
            connectorName: connector.name,
            wallet: data?.accounts?.[0],
          });
          authenticateApiSession(data?.accounts?.[0]).finally(() => {
            navigate("/role-select", { replace: true });
          });
        },
      }
    );
  }

  // Prefer explicit wallets (MetaMask first, Valora second).
  const uniqueConnectors = connectors.filter(
    (c, i) => connectors.findIndex((x) => x.id === c.id && x.name === c.name) === i
  );
  const metaMaskConnector = uniqueConnectors.find(
    (c) =>
      c.id === "metaMask" ||
      c.id === "metaMaskSDK" ||
      c.name.toLowerCase().includes("metamask")
  );
  const valoraConnector = uniqueConnectors.find((c) =>
    c.name.toLowerCase().includes("valora")
  );

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 border-b border-outline-variant">
        <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
        <button onClick={() => navigate(-1)} aria-label="Close" className="text-on-surface-variant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="flex-1 px-6 py-8 flex flex-col">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-8 w-8">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18M16 14h2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-headline-md font-bold">Connect your wallet</h1>
          <p className="text-body-sm text-on-surface-variant">Kopanya sepache sa hau</p>
        </div>

        <div className="space-y-3">
          {!metaMaskConnector && !valoraConnector && (
            <p className="text-body-sm text-on-surface-variant text-center">
              Wallet provider not detected yet. You can still tap Connect Wallet.
            </p>
          )}
          {metaMaskConnector && (
            <button
              key={metaMaskConnector.uid}
              onClick={() => handleConnect(metaMaskConnector)}
              disabled={isPending}
              className="w-full h-14 rounded-lg px-4 flex items-center justify-between font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 bg-primary text-on-primary"
            >
              <span className="flex items-center gap-2">
                {connectingId === metaMaskConnector.uid && isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {isPending && connectingId === metaMaskConnector.uid
                  ? "Connecting..."
                  : "Connect Wallet"}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {valoraConnector && (
            <button
              key={valoraConnector.uid}
              onClick={() => handleConnect(valoraConnector)}
              disabled={isPending}
              className="w-full h-12 rounded-lg px-4 flex items-center justify-between font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 bg-surface-container-lowest border border-outline-variant text-on-surface"
            >
              <span className="flex items-center gap-2">
                {connectingId === valoraConnector.uid && isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                Use Valora
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {(error || localError) && (
          <p className="mt-4 text-body-sm text-error text-center">
            {localError || error.message?.split("\n")[0] || "Connection failed. Please try again."}
          </p>
        )}
        {isConnected && chainId && isWrongNetwork && (
          <p className="mt-2 text-body-sm text-error text-center">
            Wrong network detected. Please switch to Celo Sepolia.
          </p>
        )}

        <div className="mt-6 rounded-lg bg-primary-container/30 border border-primary/20 p-4 flex gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-body-sm text-on-surface">Your keys never leave your device.</p>
            <p className="text-label-sm italic text-primary mt-0.5">
              Tšireletso ea hau ke ntho ea bohlokoa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
