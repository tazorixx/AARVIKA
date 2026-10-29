import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb, softDeleteTaxonomy, updateTaxonomy } from "@/lib/catalog/server";
import { parseTaxonomyInput } from "@/lib/catalog/validation";
export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); await updateTaxonomy("recipients", (await params).id, parseTaxonomyInput(await request.json())); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); await softDeleteTaxonomy("recipients", (await params).id); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); const snap = await getAdminDb().collection("recipients").doc((await params).id).get(); if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 }); return NextResponse.json({ id: snap.id, ...snap.data() }); } catch (e) { return errorResponse(e); } }
