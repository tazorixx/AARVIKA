"use client";
import type { OrderView, RefundView } from "@/lib/admin/view-types";


import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

const nextStatuses: Record<string, string[]> = { confirmed: ["processing"], processing: ["packed"], packed: ["shipped"], shipped: ["out_for_delivery"], out_for_delivery: ["delivered"], delivery_failed: ["out_for_delivery"], delivered: ["returned"], returned: ["refunded"] };
const shipmentStatuses = ["ready", "label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception"];

function money(value: unknown) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
function date(value: unknown) { const d = value ? new Date(String(value)) : null; return d && !Number.isNaN(d.getTime()) ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

export default function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [refunds, setRefunds] = useState<RefundView[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refundBusy, setRefundBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("ready");
  const [notes, setNotes] = useState("");

  useEffect(() => { void params.then(({ orderId: id }) => { setOrderId(id); void load(id); }); }, []);

  async function token() { const user = auth.currentUser; if (!user) throw new Error("Please sign in again."); return user.getIdToken(); }

  async function load(id = orderId) {
    try {
      setError("");
      const authToken = await token();
      const [orderResponse, refundResponse] = await Promise.all([
        fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" }),
        fetch(`/api/admin/orders/${id}/refund`, { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" }),
      ]);
      const data = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(data.error || "Unable to load order.");
      setOrder(data);
      setCourier(data.tracking?.courier || ""); setTrackingNumber(data.tracking?.trackingNumber || ""); setTrackingUrl(data.tracking?.url || ""); setShipmentStatus(data.tracking?.status || "ready"); setNotes(data.fulfillmentNotes || "");
      const total = Number(data.totals?.grandTotal || 0); const refunded = Number(data.payment?.refundedAmount || 0); setRefundAmount(Math.max(0, total - refunded).toFixed(2));
      if (refundResponse.ok) { const refundData = await refundResponse.json(); setRefunds(refundData.refunds || []); }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load order."); }
  }

  async function save(status?: string) {
    setBusy(true); setError("");
    try {
      const authToken = await token();
      const r = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ status, courier, trackingNumber, trackingUrl, notes }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to update order."); setOrder(d.order);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update order."); } finally { setBusy(false); }
  }

  async function saveShipment() {
    setBusy(true); setError("");
    try {
      const authToken = await token();
      const r = await fetch(`/api/admin/orders/${orderId}/shipment`, { method: "POST", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ courier, trackingNumber, trackingUrl, status: shipmentStatus }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to save shipment."); setOrder(d.order); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save shipment."); } finally { setBusy(false); }
  }

  async function cancelOrder() {
    if (!window.confirm("Cancel this pending-payment order? Inventory, delivery capacity, and any coupon reservation will be released.")) return;
    setCancelBusy(true); setError("");
    try {
      const authToken = await token();
      const r = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to cancel order.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to cancel order.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function refund() {
    setRefundBusy(true); setError("");
    try {
      const authToken = await token();
      const r = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST", headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(refundAmount), reason: refundReason }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to process refund."); setRefundReason(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to process refund."); } finally { setRefundBusy(false); }
  }

  if (!order) return <main className="min-h-screen bg-[#fffafd] px-4 py-10"><div className="mx-auto max-w-6xl">{error ? <p className="rounded-[12px] bg-[#fff0f3] p-3 text-[#bd1d52]">{error}</p> : <p className="text-slate-500">Loading order…</p>}</div></main>;

  const total = Number(order.totals?.grandTotal || 0); const refunded = Number(order.payment?.refundedAmount || 0); const refundable = Math.max(0, total - refunded);
  return <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/admin/orders" className="text-sm font-semibold text-[#3E155C]">← Orders</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Order details</p><h1 className="gift-heading text-3xl font-bold text-[#3E155C]">{order.id}</h1><p className="mt-1 text-sm text-slate-500">Created {date(order.createdAt)}</p></div><span className="rounded-full bg-[#f5fbff] px-4 py-2 text-sm font-bold uppercase text-[#3E155C]">{order.status}</span></div>
    {error && <p className="mt-4 rounded-[12px] bg-[#fff0f3] p-3 text-sm text-[#bd1d52]">{error}</p>}
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-5">
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Customer & delivery</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-700"><div><p className="font-bold">{order.address?.name || "—"}</p><p>{order.address?.phone || "—"}</p></div><div><p>{order.address?.addressLine || order.address?.line1 || "—"}</p><p>{order.address?.city || "—"}, {order.address?.state || "—"} — {order.address?.pincode || "—"}</p></div></div></section>
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5"><div className="flex items-center justify-between"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Items</h2><span className="text-sm text-slate-500">{order.items?.length || 0} item(s)</span></div>{order.items?.map((item) => <div key={item.cartKey || item.productId} className="mt-4 rounded-[14px] border border-[#e8edf2] p-4"><div className="flex gap-4">{item.image && <img src={item.image} alt="" className="h-16 w-16 rounded-[10px] object-cover" />}<div className="min-w-0 flex-1"><p className="font-semibold text-[#3E155C]">{item.title || item.productId}</p><p className="mt-1 text-sm text-slate-600">Qty {item.qty} · {money(item.priceAtAdd || item.unitPrice)} each</p><p className="mt-1 text-sm font-bold">{money(Number(item.priceAtAdd || item.unitPrice || 0) * Number(item.qty || 0))}</p></div></div><p className="mt-3 text-sm"><b>Delivery:</b> {item.deliveryDate || "—"} · {item.deliverySlot || "—"}</p><p className="mt-2 text-sm"><b>Gift message:</b> {item.giftMessage || "—"}</p>{item.personalization && <p className="mt-2 break-words text-sm"><b>Personalization:</b> {Object.entries(item.personalization).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</p>}</div>)}</section>
        <section className="rounded-[14px] border border-[#dce7ef] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Payment summary</h2><div className="mt-4 grid grid-cols-2 gap-3 text-sm">{[["Subtotal", order.totals?.subtotal],["Delivery", order.totals?.delivery],["Discount", order.totals?.discount],["Tax", order.totals?.tax]].map(([label,value])=><div key={String(label)} className="rounded-[10px] bg-[#f8fbfd] p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-semibold">{money(value)}</p></div>)}</div><div className="mt-4 flex justify-between border-t pt-4"><span className="font-semibold">Grand total</span><span className="text-xl font-bold text-[#3E155C]">{money(total)}</span></div><p className="mt-2 text-xs text-slate-500">Payment: {order.payment?.status || (order.status === "confirmed" ? "paid" : "—")} · Payment ID: {order.payment?.paymentId || "—"}</p></section>
      </div>
      <div className="space-y-5">
        <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Fulfillment</h2><label className="mt-4 block text-sm font-semibold">Courier<input value={courier} onChange={e=>setCourier(e.target.value)} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><label className="mt-3 block text-sm font-semibold">Tracking number<input value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><label className="mt-3 block text-sm font-semibold">Tracking URL<input value={trackingUrl} onChange={e=>setTrackingUrl(e.target.value)} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><label className="mt-3 block text-sm font-semibold">Shipment status<select value={shipmentStatus} onChange={e=>setShipmentStatus(e.target.value)} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal">{shipmentStatuses.map(s=><option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label><label className="mt-3 block text-sm font-semibold">Internal notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy || cancelBusy} onClick={()=>void save()} className="rounded-full border border-[#3E155C] px-4 py-2 text-sm font-semibold text-[#3E155C]">Save notes</button><button disabled={busy || cancelBusy} onClick={()=>void saveShipment()} className="rounded-full bg-[#3E155C] px-4 py-2 text-sm font-semibold text-white">Save shipment</button>{nextStatuses[order.status]?.[0] && <button disabled={busy || cancelBusy} onClick={()=>void save(nextStatuses[order.status][0])} className="rounded-full bg-[#62298E] px-4 py-2 text-sm font-semibold text-white">Mark {nextStatuses[order.status]?.[0]?.replaceAll("_", " ")}</button>}{order.status === "pending_payment" && <button disabled={busy || cancelBusy} onClick={()=>void cancelOrder()} className="rounded-full border border-[#bd1d52] bg-[#fff0f3] px-4 py-2 text-sm font-semibold text-[#bd1d52]">{cancelBusy ? "Cancelling…" : "Cancel order"}</button>}</div></section>
        <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5"><div className="flex items-center justify-between"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Refund</h2><span className="rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-bold uppercase text-[#bd1d52]">{order.payment?.refundStatus || "none"}</span></div><p className="mt-2 text-sm text-slate-600">Refunded {money(refunded)} · Remaining {money(refundable)}</p><label className="mt-4 block text-sm font-semibold">Amount<input type="number" min="0.01" max={refundable} step="0.01" value={refundAmount} onChange={e=>setRefundAmount(e.target.value)} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><label className="mt-3 block text-sm font-semibold">Reason<textarea value={refundReason} onChange={e=>setRefundReason(e.target.value)} rows={3} className="mt-1 w-full rounded-[12px] border px-3 py-2 font-normal" /></label><button disabled={refundBusy || refundable <= 0} onClick={()=>void refund()} className="mt-4 rounded-full bg-[#62298E] px-5 py-2 text-sm font-semibold text-white">{refundBusy ? "Processing…" : refundable > 0 ? "Process refund" : "Fully refunded"}</button>{refunds.length > 0 && <div className="mt-6 border-t pt-4"><p className="text-sm font-bold text-[#3E155C]">Refund history</p><div className="mt-3 space-y-2">{refunds.map(r=><div key={r.id} className="rounded-[10px] bg-[#f8fbfd] p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-semibold">{money(r.amount)}</span><span className="text-xs uppercase text-slate-500">{r.status || "—"}</span></div><p className="mt-1 text-xs text-slate-500">{r.reason || "Admin refund"} · {date(r.createdAt)}</p></div>)}</div></div>}</section>
      </div>
    </div>
  </div></main>;
}
