"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Users, ShoppingBag, IndianRupee, UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";

type Customer = { uid: string; name: string; email: string; phone: string; orderCount: number; paidOrderCount: number; totalSpent: number; lastOrderAt?: string | null };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState("all");
  const [sort, setSort] = useState("recent");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const user = auth.currentUser; if (!user) return;
      const token = await user.getIdToken();
      const params = new URLSearchParams({ limit: "200", segment, sort });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/admin/customers?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load customers.");
      setCustomers(data.customers || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load customers."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void Promise.resolve().then(() => load()); }, [segment, sort]);

  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const paidOrders = customers.reduce((sum, c) => sum + c.paidOrderCount, 0);
  const newCustomers = customers.filter((c) => c.orderCount === 0).length;

  return <main className="min-h-screen bg-[#fffafd]"><div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Customer management</p><h1 className="gift-heading text-4xl font-bold text-[#3E155C]">Customers</h1><p className="mt-2 text-sm text-slate-500">Search customers, inspect purchase history, and identify important customer segments.</p></div><span className="rounded-full bg-[#f5fbff] px-4 py-2 text-sm font-bold text-[#3E155C]">{customers.length} shown</span></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{label:"Customers",value:customers.length,icon:Users},{label:"Paid orders",value:paidOrders,icon:ShoppingBag},{label:"Shown spend",value:`₹${totalSpent.toLocaleString("en-IN")}`,icon:IndianRupee},{label:"No orders yet",value:newCustomers,icon:UserPlus}].map(({label,value,icon:Icon})=><div key={label} className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><Icon size={19} className="text-[#62298E]"/><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{value}</p></div>)}
    </div>
    <div className="mt-6 rounded-[14px] border border-[#e3eaf0] bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row"><div className="flex min-w-0 flex-1 gap-2 rounded-full border border-slate-200 px-4 py-2.5"><Search size={18} className="mt-0.5 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&void load()} placeholder="Search name, email, phone or UID" className="w-full bg-transparent text-sm outline-none"/><button onClick={()=>void load()} className="rounded-full bg-[#62298E] px-5 py-2 text-xs font-bold text-white">Search</button></div><select value={segment} onChange={e=>setSegment(e.target.value)} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm"><option value="all">All customers</option><option value="active">Has paid order</option><option value="high_value">High value (₹10k+)</option><option value="new">No orders yet</option></select><select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm"><option value="recent">Most recent</option><option value="spent">Highest spend</option><option value="orders">Most orders</option></select></div></div>
    {error&&<p className="mt-4 text-sm text-[#bd1d52]">{error}</p>}
    <div className="mt-5 overflow-hidden rounded-[14px] border border-[#e3eaf0] bg-white shadow-sm"><div className="hidden grid-cols-[1.6fr_1.2fr_.7fr_.8fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 md:grid"><span>Customer</span><span>Contact</span><span>Orders</span><span>Spend</span></div>{loading?<div className="p-12 text-center text-sm text-slate-500">Loading customers…</div>:customers.length===0?<div className="p-12 text-center text-sm text-slate-500">No customers found.</div>:customers.map(c=><Link key={c.uid} href={`/admin/customers/${c.uid}`} className="grid gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-[#fffafd] md:grid-cols-[1.6fr_1.2fr_.7fr_.8fr] md:items-center"><div><p className="font-bold text-[#3E155C]">{c.name||"Unnamed customer"}</p><p className="mt-1 text-xs text-slate-400">UID {c.uid}</p></div><div className="text-sm text-slate-600"><p>{c.email||"No email"}</p><p className="text-xs text-slate-400">{c.phone||"No phone"}</p></div><div><span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold text-[#3E155C]">{c.orderCount} total</span><p className="mt-1 text-xs text-slate-400">{c.paidOrderCount} paid</p></div><div><p className="font-bold text-[#62298E]">₹{c.totalSpent.toLocaleString("en-IN")}</p><p className="text-xs text-slate-400">{c.lastOrderAt ? `Last ${new Date(c.lastOrderAt).toLocaleDateString("en-IN")}` : "No orders"}</p></div></Link>)}</div>
  </div></main>;
}
