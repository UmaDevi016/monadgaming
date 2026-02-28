const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying ChainCraft contracts to Monad...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "MON\n");

    // ── Deploy Registry ──────────────────────────────────────────────────────
    console.log("📋 Deploying ChainCraftRegistry...");
    const Registry = await ethers.getContractFactory("ChainCraftRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ ChainCraftRegistry deployed to:", registryAddress);

    // ── Deploy Main Game Contract ────────────────────────────────────────────
    console.log("\n🎮 Deploying ChainCraftGame...");
    const Game = await ethers.getContractFactory("ChainCraftGame");
    const game = await Game.deploy(deployer.address);
    await game.waitForDeployment();
    const gameAddress = await game.getAddress();
    console.log("✅ ChainCraftGame deployed to:", gameAddress);

    // ── Save Deployment Info ─────────────────────────────────────────────────
    const network = await ethers.provider.getNetwork();
    const deploymentInfo = {
        network: network.name,
        chainId: Number(network.chainId),
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            ChainCraftRegistry: {
                address: registryAddress,
                abi: "artifacts/src/ChainCraftRegistry.sol/ChainCraftRegistry.json",
            },
            ChainCraftGame: {
                address: gameAddress,
                abi: "artifacts/src/ChainCraftGame.sol/ChainCraftGame.json",
            },
        },
    };

    const outPath = path.join(__dirname, "../deployment.json");
    fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📝 Deployment info saved to contracts/deployment.json");

    // ── Copy ABIs to frontend and backend ───────────────────────────────────
    const frontendOut = path.join(__dirname, "../../frontend/src/lib/contracts");
    const backendOut = path.join(__dirname, "../../backend/src/contracts");

    [frontendOut, backendOut].forEach((dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const gameArtifact = require("../artifacts/src/ChainCraftGame.sol/ChainCraftGame.json");
    const registryArtifact = require("../artifacts/src/ChainCraftRegistry.sol/ChainCraftRegistry.json");

    const contractsConfig = {
        chainId: Number(network.chainId),
        ChainCraftGame: {
            address: gameAddress,
            abi: gameArtifact.abi,
        },
        ChainCraftRegistry: {
            address: registryAddress,
            abi: registryArtifact.abi,
        },
    };

    const configJson = JSON.stringify(contractsConfig, null, 2);
    fs.writeFileSync(path.join(frontendOut, "addresses.json"), configJson);
    fs.writeFileSync(path.join(backendOut, "addresses.json"), configJson);

    console.log("📦 ABIs copied to frontend and backend\n");

    console.log("═".repeat(60));
    console.log("🎉 ChainCraft deployment complete!");
    console.log("═".repeat(60));
    console.log(`Registry:  ${registryAddress}`);
    console.log(`Game NFT:  ${gameAddress}`);
    console.log(`Explorer:  https://testnet.monadexplorer.com/address/${gameAddress}`);
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
});
