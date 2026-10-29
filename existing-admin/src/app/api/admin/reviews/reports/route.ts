import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin,errorResponse } from "@/lib/catalog/http";
import { REVIEW_ADMIN_ROLES } from "@/lib/admin/reviews";
export const runtime="nodejs";
export async function GET(request:Request){try{await requireAdmin(request,[...REVIEW_ADMIN_ROLES]);const db=getAdminDb();const snap=await db.collection("review_reports").orderBy("createdAt","desc").limit(100).get();const reports=snap.docs.map(d=>({id:d.id,...d.data()}));return NextResponse.json({reports});}catch(e){return errorResponse(e);}}
