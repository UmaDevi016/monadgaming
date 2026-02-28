const { v4: uuidv4 } = require("uuid");
const {
    sessionMap,
    createSession,
    getSession,
    updateSession,
    addPlayerToSession,
} = require("../store");

/**
 * WebSocket event handlers for real-time multiplayer
 * 
 * Events (client → server):
 *   join_game    { gameId, walletAddress }
 *   leave_game   { gameId }
 *   game_action  { gameId, action: { type, payload } }
 *   chat_message { gameId, message }
 *   game_over    { gameId, score }
 * 
 * Events (server → client):
 *   game_state   { gameId, state }
 *   player_joined { gameId, player, playerCount }
 *   player_left  { gameId, player, playerCount }
 *   action_broadcast { gameId, player, action }
 *   chat_broadcast { gameId, player, message, timestamp }
 *   error        { message }
 */
function setupSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // ── Join Game Room ──────────────────────────────────────────────────────
        socket.on("join_game", ({ gameId, walletAddress }) => {
            try {
                if (!gameId || !walletAddress) {
                    socket.emit("error", { message: "gameId and walletAddress required" });
                    return;
                }

                let session = getSession(gameId);
                if (!session) {
                    // Create new session if it doesn't exist
                    session = createSession({
                        id: gameId,
                        creator: walletAddress,
                        maxPlayers: 8,
                        chatHistory: [],
                    });
                }

                addPlayerToSession(gameId, walletAddress);

                socket.join(gameId);
                sessionMap.set(socket.id, { walletAddress, gameId });

                const updatedSession = getSession(gameId);

                // Notify everyone in the room
                io.to(gameId).emit("player_joined", {
                    gameId,
                    player: walletAddress,
                    playerCount: updatedSession.players.length,
                    players: updatedSession.players,
                });

                // Send current game state to the joining player
                socket.emit("game_state", {
                    gameId,
                    state: updatedSession.gameState,
                    players: updatedSession.players,
                    name: updatedSession.name,
                });

                console.log(`👤 ${walletAddress.slice(0, 8)}... joined game ${gameId}`);
            } catch (err) {
                socket.emit("error", { message: err.message });
            }
        });

        // ── Leave Game ──────────────────────────────────────────────────────────
        socket.on("leave_game", ({ gameId }) => {
            handleDisconnect(socket, io, gameId);
        });

        // ── Game Action ─────────────────────────────────────────────────────────
        socket.on("game_action", ({ gameId, action }) => {
            const session = sessionMap.get(socket.id);
            if (!session) return;

            const walletAddress = session.walletAddress;
            const gameSession = getSession(gameId);
            if (!gameSession) return;

            // Update game state based on action
            const newState = applyAction(gameSession.gameState, action, walletAddress);
            updateSession(gameId, { gameState: newState });

            // Broadcast to all players in the room
            io.to(gameId).emit("action_broadcast", {
                gameId,
                player: walletAddress,
                action,
                newState,
                timestamp: Date.now(),
            });
        });

        // ── Chat Message ────────────────────────────────────────────────────────
        socket.on("chat_message", ({ gameId, message }) => {
            const session = sessionMap.get(socket.id);
            if (!session) return;

            io.to(gameId).emit("chat_broadcast", {
                gameId,
                player: session.walletAddress,
                message,
                timestamp: Date.now(),
            });
        });

        // ── Game Over ───────────────────────────────────────────────────────────
        socket.on("game_over", ({ gameId, score }) => {
            const session = sessionMap.get(socket.id);
            if (!session) return;

            io.to(gameId).emit("player_finished", {
                gameId,
                player: session.walletAddress,
                score,
                timestamp: Date.now(),
            });

            console.log(`🏁 ${session.walletAddress.slice(0, 8)}... finished with score ${score}`);
        });

        // ── Disconnect ──────────────────────────────────────────────────────────
        socket.on("disconnect", () => {
            const session = sessionMap.get(socket.id);
            if (session) {
                handleDisconnect(socket, io, session.gameId);
            }
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });
}

function handleDisconnect(socket, io, gameId) {
    const session = sessionMap.get(socket.id);
    if (!session) return;

    const { walletAddress } = session;
    socket.leave(gameId);
    sessionMap.delete(socket.id);

    const gameSession = getSession(gameId);
    if (gameSession) {
        const players = gameSession.players.filter((p) => p !== walletAddress);
        updateSession(gameId, { players });

        io.to(gameId).emit("player_left", {
            gameId,
            player: walletAddress,
            playerCount: players.length,
            players,
        });
    }
}

/**
 * Apply a game action to the current game state.
 * This is a generic handler — specific games use their own logic
 * embedded in the game code running in the iframe.
 */
function applyAction(currentState, action, player) {
    const newState = { ...currentState };

    switch (action.type) {
        case "MOVE":
            if (!newState.moves) newState.moves = [];
            newState.moves.push({ player, ...action.payload, timestamp: Date.now() });
            break;
        case "SET_TURN":
            newState.currentTurn = action.payload.player;
            break;
        case "UPDATE_SCORE":
            if (!newState.scores) newState.scores = {};
            newState.scores[player] = action.payload.score;
            break;
        case "CUSTOM":
            Object.assign(newState, action.payload);
            break;
        default:
            if (!newState.actions) newState.actions = [];
            newState.actions.push({ player, ...action, timestamp: Date.now() });
    }

    return newState;
}

module.exports = setupSocketHandlers;
