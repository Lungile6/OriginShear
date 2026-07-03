# ORIGINSHEAR API

REST API layer for ORIGINSHEAR with nonce-based wallet authentication, JWT sessions, rate limiting, and caching.

## Features

- **Replay-resistant Auth**: One-time nonce challenge + wallet signature login
- **On-chain Role Authorization**: Relayer writes are gated by live role checks (`VALIDATOR_ROLE`, `GOVERNMENT_ROLE`)
- **Rate Limiting**: 50 requests per 15 minutes (optimized for 2G/3G)
- **Caching**: 5-minute cache for frequently accessed data
- **Compression**: gzip compression for bandwidth optimization
- **Security**: Helmet.js headers, CORS, input validation

## Setup

```bash
cd api
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## Environment Variables

See `.env.example` for required variables:
- `PORT`: API server port (default: 3000)
- `JWT_SECRET`: Secret for JWT token signing (required)
- `JWT_EXPIRES_IN`: Token expiration window (default: `24h`)
- `AUTH_CHALLENGE_TTL_SECONDS`: Login challenge TTL in seconds (default: `300`)
- `ENABLE_ONCHAIN_ROLE_RESOLUTION`: Resolve login role claims from chain during `/auth/login` (default: `false`)
- `FRONTEND_URL`: Frontend URL for CORS
- `CELO_SEPOLIA_RPC_URL`: Celo Sepolia RPC endpoint
- `GRAPHQL_ENDPOINT`: The Graph subgraph endpoint
- `IPFS_API_URL`: IPFS API endpoint used for metadata uploads
- `INFURA_PROJECT_ID` / `INFURA_PROJECT_SECRET`: Optional credentials for Infura-backed IPFS API
- `IPFS_GATEWAY`: Public IPFS gateway used when returning browseable links

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
- `PUT /api/lots/:id/validate` - Validate lot

### Farmers

- `GET /api/farmers/:wallet` - Get farmer profile (subgraph-backed)
- `GET /api/farmers/:wallet/lots` - Get farmer lots (subgraph-backed, paginated)
- `GET /api/farmers/:wallet/stats` - Get farmer statistics (lots, sales, revenue)

### Market

- `GET /api/market/offers` - Get market offers
- `GET /api/market/offers/:id` - Get offer by ID
- `POST /api/market/offers` - List lot for sale (returns wallet-call instructions; no farmer relayer yet)
- `POST /api/market/offers/:id/purchase` - Purchase lot (returns wallet-call instructions; no buyer relayer yet)
- `POST /api/market/offers/:id/release` - Release payment
- `GET /api/market/payments` - Get payment history

### Marks

- `GET /api/marks` - Get marks (subgraph-backed, paginated/filterable)
- `GET /api/marks/:id` - Get mark by ID (subgraph-backed)
- `GET /api/marks/farmer/:wallet` - Get farmer marks (subgraph-backed)
- `POST /api/marks` - Issue new mark (relayer-signed on-chain write)
- `PUT /api/marks/:id/revoke` - Revoke mark (relayer-signed on-chain write)

### News

- `GET /api/news` - Get government bulletins (shared feed)
- `POST /api/news` - Publish a government bulletin

### IPFS

- `POST /api/ipfs/lot-metadata` - Upload lot metadata JSON and return `ipfs://` URI + gateway URL

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

Guidance:
- Use `npm test` for day-to-day local checks.
- Use `npm run test:ci` before pushing if you want to match CI behavior exactly.
- Use `npm run test:ci:debug` when tests hang or Jest reports open handles.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure monitoring/logging
7. Set `RELAYER_PRIVATE_KEY` only for validator-side relayed actions (`validateLot`, `releasePayment`)
8. Ensure caller wallets are granted on-chain roles before relayer writes:
   - `VALIDATOR_ROLE` on `HARVEST_LEDGER_ADDRESS`
   - `GOVERNMENT_ROLE` on `INDUSTRY_MARK_REGISTRY_ADDRESS`
