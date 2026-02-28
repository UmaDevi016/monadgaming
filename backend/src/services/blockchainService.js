const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract ABIs
let contractConfig = null;

function loadContractConfig() {
    if (contractConfig) return contractConfig;

    const configPath = path.join(__dirname, "../contracts/addresses.json");
    if (fs.existsSync(configPath)) {
        contractConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } else {
        // Fallback empty config
        contractConfig = {
            ChainCraftGame: { address: null, abi: [] },
            ChainCraftRegistry: { address: null, abi: [] },
        };
        console.warn("⚠️  Contract ABIs not found. Run `npm run deploy:contracts` first.");
    }
    return contractConfig;
}

function getProvider() {
    return new ethers.JsonRpcProvider(
        process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"
    );
}

function getDeployerWallet() {
    const provider = getProvider();
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
    return new ethers.Wallet(privateKey, provider);
}

function getGameContract(signerOrProvider) {
    const config = loadContractConfig();
    if (!config.ChainCraftGame.address) {
        throw new Error("ChainCraftGame contract not deployed yet");
    }
    return new ethers.Contract(
        config.ChainCraftGame.address,
        config.ChainCraftGame.abi,
        signerOrProvider
    );
}

function getRegistryContract(signerOrProvider) {
    const config = loadContractConfig();
    if (!config.ChainCraftRegistry.address) {
        throw new Error("ChainCraftRegistry contract not deployed yet");
    }
    return new ethers.Contract(
        config.ChainCraftRegistry.address,
        config.ChainCraftRegistry.abi,
        signerOrProvider
    );
}

/**
 * Mint a new game NFT on-chain
 * @param {Object} params
 * @param {string} params.creatorAddress
 * @param {string} params.tokenURI
 * @param {string} params.name
 * @param {string} params.genre
 * @param {string} params.description
 * @param {number} params.maxPlayers
 */
async function mintGameNFT(params) {
    const wallet = getDeployerWallet();
    const contract = getGameContract(wallet);

    const mintFee = await contract.mintFee();

    const tx = await contract.mintGame(
        params.creatorAddress,
        params.tokenURI,
        params.name,
        params.genre,
        params.description,
        params.maxPlayers,
        { value: mintFee }
    );

    console.log(`⏳ Minting NFT... tx: ${tx.hash}`);
    const receipt = await tx.wait();

    // Extract tokenId from GameMinted event
    const event = receipt.logs
        .map((log) => {
            try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e) => e?.name === "GameMinted");

    const tokenId = event ? Number(event.args.tokenId) : null;

    return {
        txHash: tx.hash,
        tokenId,
        contractAddress: await contract.getAddress(),
        explorerUrl: `https://testnet.monadexplorer.com/tx/${tx.hash}`,
    };
}

/**
 * Fetch on-chain leaderboard
 */
async function getOnChainLeaderboard() {
    const provider = getProvider();
    const contract = getGameContract(provider);
    const entries = await contract.getGlobalLeaderboard();
    return entries
        .filter((e) => e.player !== ethers.ZeroAddress)
        .map((e) => ({
            player: e.player,
            score: Number(e.score),
            gameId: Number(e.gameId),
            timestamp: Number(e.timestamp),
        }))
        .sort((a, b) => b.score - a.score);
}

/**
 * Get contract address config for frontend
 */
function getContractAddresses() {
    const config = loadContractConfig();
    return {
        chainId: config.chainId,
        ChainCraftGame: config.ChainCraftGame.address,
        ChainCraftRegistry: config.ChainCraftRegistry.address,
    };
}

module.exports = {
    getProvider,
    getDeployerWallet,
    getGameContract,
    getRegistryContract,
    mintGameNFT,
    getOnChainLeaderboard,
    getContractAddresses,
    loadContractConfig,
};
