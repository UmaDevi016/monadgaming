import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        chainId: 10143,
        ChainCraftGame: process.env.CHAINCRAFT_GAME_ADDRESS || null,
        ChainCraftRegistry: process.env.CHAINCRAFT_REGISTRY_ADDRESS || null,
    });
}
