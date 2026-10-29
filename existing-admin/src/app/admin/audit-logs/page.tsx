"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { auth } from "@/lib/firebase";

type AuditLog = {
  id: string;
  actorUid: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
};

const actionLabels: Record<string, string> = {
  ADMIN_CREATED: "Admin created",
  ADMIN_UPDATED: "Admin updated",
  ADMIN_ROLE_CHANGED: "Role changed",
  ADMIN_ENABLED: "Admin enabled",
  ADMIN_DISABLED: "Admin disabled",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/audit-logs?limit=200", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load audit logs.");
      setLogs(data.logs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = action === "all" || log.action === action;
      const matchesQuery = !query || [log.actorUid, log.actorRole, log.action, log.entityId, log.summary]
        .join(" ")
        .toLowerCase()
        .includes(query);
      return matchesAction && matchesQuery;
    });
  }, [logs, q, action]);

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1 className="admin-page-title">Audit logs</h1>
          <p className="admin-page-description">Review protected admin-account access changes and who performed them.</p>
        </div>
        <button className="admin-secondary-button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <section className="admin-card admin-table-card">
        <div className="admin-table-toolbar">
          <div className="admin-table-search">
            <Search size={17} />
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search actor, action or account..." />
          </div>
          <select className="admin-filter-select" value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="all">All actions</option>
            {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Action</th><th>Administrator</th><th>Target</th><th>Details</th><th>Time</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="admin-table-empty">Loading audit logs…</div></td></tr>
              ) : filtered.map((log) => (
                <tr key={log.id}>
                  <td><span className="admin-badge admin-badge-blue">{actionLabels[log.action] || log.action}</span></td>
                  <td><div><strong>{log.actorRole}</strong><small className="block">{log.actorUid}</small></div></td>
                  <td><strong>{log.entityType}</strong><small className="block">{log.entityId}</small></td>
                  <td><div className="flex items-center gap-2"><ClipboardList size={15} className="text-[#3E155C]" />{log.summary}</div></td>
                  <td className="admin-muted-cell">{log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={5}><div className="admin-table-empty">No audit records match your filters.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
