import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});

const SYSTEM_PROMPT = `You are ChainCraft AI, a creative game design assistant that helps users create blockchain games on Monad.

Your role:
1. Guide users through designing a complete game concept through friendly conversation
2. Ask about: game genre, theme, story, rules, win conditions, number of players, difficulty
3. After gathering enough info, generate a complete game design document
4. Then generate the playable game code (HTML5/JavaScript)
5. Keep responses concise and engaging — use emojis occasionally

When generating game code, output a complete, self-contained HTML5 game that:
- Works in a browser iframe
- Has a clear start screen, gameplay, and end screen
- Shows the player's score
- Fires a window.postMessage({ type: 'GAME_OVER', score: N }) when game ends
- Is visually appealing with canvas or DOM-based graphics
- Includes Monad blockchain flavor (purple/teal color scheme, blockchain terminology)

Game design phases:
- Phase 1 (GATHERING): Ask questions, gather requirements
- Phase 2 (DESIGNING): Summarize the game design, ask for approval
- Phase 3 (GENERATING): Generate complete HTML game code
- Phase 4 (DEPLOYING): Confirm game is ready to deploy as NFT

Always reply with valid JSON in this format:
{
  "message": "Your response to the user",
  "phase": "GATHERING|DESIGNING|GENERATING|DEPLOYING",
  "gameDesign": {
    "name": "Game Name",
    "genre": "puzzle|rpg|strategy|arcade|trivia|adventure",
    "description": "Short description",
    "rules": ["rule1", "rule2"],
    "maxPlayers": 1,
    "winCondition": "How to win"
  },
  "gameCode": "<!-- complete HTML code here, only in GENERATING phase -->",
  "readyToMint": false
}`;

export async function chatWithAI(messages: Array<{ role: string; content: string }>) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "{}";
    try {
        return JSON.parse(content);
    } catch {
        return {
            message: content,
            phase: "GATHERING",
            gameDesign: null,
            gameCode: null,
            readyToMint: false,
        };
    }
}

export async function generateGameCode(gameDesign: {
    name: string;
    genre: string;
    description: string;
    rules?: string[];
    winCondition?: string;
    maxPlayers?: number;
}) {
    const prompt = `Create a complete, self-contained HTML5 game based on this design:
Name: ${gameDesign.name}
Genre: ${gameDesign.genre}
Description: ${gameDesign.description}
Rules: ${gameDesign.rules?.join(", ")}
Win Condition: ${gameDesign.winCondition}
Max Players: ${gameDesign.maxPlayers}

Requirements:
- Single HTML file with embedded CSS and JavaScript
- Visually appealing with canvas or DOM graphics
- Purple/teal Monad-themed color scheme (#7C3AED, #06B6D4)
- Clear start, play, and game-over states
- Score tracking displayed prominently
- Fires: window.parent.postMessage({ type: 'GAME_OVER', score: NUMBER }, '*') on game end
- Responsive, works in a 800x600 iframe
- Include blockchain/Monad-themed UI elements
- Smooth animations and good game feel

Output ONLY the raw HTML code, no markdown fences.`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 6000,
    });

    return response.choices[0].message.content;
}

export function generateNFTMetadata(
    gameDesign: {
        name: string;
        genre: string;
        description: string;
        rules?: string[];
        winCondition?: string;
        maxPlayers?: number;
    },
    gameId: string,
    creatorAddress: string
) {
    return {
        name: `ChainCraft: ${gameDesign.name}`,
        description: gameDesign.description,
        image: `https://chaincraft.gg/og/${gameId}`,
        external_url: `https://chaincraft.gg/play/${gameId}`,
        attributes: [
            { trait_type: "Genre", value: gameDesign.genre },
            { trait_type: "Max Players", value: gameDesign.maxPlayers },
            { trait_type: "Creator", value: creatorAddress },
            { trait_type: "Platform", value: "Monad" },
            { trait_type: "Created", value: new Date().toISOString() },
        ],
        properties: {
            game_id: gameId,
            rules: gameDesign.rules,
            win_condition: gameDesign.winCondition,
            blockchain: "Monad",
            chain_id: 10143,
        },
    };
}
