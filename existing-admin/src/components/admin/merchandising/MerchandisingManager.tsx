"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import type { MerchandisingItem, MerchandisingPage, MerchandisingPageConfig } from "@/lib/merchandising/types";
import {InlineRelationChoice} from './InlineRelationChoice';
import {FeaturedProductChoice} from './FeaturedProductChoice';
import {MerchandisingPreview} from './MerchandisingPreview';

type TaxonomyItem = { id: string; name: string; image?: string; slug?: string; active?: boolean; departmentId?:string; parentId?:string|null; level?:number };
type ProductOption={id:string;title:string;status:string;aarvika?:{departmentIds?:string[]}};
type ItemDraft = Omit<MerchandisingItem, "id" | "createdAt" | "updatedAt" | "page">;

type SectionConfig = {
  type: MerchandisingItem["type"];
  label: string;
  placeholder?: string;
  relation?: "categories" | "recipients" | "occasions" | "collections";
  numbers?: "budget" | "age" | "years";
};

type Props = {
  page: MerchandisingPage;
  title: string;
  description: string;
  sections: SectionConfig[];
  initialHero: MerchandisingPageConfig["hero"];
};

function relationLabel(relation: SectionConfig["relation"]) {
  if (relation === "categories") return "category";
  if (relation === "recipients") return "recipient";
  if (relation === "occasions") return "occasion";
  return "collection";
}

