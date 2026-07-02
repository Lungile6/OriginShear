export const INDUSTRY_MARK_REGISTRY_ABI = [
  {
    type: "function",
    name: "GOVERNMENT_ROLE",
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
  {
    type: "function",
    name: "issueMark",
    stateMutability: "nonpayable",
    inputs: [
      { name: "farmer", type: "address" },
      { name: "farmerId", type: "string" },
      { name: "markType", type: "uint8" },
      { name: "description", type: "string" },
      { name: "expiresAt", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "markId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getFarmerMarks",
    stateMutability: "view",
    inputs: [{ name: "farmer", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getMark",
    stateMutability: "view",
    inputs: [{ name: "markId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "markId", type: "uint256" },
          { name: "farmer", type: "address" },
          { name: "farmerId", type: "string" },
          { name: "markType", type: "uint8" },
          { name: "description", type: "string" },
          { name: "issuedAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "issuedBy", type: "address" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "revokeMark",
    stateMutability: "nonpayable",
    inputs: [{ name: "markId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "isMarkValid",
    stateMutability: "view",
    inputs: [{ name: "markId", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "MarkIssued",
    inputs: [
      { name: "markId", type: "uint256", indexed: true },
      { name: "farmer", type: "address", indexed: true },
      { name: "farmerId", type: "string", indexed: false },
      { name: "markType", type: "uint8", indexed: false },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
];

export const MarkType = { VISUAL_EAR_TAG: 0, BRANDING: 1, TATTOO: 2 };
export const MarkTypeLabel = [
  "Visual Ear Tag (Lesotho Standard)",
  "Branding",
  "Tattoo",
];
export const MarkStatus = { ACTIVE: 0, EXPIRED: 1, REVOKED: 2 };
export const MarkStatusLabel = ["Active", "Expired", "Revoked"];
