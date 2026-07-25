# ORIGINSHEAR frontend — multi-stage build
# Build context MUST be the monorepo root (OriginShear/), because the npm lockfile
# and workspaces live there. Example:
#   docker build -f originshear-frontend/Dockerfile -t originshear-web .
#
# Vercel deploys this package natively (vercel.json). Use this image for
# docker compose / local parity, or if you host the SPA on Render instead.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY originshear-frontend/package.json ./originshear-frontend/
COPY originshear-contracts/package.json ./originshear-contracts/

RUN npm ci

COPY originshear-frontend ./originshear-frontend

# Build-time public env (Vite inlines VITE_* at build)
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_CHAIN_NETWORK=celoSepolia
ARG VITE_CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
ARG VITE_CELO_RPC_URL=https://forno.celo.org
ARG VITE_IPFS_GATEWAY=https://ipfs.io/ipfs
ARG VITE_WALLETCONNECT_PROJECT_ID=
ARG VITE_CELO_SEPOLIA_HARVEST_LEDGER=
ARG VITE_CELO_SEPOLIA_FARMER_MARKET=
ARG VITE_CELO_SEPOLIA_VERIFIER=
ARG VITE_CELO_SEPOLIA_INDUSTRY_MARK_REGISTRY=
ARG VITE_CELO_SEPOLIA_NEWS_BULLETIN=
ARG VITE_CELO_SEPOLIA_GAS_SUBSIDY_POOL=
ARG VITE_CELO_SEPOLIA_DISPUTE_RESOLUTION=
ARG VITE_CELO_SEPOLIA_REPUTATION_SYSTEM=
ARG VITE_CELO_SEPOLIA_PRICE_ORACLE=
ARG VITE_CELO_SEPOLIA_MULTI_SIG_TREASURY=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CHAIN_NETWORK=$VITE_CHAIN_NETWORK \
    VITE_CELO_SEPOLIA_RPC_URL=$VITE_CELO_SEPOLIA_RPC_URL \
    VITE_CELO_RPC_URL=$VITE_CELO_RPC_URL \
    VITE_IPFS_GATEWAY=$VITE_IPFS_GATEWAY \
    VITE_WALLETCONNECT_PROJECT_ID=$VITE_WALLETCONNECT_PROJECT_ID \
    VITE_CELO_SEPOLIA_HARVEST_LEDGER=$VITE_CELO_SEPOLIA_HARVEST_LEDGER \
    VITE_CELO_SEPOLIA_FARMER_MARKET=$VITE_CELO_SEPOLIA_FARMER_MARKET \
    VITE_CELO_SEPOLIA_VERIFIER=$VITE_CELO_SEPOLIA_VERIFIER \
    VITE_CELO_SEPOLIA_INDUSTRY_MARK_REGISTRY=$VITE_CELO_SEPOLIA_INDUSTRY_MARK_REGISTRY \
    VITE_CELO_SEPOLIA_NEWS_BULLETIN=$VITE_CELO_SEPOLIA_NEWS_BULLETIN \
    VITE_CELO_SEPOLIA_GAS_SUBSIDY_POOL=$VITE_CELO_SEPOLIA_GAS_SUBSIDY_POOL \
    VITE_CELO_SEPOLIA_DISPUTE_RESOLUTION=$VITE_CELO_SEPOLIA_DISPUTE_RESOLUTION \
    VITE_CELO_SEPOLIA_REPUTATION_SYSTEM=$VITE_CELO_SEPOLIA_REPUTATION_SYSTEM \
    VITE_CELO_SEPOLIA_PRICE_ORACLE=$VITE_CELO_SEPOLIA_PRICE_ORACLE \
    VITE_CELO_SEPOLIA_MULTI_SIG_TREASURY=$VITE_CELO_SEPOLIA_MULTI_SIG_TREASURY

RUN npm run build --workspace=originshear-frontend

FROM nginx:1.27-alpine AS runner
COPY originshear-frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/originshear-frontend/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
