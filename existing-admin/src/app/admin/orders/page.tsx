"use client";
import type { OrderView } from "@/lib/admin/view-types";


import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const tabs = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Payment pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function money(value: unknown) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status: string) {
  if (status === "delivered") return "bg-[#eef8f2] text-[#24724b]";
  if (status === "cancelled" || status === "expired") return "bg-[#fff0f3] text-[#bd1d52]";
  if (status === "shipped" || status === "processing") return "bg-[#f5fbff] text-[#3E155C]";
  return "bg-[#fffafd] text-[#8b4b64]";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [metrics, setMetrics] = useState({ totalRevenue: 0, confirmedOrders: 0 });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(reset = true) {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      if (!reset && nextCursor) params.set("cursor", nextCursor);
      const response = await fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load orders.");
      setOrders((current) => reset ? data.orders || [] : [...current, ...(data.orders || [])]);
      setNextCursor(data.nextCursor || null);
      setMetrics(data.metrics || { totalRevenue: 0, confirmedOrders: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auth.currentUser) void Promise.resolve().then(() => load(true));
    return auth.onAuthStateChanged((user) => { if (user) void load(true); });
  }, [status]);

  const visible = orders;

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Fulfillment</p><h1 className="gift-heading text-4xl font-bold text-[#3E155C]">Orders</h1><p className="mt-2 text-sm text-slate-600">Track payment, fulfillment and delivery from one place.</p></div>
          <Link href="/admin/shipping" className="rounded-full bg-[#3E155C] px-5 py-2.5 text-sm font-semibold text-white">Open shipping</Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-[14px] border border-[#dce7ef] bg-white p-5"><p className="text-sm text-slate-500">Confirmed revenue</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{money(metrics.totalRevenue)}</p><p className="mt-1 text-xs text-slate-500">Confirmed orders only</p></div><div className="rounded-[14px] border border-[#f0dfe6] bg-white p-5"><p className="text-sm text-slate-500">Confirmed orders</p><p className="mt-1 text-2xl font-bold text-[#62298E]">{metrics.confirmedOrders}</p><p className="mt-1 text-xs text-slate-500">Paid / confirmed orders</p></div></div>
        <div className="mt-6 flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.value} onClick={() => setStatus(tab.value)} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === tab.value ? "bg-[#62298E] text-white" : "border border-[#dce7ef] bg-white text-[#3E155C]"}`}>{tab.label}</button>)}</div>
        <div className="mt-4 flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(true); }} placeholder="Search order, customer, phone, pincode" className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm" /><button onClick={() => void load(true)} className="rounded-full border border-[#3E155C] px-5 py-2.5 text-sm font-semibold text-[#3E155C]">Search</button></div>
        {error && <p className="mt-4 rounded-[12px] bg-[#fff0f3] p-3 text-sm text-[#bd1d52]">{error}</p>}
        <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e3eaf0] bg-white shadow-sm">
          <div className="hidden grid-cols-[1.2fr_1fr_.8fr_.8fr_1fr] gap-4 border-b border-slate-100 bg-[#f8fbfd] px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid"><span>Order</span><span>Customer</span><span>Status</span><span>Payment</span><span className="text-right">Total</span></div>
          {visible.map((o) => <Link key={o.id} href={`/admin/orders/${o.id}`} className="grid gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-[#fffafd] md:grid-cols-[1.2fr_1fr_.8fr_.8fr_1fr] md:items-center md:gap-4"><div><p className="font-bold text-[#3E155C]">{o.id}</p><p className="mt-1 text-xs text-slate-500">{formatDate(o.createdAt)} · {o.items?.length || 0} item(s)</p></div><div><p className="font-semibold text-slate-700">{o.address?.name || "Customer unavailable"}</p><p className="text-xs text-slate-500">{o.address?.phone || "—"}</p></div><div><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClass(String(o.status || "unknown"))}`}>{o.status || "unknown"}</span></div><div className="text-sm text-slate-600">{o.payment?.status || (o.status === "confirmed" ? "paid" : "—")}</div><div className="md:text-right"><p className="font-bold text-[#3E155C]">{money(o.totals?.grandTotal)}</p><p className="text-xs text-slate-500">{o.address?.city || ""}</p></div></Link>)}
          {visible.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No orders found.</div>}
        </div>
        {nextCursor && <div className="mt-5 text-center"><button disabled={loading} onClick={() => void load(false)} className="rounded-full border border-[#3E155C] bg-white px-6 py-2.5 text-sm font-semibold text-[#3E155C]">{loading ? "Loading…" : "Load more orders"}</button></div>}
      </div>
    </main>
  );
}
