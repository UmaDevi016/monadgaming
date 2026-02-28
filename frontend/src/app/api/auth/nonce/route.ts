import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

export async function POST(req: NextRequest) {
    const { address } = await req.json();
    if (!address || !ethers.isAddress(address)) {
        return NextResponse.json(
            { error: "Valid Ethereum address required" },
            { status: 400 }
        );
    }

    const nonce = `ChainCraft Login\nAddress: ${address}\nNonce: ${Date.now()}\nSigned at: ${new Date().toISOString()}`;
    return NextResponse.json({ nonce });
}
