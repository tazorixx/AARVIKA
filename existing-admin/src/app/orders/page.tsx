"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  PackageOpen,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountShell from "@/components/account/AccountShell";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import AccountCard from "@/components/account/AccountCard";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerOrderStatusLabel, isCustomerCancellableStatus, normalizeCustomerOrderStatus } from "@/lib/checkout/cancellation";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

interface OrderSummary {
  id: string;
  status: string;
  items: Array<{
    cartKey: string;
    productId: string;
    title?: string;
    qty: number;
    priceAtAdd?: number;
    image?: string;
    deliveryDate?: string;
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    discount?: number;
    tax?: number;
    grandTotal: number;
  };
  cancellationAllowed?: boolean;
  statusLabel?: string;
  coupon?: { code?: string; discount?: number };
  refund?: { status?: string };
  address: {
    name: string;
    city: string;
    state: string;
  };
  createdAt?: string;
}

function getStatusBadge(status: string) {
  const normalized = normalizeCustomerOrderStatus(status);
  const label = getCustomerOrderStatusLabel(status);

  if (normalized === "confirmed") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/50"><CheckCircle2 size={12} /> {label}</span>;
  }
  if (normalized === "pending_payment") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200/50"><Clock size={12} /> {label}</span>;
  }
  if (normalized === "processing") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#f5fbff] px-2.5 py-1 text-[11px] font-bold text-[#2f628f] ring-1 ring-[#dcebf5]"><PackageOpen size={12} /> {label}</span>;
  }
  if (normalized === "shipped") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f8fd] px-2.5 py-1 text-[11px] font-bold text-[#214c72] ring-1 ring-[#e1edf5]"><Truck size={12} /> {label}</span>;
  }
  if (normalized === "delivered") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700"><CheckCircle2 size={12} /> {label}</span>;
  }
  if (normalized === "payment_failed" || normalized === "payment_setup_failed") {
    return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-[#bd1d52] ring-1 ring-red-100">{label}</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{label}</span>;
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    const authenticatedUser = user;
    let cancelled = false;

    async function fetchOrders() {
      try {
        setLoading(true);
        const token = await authenticatedUser.getIdToken();
        const res = await fetch("/api/account/orders", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Unable to fetch orders.");
        const data = await res.json();
        if (cancelled) return;
        setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error fetching orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-[#fffafd] px-4 py-20 text-center">
          <div className="mx-auto flex max-w-sm items-center justify-center gap-2.5 rounded-[14px] border border-[#e6edf2] bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
            <Loader2 className="animate-spin text-[#d92f66]" size={18} />
            Loading your orders…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-[linear-gradient(135deg,#fffafd,#f5fbff)] px-4 py-16">
          <section className="mx-auto max-w-lg rounded-[24px] border border-[#e5eef4] bg-white p-8 text-center shadow-[0_18px_55px_rgba(33,76,114,0.08)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5fbff] text-[#2f628f]">
              <PackageOpen size={28} />
            </div>
            <h1 className="gift-heading mt-6 text-3xl font-bold text-[#214c72]">
              Track your orders
            </h1>
            <p className="mx-auto mt-2 text-sm leading-6 text-slate-600">
              Sign in to view your purchases, delivery dates, and order history.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login?redirect=/orders"
                className="rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#bd1d52]"
              >
                Sign in to your account
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <AccountShell header={<AccountPageHeader eyebrow="My Gift4U" title={`Your Orders${orders.length > 0 ? ` (${orders.length})` : ""}`} description="Track every gift you’ve sent and every order on its way." icon={<PackageOpen size={24} />} action={<Link href="/products" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">Discover more gifts <ArrowRight size={14} /></Link>} />}>
      {error && <div className="mt-5 rounded-[10px] border border-red-100 bg-red-50 p-4 text-xs font-semibold text-[#bd1d52]">{error}</div>}
      {orders.length === 0 ? (
        <AccountCard className="mt-5 p-5 sm:p-7">
          <AccountEmptyState icon={<PackageOpen size={30} />} title="No orders yet" description="Your first celebration gift is just a few clicks away. Explore gifts by occasion or recipient." actions={<Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd1d52]">Start gifting <ArrowRight size={16} /></Link>} />
        </AccountCard>
      ) : (
        <div className="mt-5 space-y-4">
          {orders.map((order) => (
            <AccountCard key={order.id} className="group p-5 transition hover:border-[#2f628f]/30 hover:shadow-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-sm font-bold text-slate-800">{order.id}</span>{getStatusBadge(order.status)}</div>
                  <p className="text-xs text-slate-400">Placed on {formatDate(order.createdAt)} · Deliver to <strong>{order.address?.name || "Recipient"}</strong> ({order.address?.city || "Delivery address"})</p>
                </div>
                <div className="text-right"><p className="text-sm font-extrabold text-[#214c72]">{formatPrice(Number(order.totals.grandTotal || 0))}</p>{isCustomerCancellableStatus(order.status) && <p className="mt-1 text-[10px] font-semibold text-[#bd1d52]">Cancellation available</p>}<Link href={`/orders/${order.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#d92f66] group-hover:underline">View Receipt <ChevronRight size={13} /></Link></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2.5">{order.items.slice(0, 4).map((it, idx) => <div key={idx} className="relative h-14 w-14 overflow-hidden rounded-xl bg-[#f5fbff] ring-1 ring-slate-100">{it.image ? <img src={it.image} alt={it.title || "Gift"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xl">🎁</div>}{it.qty > 1 && <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#214c72] px-1 text-[9px] font-bold text-white">×{it.qty}</span>}</div>)}{order.items.length > 4 && <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#fbfcfd] text-xs font-bold text-slate-500 ring-1 ring-slate-200">+{order.items.length - 4}</div>}</div>
                <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#214c72] transition hover:border-[#214c72]">Track Order <ArrowRight size={13} /></Link>
              </div>
            </AccountCard>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
