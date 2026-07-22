# ORIGINSHEAR

Blockchain proof-of-origin and marketplace platform for Lesotho wool and mohair farmers.

ORIGINSHEAR serves Lesotho's **wool and mohair sector** — not general crop agriculture. Farmers, validators (LNWMGA), government, and buyers interact through a single ledger for traceable bales, proof of origin, and cUSD marketplace settlement.

This repository is submitted for implementation and testing demonstration.

## Project Components

```
OriginShear/
├── originshear-contracts/   # Solidity contracts, tests, deployment scripts
├── originshear-frontend/    # React + Vite web app
├── api/                     # Backend API (auth, lots, market, marks, IPFS, subsidy, disputes…)
├── ipfs/                    # IPFS integration notes and helpers
├── subgraph/                # The Graph indexing layer
├── scripts/
│   ├── sync-deployments.js  # Copies deployed addresses into frontend + api .env
│   ├── seed-demo.js         # Grants demo roles + advanced feature setup
│   └── …                    # subgraph sync, smoke/perf helpers
├── evidence/                # Assessment screenshots, logs, performance reports
└── README.md
```

> **Working directory:** all `npm run …` commands in this README are run from the
> `OriginShear/` folder (the directory that contains this `package.json`).
> If your clone is nested (e.g. `Capstone(OriginShear)/OriginShear`), `cd` into
> the inner `OriginShear` first — otherwise scripts like `seed:roles` will not be found.

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
- A Celo Sepolia wallet funded with test CELO
- A [Celo Sepolia faucet](https://faucet.celo.org/) account for test CELO / cUSD
- Hardhat local node (only for fully offline contract work)

**You do not need** a local IPFS node or Infura account for basic local development — the API falls back to storing metadata under `api/data/ipfs-dev/` when remote IPFS is unavailable.

### Important: Celo Sepolia cUSD

Marketplace escrow and subsidy use **Mento cUSD** on Celo Sepolia:

| Network | Token | Address |
|---------|-------|---------|
| **Celo Sepolia** | cUSD (Mento) | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |
| Celo Mainnet | cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Alfajores (legacy) | cUSD | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` — **do not use on Sepolia** |

Add the Sepolia token in MetaMask via **Import tokens** → paste the Sepolia address above.

---

## Quick Start (recommended for reviewers)

Use the **pre-deployed Celo Sepolia contracts** in `originshear-contracts/deployments.celoSepolia.json`. This is the fastest path to a running demo.

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

Then either paste addresses from `deployments.celoSepolia.json`, **or** (preferred after step 3’s frontend `.env` exists) run sync from the repo root:

```bash
cp originshear-frontend/.env.example originshear-frontend/.env
npm run sync:addresses celoSepolia
```

That updates **both** `originshear-frontend/.env` and `api/.env` with the current deployment.

Minimum `api/.env` values (addresses below match `deployments.celoSepolia.json` as of 2026-07-18):

```env
JWT_SECRET=<any-long-random-string>
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org

HARVEST_LEDGER_ADDRESS=0xCdC66542C3a63e9Ac831cba393BcABc3B2aE6068
FARMER_MARKET_ADDRESS=0x67D273a76F3998d6b4eFf461Dbb508F1A6654FB8
PROOF_OF_ORIGIN_VERIFIER_ADDRESS=0x1fC854Cb2D737363473Ce51844daa48220774899
INDUSTRY_MARK_REGISTRY_ADDRESS=0xcac97CBa1D7685dd3B9A976Ca10fEb715BD43a57
NEWS_BULLETIN_ADDRESS=0x2dBf9b14246f571e0487345870dEF0E0Ab6Fb6d7
GAS_SUBSIDY_POOL_ADDRESS=0xb0B3699774b5a3ad8a94628455c0268a66d75FfC
DISPUTE_RESOLUTION_ADDRESS=0xb235008e74a337D62337E87Be956fF0F15809f44
REPUTATION_SYSTEM_ADDRESS=0xF3b20B3572097fDcbE5AB1D66a717396e03B9d18
PRICE_ORACLE_ADDRESS=0x841B4FFD60948dC8651446610253B64E9D3e3939
MULTI_SIG_TREASURY_ADDRESS=0x40D1c8bB36b704050b8d2498da9D4566D1374a21

# Relayer = deployer/admin wallet (needed for validateLot, releasePayment, news, marks, dispute resolve)
RELAYER_PRIVATE_KEY=<deployer_private_key>

# Subgraph — update after you redeploy/reindex against the addresses above
GRAPHQL_ENDPOINT=https://api.studio.thegraph.com/query/1756052/origin-shear/v0.0.4

# Local dev: no Infura/Pinata required
IPFS_DEV_FALLBACK=true
```

For **easiest local UI testing without on-chain roles**, you can also add:

```env
DEV_BYPASS_ROLE_GUARDS=true
```

> Never commit `api/.env` — it is gitignored.

### 3. Configure the frontend

If you have not already:

```bash
cp originshear-frontend/.env.example originshear-frontend/.env
npm run sync:addresses celoSepolia
```

Optionally for local role testing (unlocks all role routes):

```env
VITE_DEV_BYPASS_ROLE_GUARDS=true
```

Optional WalletConnect (Valora / mobile QR):

```env
VITE_WALLETCONNECT_PROJECT_ID=<from https://cloud.walletconnect.com>
```

### 4. Grant demo roles (production-style testing)

Without role bypass, each wallet needs the matching on-chain role. From **repo root**:

```bash
FARMER_ADDRESS=0xYourFarmerWallet \
VALIDATOR_ADDRESS=0xYourValidatorWallet \
GOVERNMENT_ADDRESS=0xYourGovWallet \
npm run seed:roles
```

This registers the farmer, grants validator/government roles, subsidy `FARMER_ROLE`, dispute `ARBITER_ROLE`, and seeds demo oracle prices.

Advanced-only (oracle / arbiter / optional subsidy deposit):

```bash
npm run seed:advanced
# After deployer holds test cUSD:
SEED_SUBSIDY_DEPOSIT=true SUBSIDY_DEPOSIT_CUSD=10 npm run seed:advanced
```

Buyer wallets need **no role** — fund them with Sepolia cUSD (`0xdE9e4C3c…`).

### 5. Start the API (terminal 1)

```bash
cd api
npm run dev
```

Verify: open [http://localhost:3000/health](http://localhost:3000/health) — should return JSON with `"status":"ok"`.

IPFS health: [http://localhost:3000/api/ipfs/health](http://localhost:3000/api/ipfs/health)

### 6. Start the frontend (terminal 2)

From the **repo root**:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 7. Connect the right wallet for each role

The app uses **whichever MetaMask account is currently selected**. It does not pick an address for you.

1. Install MetaMask and import/create separate accounts (e.g. Farmer, Validator, Government, Buyer).
2. Add **Celo Sepolia** (chain ID `11142220`).
3. Get test CELO from the [Celo faucet](https://faucet.celo.org/); import Sepolia cUSD for buyers.
4. In MetaMask, **select the account** that matches the role you want.
5. In the app: **Connect Wallet** → on Role select, tap the matching card.

| Role card | Needs on-chain role | If wrong wallet |
|-----------|---------------------|-----------------|
| Wool & Mohair Farmer | `FARMER_ROLE` (via `seed:roles`) | Onboarding / pending |
| LNWMGA Validator | `VALIDATOR_ROLE` | Validator pending |
| Government | `GOVERNMENT_ROLE` on marks/news | Government pending |
| Buyer / Verifier | none | Always available when connected |

To switch roles: change account in MetaMask → refresh → Connect again → choose that role card.

### 8. Smoke-test the main flows

| Role | What to try |
|------|-------------|
| **Wool & mohair farmer** | Register a lot → review → confirm on-chain → My Lots → QR proof → list on Market (oracle suggestion if prices seeded) |
| **Validator** | Validation queue → approve/reject → escrow release queue |
| **Buyer** | Marketplace → purchase (approve cUSD) → purchase history → rate farmer |
| **Public** | `/verify` or `/buyer/verify` — verify by lot ID + proof hash |
| **Government** | Issue/revoke industry marks · compose news bulletin |
| **Advanced** | Farmer gas subsidy claim · open dispute while offer is IN_ESCROW |

---

## Full Setup (deploy your own contracts)

Use this if you want a fresh deployment instead of the bundled Celo Sepolia addresses.

### 1. Compile and test contracts

```bash
npm run compile
npm test
```

Advanced-contract helper tests:

```bash
npm run test --workspace=originshear-contracts -- test/AdvancedFeatures.test.js
```

### 2. Deploy to Celo Sepolia

In `originshear-contracts/.env` set:

```env
PRIVATE_KEY=0x...
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
```

Deployer needs test CELO. Deploy uses **Mento cUSD** `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` on Sepolia.

```bash
npm run deploy:celo-sepolia
```

This creates/updates `originshear-contracts/deployments.celoSepolia.json`.

### 3. Sync addresses to frontend and API

```bash
npm run sync:addresses celoSepolia
```

Also set `RELAYER_PRIVATE_KEY` in `api/.env` to the same deployer key (for relayed validator/gov writes).

### 4. Grant on-chain roles

```bash
FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles
```

Without `DEV_BYPASS_ROLE_GUARDS`:

- **Farmer**: `registerFarmer` / `FARMER_ROLE` (+ `FARMER_ROLE` on GasSubsidyPool via seed)
- **Validator**: `VALIDATOR_ROLE` on HarvestLedger + FarmerMarket (+ `ARBITER_ROLE` on DisputeResolution)
- **Government**: `GOVERNMENT_ROLE` on IndustryMarkRegistry + NewsBulletin (+ GasSubsidyPool)

### 5. (Optional) Redeploy subgraph

After a full redeploy, marketplace list endpoints need a subgraph that indexes the **new** addresses:

```bash
npm run sync:subgraph celoSepolia
npm run subgraph:build
# then deploy from subgraph/ with your Graph Studio credentials
```

Update `GRAPHQL_ENDPOINT` in `api/.env` to the new Studio query URL.

---

## Environment Variables Reference

### API (`api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing API session tokens |
| `CELO_SEPOLIA_RPC_URL` | Yes | RPC endpoint for Celo Sepolia |
| `HARVEST_LEDGER_ADDRESS` | Yes* | HarvestLedger |
| `FARMER_MARKET_ADDRESS` | Yes* | FarmerMarket |
| `PROOF_OF_ORIGIN_VERIFIER_ADDRESS` | Yes* | Verifier |
| `INDUSTRY_MARK_REGISTRY_ADDRESS` | For marks/gov | Industry marks |
| `NEWS_BULLETIN_ADDRESS` | For news | News bulletins |
| `GAS_SUBSIDY_POOL_ADDRESS` | For subsidy API | Gas subsidy pool |
| `DISPUTE_RESOLUTION_ADDRESS` | For disputes API | Dispute resolution |
| `REPUTATION_SYSTEM_ADDRESS` | For reputation API | Reputation |
| `PRICE_ORACLE_ADDRESS` | For oracle API | Price oracle |
| `MULTI_SIG_TREASURY_ADDRESS` | Optional | Multi-sig treasury |
| `GRAPHQL_ENDPOINT` | Recommended | The Graph subgraph URL |
| `RELAYER_PRIVATE_KEY` | For relayed writes | Deployer/admin key |
| `IPFS_DEV_FALLBACK` | Dev | `true` = local metadata store when IPFS fails |
| `DEV_BYPASS_ROLE_GUARDS` | Dev only | Skip validator/government role checks |

\*Required for on-chain reads/writes. Prefer `npm run sync:addresses celoSepolia` over hand-editing.

See `api/.env.example` for the full list including IPFS options (Pinata, Infura JWT, local node).

### Frontend (`originshear-frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | API base URL (default `http://localhost:3000`) |
| `VITE_CELO_SEPOLIA_RPC_URL` | Recommended | RPC for wagmi/viem |
| `VITE_CELO_SEPOLIA_*` | Yes | Contract addresses (synced from deployments) |
| `VITE_DEV_BYPASS_ROLE_GUARDS` | Dev only | Unlock all role routes locally |
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional | Enables WalletConnect connector |
| `VITE_IPFS_GATEWAY` | Optional | Public IPFS gateway for metadata links |

---

## Running Tests

```bash
# Smart contract unit tests (core + advanced helpers)
npm test

# API integration tests — run from repo root
npm run test:api

# Data-value edge-case suite
npm run assess:test-data-values

# Full assessment bundle (contracts + API)
npm run assess:test-strategies

# Live smoke test (API must be running)
npm run smoke
# Against a remote API:
SMOKE_API_BASE=https://your-api.example.com npm run smoke
```

API tests only:

```bash
cd api
npm test
```

### CI / CD

- **CI** (`.github/workflows/ci.yml`) — on every push/PR: frontend build, contract tests, API tests, subgraph build.
- **CD** (`.github/workflows/cd.yml`) — after green CI on `main`/`master` (or manual dispatch): builds the frontend for the target network and uploads `originshear-frontend/dist` as an artifact. Optional Vercel publish when repo variable `ENABLE_VERCEL_DEPLOY=true` and secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` are set.

Set GitHub **Variables** for production builds: `CHAIN_NETWORK`, `VITE_API_BASE_URL`, and the `VITE_CELO_SEPOLIA_*` / `VITE_CELO_*` address vars.

### Switch Sepolia ↔ mainnet (env-driven)

```bash
# Stay on / return to Sepolia (default)
npm run use:sepolia

# After contracts are deployed to Celo mainnet:
npm run deploy:celo
npm run use:mainnet
# Then restart API + frontend (or redeploy hosts) with:
#   CHAIN_NETWORK=celo
#   VITE_CHAIN_NETWORK=celo
#   DEV_BYPASS / VITE_DEV_BYPASS_ROLE_GUARDS=false
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
| **`Missing script: "seed:roles"`** | You are not in `OriginShear/` — `cd` into the folder that contains root `package.json` |
| **Frontend can't reach API** | API on port 3000; `VITE_API_BASE_URL=http://localhost:3000` |
| **Wrong network** | MetaMask → Celo Sepolia (chain ID `11142220`) |
| **Unauthorized / pending role** | Select the wallet that was seeded for that role, or set `VITE_DEV_BYPASS_ROLE_GUARDS=true` / `DEV_BYPASS_ROLE_GUARDS=true` for local UI-only testing |
| **`balanceOf` / cUSD errors** | Use Sepolia Mento cUSD `0xdE9e4C3c…`, not Alfajores `0x8740…`; redeploy if contracts were built with the wrong token |
| **IPFS upload failed** | Set `IPFS_DEV_FALLBACK=true` in `api/.env` |
| **Marketplace empty** | Subgraph may lag or still index old addresses — check `GRAPHQL_ENDPOINT` / redeploy subgraph |
| **Validator queue empty** | Lots must be `PENDING`; farmer must finish registration on the **current** HarvestLedger |
| **Subsidy deposit skipped (0 cUSD)** | Fund deployer with Sepolia cUSD, then `SEED_SUBSIDY_DEPOSIT=true npm run seed:advanced` |
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
