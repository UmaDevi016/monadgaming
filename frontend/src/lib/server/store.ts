/**
 * In-memory game session store.
 * Note: In Vercel's serverless environment, state is per-function-instance.
 * For production, replace with Redis, Upstash, or a DB.
 */

export interface GameSession {
    id: string;
    name: string;
    genre: string;
    description: string;
    creator: string;
    players: string[];
    maxPlayers: number;
    gameState: Record<string, unknown>;
    chatHistory: Array<{ role: string; content: string }>;
    generatedCode: string | null;
    isActive: boolean;
    isDeployed: boolean;
    contractAddress: string | null;
    tokenId: number | null;
    txHash?: string;
    createdAt: number;
}

export interface LeaderboardEntry {
    walletAddress: string;
    gameId: string;
    score: number;
    gameName: string;
    timestamp: number;
}

// Global singletons (survive within the same serverless instance)
const gameStore = new Map<string, GameSession>();
const leaderboard: LeaderboardEntry[] = [];

export function createSession(data: Partial<GameSession> & { id: string; creator: string }): GameSession {
    const session: GameSession = {
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

export function getSession(gameId: string): GameSession | null {
    return gameStore.get(gameId) || null;
}

export function updateSession(gameId: string, updates: Partial<GameSession>): GameSession | null {
    const session = gameStore.get(gameId);
    if (!session) return null;
    const updated = { ...session, ...updates };
    gameStore.set(gameId, updated);
    return updated;
}

export function getAllActiveSessions(): GameSession[] {
    return Array.from(gameStore.values()).filter((s) => s.isActive);
}

export function getSessionsByCreator(creator: string): GameSession[] {
    return Array.from(gameStore.values()).filter((s) => s.creator === creator);
}

export function recordScore(walletAddress: string, gameId: string, score: number, gameName: string): void {
    leaderboard.push({ walletAddress, gameId, score, gameName, timestamp: Date.now() });
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 100) leaderboard.splice(100);
}

export function getTopScores(limit = 50): LeaderboardEntry[] {
    return leaderboard.slice(0, limit);
}

export function getPlayerScore(walletAddress: string) {
    const entries = leaderboard.filter((e) => e.walletAddress === walletAddress);
    const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
    return { walletAddress, totalScore, gamesPlayed: entries.length, entries };
}
