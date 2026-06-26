// Minimal ABI for FarmerMarket — kept in sync with contracts/FarmerMarket.sol.
export const FARMER_MARKET_ABI = [
  {
    type: "function",
    name: "VALIDATOR_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "cUSD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "platformFeeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "lotToOffer",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "offers",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "offerId", type: "uint256" },
      { name: "lotId", type: "uint256" },
      { name: "farmer", type: "address" },
      { name: "askPriceWei", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "escrowAmount", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "listedAt", type: "uint256" },
      { name: "completedAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "listLot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lotId", type: "uint256" },
      { name: "askPrice", type: "uint256" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  {
    type: "function",
    name: "purchaseLot",
    stateMutability: "nonpayable",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "releasePayment",
    stateMutability: "nonpayable",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "LotListed",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "lotId", type: "uint256", indexed: true },
      { name: "farmer", type: "address", indexed: false },
      { name: "askPrice", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PurchaseEscrowed",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PaymentReleased",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "farmer", type: "address", indexed: false },
      { name: "netAmount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  { type: "error", name: "LotNotValidated", inputs: [{ name: "lotId", type: "uint256" }] },
  { type: "error", name: "LotAlreadyListed", inputs: [{ name: "lotId", type: "uint256" }] },
  {
    type: "error",
    name: "NotLotOwner",
    inputs: [
      { name: "caller", type: "address" },
      { name: "lotId", type: "uint256" },
    ],
  },
  { type: "error", name: "OfferNotFound", inputs: [{ name: "offerId", type: "uint256" }] },
  {
    type: "error",
    name: "WrongStatus",
    inputs: [
      { name: "current", type: "uint8" },
      { name: "expected", type: "uint8" },
    ],
  },
  { type: "error", name: "InvalidPrice", inputs: [] },
];

export const OfferStatus = { LISTED: 0, IN_ESCROW: 1, COMPLETED: 2, CANCELLED: 3 };
export const OfferStatusLabel = ["Listed", "Payment in Escrow", "Completed", "Cancelled"];

// Minimal ERC-20 ABI subset for cUSD approve/balance reads.
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];
