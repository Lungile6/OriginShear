// Minimal ABI for ReputationSystem — kept in sync with contracts/ReputationSystem.sol.
export const REPUTATION_SYSTEM_ABI = [
  {
    type: "function",
    name: "submitReview",
    stateMutability: "nonpayable",
    inputs: [
      { name: "transactionId", type: "uint256" },
      { name: "reviewed", type: "address" },
      { name: "reviewedType", type: "uint8" },
      { name: "score", type: "uint8" },
      { name: "comment", type: "string" },
    ],
    outputs: [{ name: "reviewId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getReputation",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "entityId", type: "uint256" },
          { name: "entityType", type: "uint8" },
          { name: "wallet", type: "address" },
          { name: "totalTransactions", type: "uint256" },
          { name: "successfulTransactions", type: "uint256" },
          { name: "disputesWon", type: "uint256" },
          { name: "disputesLost", type: "uint256" },
          { name: "totalScore", type: "uint256" },
          { name: "currentRating", type: "uint8" },
          { name: "lastUpdated", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "registerEntity",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "entityType", type: "uint8" },
    ],
    outputs: [],
  },
];

export const EntityType = {
  FARMER: 0,
  BUYER: 1,
};
