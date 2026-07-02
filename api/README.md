# ORIGINSHEAR API

REST API layer for ORIGINSHEAR with JWT authentication, rate limiting, and caching.

## Features

- **JWT Authentication**: Wallet signature-based auth
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
- `JWT_SECRET`: Secret for JWT token signing
- `FRONTEND_URL`: Frontend URL for CORS
- `CELO_SEPOLIA_RPC_URL`: Celo Sepolia RPC endpoint
- `GRAPHQL_ENDPOINT`: The Graph subgraph endpoint

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with wallet signature
- `POST /api/auth/verify` - Verify JWT token

### Lots

- `GET /api/lots` - Get lots with pagination
- `GET /api/lots/:id` - Get lot by ID
- `POST /api/lots` - Register new lot
- `PUT /api/lots/:id/validate` - Validate lot

### Farmers

- `GET /api/farmers/:wallet` - Get farmer profile
- `GET /api/farmers/:wallet/lots` - Get farmer lots
- `GET /api/farmers/:wallet/stats` - Get farmer statistics

### Market

- `GET /api/market/offers` - Get market offers
- `GET /api/market/offers/:id` - Get offer by ID
- `POST /api/market/offers` - List lot for sale
- `POST /api/market/offers/:id/purchase` - Purchase lot
- `POST /api/market/offers/:id/release` - Release payment
- `GET /api/market/payments` - Get payment history

### Marks

- `GET /api/marks` - Get marks
- `GET /api/marks/:id` - Get mark by ID
- `GET /api/marks/farmer/:wallet` - Get farmer marks
- `POST /api/marks` - Issue new mark
- `PUT /api/marks/:id/revoke` - Revoke mark

## Rate Limiting

- 50 requests per 15 minutes per IP
- Health check endpoint (`/health`) is exempt
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Caching

- 5-minute TTL for most endpoints
- Cache keys include query parameters
- Automatically invalidated on writes

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure monitoring/logging
