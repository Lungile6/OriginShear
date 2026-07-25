const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { requireAdminRole } = require("../middleware/onchainAuth");
const {
  upsertAccessRequest,
  listAccessRequests,
  updateAccessRequestStatus,
} = require("../lib/userDirectory");

const router = express.Router();

/**
 * POST /api/access-requests
 * Authenticated wallet applies for FARMER / VALIDATOR / GOVERNMENT access.
 */
router.post(
  "/",
  authenticate,
  body("requestedRole")
    .isIn(["FARMER", "VALIDATOR", "GOVERNMENT", "farmer", "validator", "government"])
    .withMessage("requestedRole must be FARMER, VALIDATOR, or GOVERNMENT"),
  body("note").optional().isString().isLength({ max: 500 }),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const wallet = req.user?.wallet;
      if (!wallet) {
        return res.status(401).json({ error: "Missing authenticated wallet" });
      }
      const request = upsertAccessRequest({
        wallet,
        requestedRole: String(req.body.requestedRole).toUpperCase(),
        note: req.body.note || "",
      });
      return res.status(201).json({ request });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || "Failed to submit request" });
    }
  }
);

/**
 * GET /api/access-requests/mine
 * List the caller's access applications.
 */
router.get("/mine", authenticate, (req, res) => {
  const wallet = req.user?.wallet?.toLowerCase();
  if (!wallet) {
    return res.status(401).json({ error: "Missing authenticated wallet" });
  }
  const mine = listAccessRequests().filter((r) => r.wallet === wallet);
  return res.json({ data: mine });
});

/**
 * GET /api/access-requests
 * Admin: list all applications (optional ?status=pending).
 */
router.get("/", authenticate, requireAdminRole, (req, res) => {
  const status = req.query.status ? String(req.query.status) : undefined;
  return res.json({ data: listAccessRequests({ status }) });
});

/**
 * PATCH /api/access-requests/:id
 * Admin: mark request reviewed / approved / rejected (after on-chain grant).
 */
router.patch(
  "/:id",
  authenticate,
  requireAdminRole,
  body("status").isIn(["pending", "reviewed", "approved", "rejected"]),
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const updated = updateAccessRequestStatus(
        req.params.id,
        req.body.status,
        req.user?.wallet
      );
      return res.json({ request: updated });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || "Update failed" });
    }
  }
);

module.exports = router;
