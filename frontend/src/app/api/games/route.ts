import { NextResponse } from "next/server";
import { getAllActiveSessions } from "@/lib/server/store";

export async function GET() {
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
    return NextResponse.json(publicSessions);
}
