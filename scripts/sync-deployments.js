/**
 * Copy contract addresses from originshear-contracts/deployments.<network>.json
 * into originshear-frontend/.env after a deployment.
 *
 * Usage:
 *   node scripts/sync-deployments.js alfajores
 *   node scripts/sync-deployments.js celo
 *   node scripts/sync-deployments.js localhost
 */

const fs = require("fs");
const path = require("path");

const network = process.argv[2];

if (!network) {
  console.error("Usage: node scripts/sync-deployments.js <network>");
  console.error("Example: node scripts/sync-deployments.js alfajores");
  process.exit(1);
}

const PREFIX_BY_NETWORK = {
  alfajores: "VITE_ALFAJORES",
  celo: "VITE_CELO",
  localhost: "VITE_LOCAL",
  hardhat: "VITE_LOCAL",
};

const prefix = PREFIX_BY_NETWORK[network];

if (!prefix) {
  console.error(`Unknown network "${network}". Supported: alfajores, celo, localhost, hardhat`);
  process.exit(1);
}

const root = path.join(__dirname, "..");
const deploymentFile = path.join(root, "originshear-contracts", `deployments.${network}.json`);
const envExample = path.join(root, "originshear-frontend", ".env.example");
const envFile = path.join(root, "originshear-frontend", ".env");

if (!fs.existsSync(deploymentFile)) {
  console.error(`Missing ${deploymentFile}. Deploy contracts first.`);
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

const updates = {
  [`${prefix}_HARVEST_LEDGER`]: deployment.HarvestLedger,
  [`${prefix}_FARMER_MARKET`]: deployment.FarmerMarket,
  [`${prefix}_VERIFIER`]: deployment.ProofOfOriginVerifier,
};

if (prefix === "VITE_LOCAL") {
  updates.VITE_LOCAL_MOCK_CUSD = deployment.cUSD;
}

const baseEnv = fs.existsSync(envFile)
  ? fs.readFileSync(envFile, "utf8")
  : fs.existsSync(envExample)
    ? fs.readFileSync(envExample, "utf8")
    : "";

const envLines = baseEnv.split("\n");
const seen = new Set();

const merged = envLines.map((line) => {
  const match = line.match(/^([A-Z0-9_]+)=/);
  if (!match) {
    return line;
  }

  const key = match[1];
  if (updates[key] !== undefined) {
    seen.add(key);
    return `${key}=${updates[key]}`;
  }

  return line;
});

for (const [key, value] of Object.entries(updates)) {
  if (!seen.has(key)) {
    merged.push(`${key}=${value}`);
  }
}

fs.writeFileSync(envFile, merged.join("\n").replace(/\n?$/, "\n"));
console.log(`Updated ${envFile} from ${deploymentFile}`);
