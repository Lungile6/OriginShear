const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

const TOKEN_ADDRESSES = {
  sepolia: "0x71660c4005BA85c37ccec55d0C4493E66Fe775d3",
  // Celo Sepolia Mento Dollar (cUSD) — NOT the Alfajores address
  // https://docs.celo.org/tooling/contracts/token-contracts
  celoSepolia: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
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

  // 5. Deploy IndustryMarkRegistry
  console.log("Deploying IndustryMarkRegistry...");
  const IndustryMarkRegistry = await ethers.getContractFactory("IndustryMarkRegistry");
  const markRegistry = await IndustryMarkRegistry.deploy(deployer.address);
  await markRegistry.waitForDeployment();
  const markRegistryAddress = await markRegistry.getAddress();
  console.log(`IndustryMarkRegistry deployed at: ${markRegistryAddress}`);

  // 6. Deploy NewsBulletin
  console.log("Deploying NewsBulletin...");
  const NewsBulletin = await ethers.getContractFactory("NewsBulletin");
  const newsBulletin = await NewsBulletin.deploy(deployer.address);
  await newsBulletin.waitForDeployment();
  const newsBulletinAddress = await newsBulletin.getAddress();
  console.log(`NewsBulletin deployed at: ${newsBulletinAddress}`);

  // 7. Deploy GasSubsidyPool
  console.log("Deploying GasSubsidyPool...");
  const GasSubsidyPool = await ethers.getContractFactory("GasSubsidyPool");
  const subsidyPool = await GasSubsidyPool.deploy(tokenAddress, deployer.address);
  await subsidyPool.waitForDeployment();
  const subsidyPoolAddress = await subsidyPool.getAddress();
  console.log(`GasSubsidyPool deployed at: ${subsidyPoolAddress}`);

  // 8. Deploy DisputeResolution
  console.log("Deploying DisputeResolution...");
  const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
  const disputeResolution = await DisputeResolution.deploy(tokenAddress, marketAddress, ledgerAddress, deployer.address);
  await disputeResolution.waitForDeployment();
  const disputeResolutionAddress = await disputeResolution.getAddress();
  console.log(`DisputeResolution deployed at: ${disputeResolutionAddress}`);

  // 9. Deploy ReputationSystem
  console.log("Deploying ReputationSystem...");
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy(deployer.address);
  await reputationSystem.waitForDeployment();
  const reputationSystemAddress = await reputationSystem.getAddress();
  console.log(`ReputationSystem deployed at: ${reputationSystemAddress}`);

  // 10. Deploy PriceOracle
  console.log("Deploying PriceOracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy(tokenAddress, deployer.address);
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log(`PriceOracle deployed at: ${priceOracleAddress}`);

  // 11. Deploy MultiSigTreasury
  console.log("Deploying MultiSigTreasury...");
  const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
  const treasury = await MultiSigTreasury.deploy(tokenAddress, deployer.address, [deployer.address]);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`MultiSigTreasury deployed at: ${treasuryAddress}`);

  // 12. Configure roles
  console.log("\nRoles configured:");
  console.log(`  DEFAULT_ADMIN_ROLE -> ${deployer.address}`);
  console.log(`  VALIDATOR_ROLE     -> ${deployer.address}`);
  console.log("  (grant FARMER_ROLE per-farmer via registerFarmer())");
  console.log("  (grant additional VALIDATOR_ROLE via grantRole() as needed)");

  // 13. Save addresses
  const deployment = {
    network,
    deployer: deployer.address,
    cUSD: tokenAddress,
    HarvestLedger: ledgerAddress,
    FarmerMarket: marketAddress,
    ProofOfOriginVerifier: verifierAddress,
    IndustryMarkRegistry: markRegistryAddress,
    NewsBulletin: newsBulletinAddress,
    GasSubsidyPool: subsidyPoolAddress,
    DisputeResolution: disputeResolutionAddress,
    ReputationSystem: reputationSystemAddress,
    PriceOracle: priceOracleAddress,
    MultiSigTreasury: treasuryAddress,
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