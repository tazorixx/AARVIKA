"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, Search, ShoppingCart, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase";

type Cart = { id: string; customerEmail?: string; customerName?: string; items: Array<{ title?: string; productId?: string; qty?: number; priceAtAdd?: number }>; itemCount: number; subtotal: number; status: string; cartUpdatedAt?: string | null; abandonedAt?: string | null; recoveredOrderId?: string | null };
type Data = { carts: Cart[]; summary: { total: number; flagged: number; contacted: number; recovered: number; dismissed: number; value: number } };

async function request(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in.");
  const token = await user.getIdToken();
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
function when(value?: string | null) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

export default function AbandonedCartsPage() {
  const [data, setData] = useState<Data>({ carts: [], summary: { total: 0, flagged: 0, contacted: 0, recovered: 0, dismissed: 0, value: 0 } });
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() { const params = new URLSearchParams({ status }); if (query.trim()) params.set("q", query.trim()); setData(await request(`/api/admin/abandoned-carts?${params}`)); }
  useEffect(() => { Promise.resolve().then(() => load()).catch((e) => setError(e.message)); }, [status]);

  async function update(id: string, next: string) {
    setBusy(id); setError("");
    try { await request("/api/admin/abandoned-carts", { method: "PATCH", body: JSON.stringify({ id, status: next }) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update cart."); }
    finally { setBusy(""); }
  }

  const filtered = useMemo(() => data.carts.filter((cart) => !query.trim() || [cart.customerName, cart.customerEmail, cart.id].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase())), [data.carts, query]);

  return <main className="min-h-screen bg-[#fffafd]"><div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#62298E]">Sales & Fulfillment</p>
    <h1 className="gift-heading text-3xl font-bold text-[#3E155C]">Abandoned Carts</h1>
    <p className="mt-2 max-w-3xl text-sm text-slate-500">Carts with items that have been idle for more than 2 hours. This phase flags recovery opportunities; automated customer messaging remains opt-in.</p>
    {error && <div className="mt-5 rounded-xl border border-[#f0cbd7] bg-white p-4 text-sm text-[#bd1d52]">{error}</div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[['Flagged', data.summary.flagged], ['Contacted', data.summary.contacted], ['Recovered', data.summary.recovered], ['Dismissed', data.summary.dismissed], ['Open value', money(data.summary.value)]].map(([label, value]) => <div key={String(label)} className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-[#3E155C]">{value}</p></div>)}
    </div>
    <div className="mt-6 flex flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') void load()}} placeholder="Search customer or email" className="w-full rounded-[10px] border border-slate-200 py-2.5 pl-9 pr-3 text-sm"/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"><option value="all">All statuses</option><option value="flagged">Flagged</option><option value="contacted">Contacted</option><option value="recovered">Recovered</option><option value="dismissed">Dismissed</option></select>
      <button onClick={()=>void load()} className="rounded-full bg-[#3E155C] px-5 py-2.5 text-sm font-bold text-white">Refresh</button>
    </div>
    <section className="mt-5 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
      {filtered.length === 0 ? <div className="p-10 text-center text-sm text-slate-500"><ShoppingCart className="mx-auto mb-3 text-slate-300"/><p>No abandoned carts found.</p></div> : <div className="divide-y divide-slate-100">{filtered.map(cart => <div key={cart.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold text-[#3E155C]">{cart.customerName || "Customer"}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">{cart.status}</span></div><p className="mt-1 text-sm text-slate-500">{cart.customerEmail || cart.id}</p><p className="mt-2 text-xs text-slate-400">Last cart activity: {when(cart.cartUpdatedAt)} · Flagged: {when(cart.abandonedAt)}</p></div><div className="text-left lg:text-right"><p className="text-lg font-bold text-[#3E155C]">{money(cart.subtotal)}</p><p className="text-xs text-slate-500">{cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{cart.items.slice(0, 5).map((item, i) => <span key={`${cart.id}-${i}`} className="rounded-lg bg-[#fff4f7] px-3 py-2 text-xs text-slate-600">{item.title || item.productId} × {item.qty || 1}</span>)}</div><div className="mt-4 flex flex-wrap gap-2">{cart.status === 'flagged' && <button disabled={busy===cart.id} onClick={()=>void update(cart.id,'contacted')} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#3E155C]"><Mail size={14}/> Mark contacted</button>}{(cart.status === 'flagged' || cart.status === 'contacted') && <button disabled={busy===cart.id} onClick={()=>void update(cart.id,'recovered')} className="inline-flex items-center gap-1.5 rounded-full bg-[#3E155C] px-4 py-2 text-xs font-bold text-white"><CheckCircle2 size={14}/> Mark recovered</button>}{cart.status !== 'dismissed' && cart.status !== 'recovered' && <button disabled={busy===cart.id} onClick={()=>void update(cart.id,'dismissed')} className="inline-flex items-center gap-1.5 rounded-full border border-[#f0cbd7] px-4 py-2 text-xs font-bold text-[#bd1d52]"><XCircle size={14}/> Dismiss</button>}</div></div>)}</div>}
    </section>
  </div></main>;
}
