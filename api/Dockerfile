# ORIGINSHEAR API — production image for Render (and local Docker)
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S originshear && adduser -S originshear -G originshear

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Writable dirs for optional IPFS_DEV_FALLBACK (prefer Pinata/Infura in production)
RUN mkdir -p /app/data/ipfs-dev /app/secrets \
  && chown -R originshear:originshear /app

USER originshear

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
