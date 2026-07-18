# ORIGINSHEAR API

REST API layer for ORIGINSHEAR with nonce-based wallet authentication, JWT sessions, rate limiting, and caching.

## Features

- **Replay-resistant Auth**: One-time nonce challenge + wallet signature login
- **On-chain Role Authorization**: Relayer writes gated by live role checks (`VALIDATOR_ROLE`, `GOVERNMENT_ROLE`)
- **Rate Limiting**: 50 requests per 15 minutes (optimized for 2G/3G)
- **Caching**: 5-minute cache for frequently accessed data
- **Compression**: gzip compression for bandwidth optimization
- **Security**: Helmet.js headers, CORS, input validation
- **IPFS**: lot metadata upload (Pinata / Infura / local / dev fallback)
- **Advanced reads**: subsidy availability, disputes, price oracle suggestions, reputation

## Setup

From the **OriginShear** repo root (recommended):

```bash
npm install --prefix api
cp api/.env.example api/.env
cp originshear-frontend/.env.example originshear-frontend/.env   # if needed for sync
npm run sync:addresses celoSepolia   # fills contract addresses in api/.env + frontend .env
```

Then edit `api/.env` for secrets:

```env
JWT_SECRET=<long-random-string>
RELAYER_PRIVATE_KEY=<deployer_private_key>   # same wallet that deployed / has admin roles
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
GRAPHQL_ENDPOINT=<your Graph Studio query URL>
IPFS_DEV_FALLBACK=true
```

Start:

```bash
cd api
npm run dev
```

