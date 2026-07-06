# ORIGINSHEAR

Blockchain proof-of-origin and marketplace platform for Lesotho wool and mohair farmers.

ORIGINSHEAR serves Lesotho's **wool and mohair sector** — not general crop agriculture. Farmers, validators (LNWMGA), government, and buyers interact through a single ledger for traceable bales, proof of origin, and cUSD marketplace settlement.

This repository is submitted for implementation and testing demonstration.

## Project Components

```
OriginShear/
├── originshear-contracts/   # Solidity contracts, tests, deployment scripts
├── originshear-frontend/    # React + Vite web app
├── api/                     # Backend API (auth, lots, market, marks, IPFS endpoints)
├── ipfs/                    # IPFS integration notes and helpers
├── subgraph/                # The Graph indexing layer
├── scripts/
│   └── sync-deployments.js  # Copies deployed addresses into frontend .env
└── README.md
```

---

## Demo Video & Live Links

> **Add your submission links here before final hand-in.**

| Item | Link |
|------|------|
| **Demo video (~5 min)** | `https://youtu.be/Tp-5i1Z0zkw` |
| **Deployed application** | `[NO LIVE APP URL YET]` |

**Suggested video content (for reviewers):**
1. Connect MetaMask on Celo Sepolia
2. Wool and mohair farmer registers a lot (2-step form + IPFS metadata)
3. Validator approves the lot from the queue
4. Buyer browses the public marketplace and verifies proof of origin
5. Optional: government news publish or validator escrow release

Example placeholder formats:
- YouTube: `https://youtu.be/Tp-5i1Z0zkw`

---

## Prerequisites

Install these before you start:

| Tool | Minimum version | Notes |
|------|-----------------|-------|
| **Node.js** | 20.x LTS | Check with `node -v` |
| **npm** | 10.x | Bundled with Node |
| **Git** | any recent | To clone the repo |
| **MetaMask** (or compatible wallet) | latest | Browser extension for on-chain actions |

