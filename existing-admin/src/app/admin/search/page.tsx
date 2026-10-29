"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { auth } from "@/lib/firebase";

type Item = { id: string; [key: string]: unknown };

async function request(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in.");
  const token = await user.getIdToken();
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function AdminSearchPage() {
  const [data, setData] = useState<{ synonyms: Item[]; redirects: Item[]; pins: Item[]; analytics: Item[] }>({ synonyms: [], redirects: [], pins: [], analytics: [] });
  const [term, setTerm] = useState(""); const [synonyms, setSynonyms] = useState("");
  const [query, setQuery] = useState(""); const [target, setTarget] = useState("");
  const [pinQuery, setPinQuery] = useState(""); const [productId, setProductId] = useState(""); const [position, setPosition] = useState("1");
  const [filter, setFilter] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);

  async function load() { setData(await request("/api/admin/search")); }
  useEffect(() => { Promise.resolve().then(() => load()).catch((e) => setError(e.message)); }, []);
  async function add(payload: object) { setError(""); setSaving(true); try { await request("/api/admin/search", { method: "POST", body: JSON.stringify(payload) }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save."); } finally { setSaving(false); } }
  async function remove(type: string, id: string) { if (!window.confirm("Delete this search rule?")) return; try { await request(`/api/admin/search/${type}`, { method: "DELETE", body: JSON.stringify({ id, type }) }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete."); } }
  const analytics = useMemo(() => data.analytics.filter((row) => String(row.query || "").includes(filter.toLowerCase())), [data.analytics, filter]);

  return <main className="min-h-screen bg-[#fffafd]"><div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#62298E]">Search & Discovery</p><h1 className="gift-heading text-3xl font-bold text-[#3E155C]">Search Management</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Manage synonyms, redirects, pinned products and search demand without changing the customer catalog.</p></div>
    {error && <div className="mt-5 flex items-center justify-between rounded-[12px] border border-[#f0cbd7] bg-white p-4 text-sm text-[#bd1d52]">{error}<button onClick={()=>setError("")}><X size={16}/></button></div>}
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3E155C]">Synonyms</h2><p className="mt-1 text-xs text-slate-500">Make related searches find the same products.</p><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Main term" className="mt-4 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><input value={synonyms} onChange={e=>setSynonyms(e.target.value)} placeholder="Synonyms, comma separated" className="mt-2 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><button disabled={saving} onClick={()=>void add({type:"synonym",term,synonyms:synonyms.split(",").map(v=>v.trim()).filter(Boolean)})} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#3E155C] px-4 py-2.5 text-xs font-bold text-white"><Plus size={14}/> Add synonym</button></div>
      <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3E155C]">Redirects</h2><p className="mt-1 text-xs text-slate-500">Send specific searches to a catalog or landing page.</p><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search query" className="mt-4 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target path, e.g. /birthday" className="mt-2 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><button disabled={saving} onClick={()=>void add({type:"redirect",query,target})} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#3E155C] px-4 py-2.5 text-xs font-bold text-white"><Plus size={14}/> Add redirect</button></div>
      <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3E155C]">Pinned product</h2><p className="mt-1 text-xs text-slate-500">Force a product to the top for one search.</p><input value={pinQuery} onChange={e=>setPinQuery(e.target.value)} placeholder="Search query" className="mt-4 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="Product ID" className="mt-2 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><input value={position} onChange={e=>setPosition(e.target.value)} type="number" min="1" placeholder="Position" className="mt-2 w-full rounded-[10px] border border-slate-200 px-3 py-2.5 text-sm"/><button disabled={saving} onClick={()=>void add({type:"pin",query:pinQuery,productId,position:Number(position)})} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#3E155C] px-4 py-2.5 text-xs font-bold text-white"><Plus size={14}/> Pin product</button></div>
    </section>
    <section className="mt-6 rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-bold text-[#3E155C]">Search demand</h2><p className="mt-1 text-xs text-slate-500">Queries recorded from the customer search experience.</p></div><div className="relative w-full max-w-xs"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter queries" className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm"/></div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-[#f5fbff] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Query</th><th className="px-4 py-3">Searches</th><th className="px-4 py-3">Zero results</th><th className="px-4 py-3">Last searched</th></tr></thead><tbody>{analytics.map((row)=><tr key={String(row.query)} className="border-t border-slate-100"><td className="px-4 py-3 font-bold text-[#3E155C]">{String(row.query)}</td><td className="px-4 py-3">{String(row.searches)}</td><td className="px-4 py-3">{String(row.zeroResults)}</td><td className="px-4 py-3 text-xs text-slate-500">{String(row.lastSearchedAt || "—")}</td></tr>)}</tbody></table>{!analytics.length&&<p className="p-8 text-center text-sm text-slate-500">No search data yet.</p>}</div></section>
    <section className="mt-6 grid gap-4 lg:grid-cols-3">{([['Synonyms','synonym',data.synonyms],['Redirects','redirect',data.redirects],['Pinned products','pin',data.pins] ] as const).map(([title,type,items])=><div key={type} className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-[#3E155C]">{title}</h2><div className="mt-3 space-y-2">{items.map(item=><div key={item.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-[#f8fbfd] px-3 py-2.5 text-xs"><span className="min-w-0 truncate text-slate-700">{type==='synonym'?`${String(item.term)} → ${Array.isArray(item.synonyms)?item.synonyms.join(', '):''}`:type==='redirect'?`${String(item.query)} → ${String(item.target)}`:`${String(item.query)} → ${String(item.productId)}`}</span><button onClick={()=>void remove(type,item.id)} className="shrink-0 rounded-full p-1.5 text-[#bd1d52] hover:bg-[#E9DDF7]" title="Delete"><Trash2 size={14}/></button></div>)}{!items.length&&<p className="text-xs text-slate-500">Nothing configured yet.</p>}</div></div>)}</section>
  </div></main>;
}
