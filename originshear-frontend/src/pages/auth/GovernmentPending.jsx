import { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { shorten } from "../../lib/utils";
import BilingualText from "../../components/ui/BilingualText";
import { SUPPORT, mailtoAdmin } from "../../lib/support";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

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
    queryClient.invalidateQueries();
  }

  return (
    <div className="min-h-dvh bg-background">
      <TopAppBar role="AUTH" />
      <div className="bg-role-government text-white px-margin-mobile pt-20 pb-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Icon name="account_balance" className="!text-3xl" />
        </div>
        <h1 className="text-headline-md font-bold mb-2">
          <BilingualText en="Government Access Pending" st="Kopo ea Mmuso e Emetseng" size="headline-md" className="text-white" />
        </h1>
        <p className="text-body-sm text-white/80">
          Your wallet is connected, but GOVERNMENT_ROLE on the Industry Mark Registry has not been assigned yet.
        </p>
      </div>

      <div className="px-margin-mobile -mt-6">
        <Card>
          <p className="text-label-md text-on-surface-variant uppercase mb-1">Your connected address</p>
          <div className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2.5 mb-4">
            <code className="text-body-sm">{address ? shorten(address, 6, 4) : "Not connected"}</code>
            <button onClick={handleCopy} className="text-primary text-label-sm font-semibold">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <a href={address ? mailtoAdmin(address) : undefined} className="block mb-3">
            <Button variant="primary" className="bg-role-government" icon={<Icon name="mail" />}>
              Send this address to your administrator
            </Button>
          </a>
          <p className="text-body-sm text-on-surface-variant text-center mb-4">
            Please share your Celo wallet address with the LNWMGA system admin to grant your administrative authorization.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <hr className="flex-1 border-outline-variant" />
            <span className="text-label-sm text-on-surface-variant">OR</span>
            <hr className="flex-1 border-outline-variant" />
          </div>

          <Button variant="outline" size="sm" onClick={handleCheckAgain} icon={<Icon name="refresh" />} className="mb-2">
            Check again
          </Button>
          <a
            href={`mailto:${SUPPORT.email}?subject=${encodeURIComponent("ORIGINSHEAR Government Support")}`}
            className="block"
          >
            <Button variant="ghost" size="sm">
              Contact Support
            </Button>
          </a>
        </Card>

        <div className="space-y-stack-md mt-stack-md mb-8">
          <InfoCard border="border-l-role-government" title="Compliance Policy" desc="Institutional access requires approval from the Ministry of Agriculture and registration in the compliance ledger." />
          <InfoCard border="border-l-error" title="Security Notice" desc="Do not share private keys. System admins only need the public address shown above to grant permissions." />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ border, title, desc }) {
  return (
    <Card className={`border-l-4 ${border}`}>
      <h3 className="font-bold text-on-surface mb-1">{title}</h3>
      <p className="text-body-sm text-on-surface-variant">{desc}</p>
    </Card>
  );
}