**Optional (only if deploying your own contracts):**
- Hardhat local node or a Celo Sepolia wallet funded with test CELO
- A [Celo Sepolia faucet](https://faucet.celo.org/) account for test tokens

**You do not need** a local IPFS node or Infura account for basic local development — the API falls back to storing metadata under `api/data/ipfs-dev/` when remote IPFS is unavailable.

---

## Quick Start (recommended for reviewers)

Use the **pre-deployed Celo Sepolia contracts** already checked into `originshear-contracts/deployments.celoSepolia.json`. This is the fastest path to a running demo.

### 1. Clone and install

```bash
git clone <your-repo-url>
cd OriginShear

# Install root workspaces (frontend + contracts) and API dependencies
npm install
npm install --prefix api
```

### 2. Configure the API

```bash
cp api/.env.example api/.env
```

Edit `api/.env` — at minimum set:

```env
JWT_SECRET=<any-long-random-string>
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org

# Paste from originshear-contracts/deployments.celoSepolia.json
HARVEST_LEDGER_ADDRESS=0x617451963A2ae2B143311094fF5F921a4B169B43
FARMER_MARKET_ADDRESS=0x3675Db5F51917D55A3D9E96AdD137b314633b003
PROOF_OF_ORIGIN_VERIFIER_ADDRESS=0x08A5c3E305b8eD5C38b4a6FEF51901D0c30D72Ab
INDUSTRY_MARK_REGISTRY_ADDRESS=0x084E3c8427203C698f26d4eF34348a4B19041734
NEWS_BULLETIN_ADDRESS=0x693AC50d8e320b3A5a513454830beA1A3698FD9e

# Subgraph — ask the repo owner or use the value in their shared .env
GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/query/1756052/origin-shear/version/latest

# Local dev: no Infura/Pinata required
IPFS_DEV_FALLBACK=true
```

For **easiest local testing without on-chain roles**, you can also add:

```env
DEV_BYPASS_ROLE_GUARDS=true
```

> Never commit `api/.env` — it is gitignored.

### 3. Configure the frontend

```bash
cp originshear-frontend/.env.example originshear-frontend/.env
npm run sync:addresses celoSepolia
```

This writes contract addresses from `deployments.celoSepolia.json` into `originshear-frontend/.env`.

Optionally add for local role testing:

```env
VITE_DEV_BYPASS_ROLE_GUARDS=true
```

### 4. Start the API (terminal 1)

```bash
cd api
npm run dev
```

Expected output:

```
Server running on port 3000
Environment: development
```

Verify: open [http://localhost:3000/health](http://localhost:3000/health) — should return `{ "ok": true }`.

IPFS health check: [http://localhost:3000/api/ipfs/health](http://localhost:3000/api/ipfs/health)

### 5. Start the frontend (terminal 2)

From the **repo root**:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Connect your wallet

1. Install MetaMask and create/import a wallet
2. Add **Celo Sepolia** network (chain ID `11142220`) — the app prompts you if you're on the wrong network
3. Get test CELO from the [Celo faucet](https://faucet.celo.org/)
4. Click **Connect Wallet** in the app

### 7. Smoke-test the main flows

| Role | What to try |
|------|-------------|
| **Wool & mohair farmer** | Register a lot → review → confirm on-chain → view in My Lots |
| **Validator** | Open validation queue → approve/reject a pending lot |
| **Buyer** | Browse marketplace (no wallet required) → connect to purchase |
| **Public** | `/buyer/verify` — verify a lot by ID and proof hash |
| **Government** | Compose news bulletin (requires `GOVERNMENT_ROLE` or dev bypass) |

---

## Full Setup (deploy your own contracts)

Use this if you want a fresh deployment instead of the bundled Celo Sepolia addresses.

### 1. Compile and test contracts

```bash
npm run compile
npm test
```

### 2. Deploy to Celo Sepolia

You need a funded deployer wallet. Set `RELAYER_PRIVATE_KEY` or use Hardhat's configured account in `originshear-contracts/hardhat.config.js`.

```bash
npm run deploy:celo-sepolia
```

This creates/updates `originshear-contracts/deployments.celoSepolia.json`.

### 3. Sync addresses to frontend and API

```bash
npm run sync:addresses celoSepolia
```

Copy the same addresses into `api/.env`:

```env
HARVEST_LEDGER_ADDRESS=<from deployments file>
FARMER_MARKET_ADDRESS=<from deployments file>
PROOF_OF_ORIGIN_VERIFIER_ADDRESS=<from deployments file>
INDUSTRY_MARK_REGISTRY_ADDRESS=<from deployments file>
NEWS_BULLETIN_ADDRESS=<from deployments file>
```

### 4. Grant on-chain roles (production-style testing)

Without `DEV_BYPASS_ROLE_GUARDS`, wallets need roles on the contracts:

- **Wool & mohair farmer**: register via `HarvestLedger.registerFarmer()` or be granted `FARMER_ROLE`
- **Validator**: `VALIDATOR_ROLE` on `HarvestLedger`
- **Government**: `GOVERNMENT_ROLE` on `IndustryMarkRegistry` and/or `DEFAULT_ADMIN_ROLE`

Set `RELAYER_PRIVATE_KEY` in `api/.env` for API-relayed validator/government writes (`validateLot`, `releasePayment`, `publishNews`, `issueMark`).

---

## Environment Variables Reference

### API (`api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing API session tokens |
| `CELO_SEPOLIA_RPC_URL` | Yes | RPC endpoint for Celo Sepolia |
| `HARVEST_LEDGER_ADDRESS` | Yes* | HarvestLedger contract |
| `FARMER_MARKET_ADDRESS` | Yes* | FarmerMarket contract |
| `PROOF_OF_ORIGIN_VERIFIER_ADDRESS` | Yes* | Verifier contract |
| `INDUSTRY_MARK_REGISTRY_ADDRESS` | For marks/gov | Industry mark registry |
| `NEWS_BULLETIN_ADDRESS` | For news | News bulletin contract |
| `GRAPHQL_ENDPOINT` | Recommended | The Graph subgraph URL |
| `RELAYER_PRIVATE_KEY` | Optional | Relayer wallet for gated API writes |
| `IPFS_DEV_FALLBACK` | Dev | `true` = local metadata store when IPFS fails |
| `DEV_BYPASS_ROLE_GUARDS` | Dev only | Skip validator/government role checks |

\*Required for on-chain reads/writes; defaults in frontend fall back to older addresses if unset.

See `api/.env.example` for the full list including IPFS options (Pinata, Infura JWT, local node).

### Frontend (`originshear-frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | API base URL (default `http://localhost:3000`) |
| `VITE_CELO_SEPOLIA_RPC_URL` | Recommended | RPC for wagmi/viem |
| `VITE_CELO_SEPOLIA_*` | Yes | Contract addresses per network |
| `VITE_DEV_BYPASS_ROLE_GUARDS` | Dev only | Unlock all role routes locally |
| `VITE_IPFS_GATEWAY` | Optional | Public IPFS gateway for metadata links |

Run `npm run sync:addresses celoSepolia` to populate contract address variables automatically.

---

## Running Tests

```bash
# Smart contract unit tests (22 tests)
npm test

# API integration tests — run from repo root
npm run test:api

# Data-value edge-case suite
npm run assess:test-data-values

# Full assessment bundle (contracts + API)
npm run assess:test-strategies
```

API tests only:

```bash
cd api
npm test
```

---

## Production Build

```bash
# Frontend static build → originshear-frontend/dist/
npm run build

# Preview production build locally
npm run preview --workspace=originshear-frontend

# API production start
cd api
NODE_ENV=production npm start
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Frontend can't reach API** | Ensure API is on port 3000 and `VITE_API_BASE_URL=http://localhost:3000` |
| **Wrong network** | Switch MetaMask to Celo Sepolia (chain ID `11142220`) |
| **Unauthorized / role errors** | Set `VITE_DEV_BYPASS_ROLE_GUARDS=true` and `DEV_BYPASS_ROLE_GUARDS=true` for local dev, or grant on-chain roles |
| **IPFS upload failed** | Set `IPFS_DEV_FALLBACK=true` in `api/.env` — metadata saves to `api/data/ipfs-dev/` |
| **Marketplace empty** | Subgraph may lag; check `GRAPHQL_ENDPOINT` and that lots were listed on-chain |
| **Validator queue empty** | Lots must be in `PENDING` status; farmer must complete registration |
| **npm install errors** | Use Node 20.x; delete `node_modules` and re-run `npm install` at root and in `api/` |

---

## Testing Results (Screenshots with Relevant Demos)

Store screenshots, logs, and exported reports under `evidence/`.

### A) Demonstration under different testing strategies

Run each strategy and capture terminal screenshots + output files:

```bash
# 1) Unit tests (smart contracts)
npm run test

# 2) Integration tests (API, auth, routes, role guards)
npm run test:api

# 3) Full strategy bundle (unit + integration together)
npm run assess:test-strategies
```

Evidence (text logs saved under `evidence/testing/`):

**Unit tests — 22/22 passing** (`evidence/testing/A-unit-contracts.txt`):
- `HarvestLedger`: farmer registration, lot submission, validation (12 tests)
- `ProofOfOriginVerifier`: hash matching, audit event logging (6 tests)
- `FarmerMarket`: escrow listing, purchase, payment release with 2% fee (4 tests)

![Unit test results](evidence/screenshots/A-unit-contracts.png)

**Integration tests — 22/22 passing** (`evidence/testing/B-integration-api.txt`):
- JWT auth challenge / login / verify flow
- Role-gated routes (VALIDATOR, GOVERNMENT)
- Env guard rails (missing relayer key, missing contract addresses)

![Integration test results](evidence/screenshots/B-integration-api.png)

**System scenario**: screen-record the full farmer → validator → buyer flow using the running frontend at `localhost:5173` and API at `localhost:3000`.

### B) Demonstration with different data values

Use the dedicated data-value suite:

```bash
npm run assess:test-data-values
```

This suite covers:
- Normal valid input case (valid `/api/news` publish, valid lot payload shape).
- Edge/boundary input case (minimum and maximum allowed `weightGrams`, minimum title length).
- Invalid/error-handling case (invalid wallet format, below/above weight constraints).

![Data values test results](evidence/screenshots/B-data-values.png)

Evidence saved to `evidence/testing/B-data-values.txt` — **7/7 passing**:

| Case | Input | Expected | Result |
|---|---|---|---|
| Normal valid | weightGrams = 1 (minimum) | 501 (valid, relayer not set) | ✔ |
| Normal valid | Valid wallet address → challenge | 200 + nonce returned | ✔ |
| Boundary | weightGrams = 4000000 (maximum) | 501 (valid, relayer not set) | ✔ |
| Boundary | fibreType=2, grade=2, max weight | 501 (valid, relayer not set) | ✔ |
| Invalid | weightGrams = 0 | 400 validation error | ✔ |
| Invalid | weightGrams = 4000001 | 400 validation error | ✔ |
| Invalid | wallet = "not-an-address" | 400 validation error | ✔ |

### C) Performance under different hardware/software specs

Run API benchmark (with backend running on `localhost:3000`):

```bash
npm run assess:perf
```

Optional custom run (include multiple endpoints):

```bash
PERF_BASE_URL=http://localhost:3000 PERF_REQUESTS=200 PERF_CONCURRENCY=20 PERF_ENDPOINTS=/health,/api/news npm run assess:perf
```

The command saves JSON reports to `evidence/performance/` including:
- OS + kernel, Node version, CPU model/cores, RAM.
- Throughput (requests/sec), elapsed time, latency (`min`, `avg`, `p95`, `max`) per endpoint.

Use at least two environments and attach both generated JSON files.

| Environment | Specs | Throughput | p95 Latency | Evidence |
|---|---|---|---|---|
| Env 1 — MacBook Pro | macOS 13 · Intel i5-7360U 2.3GHz · 4 cores · 16 GB RAM · Node v20.20.2 | 425 req/s | 67 ms | `evidence/testing/C-performance-env1.txt` |
| Env 2 | Run `npm run assess:perf` on a second machine and paste results here | — | — | `evidence/performance/<file>.json` |

---

## Analysis

Describe how the observed results achieved or missed the project proposal objectives agreed with the supervisor.

Suggested structure:

1. Objective 1 -> expected vs actual -> reason
2. Objective 2 -> expected vs actual -> reason
3. Objective 3 -> expected vs actual -> reason

## Discussion

Discuss the importance of project milestones and the impact of the observed results with the supervisor.

Suggested structure:

- Milestone completed and its impact
- Milestone partially completed and constraints
- Lessons learned and technical implications

## Recommendations

Provide recommendations for real-world application and future work.

Suggested structure:

- Recommendation to community/end users
- Recommendation for scaling/performance/security
- Recommendation for future technical enhancement

## Related Project Files

- Contracts details: `originshear-contracts/README.md`
- Frontend details: `originshear-frontend/README.md`
- API details: `api/README.md`
- IPFS details: `ipfs/README.md`
- Subgraph details: `subgraph/README.md`

## Submission Checklist

Use this checklist before submitting:

- [ ] Repo includes all relevant source files
- [ ] Root README is complete and well formatted
- [ ] Step-by-step install and run instructions are verified
- [ ] Demo video link is added in the **Demo Video & Live Links** section above
- [ ] Deployed app link (or installable package link) is included
- [ ] Testing evidence includes multiple strategies
- [ ] Testing evidence includes different data values
- [ ] Testing evidence includes different environment performance
- [ ] Analysis section is completed
- [ ] Discussion section is completed
- [ ] Recommendations section is completed
- [ ] Attempt 2 zip file is created from this repo state

## License

MIT
