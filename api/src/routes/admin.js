const express = require("express");
const { authenticate } = require("../middleware/auth");
const { requireAdminRole } = require("../middleware/onchainAuth");
const { listLogins } = require("../lib/userDirectory");
const { getWalletRoleClaims } = require("../lib/onchainRoles");

const router = express.Router();

/**
 * GET /api/admin/logins
 * Wallets that have logged in via API + live on-chain roles.
 */
router.get("/logins", authenticate, requireAdminRole, async (req, res) => {
  try {
    const users = listLogins();
    const enriched = await Promise.all(
      users.map(async (user) => {
        try {
          const claims = await getWalletRoleClaims(user.wallet);
          return {
            ...user,
            roles: claims.roles,
            primaryRole: claims.primaryRole,
            isFarmer: claims.isFarmer,
            isValidator: claims.isValidator,
            isGovernment: claims.isGovernment,
            isAdmin: claims.isAdmin,
            rolesLive: true,
          };
        } catch {
          return { ...user, rolesLive: false };
        }
      })
    );
    return res.json({ data: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to list logins" });
  }
});

module.exports = router;
