import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { ethers } from "ethers";

const JWT_SECRET = process.env.JWT_SECRET || "chaincraft-dev-secret";

export async function POST(req: NextRequest) {
    try {
        const { address, signature, nonce } = await req.json();

        if (!address || !signature || !nonce) {
            return NextResponse.json(
                { error: "address, signature, and nonce required" },
                { status: 400 }
            );
        }

        const recovered = ethers.verifyMessage(nonce, signature);

        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json(
                { error: "Signature verification failed" },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            { address, iat: Date.now() },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return NextResponse.json({
            token,
            address,
            expiresIn: "7d",
        });
    } catch (err) {
        console.error("Auth verify error:", err);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 401 }
        );
    }
}
