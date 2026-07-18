import { useAccount, useDisconnect } from "wagmi";
import { useNavigate } from "react-router-dom";
import { shorten } from "../../lib/utils";
import Icon from "../ui/Icon";
import AppMenu from "./AppMenu";

export default function TopAppBar({ title = "ORIGINSHEAR", role = "AUTH" }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1024px] items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <AppMenu role={role} />
          <button
            type="button"
            onClick={() => navigate(homeForRole(role))}
            className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 transition-opacity active:opacity-70"
            aria-label="Go home"
          >
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary sm:flex">
              <Icon name="grass" size={18} />
            </span>
            <span className="truncate text-headline-sm font-bold uppercase tracking-tight text-primary">
              {title}
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              onClick={() => disconnect()}
              className="flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-low px-3 py-1.5 text-label-sm font-semibold text-on-surface-variant transition-colors active:bg-surface-container"
              title="Disconnect wallet"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {shorten(address)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/connect")}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-label-sm font-semibold text-on-primary shadow-sm transition-transform active:scale-[0.98]"
            >
              <Icon name="account_balance_wallet" size={16} />
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function homeForRole(role) {
  switch (role) {
    case "FARMER":
      return "/farmer";
    case "VALIDATOR":
      return "/validator";
    case "GOVERNMENT":
      return "/government";
    case "BUYER":
      return "/buyer";
    default:
      return "/";
  }
}
