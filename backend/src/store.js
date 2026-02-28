/**
 * In-memory game session store.
 * In production, replace with Redis or a database.
 */
const gameStore = new Map();       // gameId -> GameSession
const playerStore = new Map();     // walletAddress -> PlayerState
const sessionMap = new Map();      // socketId -> { walletAddress, gameId }

/**
 * @typedef {Object} GameSession
 * @property {string} id
 * @property {string} name
 * @property {string} genre
 * @property {string} description
 * @property {string} creator
 * @property {string[]} players  - wallet addresses
 * @property {number} maxPlayers
 * @property {Object} gameState  - arbitrary game state (moves, board, etc.)
 * @property {boolean} isActive
 * @property {number} createdAt
 * @property {string|null} contractAddress
 * @property {number|null} tokenId
 */

function createSession(data) {
    const session = {
        id: data.id,
        name: data.name || "Untitled Game",
        genre: data.genre || "misc",
        description: data.description || "",
        creator: data.creator,
        players: [data.creator],
        maxPlayers: data.maxPlayers || 4,
        gameState: data.gameState || {},
        chatHistory: data.chatHistory || [],
        generatedCode: data.generatedCode || null,
        isActive: true,
        isDeployed: false,
        contractAddress: null,
        tokenId: null,
        createdAt: Date.now(),
    };
    gameStore.set(session.id, session);
    return session;
}

function getSession(gameId) {
    return gameStore.get(gameId) || null;
}

function updateSession(gameId, updates) {
    const session = gameStore.get(gameId);
    if (!session) return null;
    const updated = { ...session, ...updates };
    gameStore.set(gameId, updated);
    return updated;
}

function addPlayerToSession(gameId, walletAddress) {
    const session = gameStore.get(gameId);
    if (!session) return null;
    if (!session.players.includes(walletAddress)) {
        if (session.players.length >= session.maxPlayers) {
            throw new Error("Game is full");
        }
        session.players.push(walletAddress);
        gameStore.set(gameId, session);
    }
    return session;
}

function getAllActiveSessions() {
    return Array.from(gameStore.values()).filter((s) => s.isActive);
}

function getSessionsByCreator(creator) {
    return Array.from(gameStore.values()).filter((s) => s.creator === creator);
}

// Global leaderboard (top 50 scores)
const leaderboard = [];

function recordScore(walletAddress, gameId, score, gameName) {
    leaderboard.push({
        walletAddress,
        gameId,
        score,
        gameName,
        timestamp: Date.now(),
    });
    // Keep sorted descending
    leaderboard.sort((a, b) => b.score - a.score);
    // Keep top 100
    if (leaderboard.length > 100) leaderboard.splice(100);
}

function getTopScores(limit = 50) {
    return leaderboard.slice(0, limit);
}

function getPlayerScore(walletAddress) {
    const entries = leaderboard.filter((e) => e.walletAddress === walletAddress);
    const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
    return { walletAddress, totalScore, gamesPlayed: entries.length, entries };
}

module.exports = {
    gameStore,
    playerStore,
    sessionMap,
    createSession,
    getSession,
    updateSession,
    addPlayerToSession,
    getAllActiveSessions,
    getSessionsByCreator,
    recordScore,
    getTopScores,
    getPlayerScore,
};
