import { NextResponse } from "next/server";
import { createTaxonomy, getAdminDb } from "@/lib/catalog/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { parseTaxonomyInput } from "@/lib/catalog/validation";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireCatalogAdmin(request); const snap = await getAdminDb().collection("occasions").orderBy("sortOrder").get(); return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (e) { return errorResponse(e); } }
export async function POST(request: Request) { try { await requireCatalogAdmin(request); const id = await createTaxonomy("occasions", parseTaxonomyInput(await request.json())); return NextResponse.json({ id }, { status: 201 }); } catch (e) { return errorResponse(e); } }
