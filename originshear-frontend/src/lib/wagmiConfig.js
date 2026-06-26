import { http, createConfig } from "wagmi";
import { celo, celoAlfajores, hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// ORIGINSHEAR runs on Celo. We support:
//  - Celo mainnet (production)
//  - Celo Alfajores (testnet — primary target during the pilot)
//  - Local Hardhat node (development only)
//
// Wallet connection uses the injected connector, which covers MetaMask
// and Valora's in-app browser (both inject window.ethereum).
export const wagmiConfig = createConfig({
  chains: [celoAlfajores, celo, hardhat],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(), // generic fallback — also covers Valora's injected provider
  ],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

export const SUPPORTED_CHAIN_IDS = [celoAlfajores.id, celo.id, hardhat.id];
export const DEFAULT_CHAIN_ID = celoAlfajores.id;
