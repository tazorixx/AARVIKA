"use client";
import type { OrderView } from "@/lib/admin/view-types";


import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

const statuses = ["ready", "label_created", "picked_up", "in_transit", "out_for_delivery", "exception"];
function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function AdminShippingPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const user = auth.currentUser; if (!user) return;
    try { const token = await user.getIdToken(); const response = await fetch("/api/admin/orders?limit=50", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load shipments."); setOrders((data.orders || []).filter((o: OrderView) => ["confirmed", "processing", "shipped"].includes(o.status))); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load shipments."); }
  }
  useEffect(() => { if (auth.currentUser) void Promise.resolve().then(() => load()); return auth.onAuthStateChanged((user) => { if (user) void load(); }); }, []);

  async function saveShipment(order: OrderView, form: HTMLFormElement) {
    setBusyId(order.id); setError("");
    try { const user = auth.currentUser!; const token = await user.getIdToken(); const formData = new FormData(form); const response = await fetch(`/api/admin/orders/${order.id}/shipment`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ courier: formData.get("courier"), trackingNumber: formData.get("trackingNumber"), trackingUrl: formData.get("trackingUrl"), status: formData.get("status") }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to save shipment."); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save shipment."); } finally { setBusyId(""); }
  }

  const filtered = useMemo(() => orders.filter((order) => { const shipmentStatus = order.tracking?.status || "ready"; const matchesStatus = filter === "all" || shipmentStatus === filter; const haystack = [order.id, order.address?.name, order.address?.city, order.tracking?.trackingNumber].filter(Boolean).join(" ").toLowerCase(); return matchesStatus && haystack.includes(query.trim().toLowerCase()); }), [orders, filter, query]);
  const counts = useMemo(() => ({ total: orders.length, shipped: orders.filter(o => o.status === "shipped").length, exception: orders.filter(o => o.tracking?.status === "exception").length, unassigned: orders.filter(o => !o.tracking?.courier).length }), [orders]);

  return <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Operations</p><h1 className="gift-heading text-4xl font-bold text-[#3E155C]">Shipping</h1><p className="mt-2 text-sm text-slate-600">Manage courier, tracking and delivery status for active orders.</p></div><Link href="/admin/orders" className="rounded-full border border-[#3E155C] px-5 py-2.5 text-sm font-semibold text-[#3E155C]">All orders</Link></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Active",counts.total],["Shipped",counts.shipped],["Exceptions",counts.exception],["Courier missing",counts.unassigned]].map(([name,value])=><div key={String(name)} className="rounded-[14px] border border-[#e3eaf0] bg-white p-4"><p className="text-sm text-slate-500">{name}</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{value}</p></div>)}</div>
    {error && <p className="mt-4 rounded-[12px] bg-[#fff0f3] p-3 text-sm text-[#bd1d52]">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-2">{["all",...statuses].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter===s?"bg-[#62298E] text-white":"border border-[#dce7ef] bg-white text-[#3E155C]"}`}>{s === "all" ? "All" : label(s)}</button>)}</div>
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order, customer, city or tracking number" className="mt-4 w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm" />
    <div className="mt-6 space-y-4">{filtered.length === 0 ? <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-10 text-center text-sm text-slate-500">No shipments match the current filters.</section> : filtered.map(order => <form key={order.id} onSubmit={e=>{e.preventDefault(); void saveShipment(order,e.currentTarget);}} className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={`/admin/orders/${order.id}`} className="gift-heading text-xl font-bold text-[#3E155C] hover:underline">{order.id}</Link><p className="mt-1 text-sm text-slate-500">{order.address?.name || "Recipient"} · {order.address?.city || "—"} · Order {order.status}</p></div><span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold uppercase text-[#3E155C]">{label(order.tracking?.status || "ready")}</span></div><div className="mt-4 grid gap-3 md:grid-cols-4"><input name="courier" defaultValue={order.tracking?.courier || ""} placeholder="Courier" className="rounded-[12px] border px-3 py-2 text-sm" /><input name="trackingNumber" defaultValue={order.tracking?.trackingNumber || ""} placeholder="Tracking number" className="rounded-[12px] border px-3 py-2 text-sm" /><input name="trackingUrl" defaultValue={order.tracking?.url || ""} placeholder="Tracking URL" className="rounded-[12px] border px-3 py-2 text-sm" /><select name="status" defaultValue={order.tracking?.status || "ready"} className="rounded-[12px] border px-3 py-2 text-sm">{statuses.concat("delivered").map(s=><option key={s} value={s}>{label(s)}</option>)}</select></div><div className="mt-4 flex justify-end"><button disabled={busyId===order.id} className="rounded-full bg-[#3E155C] px-5 py-2 text-sm font-semibold text-white">{busyId===order.id?"Saving…":"Save shipment"}</button></div></form>)}</div>
  </div></main>;
}
