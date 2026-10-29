"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { ShieldCheck, UserPlus, Search, RefreshCw, MoreHorizontal, X, CheckCircle2, Ban } from "lucide-react";

type Role = "SUPER_ADMIN" | "ADMIN" | "CATALOG_MANAGER" | "ORDER_MANAGER" | "SUPPORT";
type AdminUser = { uid: string; name: string; email: string; role: Role; disabled: boolean; emailVerified: boolean; createdAt: string | null; lastSignInAt: string | null };

const roleLabels: Record<Role, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", CATALOG_MANAGER: "Catalog Manager", ORDER_MANAGER: "Order Manager", SUPPORT: "Support" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" as Role });

  async function request(path: string, init?: RequestInit) {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");
    const token = await user.getIdToken();
    const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function load() {
    setLoading(true); setError("");
    try { const data = await request("/api/admin/admin-users"); setUsers(data.users || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load admin accounts."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void Promise.resolve().then(() => load()); }, []);

  async function create(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await request("/api/admin/admin-users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "ADMIN" }); setOpen(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create admin account."); }
    finally { setSaving(false); }
  }

  async function updateUser(uid: string, patch: Partial<Pick<AdminUser, "role" | "disabled" | "name">>) {
    setSaving(true); setError("");
    try { await request("/api/admin/admin-users", { method: "PATCH", body: JSON.stringify({ uid, ...patch }) }); setMenu(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update account."); }
    finally { setSaving(false); }
  }

  const filtered = useMemo(() => users.filter((user) => {
    const query = q.trim().toLowerCase();
    return (!query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.uid.toLowerCase().includes(query)) &&
      (role === "all" || user.role === role) && (status === "all" || (status === "active" ? !user.disabled : user.disabled));
  }), [users, q, role, status]);

  return <div>
    <div className="admin-page-heading">
      <div><p className="admin-eyebrow">Administration</p><h1 className="admin-page-title">Admin users</h1><p className="admin-page-description">Manage authorized AARVIKA staff accounts and access roles.</p></div>
      <div className="admin-page-actions"><button className="admin-secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button><button className="admin-primary-button" onClick={() => setOpen(true)}><UserPlus size={17} /> New admin account</button></div>
    </div>

    <div className="admin-stat-grid admin-stat-grid-4"><div className="admin-card admin-stat-card"><span className="admin-stat-label">Total admins</span><strong className="admin-stat-value">{users.length}</strong></div><div className="admin-card admin-stat-card"><span className="admin-stat-label">Active</span><strong className="admin-stat-value">{users.filter((u) => !u.disabled).length}</strong></div><div className="admin-card admin-stat-card"><span className="admin-stat-label">Super admins</span><strong className="admin-stat-value">{users.filter((u) => u.role === "SUPER_ADMIN").length}</strong></div><div className="admin-card admin-stat-card"><span className="admin-stat-label">Disabled</span><strong className="admin-stat-value">{users.filter((u) => u.disabled).length}</strong></div></div>

    <section className="admin-card admin-table-card">
      <div className="admin-table-toolbar"><div className="admin-table-search"><Search size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or UID..." /></div><select className="admin-filter-select" value={role} onChange={(e) => setRole(e.target.value as "all" | Role)}><option value="all">All roles</option>{Object.keys(roleLabels).map((r) => <option key={r} value={r}>{roleLabels[r as Role]}</option>)}</select><select className="admin-filter-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="all">All status</option><option value="active">Active</option><option value="disabled">Disabled</option></select></div>
      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Last sign in</th><th className="admin-table-actions-head">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={5}><div className="admin-table-empty">Loading admin accounts…</div></td></tr> : filtered.map((user) => <tr key={user.uid}><td><div className="admin-user-cell"><span className="admin-user-avatar">{user.name.slice(0,1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><span className="admin-badge admin-badge-blue">{roleLabels[user.role]}</span></td><td><span className={`admin-badge ${user.disabled ? "admin-badge-muted" : "admin-badge-green"}`}>{user.disabled ? "Disabled" : "Active"}</span></td><td className="admin-muted-cell">{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never"}</td><td className="admin-table-actions"><div className="admin-row-menu"><button className="admin-icon-button" onClick={() => setMenu(menu === user.uid ? null : user.uid)} aria-label={`Actions for ${user.name}`}><MoreHorizontal size={18} /></button>{menu === user.uid && <div className="admin-row-popover"><button onClick={() => void updateUser(user.uid, { disabled: !user.disabled })}>{user.disabled ? <><CheckCircle2 size={15} /> Enable account</> : <><Ban size={15} /> Disable account</>}</button><label><span>Change role</span><select value={user.role} onChange={(e) => void updateUser(user.uid, { role: e.target.value as Role })}>{Object.keys(roleLabels).map((r) => <option key={r} value={r}>{roleLabels[r as Role]}</option>)}</select></label></div>}</div></td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={5}><div className="admin-table-empty">No admin accounts match your filters.</div></td></tr>}</tbody></table></div>
    </section>

    {open && <div className="admin-modal-backdrop" onMouseDown={() => !saving && setOpen(false)}><div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}><div className="admin-modal-head"><div><p className="admin-eyebrow">Access management</p><h2>Create admin account</h2><p>Creates a Firebase Authentication account and assigns its AARVIKA admin role.</p></div><button className="admin-icon-button" onClick={() => setOpen(false)} disabled={saving}><X size={18} /></button></div><form onSubmit={create} className="admin-form-grid"><label><span>Full name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admin name" /></label><label><span>Email address</span><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@aarvika.invalid" /></label><label><span>Temporary password</span><input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label><label><span>Admin role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>{Object.keys(roleLabels).map((r) => <option key={r} value={r}>{roleLabels[r as Role]}</option>)}</select></label><div className="admin-modal-footer"><span><ShieldCheck size={16} /> Only SUPER_ADMIN can create or change admin access.</span><button className="admin-primary-button" disabled={saving}>{saving ? "Creating…" : "Create account"}</button></div></form></div></div>}
  </div>;
}
