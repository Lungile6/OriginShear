#!/usr/bin/env node
/**
 * Grant FARMER_ROLE on HarvestLedger so a wallet can call registerLot().
 *
 * Usage:
 *   FARMER_ADDRESS=0xYourFarmerWallet node scripts/seed-demo.js
 *   node scripts/seed-demo.js 0xYourFarmerWallet
 *
 * Requires RELAYER_PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) in api/.env with
 * DEFAULT_ADMIN_ROLE on HarvestLedger (the original deployer has this).
 */
const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({ path: path.join(__dirname, "../api/.env") });

const deployments = require("../originshear-contracts/deployments.celoSepolia.json");

const HARVEST_LEDGER_ABI = [
  "function registerFarmer(address wallet, string farmerId, string district)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function farmers(address) view returns (address wallet, string farmerId, string district, bool active, uint256 totalLotsRegistered, uint256 totalWeightGrams)",
  "function totalLots() view returns (uint256)",
];

const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));

async function main() {
  const farmerAddress = process.argv[2] || process.env.FARMER_ADDRESS;
  const farmerId = process.env.FARMER_ID || "LSO-DEMO-001";
  const district = process.env.FARMER_DISTRICT || "Quthing";

  if (!farmerAddress || !ethers.isAddress(farmerAddress)) {
    console.error("Usage: FARMER_ADDRESS=0x... node scripts/seed-demo.js");
    process.exit(1);
  }

  const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("Set RELAYER_PRIVATE_KEY in api/.env (deployer wallet).");
    process.exit(1);
  }

  const rpc = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    provider
  );

  const ledger = new ethers.Contract(deployments.HarvestLedger, HARVEST_LEDGER_ABI, signer);

  const alreadyFarmer = await ledger.hasRole(FARMER_ROLE, farmerAddress);
  const profile = await ledger.farmers(farmerAddress);

  if (alreadyFarmer || profile.active) {
    console.log(`Farmer already registered: ${farmerAddress}`);
    console.log(`  farmerId: ${profile.farmerId || farmerId}`);
    console.log(`  district: ${profile.district || district}`);
  } else {
    console.log(`Registering farmer ${farmerAddress} (${farmerId}, ${district})...`);
    const tx = await ledger.registerFarmer(farmerAddress, farmerId, district);
    console.log(`  tx: ${tx.hash}`);
    await tx.wait();
    console.log("  FARMER_ROLE granted.");
  }

  const totalLots = await ledger.totalLots();
  console.log("\nOn-chain state:");
  console.log(`  HarvestLedger: ${deployments.HarvestLedger}`);
  console.log(`  totalLots: ${totalLots.toString()}`);
  console.log("\nNext — start app and run the UI walkthrough:");
  console.log("  1. Farmer wallet: Register Lot (needs API + frontend running)");
  console.log("  2. Validator: Approve lot in Validator Queue");
  console.log("  3. Farmer: List lot on Market Sell");
  console.log("  4. Buyer wallet: Purchase (needs test cUSD)");
  console.log("  5. Validator: Release escrow payment");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
