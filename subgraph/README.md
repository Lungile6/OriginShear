# ORIGINSHEAR Subgraph

The Graph subgraph for indexing ORIGINSHEAR contract events (lots, market offers/payments, industry marks).

Used by the API for marketplace lists, farmer profiles, payment history, and marks.

## What is indexed

From `subgraph.yaml` (after address sync):

- **HarvestLedger** — farmers, lots, validation events  
- **FarmerMarket** — listings, purchases, `PaymentReleased` (net + fee)  
- **IndustryMarkRegistry** — issued / revoked marks  

News, subsidy, disputes, reputation, and oracle are read via RPC/API today (not all indexed here).

## Setup

```bash
cd subgraph
npm install
```

## Sync addresses from the latest deploy

After `npm run deploy:celo-sepolia` (or any new Sepolia deploy), from **repo root**:

```bash
npm run sync:subgraph celoSepolia
```

This updates `subgraph.yaml` contract addresses / start blocks from
`originshear-contracts/deployments.celoSepolia.json`.

Or edit `subgraph.yaml` manually. Prefer the contract creation block from
[Celo Sepolia Blockscout](https://celo-sepolia.blockscout.com) as `startBlock` (not `0`).

## Generate ABIs / types / build

```bash
# Optional: refresh ABIs from compiled artifacts
mkdir -p abis
cp ../originshear-contracts/artifacts/contracts/HarvestLedger.sol/HarvestLedger.json abis/
cp ../originshear-contracts/artifacts/contracts/FarmerMarket.sol/FarmerMarket.json abis/
cp ../originshear-contracts/artifacts/contracts/IndustryMarkRegistry.sol/IndustryMarkRegistry.json abis/

npm run codegen
npm run build
```

From repo root you can also:

```bash
npm run subgraph:build
```

## Deploy to The Graph Studio

From repo root:

```bash
npm run sync:subgraph celoSepolia
npm run subgraph:build
cd subgraph
npx graph auth --studio <YOUR_DEPLOY_KEY>
npx graph deploy --studio origin-shear --version-label v0.0.5
```

After deploy:

1. Wait until Studio shows **Synced**.
2. Set `GRAPHQL_ENDPOINT` in `api/.env` to the Studio query URL  
   (e.g. `https://api.studio.thegraph.com/query/<id>/origin-shear/version/latest` or a pinned version).
3. Restart the API.

If deploy returns **HTTP 504**, retry after a few minutes — Studio occasionally times out on upload.

**Important:** After a full contract redeploy, the old subgraph indexes **old** addresses. Marketplace lists look empty until you sync + redeploy the subgraph against the new `deployments.celoSepolia.json`.

### Local Graph Node (optional)

```bash
npm run create-local
npm run deploy-local
```

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

## Related docs

- App runbook: [`../README.md`](../README.md)
- API `GRAPHQL_ENDPOINT`: [`../api/README.md`](../api/README.md)
