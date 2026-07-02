# ORIGINSHEAR IPFS Integration

IPFS integration for storing metadata, photos, and documents for ORIGINSHEAR.

## Features

- Upload metadata to IPFS
- Upload files (photos, documents)
- Retrieve metadata from IPFS
- Gateway URL generation
- Batch upload for lots with photos
- Farmer profile with documents

## Setup

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
