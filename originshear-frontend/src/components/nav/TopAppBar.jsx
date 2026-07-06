import { useAccount, useDisconnect } from "wagmi";
import { useNavigate } from "react-router-dom";
import { shorten } from "../../lib/utils";
import AppMenu from "./AppMenu";

export default function TopAppBar({ title = "ORIGINSHEAR", role = "AUTH" }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40">
      <div className="flex justify-between items-center px-4 py-2.5 max-w-[1024px] mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          <AppMenu role={role} />
          <span className="text-headline-sm font-bold text-primary uppercase tracking-tight truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isConnected ? (
            <button
              type="button"
              onClick={() => disconnect()}
              className="flex items-center gap-2 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-semibold text-on-surface-variant"
              title="Disconnect wallet"
            >
              <span className="h-2 w-2 rounded-full bg-primary" />
              {shorten(address)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/connect")}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-label-sm font-semibold text-on-primary"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M3 10h18M16 14h2" strokeLinecap="round" />
              </svg>
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
