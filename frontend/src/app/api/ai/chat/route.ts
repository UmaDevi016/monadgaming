import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { chatWithAI } from "@/lib/server/aiService";
import { createSession, getSession, updateSession } from "@/lib/server/store";

export async function POST(req: NextRequest) {
    try {
        const { message, sessionId, chatHistory = [], walletAddress } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const messages = [
            ...chatHistory.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        let sid = sessionId || uuidv4();
        const aiResponse = await chatWithAI(messages);

        if (aiResponse.gameDesign) {
            let session = getSession(sid);
            if (!session) {
                createSession({
                    id: sid,
                    name: aiResponse.gameDesign.name,
                    genre: aiResponse.gameDesign.genre,
                    description: aiResponse.gameDesign.description,
                    creator: walletAddress || "anonymous",
                    maxPlayers: aiResponse.gameDesign.maxPlayers || 4,
                    chatHistory: messages,
                });
            } else {
                updateSession(sid, {
                    name: aiResponse.gameDesign.name,
                    genre: aiResponse.gameDesign.genre,
                    description: aiResponse.gameDesign.description,
                    chatHistory: messages,
                });
            }
        }

        if (aiResponse.gameCode) {
            updateSession(sid, { generatedCode: aiResponse.gameCode });
        }

        return NextResponse.json({ sessionId: sid, response: aiResponse });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("AI chat error:", err);
        return NextResponse.json({ error: "AI service error", details: message }, { status: 500 });
    }
}
