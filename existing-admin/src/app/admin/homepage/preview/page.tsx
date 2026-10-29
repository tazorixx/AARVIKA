"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { HomepageSection } from "@/lib/admin/homepage";

export default function HomepagePreviewPage() {
  const [pageKey,setPageKey]=useState('home');
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Please sign in again.");
        const response = await fetch("/api/admin/homepage/preview", { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load preview.");
        setSections(data.sections || []);
      } catch (error) { window.alert(error instanceof Error ? error.message : "Unable to load preview."); }
      finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <main className="min-h-screen grid place-items-center bg-[#fffafd] text-sm text-slate-500">Loading preview…</main>;
  return <main className="min-h-screen bg-[#fffafd] py-8"><div className="mx-auto max-w-[1428px] px-4 sm:px-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#62298E]">Draft preview</p><h1 className="gift-heading mt-1 text-3xl font-bold text-[#3E155C]">Homepage Preview</h1><p className="mt-1 text-sm text-slate-500">This preview combines published sections with your latest drafts. It is not visible to storefront visitors.</p></div><button onClick={() => window.close()} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Close</button></div><label className="mb-4 block text-xs font-bold">Preview page<select aria-label="Preview mobile page" className="ml-2 rounded-full border px-3 py-2" value={pageKey} onChange={e=>setPageKey(e.target.value)}>{[...new Set(['home',...sections.map(s=>s.pageKey||'home')])].map(key=><option key={key}>{key}</option>)}</select></label><div className="space-y-3">{sections.filter(s=>(s.pageKey||'home')===pageKey).map((section) => <section key={section.id} className="overflow-hidden rounded-[14px] border border-[#e6edf2] bg-white shadow-sm"><div className={`relative ${section.type === "hero" ? "min-h-[360px]" : "min-h-[180px]"} flex items-center ${section.imageUrl ? "bg-cover bg-center" : "bg-[linear-gradient(135deg,#fffafd,#f5fbff)]"}`} style={section.imageUrl ? { backgroundRepeat:'no-repeat',backgroundSize:section.imageFit==='contain'?'cover, contain':'cover',backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.45)),url(${section.imageUrl})` } : undefined}><div className="max-w-2xl p-7 sm:p-10"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${section.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{section.status}</span><h2 className="gift-heading mt-3 text-2xl font-bold text-[#3E155C] sm:text-3xl">{section.title}</h2>{section.subtitle && <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{section.subtitle}</p>}{section.linkUrl && <span className="mt-5 inline-flex rounded-full bg-[#62298E] px-5 py-2.5 text-xs font-bold text-white">{section.buttonLabel || "Explore"}</span>}</div></div></section>)}{!sections.length && <div className="rounded-[14px] border border-dashed border-[#cbd9e3] bg-white p-10 text-center text-sm text-slate-500">No homepage sections configured.</div>}</div></div></main>;
}
