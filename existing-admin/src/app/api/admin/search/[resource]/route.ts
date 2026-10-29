import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";

export const runtime = "nodejs";
const ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"] as const;

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  try {
    await requireAdmin(request, [...ROLES]);
    const { resource } = await context.params;
    const body = await request.json() as { id?: string; type?: string };
    const id = String(body.id || "").trim();
    const type = String(body.type || resource).trim();
    const collections: Record<string, string> = { synonym: "search_synonyms", redirect: "search_redirects", pin: "search_pins" };
    const collection = collections[type];
    if (!collection || !id) throw new Error("Invalid search item.");
    await getAdminDb().collection(collection).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
