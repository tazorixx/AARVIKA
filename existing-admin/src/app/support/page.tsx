"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, MessageCircle, Plus } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import AccountShell from "@/components/account/AccountShell";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import AccountCard from "@/components/account/AccountCard";
import AccountEmptyState from "@/components/account/AccountEmptyState";

type Ticket = { id: string; subject: string; message: string; status: string; priority: string; orderId?: string; createdAt?: string };
function date(v?: string) { return v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; }

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", orderId: "", priority: "medium" });

  const load = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/support/tickets", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load tickets.");
      setTickets(data.tickets || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load tickets.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!authLoading) { if (user) void Promise.resolve().then(() => load()); else Promise.resolve().then(() => setLoading(false)); } }, [authLoading, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/support/tickets", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create ticket.");
      setForm({ subject: "", message: "", orderId: "", priority: "medium" }); setOpen(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create ticket."); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <><Header /><main className="min-h-screen bg-[#fffafd] px-4 py-20 text-center"><Loader2 className="mx-auto animate-spin text-[#d92f66]" /></main><Footer /></>;
  if (!user) return <><Header /><main className="min-h-[60vh] bg-[#fffafd] px-4 py-16"><section className="mx-auto max-w-lg rounded-[16px] border border-[#e5edf4] bg-white p-8 text-center shadow-sm"><MessageCircle className="mx-auto text-[#2f628f]" size={34} /><h1 className="gift-heading mt-4 text-3xl font-bold text-[#214c72]">Customer Support</h1><p className="mt-2 text-sm text-slate-600">Sign in to create and track support requests.</p></section></main><Footer /></>;

  return (
    <AccountShell header={<AccountPageHeader eyebrow="Gift4U Help" title="Customer Support" description="Create a request and keep the conversation in one place." icon={<MessageCircle size={24} />} action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#bd1d52]"><Plus size={16} /> New ticket</button>} />}>
      {error && <div className="mt-5 rounded-[10px] border border-red-100 bg-red-50 p-4 text-sm text-[#bd1d52]">{error}</div>}
      {open && <AccountCard className="mt-5 p-5 sm:p-7"><form onSubmit={submit}><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#d92f66]">New request</p><h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72]">How can we help?</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><input required maxLength={120} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="rounded-[10px] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2f628f]" /><input value={form.orderId} onChange={e => setForm({ ...form, orderId: e.target.value })} placeholder="Order ID (optional)" className="rounded-[10px] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2f628f]" /></div><div className="mt-4"><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="rounded-[10px] border border-slate-200 px-4 py-3 text-sm"><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select></div><textarea required minLength={5} maxLength={5000} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" rows={5} className="mt-4 w-full rounded-[10px] border border-slate-200 p-4 text-sm outline-none focus:border-[#2f628f]" /><div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Sending…" : "Send request"}</button></div></form></AccountCard>}
      <div className="mt-5 space-y-4">{tickets.length === 0 ? <AccountCard className="p-5 sm:p-7"><AccountEmptyState icon={<MessageCircle size={28} />} title="No support tickets yet" description="Need help with an order or delivery? Create a support request and we’ll keep the conversation here." actions={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white"><Plus size={16} /> New ticket</button>} /></AccountCard> : tickets.map(t => <AccountCard key={t.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-400">{t.id} · {date(t.createdAt)}</p><h2 className="gift-heading mt-1 text-xl font-bold text-[#214c72]">{t.subject}</h2></div><div className="flex gap-2"><span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold text-[#214c72]">{t.priority}</span><span className="rounded-full bg-[#fff0f5] px-3 py-1 text-xs font-bold text-[#d92f66]">{t.status.replace("_", " ")}</span></div></div><p className="mt-3 text-sm leading-6 text-slate-600">{t.message}</p>{t.orderId && <p className="mt-3 text-xs font-semibold text-slate-500">Order: {t.orderId}</p>}</AccountCard>)}</div>
    </AccountShell>
  );
}
