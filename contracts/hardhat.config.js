require("@nomicfoundation/hardhat-toolbox");

// Load .env from either ../  (when run from contracts/) or ./  (root)
const path = require("path");
const fs = require("fs");
const envPaths = [path.resolve(__dirname, "../.env"), path.resolve(__dirname, ".env")];
for (const p of envPaths) {
  if (fs.existsSync(p)) { require("dotenv").config({ path: p }); break; }
}

const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

// Only include real account if a proper private key is set
const rawKey = process.env.DEPLOYER_PRIVATE_KEY || "";
const hasRealKey = rawKey.length >= 64 && !rawKey.startsWith("your_");
const DEPLOYER_ACCOUNTS = hasRealKey
  ? [rawKey.startsWith("0x") ? rawKey : "0x" + rawKey]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    monad: {
      url: MONAD_RPC_URL,
      chainId: 10143,
      accounts: DEPLOYER_ACCOUNTS,
      gasPrice: "auto",
      timeout: 120000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
