import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { createMerchandisingItem, getBirthdayMerchandising, normalizeMerchandisingItemInput, serializeMerchandising } from "@/lib/merchandising/server";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireCatalogAdmin(request); const data = await getBirthdayMerchandising(); return NextResponse.json({ items: serializeMerchandising(data.items) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { await requireCatalogAdmin(request); const data = normalizeMerchandisingItemInput("birthday", (await request.json()) as Record<string, unknown>); const id = await createMerchandisingItem("birthday", data); return NextResponse.json({ id, item: { id, ...data } }, { status: 201 }); } catch (error) { return errorResponse(error); } }
