"use client";

import Link from "next/link";
import { ArrowRight, Filter, Heart, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import type { Product } from "@/lib/catalog/types";

type SortOption = "recommended" | "price-low" | "price-high" | "newest" | "bestselling" | "rating";
type Availability = "all" | "in-stock";
type Personalization = "all" | "personalised";
type Delivery = "all" | "same-day" | "express" | "scheduled" | "midnight";
type DeliveryData = Product["delivery"] & { express?: boolean; scheduled?: boolean; midnight?: boolean; };

function timestampValue(value: unknown) {
  if (!value) return 0;
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const liked = isInWishlist(product.id);
  const stock = Math.max(0, (product.inventory?.quantity ?? 0) - (product.inventory?.reserved ?? 0));
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const delivery = (product.delivery || {}) as DeliveryData;

  return (
    <article className="group overflow-hidden rounded-[16px] border border-[#e7e3e5] bg-white shadow-[0_8px_28px_rgba(33,76,114,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#d9cbd2] hover:shadow-[0_18px_40px_rgba(33,76,114,0.13)]">
      <div className="relative aspect-[.96] overflow-hidden bg-[#f5fbff]">
        <Link href={`/product/${product.slug}`} className="block h-full">
          {product.thumbnail ? <img src={product.thumbnail} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" /> : <div className="grid h-full place-items-center text-6xl">🎁</div>}
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.bestseller && <span className="rounded-full bg-[#fff1f6] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#bd1d52]">Bestseller</span>}
          {product.newArrival && <span className="rounded-full bg-[#f1f8fd] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#214c72]">New</span>}
        </div>
        {discount > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-[#bd1d52] shadow-sm">{discount}% OFF</span>}
        <button type="button" aria-label={liked ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-105 ${liked ? "text-[#d92f66]" : "text-[#172033]"}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleWishlist({ id: product.id, name: product.title, category: "Gift", price: product.price, oldPrice: product.mrp, rating: String(product.rating), image: product.thumbnail, slug: product.slug }); }}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-4 md:p-5">
        <Link href={`/product/${product.slug}`}><h3 className="line-clamp-2 min-h-10 text-[15px] font-bold leading-5 text-[#172033] transition group-hover:text-[#bd1d52]">{product.title}</h3></Link>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#172033]"><Star size={13} className="fill-[#f5aa18] text-[#f5aa18]" />{product.rating || "New"}<span className="font-normal text-[#98a2b3]">({product.reviewCount || 0})</span></div>
        <div className="mt-2 flex items-baseline gap-2"><strong className="text-lg text-[#172033]">₹{product.price.toLocaleString("en-IN")}</strong>{product.mrp > product.price && <del className="text-xs text-[#98a2b3]">₹{product.mrp.toLocaleString("en-IN")}</del>}</div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f0e7eb] pt-3"><span className="text-[11px] font-semibold text-[#667085]">{stock > 0 ? (delivery.sameDay ? "Same-day available" : delivery.express ? "Express delivery" : "Delivery available") : "Currently unavailable"}</span><Link href={`/product/${product.slug}`} className="rounded-full bg-[#d92f66] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_6px_14px_rgba(217,47,102,0.16)] transition hover:-translate-y-0.5 hover:bg-[#bd1d52]">View Gift</Link></div>
      </div>
    </article>
  );
}

export default function CatalogListing({ title, description, products, hideHero = false }: { title: string; description?: string; products: Product[]; hideHero?: boolean }) {
  const [sort, setSort] = useState<SortOption>("recommended");
  const [availability, setAvailability] = useState<Availability>("all");
  const [personalization, setPersonalization] = useState<Personalization>("all");
  const [delivery, setDelivery] = useState<Delivery>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const stock = Math.max(0, (product.inventory?.quantity ?? 0) - (product.inventory?.reserved ?? 0));
      if (availability === "in-stock" && stock <= 0) return false;
      if (personalization === "personalised" && !product.personalization?.enabled) return false;
      const deliveryData = (product.delivery || {}) as DeliveryData;
      if (delivery === "same-day" && !deliveryData.sameDay) return false;
      if (delivery === "express" && !deliveryData.express) return false;
      if (delivery === "scheduled" && !deliveryData.scheduled) return false;
      if (delivery === "midnight" && !deliveryData.midnight) return false;
      if (minPrice && product.price < Number(minPrice)) return false;
      if (maxPrice && product.price > Number(maxPrice)) return false;
      if (Number(minRating) > 0 && product.rating < Number(minRating)) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      switch (sort) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "newest": return timestampValue(b.createdAt) - timestampValue(a.createdAt);
        case "bestselling": return Number(b.bestseller) - Number(a.bestseller) || b.reviewCount - a.reviewCount;
        case "rating": return b.rating - a.rating || b.reviewCount - a.reviewCount;
        default: return Number(b.featured) - Number(a.featured) || Number(b.bestseller) - Number(a.bestseller) || b.rating - a.rating;
      }
    });
  }, [products, sort, availability, personalization, delivery, minPrice, maxPrice, minRating]);

  function resetFilters() { setAvailability("all"); setPersonalization("all"); setDelivery("all"); setMinPrice(""); setMaxPrice(""); setMinRating("0"); }
  function resetAll() { resetFilters(); setSort("recommended"); }
  const filterCount = Number(availability !== "all") + Number(personalization !== "all") + Number(delivery !== "all") + Number(Boolean(minPrice || maxPrice)) + Number(minRating !== "0");

  const filters = <div className="space-y-5">
    <div><label className="text-sm font-bold text-[#214c72]">Availability</label><select value={availability} onChange={(e) => setAvailability(e.target.value as Availability)} className="mt-2 w-full rounded-full border border-[#e1edf5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]"><option value="all">All gifts</option><option value="in-stock">In stock</option></select></div>
    <div><label className="text-sm font-bold text-[#214c72]">Price range</label><div className="mt-2 grid grid-cols-2 gap-2"><input value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Min ₹" className="w-full rounded-full border border-[#e1edf5] px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]" /><input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Max ₹" className="w-full rounded-full border border-[#e1edf5] px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]" /></div></div>
    <div><label className="text-sm font-bold text-[#214c72]">Customer rating</label><select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="mt-2 w-full rounded-full border border-[#e1edf5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]"><option value="0">Any rating</option><option value="4">4★ & above</option><option value="3">3★ & above</option></select></div>
    <div><label className="text-sm font-bold text-[#214c72]">Personalisation</label><select value={personalization} onChange={(e) => setPersonalization(e.target.value as Personalization)} className="mt-2 w-full rounded-full border border-[#e1edf5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]"><option value="all">All gifts</option><option value="personalised">Personalised only</option></select></div>
    <div><label className="text-sm font-bold text-[#214c72]">Delivery</label><select value={delivery} onChange={(e) => setDelivery(e.target.value as Delivery)} className="mt-2 w-full rounded-full border border-[#e1edf5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d92f66]"><option value="all">Any delivery</option><option value="same-day">Same-day available</option><option value="express">Express delivery</option><option value="scheduled">Scheduled delivery</option><option value="midnight">Midnight delivery</option></select></div>
    <button type="button" onClick={resetAll} className="w-full rounded-full border border-[#d92f66] px-4 py-2.5 text-sm font-bold text-[#d92f66] hover:bg-[#fff1f6]">Reset filters</button>
  </div>;

  return <main className="min-h-[70vh] bg-[#fffafd]">
    {!hideHero && <section className="mx-auto max-w-7xl px-4 pt-5 lg:px-8">
      <div className="relative overflow-hidden rounded-[20px] border border-[#e1edf5] bg-gradient-to-br from-[#fff1f6] via-white to-[#f1f8fd] px-5 py-9 md:px-10 md:py-11">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#d92f66]/10 blur-2xl" /><div className="absolute -bottom-28 left-1/2 h-64 w-64 rounded-full bg-[#2f628f]/10 blur-2xl" />
        <div className="relative max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#d92f66]">Gift4U · Thoughtful gifting</p><h1 className="gift-heading mt-3 text-4xl font-bold leading-tight text-[#214c72] md:text-5xl">{title === "All Gifts" ? "Find a gift they’ll love" : title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085] md:text-base">{description || "Thoughtful gifts for birthdays, anniversaries, weddings, celebrations and everyday surprises."}</p>
          <div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#214c72]">Made for every moment</span><span className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#214c72]">Personalised options</span><span className="rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#214c72]">Easy gifting</span></div>
        </div>
      </div>
    </section>}

    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-9">
      <div className="flex flex-col gap-4 rounded-[16px] border border-[#e1edf5] bg-white p-4 shadow-[0_8px_24px_rgba(33,76,114,0.04)] md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#d92f66]">Curated for you</p><h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72]">Gifts worth giving</h2></div><Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-[#2f628f] hover:text-[#d92f66]">Search all gifts <ArrowRight size={16} /></Link></div>
      <div className="mt-5 flex items-center justify-between gap-3 lg:hidden"><button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#e1edf5] bg-white px-4 py-2.5 text-sm font-bold text-[#214c72]"><Filter size={16} /> Filters {filterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#d92f66] px-1 text-[10px] text-white">{filterCount}</span>}</button><select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="rounded-full border border-[#e1edf5] bg-white px-4 py-2.5 text-sm font-semibold"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="newest">Newest</option><option value="bestselling">Bestselling</option><option value="rating">Top rated</option></select></div>
      <div className="mt-6 grid gap-7 lg:grid-cols-[250px_minmax(0,1fr)]"><aside className="hidden rounded-[16px] border border-[#e1edf5] bg-white p-5 shadow-[0_8px_24px_rgba(33,76,114,0.04)] lg:sticky lg:top-24 lg:block"><div className="mb-5 flex items-center gap-2"><SlidersHorizontal size={17} className="text-[#d92f66]" /><h2 className="gift-heading text-xl font-bold text-[#214c72]">Refine gifts</h2></div>{filters}</aside><section><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#172033]">{filteredProducts.length} {filteredProducts.length === 1 ? "gift" : "gifts"}</p><p className="mt-0.5 text-xs text-[#98a2b3]">Choose something thoughtful for their next special moment.</p></div><div className="hidden items-center gap-2 lg:flex"><span className="text-xs font-semibold text-[#667085]">Sort by</span><select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="rounded-full border border-[#e1edf5] bg-white px-4 py-2.5 text-sm font-semibold outline-none"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="newest">Newest</option><option value="bestselling">Bestselling</option><option value="rating">Top rated</option></select></div></div>
        {!filteredProducts.length ? <div className="rounded-[14px] border border-dashed border-[#d9cbd2] bg-white p-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff1f6]"><Search size={22} className="text-[#d92f66]" /></div><p className="gift-heading mt-4 text-xl font-bold text-[#214c72]">No gifts match these filters</p><p className="mt-2 text-sm text-[#667085]">Try a wider price range or clear a filter.</p><button type="button" onClick={resetAll} className="mt-5 rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white">Clear filters</button></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section></div>
    </section>

    {mobileFiltersOpen && <div className="fixed inset-0 z-50 bg-[#172033]/35 lg:hidden" onClick={() => setMobileFiltersOpen(false)}><div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[22px] bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#d92f66]">Refine</p><h2 className="gift-heading text-2xl font-bold text-[#214c72]">Find your gift</h2></div><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center rounded-full bg-[#f5fbff]"><X size={18} /></button></div>{filters}<button type="button" onClick={() => setMobileFiltersOpen(false)} className="mt-5 w-full rounded-full bg-[#d92f66] px-5 py-3 font-bold text-white">Show {filteredProducts.length} gifts</button></div></div>}
  </main>;
}
