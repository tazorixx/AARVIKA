import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { cronAuthorizationError } from "@/lib/cron/auth";
import { normalizeHomepageSection } from "@/lib/admin/homepage";
import { publishHomepage } from "@/lib/admin/homepage-publication";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authError = cronAuthorizationError(request);
  if (authError) return authError;
  const db = getAdminDb();
  const now = new Date();
  const snap = await db.collection("homepage_drafts").where("status", "==", "scheduled").limit(100).get();
  let published = 0, rejected = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const scheduledAt = new Date(String(data.scheduledAt || ""));
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() > now.getTime()) continue;
    try { await publishHomepage({action:"publish",sectionId:doc.id,section:normalizeHomepageSection(doc.id,data),actorUid:"isolated-scheduler"}); published += 1; } catch { rejected += 1; }
  }
  return NextResponse.json({ ok: true, published, rejected, checked: snap.size });
}
