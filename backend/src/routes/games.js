const express = require("express");
const { getAllActiveSessions, getSession, getSessionsByCreator } = require("../store");

const router = express.Router();

/**
 * GET /api/games
 * List all active game sessions (game browser)
 */
router.get("/", (_req, res) => {
    const sessions = getAllActiveSessions();
    const publicSessions = sessions.map((s) => ({
        id: s.id,
        name: s.name,
        genre: s.genre,
        description: s.description,
        creator: s.creator,
        players: s.players.length,
        maxPlayers: s.maxPlayers,
        isDeployed: s.isDeployed,
        contractAddress: s.contractAddress,
        tokenId: s.tokenId,
        createdAt: s.createdAt,
    }));
    res.json(publicSessions);
});

/**
 * GET /api/games/:id
 * Get details of a specific game
 */
router.get("/:id", (req, res) => {
    const session = getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: "Game not found" });
    }

    res.json({
        id: session.id,
        name: session.name,
        genre: session.genre,
        description: session.description,
        creator: session.creator,
        players: session.players,
        maxPlayers: session.maxPlayers,
        isDeployed: session.isDeployed,
        contractAddress: session.contractAddress,
        tokenId: session.tokenId,
        generatedCode: session.generatedCode,
        createdAt: session.createdAt,
    });
});

/**
 * GET /api/games/creator/:address
 * Get all games by a creator
 */
router.get("/creator/:address", (req, res) => {
    const sessions = getSessionsByCreator(req.params.address);
    res.json(sessions);
});

module.exports = router;
