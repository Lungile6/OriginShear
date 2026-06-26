# ORIGINSHEAR

**Design and Implementation of a High-Performance Blockchain Ledger for Enhancing Supply Chain Transparency and Market Access for Lesotho Farmers**

> African Leadership University · Bachelor of Science in Software Engineering
> Submitted by: Lungile Mabelebele · Supervisor: Dr. Aaron Izang · May 2026

**Tagline:** "Your record is protected · *Rekota ea hau e sirelelitsoe*"

---

## Overview

ORIGINSHEAR gives every wool and mohair bale produced by smallholder farmers in Lesotho's Quthing district an unforgeable digital identity on the **Celo blockchain**. Farmers register harvest lots from a basic Android phone on 2G/3G, receive a cryptographic **Proof of Origin** hash, generate QR codes for export checkpoint verification, and receive **cUSD** payments directly from buyers — removing intermediaries who currently capture 15–22% of farm-gate value.

### The Problem

- **25%** of Lesotho's organic wool shipments are rejected or underpriced at South African export checkpoints due to missing traceability records.
- **15–22%** of farm-gate value is captured by intermediaries before farmers receive payment.
- The Lesotho Agricultural Information System (LAIS) can be edited by officials without trace.
- Paper records get lost or falsified in the Quthing highland supply chain.

### The Solution

| Step | What happens |
|---|---|
| 1. Register | Farmer submits a harvest lot (fibre type, grade, weight, GPS zone, season) from their phone |
| 2. Proof of Origin | The contract computes a `keccak256` hash unique to that lot, on-chain |
| 3. QR Code | Farmer generates a QR code encoding the lot ID and Proof of Origin |
| 4. Get Paid | Buyer scans the QR at the checkpoint, purchases via cUSD escrow, farmer is paid directly |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Celo (mobile-first, Africa-optimised, near-zero gas fees) |
| Smart contracts | Solidity `0.8.24` |
| Dev environment | Hardhat + Chai/Mocha |
| Security libraries | OpenZeppelin `AccessControl`, `Pausable`, `ReentrancyGuard` |
| Frontend | React + Vite (mobile-first web app) |
| Payment token | cUSD (Celo's USD-pegged stablecoin) |

---

## Project Structure

```
originshear-contracts/
├── contracts/
│   ├── HarvestLedger.sol          ← core registry + Proof of Origin
│   ├── FarmerMarket.sol           ← cUSD escrow marketplace
│   ├── ProofOfOriginVerifier.sol  ← buyer / QR verification
│   └── MockCUSD.sol                ← test-only ERC-20 (local testing only)
├── scripts/
│   └── deploy.js                  ← deploys all contracts + saves addresses
├── test/
│   └── AgriChain.test.js          ← full Hardhat test suite (22 tests)
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

---

## Smart Contracts

### 1. `HarvestLedger.sol`

The core, immutable registry of harvest lots.

- **Roles:** `DEFAULT_ADMIN_ROLE` (LNWMGA system admin), `VALIDATOR_ROLE` (LNWMGA district validators), `FARMER_ROLE` (registered smallholder farmers).
- **`registerFarmer(wallet, farmerId, district)`** — admin-only; onboards a farmer and grants them `FARMER_ROLE`.
- **`registerLot(fibreType, grade, weightGrams, gpsZone, seasonYear, metadataURI)`** — farmer-only; registers a new lot and computes its Proof of Origin hash:
  ```
  proofOfOrigin = keccak256(farmer, lotId, fibreType, grade, weightGrams, gpsZone, seasonYear)
  ```
- **`validateLot(lotId, approve)`** — validator-only; approves or rejects a pending lot.
- **`verifyProofOfOrigin(lotId, proofHash)`** — view function checking whether a submitted hash matches the on-chain record.
- Includes `Pausable` (emergency stop) and `ReentrancyGuard` protections.

### 2. `FarmerMarket.sol`

cUSD escrow marketplace for **validated** lots.

| Step | Function | Caller |
|---|---|---|
| 1 | `listLot(lotId, askPrice)` | Farmer (lot must be `VALIDATED`) |
| 2 | `purchaseLot(offerId)` | Buyer (deposits cUSD into escrow) |
| 3 | `releasePayment(offerId)` | LNWMGA validator (confirms handover) |

- A **2% platform fee** (`platformFeeBps`, capped at 5%) is deducted on release and sent to `feeRecipient`, subsidising gas costs for rural farmers.
- cUSD token addresses:
  - Alfajores testnet: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
  - Celo mainnet: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

### 3. `ProofOfOriginVerifier.sol`

Lightweight, read-only verifier for buyer/exporter QR scanning at checkpoints.

- **`verify(lotId, proofHash)`** — free `eth_call`, zero gas cost; returns full lot details plus `valid` and `isValidated` flags.
- **`logVerification(lotId, proofHash)`** — same as `verify()`, but emits a `VerificationLogged` event for an on-chain audit trail.
- **`computeExpectedProof(...)`** — pure helper for off-chain clients (e.g. the mobile app) to recompute the expected Proof of Origin hash.

### 4. `MockCUSD.sol` (testing only)

A minimal ERC-20 used by the Hardhat test suite to simulate cUSD locally. **Never deploy this to a live network** — use the real cUSD addresses above.

---

## Security Architecture

| Layer | Implementation | Threat addressed |
|---|---|---|
| 1. Proof of Origin Hash | `keccak256(farmer + lotId + fibreType + grade + weight + gpsZone + season)` | LAIS-style data tampering |
| 2. Chain integrity + ReentrancyGuard | On-chain immutable records + OpenZeppelin `nonReentrant` | Ledger forgery / cUSD escrow drain |
| 3. AccessControl | `FARMER_ROLE`, `VALIDATOR_ROLE`, `DEFAULT_ADMIN_ROLE` | Unauthorized lot submission / rogue validator |
| 4. JWT Auth + rate limiting (API layer) | 50 req/session, schema validation | API abuse on 2G networks |
| 5. TLS 1.3 transport (API layer) | HTTPS on all API traffic | Interception on rural mobile networks |

---

## Setup & Usage

### 1. Install dependencies

```bash
npm install
```

### 2. Run the full test suite (22 tests)

```bash
npx hardhat test
```

### 3. Get test CELO

Visit the Alfajores faucet: https://faucet.celo.org/alfajores

### 4. Deploy to Alfajores testnet

```bash
cp .env.example .env
# edit .env and set PRIVATE_KEY=0x...
npx hardhat run scripts/deploy.js --network alfajores
```

### 5. Grant additional LNWMGA validator roles

```bash
npx hardhat console --network alfajores
> const ledger = await ethers.getContractAt("HarvestLedger", "0xYOUR_LEDGER_ADDRESS")
> const VALIDATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE"))
> await ledger.grantRole(VALIDATOR_ROLE, "0xLNWMGA_OFFICE_WALLET")
```

### 6. Deploy to Celo mainnet (after a successful testnet trial)

```bash
npx hardhat run scripts/deploy.js --network celo
```

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
```

---

## License

MIT
