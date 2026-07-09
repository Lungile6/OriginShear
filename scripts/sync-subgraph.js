const fs = require("fs");
const path = require("path");

const network = process.argv[2] || "celoSepolia";
const root = path.join(__dirname, "..");
const deploymentFile = path.join(root, "originshear-contracts", `deployments.${network}.json`);
const subgraphFile = path.join(root, "subgraph", "subgraph.yaml");

if (!fs.existsSync(deploymentFile)) {
  console.error(`Missing ${deploymentFile}`);
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
let yaml = fs.readFileSync(subgraphFile, "utf8");

const replacements = [
  {
    name: "HarvestLedger",
    address: deployment.HarvestLedger,
    startBlock: process.env.HARVEST_LEDGER_START_BLOCK || "29778550",
  },
  {
    name: "FarmerMarket",
    address: deployment.FarmerMarket,
    startBlock: process.env.FARMER_MARKET_START_BLOCK || "29778556",
  },
  {
    name: "IndustryMarkRegistry",
    address: deployment.IndustryMarkRegistry,
    startBlock: process.env.INDUSTRY_MARK_REGISTRY_START_BLOCK || "29778567",
  },
];

for (const { name, address, startBlock } of replacements) {
  const blockRegex = new RegExp(
    `(name: ${name}[\\s\\S]*?address: )"[^"]+"(\\s*\\n\\s*abi:[\\s\\S]*?startBlock: )\\d+`,
    "m"
  );
  if (!blockRegex.test(yaml)) {
    console.error(`Could not find data source block for ${name} in subgraph.yaml`);
    process.exit(1);
  }
  yaml = yaml.replace(blockRegex, `$1"${address}"$2${startBlock}`);
}

fs.writeFileSync(subgraphFile, yaml);
console.log(`Updated ${subgraphFile} from ${deploymentFile}`);
