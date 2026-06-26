// test/AgriChain.test.js
// Run: npx hardhat test
//
// Full test suite for ORIGINSHEAR's three core contracts:
//   - HarvestLedger
//   - ProofOfOriginVerifier
//   - FarmerMarket

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const FibreType = { WOOL: 0, MOHAIR: 1 };
const Grade = { A: 0, B: 1, C: 2 };
const LotStatus = { PENDING: 0, VALIDATED: 1, REJECTED: 2, SOLD: 3 };

const ONE_CUSD = ethers.parseUnits("1", 18);

describe("Lesotho AgriChain — Full Test Suite", function () {
  let admin, farmer, farmer2, buyer, outsider;
  let ledger, verifier, market, cUSD;

  beforeEach(async function () {
    [admin, farmer, farmer2, buyer, outsider] = await ethers.getSigners();

    const HarvestLedger = await ethers.getContractFactory("HarvestLedger");
    ledger = await HarvestLedger.deploy(admin.address);
    await ledger.waitForDeployment();

    const Verifier = await ethers.getContractFactory("ProofOfOriginVerifier");
    verifier = await Verifier.deploy(await ledger.getAddress());
    await verifier.waitForDeployment();

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
  });

  // ------------------------------------------------------------------
  // HarvestLedger — Farmer registration
  // ------------------------------------------------------------------
  describe("HarvestLedger — Farmer registration", function () {
    it("Admin can register a farmer", async function () {
      await expect(
        ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing")
      )
        .to.emit(ledger, "FarmerRegistered")
        .withArgs(farmer.address, "FARMER-001", "Quthing");

      const profile = await ledger.farmers(farmer.address);
      expect(profile.active).to.equal(true);
      expect(profile.farmerId).to.equal("FARMER-001");
      expect(profile.district).to.equal("Quthing");

      const FARMER_ROLE = await ledger.FARMER_ROLE();
      expect(await ledger.hasRole(FARMER_ROLE, farmer.address)).to.equal(true);
    });

    it("Non-admin cannot register a farmer", async function () {
      await expect(
        ledger.connect(farmer).registerFarmer(farmer2.address, "FARMER-002", "Quthing")
      ).to.be.reverted;
    });

    it("Cannot register the same wallet twice", async function () {
      await ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing");
      await expect(
        ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing")
      )
        .to.be.revertedWithCustomError(ledger, "FarmerAlreadyRegistered")
        .withArgs(farmer.address);
    });
  });

  // ------------------------------------------------------------------
  // HarvestLedger — Lot registration
  // ------------------------------------------------------------------
  describe("HarvestLedger — Lot registration", function () {
    beforeEach(async function () {
      await ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing");
    });

    it("Registered farmer can submit a wool lot", async function () {
      const tx = await ledger
        .connect(farmer)
        .registerLot(
          FibreType.WOOL,
          Grade.A,
          15000, // 15kg
          "QTH-ZONE-01",
          "2026-A",
          "ipfs://lot-1-metadata"
        );

      await expect(tx).to.emit(ledger, "LotRegistered");

      const lot = await ledger.getLot(1);
      expect(lot.farmer).to.equal(farmer.address);
      expect(lot.fibreType).to.equal(FibreType.WOOL);
      expect(lot.grade).to.equal(Grade.A);
      expect(lot.weightGrams).to.equal(15000);
      expect(lot.gpsZone).to.equal("QTH-ZONE-01");
      expect(lot.seasonYear).to.equal("2026-A");
      expect(lot.status).to.equal(LotStatus.PENDING);
      expect(lot.proofOfOrigin).to.not.equal(ethers.ZeroHash);
    });

    it("Unregistered address cannot submit a lot", async function () {
      await expect(
        ledger
          .connect(outsider)
          .registerLot(FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", "")
      ).to.be.reverted;
    });

    it("Rejects weight of 0 or over 4 tonnes", async function () {
      await expect(
        ledger
          .connect(farmer)
          .registerLot(FibreType.WOOL, Grade.A, 0, "QTH-ZONE-01", "2026-A", "")
      ).to.be.revertedWithCustomError(ledger, "InvalidWeight");

      await expect(
        ledger
          .connect(farmer)
          .registerLot(FibreType.WOOL, Grade.A, 4_000_001, "QTH-ZONE-01", "2026-A", "")
      ).to.be.revertedWithCustomError(ledger, "InvalidWeight");
    });

    it("Proof of Origin is unique per lot — zero collisions", async function () {
      const seen = new Set();
      const sameArgs = [FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", ""];

      for (let i = 0; i < 10; i++) {
        await ledger.connect(farmer).registerLot(...sameArgs);
        const lot = await ledger.getLot(i + 1);
        expect(seen.has(lot.proofOfOrigin)).to.equal(false);
        seen.add(lot.proofOfOrigin);
      }

      expect(seen.size).to.equal(10);
    });

    it("Updates farmer stats after lot submission", async function () {
      await ledger
        .connect(farmer)
        .registerLot(FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", "");
      await ledger
        .connect(farmer)
        .registerLot(FibreType.MOHAIR, Grade.B, 8000, "QTH-ZONE-02", "2026-A", "");

      const profile = await ledger.farmers(farmer.address);
      expect(profile.totalLotsRegistered).to.equal(2);
      expect(profile.totalWeightGrams).to.equal(15000 + 8000);

      const farmerLots = await ledger.getFarmerLots(farmer.address);
      expect(farmerLots.length).to.equal(2);
      expect(farmerLots[0]).to.equal(1);
      expect(farmerLots[1]).to.equal(2);
    });
  });

  // ------------------------------------------------------------------
  // HarvestLedger — Lot validation
  // ------------------------------------------------------------------
  describe("HarvestLedger — Lot validation", function () {
    beforeEach(async function () {
      await ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing");
      await ledger
        .connect(farmer)
        .registerLot(FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", "");
    });

    it("Validator can approve a lot", async function () {
      await expect(ledger.validateLot(1, true))
        .to.emit(ledger, "LotValidated")
        .withArgs(1, admin.address, LotStatus.VALIDATED);

      const lot = await ledger.getLot(1);
      expect(lot.status).to.equal(LotStatus.VALIDATED);
      expect(lot.validatedBy).to.equal(admin.address);
      expect(lot.validatedAt).to.be.gt(0);
    });

    it("Validator can reject a lot", async function () {
      await expect(ledger.validateLot(1, false))
        .to.emit(ledger, "LotValidated")
        .withArgs(1, admin.address, LotStatus.REJECTED);

      const lot = await ledger.getLot(1);
      expect(lot.status).to.equal(LotStatus.REJECTED);
    });

    it("Cannot validate twice", async function () {
      await ledger.validateLot(1, true);
      await expect(ledger.validateLot(1, true)).to.be.revertedWithCustomError(
        ledger,
        "LotNotPending"
      );
    });

    it("Non-validator cannot validate", async function () {
      await expect(ledger.connect(farmer).validateLot(1, true)).to.be.reverted;
    });
  });

  // ------------------------------------------------------------------
  // ProofOfOriginVerifier
  // ------------------------------------------------------------------
  describe("ProofOfOriginVerifier", function () {
    let lotProof;

    beforeEach(async function () {
      await ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing");
      await ledger
        .connect(farmer)
        .registerLot(FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", "ipfs://lot-1");
      const lot = await ledger.getLot(1);
      lotProof = lot.proofOfOrigin;
    });

    it("verify() returns valid=true for matching hash", async function () {
      const result = await verifier.verify(1, lotProof);
      expect(result.valid).to.equal(true);
    });

    it("verify() returns valid=false for wrong hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("not-the-proof"));
      const result = await verifier.verify(1, wrongHash);
      expect(result.valid).to.equal(false);
    });

    it("isValidated=false before LNWMGA approval", async function () {
      const result = await verifier.verify(1, lotProof);
      expect(result.isValidated).to.equal(false);
    });

    it("isValidated=true after approval", async function () {
      await ledger.validateLot(1, true);
      const result = await verifier.verify(1, lotProof);
      expect(result.isValidated).to.equal(true);
    });

    it("logVerification emits on-chain audit event", async function () {
      await expect(verifier.connect(buyer).logVerification(1, lotProof))
        .to.emit(verifier, "VerificationLogged")
        .withArgs(1, lotProof, true, buyer.address, anyValue);
    });

    it("computeExpectedProof matches on-chain PoO", async function () {
      const expected = await verifier.computeExpectedProof(
        farmer.address,
        1,
        FibreType.WOOL,
        Grade.A,
        15000,
        "QTH-ZONE-01",
        "2026-A"
      );
      expect(expected).to.equal(lotProof);
    });
  });

  // ------------------------------------------------------------------
  // FarmerMarket
  // ------------------------------------------------------------------
  describe("FarmerMarket", function () {
    const ASK_PRICE = ONE_CUSD * 100n; // 100 cUSD

    beforeEach(async function () {
      await ledger.registerFarmer(farmer.address, "FARMER-001", "Quthing");
      await ledger
        .connect(farmer)
        .registerLot(FibreType.WOOL, Grade.A, 15000, "QTH-ZONE-01", "2026-A", "");

      // Fund the buyer with cUSD and approve the market for the ask price.
      await cUSD.mint(buyer.address, ASK_PRICE);
      await cUSD.connect(buyer).approve(await market.getAddress(), ASK_PRICE);
    });

    it("Farmer can list a validated lot", async function () {
      await ledger.validateLot(1, true);

      await expect(market.connect(farmer).listLot(1, ASK_PRICE))
        .to.emit(market, "LotListed")
        .withArgs(1, 1, farmer.address, ASK_PRICE);

      const offer = await market.offers(1);
      expect(offer.lotId).to.equal(1);
      expect(offer.farmer).to.equal(farmer.address);
      expect(offer.askPriceWei).to.equal(ASK_PRICE);
    });

    it("Cannot list an unvalidated lot", async function () {
      await expect(
        market.connect(farmer).listLot(1, ASK_PRICE)
      ).to.be.revertedWithCustomError(market, "LotNotValidated");
    });

    it("Buyer can purchase into escrow", async function () {
      await ledger.validateLot(1, true);
      await market.connect(farmer).listLot(1, ASK_PRICE);

      await expect(market.connect(buyer).purchaseLot(1))
        .to.emit(market, "PurchaseEscrowed")
        .withArgs(1, buyer.address, ASK_PRICE);

      expect(await cUSD.balanceOf(await market.getAddress())).to.equal(ASK_PRICE);

      const offer = await market.offers(1);
      expect(offer.buyer).to.equal(buyer.address);
      expect(offer.status).to.equal(1); // IN_ESCROW
    });

    it("Validator releases payment with correct fee split (2%)", async function () {
      await ledger.validateLot(1, true);
      await market.connect(farmer).listLot(1, ASK_PRICE);
      await market.connect(buyer).purchaseLot(1);

      const expectedFee = (ASK_PRICE * 200n) / 10_000n; // 2%
      const expectedNet = ASK_PRICE - expectedFee;

      await expect(market.releasePayment(1))
        .to.emit(market, "PaymentReleased")
        .withArgs(1, farmer.address, expectedNet, expectedFee);

      expect(await cUSD.balanceOf(farmer.address)).to.equal(expectedNet);
      expect(await cUSD.balanceOf(admin.address)).to.equal(expectedFee);

      const offer = await market.offers(1);
      expect(offer.status).to.equal(2); // COMPLETED
    });
  });
});
