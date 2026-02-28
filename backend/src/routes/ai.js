const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { chatWithAI, generateGameCode } = require("../services/aiService");
const { createSession, getSession, updateSession } = require("../store");

const router = express.Router();

/**
 * POST /api/ai/chat
 * Send a message and get AI response for game design
 */
router.post("/chat", async (req, res) => {
    try {
        const { message, sessionId, chatHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Build messages array
        const messages = [
            ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        // Get or create session
        let sid = sessionId;
        if (!sid) {
            sid = uuidv4();
        }

        const aiResponse = await chatWithAI(messages);

        // If we have a game design, persist it
        if (aiResponse.gameDesign) {
            let session = getSession(sid);
            if (!session) {
                session = createSession({
                    id: sid,
                    name: aiResponse.gameDesign.name,
                    genre: aiResponse.gameDesign.genre,
                    description: aiResponse.gameDesign.description,
                    creator: req.body.walletAddress || "anonymous",
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

        // If game code was generated, store it
        if (aiResponse.gameCode) {
            updateSession(sid, { generatedCode: aiResponse.gameCode });
        }

        res.json({
            sessionId: sid,
            response: aiResponse,
        });
    } catch (err) {
        console.error("AI chat error:", err);
        res.status(500).json({ error: "AI service error", details: err.message });
    }
});

/**
 * POST /api/ai/generate-code
 * Generate HTML5 game code for a given game design
 */
router.post("/generate-code", async (req, res) => {
    try {
        const { gameDesign, sessionId } = req.body;
        if (!gameDesign) {
            return res.status(400).json({ error: "gameDesign is required" });
        }

        const code = await generateGameCode(gameDesign);

        if (sessionId) {
            updateSession(sessionId, { generatedCode: code });
        }

        res.json({ code });
    } catch (err) {
        console.error("Code gen error:", err);
        res.status(500).json({ error: "Code generation failed", details: err.message });
    }
});

/**
 * GET /api/ai/session/:id
 * Get current session state
 */
router.get("/session/:id", (req, res) => {
    const session = getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
});

module.exports = router;
