import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSession, updateSession } from "@/lib/server/store";
import { generateNFTMetadata } from "@/lib/server/aiService";

async function mintGameNFT(params: {
    creatorAddress: string;
    tokenURI: string;
    name: string;
    genre: string;
    description: string;
    maxPlayers: number;
}) {
    // Try real on-chain minting if DEPLOYER_PRIVATE_KEY is configured
    if (process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.length > 10) {
        try {
            const { ethers } = await import("ethers");
            const provider = new ethers.JsonRpcProvider(
                process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"
            );
            const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
            // Real minting would happen here with the contract
            // For now fall through to demo if contract not configured
            console.log("Wallet ready:", await wallet.getAddress());
        } catch (e) {
            console.warn("On-chain minting failed, using demo mode:", e);
        }
    }

    // Demo fallback
    return {
        txHash: `0x${uuidv4().replace(/-/g, "")}`,
        tokenId: Math.floor(Math.random() * 10000) + 1,
        contractAddress: "0x0000000000000000000000000000000000000000",
        explorerUrl: `https://testnet.monadexplorer.com/tx/demo`,
        demo: true,
    };
}

export async function POST(req: NextRequest) {
    try {
        const { sessionId, walletAddress } = await req.json();

        if (!sessionId || !walletAddress) {
            return NextResponse.json({ error: "sessionId and walletAddress required" }, { status: 400 });
        }

        const session = getSession(sessionId);
        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (!session.generatedCode) {
            return NextResponse.json({ error: "No game code generated yet" }, { status: 400 });
        }

        if (session.isDeployed) {
            return NextResponse.json({
                alreadyDeployed: true,
                tokenId: session.tokenId,
                contractAddress: session.contractAddress,
            });
        }

        const metadata = generateNFTMetadata(
            {
                name: session.name,
                genre: session.genre,
                description: session.description,
                maxPlayers: session.maxPlayers,
            },
            sessionId,
            walletAddress
        );

        const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;

        const mintResult = await mintGameNFT({
            creatorAddress: walletAddress,
            tokenURI,
            name: session.name,
            genre: session.genre,
            description: session.description,
            maxPlayers: session.maxPlayers,
        });

        updateSession(sessionId, {
            isDeployed: true,
            contractAddress: mintResult.contractAddress,
            tokenId: mintResult.tokenId,
            txHash: mintResult.txHash,
        });

        return NextResponse.json({ success: true, ...mintResult, metadata });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Mint error:", err);
        return NextResponse.json({ error: "Minting failed", details: message }, { status: 500 });
    }
}
