require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.match(/^(0x)?[0-9a-fA-F]{64}$/) ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 500000000,
    },
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.match(/^(0x)?[0-9a-fA-F]{64}$/) ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 500000000,
    },
  },
};
