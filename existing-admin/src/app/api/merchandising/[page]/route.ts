import { NextResponse } from "next/server";
import { getMerchandising, serializeMerchandising } from "@/lib/merchandising/server";
import type { MerchandisingPage } from "@/lib/merchandising/types";
export const runtime = "nodejs";
const PAGES: MerchandisingPage[] = ["wedding", "birthday", "anniversary", "hampers", "personalised", "lifestyle"];
export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) { const { page: raw } = await params; if (!PAGES.includes(raw as MerchandisingPage)) return NextResponse.json({ error: "Not found." }, { status: 404 }); const response = NextResponse.json(serializeMerchandising(await getMerchandising(raw as MerchandisingPage))); response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300"); return response; }
