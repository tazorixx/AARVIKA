export const SUPPORT_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT"] as const;
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";
export type SupportMessage = { id: string; senderId: string; senderRole: "customer" | "admin"; message: string; createdAt?: unknown };
export type SupportTicket = { id: string; userId: string; userName: string; userEmail: string; orderId: string; subject: string; message: string; status: TicketStatus; priority: TicketPriority; messages: SupportMessage[]; createdAt?: unknown; updatedAt?: unknown };
const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high"];
export function normalizeTicketStatus(value: unknown): TicketStatus { return STATUSES.includes(value as TicketStatus) ? value as TicketStatus : "open"; }
export function normalizeTicketPriority(value: unknown): TicketPriority { return PRIORITIES.includes(value as TicketPriority) ? value as TicketPriority : "medium"; }
export function validateTicketCreate(body: Record<string, unknown>) {
  const subject = String(body.subject || "").trim(); const message = String(body.message || "").trim(); const orderId = String(body.orderId || "").trim(); const priority = normalizeTicketPriority(body.priority);
  if (subject.length < 3 || subject.length > 120) return { valid: false as const, error: "Subject must be between 3 and 120 characters." };
  if (message.length < 5 || message.length > 5000) return { valid: false as const, error: "Message must be between 5 and 5000 characters." };
  if (body.priority !== undefined && !PRIORITIES.includes(String(body.priority) as TicketPriority)) return { valid: false as const, error: "Invalid ticket priority." };
  if (orderId.length > 100) return { valid: false as const, error: "Invalid order ID." };
  return { valid: true as const, subject, message, orderId, priority };
}
export function validateTicketUpdate(body: Record<string, unknown>) {
  const hasStatus = body.status !== undefined; const hasPriority = body.priority !== undefined; const reply = body.reply === undefined ? "" : String(body.reply).trim();
  if (!hasStatus && !hasPriority && !reply) return { valid: false as const, error: "Provide a status, priority, or reply." };
  if (hasStatus && !STATUSES.includes(String(body.status) as TicketStatus)) return { valid: false as const, error: "Invalid ticket status." };
  if (hasPriority && !PRIORITIES.includes(String(body.priority) as TicketPriority)) return { valid: false as const, error: "Invalid ticket priority." };
  if (reply && (reply.length < 2 || reply.length > 5000)) return { valid: false as const, error: "Reply must be between 2 and 5000 characters." };
  return { valid: true as const, status: hasStatus ? String(body.status) as TicketStatus : undefined, priority: hasPriority ? String(body.priority) as TicketPriority : undefined, reply };
}
