# ORIGINSHEAR

**Design and Implementation of a High-Performance Blockchain Ledger for Enhancing Supply Chain Transparency and Market Access for Lesotho Wool and Mohair Farmers**

> African Leadership University · Bachelor of Science in Software Engineering
> Submitted by: Lungile Mabelebele · Supervisor: Dr. Aaron Izang · May 2026

**Tagline:** "Your record is protected · *Rekota ea hau e sirelelitsoe*"

---

## Overview

ORIGINSHEAR gives every wool and mohair bale produced by Lesotho wool and mohair farmers an unforgeable digital identity on the **Celo blockchain**. Farmers register harvest lots from a basic Android phone on 2G/3G, receive a cryptographic **Proof of Origin** hash, generate QR codes for export checkpoint verification, and receive **cUSD** payments directly from buyers — removing intermediaries who currently capture 15–22% of farm-gate value.

### The Problem

- **25%** of Lesotho's wool and mohair shipments are rejected or underpriced at South African export checkpoints due to missing traceability records.
- **15–22%** of farm-gate value is captured by intermediaries before wool and mohair farmers receive payment.
- The Lesotho Agricultural Information System (LAIS) can be edited by officials without trace.
- Paper records get lost or falsified across Lesotho's wool and mohair supply chain.

### The Solution

| Step | What happens |
|---|---|
| 1. Register | Wool and mohair farmer submits a harvest lot (fibre type, grade, weight, GPS zone, season) from their phone |
| 2. Proof of Origin | The contract computes a `keccak256` hash unique to that lot, on-chain |
| 3. QR Code | Farmer generates a QR code encoding the lot ID and Proof of Origin |
| 4. Get Paid | Buyer scans the QR at the checkpoint, purchases via cUSD escrow; the wool and mohair farmer is paid directly |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Celo (mobile-first, Africa-optimised, near-zero gas fees) |
| Smart contracts | Solidity `0.8.20` |
| Dev environment | Hardhat + Chai/Mocha |
| Security libraries | OpenZeppelin `AccessControl`, `Pausable`, `ReentrancyGuard` |
| Frontend | React + Vite (mobile-first web app) — see `originshear-frontend/` |
| Payment token | cUSD (Mento USD-pegged stablecoin) |

---

## Project Structure

```
originshear-contracts/
├── contracts/
│   ├── HarvestLedger.sol          ← core registry + Proof of Origin
│   ├── FarmerMarket.sol           ← cUSD escrow marketplace
│   ├── ProofOfOriginVerifier.sol  ← buyer / QR verification
│   ├── IndustryMarkRegistry.sol   ← government ear tags / branding marks
│   ├── NewsBulletin.sol           ← government notices
│   ├── GasSubsidyPool.sol         ← farmer gas subsidy from platform fees
│   ├── DisputeResolution.sol      ← escrow disputes + arbiter resolve
│   ├── ReputationSystem.sol       ← post-trade reviews
│   ├── PriceOracle.sol            ← fibre/grade price suggestions
│   ├── MultiSigTreasury.sol       ← multi-sig fee treasury
│   └── MockCUSD.sol               ← test-only ERC-20 (local Hardhat only)
├── scripts/
│   └── deploy.js                  ← deploys all contracts + saves addresses
├── test/
│   ├── AgriChain.test.js          ← core suite (HarvestLedger, Verifier, Market)
│   └── AdvancedFeatures.test.js ← dispute / subsidy / treasury / oracle helpers
├── deployments.celoSepolia.json   ← current Sepolia addresses (committed for demos)
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Smart Contracts

### 1. `HarvestLedger.sol`

The core, immutable registry of harvest lots.

- **Roles:** `DEFAULT_ADMIN_ROLE` (LNWMGA system admin), `VALIDATOR_ROLE` (LNWMGA district validators), `FARMER_ROLE` (registered wool and mohair farmers).
- **`registerFarmer(wallet, farmerId, district)`** — admin-only; onboards a farmer and grants them `FARMER_ROLE`.
- **`registerLot(fibreType, grade, weightGrams, gpsZone, seasonYear, metadataURI)`** — farmer-only; registers a new lot and computes its Proof of Origin hash:
  ```
  proofOfOrigin = keccak256(farmer, lotId, fibreType, grade, weightGrams, gpsZone, seasonYear)
  ```
- **`validateLot(lotId, approve)`** — validator-only; approves or rejects a pending lot.
- **`verifyProofOfOrigin(lotId, proofHash)`** — view function checking whether a submitted hash matches the on-chain record.
- **`totalLots()`** — enumeration helper for validator UIs / indexing fallbacks.
- Includes `Pausable` and `ReentrancyGuard` protections.

### 2. `FarmerMarket.sol`

cUSD escrow marketplace for **validated** lots.

| Step | Function | Caller |
|---|---|---|
| 1 | `listLot(lotId, askPrice)` | Farmer (lot must be `VALIDATED`) |
| 2 | `purchaseLot(offerId)` | Buyer (deposits cUSD into escrow) |
| 3 | `releasePayment(offerId)` | LNWMGA validator (confirms handover) |

- A **2% platform fee** (`platformFeeBps`, capped at 5%) is deducted on release and sent to `feeRecipient`.
- cUSD token addresses:
  - **Celo Sepolia:** `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` (Mento cUSD — **required**)
  - Celo mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
  - Alfajores legacy: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` — **do not use on Sepolia**

### 3. `ProofOfOriginVerifier.sol`

Lightweight, read-only verifier for buyer/checkpoint QR scanning.

- **`verify(lotId, proofHash)`** — free `eth_call`; returns lot details plus `valid` / `isValidated`.
- **`logVerification(lotId, proofHash)`** — same checks, emits `VerificationLogged`.
- **`computeExpectedProof(...)`** — pure helper for off-chain clients.

