# ORIGINSHEAR IPFS Integration

IPFS helpers for storing wool and mohair lot metadata, photos, and documents.

**Day-to-day app usage:** the running frontend uploads lot metadata through the
API (`POST /api/ipfs/lot-metadata`). Configure IPFS in **`api/.env`** (see
`api/.env.example` and `api/README.md`). You usually do **not** need to run
this `ipfs/` package separately for local demos.

For local development without Pinata/Infura, set on the API:

```env
IPFS_DEV_FALLBACK=true
```

Metadata is then stored under `api/data/ipfs-dev/` and returned as a usable URI.

## Features (this package)

- Upload metadata to IPFS
- Upload files (photos, documents)
- Retrieve metadata from IPFS
- Gateway URL generation
- Batch upload for lots with photos
- Wool and mohair farmer profile with documents

## Setup (standalone helpers)

```bash
cd ipfs
npm install
cp .env.example .env
# Edit .env with your IPFS configuration
```

## Environment Variables

- `IPFS_API_URL`: IPFS node API URL (default: Infura)
- `INFURA_PROJECT_ID`: Infura project ID
- `INFURA_PROJECT_SECRET`: Infura project secret
- `IPFS_GATEWAY`: Public gateway URL (default: ipfs.io)

For the **API** (recommended path), also see:

- `PINATA_JWT` / `IPFS_GATEWAY` (Pinata)
- `INFURA_JWT_KEY_ID` + private key path (Infura JWT)
- `IPFS_DEV_FALLBACK=true` (local fallback)

## Usage

```javascript
const ipfs = require('./src/index');

// Upload lot metadata with photos
const lotData = {
  farmerId: 'LS-12345',
  fibreType: 'WOOL',
  grade: 'A',
  weightGrams: 50000,
  gpsZone: 'QUTHING-A',
  seasonYear: '2026'
};

const photos = [photoBuffer1, photoBuffer2];
const cid = await ipfs.uploadLotMetadata(lotData, photos);

// Retrieve metadata
const metadata = await ipfs.getMetadata(cid);

// Get gateway URL
const url = ipfs.getGatewayUrl(cid);
```

## Integration with Smart Contracts

When registering a lot in `HarvestLedger.sol`, pass the IPFS CID as the `metadataURI`:

```solidity
registerLot(
    fibreType,
    grade,
    weightGrams,
    gpsZone,
    seasonYear,
    "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx" // IPFS CID
);
```

In the app, the Register Lot review step calls the API first, then submits
`registerLot` with the returned URI.

## Storage Structure

### Lot Metadata
```json
{
  "farmerId": "LS-12345",
  "fibreType": "WOOL",
  "grade": "A",
  "weightGrams": 50000,
  "gpsZone": "QUTHING-A",
  "seasonYear": "2026",
  "photos": [
    "ipfs://QmPhoto1",
    "ipfs://QmPhoto2"
  ],
  "uploadedAt": "2026-01-15T10:30:00Z",
  "version": "1.0"
}
```

### Farmer Profile
```json
{
  "farmerId": "LS-12345",
  "name": "John Doe",
  "district": "Quthing",
  "phone": "+266123456789",
  "documents": {
    "nationalId": "ipfs://QmIdDoc",
    "registration": "ipfs://QmRegDoc"
  },
  "uploadedAt": "2026-01-15T10:30:00Z",
  "version": "1.0"
}
```

## Pinning

For production, use a pinning service to ensure content persistence:
- Pinata
- Web3.storage
- Filebase
- NFT.Storage

## Gateway Options

- Public: https://ipfs.io/ipfs
- Infura: https://infura-ipfs.io/ipfs
- Cloudflare: https://cloudflare-ipfs.com/ipfs
- Pinata: https://gateway.pinata.cloud/ipfs

## Related docs

- App runbook: [`../README.md`](../README.md)
- API IPFS routes: [`../api/README.md`](../api/README.md)
