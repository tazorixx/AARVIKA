import { NextResponse } from "next/server";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { setInventory } from "@/lib/catalog/server";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{productId:string}>}) {
  try {
    const caller=await requireAdmin(request,["SUPER_ADMIN","ADMIN","CATALOG_MANAGER"]);
    const body=await request.json();
    await setInventory((await params).productId,{quantity:Number(body.quantity),skuId:body.skuId,revision:body.revision,reason:body.reason},caller.uid);
    return NextResponse.json({ok:true});
  }catch(error){return errorResponse(error);}
}
