import { NextRequest, NextResponse } from "next/server";
import { recordScore } from "@/lib/server/store";

export async function POST(req: NextRequest) {
    const { walletAddress, gameId, score, gameName } = await req.json();
    if (!walletAddress || !gameId || score === undefined) {
        return NextResponse.json(
            { error: "walletAddress, gameId, score required" },
            { status: 400 }
        );
    }
    recordScore(walletAddress, gameId, Number(score), gameName || "Unknown");
    return NextResponse.json({ success: true });
}
