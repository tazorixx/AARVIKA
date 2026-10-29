import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { archiveMerchandisingItem, normalizeMerchandisingItemInput, serializeMerchandising, updateMerchandisingItem } from "@/lib/merchandising/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { MerchandisingPage } from "@/lib/merchandising/types";
export const runtime = "nodejs";
const PAGES: MerchandisingPage[] = ["wedding", "birthday", "anniversary", "hampers", "personalised", "clothing", "stationery", "furniture", "lifestyle"];
function pageOf(value: string): MerchandisingPage { if (!PAGES.includes(value as MerchandisingPage)) throw new Error("Invalid merchandising page."); return value as MerchandisingPage; }
export async function GET(request: Request, { params }: { params: Promise<{ page: string; id: string }> }) { try { await requireCatalogAdmin(request); const { page: raw, id } = await params; const page = pageOf(raw); const snap = await getAdminDb().collection("merchandising_pages").doc(page).collection("items").doc(id).get(); if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 }); return NextResponse.json(serializeMerchandising({ id: snap.id, ...snap.data() })); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ page: string; id: string }> }) { try { await requireCatalogAdmin(request); const { page: raw, id } = await params; const page = pageOf(raw); const data = normalizeMerchandisingItemInput(page, (await request.json()) as Record<string, unknown>); await updateMerchandisingItem(page, id, data); return NextResponse.json({ ok: true, item: serializeMerchandising({ id, ...data }) }); } catch (error) { return errorResponse(error); } }
export async function DELETE(request: Request, { params }: { params: Promise<{ page: string; id: string }> }) { try { await requireCatalogAdmin(request); const { page: raw, id } = await params; await archiveMerchandisingItem(pageOf(raw), id); return NextResponse.json({ ok: true }); } catch (error) { return errorResponse(error); } }
