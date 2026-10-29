import { NextResponse } from "next/server";
import { getWeddingMerchandising, serializeMerchandising } from "@/lib/merchandising/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getWeddingMerchandising();
    return NextResponse.json(serializeMerchandising(data), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Wedding merchandising." },
      { status: 500 },
    );
  }
}
