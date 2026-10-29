"use client";
import type { CustomerDetailView } from "@/lib/admin/view-types";


import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

function money(value: unknown) { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
function date(value: unknown) { return value ? new Date(String(value)).toLocaleString("en-IN") : "—"; }

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const [data, setData] = useState<CustomerDetailView | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) return;
      const { customerId } = await params;
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load customer.");
      setData(result);
    })().catch((e) => setError(e.message));
  }, [params]);

  const customer = data?.customer;
  const stats: Record<string, number> = data?.stats ?? {};
  const orders = data?.orders || [];
  const reviews = data?.reviews || [];
  const tickets = data?.supportTickets || [];
  const addresses = data?.addresses || [];
  const wishlist = data?.wishlist || [];
  const coupons = data?.couponUsage || [];

  return <main className="min-h-screen bg-[#fffafd]"><div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <Link href="/admin/customers" className="text-sm font-semibold text-[#3E155C]">← Customers</Link>
    {error && <p className="mt-4 text-sm text-[#bd1d52]">{error}</p>}
    {!customer && !error && <div className="mt-8 rounded-[14px] bg-white p-10 text-center text-slate-500">Loading customer…</div>}
    {customer && <>
      <div className="mt-4 rounded-[16px] border border-[#e3eaf0] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Customer 360</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4"><div><h1 className="gift-heading text-4xl font-bold text-[#3E155C]">{customer.name || "Unnamed customer"}</h1><p className="mt-1 text-sm text-slate-500">UID {customer.uid}</p></div><div className="text-right text-sm"><p>{customer.email || "No email"}</p><p className="text-slate-500">{customer.phone || "No phone"}</p></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
          ["Orders", customer.orderCount], ["Paid orders", customer.paidOrderCount], ["Total spend", money(customer.totalSpent)], ["Wishlist", stats.wishlistCount], ["Open support", stats.supportOpenCount],
        ].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[#f8fbfd] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-[#3E155C]">{value}</p></div>)}</div>
        <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><span>Joined: {date(customer.createdAt)}</span><span>Last order: {date(customer.lastOrderAt)}</span><span>Last updated: {date(customer.updatedAt)}</span></div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm lg:col-span-2"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Order history</h2><div className="mt-3 space-y-3">{orders.map((order) => <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-[#fffafd]"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold text-[#3E155C]">{order.id}</p><p className="text-xs text-slate-500">{date(order.createdAt)}</p></div><div className="text-right"><span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold uppercase text-[#3E155C]">{order.status}</span><p className="mt-2 font-bold">{money(order.totals?.grandTotal)}</p></div></div></Link>)}{orders.length===0&&<p className="py-8 text-center text-sm text-slate-500">No orders found.</p>}</div></section>
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Customer activity</h2><div className="mt-4 space-y-3 text-sm">{[["Addresses",stats.addressCount],["Reviews",stats.reviewCount],["Approved reviews",stats.approvedReviewCount],["Support tickets",stats.supportTicketCount],["Coupon uses",stats.couponUseCount],["Coupon discount",money(stats.couponDiscountTotal)]].map(([l,v])=><div key={String(l)} className="flex justify-between border-b border-slate-100 pb-2"><span className="text-slate-500">{l}</span><b>{v}</b></div>)}</div></section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Saved addresses</h2><div className="mt-3 space-y-3">{addresses.map((a)=><div key={a.id} className="rounded-xl border border-slate-100 p-4"><div className="flex justify-between gap-3"><b>{a.label || a.name || "Address"}</b>{a.isDefault&&<span className="text-xs font-bold text-[#62298E]">DEFAULT</span>}</div><p className="mt-1 text-sm text-slate-600">{[a.address,a.city,a.state,a.pincode].filter(Boolean).join(", ") || "Address details unavailable"}</p></div>)}{addresses.length===0&&<p className="py-6 text-sm text-slate-500">No saved addresses.</p>}</div></section>
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Wishlist</h2><div className="mt-3 space-y-2">{wishlist.slice(0,10).map((item,index:number)=><div key={item.id||index} className="rounded-xl bg-[#f8fbfd] p-3"><p className="font-semibold text-[#3E155C]">{item.title || item.name || item.id || "Product"}</p><p className="text-xs text-slate-500">{money(item.price)}</p></div>)}{wishlist.length===0&&<p className="py-6 text-sm text-slate-500">No wishlist items.</p>}{wishlist.length>10&&<p className="text-xs text-slate-500">Showing 10 of {wishlist.length} items.</p>}</div></section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Reviews</h2><div className="mt-3 space-y-3">{reviews.map((r)=><div key={r.id} className="rounded-xl border border-slate-100 p-4"><div className="flex justify-between gap-3"><b>{r.productTitle || r.productId}</b><span className="text-sm">★ {r.rating}/5</span></div><p className="mt-1 text-sm font-semibold">{r.title}</p><p className="mt-1 text-sm text-slate-600">{r.body}</p><p className="mt-2 text-xs text-slate-400">{r.status} · {date(r.createdAt)}</p></div>)}{reviews.length===0&&<p className="py-6 text-sm text-slate-500">No reviews.</p>}</div></section>
        <section className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Support & coupons</h2><div className="mt-3 space-y-3">{tickets.map((t)=><div key={t.id} className="rounded-xl border border-slate-100 p-3"><div className="flex justify-between gap-2"><b>{t.subject}</b><span className="text-xs font-bold uppercase text-[#3E155C]">{t.status}</span></div><p className="mt-1 text-xs text-slate-500">{t.priority} · {date(t.updatedAt)}</p></div>)}{tickets.length===0&&<p className="py-3 text-sm text-slate-500">No support tickets.</p>}<div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Coupon usage</p>{coupons.length===0?<p className="mt-2 text-sm text-slate-500">No coupons used.</p>:coupons.map((c)=><div key={`${c.orderId}-${c.code}`} className="mt-2 flex justify-between text-sm"><span className="font-semibold">{c.code}</span><span>{money(c.discount)}</span></div>)}</div></div></section>
      </div>

      <section className="mt-5 rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><h2 className="gift-heading text-2xl font-bold text-[#3E155C]">Abandoned cart</h2>{data?.abandonedCart?<div className="mt-3 flex flex-wrap justify-between gap-3 text-sm"><div><p className="font-bold uppercase text-[#3E155C]">{data?.abandonedCart.status}</p><p className="text-slate-500">Value {money(data?.abandonedCart.subtotal)} · {date(data?.abandonedCart.abandonedAt)}</p></div>{data?.abandonedCart.recoveredOrderId&&<Link className="font-semibold text-[#62298E]" href={`/admin/orders/${data?.abandonedCart.recoveredOrderId}`}>Recovered order →</Link>}</div>:<p className="mt-3 text-sm text-slate-500">No abandoned cart record.</p>}</section>
    </>}
  </div></main>;
}
