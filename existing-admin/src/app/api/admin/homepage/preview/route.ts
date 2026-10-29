import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { HOMEPAGE_ADMIN_ROLES, normalizeHomepageSection } from "@/lib/admin/homepage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...HOMEPAGE_ADMIN_ROLES]);
    const db = getAdminDb();
    const [publishedSnap, draftSnap] = await Promise.all([
      db.collection("homepage_sections").orderBy("sortOrder", "asc").get(),
      db.collection("homepage_drafts").orderBy("sortOrder", "asc").limit(500).get(),
    ]);
    const merged = new Map(publishedSnap.docs.map((doc) => [doc.id, normalizeHomepageSection(doc.id, doc.data())]));
    for (const doc of draftSnap.docs) merged.set(doc.id, normalizeHomepageSection(doc.id, doc.data()));
    return NextResponse.json({ sections: [...merged.values()].filter((section) => section.isActive).sort((a, b) => a.sortOrder - b.sortOrder) });
  } catch (error) { return errorResponse(error); }
}
