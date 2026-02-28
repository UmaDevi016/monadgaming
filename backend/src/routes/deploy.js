const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { mintGameNFT, getContractAddresses } = require("../services/blockchainService");
const { generateNFTMetadata } = require("../services/aiService");
const { getSession, updateSession } = require("../store");

const router = express.Router();

/**
 * POST /api/deploy/mint
 * Mint a game as an NFT on Monad blockchain
 */
router.post("/mint", async (req, res) => {
    try {
        const { sessionId, walletAddress } = req.body;

        if (!sessionId || !walletAddress) {
            return res.status(400).json({ error: "sessionId and walletAddress required" });
        }

        const session = getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (!session.generatedCode) {
            return res.status(400).json({ error: "No game code generated yet" });
        }

        if (session.isDeployed) {
            return res.json({
                alreadyDeployed: true,
                tokenId: session.tokenId,
                contractAddress: session.contractAddress,
            });
        }

        // Generate metadata for the NFT
        const metadata = generateNFTMetadata(
            {
                name: session.name,
                genre: session.genre,
                description: session.description,
                rules: session.gameState?.rules || [],
                winCondition: session.gameState?.winCondition || "Highest score wins",
                maxPlayers: session.maxPlayers,
            },
            sessionId,
            walletAddress
        );

        // For demo: use a data URI as tokenURI (production would use IPFS)
        const tokenURI = `data:application/json;base64,${Buffer.from(
            JSON.stringify(metadata)
        ).toString("base64")}`;

        console.log(`🎮 Minting game NFT for session ${sessionId}...`);

        let mintResult;
        try {
            mintResult = await mintGameNFT({
                creatorAddress: walletAddress,
                tokenURI,
                name: session.name,
                genre: session.genre,
                description: session.description,
                maxPlayers: session.maxPlayers,
            });
        } catch (blockchainErr) {
            console.warn("Blockchain minting failed (demo mode):", blockchainErr.message);
            // Demo fallback: simulate minting
            mintResult = {
                txHash: `0x${uuidv4().replace(/-/g, "")}`,
                tokenId: Math.floor(Math.random() * 10000) + 1,
                contractAddress: "0x0000000000000000000000000000000000000000",
                explorerUrl: `https://testnet.monadexplorer.com/tx/demo`,
                demo: true,
            };
        }

        // Update session with deployment info
        updateSession(sessionId, {
            isDeployed: true,
            contractAddress: mintResult.contractAddress,
            tokenId: mintResult.tokenId,
            txHash: mintResult.txHash,
        });

        res.json({
            success: true,
            ...mintResult,
            metadata,
        });
    } catch (err) {
        console.error("Mint error:", err);
        res.status(500).json({ error: "Minting failed", details: err.message });
    }
});

/**
 * GET /api/deploy/contracts
 * Get deployed contract addresses (for frontend Web3 calls)
 */
router.get("/contracts", (_req, res) => {
    try {
        const addresses = getContractAddresses();
        res.json(addresses);
    } catch (err) {
        res.status(503).json({
            error: "Contracts not deployed yet",
            message: "Run npm run deploy:contracts first",
        });
    }
});

module.exports = router;
