const express = require("express");
const { body, validationResult } = require("express-validator");
const { ethers } = require("ethers");
const { authenticate } = require("../middleware/auth");
const { requireValidatorRole } = require("../middleware/onchainAuth");
const { getProvider } = require("../lib/rpc");

const router = express.Router();

const DISPUTE_MIN_ABI = [
  "function getDispute(uint256 disputeId) view returns (tuple(uint256 disputeId, uint256 offerId, address farmer, address buyer, uint8 disputeType, string description, uint8 status, address openedBy, uint256 openedAt, uint256 resolvedAt, address resolvedBy, string resolutionNote, uint256 refundAmount))",
  "function getDisputesByOffer(uint256 offerId) view returns (uint256[])",
  "function totalDisputes() view returns (uint256)",
  "function resolveDispute(uint256 disputeId, uint8 resolution, string resolutionNote, uint256 refundAmount)",
];

const STATUS_LABELS = ["Open", "In Review", "Resolved (Farmer)", "Resolved (Buyer)", "Cancelled"];
const TYPE_LABELS = ["Quality Mismatch", "Weight Discrepancy", "Fibre Type Error", "Other"];

function getRelayerSigner() {
  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    const err = new Error("RELAYER_PRIVATE_KEY is not configured");
    err.status = 501;
    throw err;
  }
  return new ethers.Wallet(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    getProvider()
  );
}

function getDisputeContract(signerOrProvider) {
  const address = process.env.DISPUTE_RESOLUTION_ADDRESS;
  if (!address) {
    const err = new Error("DISPUTE_RESOLUTION_ADDRESS is not configured");
    err.status = 500;
    throw err;
  }
  return new ethers.Contract(address, DISPUTE_MIN_ABI, signerOrProvider);
}

function formatDispute(d) {
  return {
    disputeId: d.disputeId.toString(),
    offerId: d.offerId.toString(),
    farmer: d.farmer,
    buyer: d.buyer,
    disputeType: Number(d.disputeType),
    disputeTypeLabel: TYPE_LABELS[Number(d.disputeType)] || "Other",
    description: d.description,
    status: Number(d.status),
    statusLabel: STATUS_LABELS[Number(d.status)] || "Unknown",
    openedBy: d.openedBy,
    openedAt: Number(d.openedAt),
    resolvedAt: Number(d.resolvedAt),
    resolvedBy: d.resolvedBy,
    resolutionNote: d.resolutionNote,
    refundAmount: d.refundAmount.toString(),
  };
}

/**
 * GET /api/disputes/offer/:offerId
 */
router.get("/offer/:offerId", async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const contract = getDisputeContract(getProvider());
    const ids = await contract.getDisputesByOffer(offerId);
    const disputes = await Promise.all(ids.map(async (id) => formatDispute(await contract.getDispute(id))));
    return res.json({ offerId, disputes });
  } catch (error) {
    console.error("Get disputes by offer error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch disputes" });
  }
});

/**
 * GET /api/disputes/:disputeId
 */
router.get("/:disputeId", async (req, res) => {
  try {
    const contract = getDisputeContract(getProvider());
    const dispute = formatDispute(await contract.getDispute(req.params.disputeId));
    return res.json({ dispute });
  } catch (error) {
    console.error("Get dispute error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch dispute" });
  }
});

/**
 * POST /api/disputes/:disputeId/resolve
 * Arbiter/validator-relayed resolution. Opening disputes stays wallet-direct.
 * Resolutions: 2 = RESOLVED_FARMER, 3 = RESOLVED_BUYER
 */
router.post(
  "/:disputeId/resolve",
  authenticate,
  requireValidatorRole,
  body("resolution").isInt({ min: 2, max: 3 }),
  body("resolutionNote").optional().isString().isLength({ max: 1000 }),
  body("refundAmount").optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const signer = getRelayerSigner();
      const contract = getDisputeContract(signer);
      const refundAmount = BigInt(req.body.refundAmount || "0");
      const tx = await contract.resolveDispute(
        req.params.disputeId,
        Number(req.body.resolution),
        req.body.resolutionNote || "",
        refundAmount
      );
      const receipt = await tx.wait();
      return res.json({
        ok: true,
        txHash: receipt.hash,
        disputeId: req.params.disputeId,
      });
    } catch (error) {
      console.error("Resolve dispute error:", error);
      return res.status(error.status || 500).json({ error: error.message || "Failed to resolve dispute" });
    }
  }
);

module.exports = router;
