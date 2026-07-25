import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { useNetworkGuard } from "../../hooks/useNetworkGuard";
import { DEFAULT_CHAIN } from "../../lib/wagmiConfig";
import { authenticateApiSession } from "../../lib/apiAuth";
import { apiClient } from "../../lib/apiClient";
import TopAppBar from "../../components/nav/TopAppBar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";

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
      // Silent fail
    }
  }

  async function authenticateApiSessionForWallet(wallet) {
    try {
      await authenticateApiSession(wallet, signMessageAsync);
    } catch (err) {
      setLocalError(
        err?.message ||
          "Wallet connected but API sign-in failed. You can retry from any protected screen."
      );
    }
  }

  function handleConnect(connector) {
    setLocalError("");
    setConnectingId(connector.uid);
    notifyWalletEvent({ event: "connect_clicked", connectorName: connector.name });
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
          authenticateApiSessionForWallet(data?.accounts?.[0]).finally(() => {
            navigate("/role-select", { replace: true });
          });
        },
      }
    );
  }

  const uniqueConnectors = connectors.filter(
    (c, i) => connectors.findIndex((x) => x.id === c.id && x.name === c.name) === i
  );
  const metaMaskConnector = uniqueConnectors.find(
    (c) =>
      c.id === "metaMask" ||
      c.id === "metaMaskSDK" ||
      c.id === "io.metamask" ||
      c.name.toLowerCase().includes("metamask")
  );
  const valoraConnector = uniqueConnectors.find((c) => c.name.toLowerCase().includes("valora"));
  const walletConnectConnector = uniqueConnectors.find(
    (c) => c.id === "walletConnect" || c.name.toLowerCase().includes("walletconnect")
  );

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <TopAppBar role="AUTH" />

      <div className="flex-1 px-margin-mobile py-8 pt-20 flex flex-col max-w-md mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Icon name="account_balance_wallet" className="text-on-primary !text-3xl" />
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
            <Button
              key={metaMaskConnector.uid}
              onClick={() => handleConnect(metaMaskConnector)}
              disabled={isPending}
              loading={connectingId === metaMaskConnector.uid && isPending}
              icon={<Icon name="arrow_forward" />}
              iconPosition="right"
            >
              {isPending && connectingId === metaMaskConnector.uid ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          {valoraConnector && (
            <Button
              key={valoraConnector.uid}
              variant="outline"
              onClick={() => handleConnect(valoraConnector)}
              disabled={isPending}
              loading={connectingId === valoraConnector.uid && isPending}
              icon={<Icon name="arrow_forward" />}
              iconPosition="right"
            >
              Use Valora
            </Button>
          )}
          {walletConnectConnector && (
            <Button
              key={walletConnectConnector.uid}
              variant="outline"
              onClick={() => handleConnect(walletConnectConnector)}
              disabled={isPending}
              loading={connectingId === walletConnectConnector.uid && isPending}
              icon={<Icon name="qr_code_2" />}
              iconPosition="right"
            >
              WalletConnect (Valora / mobile)
            </Button>
          )}
          {!walletConnectConnector && (
            <p className="text-label-sm text-on-surface-variant text-center">
              Set VITE_WALLETCONNECT_PROJECT_ID to enable WalletConnect for mobile Valora.
            </p>
          )}
        </div>

        {(error || localError) && (
          <p className="mt-4 text-body-sm text-error text-center">
            {localError || error.message?.split("\n")[0] || "Connection failed. Please try again."}
          </p>
        )}
        {isConnected && chainId && isWrongNetwork && (
          <p className="mt-2 text-body-sm text-error text-center">
            Wrong network detected. Please switch to {DEFAULT_CHAIN.name}.
          </p>
        )}

        <Card className="mt-6 bg-primary-container/30 border-primary/20 flex gap-3" padded>
          <Icon name="shield" className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm text-on-surface">Your keys never leave your device.</p>
            <p className="text-label-sm italic text-primary mt-0.5">
              Tšireletso ea hau ke ntho ea bohlokoa.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
