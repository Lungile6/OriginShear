const { ethers } = require("ethers");

/**
 * Active chain for the API.
 * Set CHAIN_NETWORK=celoSepolia (default) or celo (mainnet).
 */
function getChainNetwork() {
  const raw = (process.env.CHAIN_NETWORK || "celoSepolia").trim();
  if (raw === "celo" || raw === "mainnet") return "celo";
  if (raw === "celoSepolia" || raw === "sepolia") return "celoSepolia";
  return "celoSepolia";
}

function getRpcUrl() {
  const network = getChainNetwork();
  if (network === "celo") {
    return process.env.CELO_RPC_URL || "https://forno.celo.org";
  }
  return process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
}

function getProvider() {
  return new ethers.JsonRpcProvider(getRpcUrl());
}

module.exports = {
  getChainNetwork,
  getRpcUrl,
  getProvider,
};
