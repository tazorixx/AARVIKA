import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { AdminRole } from "@/lib/firebase-admin";

export type AdminAuditAction =
  | "ADMIN_CREATED"
  | "ADMIN_UPDATED"
  | "ADMIN_ROLE_CHANGED"
  | "ADMIN_ENABLED"
  | "ADMIN_DISABLED"
  | "DELIVERY_ZONE_CREATED"
  | "DELIVERY_ZONE_UPDATED"
  | "DELIVERY_ZONE_DELETED"
  | "PAYMENT_RECONCILED"
  | "PAYMENT_REFUND_MARKED"
  | "ABANDONED_CART_UPDATED"
  | "HOMEPAGE_DRAFT_SAVED"
  | "HOMEPAGE_PUBLISHED"
  | "HOMEPAGE_UNPUBLISHED"
  | "HOMEPAGE_SCHEDULED";

export type AdminAuditInput = {
  actorUid: string;
  actorRole: AdminRole;
  action: AdminAuditAction;
  entityType: "admin_user" | "admin_access" | "delivery_zone" | "payment" | "abandoned_cart" | "homepage_section";
  entityId: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export function buildAdminAuditEntry(input: AdminAuditInput) {
  return {
    actorUid: input.actorUid,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata ?? {},
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function recordAdminAudit(
  db: Firestore,
  input: AdminAuditInput,
): Promise<void> {
  try {
    await db.collection("admin_audit_logs").add(buildAdminAuditEntry(input));
  } catch (error) {
    // Audit logging must never make the protected business operation fail.
    console.error("Admin audit log failed", error);
  }
}

export function serializeAuditValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === "function") {
      const date = toDate();
      return date instanceof Date ? date.toISOString() : String(date);
    }
  }
  return String(value);
}
