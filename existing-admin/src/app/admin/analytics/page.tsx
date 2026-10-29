"use client";

import { useEffect, useState } from "react";
import { BarChart3, Boxes, RefreshCw, RotateCcw, ShoppingBag, Tag, TrendingUp } from "lucide-react";
import { auth } from "@/lib/firebase";

type AnalyticsData = {
  totalOrders: number; paidOrders: number; totalRevenue: number; averageOrderValue: number; refundedAmount: number; netRevenue: number;
  statusCounts: Record<string, number>;
  dailyTrend: { date: string; orders: number; paidOrders: number; revenue: number }[];
  inventory: { products: number; availableUnits: number; reservedUnits: number; soldUnits: number; lowStock: number; outOfStock: number };
  couponSummary: { total: number; active: number; redemptions: number };
  topProducts: { productId: string; title: string; units: number; revenue: number }[];
  topCategories: { categoryId: string; name: string; units: number; revenue: number }[];
};

function localDate(days = 0) { const date = new Date(); date.setDate(date.getDate() + days); return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date); }
function money(value: number) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`; }
function prettyDate(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00+05:30`)); }

export default function AdminAnalyticsPage() {
  const [start, setStart] = useState(localDate(-29));
  const [end, setEnd] = useState(localDate(0));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const user = auth.currentUser; if (!user) throw new Error("Please sign in as an authorized admin.");
      const response = await fetch(`/api/admin/analytics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load analytics."); setData(body as AnalyticsData);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load analytics."); } finally { setLoading(false); }
  }
  useEffect(() => { void Promise.resolve().then(() => load()); }, []);

  const maxRevenue = Math.max(1, ...(data?.dailyTrend || []).map((item) => item.revenue));
  return <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#62298E]">Business insights</p><h1 className="gift-heading text-4xl font-bold text-[#3E155C]">Analytics & Reports</h1><p className="mt-2 text-sm text-slate-600">Revenue, order trends, catalog performance and operational signals.</p></div><div className="flex flex-wrap items-end gap-2 rounded-[14px] border border-[#dce7ef] bg-white p-3"><label className="text-xs font-semibold text-slate-500">From<input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block rounded-full border border-slate-200 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-500">To<input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 block rounded-full border border-slate-200 px-3 py-2 text-sm" /></label><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#62298E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />{loading ? "Loading…" : "Apply"}</button></div></div>
    {error && <p className="mt-5 rounded-[14px] border border-[#f0dfe6] bg-white p-4 text-sm text-[#bd1d52]">{error}</p>}
    {!data && !error && <p className="mt-8 text-sm text-slate-500">Loading analytics…</p>}
    {data && <>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<ShoppingBag size={18} />} title="Orders" value={String(data.totalOrders)} note={`${data.paidOrders} paid`} /><Metric icon={<TrendingUp size={18} />} title="Gross revenue" value={money(data.totalRevenue)} note="Paid-order revenue" pink /><Metric icon={<BarChart3 size={18} />} title="Net revenue" value={money(data.netRevenue)} note={`${money(data.refundedAmount)} refunded`} /><Metric icon={<Tag size={18} />} title="Coupon redemptions" value={String(data.couponSummary.redemptions)} note={`${data.couponSummary.active} active coupons`} /></div>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.65fr_1fr]"><div className="rounded-[14px] border border-[#dce7ef] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Revenue trend</h2><p className="text-xs text-slate-500">Daily paid-order revenue for the selected period</p></div><TrendingUp size={18} className="text-[#3E155C]" /></div><div className="mt-6 flex h-64 items-end gap-1 overflow-hidden">{data.dailyTrend.map((item) => <div key={item.date} className="group flex h-full min-w-[8px] flex-1 items-end" title={`${prettyDate(item.date)} · ${money(item.revenue)} · ${item.orders} orders`}><div className="w-full rounded-t-md bg-[#3E155C] transition-opacity group-hover:opacity-70" style={{ height: `${Math.max(3, (item.revenue / maxRevenue) * 100)}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[11px] text-slate-400"><span>{data.dailyTrend[0] ? prettyDate(data.dailyTrend[0].date) : "—"}</span><span>{data.dailyTrend.at(-1) ? prettyDate(data.dailyTrend.at(-1)!.date) : "—"}</span></div></div>
      <div className="rounded-[14px] border border-[#f0dfe6] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Operational snapshot</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><Info icon={<Boxes size={17} />} label="Available units" value={data.inventory.availableUnits.toLocaleString("en-IN")} /><Info icon={<RotateCcw size={17} />} label="Reserved units" value={data.inventory.reservedUnits.toLocaleString("en-IN")} /><Info icon={<Boxes size={17} />} label="Low stock" value={String(data.inventory.lowStock)} /><Info icon={<Boxes size={17} />} label="Out of stock" value={String(data.inventory.outOfStock)} /></div></div></section>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><Panel title="Top categories"><div className="space-y-3">{data.topCategories.map((item, index) => <div key={item.categoryId} className="flex items-center justify-between gap-4 rounded-[12px] border border-slate-100 p-3"><div className="min-w-0"><span className="text-[11px] font-bold text-slate-400">#{index + 1}</span><p className="truncate font-semibold text-[#3E155C]">{item.name}</p></div><div className="text-right"><p className="font-bold text-[#3E155C]">{money(item.revenue)}</p><p className="text-xs text-slate-500">{item.units} units</p></div></div>)}{!data.topCategories.length && <Empty />}</div></Panel><Panel title="Top products"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-2 py-3">Product</th><th className="px-2 py-3">Units</th><th className="px-2 py-3 text-right">Revenue</th></tr></thead><tbody>{data.topProducts.map((item) => <tr key={item.productId} className="border-b border-slate-100 last:border-0"><td className="px-2 py-3 font-semibold text-[#3E155C]">{item.title}</td><td className="px-2 py-3 text-slate-600">{item.units}</td><td className="px-2 py-3 text-right font-bold text-[#3E155C]">{money(item.revenue)}</td></tr>)}</tbody></table>{!data.topProducts.length && <Empty />}</div></Panel></div>
      <section className="mt-5 rounded-[14px] border border-[#dce7ef] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Order status breakdown</h2><div className="mt-4 flex flex-wrap gap-3">{Object.entries(data.statusCounts).map(([status, count]) => <div key={status} className="rounded-full bg-[#f5fbff] px-4 py-2 text-xs font-bold text-[#3E155C]">{status.replaceAll("_", " ")} · {count}</div>)}{!Object.keys(data.statusCounts).length && <Empty />}</div></section>
    </>}
  </div></main>;
}

function Metric({ icon, title, value, note, pink }: { icon: React.ReactNode; title: string; value: string; note: string; pink?: boolean }) { return <div className="rounded-[14px] border border-[#dce7ef] bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><span className={`grid h-9 w-9 place-items-center rounded-full ${pink ? "bg-[#fff0f5] text-[#62298E]" : "bg-[#f5fbff] text-[#3E155C]"}`}>{icon}</span>{title}</div><p className="mt-3 text-2xl font-bold text-[#3E155C]">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center justify-between rounded-[12px] bg-[#f5fbff] p-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-600">{icon}{label}</span><strong className="text-[#3E155C]">{value}</strong></div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[14px] border border-[#dce7ef] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">{title}</h2><div className="mt-4">{children}</div></section>; }
function Empty() { return <p className="py-5 text-center text-sm text-slate-500">No data for this period.</p>; }
