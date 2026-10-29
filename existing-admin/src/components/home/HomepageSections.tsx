"use client";

import { useEffect, useState } from "react";
import type { HomepageSection } from "@/lib/admin/homepage";

export default function HomepageSections() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/homepage", { cache: "no-store" }).then((response) => response.ok ? response.json() : { sections: [] }).then((data) => { if (active) setSections(Array.isArray(data.sections) ? data.sections : []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!sections.length) return null;
  return <div className="mx-auto w-full max-w-[1428px] space-y-3 px-4 sm:px-6 lg:px-0">{sections.map((section) => <section key={section.id} className="overflow-hidden rounded-[14px] border border-[#e6edf2] bg-white shadow-sm"><div className={`relative ${section.type === "hero" ? "min-h-[260px]" : "min-h-[150px]"} flex items-center ${section.imageUrl ? "bg-cover bg-center" : "bg-[linear-gradient(135deg,#fffafd,#f5fbff)]"}`} style={section.imageUrl ? { backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.94),rgba(255,255,255,.45)),url(${JSON.stringify(section.imageUrl).slice(1,-1)})` } : undefined}><div className="max-w-2xl p-7 sm:p-10"><h2 className="gift-heading text-2xl font-bold text-[#214c72] sm:text-3xl">{section.title}</h2>{section.subtitle && <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{section.subtitle}</p>}{section.linkUrl && <a href={section.linkUrl} className="mt-5 inline-flex rounded-full bg-[#d92f66] px-5 py-2.5 text-xs font-bold text-white">{section.buttonLabel || "Explore"}</a>}</div></div></section>)}</div>;
}
