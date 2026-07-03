# ORIGINSHEAR Frontend

React + Vite + Tailwind CSS v4 frontend for ORIGINSHEAR, wired to the live
HarvestLedger, FarmerMarket, and ProofOfOriginVerifier contracts via
[wagmi](https://wagmi.sh) + [viem](https://viem.sh).

Translated from the Stitch design export (24 screens across Farmer,
Validator, Government, and public/Buyer flows) into a single routed
React app with real on-chain reads/writes — no mock data on any
authenticated screen.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`, no PostCSS config needed) |
| Routing | React Router v7 |
| Web3 | wagmi v3 + viem v2 |
| Server state | TanStack Query v5 (used internally by wagmi) |
| QR codes | qrcode.react |

## Project structure

```
src/
├── contracts/          # ABIs + addresses for HarvestLedger, FarmerMarket, ProofOfOriginVerifier
├── lib/                 # wagmiConfig.js, utils.js (formatting, Proof of Origin hashing)
├── context/             # RoleContext — resolves connected wallet's on-chain role(s)
├── components/
│   ├── ui/               # Button, Card, StatusChip, BilingualText
│   ├── nav/               # TopAppBar, BottomNav (role-aware tabs)
│   └── RequireRole.jsx    # route guard
├── layouts/
│   └── AppLayout.jsx      # shared chrome for authenticated screens
├── hooks/                # useFarmerLots, useLotQueue, useCusdBalance
└── pages/
    ├── auth/               # Splash, WalletConnect, RoleSelectionGate, error states, onboarding
    ├── farmer/              # Dashboard, Register Lot (3-step), My Lots, QR Proof, Market
    ├── validator/           # Pending Queue, Audit Log
    ├── government/          # Mark Management Dashboard, News Hub
    └── public/              # Landing Page, Public Lot Verification, 404
```

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your deployed contract addresses. From the repo root,
after deploying contracts, run:

```bash
npm run sync:addresses celoSepolia
```

Or paste values manually from `originshear-contracts/deployments.<network>.json`:

```
VITE_CELO_SEPOLIA_HARVEST_LEDGER=0x...
VITE_CELO_SEPOLIA_FARMER_MARKET=0x...
VITE_CELO_SEPOLIA_VERIFIER=0x...
```

```bash
npm run dev      # local dev server
npm run build    # production build to dist/
npm run lint     # ESLint
```

## How each screen maps to the contracts

| Screen | Contract call |
|---|---|
| Role Selection Gate | `hasRole(FARMER_ROLE / VALIDATOR_ROLE / DEFAULT_ADMIN_ROLE, address)` |
| Register Lot (steps 1–3) | `HarvestLedger.registerLot(...)` |
| My Lots | `HarvestLedger.getFarmerLots()` → `getLot()` per ID |
| QR Proof of Origin | reads `lot.proofOfOrigin`, encodes a verification URL into a QR |
| Validator Queue | `HarvestLedger.totalLots()` → `getLot()` per ID, filtered to `PENDING` → `validateLot(id, approve)` |
| Validator Audit Log | same enumeration, filtered to `VALIDATED`/`REJECTED` |
| Sell Your Lot | `FarmerMarket.listLot()` → `purchaseLot()` (buyer-side) → `releasePayment()` |
| Public Lot Verification | `ProofOfOriginVerifier.verify(lotId, proofHash)` — free `eth_call`, no wallet needed |

## Notes on scope and known gaps

- **IPFS metadata**: The Register Lot review step now uploads lot metadata through `POST /api/ipfs/lot-metadata`, then passes the returned `metadataURI` into `HarvestLedger.registerLot`. Configure `VITE_API_BASE_URL` and optional `VITE_IPFS_GATEWAY` in `.env`.
- **`totalLots()` getter**: `HarvestLedger.sol` was given a small additive
  change — a public `totalLots()` view function — so the Validator Queue
  and Audit Log can enumerate all lots without an indexer. This is
  backward-compatible and doesn't change any existing function signatures,
  but **you must redeploy the contract** (or upgrade, if proxied) for the
  validator screens to work. At pilot scale (dozens–low hundreds of lots
  per season) this scan-all approach is fine; swap for an indexer/subgraph
  if lot volume grows significantly.
- **Government Mark Management** screens are built against real
  `HarvestLedger` data for the lot-status donut/counts, but the "Issue a
  Mark" form uses local component state — there's no on-chain Industry
  Mark registry contract yet (ear tag / branding / tattoo certification
  with expiry). Wire this up once that contract exists.
- **News Hub** (Government bulletins) is local state for the same reason
  — no on-chain or backend news store yet. Swap `useState` for a real
  data source (contract, IPFS, or a small backend) when ready.
- **Payment History** on the Farmer Market screen shows the gross ask
  price rather than the net amount after the 2% platform fee, since
  `FarmerMarket.offers()` doesn't store the net amount directly (it's only
  emitted in the `PaymentReleased` event). For exact net amounts, index
  `PaymentReleased` events rather than reading offer state.
- **Wallet support**: the injected connector covers MetaMask and Valora's
  in-app browser. WalletConnect (for Valora as a separate mobile app, not
  in-app browser) isn't wired up — add `@wagmi/connectors`'s
  `walletConnect()` connector with a project ID if you need that flow.
