require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const INFURA_API_KEY = "eddc6dc0e3e74e31a9c2ba6a3fa7f8ec";
const PRIVATE_KEY = "52acd2bb2715b9101a2d23c48917996e1ad9be4ccf8f5d992453c478f8bfc9c2";
const ETHERSCAN_API_KEY =7KMPTUCZGNS2IF7QK52266Q7V3FW8FWDQR; // Add your Etherscan API key here

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      timeout: 300000, // 5 minutes
      gas: 1500000, // Further reduced gas limit
      maxPriorityFeePerGas: 1500000000, // 1.5 gwei
      maxFeePerGas: 35000000000 // 35 gwei
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: 60000
  }
};
