import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { SUPPORT_ADMIN_ROLES, normalizeTicketPriority, normalizeTicketStatus } from "@/lib/support/tickets";

function serialize(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
  return typeof value === "string" ? value : null;
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...SUPPORT_ADMIN_ROLES]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim();
    const priority = url.searchParams.get("priority")?.trim();
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const db = getAdminDb();
    let query = db.collection("support_tickets").limit(200);
    if (["open", "in_progress", "resolved", "closed"].includes(status || "")) query = db.collection("support_tickets").where("status", "==", status).limit(200);
    const snap = await query.get();
    let tickets = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: String(d.userId || ""),
        userName: String(d.userName || "Customer"),
        userEmail: String(d.userEmail || ""),
        orderId: String(d.orderId || ""),
        subject: String(d.subject || ""),
        message: String(d.message || ""),
        status: normalizeTicketStatus(d.status),
        priority: normalizeTicketPriority(d.priority),
        messages: Array.isArray(d.messages) ? d.messages.map((m: Record<string, unknown>) => ({ ...m, createdAt: serialize(m.createdAt) })) : [],
        createdAt: serialize(d.createdAt),
        updatedAt: serialize(d.updatedAt),
      };
    });
    if (["low", "medium", "high"].includes(priority || "")) tickets = tickets.filter((ticket) => ticket.priority === priority);
    if (q) tickets = tickets.filter((t) => [t.id, t.userId, t.userName, t.userEmail, t.orderId, t.subject, t.message].join(" ").toLowerCase().includes(q));
    tickets.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return NextResponse.json({ tickets });
  } catch (error) {
    return errorResponse(error);
  }
}
