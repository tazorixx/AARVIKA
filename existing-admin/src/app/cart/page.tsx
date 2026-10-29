"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import {
  clearAccountCart,
  getAccountCart,
  mergeGuestCartIntoAccount,
  removeAccountCartItem,
  updateAccountCartItem,
} from "@/lib/cart/client";
import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  cartCount,
  readGuestCart,
  writeGuestCart,
} from "@/lib/cart/storage";
import {
  getCartQuantity,
  normalizeCartQuantity,
  type CartItem,
  type GuestCartItem,
} from "@/lib/cart/types";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatDeliveryDate(value?: string) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function personalizationEntries(
  personalization?: Record<string, string>,
) {
  if (!personalization) return [];

  return Object.entries(personalization).filter(
    ([key, value]) => key.trim() && value.trim(),
  );
}

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [accountItems, setAccountItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [clearing, setClearing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (authLoading) return;

      try {
        setLoading(true);
        setError("");

        if (user) {
          await mergeGuestCartIntoAccount(user);
          const items = await getAccountCart(user);

          if (!cancelled) setAccountItems(items);
        } else if (!cancelled) {
          setGuestItems(readGuestCart());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your cart.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    function refreshCart() {
      void load();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        void load();
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, refreshCart);
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, refreshCart);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user, authLoading, retryToken]);

  const items = user ? accountItems : guestItems;
  const count = cartCount(items);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = user
          ? Number((item as CartItem).priceAtAdd || 0)
          : Number((item as GuestCartItem).price || 0);
        const qty = getCartQuantity(item);

        return sum + price * qty;
      }, 0),
    [items, user],
  );

  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;
  const freeShippingRemaining = Math.max(0, 999 - subtotal);
  const shippingProgress = Math.min(100, (subtotal / 999) * 100);

  async function updateQuantity(
    item: CartItem | GuestCartItem,
    quantity: number,
  ) {
    if (busyKey) return;

    setError("");
    setBusyKey(item.cartKey);

    try {
      const nextQuantity = normalizeCartQuantity(quantity);

      if (user) {
        const result = await updateAccountCartItem(
          user,
          item.cartKey,
          nextQuantity,
        );
        setAccountItems(result.items);
      } else {
        const next = guestItems.map((entry) =>
          entry.cartKey === item.cartKey
            ? {
                ...entry,
                qty: nextQuantity,
                quantity: nextQuantity,
              }
            : entry,
        );

        setGuestItems(next);
        writeGuestCart(next);
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update your cart.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function removeItem(item: CartItem | GuestCartItem) {
    if (busyKey || clearing) return;

    setError("");
    setBusyKey(item.cartKey);

    try {
      if (user) {
        const result = await removeAccountCartItem(
          user,
          item.cartKey,
        );
        setAccountItems(result.items);
      } else {
        const next = guestItems.filter(
          (entry) => entry.cartKey !== item.cartKey,
        );
        setGuestItems(next);
        writeGuestCart(next);
      }
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove that gift.",
      );
    } finally {
      setBusyKey("");
    }
  }

  async function clearCart() {
    if (busyKey || clearing) return;

    const confirmed = window.confirm(
      "Clear all gifts from your cart? This cannot be undone.",
    );
    if (!confirmed) return;

    setError("");
    setClearing(true);

    try {
      if (user) {
        const result = await clearAccountCart(user);
        setAccountItems(result.items);
      } else {
        setGuestItems([]);
        writeGuestCart([]);
      }
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Unable to clear your cart.",
      );
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="cart-page-shell">
          <div className="cart-loading">
            <div className="cart-loading-icon">
              <Loader2 className="animate-spin" size={28} />
            </div>
            <h1 className="gift-heading">Loading your gifts</h1>
            <p>We&apos;re getting your cart ready.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Breadcrumb currentPage="Cart" />

      <main className="cart-page-shell">
        <div className="cart-page-container">
          <div className="cart-page-header">
            <div>
              <p className="cart-eyebrow">Your Shopping Bag</p>
              <h1 className="gift-heading">Shopping Cart</h1>
              <p className="cart-page-subtitle">
                {count
                  ? `${count} ${count === 1 ? "gift" : "gifts"} ready for your next thoughtful moment.`
                  : "Your saved gifts will appear here."}
              </p>
            </div>
            {count > 0 && (
              <div className="cart-header-pill">
                <ShoppingBag size={16} />
                <span>{count} items</span>
              </div>
            )}
          </div>

          {error && (
            <div className="cart-alert" role="alert">
              <span>{error}</span>
              <div className="cart-alert-actions">
                <button
                  type="button"
                  onClick={() => setRetryToken((value) => value + 1)}
                >
                  Try again
                </button>
                <button type="button" onClick={() => setError("")}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <section className="cart-empty-card">
              <div className="cart-empty-icon">
                <ShoppingBag size={38} />
              </div>
              <span className="cart-empty-kicker">A little space for something special</span>
              <h2 className="gift-heading">Your Cart is Empty</h2>
              <p>
                Find a thoughtful gift for a birthday, anniversary, wedding
                or everyday surprise.
              </p>
              <Link href="/products" className="cart-primary-button">
                <ArrowLeft size={18} />
                Continue Shopping
              </Link>
            </section>
          ) : (
            <div className="cart-layout">
              <section className="cart-items-section">
                <div className="cart-section-toolbar">
                  <div>
                    <span className="cart-section-label">Your gifts</span>
                    <p>{count} items in your cart</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void clearCart()}
                    disabled={Boolean(busyKey) || clearing}
                    className="cart-clear-button"
                  >
                    {clearing && <Loader2 size={15} className="animate-spin" />}
                    {clearing ? "Clearing…" : "Clear Cart"}
                  </button>
                </div>

                <div className="cart-items-list">
                  {items.map((item) => {
                    const guestItem = item as GuestCartItem;
                    const accountItem = item as CartItem;
                    const qty = getCartQuantity(
                      user ? accountItem : guestItem,
                    );
                    const price = user
                      ? Number(accountItem.priceAtAdd || 0)
                      : Number(guestItem.price || 0);
                    const name = item.title || item.productId;
                    const image = item.image;
                    const isBusy = busyKey === item.cartKey;
                    const details = personalizationEntries(
                      item.personalization,
                    );

                    return (
                      <article
                        key={item.cartKey}
                        className={`cart-item-card${isBusy ? " is-busy" : ""}`}
                      >
                        {isBusy && (
                          <div className="cart-item-overlay" aria-hidden="true">
                            <Loader2 size={22} className="animate-spin" />
                          </div>
                        )}

                        <Link
                          href={`/product/${item.productId}`}
                          className="cart-item-image"
                          aria-label={`View ${name}`}
                        >
                          {image ? (
                            <img src={image} alt={name} />
                          ) : (
                            <div className="cart-image-placeholder">
                              <GiftIcon />
                            </div>
                          )}
                          <span className="cart-image-count">×{qty}</span>
                        </Link>

                        <div className="cart-item-content">
                          <div className="cart-item-topline">
                            <div className="min-w-0">
                              <Link
                                href={`/product/${item.productId}`}
                                className="cart-item-title"
                              >
                                {name}
                              </Link>

                              {item.variant && (
                                <span className="cart-detail-chip blue">
                                  {item.variant}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              aria-label={`Remove ${name}`}
                              onClick={() => void removeItem(item)}
                              disabled={Boolean(busyKey) || clearing}
                              className="cart-remove-button"
                            >
                              <Trash2 size={18} />
                              <span>Remove</span>
                            </button>
                          </div>

                          {(details.length > 0 || item.giftMessage || item.deliveryDate || item.deliverySlot) && (
                            <div className="cart-item-details">
                              {details.map(([key, value]) => (
                                <span key={`${key}-${value}`} className="cart-detail-chip">
                                  {key}: {value}
                                </span>
                              ))}
                              {item.giftMessage && (
                                <span className="cart-detail-chip">
                                  Gift message added
                                </span>
                              )}
                              {(item.deliveryDate || item.deliverySlot) && (
                                <span className="cart-detail-chip blue">
                                  <Truck size={13} />
                                  {item.deliveryDate && formatDeliveryDate(item.deliveryDate)}
                                  {item.deliveryDate && item.deliverySlot ? " · " : ""}
                                  {item.deliverySlot}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="cart-item-bottom">
                            <div className="cart-quantity-wrap">
                              <span className="cart-quantity-label">Quantity</span>
                              <div className="cart-quantity-control">
                                <button
                                  type="button"
                                  aria-label={`Decrease quantity of ${name}`}
                                  onClick={() => void updateQuantity(item, qty - 1)}
                                  disabled={qty <= 1 || Boolean(busyKey) || clearing}
                                >
                                  <Minus size={15} />
                                </button>
                                <span aria-live="polite">{qty}</span>
                                <button
                                  type="button"
                                  aria-label={`Increase quantity of ${name}`}
                                  onClick={() => void updateQuantity(item, qty + 1)}
                                  disabled={qty >= 20 || Boolean(busyKey) || clearing}
                                >
                                  <Plus size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="cart-item-price-block">
                              <span>{formatPrice(price)} each</span>
                              <strong>{formatPrice(price * qty)}</strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <Link href="/products" className="cart-continue-link">
                  <ArrowLeft size={17} />
                  Continue Shopping
                  <ChevronRight size={15} />
                </Link>
              </section>

              <aside className="cart-summary-card cart-summary-card-premium">
                <div className="cart-summary-heading">
                  <div>
                    <span className="cart-section-label">At a glance</span>
                    <h2 className="gift-heading">Order Summary</h2>
                  </div>
                  <Sparkles size={21} />
                </div>

                <div className="cart-shipping-banner">
                  <div className="cart-shipping-icon">
                    <Truck size={17} />
                  </div>
                  <div className="cart-shipping-copy">
                    {shipping === 0 ? (
                      <strong>Free shipping unlocked</strong>
                    ) : (
                      <strong>Add {formatPrice(freeShippingRemaining)} for free shipping</strong>
                    )}
                    <span>
                      {shipping === 0
                        ? "Your order qualifies for delivery at no extra cost."
                        : "Free shipping on orders above ₹999."}
                    </span>
                  </div>
                </div>

                {subtotal > 0 && subtotal < 999 && (
                  <div className="cart-progress" aria-label="Free shipping progress">
                    <div className="cart-progress-track">
                      <span style={{ width: `${shippingProgress}%` }} />
                    </div>
                    <div className="cart-progress-labels">
                      <span>{formatPrice(subtotal)}</span>
                      <span>₹999</span>
                    </div>
                  </div>
                )}

                <div className="cart-summary-lines">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <strong className={shipping === 0 ? "free" : ""}>
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </strong>
                  </div>
                </div>

                <div className="cart-total-row">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </div>

                <Link
                  href={user ? "/checkout" : "/login?next=/checkout"}
                  className="cart-checkout-button cart-checkout-button-active"
                >
                  {user ? "Proceed to Checkout" : "Sign in to Checkout"}
                  <ChevronRight size={18} />
                </Link>

                <div className="cart-checkout-note">
                  <Check size={15} />
                  {user
                    ? "Your cart details will carry into delivery and payment."
                    : "Your guest cart is saved. Sign in and it will be merged into your account."}
                </div>

                <div className="cart-safe-note">
                  <span>Gift4U</span>
                  <p>Your selected gift details stay attached to each cart item.</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

function GiftIcon() {
  return (
    <div className="cart-gift-placeholder" aria-hidden="true">
      <ShoppingBag size={30} />
    </div>
  );
}
