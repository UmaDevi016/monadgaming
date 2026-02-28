const express = require("express");
const { getTopScores, getPlayerScore, recordScore } = require("../store");
const { getOnChainLeaderboard } = require("../services/blockchainService");

const router = express.Router();

/**
 * GET /api/leaderboard
 * Get global leaderboard (in-memory + optionally on-chain)
 */
router.get("/", (_req, res) => {
    const scores = getTopScores(50);
    res.json(scores);
});

/**
 * GET /api/leaderboard/onchain
 * Fetch on-chain leaderboard from Monad
 */
router.get("/onchain", async (_req, res) => {
    try {
        const entries = await getOnChainLeaderboard();
        res.json(entries);
    } catch (err) {
        res.status(503).json({
            error: "On-chain leaderboard unavailable",
            details: err.message,
        });
    }
});

/**
 * GET /api/leaderboard/player/:address
 * Get a player's score history
 */
router.get("/player/:address", (req, res) => {
    const data = getPlayerScore(req.params.address);
    res.json(data);
});

/**
 * POST /api/leaderboard/submit
 * Submit a score (off-chain, for demo games)
 */
router.post("/submit", (req, res) => {
    const { walletAddress, gameId, score, gameName } = req.body;
    if (!walletAddress || !gameId || score === undefined) {
        return res.status(400).json({ error: "walletAddress, gameId, score required" });
    }
    recordScore(walletAddress, gameId, Number(score), gameName || "Unknown");
    res.json({ success: true });
});

module.exports = router;
