"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import AccountShell from "@/components/account/AccountShell";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import AccountCard from "@/components/account/AccountCard";

type TicketMessage = {
  id: string;
  senderId: string;
  senderRole: "customer" | "admin";
  message: string;
  createdAt: string | null;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  orderId?: string | null;
  messages: TicketMessage[];
  createdAt: string | null;
  updatedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function SupportTicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const { user, loading: authLoading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const loadTicket = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/support/tickets/${params.ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to load this ticket.");
      }
      const data = (await response.json()) as { ticket: Ticket };
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) void Promise.resolve().then(() => loadTicket());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, params.ticketId]);

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!reply.trim() || !auth.currentUser) return;
    setSending(true);
    setError("");
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/support/tickets/${params.ticketId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to send your reply.");
      }
      setReply("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send your reply.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AccountShell
      header={
        <AccountPageHeader
          eyebrow="Support Ticket"
          title={ticket?.subject || "Support Ticket"}
          description={
            ticket
              ? `${STATUS_LABEL[ticket.status] || ticket.status} · ${ticket.priority} priority${ticket.orderId ? ` · Order ${ticket.orderId}` : ""}`
              : "View your support request and continue the conversation."
          }
        />
      }
    >
      <div className="mb-4">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f628f] hover:text-[#214c72]"
          >
            <ArrowLeft size={15} /> Back to Support
          </Link>
        </div>

        {loading || authLoading ? (
          <div className="flex items-center justify-center py-20 text-[#2f628f]">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : !ticket ? (
          <AccountCard>
            <p className="text-sm text-[#667085]">{error || "Ticket not found."}</p>
          </AccountCard>
        ) : (
          <>
            <AccountCard>
              <div className="space-y-4">
                {ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      msg.senderRole === "customer"
                        ? "ml-auto bg-[#d92f66] text-white"
                        : "bg-[#f5fbff] text-[#214c72]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p
                      className={`mt-1.5 text-[11px] font-semibold ${
                        msg.senderRole === "customer" ? "text-white/70" : "text-[#94a3b8]"
                      }`}
                    >
                      {msg.senderRole === "customer" ? "You" : "Gift4U Support"} ·{" "}
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              {ticket.status === "closed" ? (
                <p className="mt-6 rounded-2xl bg-[#f5fbff] px-4 py-3 text-sm text-[#667085]">
                  This ticket is closed. Sending a new message will reopen it.
                </p>
              ) : null}

              <form onSubmit={handleReply} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  maxLength={5000}
                  className="w-full flex-1 resize-none rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 text-sm outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d92f66] px-6 py-3.5 text-sm font-extrabold text-white disabled:opacity-50"
                >
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Send
                </button>
              </form>

              {error ? <p className="mt-3 text-sm text-[#bd1d52]">{error}</p> : null}
            </AccountCard>
          </>
        )}
    </AccountShell>
  );
}
