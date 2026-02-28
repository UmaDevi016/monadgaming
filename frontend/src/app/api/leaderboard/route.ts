import { NextResponse } from "next/server";
import { getTopScores } from "@/lib/server/store";

export async function GET() {
    const scores = getTopScores(50);
    return NextResponse.json(scores);
}
