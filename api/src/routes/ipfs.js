const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const {
  uploadMetadata,
  readDevMetadata,
  getIpfsConfigStatus,
  toGatewayUrl,
  toIpfsUri,
} = require("../lib/ipfs");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    ...getIpfsConfigStatus(),
  });
});

router.get("/metadata/:cid", (req, res) => {
  const metadata = readDevMetadata(req.params.cid);
  if (!metadata) {
    return res.status(404).json({ error: "Metadata not found in local dev store" });
  }
  res.json(metadata);
});

router.post(
  "/lot-metadata",
  [
    authenticate,
    body("fibreType")
      .customSanitizer((v) => String(v))
      .isIn(["0", "1", "2"])
      .withMessage("Invalid fibre type"),
    body("grade")
      .customSanitizer((v) => String(v))
      .isIn(["0", "1", "2"])
      .withMessage("Invalid grade"),
    body("weightGrams")
      .customSanitizer((v) => String(v))
      .isInt({ min: 1, max: 4000000 })
      .withMessage("Invalid weight (1–4,000,000 grams)"),
    body("gpsZone").trim().notEmpty().withMessage("GPS zone required"),
    body("seasonYear").trim().notEmpty().withMessage("Season year required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const metadata = {
        fibreType: Number(req.body.fibreType),
        grade: Number(req.body.grade),
        weightGrams: Number(req.body.weightGrams),
        gpsZone: req.body.gpsZone,
        seasonYear: req.body.seasonYear,
        storageMethod: req.body.storageMethod || null,
        handlingNotes: req.body.handlingNotes || null,
        readyForPickup: req.body.readyForPickup ?? null,
        wallet: req.user?.wallet || null,
        uploadedAt: new Date().toISOString(),
        version: "1.0",
      };

      const { cid, devFallback } = await uploadMetadata(metadata);

      return res.status(201).json({
        cid,
        metadataURI: toIpfsUri(cid),
        gatewayURL: toGatewayUrl(cid),
        devFallback: Boolean(devFallback),
        ...(devFallback && {
          notice:
            "Metadata stored locally for development. Use Pinata or an approved Infura IPFS account for production pinning.",
        }),
      });
    } catch (error) {
      console.error("IPFS lot metadata upload error:", error);
      return res.status(500).json({
        error: error.message || "Failed to upload lot metadata to IPFS",
      });
    }
  }
);

module.exports = router;
