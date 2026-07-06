import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useNetworkGuard } from "../../hooks/useNetworkGuard";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

export default function WrongNetwork() {
  const navigate = useNavigate();
  const { chainId } = useAccount();
  const { fixNetwork, isSwitchingNetwork } = useNetworkGuard();
  const [switchError, setSwitchError] = useState(null);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <TopAppBar role="AUTH" />

      <div className="flex-1 flex items-center justify-center px-margin-mobile pt-14">
        <Card className="w-full max-w-sm border-t-4 border-t-role-validator text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container flex items-center justify-center mb-4">
            <Icon name="wifi_off" className="text-error !text-3xl" />
          </div>
          <h1 className="text-headline-md font-bold mb-2">Wrong Network</h1>
          <p className="text-body-md text-on-surface-variant mb-6">
            Your wallet is connected to the wrong network.{" "}
            <span className="font-semibold text-on-surface">ORIGINSHEAR</span> runs on Celo Sepolia.
          </p>

          <Button
            variant="navy"
            size="lg"
            onClick={async () => {
              setSwitchError(null);
              const result = await fixNetwork();
              if (!result.ok) setSwitchError(result.error);
            }}
            disabled={isSwitchingNetwork}
            loading={isSwitchingNetwork}
            icon={<Icon name="swap_horiz" />}
          >
            Switch to Celo Sepolia
          </Button>

          <button
            onClick={() => navigate("/help/network")}
            className="mt-3 text-body-sm font-semibold text-primary inline-flex items-center gap-1"
          >
            How to switch manually
            <Icon name="arrow_forward" className="!text-base" />
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

          {switchError && (
            <p className="mt-3 text-body-sm text-error">{switchError.message?.split("\n")[0]}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
