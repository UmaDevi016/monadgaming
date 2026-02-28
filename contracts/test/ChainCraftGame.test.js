const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainCraftGame", function () {
    let game, registry;
    let owner, creator, player1, player2;

    beforeEach(async function () {
        [owner, creator, player1, player2] = await ethers.getSigners();

        const Registry = await ethers.getContractFactory("ChainCraftRegistry");
        registry = await Registry.deploy();

        const Game = await ethers.getContractFactory("ChainCraftGame");
        game = await Game.deploy(owner.address);
    });

    describe("Minting", function () {
        it("should mint a game NFT", async function () {
            const mintFee = await game.mintFee();

            await expect(
                game.connect(creator).mintGame(
                    creator.address,
                    "ipfs://QmTest",
                    "Test Game",
                    "puzzle",
                    "A test puzzle game",
                    4,
                    { value: mintFee }
                )
            ).to.emit(game, "GameMinted");

            expect(await game.totalSupply()).to.equal(1);
            expect(await game.ownerOf(1)).to.equal(creator.address);
        });

        it("should revert with insufficient mint fee", async function () {
            await expect(
                game.connect(creator).mintGame(
                    creator.address,
                    "ipfs://QmTest",
                    "Test Game",
                    "puzzle",
                    "A test game",
                    4,
                    { value: 0 }
                )
            ).to.be.revertedWith("Insufficient mint fee");
        });

        it("should store correct game metadata", async function () {
            const mintFee = await game.mintFee();
            await game.connect(creator).mintGame(
                creator.address,
                "ipfs://QmTest",
                "Space Invaders",
                "arcade",
                "Shoot the aliens!",
                2,
                { value: mintFee }
            );

            const metadata = await game.getGame(1);
            expect(metadata.name).to.equal("Space Invaders");
            expect(metadata.genre).to.equal("arcade");
            expect(metadata.creator).to.equal(creator.address);
            expect(metadata.isActive).to.be.true;
        });
    });

    describe("Player & Scoring", function () {
        let tokenId;

        beforeEach(async function () {
            const mintFee = await game.mintFee();
            await game.connect(creator).mintGame(
                creator.address,
                "ipfs://QmTest",
                "Test Game",
                "rpg",
                "A test RPG",
                4,
                { value: mintFee }
            );
            tokenId = 1;
        });

        it("should allow a player to join a game", async function () {
            const tx = await game.connect(player1).joinGame(tokenId);
            const receipt = await tx.wait();
            const event = receipt.logs
                .map((log) => { try { return game.interface.parseLog(log); } catch { return null; } })
                .find((e) => e?.name === "PlayerJoinedGame");
            expect(event).to.not.be.null;
            expect(event.args.gameId).to.equal(BigInt(tokenId));
            expect(event.args.player).to.equal(player1.address);
        });

        it("should allow score submission after joining", async function () {
            await game.connect(player1).joinGame(tokenId);
            await expect(game.connect(player1).submitScore(tokenId, 1000))
                .to.emit(game, "ScoreSubmitted");

            const playerData = await game.getPlayer(player1.address);
            expect(playerData.score).to.equal(1000);
            expect(playerData.gamesPlayed).to.equal(1);
        });

        it("creator can submit score without joining", async function () {
            await expect(game.connect(creator).submitScore(tokenId, 5000))
                .to.emit(game, "ScoreSubmitted");
        });

        it("should track play count", async function () {
            await game.connect(player1).joinGame(tokenId);
            await game.connect(player1).submitScore(tokenId, 100);

            const metadata = await game.getGame(tokenId);
            expect(metadata.playCount).to.equal(1);
        });
    });

    describe("Leaderboard", function () {
        it("should update global leaderboard with top scores", async function () {
            const mintFee = await game.mintFee();
            await game.connect(creator).mintGame(
                creator.address, "ipfs://Q", "Game", "arcade", "desc", 10, { value: mintFee }
            );

            await game.connect(creator).submitScore(1, 99999);
            const leaderboard = await game.getGlobalLeaderboard();

            const entries = leaderboard.filter(e => e.player !== ethers.ZeroAddress);
            expect(entries.length).to.equal(1);
            expect(entries[0].score).to.equal(99999);
        });
    });

    describe("Admin", function () {
        it("owner can update mint fee", async function () {
            const newFee = ethers.parseEther("0.01");
            await expect(game.connect(owner).setMintFee(newFee))
                .to.emit(game, "MintFeeUpdated");
            expect(await game.mintFee()).to.equal(newFee);
        });

        it("non-owner cannot update mint fee", async function () {
            await expect(
                game.connect(creator).setMintFee(ethers.parseEther("0.01"))
            ).to.be.reverted;
        });

        it("owner can withdraw funds", async function () {
            const mintFee = await game.mintFee();
            await game.connect(creator).mintGame(
                creator.address, "ipfs://Q", "Game", "arcade", "desc", 4, { value: mintFee }
            );
            await expect(game.connect(owner).withdraw()).not.to.be.reverted;
        });
    });

    describe("Registry", function () {
        it("should register a game", async function () {
            await expect(
                registry.registerGame(
                    await game.getAddress(),
                    creator.address,
                    "Test Game",
                    "puzzle"
                )
            ).to.emit(registry, "GameRegistered");

            expect(await registry.totalContracts()).to.equal(1);
        });

        it("should track games by creator", async function () {
            await registry.registerGame(await game.getAddress(), creator.address, "G1", "rpg");
            await registry.registerGame(await game.getAddress(), creator.address, "G2", "puzzle");

            const creatorGames = await registry.getCreatorGames(creator.address);
            expect(creatorGames.length).to.equal(2);
        });
    });
});
