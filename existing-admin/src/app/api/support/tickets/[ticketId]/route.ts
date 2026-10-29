import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function serialize(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { uid } = await verifyBearerToken(request);
    const { ticketId } = await params;
    if (!ticketId) return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });
    const db = getAdminDb();
    const snap = await db.collection("support_tickets").doc(ticketId).get();
    if (!snap.exists) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    const data = snap.data() || {};
    if (data.userId !== uid) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    return NextResponse.json({
      ticket: {
        id: snap.id,
        ...data,
        messages: Array.isArray(data.messages)
          ? data.messages.map((m: Record<string, unknown>) => ({ ...m, createdAt: serialize(m.createdAt) }))
          : [],
        createdAt: serialize(data.createdAt),
        updatedAt: serialize(data.updatedAt),
      },
    });
  } catch (error) {
    console.error("GET /api/support/tickets/[ticketId] failed:", error);
    return NextResponse.json({ error: "Unable to load support ticket." }, { status: 500 });
  }
}

// Customer reply to an existing ticket. Appends a message to the
// ticket's messages array with senderRole "customer" and, if the ticket
// was previously resolved/closed, reopens it since the customer has
// something new to say.
export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { uid } = await verifyBearerToken(request);
    const { ticketId } = await params;
    if (!ticketId) return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });

    const body = (await request.json()) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("support_tickets").doc(ticketId);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const data = snap.data() || {};
    if (data.userId !== uid) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const now = FieldValue.serverTimestamp();
    const reply = {
      id: `${ref.id}-${Date.now()}`,
      senderId: uid,
      senderRole: "customer" as const,
      message,
      createdAt: now,
    };

    const shouldReopen = data.status === "resolved" || data.status === "closed";

    await ref.update({
      messages: FieldValue.arrayUnion(reply),
      updatedAt: now,
      ...(shouldReopen ? { status: "open" } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/support/tickets/[ticketId] failed:", error);
    return NextResponse.json({ error: "Unable to send your reply." }, { status: 500 });
  }
}
