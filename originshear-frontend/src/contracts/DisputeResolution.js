// Minimal ABI for DisputeResolution — kept in sync with contracts/DisputeResolution.sol.
export const DISPUTE_RESOLUTION_ABI = [
  {
    type: "function",
    name: "openDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "offerId", type: "uint256" },
      { name: "disputeType", type: "uint8" },
      { name: "description", type: "string" },
    ],
    outputs: [{ name: "disputeId", type: "uint256" }],
  },
  {
    type: "function",
    name: "cancelDispute",
    stateMutability: "nonpayable",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getDisputesByOffer",
    stateMutability: "view",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getDispute",
    stateMutability: "view",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "disputeId", type: "uint256" },
          { name: "offerId", type: "uint256" },
          { name: "farmer", type: "address" },
          { name: "buyer", type: "address" },
          { name: "disputeType", type: "uint8" },
          { name: "description", type: "string" },
          { name: "status", type: "uint8" },
          { name: "openedBy", type: "address" },
          { name: "openedAt", type: "uint256" },
          { name: "resolvedAt", type: "uint256" },
          { name: "resolvedBy", type: "address" },
          { name: "resolutionNote", type: "string" },
          { name: "refundAmount", type: "uint256" },
        ],
      },
    ],
  },
];

export const DisputeType = {
  QUALITY_MISMATCH: 0,
  WEIGHT_DISCREPANCY: 1,
  FIBRE_TYPE_ERROR: 2,
  OTHER: 3,
};

export const DisputeTypeLabel = {
  0: "Quality Mismatch",
  1: "Weight Discrepancy",
  2: "Fibre Type Error",
  3: "Other",
};

export const DisputeStatus = {
  OPEN: 0,
  IN_REVIEW: 1,
  RESOLVED_FARMER: 2,
  RESOLVED_BUYER: 3,
  CANCELLED: 4,
};

export const DisputeStatusLabel = {
  0: "Open",
  1: "In Review",
  2: "Resolved (Farmer)",
  3: "Resolved (Buyer)",
  4: "Cancelled",
};
