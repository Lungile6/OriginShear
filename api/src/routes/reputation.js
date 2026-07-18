const express = require("express");
const { ethers } = require("ethers");

const router = express.Router();

const REPUTATION_MIN_ABI = [
  "function getReputation(address wallet) view returns (tuple(uint256 entityId, uint8 entityType, address wallet, uint256 totalTransactions, uint256 successfulTransactions, uint256 disputesWon, uint256 disputesLost, uint256 totalScore, uint8 currentRating, uint256 lastUpdated))",
];

const RATING_LABELS = ["Poor", "Fair", "Good", "Excellent"];

function getProvider() {
  const rpcUrl =
    process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getReputationContract(provider) {
  const address = process.env.REPUTATION_SYSTEM_ADDRESS;
  if (!address) {
    const err = new Error("REPUTATION_SYSTEM_ADDRESS is not configured");
    err.status = 500;
    throw err;
  }
  return new ethers.Contract(address, REPUTATION_MIN_ABI, provider);
}

/**
 * GET /api/reputation/:wallet
 */
router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet;
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({ error: "Valid wallet address required" });
    }

    const contract = getReputationContract(getProvider());
    const rep = await contract.getReputation(wallet);
    return res.json({
      wallet,
      entityId: rep.entityId.toString(),
      entityType: Number(rep.entityType),
      totalTransactions: rep.totalTransactions.toString(),
      successfulTransactions: rep.successfulTransactions.toString(),
      disputesWon: rep.disputesWon.toString(),
      disputesLost: rep.disputesLost.toString(),
      totalScore: rep.totalScore.toString(),
      currentRating: Number(rep.currentRating),
      currentRatingLabel: RATING_LABELS[Number(rep.currentRating)] || "Unknown",
      lastUpdated: Number(rep.lastUpdated),
    });
  } catch (error) {
    // Unregistered entities revert — surface as empty reputation
    if (String(error.message || "").includes("EntityNotFound") || error.code === "CALL_EXCEPTION") {
      return res.json({
        wallet: req.params.wallet,
        registered: false,
        message: "No reputation registered for this wallet yet",
      });
    }
    console.error("Get reputation error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch reputation" });
  }
});

module.exports = router;
