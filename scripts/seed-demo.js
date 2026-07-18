#!/usr/bin/env node
/**
 * Grant demo roles + advanced-feature setup on Celo Sepolia.
 *
 * Usage (any combination):
 *   FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles
 *   FARMER_ADDRESS=0x... npm run seed:farmer
 *   npm run seed:advanced
 *
 * Env flags (optional):
 *   SKIP_ADVANCED=true          — only core roles
 *   SEED_ORACLE_PRICES=true     — write demo wool/mohair prices (default on with seed:advanced)
 *   SEED_SUBSIDY_DEPOSIT=true   — deposit test cUSD into GasSubsidyPool (needs admin cUSD)
 *   SUBSIDY_DEPOSIT_CUSD=10     — deposit amount (default 10)
 *
 * Buyer has no on-chain role — fund with test cUSD instead.
 *
 * Requires RELAYER_PRIVATE_KEY (or PRIVATE_KEY) in api/.env or originshear-contracts/.env.
 */
const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({ path: path.join(__dirname, "../api/.env") });
require("dotenv").config({ path: path.join(__dirname, "../originshear-contracts/.env") });

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

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const GAS_SUBSIDY_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function deposit(uint256 amount)",
  "function currentBalance() view returns (uint256)",
];

const DISPUTE_ABI = [...ACCESS_CONTROL_ABI];

const PRICE_ORACLE_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function updatePrice(uint8 fibreType, uint8 grade, uint256 pricePerKgWei)",
  "function getCurrentPrice(uint8 fibreType, uint8 grade) view returns (uint256 pricePerKgWei, uint256 timestamp)",
];

const ROLES = {
  FARMER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE")),
  VALIDATOR_ROLE: ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE")),
  GOVERNMENT_ROLE: ethers.keccak256(ethers.toUtf8Bytes("GOVERNMENT_ROLE")),
  ARBITER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ARBITER_ROLE")),
  ORACLE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("ORACLE_ROLE")),
};

const FibreType = { WOOL: 0, MOHAIR: 1 };
const Grade = { A: 0, B: 1, C: 2 };

function getSigner() {
  const privateKey =
    process.env.RELAYER_PRIVATE_KEY ||
    process.env.DEPLOYER_PRIVATE_KEY ||
    process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "Set RELAYER_PRIVATE_KEY in api/.env (or PRIVATE_KEY in originshear-contracts/.env)."
    );
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
  } else {
    console.log(`Registering farmer ${address} (${farmerId}, ${district})...`);
    const tx = await ledger.registerFarmer(address, farmerId, district);
    console.log(`  tx: ${tx.hash}`);
    await tx.wait();
    console.log("  FARMER_ROLE granted via registerFarmer()");
  }

  if (deployments.GasSubsidyPool) {
    const subsidy = new ethers.Contract(deployments.GasSubsidyPool, GAS_SUBSIDY_ABI, signer);
    console.log(`GasSubsidyPool for farmer ${address}:`);
    await grantRoleIfNeeded(subsidy, ROLES.FARMER_ROLE, "FARMER_ROLE", address, "GasSubsidyPool");
  }
}

async function seedValidator(signer, address) {
  console.log(`Validator ${address}:`);
  const ledger = new ethers.Contract(deployments.HarvestLedger, ACCESS_CONTROL_ABI, signer);
  const market = new ethers.Contract(deployments.FarmerMarket, ACCESS_CONTROL_ABI, signer);
  await grantRoleIfNeeded(ledger, ROLES.VALIDATOR_ROLE, "VALIDATOR_ROLE", address, "HarvestLedger");
  await grantRoleIfNeeded(market, ROLES.VALIDATOR_ROLE, "VALIDATOR_ROLE", address, "FarmerMarket");

  if (deployments.DisputeResolution) {
    const dispute = new ethers.Contract(deployments.DisputeResolution, DISPUTE_ABI, signer);
    await grantRoleIfNeeded(dispute, ROLES.ARBITER_ROLE, "ARBITER_ROLE", address, "DisputeResolution");
  }
}

