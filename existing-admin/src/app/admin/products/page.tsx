"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

type ProductRow = {
  id: string;
  title: string;
  sku: string;
  slug: string;
  status: "draft" | "live" | "archived";
  price: number;
  mrp: number;
  thumbnail?: string;
  images?: Array<{ url: string; thumbnailUrl?: string }>;
  inventory?: { quantity?: number; reserved?: number; sold?: number };
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
};

async function api(path: string, init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");

  const token = await user.getIdToken(true);
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function statusClass(status: ProductRow["status"]) {
  if (status === "live") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "archived") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function ProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProductRow["status"]>("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setError("");
      const data = await api("/api/admin/products");
      setItems(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load products.");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery = !needle ||
        [item.title, item.sku, item.slug].some((value) =>
          value.toLowerCase().includes(needle),
        );
      const matchesStatus = status === "all" || item.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, status]);

  const counts = useMemo(() => ({
    all: items.length,
    live: items.filter((item) => item.status === "live").length,
    draft: items.filter((item) => item.status === "draft").length,
    archived: items.filter((item) => item.status === "archived").length,
  }), [items]);

  async function archiveProduct(item: ProductRow) {
    if (item.status === "archived") return;
    if (!window.confirm(`Archive “${item.title}”? It will stop appearing in the live storefront.`)) return;

    setBusyId(item.id);
    setError("");

    try {
      const current = await api(`/api/admin/products/${item.id}`);
      await api(`/api/admin/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, status: "archived" }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to archive product.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Catalog</p>
            <h1 className="gift-heading text-3xl font-bold text-[#3E155C]">Products</h1>
            <p className="mt-1 text-sm text-slate-500">Manage product content, media, pricing, taxonomy and inventory.</p>
          </div>
          <a href="/admin/products/new" className="rounded-full bg-[#62298E] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#3E155C]">Add Product</a>
        </header>

        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          {[
            ["Categories", "/admin/categories"],
            ["Occasions", "/admin/occasions"],
            ["Recipients", "/admin/recipients"],
            ["Collections", "/admin/collections"],
            ["Inventory", "/admin/inventory"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-600 hover:border-[#c9dbe8] hover:text-[#3E155C]">{label}</a>
          ))}
        </nav>

        <section className="mt-6 rounded-[14px] border border-[#f0dfe6] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {(["all", "live", "draft", "archived"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${status === value ? "border-[#62298E] bg-[#fffafd] text-[#bd1d52]" : "border-slate-200 text-slate-600 hover:border-[#c9dbe8]"}`}
              >
                {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)} ({counts[value]})
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name, SKU or slug…"
            className="mt-3 w-full rounded-[14px] border border-slate-200 bg-[#fffafd] px-4 py-2.5 text-sm outline-none focus:border-[#3E155C]"
          />
        </section>

        {error && <p className="mt-4 rounded-[14px] border border-[#f0b8c9] bg-[#fffafd] px-4 py-3 text-sm text-[#bd1d52]">{error}</p>}

        <section className="mt-5 overflow-hidden rounded-[14px] border border-[#f0dfe6] bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_120px_130px_140px_150px] gap-4 border-b border-slate-100 bg-[#f5fbff] px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span>Product</span><span>Status</span><span>Price</span><span>Inventory</span><span className="text-right">Actions</span>
          </div>

          {filteredItems.map((item) => {
            const stock = Number(item.inventory?.quantity ?? 0) - Number(item.inventory?.reserved ?? 0);
            const image = item.thumbnail || item.images?.[0]?.thumbnailUrl || item.images?.[0]?.url;

            return (
              <article key={item.id} className="grid gap-4 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[minmax(0,2fr)_120px_130px_140px_150px] md:items-center md:px-5">
                <div className="flex min-w-0 gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-slate-100 bg-cover bg-center" style={image ? { backgroundImage: `url("${image}")` } : undefined} />
                  <div className="min-w-0">
                    <a href={`/admin/products/${item.id}/edit`} className="font-bold text-[#3E155C] hover:text-[#62298E]">{item.title}</a>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.sku} · /{item.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.featured && <span className="rounded-full bg-[#fffafd] px-2 py-0.5 text-[10px] font-bold text-[#bd1d52]">Featured</span>}
                      {item.bestseller && <span className="rounded-full bg-[#f5fbff] px-2 py-0.5 text-[10px] font-bold text-[#3E155C]">Bestseller</span>}
                      {item.newArrival && <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">New</span>}
                    </div>
                  </div>
                </div>

                <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
                <div><p className="font-bold text-[#3E155C]">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>{item.mrp > item.price && <p className="text-xs text-slate-400 line-through">₹{Number(item.mrp).toLocaleString("en-IN")}</p>}</div>
                <div><p className={`font-semibold ${stock <= 5 ? "text-[#bd1d52]" : "text-slate-700"}`}>{stock} available</p><p className="text-xs text-slate-400">{item.inventory?.sold ?? 0} sold</p></div>
                <div className="flex justify-start gap-2 md:justify-end">
                  <a href={`/admin/products/${item.id}/edit`} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</a>
                  <a href={`/admin/products/${item.id}/related`} className="rounded-full border border-[#c9dbe8] px-3 py-1.5 text-xs font-semibold text-[#3E155C]">Related</a>
                  {item.status !== "archived" && <button type="button" disabled={busyId === item.id} onClick={() => void archiveProduct(item)} className="rounded-full border border-[#f0b8c9] px-3 py-1.5 text-xs font-semibold text-[#bd1d52] disabled:opacity-50">{busyId === item.id ? "…" : "Archive"}</button>}
                </div>
              </article>
            );
          })}

          {filteredItems.length === 0 && !error && <div className="px-5 py-14 text-center text-sm text-slate-500">{items.length === 0 ? "No products yet. Create your first product." : "No products match the current filters."}</div>}
        </section>
      </div>
    </main>
  );
}
