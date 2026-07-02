import { useAccount, useSwitchChain } from "wagmi";
import { celoSepolia } from "../lib/wagmiConfig";

const CELO_SEPOLIA_PARAMS = {
  chainId: `0x${celoSepolia.id.toString(16)}`,
  chainName: celoSepolia.name,
  nativeCurrency: celoSepolia.nativeCurrency,
  rpcUrls: celoSepolia.rpcUrls.default.http,
  blockExplorerUrls: [celoSepolia.blockExplorers.default.url],
};

/**
 * Shared network guard for Celo Sepolia.
 * Attempts switch first, then falls back to wallet_addEthereumChain when missing.
 */
export function useNetworkGuard() {
  const { chainId } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const isWrongNetwork = Boolean(chainId) && chainId !== celoSepolia.id;

  async function fixNetwork() {
    try {
      await switchChainAsync({ chainId: celoSepolia.id });
      return { ok: true };
    } catch (err) {
      const code = err?.cause?.code ?? err?.code;
      if (code === 4902 && window?.ethereum?.request) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CELO_SEPOLIA_PARAMS],
          });
          await switchChainAsync({ chainId: celoSepolia.id });
          return { ok: true };
        } catch (addErr) {
          return { ok: false, error: addErr };
        }
      }
      return { ok: false, error: err };
    }
  }

  return { isWrongNetwork, fixNetwork, isSwitchingNetwork: isPending };
}
