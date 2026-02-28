import { NextRequest, NextResponse } from "next/server";
import { getSessionsByCreator } from "@/lib/server/store";

export async function GET(
    _req: NextRequest,
    { params }: { params: { address: string } }
) {
    const sessions = getSessionsByCreator(params.address);
    return NextResponse.json(sessions);
}
