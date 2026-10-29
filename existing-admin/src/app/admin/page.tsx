"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Gift,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase";

type DashboardData = {
  todayOrders: number;
  todayRevenue: number;
  statusCounts: Record<string, number>;
  lowStock: { id: string; title: string; thumbnail: string; quantity: number; reserved: number }[];
  recentOrders: { id: string; status: string; total: number; customerName: string; itemCount: number; createdAt: string | null }[];
  monthlySales: { key: string; label: string; orders: number; revenue: number }[];
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  monthChange: number;
};

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function statusTone(status: string) {
  if (["delivered", "confirmed"].includes(status)) return "green";
  if (["processing", "shipped"].includes(status)) return "blue";
  if (["cancelled", "payment_failed", "expired"].includes(status)) return "pink";
  return "gray";
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load dashboard.");
      if (active) setData(body as DashboardData);
    }
    const timer = window.setTimeout(() => load().catch((e) => active && setError(e instanceof Error ? e.message : "Unable to load dashboard.")), 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  if (error) {
    return <div className="admin-empty-state"><CircleAlert size={25} /><strong>Dashboard could not load</strong><p>{error}</p><Link href="/admin/orders" className="admin-primary-button">Open Orders</Link></div>;
  }

  if (!data) return <div className="admin-loading-state"><div className="admin-loading-spinner" /><p>Preparing your AARVIKA dashboard…</p></div>;

  const totalActiveOrders = (data.statusCounts.confirmed || 0) + (data.statusCounts.processing || 0) + (data.statusCounts.shipped || 0);
  const maxRevenue = Math.max(...data.monthlySales.map((item) => item.revenue), 1);
  const changePositive = data.monthChange >= 0;
  const goalPercent = data.previousMonthRevenue > 0 ? Math.min(100, Math.round((data.currentMonthRevenue / data.previousMonthRevenue) * 100)) : 0;

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <p className="admin-page-eyebrow">AARVIKA Operations</p>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-description">A clear view of orders, revenue, inventory and today&apos;s store activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="admin-secondary-button"><Plus size={16} /> Add Product</Link>
          <Link href="/admin/orders" className="admin-primary-button"><ShoppingBag size={16} /> Open Orders</Link>
        </div>
      </div>

      <section className="admin-stat-grid">
        <StatCard icon={<ShoppingBag size={19} />} label="Today&apos;s Orders" value={data.todayOrders.toLocaleString("en-IN")} note={`${totalActiveOrders} active fulfillment orders`} />
        <StatCard icon={<Gift size={19} />} label="Today&apos;s Revenue" value={money(data.todayRevenue)} note="Paid/confirmed orders today" pink />
        <StatCard icon={<Users size={19} />} label="Confirmed Orders" value={(data.statusCounts.confirmed || 0).toLocaleString("en-IN")} note={`${data.statusCounts.processing || 0} currently processing`} />
        <StatCard icon={<Package size={19} />} label="Low Stock" value={data.lowStock.length.toLocaleString("en-IN")} note="Products at or below 5 available" pink />
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-card admin-chart">
          <div className="admin-card-header">
            <div><h2 className="admin-card-title">Monthly Sales</h2><p className="admin-card-subtitle">Paid order revenue over the last 12 months</p></div>
            <Link href="/admin/analytics" className="admin-more-link">View analytics <ChevronRight size={14} /></Link>
          </div>
          <div className="admin-card-body">
            <div className="admin-chart-summary"><strong>{money(data.currentMonthRevenue)}</strong><span className={changePositive ? "admin-trend-up" : "admin-trend-down"}>{changePositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(data.monthChange).toFixed(1)}% vs last month</span></div>
            <div className="admin-chart-area">
              <div className="admin-chart-gridlines"><span className="admin-chart-gridline" /><span className="admin-chart-gridline" /><span className="admin-chart-gridline" /><span className="admin-chart-gridline" /></div>
              <div className="admin-chart-bars">
                {data.monthlySales.map((item, index) => <div className="admin-chart-bar-wrap" key={item.key}><div className={`admin-chart-bar${index % 3 === 1 ? " secondary" : ""}`} style={{ height: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%` }} title={`${item.label}: ${money(item.revenue)}`} /><span className="admin-chart-label">{item.label}</span></div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card admin-goal-card">
          <div className="admin-card-header"><div><h2 className="admin-card-title">Monthly Performance</h2><p className="admin-card-subtitle">Compared with the previous month</p></div><BarChart3 size={18} className="text-[var(--admin-blue)]" /></div>
          <div className="admin-card-body">
            <div className="admin-goal-ring"><span className="admin-goal-value">{goalPercent}%</span></div>
            <p className="admin-goal-note">{data.currentMonthRevenue===data.previousMonthRevenue?"Revenue matches":changePositive ? "Revenue is currently above" : "Revenue is currently below"} the previous month&apos;s paid-order revenue.</p>
          </div>
          <div className="admin-goal-metrics"><div className="admin-goal-metric"><span>Previous</span><strong>{money(data.previousMonthRevenue)}</strong></div><div className="admin-goal-metric"><span>This month</span><strong>{money(data.currentMonthRevenue)}</strong></div><div className="admin-goal-metric"><span>Change</span><strong className={changePositive ? "admin-trend-up" : "admin-trend-down"}>{changePositive ? "+" : "-"}{Math.abs(data.monthChange).toFixed(1)}%</strong></div></div>
        </div>
      </section>

      <section className="admin-bottom-grid">
        <div className="admin-card">
          <div className="admin-card-header"><div><h2 className="admin-card-title">Recent Orders</h2><p className="admin-card-subtitle">Latest customer orders and fulfillment status</p></div><Link href="/admin/orders" className="admin-more-link">View all <ChevronRight size={14} /></Link></div>
          <div className="admin-card-body admin-table-wrap" style={{ padding: "12px 0 0" }}>
            <table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td><span className="admin-order-id">{order.id}</span><small className="admin-table-secondary">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</small></td><td>{order.customerName}</td><td><span className={`admin-status ${statusTone(order.status)}`}>{order.status.replaceAll("_", " ")}</span></td><td className="font-bold">{money(order.total)}</td><td className="text-[var(--admin-muted)]">{formatDate(order.createdAt)}</td></tr>)}</tbody></table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><div><h2 className="admin-card-title">Inventory Alerts</h2><p className="admin-card-subtitle">Products that need attention</p></div><Link href="/admin/inventory" className="admin-more-link">Manage <ChevronRight size={14} /></Link></div>
          <div className="admin-card-body"><div className="admin-stock-list">{data.lowStock.slice(0, 5).map((item) => <div className="admin-stock-item" key={item.id}><span className="admin-stock-thumb">{item.thumbnail ? <img src={item.thumbnail} alt="" className="h-full w-full rounded-[10px] object-cover" /> : <Package size={18} />}</span><div className="admin-stock-copy"><strong>{item.title}</strong><small>{item.quantity} in stock · {item.reserved} reserved</small></div><span className="admin-stock-count">{Math.max(0, item.quantity - item.reserved)} left</span></div>)}{data.lowStock.length === 0 && <div className="admin-empty-inline"><Sparkles size={17} /> Inventory looks healthy.</div>}</div></div>
        </div>
      </section>

      <section className="admin-card" style={{ marginTop: 18 }}>
        <div className="admin-card-header"><div><h2 className="admin-card-title">Quick Actions</h2><p className="admin-card-subtitle">Jump directly into the tasks you use most</p></div></div>
        <div className="admin-card-body"><div className="admin-quick-grid">
          <QuickAction href="/admin/products/new" icon={<Package size={18} />} title="Add Product" note="Create catalog item" />
          <QuickAction href="/admin/orders" icon={<ShoppingBag size={18} />} title="Manage Orders" note="Review fulfillment" />
          <QuickAction href="/admin/inventory" icon={<ClipboardList size={18} />} title="Check Inventory" note="Review stock levels" />
          <QuickAction href="/admin/coupons" icon={<Tag size={18} />} title="Manage Coupons" note="Offers and discounts" />
          <QuickAction href="/admin/shipping" icon={<Truck size={18} />} title="Shipping" note="Track shipments" />
          <QuickAction href="/admin/homepage" icon={<Sparkles size={18} />} title="Homepage" note="Update storefront content" />
        </div></div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, note, pink }: { icon: React.ReactNode; label: string; value: string; note: string; pink?: boolean }) {
  return <div className="admin-card admin-stat-card"><div className="admin-stat-top"><span className={`admin-stat-icon${pink ? " pink" : ""}`}>{icon}</span><span className="admin-stat-label">{label}</span></div><div className="admin-stat-value">{value}</div><div className="admin-stat-foot"><span className="admin-trend-up">●</span>{note}</div></div>;
}

function QuickAction({ href, icon, title, note }: { href: string; icon: React.ReactNode; title: string; note: string }) {
  return <Link href={href} className="admin-quick-action"><span className="admin-quick-icon">{icon}</span><span><strong>{title}</strong><small>{note}</small></span><ChevronRight size={15} className="ml-auto text-[var(--admin-muted)]" /></Link>;
}
