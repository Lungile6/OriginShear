// Contract addresses per network.
//
// HarvestLedger / FarmerMarket / ProofOfOriginVerifier addresses come from
// originshear-contracts/deployments.<network>.json after deploy.
// Run `npm run sync:addresses <network>` from the repo root to update .env.
//
// cUSD addresses are Celo's real stablecoin token and do not change.
export const CUSD_ADDRESSES = {
  44787: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Celo mainnet
};

export const CONTRACT_ADDRESSES = {
  // Celo Alfajores testnet (chainId 44787)
  44787: {
    harvestLedger: import.meta.env.VITE_ALFAJORES_HARVEST_LEDGER || "0x0000000000000000000000000000000000000000",
    farmerMarket: import.meta.env.VITE_ALFAJORES_FARMER_MARKET || "0x0000000000000000000000000000000000000000",
    verifier: import.meta.env.VITE_ALFAJORES_VERIFIER || "0x0000000000000000000000000000000000000000",
    cUSD: CUSD_ADDRESSES[44787],
  },
  // Celo mainnet (chainId 42220)
  42220: {
    harvestLedger: import.meta.env.VITE_CELO_HARVEST_LEDGER || "0x0000000000000000000000000000000000000000",
    farmerMarket: import.meta.env.VITE_CELO_FARMER_MARKET || "0x0000000000000000000000000000000000000000",
    verifier: import.meta.env.VITE_CELO_VERIFIER || "0x0000000000000000000000000000000000000000",
    cUSD: CUSD_ADDRESSES[42220],
  },
  // Local Hardhat node (chainId 31337) — for development only.
  31337: {
    harvestLedger: import.meta.env.VITE_LOCAL_HARVEST_LEDGER || "0x0000000000000000000000000000000000000000",
    farmerMarket: import.meta.env.VITE_LOCAL_FARMER_MARKET || "0x0000000000000000000000000000000000000000",
    verifier: import.meta.env.VITE_LOCAL_VERIFIER || "0x0000000000000000000000000000000000000000",
    cUSD: import.meta.env.VITE_LOCAL_MOCK_CUSD || "0x0000000000000000000000000000000000000000",
  },
};

export function getContractAddresses(chainId) {
  return CONTRACT_ADDRESSES[chainId] ?? null;
}
