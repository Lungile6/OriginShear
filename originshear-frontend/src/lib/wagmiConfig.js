import { http, createConfig } from "wagmi";
import { celo, hardhat } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

const DEFAULT_CELO_SEPOLIA_RPC_URL =
  import.meta.env.VITE_CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
const DEFAULT_CELO_RPC_URL =
  import.meta.env.VITE_CELO_RPC_URL || "https://forno.celo.org";

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

/** Active app network: celoSepolia (default) or celo */
export const CHAIN_NETWORK = (() => {
  const raw = (import.meta.env.VITE_CHAIN_NETWORK || "celoSepolia").trim();
  if (raw === "celo" || raw === "mainnet") return "celo";
  return "celoSepolia";
})();

export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: [DEFAULT_CELO_SEPOLIA_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
});

const connectors = [
  // Use injected MetaMask instead of metaMask() to avoid the ~570 KB @metamask/connect-evm SDK bundle.
  injected({
    target: "metaMask",
    unstable_shimAsyncInject: 1500,
  }),
  injected({
    target: {
      id: "valora",
      name: "Valora",
      provider(window) {
        const ethereum = window?.ethereum;
        if (!ethereum) return undefined;
        if (Array.isArray(ethereum.providers)) {
          return ethereum.providers.find((p) => p?.isValora);
        }
        return ethereum.isValora ? ethereum : undefined;
      },
    },
    unstable_shimAsyncInject: 1500,
  }),
  injected({ unstable_shimAsyncInject: 1500 }),
];

// Optional WalletConnect — enables Valora / mobile wallets outside the in-app browser.
if (WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: "ORIGINSHEAR",
        description: "Lesotho wool & mohair proof of origin marketplace",
        url: typeof window !== "undefined" ? window.location.origin : "https://originshear.ls",
        icons: ["https://originshear.ls/icon.png"],
      },
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo, hardhat],
  connectors,
  transports: {
    [celoSepolia.id]: http(DEFAULT_CELO_SEPOLIA_RPC_URL),
    [celo.id]: http(DEFAULT_CELO_RPC_URL),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

export const SUPPORTED_CHAIN_IDS = [celoSepolia.id, celo.id, hardhat.id];
export const DEFAULT_CHAIN_ID = CHAIN_NETWORK === "celo" ? celo.id : celoSepolia.id;
export const DEFAULT_CHAIN = CHAIN_NETWORK === "celo" ? celo : celoSepolia;
