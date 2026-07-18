const express = require("express");
const { ethers } = require("ethers");

const router = express.Router();

const PRICE_ORACLE_MIN_ABI = [
  "function getSuggestedPrice(uint8 fibreType, uint8 grade, uint32 weightGrams) view returns (uint256)",
  "function getCurrentPrice(uint8 fibreType, uint8 grade) view returns (uint256 pricePerKgWei, uint256 timestamp)",
];

function getProvider() {
  const rpcUrl =
    process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getOracleContract(provider) {
  const address = process.env.PRICE_ORACLE_ADDRESS;
  if (!address) {
    const err = new Error("PRICE_ORACLE_ADDRESS is not configured");
    err.status = 500;
    throw err;
  }
  return new ethers.Contract(address, PRICE_ORACLE_MIN_ABI, provider);
}

/**
 * GET /api/oracle/suggest?fibreType=0&grade=0&weightGrams=5000
 */
router.get("/suggest", async (req, res) => {
  try {
    const fibreType = Number(req.query.fibreType);
    const grade = Number(req.query.grade);
    const weightGrams = Number(req.query.weightGrams);

    if (
      Number.isNaN(fibreType) ||
      Number.isNaN(grade) ||
      Number.isNaN(weightGrams) ||
      weightGrams <= 0
    ) {
      return res.status(400).json({
        error: "fibreType, grade, and positive weightGrams are required",
      });
    }

    const contract = getOracleContract(getProvider());
    const [suggested, current] = await Promise.all([
      contract.getSuggestedPrice(fibreType, grade, weightGrams),
      contract.getCurrentPrice(fibreType, grade),
    ]);

    return res.json({
      fibreType,
      grade,
      weightGrams,
      suggestedPriceWei: suggested.toString(),
      pricePerKgWei: current.pricePerKgWei.toString(),
      priceUpdatedAt: Number(current.timestamp),
    });
  } catch (error) {
    console.error("Oracle suggest error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch suggestion" });
  }
});

module.exports = router;