async function seedGovernment(signer, address) {
  console.log(`Government ${address}:`);
  const registry = new ethers.Contract(deployments.IndustryMarkRegistry, ACCESS_CONTROL_ABI, signer);
  const news = new ethers.Contract(deployments.NewsBulletin, ACCESS_CONTROL_ABI, signer);
  await grantRoleIfNeeded(registry, ROLES.GOVERNMENT_ROLE, "GOVERNMENT_ROLE", address, "IndustryMarkRegistry");
  await grantRoleIfNeeded(news, ROLES.GOVERNMENT_ROLE, "GOVERNMENT_ROLE", address, "NewsBulletin");

  if (deployments.GasSubsidyPool) {
    const subsidy = new ethers.Contract(deployments.GasSubsidyPool, GAS_SUBSIDY_ABI, signer);
    await grantRoleIfNeeded(
      subsidy,
      ROLES.GOVERNMENT_ROLE,
      "GOVERNMENT_ROLE",
      address,
      "GasSubsidyPool"
    );
  }
}

async function seedArbiterForRelayer(signer) {
  if (!deployments.DisputeResolution) return;
  console.log(`DisputeResolution arbiter (relayer/admin ${signer.address}):`);
  const dispute = new ethers.Contract(deployments.DisputeResolution, DISPUTE_ABI, signer);
  await grantRoleIfNeeded(
    dispute,
    ROLES.ARBITER_ROLE,
    "ARBITER_ROLE",
    signer.address,
    "DisputeResolution"
  );
}

async function seedOraclePrices(signer) {
  if (!deployments.PriceOracle) {
    console.log("PriceOracle address missing — skip oracle prices");
    return;
  }

  const oracle = new ethers.Contract(deployments.PriceOracle, PRICE_ORACLE_ABI, signer);
  console.log("Seeding demo oracle prices (cUSD per kg)...");

  // Wool A/B/C and Mohair A/B/C — rough demo values
  const prices = [
    [FibreType.WOOL, Grade.A, "4.00"],
    [FibreType.WOOL, Grade.B, "3.20"],
    [FibreType.WOOL, Grade.C, "2.40"],
    [FibreType.MOHAIR, Grade.A, "6.50"],
    [FibreType.MOHAIR, Grade.B, "5.00"],
    [FibreType.MOHAIR, Grade.C, "3.80"],
  ];

  for (const [fibreType, grade, cusd] of prices) {
    const wei = ethers.parseUnits(cusd, 18);
    const [current] = await oracle.getCurrentPrice(fibreType, grade);
    if (current === wei) {
      console.log(`  fibre=${fibreType} grade=${grade}: already ${cusd} cUSD/kg`);
      continue;
    }
    const tx = await oracle.updatePrice(fibreType, grade, wei);
    console.log(`  fibre=${fibreType} grade=${grade} → ${cusd} cUSD/kg  tx: ${tx.hash}`);
    await tx.wait();
  }
}

