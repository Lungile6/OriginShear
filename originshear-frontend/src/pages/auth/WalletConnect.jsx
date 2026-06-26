import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect } from "wagmi";

export default function WalletConnect() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const [connectingId, setConnectingId] = useState(null);

  useEffect(() => {
    if (isConnected) navigate("/role-select", { replace: true });
  }, [isConnected, navigate]);

  function handleConnect(connector) {
    setConnectingId(connector.uid);
    connect(
      { connector },
      {
        onError: () => setConnectingId(null),
        onSuccess: () => navigate("/role-select", { replace: true }),
      }
    );
  }

  // De-duplicate the generic "injected" fallback if MetaMask is also present,
  // and label them per the Stitch design (Valora / MetaMask).
  const primaryConnectors = connectors.filter((c, i) => connectors.findIndex((x) => x.name === c.name) === i);

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
          {primaryConnectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className={`w-full h-14 rounded-lg px-4 flex items-center justify-between font-semibold transition-transform active:scale-[0.98] disabled:opacity-60 ${
                connector.name.toLowerCase().includes("metamask")
                  ? "bg-surface-container-lowest border border-outline-variant text-on-surface"
                  : "bg-primary text-on-primary"
              }`}
            >
              <span className="flex items-center gap-2">
                {connectingId === connector.uid && isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {connector.name}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-body-sm text-error text-center">
            {error.message?.split("\n")[0] || "Connection failed. Please try again."}
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
