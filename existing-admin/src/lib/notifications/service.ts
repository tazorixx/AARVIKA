import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebase-admin";
import { sendTransactionalEmail } from "@/lib/notifications/email";
import { sendExpoPushToUser } from "@/lib/notifications/push";
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  isNotificationTemplateKey,
  normalizeNotificationTemplate,
  renderNotificationTemplate,
  type NotificationTemplate,
  type NotificationTemplateKey,
} from "@/lib/notifications/templates";

export type NotificationType = NotificationTemplateKey;
export type NotificationValues = Record<string, string>;

type NotificationReference = {
  orderId?: string;
  ticketId?: string;
  route?: string;
  notificationId?: string;
};

export async function getNotificationTemplate(db: Firestore, id: NotificationTemplateKey): Promise<NotificationTemplate> {
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES.find((template) => template.id === id);
  if (!fallback) throw new Error(`Unknown notification template: ${id}`);

  const snap = await db.collection("notification_templates").doc(id).get();
  return snap.exists ? normalizeNotificationTemplate(snap.data(), fallback) : fallback;
}

function safePushCopy(type: NotificationType, values: NotificationValues) {
  const orderId = values.orderId || "your order";
  const ticketId = values.ticketId || "your request";
  switch (type) {
    case "order_confirmed":
      return { title: "Order confirmed", body: `Gift4U order ${orderId} is confirmed.` };
    case "payment_failed":
      return { title: "Payment needs attention", body: `Payment for Gift4U order ${orderId} needs attention.` };
    case "order_shipped":
      return { title: "Your gift is on the way", body: `Gift4U order ${orderId} has shipped. Tap to view tracking.` };
    case "order_out_for_delivery":
      return { title: "Out for delivery", body: `Gift4U order ${orderId} is out for delivery.` };
    case "order_delivered":
      return { title: "Gift delivered", body: `Gift4U order ${orderId} has been marked delivered.` };
    case "support_reply":
      return { title: "Gift4U Support replied", body: `You have a new reply on support request ${ticketId}.` };
  }
}

function buildRoute(reference: NotificationReference) {
  if (reference.route) return reference.route;
  if (reference.orderId) return `/orders/${encodeURIComponent(reference.orderId)}`;
  if (reference.ticketId) return `/support/${encodeURIComponent(reference.ticketId)}`;
  return "/(tabs)/account";
}

export async function enqueueNotification({
  db,
  type,
  userId,
  orderId,
  ticketId,
  route,
  notificationId: requestedNotificationId,
  values,
}: {
  db: Firestore;
  type: NotificationType;
  userId: string;
  values: NotificationValues;
} & NotificationReference): Promise<{ created: boolean; notificationId: string }> {
  if (!isNotificationTemplateKey(type)) throw new Error("Invalid notification type.");

  const template = await getNotificationTemplate(db, type);
  const referenceId = orderId || ticketId || userId;
  const notificationId = requestedNotificationId || `${type}_${referenceId}`;
  if (!template.isActive) return { created: false, notificationId };

  const ref = db.collection("notifications").doc(notificationId);
  const existing = await ref.get();
  if (existing.exists) return { created: false, notificationId };

  const user = await getAdminAuth().getUser(userId);
  if (!user.email) return { created: false, notificationId };

  const pushCopy = safePushCopy(type, values);
  const pushRoute = buildRoute({ orderId, ticketId, route });
  const pushData: Record<string, string> = { type, url: pushRoute };
  if (orderId) pushData.orderId = orderId;
  if (ticketId) pushData.ticketId = ticketId;

  await ref.create({
    id: notificationId,
    type,
    userId,
    orderId: orderId || null,
    ticketId: ticketId || null,
    route: pushRoute,
    to: { email: user.email, name: user.displayName || values.customerName || "Gift4U customer" },
    subject: renderNotificationTemplate(template.subject, values),
    textContent: renderNotificationTemplate(template.body, values),
    push: {
      status: "queued",
      attempts: 0,
      title: pushCopy.title,
      body: pushCopy.body,
      data: pushData,
    },
    status: "queued",
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { created: true, notificationId };
}

async function processQueuedPushNotifications(db: Firestore, limit: number) {
  const snapshot = await db.collection("notifications")
    .where("push.status", "==", "queued")
    .limit(Math.max(1, Math.min(limit, 100)))
    .get();

  let pushSent = 0;
  let pushFailed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const push = (data.push || {}) as Record<string, unknown>;
    const attempts = Number(push.attempts || 0);
    if (attempts >= 3) {
      await doc.ref.update({
        "push.status": "failed",
        "push.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      continue;
    }

    try {
      const result = await sendExpoPushToUser({
        db,
        userId: String(data.userId || ""),
        title: String(push.title || "Gift4U update"),
        body: String(push.body || "Open Gift4U to view this update."),
        data: push.data && typeof push.data === "object" ? push.data as Record<string, string> : {},
      });

      const terminalStatus = result.sent === 0 && result.failed === 0
        ? "no_devices"
        : result.failed > 0
          ? "partial"
          : "sent";

      await doc.ref.update({
        "push.status": terminalStatus,
        "push.attempts": attempts + 1,
        "push.sent": result.sent,
        "push.failed": result.failed,
        "push.invalidRemoved": result.invalidRemoved,
        "push.sentAt": FieldValue.serverTimestamp(),
        "push.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (result.sent > 0) pushSent += result.sent;
      if (result.failed > 0) pushFailed += result.failed;
    } catch (error) {
      const nextAttempts = attempts + 1;
      await doc.ref.update({
        "push.status": nextAttempts >= 3 ? "failed" : "queued",
        "push.attempts": nextAttempts,
        "push.lastError": error instanceof Error ? error.message : "Push delivery failed.",
        "push.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      pushFailed += 1;
    }
  }

  return { pushSent, pushFailed };
}

export async function processQueuedNotifications(
  db: Firestore,
  limit = 25,
): Promise<{ sent: number; failed: number; pushSent: number; pushFailed: number }> {
  const pushResult = await processQueuedPushNotifications(db, limit);
  const snapshot = await db.collection("notifications")
    .where("status", "==", "queued")
    .limit(Math.max(1, Math.min(limit, 100)))
    .get();
  let sent = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const attempts = Number(data.attempts || 0);

    if (attempts >= 3) continue;

    try {
      const result = await sendTransactionalEmail({
        to: {
          email: String(data.to?.email || ""),
          name: typeof data.to?.name === "string" ? data.to.name : undefined,
        },
        subject: String(data.subject || "Gift4U notification"),
        textContent: String(data.textContent || ""),
      });

      await doc.ref.update({
        status: "sent",
        provider: result.provider,
        providerMessageId: result.messageId,
        attempts: attempts + 1,
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      sent += 1;
    } catch (error) {
      await doc.ref.update({
        status: attempts + 1 >= 3 ? "failed" : "queued",
        attempts: attempts + 1,
        lastError: error instanceof Error ? error.message : "Email delivery failed.",
        updatedAt: FieldValue.serverTimestamp(),
      });
      failed += 1;
    }
  }

  return { sent, failed, ...pushResult };
}
