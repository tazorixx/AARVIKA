import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { createMerchandisingItem, getAnniversaryMerchandising, normalizeMerchandisingItemInput, serializeMerchandising } from "@/lib/merchandising/server";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireCatalogAdmin(request); const data = await getAnniversaryMerchandising(); return NextResponse.json({ items: serializeMerchandising(data.items) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { await requireCatalogAdmin(request); const data = normalizeMerchandisingItemInput("anniversary", (await request.json()) as Record<string, unknown>); const id = await createMerchandisingItem("anniversary", data); return NextResponse.json({ id, item: { id, ...data } }, { status: 201 }); } catch (error) { return errorResponse(error); } }
