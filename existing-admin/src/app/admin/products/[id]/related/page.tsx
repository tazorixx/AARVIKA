"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

type Product = {
  id: string;
  title: string;
  sku: string;
  price: number;
  thumbnail?: string;
  rating?: number;
  status: "draft" | "live" | "archived";
};

type ApiData = {
  config: { mode: "auto" | "manual"; productIds: string[] };
  candidates: Product[];
  preview: Product[];
};

async function api(path: string, init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const token = await user.getIdToken(true);
  const response = await fetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function RelatedProductsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [data, setData] = useState<ApiData | null>(null);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);

  async function load(productId: string) {
    try {
      setError("");
      const result = await api(`/api/admin/products/${productId}/related`) as ApiData;
      setData(result);
      setMode(result.config.mode);
      setSelected(result.config.productIds);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load related products.");
    }
  }

  useEffect(() => { if (id) void Promise.resolve().then(() => load(id)); }, [id]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.candidates || []).filter((product) =>
      !needle || product.title.toLowerCase().includes(needle) || product.sku.toLowerCase().includes(needle),
    );
  }, [data, query]);

  function toggle(productId: string) {
    setSaved(false);
    setSelected((current) => current.includes(productId)
      ? current.filter((value) => value !== productId)
      : current.length >= 12 ? current : [...current, productId]);
  }

  async function save() {
    setBusy(true); setError(""); setSaved(false);
    try {
      await api(`/api/admin/products/${id}/related`, { method: "PATCH", body: JSON.stringify({ mode, productIds: selected }) });
      await load(id);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save related products.");
    } finally { setBusy(false); }
  }

  const preview = mode === "manual"
    ? (data?.candidates || []).filter((product) => selected.includes(product.id)).sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id)).slice(0, 4)
    : data?.preview || [];

  if (!id || !data) return <main className="min-h-screen bg-[#fffafd] p-8 text-sm text-slate-500">{error || "Loading…"}</main>;

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => router.push(`/admin/products/${id}/edit`)} className="text-sm font-semibold text-[#3E155C]">← Back to product</button>
        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#62298E]">Merchandising</p>
            <h1 className="gift-heading text-3xl font-bold text-[#3E155C]">Related Products</h1>
            <p className="mt-1 text-sm text-slate-500">Choose automatic recommendations or manually control what appears below this product.</p>
          </div>
          <button type="button" disabled={busy} onClick={() => void save()} className="rounded-full bg-[#62298E] px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-[#3E155C] disabled:opacity-50">{busy ? "Saving…" : "Save related products"}</button>
        </header>

        {error && <p className="mt-4 rounded-[14px] border border-[#f0b8c9] bg-white px-4 py-3 text-sm text-[#bd1d52]">{error}</p>}
        {saved && <p className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Related products saved.</p>}

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {(["auto", "manual"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-[16px] border p-5 text-left transition ${mode === value ? "border-[#62298E] bg-white shadow-sm" : "border-slate-200 bg-white hover:border-[#c9dbe8]"}`}>
              <p className="text-sm font-bold text-[#3E155C]">{value === "auto" ? "Automatic recommendations" : "Manual override"}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{value === "auto" ? "Rank live products using category, occasion, recipient, collection, tags, price similarity, rating and merchandising signals." : "Select up to 12 live products and control their display order. This overrides automatic recommendations."}</p>
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-[16px] border border-[#e8dfe4] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold text-[#3E155C]">Storefront preview</h2><p className="text-xs text-slate-500">The product page displays up to four recommendations.</p></div>
            <span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold text-[#3E155C]">{mode === "auto" ? "Automatic" : `${selected.length} selected`}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {preview.map((product) => <div key={product.id} className="overflow-hidden rounded-xl border border-slate-100 bg-[#fffafd]"><div className="aspect-square bg-slate-100 bg-cover bg-center" style={product.thumbnail ? { backgroundImage: `url("${product.thumbnail}")` } : undefined} /><div className="p-3"><p className="line-clamp-2 text-sm font-bold text-[#172033]">{product.title}</p><p className="mt-1 text-sm font-extrabold text-[#3E155C]">₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div></div>)}
            {!preview.length && <p className="col-span-full py-8 text-center text-sm text-slate-500">No related products available yet.</p>}
          </div>
        </section>

        {mode === "manual" && <section className="mt-6 rounded-[16px] border border-[#e8dfe4] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-[#3E155C]">Choose products</h2><p className="text-xs text-slate-500">{selected.length}/12 selected. Selection order controls storefront order.</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products…" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#3E155C] sm:w-72" /></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => { const index = selected.indexOf(product.id); return <button key={product.id} type="button" onClick={() => toggle(product.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${index >= 0 ? "border-[#62298E] bg-[#fffafd]" : "border-slate-200 bg-white hover:border-[#c9dbe8]"}`}><div className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 bg-cover bg-center" style={product.thumbnail ? { backgroundImage: `url("${product.thumbnail}")` } : undefined} /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-[#3E155C]">{product.title}</p><p className="mt-1 text-xs text-slate-500">{product.sku} · ₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold">{index >= 0 ? index + 1 : "+"}</span></button>; })}
          </div>
        </section>}
      </div>
    </main>
  );
}
