const express = require("express");
const { body, validationResult } = require("express-validator");
const { ethers } = require("ethers");
const { authenticate } = require("../middleware/auth");
const { requireGovernmentRole } = require("../middleware/onchainAuth");
const { getProvider } = require("../lib/rpc");

const router = express.Router();

const NEWS_BULLETIN_MIN_ABI = [
  "function publishBulletin(uint8 bulletinType, string title, string body, string metadataURI) returns (uint256)",
  "function getActiveBulletins() view returns (tuple(uint256 bulletinId, uint8 bulletinType, string title, string body, address publishedBy, uint256 publishedAt, uint8 status, string metadataURI)[])",
];

const BULLETIN_TYPE_LABELS = ["Price Alert", "Market Notice", "Regulation", "General"];
const BULLETIN_TYPE_COLORS = [
  "bg-role-government/15 text-role-government",
  "bg-secondary-container text-on-secondary-container",
  "bg-primary-container text-on-primary-container",
  "bg-surface-container text-on-surface-variant",
];

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

function getNewsContract(signerOrProvider) {
  const address = process.env.NEWS_BULLETIN_ADDRESS;
  if (!address) {
    const err = new Error("NEWS_BULLETIN_ADDRESS is not configured");
    err.status = 500;
    throw err;
  }
  return new ethers.Contract(address, NEWS_BULLETIN_MIN_ABI, signerOrProvider);
}

function formatBulletin(b) {
  const typeIndex = Number(b.bulletinType);
  const publishedAt = Number(b.publishedAt) * 1000;
  return {
    id: b.bulletinId.toString(),
    tag: `${BULLETIN_TYPE_LABELS[typeIndex] || "General"} (${["Tsebiso ea Theko", "Tsebiso ea Maraka", "Melao", "Kakaretso"][typeIndex] || ""})`,
    tagColor: BULLETIN_TYPE_COLORS[typeIndex] || BULLETIN_TYPE_COLORS[3],
    date: new Date(publishedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    title: b.title,
    body: b.body,
    cta: "Read Details (Bala Lintlafatso)",
    publishedBy: b.publishedBy,
    createdAt: new Date(publishedAt).toISOString(),
  };
}

/**
 * GET /api/news
 * Returns active bulletins from the NewsBulletin contract (newest first).
 */
router.get("/", async (req, res) => {
  try {
    const cacheKey = "news:active";
    const cached = req.cache.get(cacheKey);
    if (cached) return res.json(cached);

    const contract = getNewsContract(getProvider());

    const raw = await contract.getActiveBulletins();
    const items = raw
      .map(formatBulletin)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const result = { items };
    req.cache.set(cacheKey, result, 60); // 1 minute cache for news
    return res.json(result);
  } catch (error) {
    console.error("Get news error:", error);
    return res.status(error.status || 500).json({ error: error.message || "Failed to fetch news" });
  }
});

/**
 * POST /api/news
 * Publish a new government bulletin on-chain (government role required).
 */
router.post(
  "/",
  [
    authenticate,
    requireGovernmentRole,
    body("title").isString().trim().isLength({ min: 3 }).withMessage("Title is required"),
    body("bulletinType")
      .isInt({ min: 0, max: 3 })
      .withMessage("bulletinType must be 0 (Price Alert), 1 (Market Notice), 2 (Regulation), or 3 (General)"),
    body("body").isString().trim().isLength({ min: 1 }).withMessage("Body text is required"),
    body("metadataURI").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const signer = getRelayerSigner();
      const contract = getNewsContract(signer);

      const tx = await contract.publishBulletin(
        Number(req.body.bulletinType),
        req.body.title,
        req.body.body,
        req.body.metadataURI || ""
      );
      const receipt = await tx.wait();

      // Invalidate news cache so next GET fetches fresh
      req.cache.del("news:active");

      return res.status(201).json({
        message: "Bulletin published on-chain",
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber ?? null,
      });
    } catch (error) {
      console.error("Publish news error:", error);
      return res.status(error.status || 500).json({ error: error.message || "Failed to publish bulletin" });
    }
  }
);

module.exports = router;