Health check: [http://localhost:3000/health](http://localhost:3000/health) → `{ "status": "ok", ... }`.

> Never commit `api/.env`.

## Environment Variables

See `.env.example`. Common keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `3000` |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | Default `24h` |
| `AUTH_CHALLENGE_TTL_SECONDS` | No | Default `300` |
| `ENABLE_ONCHAIN_ROLE_RESOLUTION` | No | Embed roles in JWT on login |
| `FRONTEND_URL` | No | CORS allowlist (comma-separated) |
| `CELO_SEPOLIA_RPC_URL` | Yes | Celo Sepolia RPC |
| `RELAYER_PRIVATE_KEY` | For relayed writes | Validator/gov/dispute resolve txs |
| `HARVEST_LEDGER_ADDRESS` | Yes* | Core ledger |
| `FARMER_MARKET_ADDRESS` | Yes* | Marketplace |
| `PROOF_OF_ORIGIN_VERIFIER_ADDRESS` | Yes* | Verifier |
| `INDUSTRY_MARK_REGISTRY_ADDRESS` | Marks | Marks registry |
| `NEWS_BULLETIN_ADDRESS` | News | News bulletin |
| `GAS_SUBSIDY_POOL_ADDRESS` | Subsidy API | Gas subsidy |
| `DISPUTE_RESOLUTION_ADDRESS` | Disputes API | Disputes |
| `REPUTATION_SYSTEM_ADDRESS` | Reputation API | Reputation |
| `PRICE_ORACLE_ADDRESS` | Oracle API | Price oracle |
| `MULTI_SIG_TREASURY_ADDRESS` | Optional | Treasury |
| `GRAPHQL_ENDPOINT` | Recommended | The Graph query URL |
| `IPFS_DEV_FALLBACK` | Dev | Local metadata under `api/data/ipfs-dev/` |
| `DEV_BYPASS_ROLE_GUARDS` | Dev only | Skip on-chain role checks |

\*Prefer `npm run sync:addresses celoSepolia` from the repo root after deploy.

**cUSD on Celo Sepolia** (used by deployed market/subsidy contracts):  
`0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` — not the Alfajores address.

## API Endpoints

### Authentication

- `POST /api/auth/challenge` - Create one-time login challenge message for a wallet
- `POST /api/auth/login` - Login with signed challenge (wallet + nonce + signature)
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/wallet-event` - Receive wallet connect UI events (`connect_clicked`, `connect_success`, `connect_failed`)

Auth flow:
1. Client calls `/api/auth/challenge` with wallet address.
2. Client signs returned `message` using the same wallet.
3. Client calls `/api/auth/login` with `wallet`, `nonce`, and `signature`.
4. API verifies signature + nonce (one-time, time-limited) and returns JWT.
5. If `ENABLE_ONCHAIN_ROLE_RESOLUTION=true`, API resolves role claims from configured contracts and embeds them in JWT (`primary role` + role flags). Otherwise login defaults to `BUYER` role claims.

### Lots

- `GET /api/lots` - Get lots with pagination
- `GET /api/lots/:id` - Get lot by ID
- `POST /api/lots` - Register new lot (returns wallet-call instructions; no farmer relayer yet)
- `PUT /api/lots/:id/validate` - Validate lot (validator + relayer)

### Farmers

- `GET /api/farmers/:wallet` - Get farmer profile (subgraph-backed)
- `GET /api/farmers/:wallet/lots` - Get farmer lots (subgraph-backed, paginated)
- `GET /api/farmers/:wallet/stats` - Get farmer statistics (lots, sales, revenue)

### Market

- `GET /api/market/offers` - Get market offers
- `GET /api/market/offers/:id` - Get offer by ID
- `POST /api/market/offers` - List lot for sale (returns wallet-call instructions; no farmer relayer yet)
- `POST /api/market/offers/:id/purchase` - Purchase lot (returns wallet-call instructions; no buyer relayer yet)
- `POST /api/market/offers/:id/release` - Release payment (validator + relayer)
- `GET /api/market/payments` - Get payment history (`PaymentReleased` net/fee)

### Marks

- `GET /api/marks` - Get marks (subgraph-backed, paginated/filterable)
- `GET /api/marks/:id` - Get mark by ID (subgraph-backed)
- `GET /api/marks/farmer/:wallet` - Get farmer marks (subgraph-backed)
- `POST /api/marks` - Issue new mark (relayer-signed on-chain write)
- `PUT /api/marks/:id/revoke` - Revoke mark (relayer-signed on-chain write)

### News

- `GET /api/news` - Get government bulletins (shared feed)
- `POST /api/news` - Publish a government bulletin (government + relayer)

### IPFS

- `POST /api/ipfs/lot-metadata` - Upload lot metadata JSON and return `ipfs://` URI + gateway URL
- `GET /api/ipfs/health` - IPFS / fallback status

### Subsidy / Disputes / Oracle / Reputation

- `GET /api/subsidy?farmer=0x…` - Available daily claim + pool balance
- `GET /api/disputes/offer/:offerId` - Disputes for an offer
- `GET /api/disputes/:disputeId` - Dispute details
- `POST /api/disputes/:disputeId/resolve` - Arbiter/validator-relayed resolve (`resolution` 2=farmer, 3=buyer)
- `GET /api/oracle/suggest?fibreType=&grade=&weightGrams=` - Suggested ask price
- `GET /api/reputation/:wallet` - On-chain reputation (or empty if unregistered)

Opening disputes, claiming subsidy, and submitting reviews stay **wallet-direct** in the frontend.

## Rate Limiting

- 50 requests per 15 minutes per IP
- Health check endpoint (`/health`) is exempt
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Caching

- 5-minute TTL for most endpoints
- Cache keys include query parameters
- Automatically invalidated on writes

## Testing

```bash
cd api

# Standard local run
npm test

# CI-equivalent run (used in GitHub Actions)
npm run test:ci

# Troubleshooting flaky async handles/sockets
npm run test:ci:debug
```

From repo root:

```bash
npm run test:api
npm run assess:test-data-values
```

Guidance:
- Use `npm test` for day-to-day local checks.
- Use `npm run test:ci` before pushing if you want to match CI behavior exactly.
- Use `npm run test:ci:debug` when tests hang or Jest reports open handles.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins (`FRONTEND_URL`)
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure monitoring/logging
7. Set `RELAYER_PRIVATE_KEY` for validator/gov relayed actions (`validateLot`, `releasePayment`, marks, news, dispute resolve)
8. Ensure caller wallets are granted on-chain roles before relayer writes:
   - `VALIDATOR_ROLE` on `HARVEST_LEDGER_ADDRESS` / `FARMER_MARKET_ADDRESS`
   - `GOVERNMENT_ROLE` on `INDUSTRY_MARK_REGISTRY_ADDRESS` / `NEWS_BULLETIN_ADDRESS`
   - `ARBITER_ROLE` on `DISPUTE_RESOLUTION_ADDRESS` for the relayer when resolving disputes
9. Keep `DEV_BYPASS_ROLE_GUARDS` unset/false in production

## Related docs

- Full app runbook + submission guide: [`../README.md`](../README.md)
- Role seeding: `npm run seed:roles` / `npm run seed:advanced` from repo root
- Contracts: [`../originshear-contracts/README.md`](../originshear-contracts/README.md)
