# ORIGINSHEAR Frontend

React + Vite + Tailwind CSS v4 frontend for ORIGINSHEAR — a proof-of-origin
and marketplace platform for Lesotho wool and mohair farmers — wired to live
Celo Sepolia contracts via [wagmi](https://wagmi.sh) + [viem](https://viem.sh)
and the ORIGINSHEAR API for auth, IPFS, subgraph reads, marks, and news.

Translated from the Stitch design export (farmer, validator, government, and
public/buyer flows) into a single routed React app with real on-chain
reads/writes on authenticated screens.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Routing | React Router v7 |
| Web3 | wagmi v3 + viem v2 |
| Server state | TanStack Query v5 (used internally by wagmi) |
| QR codes | qrcode.react |

## Project structure

```
src/
├── contracts/          # ABIs + addresses (ledger, market, verifier, marks,
│                       # subsidy, dispute, reputation, price oracle)
├── lib/                # wagmiConfig, apiClient, apiAuth, utils, support
├── context/            # RoleContext — on-chain role resolution
├── components/
│   ├── ui/             # Button, Card, StatusChip, BilingualText, …
│   ├── nav/            # TopAppBar, BottomNav
│   ├── market/         # OpenDisputePanel, SubmitReviewPanel
│   ├── farmer/         # GasSubsidyClaim, IndustryMarksRail
│   └── lot/            # LotVerificationPanel
├── layouts/
│   └── AppLayout.jsx
├── hooks/              # useFarmerLots, useLotQueue, usePaymentHistory, …
└── pages/
    ├── auth/           # Splash, WalletConnect, RoleSelectionGate, onboarding
    ├── farmer/         # Dashboard, Register Lot, My Lots, QR, Market
    ├── validator/      # Queue, Release, Audit
    ├── government/     # Marks dashboard, News hub/compose
    ├── buyer/          # Marketplace, purchase, history, verify
    └── public/         # Landing, PublicLotVerification, 404
```

## Setup (from repo root)

Prefer configuring from the **OriginShear** monorepo root so addresses stay in sync:

```bash
cd OriginShear
npm install
cp originshear-frontend/.env.example originshear-frontend/.env
npm run sync:addresses celoSepolia
```

Or from this package only:

```bash
cd originshear-frontend
npm install
cp .env.example .env
# Paste VITE_CELO_SEPOLIA_* from ../originshear-contracts/deployments.celoSepolia.json
```

### Frontend `.env` keys

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API origin (default `http://localhost:3000`) |
| `VITE_CELO_SEPOLIA_RPC_URL` | RPC for wagmi |
| `VITE_CELO_SEPOLIA_HARVEST_LEDGER` etc. | Contract addresses (use sync) |
| `VITE_DEV_BYPASS_ROLE_GUARDS` | `true` unlocks all role routes locally |
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional WalletConnect for mobile Valora |
| `VITE_IPFS_GATEWAY` | Gateway for `ipfs://` links |

```bash
npm run dev      # http://localhost:5173
npm run build    # production → dist/
npm run lint
```

Start the API as well (`cd api && npm run dev`) before testing register-lot IPFS or marketplace lists.

## Wallet & role selection

1. MetaMask (or Valora) must be on **Celo Sepolia** (`11142220`).
2. Select the **account** that holds the role you want (farmer / validator / government).
3. Open the app → **Connect Wallet** → choose the matching role card.
4. Buyer needs no on-chain role; fund with Sepolia **Mento cUSD**  
   `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`.

Roles are resolved on-chain (`RoleContext`). Wrong account → onboarding / pending screens.  
Grant roles from the repo root with `npm run seed:roles` (see root `README.md`).

Public verification (no wallet): `/verify` and `/verify/lot/:lotId`.

## How screens map to contracts / API

| Screen | Call / data source |
|---|---|
| Role Selection Gate | `hasRole` on HarvestLedger / IndustryMarkRegistry |
| Register Lot | `POST /api/ipfs/lot-metadata` → `HarvestLedger.registerLot` |
| My Lots / Dashboard | farmer lots (chain/API) + payment history (API) |
| QR Proof of Origin | `lot.proofOfOrigin` → verification URL QR |
| Validator Queue | pending lots → `validateLot` (wallet or API relayer) |
| Escrow Release | `POST /api/market/offers/:id/release` (validator + relayer) |
| Sell Your Lot | `FarmerMarket.listLot` + PriceOracle suggestion |
| Buyer purchase | cUSD `approve` + `purchaseLot` |
| Dispute (escrow) | `DisputeResolution.openDispute` (wallet-direct) |
| Gas subsidy | `GasSubsidyPool.claimSubsidy` (wallet-direct) |
| Reviews | `ReputationSystem.submitReview` after purchase |
| Marks / News | `/api/marks`, `/api/news` → on-chain registries |
| Public / Buyer Verify | `ProofOfOriginVerifier.verify` (`eth_call`) |

## Notes on scope

- **IPFS metadata**: Register Lot review uploads via `POST /api/ipfs/lot-metadata`, then passes `metadataURI` into `registerLot`. Configure `VITE_API_BASE_URL`.
- **Government marks & news**: wired to API + `IndustryMarkRegistry` / `NewsBulletin` (not local-only state).
- **Payment history**: net amounts / fees from `PaymentReleased` via API/subgraph; active offers show ask + estimated 98% net.
- **Advanced features**: subsidy claim, disputes, oracle suggestions, and reviews are in the UI against current Sepolia deployments (correct Mento cUSD).
- **Wallets**: injected MetaMask / Valora in-app browser; WalletConnect when `VITE_WALLETCONNECT_PROJECT_ID` is set.
- **Subgraph lag**: marketplace browse depends on `GRAPHQL_ENDPOINT` on the API; empty lists usually mean subgraph not synced to current addresses.

## Related docs

- End-to-end install, seed roles, and submission guide: root [`../README.md`](../README.md)
- Contracts: [`../originshear-contracts/README.md`](../originshear-contracts/README.md)
- API: [`../api/README.md`](../api/README.md)
