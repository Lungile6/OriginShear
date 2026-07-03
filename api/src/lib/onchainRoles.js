const { ethers } = require("ethers");

const HARVEST_LEDGER_ROLE_ABI = [
  "function FARMER_ROLE() view returns (bytes32)",
  "function VALIDATOR_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

const INDUSTRY_MARK_REGISTRY_ROLE_ABI = [
  "function GOVERNMENT_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
];

function getProvider() {
  const rpcUrl = process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function requireAddress(value, name) {
  if (!value) {
    const err = new Error(`${name} is not configured`);
    err.status = 500;
    throw err;
  }
}

async function walletHasValidatorRole(wallet) {
  requireAddress(process.env.HARVEST_LEDGER_ADDRESS, "HARVEST_LEDGER_ADDRESS");
  const provider = getProvider();
  const ledger = new ethers.Contract(
    process.env.HARVEST_LEDGER_ADDRESS,
    HARVEST_LEDGER_ROLE_ABI,
    provider
  );
  const validatorRole = await ledger.VALIDATOR_ROLE();
  return ledger.hasRole(validatorRole, wallet);
}

async function walletHasGovernmentRole(wallet) {
  requireAddress(process.env.INDUSTRY_MARK_REGISTRY_ADDRESS, "INDUSTRY_MARK_REGISTRY_ADDRESS");
  const provider = getProvider();
  const registry = new ethers.Contract(
    process.env.INDUSTRY_MARK_REGISTRY_ADDRESS,
    INDUSTRY_MARK_REGISTRY_ROLE_ABI,
    provider
  );
  const governmentRole = await registry.GOVERNMENT_ROLE();
  return registry.hasRole(governmentRole, wallet);
}

async function getWalletRoleClaims(wallet) {
  const claims = {
    isFarmer: false,
    isValidator: false,
    isAdmin: false,
    isGovernment: false,
    roles: ["BUYER"],
    primaryRole: "BUYER",
  };

  if (!wallet || !ethers.isAddress(wallet)) {
    return claims;
  }

  try {
    const provider = getProvider();

    if (process.env.HARVEST_LEDGER_ADDRESS) {
      const ledger = new ethers.Contract(
        process.env.HARVEST_LEDGER_ADDRESS,
        HARVEST_LEDGER_ROLE_ABI,
        provider
      );

      const [farmerRole, validatorRole, adminRole] = await Promise.all([
        ledger.FARMER_ROLE(),
        ledger.VALIDATOR_ROLE(),
        ledger.DEFAULT_ADMIN_ROLE(),
      ]);

      const [isFarmer, isValidator, isAdmin] = await Promise.all([
        ledger.hasRole(farmerRole, wallet),
        ledger.hasRole(validatorRole, wallet),
        ledger.hasRole(adminRole, wallet),
      ]);

      claims.isFarmer = Boolean(isFarmer);
      claims.isValidator = Boolean(isValidator);
      claims.isAdmin = Boolean(isAdmin);
    }

    if (process.env.INDUSTRY_MARK_REGISTRY_ADDRESS) {
      const registry = new ethers.Contract(
        process.env.INDUSTRY_MARK_REGISTRY_ADDRESS,
        INDUSTRY_MARK_REGISTRY_ROLE_ABI,
        provider
      );
      const governmentRole = await registry.GOVERNMENT_ROLE();
      claims.isGovernment = Boolean(await registry.hasRole(governmentRole, wallet));
    }
  } catch {
    // Keep login resilient: if role lookups fail, fallback remains BUYER only.
  }

  const roles = [];
  if (claims.isFarmer) roles.push("FARMER");
  if (claims.isValidator) roles.push("VALIDATOR");
  if (claims.isGovernment) roles.push("GOVERNMENT");
  if (claims.isAdmin) roles.push("ADMIN");
  roles.push("BUYER");

  claims.roles = roles;
  claims.primaryRole = claims.isGovernment
    ? "GOVERNMENT"
    : claims.isValidator
    ? "VALIDATOR"
    : claims.isFarmer
    ? "FARMER"
    : "BUYER";

  return claims;
}

module.exports = {
  walletHasValidatorRole,
  walletHasGovernmentRole,
  getWalletRoleClaims,
};
