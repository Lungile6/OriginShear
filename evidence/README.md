# Evidence Folder Guide

Use this folder to store artifacts required by assessment / submission.

The root [`../README.md`](../README.md) **Submission Checklist**, **Testing Results**,
**Analysis**, **Discussion**, and **Recommendations** sections describe what to
capture and how to fill narrative write-ups. Keep those guides in the root README;
this folder is for the raw artifacts.

## Suggested structure

```text
evidence/
  testing/
    A-unit-contracts.txt
    B-integration-api.txt
    B-data-values.txt
    C-performance-env1.txt
  screenshots/
    A-unit-contracts.png
    B-integration-api.png
    B-data-values.png
  diagrams/
    originshear-system-architecture.png
    originshear-use-case-diagram.png
    …
  e2e/
    farmer-validator-buyer-flow.mp4
  performance/
    perf-<timestamp>-env1.json
    perf-<timestamp>-env2.json
    perf-env1.png
    perf-env2.png
```

## How to regenerate common logs

From the **OriginShear** repo root (with dependencies installed):

```bash
# Unit (contracts) + save output yourself into evidence/testing/
npm test

# API integration (CI-style)
npm run test:api

# Data-value suite
npm run assess:test-data-values

# Performance (API must be running on localhost:3000)
npm run assess:perf
```

## Minimum required artifacts

1. Different testing strategies:
   - Unit test screenshot / log
   - Integration test screenshot / log
   - End-to-end flow recording or screenshots
2. Different data values:
   - Screenshot / log of `npm run assess:test-data-values` passing
3. Different hardware/software performance:
   - At least two `perf-*.json` reports from different environments
   - One screenshot for each run

Link evidence paths from the root README **Testing Results** tables when you finalize submission.
