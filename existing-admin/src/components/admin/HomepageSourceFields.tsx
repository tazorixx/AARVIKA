"use client";
import {useState} from 'react';
import type {HomepageSection} from '@/lib/admin/homepage';
export function HomepageSourceFields({section,onChange}:{section:Partial<HomepageSection>;onChange(patch:Partial<HomepageSection>):void}){
 const source=(section.productIds??[]).join(', '),[draft,setDraft]=useState({source,text:source});
 if(draft.source!==source)setDraft({source,text:source});
 const cls='mt-1.5 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm';
 if(!['categories','products','collection'].includes(section.type??''))return null;
 return <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-bold text-slate-600">Category / collection ID (or @shortcuts, @families, @department, @collections)<input className={cls} value={section.sourceId??''} onChange={e=>onChange({sourceId:e.target.value})}/></label><label className="text-xs font-bold text-slate-600">Product selection<select className={cls} value={section.selection??'manual'} onChange={e=>onChange({selection:e.target.value as HomepageSection['selection']})}><option value="manual">Manual products</option><option value="featured">Featured published products</option><option value="new-arrivals">Published new arrivals</option><option value="best-sellers" disabled>Best sellers · verified sales source required</option></select></label><label className="text-xs font-bold text-slate-600">Product IDs · comma separated<input className={cls} value={draft.text} onChange={e=>{const ids=e.target.value.split(',').map(s=>s.trim()).filter(Boolean);setDraft({source:ids.join(', '),text:e.target.value});onChange({productIds:ids});}}/></label><label className="text-xs font-bold text-slate-600">Display limit (1–24)<input className={cls} type="number" min="1" max="24" value={section.limit??8} onChange={e=>onChange({limit:Number(e.target.value)})}/></label></div>;
}
