import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  normalizeNotificationTemplate,
  type NotificationTemplate,
  type NotificationTemplateKey,
  validateNotificationTemplateInput,
} from "@/lib/notifications/templates";

export const NOTIFICATION_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

export type NotificationLogStatus = "queued" | "sent" | "failed";

export type NotificationLog = {
  id: string;
  type: string;
  userId: string;
  orderId: string;
  to: { email: string; name?: string };
  subject: string;
  status: NotificationLogStatus;
  attempts: number;
  provider?: string;
  providerMessageId?: string;
  lastError?: string;
  createdAt: string | null;
  updatedAt: string | null;
  sentAt: string | null;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const date = (value as { toDate?: () => Date }).toDate?.();
    return date instanceof Date ? date.toISOString() : null;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

export async function listNotificationTemplates(db: Firestore): Promise<NotificationTemplate[]> {
  const result: NotificationTemplate[] = [];
  for (const fallback of DEFAULT_NOTIFICATION_TEMPLATES) {
    const snap = await db.collection("notification_templates").doc(fallback.id).get();
    result.push(snap.exists ? normalizeNotificationTemplate(snap.data(), fallback) : fallback);
  }
  return result;
}

export async function updateNotificationTemplate(
  db: Firestore,
  id: NotificationTemplateKey,
  input: unknown,
): Promise<NotificationTemplate> {
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES.find((template) => template.id === id);
  if (!fallback) throw new Error("Not found.");

  const validation = validateNotificationTemplateInput(input, fallback);
  if (!validation.ok) throw new Error(validation.error);

  const template = validation.value;

  await db.collection("notification_templates").doc(id).set(
    {
      ...template,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return template;
}

export async function listRecentNotificationLogs(
  db: Firestore,
  limit = 100,
): Promise<NotificationLog[]> {
  const snapshot = await db.collection("notifications").limit(Math.max(1, Math.min(limit, 200))).get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const rawStatus = String(data.status || "queued");
      const status: NotificationLogStatus =
        rawStatus === "sent" || rawStatus === "failed" ? rawStatus : "queued";

      return {
        id: doc.id,
        type: String(data.type || "unknown"),
        userId: String(data.userId || ""),
        orderId: String(data.orderId || ""),
        to: {
          email: String(data.to?.email || ""),
          name: typeof data.to?.name === "string" ? data.to.name : undefined,
        },
        subject: String(data.subject || ""),
        status,
        attempts: Number(data.attempts || 0),
        provider: typeof data.provider === "string" ? data.provider : undefined,
        providerMessageId:
          typeof data.providerMessageId === "string" ? data.providerMessageId : undefined,
        lastError: typeof data.lastError === "string" ? data.lastError : undefined,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        sentAt: toIso(data.sentAt),
      } satisfies NotificationLog;
    })
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}
