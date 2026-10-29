import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { HOMEPAGE_ADMIN_ROLES, normalizeHomepageSection, sectionPayload, validateHomepageInput } from "@/lib/admin/homepage";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...HOMEPAGE_ADMIN_ROLES]);
    const db = getAdminDb();
    const [publishedSnap, draftSnap] = await Promise.all([
      db.collection("homepage_sections").orderBy("sortOrder", "asc").get(),
      db.collection("homepage_drafts").orderBy("sortOrder", "asc").limit(500).get(),
    ]);
    const published = new Map(publishedSnap.docs.map((doc) => [doc.id, normalizeHomepageSection(doc.id, doc.data())]));
    const drafts = draftSnap.docs.map((doc) => normalizeHomepageSection(doc.id, doc.data()));
    const merged = new Map(published);
    for (const draft of drafts) merged.set(draft.id, draft);
    return NextResponse.json({ sections: [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder), drafts: drafts.length });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin(request, [...HOMEPAGE_ADMIN_ROLES]);
    const body = await request.json() as Record<string, unknown>;
    const validation = validateHomepageInput(body);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    const db = getAdminDb();
    const ref = db.collection("homepage_drafts").doc();
    const payload = sectionPayload(body);
    await ref.set({ ...payload, status: "draft", scheduledAt: null, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_DRAFT_SAVED", entityType: "homepage_section", entityId: ref.id, summary: `Created homepage draft ${payload.title || ref.id}` });
    return NextResponse.json({ section: normalizeHomepageSection(ref.id, { ...payload, status: "draft", scheduledAt: null }) }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
