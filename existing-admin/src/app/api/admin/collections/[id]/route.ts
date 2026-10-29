import {updateVisual} from '@/lib/catalog/visual-publication';
import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb, softDeleteTaxonomy, updateTaxonomy } from "@/lib/catalog/server";
import { parseTaxonomyInput } from "@/lib/catalog/validation";
export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const caller=await requireCatalogAdmin(request);const input=await request.json();if(input.visualAction){const result=await updateVisual('collections',(await params).id,input,caller.uid);return NextResponse.json({ok:true,...result});} await updateTaxonomy("collections", (await params).id, parseTaxonomyInput(input)); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); await softDeleteTaxonomy("collections", (await params).id); return NextResponse.json({ ok: true }); } catch (e) { return errorResponse(e); } }
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { await requireCatalogAdmin(request); const snap = await getAdminDb().collection("collections").doc((await params).id).get(); if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 }); return NextResponse.json({ id: snap.id, ...snap.data() }); } catch (e) { return errorResponse(e); } }
