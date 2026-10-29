import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin,errorResponse } from "@/lib/catalog/http";
import { REVIEW_ADMIN_ROLES } from "@/lib/admin/reviews";
export const runtime="nodejs";
export async function PATCH(request:Request,{params}:{params:Promise<{reportId:string}>}){try{await requireAdmin(request,[...REVIEW_ADMIN_ROLES]);const{reportId}=await params;const b=await request.json();const status=b.status==="resolved"||b.status==="dismissed"?b.status:"open";const db=getAdminDb();await db.collection("review_reports").doc(reportId).update({status,updatedAt:FieldValue.serverTimestamp()});return NextResponse.json({ok:true,status});}catch(e){return errorResponse(e);}}
