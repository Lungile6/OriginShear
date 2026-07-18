// Minimal ABI for PriceOracle — kept in sync with contracts/PriceOracle.sol.
export const PRICE_ORACLE_ABI = [
  {
    type: "function",
    name: "getSuggestedPrice",
    stateMutability: "view",
    inputs: [
      { name: "fibreType", type: "uint8" },
      { name: "grade", type: "uint8" },
      { name: "weightGrams", type: "uint32" },
    ],
    outputs: [{ name: "suggestedPriceWei", type: "uint256" }],
  },
  {
    type: "function",
    name: "getCurrentPrice",
    stateMutability: "view",
    inputs: [
      { name: "fibreType", type: "uint8" },
      { name: "grade", type: "uint8" },
    ],
    outputs: [
      { name: "pricePerKgWei", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  },
];
