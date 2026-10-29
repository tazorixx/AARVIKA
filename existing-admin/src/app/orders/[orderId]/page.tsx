"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import AccountNav from "@/components/account/AccountNav";
import { useAuth } from "@/hooks/useAuth";
import {
  CUSTOMER_TIMELINE_STEPS,
  getCustomerOrderStatusLabel,
  getTimelineProgress,
  isCustomerCancellableStatus,
  isCustomerOrderTerminal,
} from "@/lib/checkout/cancellation";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDate(value?: string) {
  if (!value) return "Scheduled delivery";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

interface OrderDetail {
  id: string;
  status: string;
  items: Array<{
    cartKey: string;
    productId: string;
    title?: string;
    qty: number;
    priceAtAdd?: number;
    image?: string;
    variant?: string;
    personalization?: Record<string, string>;
    giftMessage?: string;
    deliveryDate?: string;
    deliverySlot?: string;
    deliveryFee?: number;
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    discount?: number;
    tax?: number;
    grandTotal: number;
  };
  address: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    label?: string;
  };
  payment?: {
    provider?: string;
    paymentId?: string;
    orderId?: string;
    status?: string;
    paidAt?: string;
  };
  coupon?: { code?: string; discount?: number };
  refund?: { status?: string; amount?: number; processedAt?: string };
  statusLabel?: string;
  cancellationAllowed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = `/login?redirect=/orders/${orderId}`;
      return;
    }

    const authenticatedUser = user;
    let cancelled = false;

    async function loadOrder() {
      try {
        setLoading(true);
        const token = await authenticatedUser.getIdToken();
        const res = await fetch(`/api/account/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Unable to load order details.");
        }

        const data = await res.json();
        if (cancelled) return;
        setOrder(data.order);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error loading order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrder();
    const poll = window.setInterval(() => {
      void loadOrder();
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [authLoading, user, orderId]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-[#fffafd] px-4 py-16">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-[14px] border border-[#e6edf2] bg-white p-12 text-sm font-semibold text-slate-500 shadow-sm">
            <Loader2 className="animate-spin text-[#d92f66]" size={20} />
            Loading your order confirmation…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-[#fffafd] px-4 py-16">
          <div className="mx-auto max-w-xl rounded-[14px] border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="gift-heading text-2xl font-bold text-[#214c72]">Order Not Found</h1>
            <p className="mt-2 text-sm text-slate-500">{error || "This order could not be located."}</p>
            <Link
              href="/orders"
              className="mt-6 inline-flex rounded-full bg-[#d92f66] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#bd1d52]"
            >
              View all orders
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (order.status === "pending_payment") {
    return (
      <>
        <Header />
        <Breadcrumb currentPage={`Payment for ${order.id}`} />
        <div className="mx-auto max-w-4xl px-4 pt-4 sm:pt-6">
          <AccountNav />
        </div>
        <main className="min-h-[70vh] bg-[linear-gradient(180deg,#fffafd_0%,#ffffff_45%,#f5fbff_100%)] px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-xl rounded-[20px] border border-[#e6edf2] bg-white p-8 text-center shadow-[0_18px_55px_rgba(33,76,114,0.08)] sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f5fbff] text-[#2f628f]">
              <Loader2 className="animate-spin" size={30} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#d92f66]">Payment processing</p>
            <h1 className="gift-heading mt-2 text-3xl font-bold text-[#214c72]">We’re confirming your payment</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your payment response was received. We’re waiting for Razorpay’s secure confirmation. This page will update automatically.
            </p>
            <p className="mt-4 font-mono text-xs text-slate-400">Order ID: {order.id}</p>
            {error && (
              <div className="mt-5 rounded-[12px] border border-red-100 bg-red-50 p-3 text-xs font-semibold text-[#bd1d52]">
                {error}
              </div>
            )}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {isCustomerCancellableStatus(order.status) && (
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#f0cbd7] bg-white px-5 py-2.5 text-xs font-bold text-[#bd1d52] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  {cancelling ? "Cancelling…" : "Cancel order"}
                </button>
              )}
              <Link href="/orders" className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-[#214c72]">View orders</Link>
              <Link href="/products" className="rounded-full bg-[#d92f66] px-5 py-2.5 text-xs font-bold text-white">Continue shopping</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  async function cancelOrder() {
    const currentOrder = order;
    if (!currentOrder || !isCustomerCancellableStatus(currentOrder.status) || cancelling) return;

    const confirmed = window.confirm(
      "Cancel this order? Your reserved inventory will be released and this payment attempt will be cancelled."
    );
    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");
      const token = await user!.getIdToken();
      const response = await fetch("/api/checkout/cancel-order", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: currentOrder.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to cancel this order.");
      }

      setOrder((current) =>
        current
          ? { ...current, status: "cancelled" }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  if (isCustomerOrderTerminal(order.status)) {
    const title = order.status === "expired"
      ? "Payment window expired"
      : order.status === "cancelled"
        ? "Order cancelled"
        : order.status === "payment_setup_failed"
          ? "Payment could not be started"
          : "Payment was not completed";
    const message = order.status === "cancelled"
      ? "This order was cancelled before payment was completed. Any checkout reservations have been released."
      : "This payment attempt is no longer active. Any checkout reservations have been released, and you can return to the catalog and try again.";
    return (
      <>
        <Header />
        <Breadcrumb currentPage={`Order ${order.id}`} />
        <div className="mx-auto max-w-4xl px-4 pt-4 sm:pt-6">
          <AccountNav />
        </div>
        <main className="min-h-[70vh] bg-[#fffafd] px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-xl rounded-[20px] border border-[#f0dfe6] bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff4f7] text-[#d92f66]">
              <Clock size={30} />
            </div>
            <h1 className="gift-heading mt-5 text-3xl font-bold text-[#214c72]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
            <Link href="/products" className="mt-7 inline-flex rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white">Choose another gift</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Breadcrumb currentPage={`Order ${order.id}`} />
      <div className="mx-auto max-w-4xl px-4 pt-4 sm:pt-6">
        <AccountNav />
      </div>

      <main className="min-h-screen bg-[linear-gradient(180deg,#fffafd_0%,#ffffff_45%,#f5fbff_100%)] px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Confirmation Header Banner */}
          <div className="overflow-hidden rounded-[20px] border border-[#f0dfe6] bg-white p-6 shadow-[0_12px_40px_rgba(217,47,102,0.06)] sm:p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[#d92f66] shadow-sm ring-1 ring-[#f8dce5]">
                <CheckCircle2 size={34} />
              </div>
              <div className="mt-4 flex-1 sm:mt-0">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f8fd] px-3.5 py-1 text-xs font-bold text-[#214c72]">
                    <Sparkles size={13} className="text-[#d92f66]" />
                    Order Placed Successfully
                  </span>
                  <span className="text-xs text-slate-400">
                    Order ID: <strong className="text-slate-700">{order.id}</strong>
                  </span>
                </div>
                <h1 className="gift-heading mt-3 text-3xl font-bold text-[#214c72] sm:text-4xl">
                  Thank you for your order!
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We are preparing your gift with great care. A confirmation has been registered for{" "}
                  <strong>{order.address.name}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
            {/* Items & Delivery Details */}
            <div className="space-y-6">
              <section className="rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm sm:p-6">
                <h2 className="gift-heading text-xl font-bold text-[#214c72]">
                  Gifts in this order ({order.items.length})
                </h2>

                <div className="mt-4 space-y-4">
                  {order.items.map((item) => (
                    <article
                      key={item.cartKey}
                      className="rounded-[14px] border border-slate-100 bg-[#fbfcfd] p-4"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f5fbff]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title || "Gift"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-3xl">🎁</div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-slate-800">
                            {item.title || item.productId}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Quantity: <strong>{item.qty}</strong>
                            {item.variant ? ` · ${item.variant}` : ""}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#214c72]">
                            {formatPrice(Number(item.priceAtAdd || 0) * item.qty)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-[#d92f66]" />
                          <span>Delivery: {formatDate(item.deliveryDate)}</span>
                        </div>
                        {item.deliverySlot && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#2f628f]" />
                            <span>Slot: {item.deliverySlot}</span>
                          </div>
                        )}
                      </div>

                      {item.giftMessage && (
                        <div className="mt-2.5 rounded-lg bg-[#fffafd] p-2.5 text-xs text-[#bd1d52] ring-1 ring-[#f3e5eb]">
                          <span className="font-bold">Gift Message:</span> &ldquo;{item.giftMessage}&rdquo;
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              {/* Delivery Address Details */}
              <section className="rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 text-sm font-bold text-[#214c72]">
                  <MapPin size={16} className="text-[#d92f66]" />
                  <span>Delivery Address</span>
                </div>
                <div className="mt-3 text-xs leading-5 text-slate-600">
                  <p className="font-bold text-slate-800">{order.address.name}</p>
                  <p className="mt-0.5">
                    {order.address.addressLine}, {order.address.city}, {order.address.state} —{" "}
                    {order.address.pincode}
                  </p>
                  <p className="mt-1 text-slate-500">Phone: {order.address.phone}</p>
                </div>
              </section>
            </div>

            {/* Price & Summary Breakdown */}
            <aside className="space-y-6">
              <details className="group rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <h2 className="gift-heading text-lg font-bold text-[#214c72]">Order timeline</h2>
                    <p className="mt-1 text-[11px] text-slate-400">Current status: {order.statusLabel || getCustomerOrderStatusLabel(order.status)}</p>
                  </div>
                  <span className="text-xs font-bold text-[#d92f66] group-open:rotate-90">›</span>
                </summary>
                <div className="mt-5 space-y-3">
                  {CUSTOMER_TIMELINE_STEPS.map((step, index) => {
                    const progress = getTimelineProgress(order.status);
                    const done = index < progress;
                    const current = index === progress - 1;
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${done ? "bg-[#d92f66] text-white" : "bg-[#f5fbff] text-slate-400 ring-1 ring-[#dcebf5]"}`}>
                          {done ? "✓" : index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${done ? "text-[#214c72]" : "text-slate-400"}`}>{step.label}{current ? " · Current" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                  {isCustomerOrderTerminal(order.status) && (
                    <div className="mt-2 rounded-lg bg-[#fff4f7] p-3 text-[11px] font-semibold text-[#bd1d52]">
                      {getCustomerOrderStatusLabel(order.status)}
                    </div>
                  )}
                </div>
              </details>
              <div className="rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm">
                <h2 className="gift-heading text-lg font-bold text-[#214c72]">
                  Payment details
                </h2>

                <div className="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span>{formatPrice(order.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span>
                      {Number(order.totals.delivery || 0) > 0 ? formatPrice(Number(order.totals.delivery || 0)) : "Free"}
                    </span>
                  </div>
                  {Number(order.totals.discount || order.coupon?.discount || 0) > 0 && (
                    <div className="flex justify-between text-[#bd1d52]">
                      <span>Discount{order.coupon?.code ? ` (${order.coupon.code})` : ""}</span>
                      <span>-{formatPrice(Number(order.totals.discount || order.coupon?.discount || 0))}</span>
                    </div>
                  )}
                  {Number(order.totals.tax || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(Number(order.totals.tax || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-800">
                    <span>{order.payment?.status === "captured" ? "Total Paid" : "Order Total"}</span>
                    <span className="text-sm font-extrabold text-[#d92f66]">
                      {formatPrice(order.totals.grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  <p>Payment Status: {order.payment?.status || (order.status === "confirmed" ? "captured" : getCustomerOrderStatusLabel(order.status))}</p>
                  {order.payment?.paymentId && (
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                      Payment Ref: {order.payment.paymentId}
                    </p>
                  )}
                </div>

                {order.refund?.status && (
                  <div className="mt-4 rounded-lg bg-[#f5fbff] p-3 text-[11px] font-semibold text-[#214c72]">
                    Refund status: {order.refund.status}
                    {order.refund.amount !== undefined ? ` · ${formatPrice(Number(order.refund.amount))}` : ""}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/products"
                    className="flex items-center justify-center gap-1.5 rounded-full bg-[#d92f66] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#bd1d52]"
                  >
                    <ShoppingBag size={14} /> Send another gift
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#214c72] transition hover:border-[#214c72]"
                  >
                    <Package size={14} /> View all orders
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
