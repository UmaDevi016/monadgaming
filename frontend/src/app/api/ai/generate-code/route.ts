import { NextRequest, NextResponse } from "next/server";
import { generateGameCode } from "@/lib/server/aiService";
import { updateSession } from "@/lib/server/store";

export async function POST(req: NextRequest) {
    try {
        const { gameDesign, sessionId } = await req.json();
        if (!gameDesign) {
            return NextResponse.json({ error: "gameDesign is required" }, { status: 400 });
        }

        const code = await generateGameCode(gameDesign);
        if (sessionId) {
            updateSession(sessionId, { generatedCode: code });
        }

        return NextResponse.json({ code });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Code gen error:", err);
        return NextResponse.json({ error: "Code generation failed", details: message }, { status: 500 });
    }
}
