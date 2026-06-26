// Minimal ABI for ProofOfOriginVerifier — kept in sync with
// contracts/ProofOfOriginVerifier.sol.
export const VERIFIER_ABI = [
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "valid", type: "bool" },
          { name: "isValidated", type: "bool" },
          { name: "farmer", type: "address" },
          { name: "fibreType", type: "uint8" },
          { name: "grade", type: "uint8" },
          { name: "weightGrams", type: "uint32" },
          { name: "gpsZone", type: "string" },
          { name: "seasonYear", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "registeredAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "logVerification",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "valid", type: "bool" },
          { name: "isValidated", type: "bool" },
          { name: "farmer", type: "address" },
          { name: "fibreType", type: "uint8" },
          { name: "grade", type: "uint8" },
          { name: "weightGrams", type: "uint32" },
          { name: "gpsZone", type: "string" },
          { name: "seasonYear", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "registeredAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "computeExpectedProof",
    stateMutability: "pure",
    inputs: [
      { name: "farmer", type: "address" },
      { name: "lotId", type: "uint256" },
      { name: "fibreType", type: "uint8" },
      { name: "grade", type: "uint8" },
      { name: "weightGrams", type: "uint32" },
      { name: "gpsZone", type: "string" },
      { name: "seasonYear", type: "string" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "event",
    name: "VerificationLogged",
    inputs: [
      { name: "lotId", type: "uint256", indexed: true },
      { name: "proofSubmitted", type: "bytes32", indexed: false },
      { name: "valid", type: "bool", indexed: false },
      { name: "verifier", type: "address", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
];
