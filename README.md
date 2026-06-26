# ORIGINSHEAR

**Blockchain proof of origin and marketplace for Lesotho wool & mohair smallholder farmers**

Monorepo containing the smart contracts (Hardhat/Solidity) and the React frontend (Vite + wagmi).

## Project structure

```
originshear/
├── originshear-contracts/   # Solidity contracts, Hardhat tests, deploy scripts
├── originshear-frontend/    # React + Vite web app
├── scripts/
│   └── sync-deployments.js  # Copy deployed addresses into frontend .env
├── package.json             # npm workspaces root
└── README.md
```

## Quick start

```bash
# Install all dependencies (root + both workspaces)
npm install

# Run contract tests
npm test

# Start the frontend dev server
npm run dev
```

## Contracts

```bash
# Compile
npm run compile

# Deploy to Alfajores testnet (set PRIVATE_KEY in originshear-contracts/.env first)
npm run deploy:alfajores

# Copy deployed addresses into originshear-frontend/.env
npm run sync:addresses alfajores
```

See [originshear-contracts/README.md](./originshear-contracts/README.md) for full contract documentation.

## Frontend

```bash
cp originshear-frontend/.env.example originshear-frontend/.env
npm run dev
npm run build
```

See [originshear-frontend/README.md](./originshear-frontend/README.md) for screen-to-contract mapping.

## Typical workflow

1. Change contracts in `originshear-contracts/`
2. Run `npm test`
3. Deploy with `npm run deploy:alfajores`
4. Run `npm run sync:addresses alfajores`
5. Run `npm run dev` and test the app against the new addresses

## License

MIT
