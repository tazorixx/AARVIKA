"use client";
import Image from "next/image";

import Link from "next/link";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCatalog } from "@/hooks/useCatalog";
import type { CatalogProduct } from "@/hooks/useCatalog";

type SearchSort = "relevance" | "price-low" | "price-high" | "newest" | "bestselling" | "rating";

function timestampValue(value: unknown) {
  if (!value) return 0;
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function SearchContent() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [sort, setSort] = useState<SearchSort>("relevance");
  const { data, loading: catalogLoading, error: catalogError } = useCatalog();
  const [managedProducts, setManagedProducts] = useState<CatalogProduct[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const term = query.trim();
    if (!term) { Promise.resolve().then(() => setManagedProducts(null)); Promise.resolve().then(() => setSearchError("")); return; }
    Promise.resolve().then(() => setSearchLoading(true));
    fetch(`/api/search?q=${encodeURIComponent(term)}`, { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Search failed."); return payload; })
      .then((payload) => { if (!cancelled) setManagedProducts(payload.products || []); })
      .catch((error) => { if (!cancelled) setSearchError(error instanceof Error ? error.message : "Search failed."); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  const products = useMemo(() => {
    if (query.trim() && managedProducts) {
      const sorted = [...managedProducts];
      sorted.sort((a, b) => {
        switch (sort) {
          case "price-low": return a.price - b.price;
          case "price-high": return b.price - a.price;
          case "newest": return timestampValue((b as CatalogProduct & { createdAt?: unknown }).createdAt) - timestampValue((a as CatalogProduct & { createdAt?: unknown }).createdAt);
          case "bestselling": return Number(b.bestseller) - Number(a.bestseller) || b.reviewCount - a.reviewCount;
          case "rating": return b.rating - a.rating || b.reviewCount - a.reviewCount;
          default: return Number(b.featured) - Number(a.featured) || Number(b.bestseller) - Number(a.bestseller) || b.rating - a.rating;
        }
      });
      return sorted;
    }
    const normalized = query.trim().toLowerCase();
    const source = data?.products || [];
    const scored = source
      .filter((product) => {
        if (!normalized) return true;
        const fields = [product.title, product.shortDescription, product.slug, ...(product.tagIds || [])]
          .filter(Boolean)
          .map((value) => value.toLowerCase());
        return fields.some((value) => value.includes(normalized));
      })
      .map((product) => {
        if (!normalized) return { product, score: 0 };
        const title = product.title.toLowerCase();
        const slug = product.slug.toLowerCase();
        const score = (title === normalized ? 100 : 0) + (title.includes(normalized) ? 50 : 0) + (slug.includes(normalized) ? 25 : 0) + ((product.tagIds || []).some((tag) => tag.toLowerCase().includes(normalized)) ? 20 : 0);
        return { product, score };
      });

    scored.sort((a, b) => {
      switch (sort) {
        case "price-low": return a.product.price - b.product.price;
        case "price-high": return b.product.price - a.product.price;
        case "newest": return timestampValue((b.product as CatalogProduct & { createdAt?: unknown }).createdAt) - timestampValue((a.product as CatalogProduct & { createdAt?: unknown }).createdAt);
        case "bestselling": return Number(b.product.bestseller) - Number(a.product.bestseller) || b.product.reviewCount - a.product.reviewCount;
        case "rating": return b.product.rating - a.product.rating || b.product.reviewCount - a.product.reviewCount;
        default: return b.score - a.score || Number(b.product.featured) - Number(a.product.featured) || b.product.rating - a.product.rating;
      }
    });

    return scored.map(({ product }) => product);
  }, [data, managedProducts, query, sort]);

  return (
    <main className="min-h-[70vh] bg-[#fffafd]">
      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <div className="rounded-[20px] border border-[#e1edf5] bg-gradient-to-br from-[#fff1f6] via-white to-[#f1f8fd] p-5 md:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#d92f66]">Gift4U Search</p>
          <h1 className="gift-heading mt-2 text-3xl font-bold text-[#214c72] md:text-4xl">Find the right gift</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085] md:text-base">Search gifts by name, gifting idea, occasion keyword or product tag.</p>
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-[#dce8f0] bg-white px-4 shadow-[0_8px_24px_rgba(33,76,114,0.06)] transition focus-within:border-[#d92f66] focus-within:ring-4 focus-within:ring-[#d92f66]/10">
              <Search size={18} className="shrink-0 text-[#98a2b3]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “birthday”, “hamper” or “personalised”" className="w-full bg-transparent py-3 text-sm outline-none" aria-label="Search gifts" />
            </div>
            <label className="flex items-center gap-2 rounded-full border border-[#dce8f0] bg-white px-4 shadow-[0_8px_24px_rgba(33,76,114,0.04)] text-sm">
              <SlidersHorizontal size={16} className="text-[#2f628f]" />
              <span className="sr-only">Sort search results</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SearchSort)} className="bg-transparent py-3 outline-none">
                <option value="relevance">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="newest">Newest</option>
                <option value="bestselling">Bestselling</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#d92f66]">Live catalog</p>
            <h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72]">{(catalogLoading || searchLoading) ? "Finding gifts…" : `${products.length} ${products.length === 1 ? "gift" : "gifts"}`}</h2>
          </div>
          {query.trim() && <p className="max-w-[55%] text-right text-sm text-[#667085]">Results for “{query.trim()}”</p>}
        </div>

        {(catalogError || searchError) && <p className="mt-5 rounded-[14px] bg-[#fff1f5] p-4 text-sm font-semibold text-[#bd1d52]">{catalogError || searchError}</p>}

        {!catalogLoading && !searchLoading && !products.length ? (
          <div className="mt-6 rounded-[14px] border border-dashed border-[#d9cbd2] bg-white p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff1f6]"><Search size={22} className="text-[#d92f66]" /></div>
            <p className="gift-heading mt-4 text-xl font-bold text-[#214c72]">No gifts found</p>
            <p className="mt-2 text-sm text-[#667085]">Try a different word, occasion or product tag.</p>
            <Link href="/products" className="mt-5 inline-flex rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#bd1d52]">Browse all gifts</Link>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
            {products.map((product) => <SearchProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function SearchProductCard({ product }: { product: CatalogProduct }) {
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <article className="group overflow-hidden rounded-[16px] border border-[#e8dfe4] bg-white shadow-[0_7px_24px_rgba(33,76,114,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#d9cbd2] hover:shadow-[0_16px_34px_rgba(33,76,114,0.12)]">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#f5fbff]">
          {product.thumbnail ? <Image src={product.thumbnail} alt={product.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="grid h-full place-items-center text-5xl">🎁</div>}
          {discount > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-[#bd1d52] shadow-sm">{discount}% OFF</span>}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#172033] group-hover:text-[#bd1d52]">{product.title}</h3>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#172033]"><Star size={13} className="fill-[#f5aa18] text-[#f5aa18]" />{product.rating || "New"}<span className="font-normal text-[#98a2b3]">({product.reviewCount || 0})</span></div>
          <div className="mt-2 flex items-baseline gap-2"><p className="text-lg font-extrabold text-[#172033]">₹{product.price.toLocaleString("en-IN")}</p>{product.mrp > product.price && <del className="text-xs text-[#98a2b3]">₹{product.mrp.toLocaleString("en-IN")}</del>}</div>
        </div>
      </Link>
    </article>
  );
}

export default function SearchPage() {
  return <><Header /><Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#667085]">Loading search…</main>}><SearchContent /></Suspense><Footer /></>;
}
