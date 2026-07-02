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

Update the addresses in `subgraph.yaml` with your deployed contract addresses.

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

### Hosted Service

```bash
npm run deploy
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
