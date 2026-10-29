import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb, updateProduct } from "@/lib/catalog/server";
import { parseProductInput } from "@/lib/catalog/validation";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); const snap = await getAdminDb().collection("products").doc((await params).id).get(); if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 }); return NextResponse.json({ id: snap.id, ...snap.data() }); } catch (e) { return errorResponse(e); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); await updateProduct((await params).id, parseProductInput(await request.json())); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
