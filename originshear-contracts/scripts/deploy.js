const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ADDRESSES = {
  sepolia: "0x71660c4005BA85c37ccec55d0C4493E66Fe775d3",
  celoSepolia: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  alfajores: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  celo: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  console.log(`\nDeploying ORIGINSHEAR contracts to "${network}"`);
  console.log(`Deployer: ${deployer.address}\n`);

  const nonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  console.log(`Starting with nonce: ${nonce}`);

  // 1. Resolve or deploy token
  let tokenAddress;
  if (TOKEN_ADDRESSES[network]) {
    tokenAddress = TOKEN_ADDRESSES[network];
    console.log(`Using live cUSD token at: ${tokenAddress}`);
  } else {
    console.log("Local/unknown network detected — deploying MockCUSD...");
    const MockCUSD = await ethers.getContractFactory("MockCUSD");
    const mockCUSD = await MockCUSD.deploy({ nonce });
    await mockCUSD.waitForDeployment();
    tokenAddress = await mockCUSD.getAddress();
    console.log(`MockCUSD deployed at: ${tokenAddress}`);
  }

  // 2. Deploy HarvestLedger
  console.log("\nDeploying HarvestLedger...");
  const HarvestLedger = await ethers.getContractFactory("HarvestLedger");
  const ledger = await HarvestLedger.deploy(deployer.address);
  await ledger.waitForDeployment();
  const ledgerAddress = await ledger.getAddress();
  console.log(`HarvestLedger deployed at: ${ledgerAddress}`);

  // 3. Deploy FarmerMarket
  console.log("Deploying FarmerMarket...");
  const FarmerMarket = await ethers.getContractFactory("FarmerMarket");
  const market = await FarmerMarket.deploy(tokenAddress, ledgerAddress, deployer.address);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`FarmerMarket deployed at: ${marketAddress}`);

  // 4. Deploy ProofOfOriginVerifier
  console.log("Deploying ProofOfOriginVerifier...");
  const Verifier = await ethers.getContractFactory("ProofOfOriginVerifier");
  const verifier = await Verifier.deploy(ledgerAddress);
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`ProofOfOriginVerifier deployed at: ${verifierAddress}`);

  // 5. Configure roles
  console.log("\nRoles configured:");
  console.log(`  DEFAULT_ADMIN_ROLE -> ${deployer.address}`);
  console.log(`  VALIDATOR_ROLE     -> ${deployer.address}`);
  console.log("  (grant FARMER_ROLE per-farmer via registerFarmer())");
  console.log("  (grant additional VALIDATOR_ROLE via grantRole() as needed)");

  // 6. Save addresses
  const deployment = {
    network,
    deployer: deployer.address,
    cUSD: tokenAddress,
    HarvestLedger: ledgerAddress,
    FarmerMarket: marketAddress,
    ProofOfOriginVerifier: verifierAddress,
    timestamp: new Date().toISOString(),
  };

  const outFile = path.join(__dirname, "..", `deployments.${network}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));
  console.log(`\nSaved deployment addresses to ${outFile}`);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});