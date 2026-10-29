import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { HOMEPAGE_ADMIN_ROLES, normalizeHomepageSection, sectionPayload, validateHomepageInput } from "@/lib/admin/homepage";
import { publishHomepage } from "@/lib/admin/homepage-publication";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

async function ensureDraft(id: string) {
  const db = getAdminDb();
  const draftRef = db.collection("homepage_drafts").doc(id);
  const existing = await draftRef.get();
  if (existing.exists) return { ref: draftRef, data: existing.data()! };
  const publishedRef = db.collection("homepage_sections").doc(id);
  const published = await publishedRef.get();
  if (!published.exists) return null;
  const data = { ...published.data(), status: "draft", scheduledAt: null, updatedAt: FieldValue.serverTimestamp() };
  await draftRef.set(data);
  return { ref: draftRef, data };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const caller = await requireAdmin(request, [...HOMEPAGE_ADMIN_ROLES]);
    const { sectionId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || "save");
    const db = getAdminDb();
    const draft = await ensureDraft(sectionId);
    if (!draft) return NextResponse.json({ error: "Homepage section not found." }, { status: 404 });

    if (action === "publish") {
      const current = normalizeHomepageSection(sectionId, draft.data);
      await publishHomepage({action:"publish",sectionId,section:current,expectedVersion:typeof body.expectedVersion==="number"?body.expectedVersion:undefined,actorUid:caller.uid});
      await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_PUBLISHED", entityType: "homepage_section", entityId: sectionId, summary: `Published homepage section ${current.title || sectionId}` });
      return NextResponse.json({ ok: true, section: normalizeHomepageSection(sectionId, { ...current, status: "published", scheduledAt: null }) });
    }

    if (action === "unpublish") {
      await publishHomepage({action:"unpublish",sectionId,expectedVersion:typeof body.expectedVersion==="number"?body.expectedVersion:undefined,actorUid:caller.uid});
      await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_UNPUBLISHED", entityType: "homepage_section", entityId: sectionId, summary: `Unpublished homepage section ${sectionId}` });
      return NextResponse.json({ ok: true });
    }

    if (action === "schedule") {
      const scheduledAt = String(body.scheduledAt || "");
      const date = new Date(scheduledAt);
      if (!scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return NextResponse.json({ error: "Choose a future publish date and time." }, { status: 400 });
      const current = normalizeHomepageSection(sectionId, draft.data);
      await draft.ref.set({ ...sectionPayload(current), status: "scheduled", scheduledAt: date.toISOString(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_SCHEDULED", entityType: "homepage_section", entityId: sectionId, summary: `Scheduled homepage section ${current.title || sectionId}`, metadata: { scheduledAt: date.toISOString() } });
      return NextResponse.json({ ok: true, section: normalizeHomepageSection(sectionId, { ...current, status: "scheduled", scheduledAt: date.toISOString() }) });
    }

    const validation = validateHomepageInput(body);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    const current = normalizeHomepageSection(sectionId, draft.data);
    const update = { ...sectionPayload({ ...current, ...body }), status: "draft", scheduledAt: null, updatedAt: FieldValue.serverTimestamp() };
    await draft.ref.set(update, { merge: true });
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_DRAFT_SAVED", entityType: "homepage_section", entityId: sectionId, summary: `Saved homepage draft ${String(update.title || sectionId)}` });
    return NextResponse.json({ ok: true, section: normalizeHomepageSection(sectionId, { ...update, scheduledAt: null }) });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  try {
    const caller = await requireAdmin(request, [...HOMEPAGE_ADMIN_ROLES]);
    const { sectionId } = await params;
    const db = getAdminDb();
    const [draft, published] = await Promise.all([db.collection("homepage_drafts").doc(sectionId).get(), db.collection("homepage_sections").doc(sectionId).get()]);
    if (!draft.exists && !published.exists) return NextResponse.json({ error: "Homepage section not found." }, { status: 404 });
    await publishHomepage({action:"delete",sectionId,actorUid:caller.uid});
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "HOMEPAGE_UNPUBLISHED", entityType: "homepage_section", entityId: sectionId, summary: `Deleted homepage section ${sectionId}` });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
