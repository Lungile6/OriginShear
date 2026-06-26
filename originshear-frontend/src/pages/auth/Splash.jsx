import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

export default function Splash() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) navigate("/role-select", { replace: true });
  }, [isConnected, navigate]);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-surface to-surface-container px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant flex items-center justify-center mb-8">
          <svg viewBox="0 0 64 64" className="w-16 h-16 text-primary" fill="currentColor">
            <path d="M32 6c-4 0-7 3-7 7 0 2 1 4 2.5 5.3L20 26.5a7 7 0 1 0 2 2L29.5 21c1 .6 2.2 1 3.5 1v0L19 38c-3.5-1-7.5.3-9.4 3.6a7 7 0 1 0 11 8.4l16-22.6 16 22.6a7 7 0 1 0 11-8.4c-1.9-3.3-5.9-4.6-9.4-3.6L40.5 22c1.3 0 2.5-.4 3.5-1l5.5 7.5a7 7 0 1 0 2-2L43 18.3C44.5 17 45.5 15 45.5 13c0-4-3-7-7-7-2.5 0-4.7 1.2-6 3.1C31.2 7.2 29 6 26.5 6" />
          </svg>
        </div>
        <h1 className="text-headline-lg font-bold text-primary uppercase tracking-tight mb-2">
          ORIGINSHEAR
        </h1>
        <p className="text-body-md text-on-surface-variant mb-8">Lesotho Wool &amp; Mohair Ledger</p>
        <p className="italic text-body-lg text-on-surface mb-1">"Rekota ea hau e sirelelitsoe"</p>
        <p className="text-body-sm text-on-surface-variant">Your record is protected</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => navigate("/connect")}
          className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold text-body-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18M16 14h2" strokeLinecap="round" />
          </svg>
          Connect Valora / MetaMask
        </button>
        <p className="text-center text-label-sm text-on-surface-variant">
          Powered by Celo · No fees for farmers
        </p>
      </div>
    </div>
  );
}
