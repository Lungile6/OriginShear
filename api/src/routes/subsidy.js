const express = require("express");
const { ethers } = require("ethers");

const router = express.Router();

const GAS_SUBSIDY_MIN_ABI = [
  "function availableClaim(address farmer) view returns (uint256)",
  "function maxDailyClaim() view returns (uint256)",
  "function currentBalance() view returns (uint256)",
];

function getProvider() {
  const rpcUrl =
    process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSubsidyContract(provider) {
  const address = process.env.GAS_SUBSIDY_POOL_ADDRESS;
  if (!address) {
    const err = new Error("GAS_SUBSIDY_POOL_ADDRESS is not configured");
    err.status = 500;
    throw err;
  }
  return new ethers.Contract(address, GAS_SUBSIDY_MIN_ABI, provider);
}

/**
 * GET /api/subsidy?farmer=0x...
 * Read available claim + pool balance (wallet-direct claim remains on frontend).
 */
router.get("/", async (req, res) => {
  try {
    const farmer = req.query.farmer;
    if (!farmer || !ethers.isAddress(farmer)) {
      return res.status(400).json({ error: "Valid farmer address required" });
    }

    const cacheKey = `subsidy:${farmer.toLowerCase()}`;
    const cached = req.cache?.get(cacheKey);
    if (cached) return res.json(cached);

    const contract = getSubsidyContract(getProvider());
    const [available, maxDaily, poolBalance] = await Promise.all([
      contract.availableClaim(farmer),
      contract.maxDailyClaim(),
      contract.currentBalance(),
    ]);

    const result = {
      farmer,
      availableWei: available.toString(),
      maxDailyWei: maxDaily.toString(),
      poolBalanceWei: poolBalance.toString(),
    };
    req.cache?.set(cacheKey, result, 30);
    return res.json(result);
  } catch (error) {
    console.error("Get subsidy error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch subsidy" });
  }
});

module.exports = router;
