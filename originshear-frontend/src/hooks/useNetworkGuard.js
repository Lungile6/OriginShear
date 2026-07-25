import { useAccount, useSwitchChain } from "wagmi";
import { DEFAULT_CHAIN } from "../lib/wagmiConfig";

const TARGET_CHAIN_PARAMS = {
  chainId: `0x${DEFAULT_CHAIN.id.toString(16)}`,
  chainName: DEFAULT_CHAIN.name,
  nativeCurrency: DEFAULT_CHAIN.nativeCurrency,
  rpcUrls: DEFAULT_CHAIN.rpcUrls.default.http,
  blockExplorerUrls: [DEFAULT_CHAIN.blockExplorers.default.url],
};

/**
 * Shared network guard for the active app chain (Sepolia or mainnet via VITE_CHAIN_NETWORK).
 * Attempts switch first, then falls back to wallet_addEthereumChain when missing.
 */
export function useNetworkGuard() {
  const { chainId } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const isWrongNetwork = Boolean(chainId) && chainId !== DEFAULT_CHAIN.id;

  async function fixNetwork() {
    try {
      await switchChainAsync({ chainId: DEFAULT_CHAIN.id });
      return { ok: true };
    } catch (err) {
      const code = err?.cause?.code ?? err?.code;
      if (code === 4902 && window?.ethereum?.request) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [TARGET_CHAIN_PARAMS],
          });
          await switchChainAsync({ chainId: DEFAULT_CHAIN.id });
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
