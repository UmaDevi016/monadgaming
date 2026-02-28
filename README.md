# ChainCraft on Monad 🎮⛓️

> **AI-powered multiplayer game builder deployed on the Monad blockchain**

Create any game through an AI conversation → auto-generate playable HTML5 game code → deploy as an NFT on Monad → play with friends in real-time.

---

## 🏗️ Architecture

```
chaincraft-monad/
├── frontend/          # Next.js 14 App (React, TypeScript)
├── backend/           # Node.js + Express + Socket.io
└── contracts/         # Solidity smart contracts (Hardhat)
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, CSS Modules |
| Backend | Node.js, Express, Socket.io, OpenAI SDK |
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Blockchain | Monad Testnet (EVM-compatible) |
| AI | OpenAI GPT-4o |
| Auth | MetaMask wallet + ECDSA signature |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+
- MetaMask browser extension
- OpenAI API key
- (Optional) Monad testnet wallet with MON tokens

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```bash
OPENAI_API_KEY=sk-your-key-here
DEPLOYER_PRIVATE_KEY=0xyour-private-key-here
JWT_SECRET=your-random-secret-here
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install contracts dependencies separately
cd contracts && npm install && cd ..
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### 4. Deploy Smart Contracts (Optional)

```bash
cd contracts
npm run deploy    # Deploy to Monad Testnet
# OR
npm run deploy:local  # Deploy to local Hardhat node
```

### 5. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open http://localhost:3000 🚀

---

## 🎮 Features

### AI Game Design
- Conversational game design with GPT-4o
- 4-phase pipeline: Gather → Design → Generate → Deploy
- Generates complete HTML5/Canvas games

### Smart Contracts
- **ChainCraftGame** (ERC-721): Mints each game as a unique NFT
  - On-chain leaderboard (top 10 global scores)
  - Player score submission
  - Game metadata stored on-chain
- **ChainCraftRegistry**: Tracks all deployed games by creator/genre

### Multiplayer (WebSocket)
- Real-time game rooms via Socket.io
- Player join/leave events
- Game action broadcasting
- In-game chat

### Wallet Integration
- MetaMask connection
- Auto-switch to Monad network
- ECDSA signature authentication
- Balance display

### Leaderboard
- Off-chain real-time scoring
- On-chain top-10 via smart contract
- Per-player stats

---

## 🌐 Monad Network Config

| Setting | Value |
|---------|-------|
| Network Name | Monad Testnet |
| Chain ID | 10143 |
| RPC URL | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadexplorer.com |
| Currency | MON |

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `contracts/src/ChainCraftGame.sol` | ERC-721 game NFT contract |
| `contracts/src/ChainCraftRegistry.sol` | Game registry contract |
| `contracts/scripts/deploy.js` | Deployment script |
| `backend/src/services/aiService.js` | OpenAI integration |
| `backend/src/services/blockchainService.js` | Ethers.js integration |
| `backend/src/socket/handlers.js` | WebSocket multiplayer |
| `frontend/src/components/ChatBuilder.tsx` | Main chat UI |
| `frontend/src/lib/Web3Context.tsx` | MetaMask integration |

---

## 🔧 Development

### Run Tests
```bash
cd contracts && npx hardhat test
```

### Compile Contracts
```bash
cd contracts && npm run compile
```

### Build Frontend
```bash
cd frontend && npm run build
```

---

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI game design |
| `DEPLOYER_PRIVATE_KEY` | Private key for contract deployment |
| `MONAD_RPC_URL` | Monad testnet RPC endpoint |
| `JWT_SECRET` | Secret for JWT token signing |
| `PORT` | Backend server port (default: 4000) |
| `FRONTEND_URL` | Frontend URL for CORS |

---

## 🚀 Demo Mode

The app works without blockchain connectivity:
- AI chat still works with just `OPENAI_API_KEY`
- Game generation and preview still works
- Minting generates a demo transaction (no real chain needed)
- Add `DEPLOYER_PRIVATE_KEY` to enable real on-chain minting

---

## 🎯 Roadmap

- [ ] IPFS metadata storage (Filecoin/Pinata)
- [ ] Multi-game contract factory
- [ ] Game rental/licensing system
- [ ] AI-generated game assets (sprites, music)
- [ ] Cross-game tournaments
- [ ] Mobile-responsive game player
