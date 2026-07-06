import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";

export default function Splash() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) navigate("/role-select", { replace: true });
  }, [isConnected, navigate]);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-surface to-surface-container">
      <TopAppBar role="AUTH" />
      <div className="flex-1 flex flex-col px-margin-mobile py-12 pt-20">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant flex items-center justify-center mb-8">
            <Icon name="grass" className="text-primary !text-6xl" />
          </div>
          <h1 className="text-headline-lg font-bold text-primary uppercase tracking-tight mb-2">
            ORIGINSHEAR
          </h1>
          <p className="text-body-md text-on-surface-variant mb-8">Lesotho Wool &amp; Mohair Ledger</p>
          <p className="italic text-body-lg text-on-surface mb-1">"Rekota ea hau e sirelelitsoe"</p>
          <p className="text-body-sm text-on-surface-variant">Your record is protected</p>
        </div>

        <div className="space-y-4">
          <Button size="lg" onClick={() => navigate("/connect")} icon={<Icon name="account_balance_wallet" />}>
            Connect Valora / MetaMask
          </Button>
          <p className="text-center text-label-sm text-on-surface-variant">
            Powered by Celo · No fees for wool & mohair farmers
          </p>
        </div>
      </div>
    </div>
  );
}
