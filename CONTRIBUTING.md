# Contributing to ORIGINSHEAR

Thanks for contributing.

## Local Setup

```bash
npm install
```

For API development:

```bash
cd api
npm install
cp .env.example .env
```

## Branching and Scope

- Create focused branches for one logical change.
- Keep PRs small enough to review quickly.
- Do not mix unrelated refactors with feature/bug fixes.

## Pre-Push Checklist

Run these from the repository root unless noted:

```bash
# Frontend production build
npm run build

# Smart contract test suite
npm run test --workspace=originshear-contracts

# API CI-equivalent test run
cd api && npm run test:ci
```

Optional for API test diagnostics:

```bash
cd api && npm run test:ci:debug
```

## Environment and Secrets

- Never commit `.env` files or private keys.
- Use `.env.example` files as the source of required variables.
- Keep `RELAYER_PRIVATE_KEY` restricted to secure backend environments only.

## API Security Expectations

- Wallet auth must use challenge + nonce + signature.
- Relayer write endpoints must be protected by on-chain role checks.
- Avoid adding fallback secrets or hardcoded private endpoints.

## Pull Request Notes

Include in your PR description:

- What changed and why.
- How you tested it (commands + key outputs).
- Any new env vars or deployment steps.