const EMPTY_ITEM: ItemDraft = {
  type: "category",
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  image: "",
  relatedId: "",
  featuredProductIds:[],
  min: undefined,
  max: undefined,
  years: undefined,
  minimumAge: undefined,
  maximumAge: undefined,
  sortOrder: 0,
  active: true,
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  return user.getIdToken();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function MerchandisingManager({ page, title, description, sections, initialHero }: Props) {
  const [data, setData] = useState<{ page: MerchandisingPageConfig; items: MerchandisingItem[] } | null>(null);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [recipients, setRecipients] = useState<TaxonomyItem[]>([]);
  const [occasions, setOccasions] = useState<TaxonomyItem[]>([]);
  const [collections, setCollections] = useState<TaxonomyItem[]>([]);
  const [products,setProducts]=useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [activeType, setActiveType] = useState<MerchandisingItem["type"]>(sections[0].type);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraft>({ ...EMPTY_ITEM, type: sections[0].type });
  const [hero, setHero] = useState(initialHero);
  const [heroDirty, setHeroDirty] = useState(false);
  const [relationMode,setRelationMode]=useState<'existing'|'create'>('existing');
  const [masterName,setMasterName]=useState('');
  const [masterParentId,setMasterParentId]=useState('');

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [merchandising, categoryData, recipientData, occasionData, collectionData, productData] = await Promise.all([
        api<{ page: MerchandisingPageConfig; items: MerchandisingItem[] }>(`/api/admin/merchandising/${page}`),
        api<TaxonomyItem[]>("/api/admin/categories"),
        api<TaxonomyItem[]>("/api/admin/recipients"),
        api<TaxonomyItem[]>("/api/admin/occasions"),
        api<TaxonomyItem[]>("/api/admin/collections"),
        api<ProductOption[]>("/api/admin/products"),
      ]);
      setData(merchandising);
      setHero(merchandising.page.hero || initialHero);
      setCategories(categoryData);
      setRecipients(recipientData);
      setOccasions(occasionData);
      setCollections(collectionData);
      setProducts(productData.filter(product=>product.status==='live'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to load ${title}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void Promise.resolve().then(() => load()); }, [page]);

  const items = useMemo(() => (data?.items || []).filter((item) => item.type === activeType).sort((a, b) => a.sortOrder - b.sortOrder), [activeType, data]);
  const total = data?.items.length || 0;
  const activeCount = data?.items.filter((item) => item.active).length || 0;
  const inactiveCount = total - activeCount;
  const currentSection = sections.find((section) => section.type === activeType) || sections[0];

  const startNew = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_ITEM, type: activeType, sortOrder: items.length });
    setRelationMode('existing');setMasterName('');setMasterParentId('');
  };

  const edit = (item: MerchandisingItem) => {
    setEditingId(item.id);
    setRelationMode('existing');setMasterName('');setMasterParentId('');
    setDraft({ type: item.type, name: item.name, slug: item.slug, subtitle: item.subtitle || "", description: item.description || "", image: item.image || "", relatedId: item.relatedId || "", featuredProductIds:item.featuredProductIds??[], min: item.min, max: item.max, years: item.years, minimumAge: item.minimumAge, maximumAge: item.maximumAge, sortOrder: item.sortOrder, active: item.active });
  };

  const updateDraft = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("page", page);
      form.append("section", String(draft.type));
      const response = await fetch("/api/admin/uploads/merchandising", { method: "POST", headers: { Authorization: `Bearer ${await getToken()}` }, body: form });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Unable to upload image.");
      updateDraft("image", result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload image.");
    } finally { setUploading(false); }
  };

  const saveHero = async () => {
    setSaving(true); setError("");
    try { await api(`/api/admin/merchandising/${page}`, { method: "PATCH", body: JSON.stringify({ hero }) }); setHeroDirty(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save hero."); }
    finally { setSaving(false); }
  };

  const saveItem = async () => {
    if (!draft.name.trim()) { setError("Name is required."); return; }
    if (currentSection.relation && !inlineCreating && !draft.relatedId) { setError(`Select the existing ${relationLabel(currentSection.relation)} this item represents.`); return; }
    setSaving(true); setError("");
    try {
      const path = editingId ? `/api/admin/merchandising/${page}/items/${editingId}` : `/api/admin/merchandising/${page}/items`;
      const body=inlineCreating?{...draft,inlineMaster:{name:masterName.trim()||draft.name.trim(),parentId:masterParentId||null}}:draft;
      await api(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(body) });
      setEditingId(null);
      setDraft({ ...EMPTY_ITEM, type: activeType, sortOrder: items.length + (editingId ? 0 : 1) });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save item."); }
    finally { setSaving(false); }
  };

  const archive = async (id: string) => {
    if (!window.confirm(`Archive this ${title} item?`)) return;
    try { await api(`/api/admin/merchandising/${page}/items/${id}`, { method: "DELETE" }); if (editingId === id) setEditingId(null); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to archive item."); }
  };

  const relationOptions = (currentSection.relation === "categories" ? categories : currentSection.relation === "recipients" ? recipients : currentSection.relation === "occasions" ? occasions : collections)
    .filter((item) => item.active !== false && (currentSection.relation!=='categories'||!item.departmentId||item.departmentId===(page==='personalised'?'personalized':page)));
  const inlineCreating=Boolean(currentSection.relation&&!editingId&&(relationMode==='create'||relationOptions.length===0));
  const relationMissing = Boolean(currentSection.relation && !inlineCreating && relationOptions.length === 0);

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><p className="admin-page-eyebrow">Merchandising · {title}</p><h1 className="admin-page-title">{title} storefront</h1><p className="admin-page-description">{description}</p></div><button className="admin-primary-button" onClick={startNew}><Plus size={16} /> Add {currentSection.label.replace(`${title} `, "")}</button></div>
      {error && <div className="mb-5 rounded-[12px] border border-[#f0b8c9] bg-[#fff5f8] px-4 py-3 text-sm font-medium text-[#9f1748]">{error}</div>}
      {loading ? <div className="admin-card flex min-h-[300px] items-center justify-center"><Loader2 className="animate-spin text-[#62298E]" /></div> : <>
        <div className="admin-stat-grid">
          <Stat label="Total merchandising items" value={total} foot={`All ${title} sections`} icon="✦" />
          <Stat label="Active" value={activeCount} foot="Visible to storefront" icon="✓" />
          <Stat label="Archived" value={inactiveCount} foot="Hidden from storefront" icon="⌁" />
          <Stat label="Current section" value={items.length} foot={currentSection.label} icon="▣" />
        </div>
        <section className="mt-5 admin-card"><div className="admin-card-header"><div><h2 className="admin-card-title">{title} hero</h2><p className="admin-card-subtitle">Keep the storefront presentation editable without changing page code.</p></div><button className="admin-primary-button" disabled={saving || !heroDirty} onClick={() => void saveHero()}><Save size={15} /> {saving ? "Saving…" : "Save hero"}</button></div><div className="admin-card-body grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><div className="grid gap-4 sm:grid-cols-2"><Field label="Eyebrow" value={hero.eyebrow} onChange={(value) => { setHero((x) => ({ ...x, eyebrow: value })); setHeroDirty(true); }} /><Field label="Heading" value={hero.heading} onChange={(value) => { setHero((x) => ({ ...x, heading: value })); setHeroDirty(true); }} /><Field label="CTA text" value={hero.ctaText} onChange={(value) => { setHero((x) => ({ ...x, ctaText: value })); setHeroDirty(true); }} /><Field label="CTA link" value={hero.ctaLink} onChange={(value) => { setHero((x) => ({ ...x, ctaLink: value })); setHeroDirty(true); }} /><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Description</span><textarea value={hero.description} onChange={(event) => { setHero((x) => ({ ...x, description: event.target.value })); setHeroDirty(true); }} className="min-h-24 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3E155C]" /></label><label className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" checked={hero.active} onChange={(event) => { setHero((x) => ({ ...x, active: event.target.checked })); setHeroDirty(true); }} /> Show hero on storefront</label></div><div className="grid gap-4"><ImageField label="Desktop image" value={hero.desktopImage} onChange={value=>{setHero(x=>({...x,desktopImage:value}));setHeroDirty(true);}} disabled={uploading} onUpload={async (file) => { setUploading(true); try { const form = new FormData(); form.append("file", file); form.append("page", page); form.append("section", "hero"); const response = await fetch("/api/admin/uploads/merchandising", { method: "POST", headers: { Authorization: `Bearer ${await getToken()}` }, body: form }); const result = await response.json() as { url?: string; error?: string }; if (!response.ok || !result.url) throw new Error(result.error || "Unable to upload image."); setHero((x) => ({ ...x, desktopImage: result.url || "" })); setHeroDirty(true); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to upload image."); } finally { setUploading(false); } }} /><ImageField label="Mobile image" value={hero.mobileImage} onChange={value=>{setHero(x=>({...x,mobileImage:value}));setHeroDirty(true);}} disabled={uploading} onUpload={async (file) => { setUploading(true); try { const form = new FormData(); form.append("file", file); form.append("page", page); form.append("section", "hero-mobile"); const response = await fetch("/api/admin/uploads/merchandising", { method: "POST", headers: { Authorization: `Bearer ${await getToken()}` }, body: form }); const result = await response.json() as { url?: string; error?: string }; if (!response.ok || !result.url) throw new Error(result.error || "Unable to upload image."); setHero((x) => ({ ...x, mobileImage: result.url || "" })); setHeroDirty(true); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to upload image."); } finally { setUploading(false); } }} /></div></div></section>
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><div className="admin-card min-w-0"><div className="admin-card-header"><div><h2 className="admin-card-title">{title} merchandising</h2><p className="admin-card-subtitle">Catalog data remains reusable; this controls storefront presentation.</p></div></div><div className="admin-card-body"><div className="flex flex-wrap gap-2 border-b border-[var(--admin-border)] pb-4">{sections.map((section) => <button key={section.type} onClick={() => { setActiveType(section.type); setEditingId(null); setDraft({ ...EMPTY_ITEM, type: section.type }); }} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${activeType === section.type ? "border-[#62298E] bg-[#E9DDF7] text-[#bd1d52]" : "border-slate-200 bg-white text-slate-600 hover:border-[#cbd5e1]"}`}>{section.label} <span className="ml-1 opacity-60">{data?.items.filter((item) => item.type === section.type).length || 0}</span></button>)}</div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-[var(--admin-border)] text-[10px] uppercase tracking-[.12em] text-slate-400"><th className="px-3 py-3">Item</th><th className="px-3 py-3">Slug</th><th className="px-3 py-3">Order</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="px-3 py-3"><div className="flex items-center gap-3">{item.image ? <img src={item.image} alt="" className="h-10 w-10 rounded-[10px] object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#E9DDF7] text-[#3E155C]"><ImagePlus size={16} /></div>}<div><strong className="text-[13px] text-slate-800">{item.name}</strong>{item.subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{item.subtitle}</p>}</div></div></td><td className="px-3 py-3 text-xs text-slate-500">{item.slug}</td><td className="px-3 py-3 text-xs font-semibold text-slate-600">{item.sortOrder}</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.active ? "bg-[#eefbf2] text-[#16803a]" : "bg-slate-100 text-slate-500"}`}>{item.active ? "Active" : "Archived"}</span></td><td className="px-3 py-3 text-right"><button onClick={() => edit(item)} className="mr-1 rounded-[9px] p-2 text-slate-500 hover:bg-slate-100 hover:text-[#3E155C]" aria-label="Edit"><Edit3 size={15} /></button>{item.active && <button onClick={() => void archive(item.id)} className="rounded-[9px] p-2 text-slate-500 hover:bg-[#E9DDF7] hover:text-[#bd1d52]" aria-label="Archive"><Trash2 size={15} /></button>}</td></tr>)}{items.length === 0 && <tr><td colSpan={5} className="px-3 py-14 text-center"><p className="text-sm font-semibold text-slate-600">No {currentSection.label.toLowerCase()} yet.</p><p className="mt-1 text-xs text-slate-400">Add the first record using the button above.</p></td></tr>}</tbody></table></div></div></div>
          <div className="admin-card h-fit"><div className="admin-card-header"><div><h2 className="admin-card-title">{editingId ? "Edit item" : "New item"}</h2><p className="admin-card-subtitle">{currentSection.label}</p></div>{editingId && <button className="admin-icon-button !h-9 !w-9 !min-w-0" onClick={() => { setEditingId(null); setDraft({ ...EMPTY_ITEM, type: activeType }); }}><X size={15} /></button>}</div><div className="admin-card-body grid gap-4"><Field label="Name" value={draft.name} onChange={(value) => updateDraft("name", value)} placeholder={currentSection.placeholder || "Enter a name"} /><details className="rounded-[10px] border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-bold text-[#3E155C]">More settings</summary><div className="mt-3"><Field label="URL name" value={draft.slug} onChange={(value) => updateDraft("slug", value)} placeholder="Created from the item name" /></div></details><Field label="Subtitle" value={draft.subtitle || ""} onChange={(value) => updateDraft("subtitle", value)} /><Field label="Description" value={draft.description || ""} onChange={(value) => updateDraft("description", value)} />{currentSection.relation && <InlineRelationChoice relation={currentSection.relation} options={relationOptions} allCategories={categories} department={page==="personalised"?"personalized":page} editing={!!editingId} mode={relationMode} onMode={setRelationMode} selected={draft.relatedId||""} onSelected={value=>updateDraft("relatedId",value)} name={masterName} onName={setMasterName} parentId={masterParentId} onParentId={setMasterParentId}/>}{(activeType==="featured"||activeType==="curated")&&<FeaturedProductChoice products={products} department={page==="personalised"?"personalized":page} selected={draft.featuredProductIds??[]} onChange={ids=>updateDraft("featuredProductIds",ids)}/>}{currentSection.numbers === "budget" && <div className="grid grid-cols-2 gap-3"><NumberField label="Minimum" value={draft.min} onChange={(value) => updateDraft("min", value)} /><NumberField label="Maximum" value={draft.max} onChange={(value) => updateDraft("max", value)} /></div>}{currentSection.numbers === "age" && <div className="grid grid-cols-2 gap-3"><NumberField label="Minimum age" value={draft.minimumAge} onChange={(value) => updateDraft("minimumAge", value)} /><NumberField label="Maximum age" value={draft.maximumAge} onChange={(value) => updateDraft("maximumAge", value)} /></div>}{currentSection.numbers === "years" && <NumberField label="Years" value={draft.years} onChange={(value) => updateDraft("years", value)} />}<NumberField label="Display order" value={draft.sortOrder} onChange={(value) => updateDraft("sortOrder", value ?? 0)} /><ImageField label="Image" value={draft.image || ""} onChange={value=>updateDraft("image",value)} disabled={uploading} onUpload={(file) => void upload(file)} /><MerchandisingPreview title={draft.name} subtitle={draft.subtitle} image={draft.image} active={draft.active}/><label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={draft.active} onChange={(event) => updateDraft("active", event.target.checked)} /> Published on storefront</label><button className="admin-primary-button w-full" disabled={saving || uploading || relationMissing} onClick={() => void saveItem()}><Save size={15} /> {saving ? "Saving…" : editingId ? "Save changes" : "Create item"}</button></div></div>
        </section>
      </>}
    </div>
  );
}

