"use client";

import {
  Gift,
  Heart,
  MapPin,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAccountCart } from "@/lib/cart/client";
import { cartCount as guestCartCount, readGuestCart } from "@/lib/cart/storage";
import { getCartQuantity } from "@/lib/cart/types";
import { useWishlist } from "@/contexts/WishlistContext";

const navigation = [
  { label: "Wedding", href: "/wedding" },
  { label: "Occasions", href: "/occasions" },
  { label: "Birthday", href: "/birthday" },
  { label: "Anniversary", href: "/anniversary" },
  { label: "Hampers", href: "/hampers" },
  { label: "Personalised", href: "/personalised" },
  { label: "Lifestyle", href: "/lifestyle" },
];

function formatMoney(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { wishlist } = useWishlist();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function updateCart() {
      try {
        if (authLoading) return;

        if (user) {
          const items = await getAccountCart(user);
          if (!cancelled) {
            setCartCount(guestCartCount(items));
            setCartTotal(
              items.reduce(
                (sum, item) =>
                  sum + Number(item.priceAtAdd || 0) * getCartQuantity(item),
                0,
              ),
            );
          }
          return;
        }

        const items = readGuestCart();
        if (!cancelled) {
          setCartCount(guestCartCount(items));
          setCartTotal(
            items.reduce(
              (sum, item) =>
                sum + Number(item.price || 0) * getCartQuantity(item),
              0,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setCartCount(0);
          setCartTotal(0);
        }
      }
    }

    void updateCart();
    window.addEventListener("cartUpdated", updateCart);

    return () => {
      cancelled = true;
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, [user, authLoading]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  };

  return (
    <header className="site-header">
      <div className="site-header-main">
        <Link href="/" className="site-brand" aria-label="Gift4U home">
          <span className="site-brand-mark-wrap">
            <Gift className="site-brand-mark" strokeWidth={1.8} />
          </span>
          <span className="site-brand-copy">
            <span className="site-brand-name">Gift4U</span>
            <span className="site-brand-tag">GIFTS FOR A HAPPIER YOU</span>
          </span>
        </Link>

        <form className="site-search" onSubmit={submitSearch} role="search">
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for gifts, hampers, personalised gifts and more..."
            aria-label="Search gifts"
          />
          <button type="submit">Search</button>
        </form>

        <div className="site-header-actions" aria-label="Quick links">
          <a className="site-action site-location-action" href="#delivery" aria-label="Deliver to Pune">
            <span className="site-action-icon site-location-icon">
              <MapPin size={17} strokeWidth={1.8} />
            </span>
            <span className="site-action-copy">
              <small>Deliver to</small>
              <b>Pune <span className="site-caret">▼</span></b>
            </span>
          </a>

          <Link className="site-action site-wishlist-action" href="/wishlist" aria-label={`Wishlist${wishlist.length ? `, ${wishlist.length} items` : ""}`}>
            <span className="site-icon-badge-wrap">
              <Heart size={21} strokeWidth={1.7} />
              {wishlist.length > 0 && (
                <span className="site-count-badge">{wishlist.length > 99 ? "99+" : wishlist.length}</span>
              )}
            </span>
            <span className="site-action-label">Wishlist</span>
          </Link>

          <Link
            className="site-cart-action"
            href="/cart"
            aria-label={`Shopping cart${cartCount ? `, ${cartCount} items` : ""}`}
          >
            <span className="site-icon-badge-wrap">
              <ShoppingCart size={21} strokeWidth={1.7} />
              {cartCount > 0 && (
                <span className="site-count-badge">{cartCount > 99 ? "99+" : cartCount}</span>
              )}
            </span>
            <span className="site-cart-total">{cartTotal > 0 ? formatMoney(cartTotal) : "Cart"}</span>
          </Link>

          <Link className="site-account-action" href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"}>
            <span className="site-account-icon"><UserRound size={16} strokeWidth={1.7} /></span>
            <span className="site-action-copy">
              <b>{authLoading ? "Account" : user ? (user.displayName?.trim() || "My Account") : "Sign In"}</b>
              <small>{user ? "My Account" : "Sign In"}</small>
            </span>
          </Link>
        </div>

        <div className="site-mobile-search">
          <form className="site-mobile-search-form" onSubmit={submitSearch} role="search">
            <Search size={15} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search gifts, cakes, flowers..."
              aria-label="Search gifts"
            />
          </form>
          <a className="site-location-mobile" href="#delivery" aria-label="Deliver to Pune">
            <MapPin size={14} strokeWidth={1.8} />
            <span>Deliver to</span>
            <strong>Pune</strong>
            <span aria-hidden="true">▼</span>
          </a>
        </div>
      </div>

      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav-inner">
          <div className="site-nav-links">
            <Link href="/" className={`site-shop-link${pathname === "/" ? " active" : ""}`}>SHOP</Link>
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={pathname === item.href ? "active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="site-nav-utilities">
            <Link href="/orders">Track Order</Link>
            <Link href="/help">Help</Link>
            <Link className="offers" href="/offers">🎁 <span>Offers</span></Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
