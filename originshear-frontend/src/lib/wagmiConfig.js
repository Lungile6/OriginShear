import { http, createConfig } from "wagmi";
import { celo, hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_CELO_SEPOLIA_RPC_URL || "https://celo-sepolia.g.alchemy.com/v2/guusXcuDWSTypMk8NFB4_"],
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

export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo, hardhat],
  connectors: [
    injected({ target: "metaMask" }),
    injected(),
  ],
  transports: {
    [celoSepolia.id]: http(import.meta.env.VITE_CELO_SEPOLIA_RPC_URL || "https://celo-sepolia.g.alchemy.com/v2/guusXcuDWSTypMk8NFB4_"),
    [celo.id]:        http("https://forno.celo.org"),
    [hardhat.id]:     http("http://127.0.0.1:8545"),
  },
});

export const SUPPORTED_CHAIN_IDS = [celoSepolia.id, celo.id, hardhat.id];
export const DEFAULT_CHAIN_ID = celoSepolia.id;