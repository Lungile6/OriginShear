# Evidence Folder Guide

Use this folder to store artifacts required by assessment.

## Suggested structure

```text
evidence/
  testing/
    unit-contracts.png
    integration-api.png
    data-values.png
    data-values.txt
  e2e/
    farmer-validator-buyer-flow.mp4
  performance/
    perf-<timestamp>-env1.json
    perf-<timestamp>-env2.json
    perf-env1.png
    perf-env2.png
```

## Minimum required artifacts

1. Different testing strategies:
   - Unit test screenshot
   - Integration test screenshot
   - End-to-end flow recording or screenshots
2. Different data values:
   - Screenshot of `npm run assess:test-data-values` passing
3. Different hardware/software performance:
   - At least two `perf-*.json` reports from different environments
   - One screenshot for each run
