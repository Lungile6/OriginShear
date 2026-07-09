# ORIGINSHEAR Subgraph

The Graph subgraph for indexing ORIGINSHEAR contract events.

## Setup

```bash
cd subgraph
npm install
```

## Generate ABIs

Copy contract ABIs from the contracts directory:

```bash
mkdir -p abis
cp ../originshear-contracts/artifacts/contracts/HarvestLedger.sol/HarvestLedger.json abis/
cp ../originshear-contracts/artifacts/contracts/FarmerMarket.sol/FarmerMarket.json abis/
cp ../originshear-contracts/artifacts/contracts/IndustryMarkRegistry.sol/IndustryMarkRegistry.json abis/
```

## Update Contract Addresses

Contract addresses and deployment start blocks are synced from `deployments.celoSepolia.json`:

```bash
# From repo root
npm run sync:subgraph celoSepolia
```

Or edit `subgraph.yaml` manually. Use the contract creation block from Blockscout as `startBlock` (not `0`).

## Generate Types

```bash
npm run codegen
```

## Build

```bash
npm run build
```

## Deploy to The Graph

### Local Development

```bash
npm run create-local
npm run deploy-local
```

### Hosted Service (The Graph Studio)

From repo root:

```bash
npm run sync:subgraph celoSepolia
npm run subgraph:build
cd subgraph
npx graph auth --studio <YOUR_DEPLOY_KEY>
npx graph deploy --studio origin-shear --version-label v0.0.3
```

After deploy, set `GRAPHQL_ENDPOINT` in `api/.env` to the Studio query URL (e.g. `https://api.studio.thegraph.com/query/<id>/origin-shear/version/latest`). Wait until the subgraph shows **Synced** in Studio before testing API list endpoints.

If deploy returns **HTTP 504**, retry after a few minutes — Studio occasionally times out on upload.

## Query Examples

```graphql
# Get all lots for a farmer
query {
  farmers(where: { wallet: "0x..." }) {
    lots {
      id
      lotId
      status
      weightGrams
      offer {
        askPriceWei
        status
      }
    }
  }
}

# Get payment history with net amounts
query {
  payments(orderBy: timestamp, orderDirection: desc) {
    id
    farmer
    netAmount
    fee
    timestamp
    offer {
      lot {
        lotId
        farmer {
          farmerId
        }
      }
    }
  }
}

# Get all marks for a farmer
query {
  farmers(where: { wallet: "0x..." }) {
    marks {
      id
      markId
      markType
      status
      expiresAt
    }
  }
}
```
