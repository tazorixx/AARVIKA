import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { enqueueNotification } from "@/lib/notifications/service";
import { SUPPORT_ADMIN_ROLES, validateTicketUpdate } from "@/lib/support/tickets";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const caller = await requireAdmin(request, [...SUPPORT_ADMIN_ROLES]);
    const { ticketId } = await params;
    if (!ticketId) return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });

    const body = await request.json() as Record<string, unknown>;
    const validation = validateTicketUpdate(body);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection("support_tickets").doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    const data = snap.data() || {};
    const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (validation.status) update.status = validation.status;
    if (validation.priority) update.priority = validation.priority;

    let replyMessageId: string | null = null;
    if (validation.reply) {
      const messages = Array.isArray(data.messages) ? [...data.messages] : [];
      replyMessageId = `${ticketId}-${messages.length + 1}`;
      messages.push({
        id: replyMessageId,
        senderId: caller.uid,
        senderRole: "admin",
        message: validation.reply,
        createdAt: new Date(),
      });
      update.messages = messages;
    }

    await ref.update(update);

    if (validation.reply && replyMessageId && typeof data.userId === "string" && data.userId) {
      try {
        await enqueueNotification({
          db,
          type: "support_reply",
          userId: data.userId,
          ticketId,
          notificationId: `support_reply_${replyMessageId}`,
          values: {
            ticketId,
            customerName: typeof data.userName === "string" && data.userName.trim()
              ? data.userName.trim()
              : "Gift4U customer",
          },
        });
      } catch (notificationError) {
        console.warn("Non-fatal: failed to queue support reply notification:", notificationError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
