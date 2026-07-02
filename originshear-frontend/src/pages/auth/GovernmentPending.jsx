import { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";

export default function GovernmentPending() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCheckAgain() {
    // Recheck roles on-chain
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-role-government text-white px-6 pt-10 pb-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
            <path d="M4 10h16M6 10v9M18 10v9M3 19h18M12 3l8 4H4l8-4Z" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-headline-md font-bold mb-2">
          <BilingualText en="Government Access Pending" st="Kopo ea Mmuso e Emetseng" size="headline-md" className="text-white" />
        </h1>
        <p className="text-body-sm text-white/80">
          Your wallet is connected, but GOVERNMENT_ROLE on the Industry Mark Registry has not been assigned yet.
        </p>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5">
          <p className="text-label-md text-on-surface-variant uppercase mb-1">Your connected address</p>
          <div className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5 mb-4">
            <code className="text-body-sm">{address ? shorten(address, 6, 4) : "Not connected"}</code>
            <button onClick={handleCopy} className="text-primary text-label-sm font-semibold">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <button className="w-full h-12 rounded-lg bg-role-government text-white font-semibold mb-3 flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M3 8l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            </svg>
            Send this address to your administrator
          </button>
          <p className="text-body-sm text-on-surface-variant text-center mb-4">
            Please share your Celo wallet address with the LNWMGA system admin to grant your administrative authorization.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <hr className="flex-1 border-outline-variant" />
            <span className="text-label-sm text-on-surface-variant">OR</span>
            <hr className="flex-1 border-outline-variant" />
          </div>

          <button
            onClick={handleCheckAgain}
            className="w-full h-11 rounded-lg border border-primary text-primary font-semibold mb-2 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M4 4v5h.6M20 20v-5h-.6M4 9a8 8 0 0 1 14.5-3.5M20 15a8 8 0 0 1-14.5 3.5" strokeLinecap="round" />
            </svg>
            Check again
          </button>
          <button className="w-full h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold">
            Contact Support
          </button>
        </div>

        <div className="space-y-3 mt-4 mb-8">
          <InfoCard
            border="border-l-role-government"
            title="Compliance Policy"
            desc="Institutional access requires approval from the Ministry of Agriculture and registration in the compliance ledger."
          />
          <InfoCard
            border="border-l-error"
            title="Security Notice"
            desc="Do not share private keys. System admins only need the public address shown above to grant permissions."
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ border, title, desc }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant border-l-4 ${border} p-4`}>
      <h3 className="font-bold text-on-surface mb-1">{title}</h3>
      <p className="text-body-sm text-on-surface-variant">{desc}</p>
    </div>
  );
}
