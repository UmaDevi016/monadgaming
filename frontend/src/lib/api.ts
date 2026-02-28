const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

async function req<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Request failed");
    }
    return res.json();
}

// ── AI ──────────────────────────────────────────────────────────────────────

export async function sendChatMessage(payload: {
    message: string;
    sessionId?: string;
    chatHistory?: Array<{ role: string; content: string }>;
    walletAddress?: string;
}) {
    return req<{ sessionId: string; response: any }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function generateCode(gameDesign: any) {
    return req<{ code: string }>("/api/ai/generate-code", {
        method: "POST",
        body: JSON.stringify({ gameDesign }),
    });
}

export async function getSession(sessionId: string) {
    return req<any>(`/api/ai/session/${sessionId}`);
}

// ── Games ────────────────────────────────────────────────────────────────────

export async function fetchGames() {
    return req<any[]>("/api/games");
}

export async function fetchGame(id: string) {
    return req<any>(`/api/games/${id}`);
}

export async function fetchCreatorGames(address: string) {
    return req<any[]>(`/api/games/creator/${address}`);
}

// ── Deploy ───────────────────────────────────────────────────────────────────

export async function mintGame(payload: {
    sessionId: string;
    walletAddress: string;
}) {
    return req<any>("/api/deploy/mint", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getContractAddresses() {
    return req<any>("/api/deploy/contracts");
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function fetchLeaderboard() {
    return req<any[]>("/api/leaderboard");
}

export async function submitScore(payload: {
    walletAddress: string;
    gameId: string;
    score: number;
    gameName?: string;
}) {
    return req<{ success: boolean }>("/api/leaderboard/submit", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function fetchPlayerScore(address: string) {
    return req<any>(`/api/leaderboard/player/${address}`);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getNonce(address: string) {
    return req<{ nonce: string }>("/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ address }),
    });
}

export async function verifySignature(payload: {
    address: string;
    signature: string;
    nonce: string;
}) {
    return req<{ token: string; address: string }>("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
