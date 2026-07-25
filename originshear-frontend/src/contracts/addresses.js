export const TOKEN_ADDRESSES = {
  11155111: "0x71660c4005BA85c37ccec55d0C4493E66Fe775d3", // Sepolia USDC
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Celo mainnet cUSD
  11142220: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b", // Celo Sepolia cUSD (Mento)
};

const ZERO = "0x0000000000000000000000000000000000000000";

function celoSepoliaAddresses() {
  return {
    harvestLedger: import.meta.env.VITE_CELO_SEPOLIA_HARVEST_LEDGER || "0x617451963A2ae2B143311094fF5F921a4B169B43",
    farmerMarket: import.meta.env.VITE_CELO_SEPOLIA_FARMER_MARKET || "0x3675Db5F51917D55A3D9E96AdD137b314633b003",
    verifier: import.meta.env.VITE_CELO_SEPOLIA_VERIFIER || "0x08A5c3E305b8eD5C38b4a6FEF51901D0c30D72Ab",
    industryMarkRegistry:
      import.meta.env.VITE_CELO_SEPOLIA_INDUSTRY_MARK_REGISTRY || "0x084E3c8427203C698f26d4eF34348a4B19041734",
    newsBulletin: import.meta.env.VITE_CELO_SEPOLIA_NEWS_BULLETIN || "0x693AC50d8e320b3A5a513454830beA1A3698FD9e",
    gasSubsidyPool: import.meta.env.VITE_CELO_SEPOLIA_GAS_SUBSIDY_POOL || "0x35BD9a4dfCE2e083C50Ab35F656822F43d761057",
    disputeResolution:
      import.meta.env.VITE_CELO_SEPOLIA_DISPUTE_RESOLUTION || "0x845FFC244316182E76Fa8cc385470cDb1a19984A",
    reputationSystem:
      import.meta.env.VITE_CELO_SEPOLIA_REPUTATION_SYSTEM || "0xb6A347E3d2B02198feDC2c67C672029b4F2adCD1",
    priceOracle: import.meta.env.VITE_CELO_SEPOLIA_PRICE_ORACLE || "0x0492e4a509e2dA225555612EA747E85A16644e29",
    multiSigTreasury:
      import.meta.env.VITE_CELO_SEPOLIA_MULTI_SIG_TREASURY || "0xC74E84E8e16300f5bCDD5Ba29199Ae8D7F72ee00",
    token: TOKEN_ADDRESSES[11142220],
  };
}

function celoMainnetAddresses() {
  return {
    harvestLedger: import.meta.env.VITE_CELO_HARVEST_LEDGER || ZERO,
    farmerMarket: import.meta.env.VITE_CELO_FARMER_MARKET || ZERO,
    verifier: import.meta.env.VITE_CELO_VERIFIER || ZERO,
    industryMarkRegistry: import.meta.env.VITE_CELO_INDUSTRY_MARK_REGISTRY || ZERO,
    newsBulletin: import.meta.env.VITE_CELO_NEWS_BULLETIN || ZERO,
    gasSubsidyPool: import.meta.env.VITE_CELO_GAS_SUBSIDY_POOL || ZERO,
    disputeResolution: import.meta.env.VITE_CELO_DISPUTE_RESOLUTION || ZERO,
    reputationSystem: import.meta.env.VITE_CELO_REPUTATION_SYSTEM || ZERO,
    priceOracle: import.meta.env.VITE_CELO_PRICE_ORACLE || ZERO,
    multiSigTreasury: import.meta.env.VITE_CELO_MULTI_SIG_TREASURY || ZERO,
    token: TOKEN_ADDRESSES[42220],
  };
}

export const CONTRACT_ADDRESSES = {
  // Celo Sepolia — ACTIVE DEPLOYMENT
  11142220: celoSepoliaAddresses(),
  // Sepolia testnet
  11155111: {
    harvestLedger: import.meta.env.VITE_SEPOLIA_HARVEST_LEDGER || ZERO,
    farmerMarket: import.meta.env.VITE_SEPOLIA_FARMER_MARKET || ZERO,
    verifier: import.meta.env.VITE_SEPOLIA_VERIFIER || ZERO,
    industryMarkRegistry: import.meta.env.VITE_SEPOLIA_INDUSTRY_MARK_REGISTRY || ZERO,
    newsBulletin: ZERO,
    gasSubsidyPool: ZERO,
    disputeResolution: ZERO,
    reputationSystem: ZERO,
    priceOracle: ZERO,
    multiSigTreasury: ZERO,
    token: TOKEN_ADDRESSES[11155111],
  },
  // Celo mainnet
  42220: celoMainnetAddresses(),
  // Local Hardhat
  31337: {
    harvestLedger: import.meta.env.VITE_LOCAL_HARVEST_LEDGER || ZERO,
    farmerMarket: import.meta.env.VITE_LOCAL_FARMER_MARKET || ZERO,
    verifier: import.meta.env.VITE_LOCAL_VERIFIER || ZERO,
    industryMarkRegistry: import.meta.env.VITE_LOCAL_INDUSTRY_MARK_REGISTRY || ZERO,
    newsBulletin: import.meta.env.VITE_LOCAL_NEWS_BULLETIN || ZERO,
    gasSubsidyPool: import.meta.env.VITE_LOCAL_GAS_SUBSIDY_POOL || ZERO,
    disputeResolution: import.meta.env.VITE_LOCAL_DISPUTE_RESOLUTION || ZERO,
    reputationSystem: import.meta.env.VITE_LOCAL_REPUTATION_SYSTEM || ZERO,
    priceOracle: import.meta.env.VITE_LOCAL_PRICE_ORACLE || ZERO,
    multiSigTreasury: import.meta.env.VITE_LOCAL_MULTI_SIG_TREASURY || ZERO,
    token:
      import.meta.env.VITE_LOCAL_MOCK_CUSD ||
      import.meta.env.VITE_LOCAL_MOCK_TOKEN ||
      ZERO,
  },
};

export function getContractAddresses(chainId) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) return null;

  // Backward compatibility: some hooks/pages still read `cUSD`.
  return {
    ...addresses,
    cUSD: addresses.cUSD || addresses.token,
  };
}