### 4. Extended platform contracts

| Contract | Purpose |
|----------|---------|
| `IndustryMarkRegistry` | Government-issued marks (issue / revoke / expiry) |
| `NewsBulletin` | Government price alerts and notices |
| `GasSubsidyPool` | Farmers claim daily cUSD gas subsidy (`FARMER_ROLE` on this contract) |
| `DisputeResolution` | Open/resolve disputes on `IN_ESCROW` offers (`ARBITER_ROLE`) |
| `ReputationSystem` | Post-purchase reviews / reputation scores |
| `PriceOracle` | `getSuggestedPrice(fibre, grade, weightGrams)` for listings |
| `MultiSigTreasury` | Multi-signature withdrawals / subsidy grants |

### 5. `MockCUSD.sol` (testing only)

Minimal ERC-20 for Hardhat tests. **Never deploy to a live network.**

---

## Security Architecture

| Layer | Implementation | Threat addressed |
|---|---|---|
| 1. Proof of Origin Hash | `keccak256(farmer + lotId + fibreType + grade + weight + gpsZone + season)` | LAIS-style data tampering |
| 2. Chain integrity + ReentrancyGuard | On-chain immutable records + OpenZeppelin `nonReentrant` | Ledger forgery / cUSD escrow drain |
| 3. AccessControl | `FARMER_ROLE`, `VALIDATOR_ROLE`, `DEFAULT_ADMIN_ROLE`, plus gov/arbiter/oracle roles | Unauthorized actions |
| 4. JWT Auth + rate limiting (API layer) | 50 req / 15 min, schema validation | API abuse on 2G networks |
| 5. TLS 1.3 transport (API layer) | HTTPS on all API traffic | Interception on rural mobile networks |

---

## Setup & Usage

Prefer running deploy/test scripts from the **monorepo root** (`OriginShear/`) so workspace scripts stay consistent. You can also work inside this package.

### 1. Install dependencies

From repo root:

```bash
npm install
```

Or:

```bash
cd originshear-contracts
npm install
```

### 2. Configure deployer key

Create `originshear-contracts/.env`:

```env
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
```

### 3. Run tests

```bash
# From repo root
npm test

# Or in this package
npx hardhat test
npx hardhat test test/AdvancedFeatures.test.js
```

### 4. Get test CELO (+ cUSD for market demos)

- CELO: https://faucet.celo.org/
- Import Sepolia cUSD in MetaMask: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b`

### 5. Deploy to Celo Sepolia

From repo root:

```bash
npm run deploy:celo-sepolia
```

Or:

```bash
npx hardhat run scripts/deploy.js --network celoSepolia
```

Writes `deployments.celoSepolia.json`. Then from repo root:

```bash
npm run sync:addresses celoSepolia
FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles
```

### 6. Grant roles manually (optional)

```bash
npx hardhat console --network celoSepolia
> const ledger = await ethers.getContractAt("HarvestLedger", "0xYOUR_LEDGER_ADDRESS")
> const VALIDATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE"))
> await ledger.grantRole(VALIDATOR_ROLE, "0xLNWMGA_OFFICE_WALLET")
```

### 7. Deploy to Celo mainnet (after a successful testnet trial)

```bash
npx hardhat run scripts/deploy.js --network celo
```

---

## Current Celo Sepolia deployment

See `deployments.celoSepolia.json` for the authoritative list (updated on each deploy). Summary fields: `HarvestLedger`, `FarmerMarket`, `ProofOfOriginVerifier`, `IndustryMarkRegistry`, `NewsBulletin`, `GasSubsidyPool`, `DisputeResolution`, `ReputationSystem`, `PriceOracle`, `MultiSigTreasury`, and `cUSD`.

---

## Gas Cost Estimates (Celo Mainnet)

| Operation | Gas units | Cost (USD) |
|---|---|---|
| `registerFarmer()` | ~80,000 | < $0.0001 |
| `registerLot()` | ~140,000 | < $0.0002 |
| `validateLot()` | ~45,000 | < $0.0001 |
| `listLot()` | ~90,000 | < $0.0001 |
| `purchaseLot()` | ~75,000 | < $0.0001 |
| `releasePayment()` | ~60,000 | < $0.0001 |
| **Total per farmer per season** | | **< $0.01** |

---

## Performance (Research Targets vs Results)

| Metric | Value |
|---|---|
| TPS at 512MB RAM (Celo) | 520 TPS |
| TPS at 512MB RAM (Ethereum, reference) | 15 TPS |
| TPS at 512MB RAM (Hyperledger, reference) | 210 TPS |
| Research target | 500 TPS |
| Proof of Origin collision rate | 0 (100-sample test) |
| Block time (Celo) | ~5 seconds |

---

## Contract Interaction Map

```
HarvestLedger ──getLot()──────────────→ FarmerMarket
HarvestLedger ──verifyProofOfOrigin()──→ ProofOfOriginVerifier
FarmerMarket  ──cUSD.transfer()────────→ Farmer wallet
FarmerMarket  ──cUSD.transfer()────────→ feeRecipient (2%)
Buyer         ──cUSD.transferFrom()────→ FarmerMarket escrow
DisputeResolution ──market.offers()───→ FarmerMarket (escrow status)
PriceOracle   ──getSuggestedPrice()────→ Farmer listing UI
GasSubsidyPool──claimSubsidy()────────→ Farmer wallet (cUSD)
```

---

## Related docs

- Full app runbook + submission checklist: [`../README.md`](../README.md)
- Frontend: [`../originshear-frontend/README.md`](../originshear-frontend/README.md)
- API: [`../api/README.md`](../api/README.md)

---

## License

MIT
