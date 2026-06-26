// Minimal ABI for HarvestLedger — only the functions/events/errors the
// frontend actually calls or decodes. Keep this in sync with
// contracts/HarvestLedger.sol.
export const HARVEST_LEDGER_ABI = [
  {
    type: "function",
    name: "totalLots",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
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
    name: "VALIDATOR_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
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
    name: "farmers",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "wallet", type: "address" },
      { name: "farmerId", type: "string" },
      { name: "district", type: "string" },
      { name: "active", type: "bool" },
      { name: "totalLotsRegistered", type: "uint256" },
      { name: "totalWeightGrams", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "registerFarmer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "farmerId", type: "string" },
      { name: "district", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "registerLot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fibreType", type: "uint8" },
      { name: "grade", type: "uint8" },
      { name: "weightGrams", type: "uint32" },
      { name: "gpsZone", type: "string" },
      { name: "seasonYear", type: "string" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "lotId", type: "uint256" }],
  },
  {
    type: "function",
    name: "validateLot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "approve", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getFarmerLots",
    stateMutability: "view",
    inputs: [{ name: "farmer", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getLot",
    stateMutability: "view",
    inputs: [{ name: "lotId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "lotId", type: "uint256" },
          { name: "farmer", type: "address" },
          { name: "fibreType", type: "uint8" },
          { name: "grade", type: "uint8" },
          { name: "weightGrams", type: "uint32" },
          { name: "gpsZone", type: "string" },
          { name: "seasonYear", type: "string" },
          { name: "proofOfOrigin", type: "bytes32" },
          { name: "status", type: "uint8" },
          { name: "registeredAt", type: "uint256" },
          { name: "validatedAt", type: "uint256" },
          { name: "validatedBy", type: "address" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "verifyProofOfOrigin",
    stateMutability: "view",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    outputs: [
      { name: "valid", type: "bool" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    type: "event",
    name: "FarmerRegistered",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "farmerId", type: "string", indexed: false },
      { name: "district", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LotRegistered",
    inputs: [
      { name: "lotId", type: "uint256", indexed: true },
      { name: "farmer", type: "address", indexed: true },
      { name: "proofOfOrigin", type: "bytes32", indexed: false },
      { name: "fibreType", type: "uint8", indexed: false },
      { name: "grade", type: "uint8", indexed: false },
      { name: "weightGrams", type: "uint32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "LotValidated",
    inputs: [
      { name: "lotId", type: "uint256", indexed: true },
      { name: "validator", type: "address", indexed: true },
      { name: "status", type: "uint8", indexed: false },
    ],
  },
  { type: "error", name: "NotAFarmer", inputs: [{ name: "caller", type: "address" }] },
  { type: "error", name: "FarmerAlreadyRegistered", inputs: [{ name: "wallet", type: "address" }] },
  { type: "error", name: "LotNotFound", inputs: [{ name: "lotId", type: "uint256" }] },
  {
    type: "error",
    name: "LotNotPending",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "current", type: "uint8" },
    ],
  },
  { type: "error", name: "DuplicateProofOfOrigin", inputs: [{ name: "proof", type: "bytes32" }] },
  { type: "error", name: "InvalidWeight", inputs: [] },
];

export const FibreType = { WOOL: 0, MOHAIR: 1 };
export const Grade = { A: 0, B: 1, C: 2 };
export const LotStatus = { PENDING: 0, VALIDATED: 1, REJECTED: 2, SOLD: 3 };

export const FibreTypeLabel = ["Wool", "Mohair"];
export const GradeLabel = ["A", "B", "C"];
export const LotStatusLabel = ["Pending", "Validated", "Rejected", "Sold"];
