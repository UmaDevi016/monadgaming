require("dotenv").config({ path: "../../.env" });
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const aiRouter = require("./routes/ai");
const gamesRouter = require("./routes/games");
const deployRouter = require("./routes/deploy");
const leaderboardRouter = require("./routes/leaderboard");
const authRouter = require("./routes/auth");
const setupSocketHandlers = require("./socket/handlers");

const app = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/games", gamesRouter);
app.use("/api/deploy", deployRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Socket.IO (Multiplayer) ───────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
});

setupSocketHandlers(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🎮 ChainCraft Backend running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔗 Monad RPC: ${process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"}\n`);
});

module.exports = { app, io };
