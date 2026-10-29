import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizeHomepageSection } from "@/lib/admin/homepage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await getAdminDb().collection("homepage_sections").where("isActive", "==", true).get();
    const sections = snap.docs
      .map((doc) => normalizeHomepageSection(doc.id, doc.data()))
      .filter((section) => section.status === "published")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ sections: [] }, { status: 200 });
  }
}
