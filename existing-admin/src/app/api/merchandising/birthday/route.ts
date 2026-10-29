import { NextResponse } from "next/server";
import { getBirthdayMerchandising, serializeMerchandising } from "@/lib/merchandising/server";
export const runtime = "nodejs";
export async function GET() { try { return NextResponse.json(serializeMerchandising(await getBirthdayMerchandising()), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load Birthday merchandising." }, { status: 500 }); } }
