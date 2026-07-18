// Focused tests for fixed advanced-contract helpers.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const FibreType = { WOOL: 0 };
const Grade = { A: 0 };
const LotStatus = { PENDING: 0, VALIDATED: 1 };

describe("Advanced features — stub fixes", function () {
  let admin, farmer, buyer, signer2;
  let ledger, market, cUSD, dispute, subsidy, treasury, oracle;

  beforeEach(async function () {
    [admin, farmer, buyer, signer2] = await ethers.getSigners();

    const HarvestLedger = await ethers.getContractFactory("HarvestLedger");
    ledger = await HarvestLedger.deploy(admin.address);
    await ledger.waitForDeployment();

    const MockCUSD = await ethers.getContractFactory("MockCUSD");
    cUSD = await MockCUSD.deploy();
    await cUSD.waitForDeployment();

    const FarmerMarket = await ethers.getContractFactory("FarmerMarket");
    market = await FarmerMarket.deploy(
      await cUSD.getAddress(),
      await ledger.getAddress(),
      admin.address
    );
    await market.waitForDeployment();

    const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
    dispute = await DisputeResolution.deploy(
      await cUSD.getAddress(),
      await market.getAddress(),
      await ledger.getAddress(),
      admin.address
    );
    await dispute.waitForDeployment();

    const GasSubsidyPool = await ethers.getContractFactory("GasSubsidyPool");
    subsidy = await GasSubsidyPool.deploy(await cUSD.getAddress(), admin.address);
    await subsidy.waitForDeployment();

    const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
    treasury = await MultiSigTreasury.deploy(
      await cUSD.getAddress(),
      admin.address,
      [signer2.address]
    );
    await treasury.waitForDeployment();

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy(await cUSD.getAddress(), admin.address);
    await oracle.waitForDeployment();

    await ledger.registerFarmer(farmer.address, "F-001", "Quthing");
    await ledger
      .connect(farmer)
      .registerLot(FibreType.WOOL, Grade.A, 2500, "Quthing", "2026-A", "ipfs://meta");
    await ledger.validateLot(1, true);

    await cUSD.mint(buyer.address, ethers.parseUnits("100", 18));
    await cUSD.mint(admin.address, ethers.parseUnits("100", 18));
  });

  it("DisputeResolution.getOfferDetails reads live FarmerMarket escrow", async function () {
    const ask = ethers.parseUnits("10", 18);
    await market.connect(farmer).listLot(1, ask);
    await cUSD.connect(buyer).approve(await market.getAddress(), ask);
    await market.connect(buyer).purchaseLot(1);

    const details = await dispute.getOfferDetails(1);
    expect(details[0]).to.equal(1n); // offerId
    expect(details[1]).to.equal(1n); // lotId
    expect(details[2]).to.equal(farmer.address);
    expect(details[4]).to.equal(buyer.address);
    expect(details[6]).to.equal(1); // IN_ESCROW

    await expect(
      dispute.connect(buyer).openDispute(1, 0, "Weight short")
    ).to.emit(dispute, "DisputeOpened");
  });

  it("MultiSigTreasury tracks signers and counts all signatures", async function () {
    const signers = await treasury.getSigners();
    expect(signers).to.include(admin.address);
    expect(signers).to.include(signer2.address);

    await cUSD.transfer(await treasury.getAddress(), ethers.parseUnits("5", 18));
    await treasury
      .connect(admin)
      .proposeTransaction(0, await cUSD.getAddress(), farmer.address, ethers.parseUnits("1", 18), "0x", "payout");

    expect(await treasury.countSignatures(1)).to.equal(1n);
    await treasury.connect(signer2).signTransaction(1);
    expect(await treasury.countSignatures(1)).to.equal(2n);
  });

  it("GasSubsidyPool daily limit works for claims above 1 cUSD", async function () {
    const farmerRole = await subsidy.FARMER_ROLE();
    await subsidy.grantRole(farmerRole, farmer.address);

    const deposit = ethers.parseUnits("20", 18);
    await cUSD.approve(await subsidy.getAddress(), deposit);
    await subsidy.deposit(deposit);

    const claim = ethers.parseUnits("3", 18);
    await expect(subsidy.connect(farmer).claimSubsidy(claim, "gas")).to.emit(subsidy, "SubsidyClaimed");
    expect(await subsidy.availableClaim(farmer.address)).to.equal(ethers.parseUnits("2", 18));
  });

  it("PriceOracle suggests price for sub-kg lots", async function () {
    const perKg = ethers.parseUnits("4", 18); // 4 cUSD / kg
    await oracle.updatePrice(FibreType.WOOL, Grade.A, perKg);
    // 500g => 2 cUSD
    expect(await oracle.getSuggestedPrice(FibreType.WOOL, Grade.A, 500)).to.equal(
      ethers.parseUnits("2", 18)
    );
  });
});
