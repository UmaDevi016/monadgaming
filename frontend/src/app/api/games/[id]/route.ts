import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/store";

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = getSession(params.id);
    if (!session) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json({
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
}
