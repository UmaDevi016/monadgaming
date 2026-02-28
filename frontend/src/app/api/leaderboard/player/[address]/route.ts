import { NextRequest, NextResponse } from "next/server";
import { getPlayerScore } from "@/lib/server/store";

export async function GET(
    _req: NextRequest,
    { params }: { params: { address: string } }
) {
    const data = getPlayerScore(params.address);
    return NextResponse.json(data);
}
