#!/usr/bin/env node
/**
 * Grant demo roles on Celo Sepolia for walkthrough wallets.
 *
 * Usage (any combination):
 *   FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles
 *   FARMER_ADDRESS=0x... npm run seed:farmer
 *
 * Buyer has no on-chain role — fund with test cUSD instead.
 *
 * Requires RELAYER_PRIVATE_KEY in api/.env (deployer / admin wallet).
 */
const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({ path: path.join(__dirname, "../api/.env") });

const deployments = require("../originshear-contracts/deployments.celoSepolia.json");

const ACCESS_CONTROL_ABI = [
  "function grantRole(bytes32 role, address account)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

const HARVEST_LEDGER_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function registerFarmer(address wallet, string farmerId, string district)",
  "function farmers(address) view returns (address wallet, string farmerId, string district, bool active, uint256 totalLotsRegistered, uint256 totalWeightGrams)",
  "function totalLots() view returns (uint256)",
];

const ROLES = {
  FARMER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE")),
  VALIDATOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE")),
  GOVERNMENT_ROLE: ethers.keccak256(ethers.toUtf8Bytes("GOVERNMENT_ROLE")),
};

function getSigner() {
  const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set RELAYER_PRIVATE_KEY in api/.env (deployer wallet).");
  }
  const rpc = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Wallet(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`, provider);
}

async function grantRoleIfNeeded(contract, role, roleLabel, wallet, contractLabel) {
  const has = await contract.hasRole(role, wallet);
  if (has) {
    console.log(`  ${roleLabel} on ${contractLabel}: already granted`);
    return;
  }
  console.log(`  Granting ${roleLabel} on ${contractLabel} → ${wallet}...`);
  const tx = await contract.grantRole(role, wallet);
  console.log(`    tx: ${tx.hash}`);
  await tx.wait();
  console.log(`    done`);
}

async function seedFarmer(signer, address) {
  const farmerId = process.env.FARMER_ID || "LSO-DEMO-001";
  const district = process.env.FARMER_DISTRICT || "Quthing";
  const ledger = new ethers.Contract(deployments.HarvestLedger, HARVEST_LEDGER_ABI, signer);

  const profile = await ledger.farmers(address);
  const hasRole = await ledger.hasRole(ROLES.FARMER_ROLE, address);

  if (hasRole && profile.active) {
    console.log(`Farmer ${address} already registered (${profile.farmerId}, ${profile.district})`);
    return;
  }

  console.log(`Registering farmer ${address} (${farmerId}, ${district})...`);
  const tx = await ledger.registerFarmer(address, farmerId, district);
  console.log(`  tx: ${tx.hash}`);
  await tx.wait();
  console.log("  FARMER_ROLE granted via registerFarmer()");
}

async function seedValidator(signer, address) {
  console.log(`Validator ${address}:`);
  const ledger = new ethers.Contract(deployments.HarvestLedger, ACCESS_CONTROL_ABI, signer);
  const market = new ethers.Contract(deployments.FarmerMarket, ACCESS_CONTROL_ABI, signer);
  await grantRoleIfNeeded(ledger, ROLES.VALIDATOR_ROLE, "VALIDATOR_ROLE", address, "HarvestLedger");
  await grantRoleIfNeeded(market, ROLES.VALIDATOR_ROLE, "VALIDATOR_ROLE", address, "FarmerMarket");
}

async function seedGovernment(signer, address) {
  console.log(`Government ${address}:`);
  const registry = new ethers.Contract(deployments.IndustryMarkRegistry, ACCESS_CONTROL_ABI, signer);
  const news = new ethers.Contract(deployments.NewsBulletin, ACCESS_CONTROL_ABI, signer);
  await grantRoleIfNeeded(registry, ROLES.GOVERNMENT_ROLE, "GOVERNMENT_ROLE", address, "IndustryMarkRegistry");
  await grantRoleIfNeeded(news, ROLES.GOVERNMENT_ROLE, "GOVERNMENT_ROLE", address, "NewsBulletin");
}

async function main() {
  const farmer = process.env.FARMER_ADDRESS || process.argv[2];
  const validator = process.env.VALIDATOR_ADDRESS;
  const government = process.env.GOVERNMENT_ADDRESS;

  if (!farmer && !validator && !government) {
    console.error(`Usage:
  FARMER_ADDRESS=0x... npm run seed:farmer
  FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles

Buyer: no role to seed — fund with test cUSD on Celo Sepolia.`);
    process.exit(1);
  }

  for (const [label, addr] of [
    ["FARMER", farmer],
    ["VALIDATOR", validator],
    ["GOVERNMENT", government],
  ]) {
    if (addr && !ethers.isAddress(addr)) {
      console.error(`Invalid ${label}_ADDRESS: ${addr}`);
      process.exit(1);
    }
  }

  const signer = getSigner();
  console.log(`Admin signer: ${signer.address}\n`);

  if (farmer) await seedFarmer(signer, farmer);
  if (validator) {
    if (farmer) console.log("");
    await seedValidator(signer, validator);
  }
  if (government) {
    if (farmer || validator) console.log("");
    await seedGovernment(signer, government);
  }

  if (farmer) {
    const ledger = new ethers.Contract(deployments.HarvestLedger, HARVEST_LEDGER_ABI, signer.provider);
    const totalLots = await ledger.totalLots();
    console.log(`\nHarvestLedger totalLots: ${totalLots.toString()}`);
  }

  console.log("\nDone. Buyer still needs test cUSD — no on-chain role to grant.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
