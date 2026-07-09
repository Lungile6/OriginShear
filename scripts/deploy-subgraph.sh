#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-v0.0.4}"
MAX_ATTEMPTS="${2:-12}"
SLEEP_SECONDS="${3:-15}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/subgraph"

echo "Deploying origin-shear as ${VERSION} (up to ${MAX_ATTEMPTS} attempts)"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo ""
  echo "=== Attempt ${attempt}/${MAX_ATTEMPTS} ==="
  set +e
  output="$(npx graph deploy --studio origin-shear --version-label "$VERSION" 2>&1)"
  status=$?
  set -e
  printf '%s\n' "$output"
  if [ "$status" -eq 0 ] && ! printf '%s\n' "$output" | grep -qi 'HTTP error deploying the subgraph'; then
    echo ""
    echo "Deployed successfully: ${VERSION}"
    echo "Query URL: https://api.studio.thegraph.com/query/1756052/origin-shear/version/latest"
    echo "Wait for Studio to show Synced, then rerun: NODE_PATH=../api/node_modules node ../scripts/smoke-test.js"
    exit 0
  fi
  echo "Deploy failed; retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "Deploy failed after ${MAX_ATTEMPTS} attempts. Check https://status.thegraph.com/ and retry later."
exit 1
