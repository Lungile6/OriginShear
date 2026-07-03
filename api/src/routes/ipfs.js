const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { uploadMetadata, toGatewayUrl, toIpfsUri } = require("../lib/ipfs");

const router = express.Router();

router.post(
  "/lot-metadata",
  [
    authenticate,
    body("fibreType").isIn(["0", "1", "2"]).withMessage("Invalid fibre type"),
    body("grade").isIn(["0", "1", "2"]).withMessage("Invalid grade"),
    body("weightGrams").isInt({ min: 1, max: 4000000 }).withMessage("Invalid weight"),
    body("gpsZone").notEmpty().withMessage("GPS zone required"),
    body("seasonYear").notEmpty().withMessage("Season year required"),
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
        wallet: req.user?.wallet || null,
        uploadedAt: new Date().toISOString(),
        version: "1.0",
      };

      const cid = await uploadMetadata(metadata);

      return res.status(201).json({
        cid,
        metadataURI: toIpfsUri(cid),
        gatewayURL: toGatewayUrl(cid),
      });
    } catch (error) {
      console.error("IPFS lot metadata upload error:", error);
      return res.status(500).json({ error: "Failed to upload lot metadata to IPFS" });
    }
  }
);

module.exports = router;
