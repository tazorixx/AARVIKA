"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

type Product = {
  id: string;
  title?: string;
  sku?: string;
  status?: string;
  thumbnail?: string;
  images?: Array<{ url?: string; thumbnailUrl?: string }>;
  canonicalSkus?: {id:string;code:string;quantity:number;reserved:number;sold:number;revision:number}[];
  aarvika?: {purchaseMode:string;bundle?:unknown};
  stockSkuId?: string;
  stockRevision?: number;
  inventory?: { quantity?: number; reserved?: number; sold?: number };
};

type Filter = "all" | "low" | "out";
const LOW_STOCK_LIMIT = 5;

function stockValues(product: Product) {
  const quantity = Math.max(0, Number(product.inventory?.quantity ?? 0));
  const reserved = Math.max(0, Number(product.inventory?.reserved ?? 0));
  const sold = Math.max(0, Number(product.inventory?.sold ?? 0));
  return { quantity, reserved, sold, available: Math.max(0, quantity - reserved) };
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  async function load() {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");
    const token = await user.getIdToken(true);
    const response = await fetch("/api/admin/products?inventory=skus", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load inventory.");
    setProducts(Array.isArray(data) ? data.flatMap((product:Product)=>product.canonicalSkus?.length ? product.canonicalSkus.map(sku=>({...product,title:`${product.title} · ${sku.code}`,sku:sku.code,stockSkuId:sku.id,stockRevision:sku.revision,inventory:{quantity:sku.quantity,reserved:sku.reserved,sold:sku.sold}})) : [product]) : []);
  }

  useEffect(() => {
    Promise.resolve().then(() => load())
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load inventory."))
      .finally(() => setLoading(false));
  }, []);

  async function save(product: Product, quantity: number) {
    const reason=product.stockSkuId ? window.prompt("Reason for this demo SKU stock adjustment") : undefined;
    if(product.stockSkuId && !reason?.trim())return;
    setSaving(product.id);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken(true);
      const response = await fetch(`/api/admin/inventory/${product.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, skuId:product.stockSkuId,revision:product.stockRevision,reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update inventory.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update inventory.");
    } finally {
      setSaving("");
    }
  }

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const stock = stockValues(product);
      const matchesFilter =
        filter === "all" || (filter === "out" ? stock.available === 0 : stock.available > 0 && stock.available <= LOW_STOCK_LIMIT);
      const matchesQuery = !needle || `${product.title ?? ""} ${product.sku ?? ""} ${product.id}`.toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [products, query, filter]);

  const stats = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let sold = 0;
    let low = 0;
    let out = 0;
    for (const product of products) {
      const stock = stockValues(product);
      available += stock.available;
      reserved += stock.reserved;
      sold += stock.sold;
      if (stock.available === 0) out += 1;
      else if (stock.available <= LOW_STOCK_LIMIT) low += 1;
    }
    return { products: new Set(products.map(p=>p.id)).size, available, reserved, sold, low, out };
  }, [products]);

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">Operations</p>
            <h1 className="gift-heading text-3xl font-bold text-[#3E155C] md:text-4xl">Inventory</h1>
            <p className="mt-2 text-sm text-slate-600">Monitor available stock and update physical quantity without changing reserved or sold history.</p>
          </div>
          <a href="/admin/products" className="rounded-full border border-[#dce7ef] bg-white px-5 py-2.5 text-sm font-semibold text-[#3E155C] shadow-sm">Manage products</a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Products" value={stats.products} />
          <Stat label="Available units" value={stats.available} />
          <Stat label="Reserved" value={stats.reserved} />
          <Stat label="Sold" value={stats.sold} />
          <Stat label="Low / out" value={`${stats.low} / ${stats.out}`} />
        </div>

        {error && <div className="mt-5 rounded-[14px] border border-[#f0c9d5] bg-[#fff5f8] px-4 py-3 text-sm text-[#bd1d52]">{error}</div>}

        <section className="mt-6 overflow-hidden rounded-[14px] border border-[#dce7ef] bg-white shadow-sm">
          <div className="border-b border-[#e8edf2] p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU or ID…" className="w-full rounded-full border border-[#dce7ef] bg-[#fffafd] px-4 py-2.5 text-sm outline-none focus:border-[#3E155C]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All ({products.length})</FilterButton>
                <FilterButton active={filter === "low"} onClick={() => setFilter("low")}>Low stock ({stats.low})</FilterButton>
                <FilterButton active={filter === "out"} onClick={() => setFilter("out")}>Out of stock ({stats.out})</FilterButton>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading inventory…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-[#3E155C]">No inventory items found</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search or filter.</p>
            </div>
          ) : (
            <div>
              <div className="hidden grid-cols-[minmax(260px,1fr)_110px_110px_110px_110px_130px] gap-4 border-b border-[#e8edf2] bg-[#f5fbff] px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
                <span>Product</span><span>Available</span><span>Quantity</span><span>Reserved</span><span>Sold</span><span>Action</span>
              </div>
              {filteredProducts.map((product) => (
                <InventoryRow key={product.stockSkuId || product.id} product={product} saving={saving === product.id} onSave={save} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-[14px] border border-[#dce7ef] bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#3E155C]">{value}</p></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${active ? "border-[#3E155C] bg-[#f5fbff] text-[#3E155C]" : "border-[#dce7ef] bg-white text-slate-600 hover:bg-[#fffafd]"}`}>{children}</button>;
}

function InventoryRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (product: Product, quantity: number) => void }) {
  const stock = stockValues(product);
  const [quantity, setQuantity] = useState(String(stock.quantity));
  const image = product.thumbnail || product.images?.[0]?.thumbnailUrl || product.images?.[0]?.url;
  const readOnly=!!product.aarvika&&!product.stockSkuId;
  const status = readOnly?(product.aarvika?.bundle?"Component stock":product.aarvika?.purchaseMode==="inquiry"?"Inquiry only":"Configure SKUs"):stock.available === 0 ? "Out of stock" : stock.available <= LOW_STOCK_LIMIT ? "Low stock" : "In stock";

  return (
    <div className="grid gap-4 border-b border-[#eef2f5] px-4 py-4 last:border-b-0 md:grid-cols-[minmax(260px,1fr)_110px_110px_110px_110px_130px] md:items-center md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e8edf2] bg-[#f5fbff]">{image ? <img src={image} alt={product.title || "Product"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">No image</div>}</div>
        <div className="min-w-0"><p className="truncate font-semibold text-[#3E155C]">{product.title || product.id}</p><p className="mt-1 truncate text-xs text-slate-500">{product.sku || product.id}</p><span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${status === "In stock" ? "bg-[#eef8f2] text-[#23704a]" : status === "Low stock" ? "bg-[#fff7e8] text-[#9a6514]" : "bg-[#fff0f4] text-[#bd1d52]"}`}>{status}</span></div>
      </div>
      <div><span className="text-xs font-semibold text-slate-500 md:hidden">Available</span><p className="font-bold text-[#3E155C]">{stock.available}</p></div>
      <label><span className="text-xs font-semibold text-slate-500 md:hidden">Quantity</span><input aria-label={`Quantity for ${product.title || product.id}`} type="number" disabled={readOnly} min={stock.reserved} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-[#dce7ef] px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#3E155C]" /></label>
      <div><span className="text-xs font-semibold text-slate-500 md:hidden">Reserved</span><p className="text-sm text-slate-700">{stock.reserved}</p></div>
      <div><span className="text-xs font-semibold text-slate-500 md:hidden">Sold</span><p className="text-sm text-slate-700">{stock.sold}</p></div>
      {readOnly?<a href={`/admin/products/${product.id}/edit`} className="rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold">View product</a>:<button type="button" disabled={saving} onClick={() => onSave(product, Math.max(stock.reserved, Number(quantity) || 0))} className="rounded-full bg-[#62298E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3E155C] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save stock"}</button>}
    </div>
  );
}