async function seedSubsidyDeposit(signer) {
  if (!deployments.GasSubsidyPool || !deployments.cUSD) {
    console.log("GasSubsidyPool/cUSD missing — skip subsidy deposit");
    return;
  }

  const amountCusd = process.env.SUBSIDY_DEPOSIT_CUSD || "10";
  const amount = ethers.parseUnits(amountCusd, 18);
  const cUSD = new ethers.Contract(deployments.cUSD, ERC20_ABI, signer);
  const subsidy = new ethers.Contract(deployments.GasSubsidyPool, GAS_SUBSIDY_ABI, signer);

  let balance;
  try {
    balance = await cUSD.balanceOf(signer.address);
  } catch (err) {
    console.log(
      `Subsidy deposit skipped: cUSD at ${deployments.cUSD} did not respond to balanceOf().`
    );
    console.log(
      "  On Celo Sepolia use Mento cUSD 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b (not Alfajores 0x8740…)."
    );
    console.log("  Redeploy contracts with the fixed TOKEN_ADDRESSES.celoSepolia, then retry.");
    console.log(`  Detail: ${err.shortMessage || err.message}`);
    return;
  }
  if (balance < amount) {
    console.log(
      `Subsidy deposit skipped: admin has ${ethers.formatUnits(balance, 18)} cUSD, need ${amountCusd}.`
    );
    console.log("  Fund the deployer with test cUSD, then re-run with SEED_SUBSIDY_DEPOSIT=true.");
    return;
  }

  const allowance = await cUSD.allowance(signer.address, deployments.GasSubsidyPool);
  if (allowance < amount) {
    console.log(`Approving ${amountCusd} cUSD for GasSubsidyPool...`);
    const approveTx = await cUSD.approve(deployments.GasSubsidyPool, amount);
    await approveTx.wait();
  }

  console.log(`Depositing ${amountCusd} cUSD into GasSubsidyPool...`);
  const tx = await subsidy.deposit(amount);
  console.log(`  tx: ${tx.hash}`);
  await tx.wait();
  const poolBal = await subsidy.currentBalance();
  console.log(`  pool balance now: ${ethers.formatUnits(poolBal, 18)} cUSD`);
}

async function seedAdvanced(signer, { farmer, validator }) {
  console.log("\n--- Advanced feature setup ---");
  await seedArbiterForRelayer(signer);

  if (validator) {
    const dispute = new ethers.Contract(deployments.DisputeResolution, DISPUTE_ABI, signer);
    await grantRoleIfNeeded(
      dispute,
      ROLES.ARBITER_ROLE,
      "ARBITER_ROLE",
      validator,
      "DisputeResolution"
    );
  }

  if (farmer && deployments.GasSubsidyPool) {
    const subsidy = new ethers.Contract(deployments.GasSubsidyPool, GAS_SUBSIDY_ABI, signer);
    await grantRoleIfNeeded(subsidy, ROLES.FARMER_ROLE, "FARMER_ROLE", farmer, "GasSubsidyPool");
  }

  const wantOracle =
    process.env.SEED_ORACLE_PRICES !== "false" && process.env.SEED_ORACLE_PRICES !== "0";
  if (wantOracle) {
    await seedOraclePrices(signer);
  }

  const wantDeposit =
    process.env.SEED_SUBSIDY_DEPOSIT === "true" || process.env.SEED_SUBSIDY_DEPOSIT === "1";
  if (wantDeposit) {
    await seedSubsidyDeposit(signer);
  } else {
    console.log(
      "Subsidy deposit skipped (set SEED_SUBSIDY_DEPOSIT=true after funding deployer with test cUSD)."
    );
  }
}

async function main() {
  const advancedOnly =
    process.argv.includes("--advanced") || process.env.SEED_ADVANCED_ONLY === "true";
  const farmer = process.env.FARMER_ADDRESS || (!advancedOnly ? process.argv[2] : undefined);
  const validator = process.env.VALIDATOR_ADDRESS;
  const government = process.env.GOVERNMENT_ADDRESS;
  const skipAdvanced = process.env.SKIP_ADVANCED === "true" || process.env.SKIP_ADVANCED === "1";

  if (!advancedOnly && !farmer && !validator && !government) {
    console.error(`Usage:
  FARMER_ADDRESS=0x... npm run seed:farmer
  FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... GOVERNMENT_ADDRESS=0x... npm run seed:roles
  npm run seed:advanced
  FARMER_ADDRESS=0x... VALIDATOR_ADDRESS=0x... npm run seed:roles   # includes advanced by default

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
  console.log(`Admin signer: ${signer.address}`);
  console.log(`Using deployments from ${deployments.timestamp || "deployments.celoSepolia.json"}\n`);

  if (!advancedOnly) {
    if (farmer) await seedFarmer(signer, farmer);
    if (validator) {
      if (farmer) console.log("");
      await seedValidator(signer, validator);
    }
    if (government) {
      if (farmer || validator) console.log("");
      await seedGovernment(signer, government);
    }
  }

  if (!skipAdvanced) {
    await seedAdvanced(signer, { farmer, validator });
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
