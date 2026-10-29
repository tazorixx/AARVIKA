"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Eye, Loader2, Mail, RefreshCw, Save, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/lib/firebase";
import { NOTIFICATION_TEMPLATE_VARIABLES } from "@/lib/notifications/templates";

type Template = {
  id: keyof typeof NOTIFICATION_TEMPLATE_VARIABLES;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
};

type Log = {
  id: string;
  type: string;
  orderId: string;
  to: { email: string; name?: string };
  subject: string;
  status: "queued" | "sent" | "failed";
  attempts: number;
  provider?: string;
  lastError?: string;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function statusClass(status: Log["status"]) {
  if (status === "sent") return "bg-emerald-50 text-emerald-700";
  if (status === "failed") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [busy, setBusy] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Log["status"]>("all");
  const [preview, setPreview] = useState<Template | null>(null);

  async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");
    return user.getIdToken();
  }

  async function load() {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [templateResponse, logResponse] = await Promise.all([
      fetch("/api/admin/notifications", { headers, cache: "no-store" }),
      fetch("/api/admin/notifications/logs", { headers, cache: "no-store" }),
    ]);
    const templateData = await templateResponse.json();
    const logData = await logResponse.json();
    if (!templateResponse.ok) throw new Error(templateData.error || "Unable to load notification templates.");
    if (!logResponse.ok) throw new Error(logData.error || "Unable to load notification history.");
    setTemplates(templateData.templates || []);
    setLogs(logData.logs || []);
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load notifications."));
    });
    return unsubscribe;
  }, []);

  function updateLocal(id: string, patch: Partial<Template>) {
    setTemplates((current) => current.map((template) => template.id === id ? { ...template, ...patch } : template));
  }

  async function save(template: Template) {
    setBusy(template.id);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/notifications/${template.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: template.subject, body: template.body, isActive: template.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save template.");
      updateLocal(template.id, data.template);
      setMessage(`${template.name} saved.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save template.");
    } finally {
      setBusy("");
    }
  }

  async function processQueue() {
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/notifications/process", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to process notification queue.");
      setMessage(`Queue processed: ${data.sent} sent, ${data.failed} failed.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to process notification queue.");
    } finally {
      setProcessing(false);
    }
  }

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesStatus = status === "all" || log.status === status;
      const matchesQuery = !normalized || [log.id, log.type, log.orderId, log.to.email, log.subject]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [logs, query, status]);

  const counts = useMemo(() => ({
    total: logs.length,
    queued: logs.filter((log) => log.status === "queued").length,
    sent: logs.filter((log) => log.status === "sent").length,
    failed: logs.filter((log) => log.status === "failed").length,
  }), [logs]);

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Admin communication</p>
            <h1 className="gift-heading mt-2 text-3xl font-bold text-[#3E155C]">Notifications</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Manage transactional email templates and review the recent delivery queue.</p>
          </div>
          <button disabled={processing} onClick={() => void processQueue()} className="inline-flex items-center gap-2 rounded-full bg-[#3E155C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            {processing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Process queue
          </button>
        </div>

        {error && <p className="mt-4 rounded-[14px] border border-[#f0dfe6] bg-white p-4 text-sm text-[#bd1d52]">{error}</p>}
        {message && <p className="mt-4 rounded-[14px] border border-[#dbeaf3] bg-white p-4 text-sm text-[#3E155C]">{message}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Recent", counts.total, Bell],
            ["Queued", counts.queued, Mail],
            ["Sent", counts.sent, CheckCircle2],
            ["Failed", counts.failed, XCircle],
          ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => {
            const Component = Icon;
            return (
              <div key={String(label)} className="rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                  <Component size={18} className="text-[#3E155C]" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[#3E155C]">{value}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-6 rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="gift-heading text-xl font-bold text-[#3E155C]">Transactional templates</h2>
              <p className="mt-1 text-xs text-slate-500">Only supported placeholders can be saved.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {templates.map((template) => (
              <article key={template.id} className="rounded-[14px] border border-[#e3eaf0] bg-[#fffafd] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="gift-heading text-lg font-bold text-[#3E155C]">{template.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{template.id}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={template.isActive} onChange={(e) => updateLocal(template.id, { isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {NOTIFICATION_TEMPLATE_VARIABLES[template.id].map((variable) => (
                    <span key={variable} className="rounded-full bg-[#f5fbff] px-2.5 py-1 text-[11px] font-bold text-[#3E155C]">{`{{${variable}}}`}</span>
                  ))}
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate-700">Subject
                  <input value={template.subject} onChange={(e) => updateLocal(template.id, { subject: e.target.value })} className="mt-1 w-full rounded-[12px] border border-[#dce5eb] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#3E155C]" />
                </label>
                <label className="mt-4 block text-sm font-semibold text-slate-700">Body
                  <textarea value={template.body} onChange={(e) => updateLocal(template.id, { body: e.target.value })} rows={5} className="mt-1 w-full rounded-[12px] border border-[#dce5eb] bg-white px-3 py-2.5 font-normal outline-none focus:border-[#3E155C]" />
                </label>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button onClick={() => setPreview(template)} className="inline-flex items-center gap-2 rounded-full border border-[#dbe6ee] px-4 py-2 text-xs font-bold text-[#3E155C]"><Eye size={14} /> Preview</button>
                  <button disabled={busy === template.id} onClick={() => void save(template)} className="inline-flex items-center gap-2 rounded-full bg-[#62298E] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy === template.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="gift-heading text-xl font-bold text-[#3E155C]">Recent delivery history</h2>
              <p className="mt-1 text-xs text-slate-500">Shows the latest notification records available to the admin system.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email, order, subject…" className="w-64 rounded-full border border-[#dce5eb] px-4 py-2 text-xs outline-none focus:border-[#3E155C]" />
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-full border border-[#dce5eb] bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                <option value="all">All statuses</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Order</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Recipient</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Attempts</th><th className="px-3 py-3">Created</th></tr></thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">No notification records match the current filters.</td></tr>
                ) : filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 align-top last:border-0">
                    <td className="px-3 py-3 font-semibold text-[#3E155C]">{log.orderId || "—"}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{log.type}</td>
                    <td className="px-3 py-3"><div className="font-medium text-slate-700">{log.to.name || "Customer"}</div><div className="text-xs text-slate-500">{log.to.email || "—"}</div></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(log.status)}`}>{log.status}</span>{log.lastError ? <p className="mt-1 max-w-xs text-[11px] text-rose-600">{log.lastError}</p> : null}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{log.attempts}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-2xl rounded-[18px] bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#62298E]">Preview</p><h2 className="gift-heading mt-1 text-2xl font-bold text-[#3E155C]">{preview.name}</h2></div><button onClick={() => setPreview(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-50">×</button></div>
            <div className="mt-5 rounded-[14px] border border-[#e3eaf0] bg-[#fffafd] p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Subject</p><p className="mt-1 font-semibold text-slate-800">{preview.subject}</p><p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">Body</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview.body}</p></div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