function Stat({ label, value, foot, icon }: { label: string; value: number; foot: string; icon: string }) { return <div className="admin-card admin-stat-card"><div className="admin-stat-top"><span className="admin-stat-label">{label}</span><span className="admin-stat-icon">{icon}</span></div><div className="admin-stat-value">{value}</div><div className="admin-stat-foot">{foot}</div></div>; }
function Field({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3E155C]" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value: number | undefined) => void }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input type="number" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3E155C]" /></label>; }
function ImageField({label,value,onUpload,onChange,disabled}:{label:string;value:string;onUpload:(file:File)=>void;onChange:(value:string)=>void;disabled:boolean}){
 return <div><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><div className="overflow-hidden rounded-[12px] border border-dashed border-slate-300 bg-slate-50">{value?<img src={value} alt={label+' preview'} className="h-32 w-full object-cover"/>:<div className="grid h-32 place-items-center text-xs text-slate-400"><ImagePlus size={20}/></div>}<div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white px-3 py-2"><label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#3E155C]"><ImagePlus size={15}/>{disabled?"Uploading…":value?"Replace image":"Upload image"}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={disabled} onChange={event=>{const file=event.target.files?.[0];if(file)onUpload(file);event.currentTarget.value="";}}/></label>{!!value&&<button type="button" disabled={disabled} onClick={()=>onChange("")} className="text-xs font-bold text-slate-500">Remove</button>}</div></div><label className="mt-2 block text-[11px] text-slate-500">Reuse an existing public ImageKit URL<input aria-label={label+" CDN URL"} value={value} onChange={event=>onChange(event.target.value)} className="mt-1 w-full rounded-[9px] border border-slate-200 px-2 py-1.5 text-xs"/></label><p className="mt-1 text-[11px] text-slate-400">Use a wide crop for banners; square crops work best for cards.</p></div>;
}
