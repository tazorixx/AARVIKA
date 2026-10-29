import { NextResponse } from "next/server";
import { verifyBearerToken, isAdminRole } from "../firebase-admin";
import type { AdminRole } from "../firebase-admin";
export async function requireCatalogAdmin(request: Request){const caller=await verifyBearerToken(request);if(!caller.role||!isAdminRole(caller.role)||!["SUPER_ADMIN","ADMIN","CATALOG_MANAGER"].includes(caller.role))throw new Error("Forbidden");return caller;}
export async function requireAdmin(request: Request,roles:AdminRole[]){const caller=await verifyBearerToken(request);if(!caller.role||!roles.includes(caller.role))throw new Error("Forbidden");return caller;}
export function errorResponse(error:unknown){
  const message=error instanceof Error?error.message:"Request failed.";
  const code=error&&typeof error==="object"&&"code" in error?String(error.code):"";
  const authentication=message==="Missing bearer token."||code.startsWith("auth/");
  const status=message==="Forbidden"?403:authentication?401:message==="Not found."?404:400;
  return NextResponse.json({error:message},{status});
}
