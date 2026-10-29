"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Tag,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { getAccountCart } from "@/lib/cart/client";
import { getCartQuantity, type CartItem } from "@/lib/cart/types";
import type { CheckoutAddress, CheckoutDeliverySelection, DeliveryValidationResponse } from "@/lib/checkout/types";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

type Address = CheckoutAddress & { id: string; isDefault?: boolean };

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}


interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
  mock?: boolean;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}


const CHECKOUT_REQUEST_ID_KEY = "gift4u:checkout-request-id";

function createCheckoutRequestId() {
  const random = typeof window !== "undefined" && window.crypto?.randomUUID
    ? window.crypto.randomUUID().replace(/-/g, "")
    : `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `web_${Date.now().toString(36)}_${random.slice(0, 32)}`;
}

function getOrCreateCheckoutRequestId() {
  if (typeof window === "undefined") return createCheckoutRequestId();
  const existing = window.sessionStorage.getItem(CHECKOUT_REQUEST_ID_KEY)?.trim();
  if (existing) return existing;
  const created = createCheckoutRequestId();
  window.sessionStorage.setItem(CHECKOUT_REQUEST_ID_KEY, created);
  return created;
}

function clearCheckoutRequestId() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(CHECKOUT_REQUEST_ID_KEY);
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState<Record<string, { date: string; slot: string }>>({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState<DeliveryValidationResponse | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = "/login?redirect=/checkout";
      return;
    }

    const authenticatedUser = user;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const token = await authenticatedUser.getIdToken();
        const [cart, addressResponse] = await Promise.all([
          getAccountCart(authenticatedUser),
          fetch("/api/account/addresses", {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        if (!addressResponse.ok) throw new Error("Unable to load your saved addresses.");
        const data = (await addressResponse.json()) as { addresses?: Address[] };
        if (cancelled) return;

        setItems(cart);
        const nextAddresses = data.addresses || [];
        setAddresses(nextAddresses);
        const defaultAddress = nextAddresses.find((address) => address.isDefault) || nextAddresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setPincode(defaultAddress.pincode);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load checkout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const next: Record<string, { date: string; slot: string }> = {};
    for (const item of items) {
      next[item.cartKey] = {
        date: item.deliveryDate || "",
        slot: item.deliverySlot || "",
      };
    }
    Promise.resolve().then(() => setDelivery(next));
  }, [items]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.priceAtAdd || 0) * getCartQuantity(item), 0),
    [items]
  );
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);

  function chooseAddress(id: string) {
    const address = addresses.find((candidate) => candidate.id === id);
    setSelectedAddressId(id);
    setPincode(address?.pincode || "");
    setValidated(null);
    setError("");
  }

  function updateDelivery(cartKey: string, field: "date" | "slot", value: string) {
    setDelivery((current) => ({
      ...current,
      [cartKey]: {
        date: current[cartKey]?.date || "",
        slot: current[cartKey]?.slot || "",
        [field]: value,
      },
    }));
    setValidated(null);
    setError("");
  }

  async function applyCoupon() {
    if (!user) return;
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.valid) throw new Error(data.error || "Unable to apply coupon.");
      setCouponCode(data.code || code);
      setCouponApplied(true);
      setValidated(null);
    } catch (couponValidationError) {
      setCouponApplied(false);
      setCouponError(couponValidationError instanceof Error ? couponValidationError.message : "Unable to apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponApplied(false);
    setCouponError("");
    setValidated(null);
  }

  const stepLabels = ["Delivery", "Personalization", "Payment", "Confirmation"] as const;

  function hasCompleteDeliverySelection() {
    if (!selectedAddress || !/^\d{6}$/.test(pincode.trim())) return false;
    return items.every((item) => Boolean(delivery[item.cartKey]?.date && delivery[item.cartKey]?.slot));
  }

  async function continueFromDelivery() {
    const result = await validateDelivery();
    if (result) setCurrentStep(2);
  }

  function continueFromPersonalization() {
    setError("");
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackStep() {
    setError("");
    setCurrentStep((step) => (step === 3 ? 2 : 1));
  }

  async function validateDelivery(): Promise<DeliveryValidationResponse | null> {
    if (!user) return null;
    setError("");
    if (!selectedAddress) {
      setError("Choose or add a delivery address first.");
      return null;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError("Enter a valid 6-digit delivery pincode.");
      return null;
    }

    const selections: CheckoutDeliverySelection[] = items.map((item) => ({
      cartKey: item.cartKey,
      pincode: pincode.trim(),
      date: delivery[item.cartKey]?.date || item.deliveryDate || "",
      slot: delivery[item.cartKey]?.slot || item.deliverySlot || "",
    }));

    setValidating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkout/delivery", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: { ...selectedAddress, pincode: pincode.trim() },
          delivery: selections,
          couponCode: couponApplied ? couponCode : undefined,
        }),
        cache: "no-store",
      });

      const data = (await response.json()) as DeliveryValidationResponse & { error?: string };
      if (!response.ok || !data.valid) {
        throw new Error(data.error || "Unable to validate delivery.");
      }

      setValidated(data);
      return data;
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Unable to validate delivery.");
      return null;
    } finally {
      setValidating(false);
    }
  }

  async function handlePayment() {
    if (!user) return;
    setError("");

    // 1. Ensure delivery details are verified
    let validationResult = validated;
    if (!validationResult) {
      validationResult = await validateDelivery();
      if (!validationResult) return;
    }

    if (!selectedAddress) {
      setError("Choose a delivery address.");
      return;
    }

    setPaying(true);
    let browserCallbackReceived = false;

    try {
      const token = await user.getIdToken();
      const selections: CheckoutDeliverySelection[] = items.map((item) => ({
        cartKey: item.cartKey,
        pincode: pincode.trim(),
        date: delivery[item.cartKey]?.date || item.deliveryDate || "",
        slot: delivery[item.cartKey]?.slot || item.deliverySlot || "",
      }));

      // 2. Persist an idempotency key before dispatch. If the server creates
      // the order but this HTTP response is lost, retrying reuses the same key
      // and recovers the first order instead of reserving a second one.
      const clientRequestId = getOrCreateCheckoutRequestId();
      const orderRes = await fetch("/api/checkout/order", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: { ...selectedAddress, pincode: pincode.trim() },
          delivery: selections,
          couponCode: couponApplied ? couponCode : undefined,
          clientRequestId,
        }),
      });

      const orderData = await orderRes.json() as {
        ok?: boolean;
        error?: string;
        code?: string;
        orderId?: string;
        recovered?: boolean;
        checkoutIntentChanged?: boolean;
        orderStatus?: string;
        razorpayOrder?: RazorpayOrderResponse;
        customer?: { name?: string; email?: string; phone?: string };
      };
      if (!orderRes.ok || !orderData.ok || !orderData.orderId || !orderData.razorpayOrder) {
        if (["PAYMENT_SETUP_FAILED", "CHECKOUT_ATTEMPT_FAILED"].includes(orderData.code || "")) {
          clearCheckoutRequestId();
        }
        if (["CHECKOUT_ATTEMPT_IN_PROGRESS", "CHECKOUT_ATTEMPT_INCOMPLETE"].includes(orderData.code || "")) {
          throw new Error("Gift4U is still preparing your previous payment attempt. Wait a moment and tap Pay again; a second order will not be created.");
        }
        throw new Error(orderData.error || "Failed to create order. Please try again.");
      }

      const { orderId, razorpayOrder, customer } = orderData as {
        orderId: string;
        razorpayOrder: RazorpayOrderResponse;
        customer?: { name?: string; email?: string; phone?: string };
        checkoutIntentChanged?: boolean;
        recovered?: boolean;
        orderStatus?: string;
      };
      if (orderData.checkoutIntentChanged || (orderData.recovered && orderData.orderStatus && orderData.orderStatus !== "pending_payment")) {
        clearCheckoutRequestId();
        window.location.href = `/orders/${orderId}`;
        return;
      }

      // 3. Handle local test/mock mode if keys are not configured in environment
      if (razorpayOrder.mock) {
        const verifyRes = await fetch("/api/checkout/verify-payment", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature_approved",
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.ok) {
          throw new Error(verifyData.error || "Payment verification failed.");
        }

        clearCheckoutRequestId();
        window.location.href = `/orders/${orderId}?success=true`;
        return;
      }

      // 4. Live Razorpay Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error("Unable to load payment gateway. Please check your internet connection.");
      }

      const options: RazorpayOptions = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Gift4U",
        description: `Order ${orderId}`,
        order_id: razorpayOrder.id,
        handler: async (_response: RazorpaySuccessResponse) => {
          // The browser callback is not payment authority. Razorpay's webhook
          // confirms the payment asynchronously; show processing immediately.
          browserCallbackReceived = true;
          clearCheckoutRequestId();
          window.location.href = `/orders/${orderId}?payment=processing`;
        },
        modal: {
          ondismiss: () => {
            // If Razorpay has already called the browser success handler, do not
            // race the webhook by cancelling the still-pending order.
            if (browserCallbackReceived) return;

            // Otherwise the customer closed the payment modal before success.
            void fetch("/api/checkout/cancel-order", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderId }),
            }).then((response) => {
              // Only discard the idempotency key after the backend confirms
              // cancellation. If cancellation is uncertain, a retry must recover
              // this same pending order rather than reserve a second one.
              if (response.ok) clearCheckoutRequestId();
            }).catch(() => undefined);
            setPaying(false);
          },
        },
        prefill: {
          name: customer?.name || "",
          email: customer?.email || "",
          contact: customer?.phone || "",
        },
        theme: {
          color: "#d92f66",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "An error occurred while preparing payment.");
      setPaying(false);
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-[#fffafd] px-4 py-16">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-[14px] border border-[#e6edf2] bg-white p-10 text-sm font-semibold text-slate-500 shadow-sm">
            <Loader2 className="animate-spin text-[#d92f66]" size={20} />
            Loading your checkout…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!items.length) {
    return (
      <>
        <Header />
        <Breadcrumb currentPage="Checkout" />
        <main className="min-h-[60vh] bg-[#fffafd] px-4 py-12">
          <div className="mx-auto max-w-2xl rounded-[14px] border border-[#e6edf2] bg-white p-8 text-center shadow-sm">
            <ShoppingBag className="mx-auto text-[#2f628f]" size={40} />
            <h1 className="gift-heading mt-4 text-3xl font-bold text-[#214c72]">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Select a thoughtful gift before beginning checkout.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#bd1d52]"
            >
              Discover gifts <ChevronRight size={16} />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const grandTotal = validated?.totals.grandTotal ?? subtotal;

  return (
    <>
      <Header />
      <Breadcrumb currentPage="Checkout" />

      <main className="min-h-[70vh] bg-[linear-gradient(180deg,#fffafd_0%,#f5fbff_100%)] pb-24 pt-6 lg:pb-16 lg:pt-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#214c72] transition hover:border-[#214c72]"
              >
                <ArrowLeft size={14} /> Back to Cart
              </Link>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#d92f66]">
                  Safe & Secure Checkout
                </p>
                <h1 className="gift-heading text-3xl font-bold text-[#214c72] sm:text-4xl">
                  Checkout
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>100% Secure Payment</span>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto rounded-[18px] border border-[#dfeaf1] bg-white/95 p-3 shadow-[0_12px_35px_rgba(33,76,114,0.06)] backdrop-blur">
            <div className="grid min-w-[620px] grid-cols-4 gap-2 rounded-[14px] bg-[#f8fbfd] p-1">
              {stepLabels.map((label, index) => {
                const step = index + 1;
                const active = currentStep === step || (step === 4 && paying);
                const complete = currentStep > step;
                return (
                  <div key={label} className="flex items-center gap-2 rounded-[14px] px-3 py-2.5">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                      active || complete ? "bg-[#d92f66] text-white" : "bg-[#f5fbff] text-[#2f628f]"
                    }`}>
                      {complete ? <Check size={15} /> : step}
                    </span>
                    <span className={`text-xs font-bold ${active || complete ? "text-[#214c72]" : "text-slate-400"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-[#bd1d52]"
            >
              {error}
            </div>
          )}

          {validated && (
            <div className="mb-6 flex items-start gap-3 rounded-[14px] border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
              <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p>Delivery verified for all items.</p>
                <p className="mt-0.5 text-xs font-normal text-emerald-700">
                  Ready to proceed to payment. Total: {formatPrice(validated.totals.grandTotal)}.
                </p>
              </div>
            </div>
          )}

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              {currentStep === 1 && (
                <>
              {/* Delivery Address Section */}
              <section className="rounded-[18px] border border-[#dfeaf1] bg-white/95 p-5 shadow-[0_10px_32px_rgba(33,76,114,0.055)] md:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5fbff] text-[#2f628f]">
                    <MapPin size={19} />
                  </div>
                  <div>
                    <h2 className="gift-heading text-2xl font-bold text-[#214c72]">
                      1. Delivery destination
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Choose where this gift should be delivered.
                    </p>
                  </div>
                </div>

                {addresses.length ? (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => chooseAddress(address.id)}
                        className={`rounded-[14px] border p-4 text-left transition ${
                          selectedAddressId === address.id
                            ? "border-[#d92f66] bg-[#fffafd] shadow-sm"
                            : "border-slate-200 bg-white hover:border-[#2f628f]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wide text-[#214c72]">
                            {address.label || "Address"}
                          </span>
                          {selectedAddressId === address.id && (
                            <Check size={16} className="text-[#d92f66]" />
                          )}
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-800">
                          {address.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {address.addressLine}, {address.city}, {address.state} — {address.pincode}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400">
                          📞 {address.phone}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[14px] border border-dashed border-[#dbe8ef] bg-[#f5fbff] p-6 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No saved addresses found.
                    </p>
                    <Link
                      href="/account/addresses"
                      className="mt-3 inline-flex rounded-full bg-[#2f628f] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#214c72]"
                    >
                      Add delivery address
                    </Link>
                  </div>
                )}

                {selectedAddress && (
                  <div className="mt-5 rounded-[14px] border border-[#e6edf2] bg-[#f5fbff] p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#214c72]">
                      Confirm 6-Digit PIN Code
                      <input
                        value={pincode}
                        onChange={(event) => {
                          setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                          setValidated(null);
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2f628f]"
                      />
                    </label>
                  </div>
                )}
              </section>

              {/* Delivery Slots Section */}
              <section className="rounded-[18px] border border-[#dfeaf1] bg-white/95 p-5 shadow-[0_10px_32px_rgba(33,76,114,0.055)] md:p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[#d92f66]">
                    <Truck size={19} />
                  </div>
                  <div>
                    <h2 className="gift-heading text-2xl font-bold text-[#214c72]">
                      2. Delivery date & time slot
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Specify the celebration timing for each gift in your order.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.cartKey}
                      className="rounded-[16px] border border-[#e4edf2] bg-[#fbfdfe] p-4 transition hover:-translate-y-0.5 hover:border-[#cfe1eb] hover:shadow-[0_10px_24px_rgba(33,76,114,0.06)]"
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
                            <div className="grid h-full place-items-center text-[#2f628f]">
                              <ShoppingBag size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800">
                            {item.title || item.productId}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Qty {getCartQuantity(item)}
                            {item.variant ? ` · ${item.variant}` : ""}
                          </p>
                          {item.giftMessage && (
                            <p className="mt-1 line-clamp-1 text-[11px] italic text-[#d92f66]">
                              Card: &ldquo;{item.giftMessage}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-bold text-[#214c72]">
                          Delivery date
                          <div className="relative mt-1.5">
                            <CalendarDays
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                              size={15}
                            />
                            <input
                              type="date"
                              value={delivery[item.cartKey]?.date || ""}
                              onChange={(event) => updateDelivery(item.cartKey, "date", event.target.value)}
                              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#2f628f]"
                            />
                          </div>
                        </label>

                        <label className="text-xs font-bold text-[#214c72]">
                          Preferred time slot
                          <select
                            value={delivery[item.cartKey]?.slot || ""}
                            onChange={(event) => updateDelivery(item.cartKey, "slot", event.target.value)}
                            className="mt-1.5 w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2f628f]"
                          >
                            <option value="">Choose a slot</option>
                            <option>9 AM – 12 PM</option>
                            <option>12 PM – 3 PM</option>
                            <option>3 PM – 6 PM</option>
                            <option>6 PM – 9 PM</option>
                            <option>10 PM – 12 AM</option>
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={() => void continueFromDelivery()}
                disabled={validating || !hasCompleteDeliverySelection()}
                className="hidden w-full items-center justify-center gap-2 rounded-full bg-[#2f628f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#214c72] disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
              >
                {validating ? <Loader2 size={17} className="animate-spin" /> : null}
                {validating ? "Checking delivery…" : "Continue to Personalization"}
                {!validating && <ChevronRight size={17} />}
              </button>
                </>
              )}

              {currentStep === 2 && (
                <section className="rounded-[18px] border border-[#dfeaf1] bg-white/95 p-5 shadow-[0_10px_32px_rgba(33,76,114,0.055)] md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[#d92f66]"><Tag size={19} /></div>
                    <div>
                      <h2 className="gift-heading text-2xl font-bold text-[#214c72]">2. Personalization</h2>
                      <p className="mt-1 text-xs text-slate-500">Review the personalization and gift message already saved with each cart item.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {items.map((item) => {
                      const personalization = item.personalization && typeof item.personalization === "object" ? item.personalization : {};
                      const entries = Object.entries(personalization).filter(([, value]) => String(value).trim());
                      return (
                        <article key={item.cartKey} className="rounded-[14px] border border-slate-200 bg-[#fbfcfd] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-800">{item.title || item.productId}</h3>
                              <p className="mt-1 text-xs text-slate-500">Qty {getCartQuantity(item)}{item.variant ? ` · ${item.variant}` : ""}</p>
                            </div>
                            <span className="rounded-full bg-[#f5fbff] px-3 py-1 text-[11px] font-bold text-[#2f628f]">Saved</span>
                          </div>
                          {entries.length || item.giftMessage ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {entries.map(([key, value]) => (
                                <div key={key} className="rounded-xl border border-slate-100 bg-white p-3">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#2f628f]">{key}</p>
                                  <p className="mt-1 break-words text-sm text-slate-700">{String(value)}</p>
                                </div>
                              ))}
                              {item.giftMessage && (
                                <div className="rounded-xl border border-[#f7d5e1] bg-[#fffafd] p-3">
                                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#d92f66]">Gift message</p>
                                  <p className="mt-1 break-words text-sm text-slate-700">{item.giftMessage}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-4 rounded-xl bg-[#f5fbff] p-3 text-xs text-slate-500">No personalization was selected for this item.</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={goBackStep} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#214c72] hover:border-[#214c72]">Back to Delivery</button>
                    <button type="button" onClick={continueFromPersonalization} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f628f] px-5 py-3 text-sm font-bold text-white hover:bg-[#214c72]">Continue to Payment <ChevronRight size={17} /></button>
                  </div>
                </section>
              )}

              {currentStep === 3 && (
                <section className="rounded-[18px] border border-[#dfeaf1] bg-white/95 p-5 shadow-[0_10px_32px_rgba(33,76,114,0.055)] md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5fbff] text-[#2f628f]"><CreditCard size={19} /></div>
                    <div>
                      <h2 className="gift-heading text-2xl font-bold text-[#214c72]">3. Payment</h2>
                      <p className="mt-1 text-xs text-slate-500">Apply your coupon, review the final server-validated total, then pay securely with Razorpay.</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-[14px] border border-[#e6edf2] bg-[#f5fbff] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <Tag size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2f628f]" />
                        <input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase().slice(0, 32)); setCouponApplied(false); setCouponError(""); setValidated(null); }} disabled={couponApplied || couponLoading} placeholder="Enter coupon code" className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 pl-9 text-sm outline-none focus:border-[#2f628f]" />
                      </div>
                      {couponApplied ? (
                        <button type="button" onClick={removeCoupon} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d92f66] bg-white px-5 py-2.5 text-xs font-bold text-[#d92f66]"><X size={14} /> Remove</button>
                      ) : (
                        <button type="button" onClick={() => void applyCoupon()} disabled={couponLoading} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f628f] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{couponLoading ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />} Apply</button>
                      )}
                    </div>
                    {couponError && <p role="alert" className="mt-2 text-xs font-semibold text-[#bd1d52]">{couponError}</p>}
                    {couponApplied && <p className="mt-2 text-xs font-semibold text-emerald-700">Coupon {couponCode} validated by the server.</p>}
                  </div>
                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={goBackStep} disabled={paying} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#214c72] hover:border-[#214c72] disabled:opacity-50">Back to Personalization</button>
                    <button type="button" onClick={() => void handlePayment()} disabled={paying || validating} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#bd1d52] disabled:cursor-not-allowed disabled:opacity-60">{paying || validating ? <Loader2 size={17} className="animate-spin" /> : <CreditCard size={17} />}{paying ? "Initiating Payment…" : validating ? "Validating Delivery…" : `Pay ${formatPrice(grandTotal)}`}</button>
                  </div>
                </section>
              )}
            </div>

            {/* Sticky Order Summary & Payment Button */}
            <aside className="lg:sticky lg:top-5">
              <div className="rounded-[18px] border border-[#dfeaf1] bg-white/95 p-5 shadow-[0_14px_38px_rgba(33,76,114,0.075)]">
                <h2 className="gift-heading text-2xl font-bold text-[#214c72]">
                  Order summary
                </h2>

                <div className="mt-4 divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.cartKey}
                      className="flex items-start justify-between gap-3 py-2.5 text-sm"
                    >
                      <span className="min-w-0 text-slate-600">
                        {item.title || item.productId} × {getCartQuantity(item)}
                      </span>
                      <span className="shrink-0 font-bold text-slate-800">
                        {formatPrice(Number(item.priceAtAdd || 0) * getCartQuantity(item))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatPrice(validated?.totals.subtotal ?? subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charges</span>
                    <span>
                      {validated ? formatPrice(validated.totals.delivery) : "Calculated at checkout"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Coupon Discount</span>
                    <span className="text-emerald-700">-{formatPrice(validated?.totals.discount ?? 0)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-lg font-extrabold text-[#214c72]">
                    <span>Total Amount</span>
                    <span className="text-[#d92f66]">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {currentStep === 3 && <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => void handlePayment()}
                    disabled={paying || validating}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd1d52] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paying ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Initiating Payment…
                      </>
                    ) : validating ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Validating Delivery…
                      </>
                    ) : (
                      <>
                        <CreditCard size={17} />
                        Continue to Payment
                      </>
                    )}
                  </button>
                </div>}

                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <Lock size={13} />
                  <span>Powered by Razorpay · 256-bit encryption</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        {currentStep < 4 && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6edf2] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(33,76,114,0.08)] backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                <p className="truncate text-lg font-extrabold text-[#214c72]">{formatPrice(grandTotal)}</p>
              </div>
              {currentStep === 1 ? (
                <button type="button" onClick={() => void continueFromDelivery()} disabled={validating || !hasCompleteDeliverySelection()} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2f628f] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{validating ? <Loader2 size={15} className="animate-spin" /> : null} Continue</button>
              ) : currentStep === 2 ? (
                <button type="button" onClick={continueFromPersonalization} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#2f628f] px-5 py-3 text-xs font-bold text-white">Continue <ChevronRight size={15} /></button>
              ) : (
                <button type="button" onClick={() => void handlePayment()} disabled={paying || validating} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#d92f66] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{paying || validating ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Pay</button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
