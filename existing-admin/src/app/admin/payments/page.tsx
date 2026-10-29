"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, RefreshCw, Search } from "lucide-react";
import { auth } from "@/lib/firebase";

type PaymentRow = {
  orderId: string;
  userId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  amount: number;
  status: string;
  providerStatus?: string | null;
  paymentId?: string | null;
  razorpayOrderId?: string | null;
  method?: string | null;
  failureCode?: string | null;
  failureDescription?: string | null;
  refundedAmount: number;
  refundStatus: string;
  createdAt?: string | null;
};

const tabs = [
  ["all", "All"], ["success", "Successful"], ["pending", "Pending"], ["failed", "Failed"], ["refunded", "Refunded"], ["partially_refunded", "Partial refunds"],
] as const;

function money(value: number) { return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function date(value?: string | null) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
function badge(status: string) {
  if (status === "success") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ total: 0, success: 0, pending: 0, failed: 0, refunds: 0, amount: 0 });

  async function load() {
    setLoading(true); setError("");
    try {
      const user = auth.currentUser; if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const params = new URLSearchParams({ status, q, limit: "100" });
      const response = await fetch(`/api/admin/payments?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load payments.");
      setRows(data.payments || []); setSummary(data.summary || summary);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load payments."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void Promise.resolve().then(() => load()); }, [status]);

  async function reconcile(orderId: string) {
    setReconciling(orderId); setError("");
    try {
      const user = auth.currentUser; if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/payments", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to reconcile payment.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to reconcile payment."); }
    finally { setReconciling(null); }
  }

  return <div>
    <div className="admin-page-heading">
      <div><p className="admin-eyebrow">Sales & Fulfillment</p><h1 className="admin-page-title">Payments</h1><p className="admin-page-description">Reconcile Razorpay payment state with AARVIKA orders and monitor payment exceptions.</p></div>
      <button className="admin-secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </div>

    <div className="grid gap-4 md:grid-cols-4 mb-5">
      <div className="admin-card p-5"><p className="text-sm text-slate-500">Successful value</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{money(summary.amount)}</p></div>
      <div className="admin-card p-5"><p className="text-sm text-slate-500">Successful</p><p className="mt-1 text-2xl font-bold text-emerald-700">{summary.success}</p></div>
      <div className="admin-card p-5"><p className="text-sm text-slate-500">Pending</p><p className="mt-1 text-2xl font-bold text-amber-700">{summary.pending}</p></div>
      <div className="admin-card p-5"><p className="text-sm text-slate-500">Failed</p><p className="mt-1 text-2xl font-bold text-rose-700">{summary.failed}</p></div>
    </div>

    <section className="admin-card admin-table-card">
      <div className="admin-table-toolbar flex-wrap">
        <div className="admin-table-search"><Search size={17}/><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void load(); }} placeholder="Search order, customer or payment ID..."/></div>
        <button className="admin-secondary-button" onClick={() => void load()}>Search</button>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">{tabs.map(([value,label]) => <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-3 py-2 text-xs font-bold ${status === value ? "bg-[#62298E] text-white" : "border border-[#dce7ef] bg-white text-[#3E155C]"}`}>{label}</button>)}</div>
      </div>
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Status</th><th>Amount</th><th>Time</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7}><div className="admin-table-empty">Loading payments…</div></td></tr> : rows.map(row => <tr key={row.orderId}>
              <td><Link className="font-bold text-[#3E155C]" href={`/admin/orders/${row.orderId}`}>{row.orderId}</Link><small className="block">{row.razorpayOrderId || "No Razorpay order"}</small></td>
              <td><strong>{row.customerName || "—"}</strong><small className="block">{row.customerPhone || "—"}</small></td>
              <td><strong>{row.paymentId || "—"}</strong><small className="block">{row.method || row.providerStatus || "—"}</small></td>
              <td><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${badge(row.status)}`}>{row.status.replaceAll("_", " ")}</span>{row.failureCode && <small className="block mt-1 text-rose-600">{row.failureCode}</small>}</td>
              <td><strong>{money(row.amount)}</strong>{row.refundedAmount > 0 && <small className="block text-slate-500">Refunded {money(row.refundedAmount)}</small>}</td>
              <td className="admin-muted-cell">{date(row.createdAt)}</td>
              <td>{(row.status === "pending" || row.status === "failed") && row.paymentId ? <button onClick={() => void reconcile(row.orderId)} disabled={reconciling === row.orderId} className="admin-secondary-button">{reconciling === row.orderId ? "Checking…" : "Reconcile"}</button> : <span className="text-xs text-slate-400">—</span>}</td>
            </tr>)}
            {!loading && rows.length === 0 && <tr><td colSpan={7}><div className="admin-table-empty">No payments found.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    <p className="mt-4 text-xs text-slate-500 flex items-center gap-2"><CreditCard size={14}/> Payment reconciliation checks Razorpay directly. It does not trust a browser-provided payment state.</p>
    <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#3E155C]">Open Razorpay Dashboard <ExternalLink size={14}/></a>
  </div>;
}
