const { ethers } = require("ethers");
const { walletHasValidatorRole, walletHasGovernmentRole } = require("../lib/onchainRoles");

function resolveCallerWallet(req) {
  const wallet = req.user?.wallet;
  if (!wallet || !ethers.isAddress(wallet)) return null;
  return wallet;
}

function isDevBypassEnabled() {
  return process.env.DEV_BYPASS_ROLE_GUARDS === "true";
}

async function requireValidatorRole(req, res, next) {
  if (isDevBypassEnabled()) return next();

  try {
    const wallet = resolveCallerWallet(req);
    if (!wallet) {
      return res.status(401).json({ error: "Missing authenticated wallet" });
    }

    const hasRole = await walletHasValidatorRole(wallet);
    if (!hasRole) {
      return res.status(403).json({ error: "Validator role required" });
    }
    return next();
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Role check failed" });
  }
}

async function requireGovernmentRole(req, res, next) {
  if (isDevBypassEnabled()) return next();

  try {
    const wallet = resolveCallerWallet(req);
    if (!wallet) {
      return res.status(401).json({ error: "Missing authenticated wallet" });
    }

    const hasRole = await walletHasGovernmentRole(wallet);
    if (!hasRole) {
      return res.status(403).json({ error: "Government role required" });
    }
    return next();
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Role check failed" });
  }
}

module.exports = {
  requireValidatorRole,
  requireGovernmentRole,
};
