import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb } from "@/lib/firebase-admin";
import { listTaxonomyPageCms, normalizeTaxonomyPageCmsInput, saveTaxonomyPageCms, type MerchandisingCmsType } from "@/lib/merchandising/cms";
export const runtime = "nodejs";
function pageType(value: unknown): MerchandisingCmsType { if (value === "category" || value === "occasion") return value; throw new Error("Invalid taxonomy merchandising type."); }
export async function GET(request: Request) { try { await requireCatalogAdmin(request); const type = pageType(new URL(request.url).searchParams.get("type")); const [pages, taxonomies] = await Promise.all([listTaxonomyPageCms(type), getAdminDb().collection(type === "category" ? "categories" : "occasions").orderBy("sortOrder").get()]); return NextResponse.json({ pages, taxonomies: taxonomies.docs.map((doc) => ({ id: doc.id, ...doc.data() })) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { await requireCatalogAdmin(request); const body = (await request.json()) as Record<string, unknown>; const type = pageType(body.type); const id = await saveTaxonomyPageCms(type, normalizeTaxonomyPageCmsInput(type, body)); return NextResponse.json({ id }); } catch (error) { return errorResponse(error); } }
