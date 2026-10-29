import { NextResponse } from "next/server";
import { createProduct, getAdminDb } from "@/lib/catalog/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { parseProductInput } from "@/lib/catalog/validation";
export const runtime = "nodejs";
export async function GET(request: Request) { try { await requireCatalogAdmin(request); const db=getAdminDb(), url=new URL(request.url);
    const snap=await db.collection("products").orderBy("updatedAt","desc").get();
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(url.searchParams.get("inventory")==="skus"){
      const skus=await db.collection("skus").get();
      return NextResponse.json(rows.map(p=>({...p,canonicalSkus:skus.docs.filter(d=>d.data().productId===p.id && d.data().active!==false).map(d=>({id:d.id,...d.data()}))})));
    }
    return NextResponse.json(rows); } catch (e) { return errorResponse(e); } }
export async function POST(request: Request) { try { await requireCatalogAdmin(request); const id = await createProduct(parseProductInput(await request.json())); return NextResponse.json({ id }, { status: 201 }); } catch (e) { return errorResponse(e); } }
