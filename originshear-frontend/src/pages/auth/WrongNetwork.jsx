import { useNavigate } from "react-router-dom";
import { useAccount, useSwitchChain } from "wagmi";
import { celoSepolia } from "../../lib/wagmiConfig";

export default function WrongNetwork() {
  const navigate = useNavigate();
  const { chainId } = useAccount();
  const { switchChain, isPending, error } = useSwitchChain();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="flex items-center px-4 py-4 border-b border-outline-variant">
        <span className="text-headline-sm font-bold text-primary uppercase">ORIGINSHEAR</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-sm border-t-4 border-t-role-validator border border-outline-variant p-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container flex items-center justify-center mb-4 relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-error">
              <path d="M9 9a4 4 0 1 1 5 5M15 15l-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-headline-md font-bold mb-2">Wrong Network</h1>
          <p className="text-body-md text-on-surface-variant mb-6">
            Your wallet is connected to the wrong network.{" "}
            <span className="font-semibold text-on-surface">ORIGINSHEAR</span> runs on Celo Sepolia.
          </p>

          <button
            onClick={() => switchChain({ chainId: celoSepolia.id })}
            disabled={isPending}
            className="w-full h-14 rounded-lg bg-role-validator text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M7 7h10l-3-3M17 17H7l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Switch to Celo Sepolia
          </button>

          <button
            onClick={() => navigate("/help/network")}
            className="mt-3 text-body-sm font-semibold text-primary inline-flex items-center gap-1"
          >
            How to switch manually
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <hr className="my-5 border-outline-variant" />

          <p className="text-label-md text-on-surface-variant uppercase tracking-wide mb-2">
            Technical details
          </p>
          <div className="bg-surface-container rounded-lg p-3 text-left">
            <code className="text-label-sm text-on-surface-variant font-mono block">
              ERROR_CODE: 0x403_INVALID_CHAIN_ID
            </code>
            <code className="text-label-sm text-on-surface-variant font-mono block">
              CURRENT: {chainId ?? "unknown"} · EXPECTED: 11142220 (Celo Sepolia)
            </code>
          </div>

          {error && (
            <p className="mt-3 text-body-sm text-error">{error.message?.split("\n")[0]}</p>
          )}
        </div>
      </div>
    </div>
  );
}