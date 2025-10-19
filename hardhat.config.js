require("@nomicfoundation/hardhat-ethers");

const PRIVATE_KEY = "0xba8622b30b794779b1b4f943c45ae65667a81360db367f0a2350850919a4b632";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    monad: {
      url: "https://rpc.ankr.com/monad_testnet",
      chainId: 10143,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    }
  }
};
