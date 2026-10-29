"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Heart, Loader2, ShoppingBag, Star, Trash2 } from "lucide-react";
import AccountShell from "@/components/account/AccountShell";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import AccountCard from "@/components/account/AccountCard";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import { ProductCard } from "@/components/catalog/CatalogListing";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { readGuestCart, writeGuestCart } from "@/lib/cart/storage";
import { createCartKey } from "@/lib/cart/types";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const { data: catalog, loading: catalogLoading } = useCatalog();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingId, setAddingId] = useState("");

  const recommendations = useMemo(() => {
    if (!catalog?.products) return [];
    const saved = new Set(wishlist.map((item) => item.id));
    return catalog.products
      .filter((product) => product.status === "live" && !saved.has(product.id))
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(b.bestseller) - Number(a.bestseller) ||
          Number(b.rating) - Number(a.rating),
      )
      .slice(0, 4);
  }, [catalog, wishlist]);

  async function handleQuickAddToCart(item: {
    id: string;
    name: string;
    price: number;
    image?: string;
  }) {
    if (addingId) return;
    setAddingId(item.id);

    try {
      const cartKey = createCartKey({ productId: item.id });

      if (user) {
        const token = await user.getIdToken();
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: [{ productId: item.id, qty: 1 }],
          }),
        });

        if (!response.ok) throw new Error("Unable to add this gift to your cart.");
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const cart = readGuestCart();
        const existing = cart.find((entry) => entry.cartKey === cartKey);

        if (existing) {
          existing.qty = Math.min(20, (existing.qty || 1) + 1);
          existing.quantity = existing.qty;
        } else {
          cart.push({
            cartKey,
            productId: item.id,
            title: item.name,
            price: item.price,
            qty: 1,
            quantity: 1,
            image: item.image,
          });
        }

        writeGuestCart(cart);
      }

      setAddedIds((prev) => ({ ...prev, [item.id]: true }));
      window.setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [item.id]: false }));
      }, 2200);
    } catch {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    } finally {
      setAddingId("");
    }
  }

  function clearWishlist() {
    wishlist.forEach((item) => removeFromWishlist(item.id));
  }

  return (
    <AccountShell header={wishlist.length === 0 ? <AccountPageHeader eyebrow="Saved for later" title="Your wishlist" description="Keep thoughtful gift ideas ready for the right moment." icon={<Heart size={24} />} action={<div className="hidden rounded-[10px] bg-white/10 px-4 py-2 text-xs font-bold text-white sm:block">0 saved gifts</div>} /> : <AccountPageHeader eyebrow="Your saved shelf" title="Saved gifts" description={`${wishlist.length} ${wishlist.length === 1 ? "gift" : "gifts"} waiting for the right moment.`} icon={<Heart size={24} fill="currentColor" />} action={<div className="flex flex-wrap items-center gap-2"><Link href="/products" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/15">Continue shopping <ArrowRight size={14} /></Link><button type="button" onClick={clearWishlist} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/15">Clear wishlist <Trash2 size={14} /></button></div>} />}>
      {wishlist.length === 0 ? (
        <>
          <AccountCard className="mt-5 p-5 sm:p-7">
            <AccountEmptyState icon={<Heart size={28} />} title="Your wishlist is empty" description="Save gifts while browsing and come back when you are ready. We’ll keep your favourites here." actions={<><Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d92f66] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#bd1d52]">Discover gifts <ArrowRight size={16} /></Link><Link href="/occasions" className="inline-flex items-center justify-center rounded-full border border-[#dce8ef] bg-white px-6 py-3 text-sm font-extrabold text-[#214c72] transition hover:border-[#2f628f] hover:bg-[#f5fbff]">Shop by occasion</Link></>} />
          </AccountCard>
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#d92f66]">A little inspiration</p><h2 className="gift-heading mt-1.5 text-2xl font-bold text-[#214c72] sm:text-3xl">Gifts worth saving</h2></div><Link href="/products" className="hidden items-center gap-1.5 text-sm font-bold text-[#d92f66] sm:inline-flex">View all <ArrowRight size={15} /></Link></div>
            {catalogLoading ? <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-72 animate-pulse rounded-[14px] bg-white ring-1 ring-[#e7edf2]" />)}</div> : recommendations.length > 0 ? <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">{recommendations.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-5 rounded-[14px] border border-dashed border-[#dfe9ef] bg-white p-8 text-center text-sm text-slate-500">Explore our gift collection to start saving favourites.</div>}
          </section>
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((item) => {
              const hasDiscount = Boolean(item.oldPrice && item.oldPrice > item.price);
              const discountPercent = hasDiscount && item.oldPrice ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0;
              const productHref = `/product/${item.slug || item.id}`;
              const isAdded = Boolean(addedIds[item.id]);
              const isAdding = addingId === item.id;
              return (
                <article key={item.id} className="group flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#e5edf4] bg-white shadow-[0_6px_22px_rgba(33,76,114,.045)] transition duration-300 hover:-translate-y-1 hover:border-[#e1cbd4] hover:shadow-[0_16px_34px_rgba(33,76,114,.10)]">
                  <div className="relative aspect-[.96] overflow-hidden bg-[#f5fbff]"><Link href={productHref} className="block h-full w-full">{item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" /> : <div className="grid h-full place-items-center text-5xl">🎁</div>}</Link><div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5"><span className="rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#214c72] shadow-sm">Saved</span>{discountPercent > 0 && <span className="rounded-full bg-[#fff1f6] px-2.5 py-1 text-[9px] font-extrabold text-[#bd1d52]">{discountPercent}% OFF</span>}</div><button type="button" onClick={() => removeFromWishlist(item.id)} aria-label={`Remove ${item.name} from wishlist`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#d92f66] shadow-sm transition hover:scale-105 hover:bg-[#fff1f6]"><Heart size={16} fill="currentColor" /></button></div>
                  <div className="flex flex-1 flex-col p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#d92f66]">{item.category || "Gift"}</p><Link href={productHref} className="mt-1.5 block"><h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#172033] transition group-hover:text-[#bd1d52]">{item.name}</h2></Link>{item.rating && <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#172033]"><Star size={12} className="fill-[#f5aa18] text-[#f5aa18]" />{item.rating}</div>}<div className="mt-2.5 flex items-baseline gap-2"><strong className="text-[17px] font-extrabold text-[#214c72]">{formatPrice(item.price)}</strong>{hasDiscount && <del className="text-[11px] text-slate-400">{formatPrice(item.oldPrice!)}</del>}</div><div className="mt-auto pt-4"><button type="button" onClick={() => void handleQuickAddToCart(item)} disabled={Boolean(addingId)} className={`flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-extrabold transition ${isAdded ? "bg-[#eaf8f2] text-[#16825a]" : "bg-[#d92f66] text-white hover:bg-[#bd1d52]"} disabled:cursor-wait disabled:opacity-75`}>{isAdding ? <Loader2 size={14} className="animate-spin" /> : isAdded ? <Check size={14} /> : <ShoppingBag size={14} />}{isAdding ? "Adding…" : isAdded ? "Added to cart" : "Add to cart"}</button></div></div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </AccountShell>
  );
}
