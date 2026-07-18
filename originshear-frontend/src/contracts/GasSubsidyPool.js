// Minimal ABI for GasSubsidyPool — kept in sync with contracts/GasSubsidyPool.sol.
export const GAS_SUBSIDY_POOL_ABI = [
  {
    type: "function",
    name: "availableClaim",
    stateMutability: "view",
    inputs: [{ name: "farmer", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "maxDailyClaim",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "currentBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimSubsidy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [{ name: "claimId", type: "uint256" }],
  },
  {
    type: "function",
    name: "FARMER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
];
