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
    celoSepolia: {
      url: process.env.CELO_SEPOLIA_RPC_URL || "https://celo-mainnet.g.alchemy.com/v2/guusXcuDWSTypMk8NFB4_",
      chainId: 11142220,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`]
        : [],
      gasPrice: 100000000000,
    },
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`]
        : [],
      gasPrice: 500000000,
    },
  },
};