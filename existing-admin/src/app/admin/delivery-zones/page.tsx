"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { auth } from "@/lib/firebase";

type Slot = { label: string; fee: number; capacityPerSlot: number; active: boolean };
type Zone = {
  id: string; name: string; country: string; state?: string; cities: string[]; pincodes: string[];
  active: boolean; overrideProductDelivery: boolean;
  delivery: { minDays?: number; maxDays?: number; sameDay?: boolean; scheduled?: boolean; midnight?: boolean; fee?: number; slotFees?: Record<string, number>; cutoffHour?: number; capacityPerSlot?: number; slots?: Slot[]; holidays?: string[] };
};

type Form = {
  name: string; country: string; state: string; cities: string; pincodes: string; holidays: string;
  active: boolean; overrideProductDelivery: boolean; minDays: string; maxDays: string; sameDay: boolean;
  midnight: boolean; fee: string; cutoffHour: string; capacityPerSlot: string;
  slotFees: Record<string, string>; slotCapacities: Record<string, string>;
};

const SLOT_LABELS = ["9 AM – 12 PM", "12 PM – 3 PM", "3 PM – 6 PM", "6 PM – 9 PM", "10 PM – 12 AM"];
const emptyForm: Form = {
  name: "", country: "India", state: "", cities: "", pincodes: "", holidays: "", active: true,
  overrideProductDelivery: true, minDays: "2", maxDays: "5", sameDay: false, midnight: false, fee: "0", cutoffHour: "18", capacityPerSlot: "0",
  slotFees: Object.fromEntries(SLOT_LABELS.map((label) => [label, "0"])),
  slotCapacities: Object.fromEntries(SLOT_LABELS.map((label) => [label, "0"])),
};

function csv(value: string) { return value.split(",").map((v) => v.trim()).filter(Boolean); }
function formFromZone(zone: Zone): Form {
  return {
    name: zone.name, country: zone.country || "India", state: zone.state || "", cities: zone.cities.join(", "), pincodes: zone.pincodes.join(", "), holidays: zone.delivery.holidays?.join(", ") || "",
    active: zone.active, overrideProductDelivery: zone.overrideProductDelivery, minDays: String(zone.delivery.minDays ?? 0), maxDays: String(zone.delivery.maxDays ?? Math.max(zone.delivery.minDays ?? 0, 5)), sameDay: Boolean(zone.delivery.sameDay), midnight: Boolean(zone.delivery.midnight), fee: String(zone.delivery.fee ?? 0), cutoffHour: String(zone.delivery.cutoffHour ?? 18), capacityPerSlot: String(zone.delivery.capacityPerSlot ?? 0),
    slotFees: Object.fromEntries(SLOT_LABELS.map((label) => [label, String(zone.delivery.slots?.find((slot) => slot.label === label)?.fee ?? zone.delivery.slotFees?.[label] ?? 0)])),
    slotCapacities: Object.fromEntries(SLOT_LABELS.map((label) => [label, String(zone.delivery.slots?.find((slot) => slot.label === label)?.capacityPerSlot ?? zone.delivery.capacityPerSlot ?? 0)])),
  };
}

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]); const [form, setForm] = useState<Form>(emptyForm); const [editing, setEditing] = useState<string | null>(null); const [search, setSearch] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function request(path: string, options: RequestInit = {}) { const user = auth.currentUser; if (!user) throw new Error("Please sign in."); const token = await user.getIdToken(); const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed."); return data; }
  async function load() { const data = await request("/api/admin/delivery-zones"); setZones(data || []); }
  useEffect(() => { void Promise.resolve().then(() => load()).catch((e) => setError(e.message)); }, []);
  function reset() { setEditing(null); setForm(emptyForm); }
  function edit(zone: Zone) { setEditing(zone.id); setForm(formFromZone(zone)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function payload() {
    const slotActive = new Set(SLOT_LABELS.slice(0, form.midnight ? 5 : 4));
    return { name: form.name, country: form.country, state: form.state || undefined, cities: csv(form.cities), pincodes: csv(form.pincodes), holidays: csv(form.holidays), active: form.active, overrideProductDelivery: form.overrideProductDelivery, delivery: { minDays: Number(form.minDays), maxDays: Number(form.maxDays), sameDay: form.sameDay, scheduled: true, midnight: form.midnight, fee: Number(form.fee), cutoffHour: Number(form.cutoffHour), capacityPerSlot: Number(form.capacityPerSlot), slotFees: Object.fromEntries(SLOT_LABELS.map((label) => [label, Number(form.slotFees[label] || 0)])), slots: SLOT_LABELS.map((label) => ({ label, fee: Number(form.slotFees[label] || 0), capacityPerSlot: Number(form.slotCapacities[label] || 0), active: slotActive.has(label) })) } };
  }
  async function save() { setSaving(true); setError(""); try { if (editing) await request(`/api/admin/delivery-zones/${editing}`, { method: "PATCH", body: JSON.stringify(payload()) }); else await request("/api/admin/delivery-zones", { method: "POST", body: JSON.stringify(payload()) }); reset(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save zone."); } finally { setSaving(false); } }
  async function remove(zone: Zone) { if (!window.confirm(`Delete delivery zone "${zone.name}"?`)) return; try { await request(`/api/admin/delivery-zones/${zone.id}`, { method: "DELETE" }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete zone."); } }
  const visible = useMemo(() => zones.filter((zone) => [zone.name, zone.state, ...zone.cities, ...zone.pincodes].filter(Boolean).join(" ").toLowerCase().includes(search.trim().toLowerCase())), [zones, search]);
  const field = (label: string, key: keyof Form, type = "text") => <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input type={type} value={String(form[key])} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3E155C]" /></label>;
  return <main className="min-h-screen bg-[#fffafd]"><div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#62298E]">Operations</p><h1 className="gift-heading text-3xl font-bold text-[#3E155C]">Delivery Zones</h1><p className="mt-2 max-w-3xl text-sm text-slate-500">Define reusable pincode/city delivery defaults. Existing product-level rules remain the fallback when a zone is not configured.</p></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-[#62298E] px-5 py-3 text-sm font-bold text-white"><Plus size={16}/> New zone</button></div>
    {error && <div className="mt-5 rounded-[12px] border border-[#f0cbd7] bg-white p-4 text-sm text-[#bd1d52]">{error}</div>}
    <section className="mt-6 rounded-[14px] border border-[#e3eaf0] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">{editing ? "Edit delivery zone" : "Create delivery zone"}</h2>{editing && <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><X size={14}/> Cancel</button>}</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{field("Zone name","name")}{field("Country","country")}{field("State / region","state")}{field("Cities (comma separated)","cities")}{field("Pincodes (comma separated)","pincodes")}{field("Blocked holidays (YYYY-MM-DD)","holidays")}{field("Minimum days","minDays","number")}{field("Maximum days","maxDays","number")}{field("Base delivery fee","fee","number")}{field("Same-day cutoff hour (IST)","cutoffHour","number")}{field("Default capacity / slot","capacityPerSlot","number")}
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={form.active} onChange={(e)=>setForm({...form,active:e.target.checked})}/> Active</label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={form.overrideProductDelivery} onChange={(e)=>setForm({...form,overrideProductDelivery:e.target.checked})}/> Zone overrides product delivery</label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={form.sameDay} onChange={(e)=>setForm({...form,sameDay:e.target.checked})}/> Same-day available</label>
        <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={form.midnight} onChange={(e)=>setForm({...form,midnight:e.target.checked})}/> Midnight slot available</label>
      </div>
      <div className="mt-5 rounded-[12px] bg-[#f5fbff] p-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">{SLOT_LABELS.map((label)=><div key={label} className="rounded-[12px] bg-white p-3"><p className="text-xs font-bold text-[#3E155C]">{label}</p><label className="mt-2 block text-[11px] font-semibold text-slate-500">Fee<input type="number" min="0" value={form.slotFees[label]} onChange={(e)=>setForm(v=>({...v,slotFees:{...v.slotFees,[label]:e.target.value}}))} className="mt-1 w-full rounded-[10px] border border-slate-200 px-2 py-1.5 text-sm"/></label><label className="mt-2 block text-[11px] font-semibold text-slate-500">Capacity<input type="number" min="0" value={form.slotCapacities[label]} onChange={(e)=>setForm(v=>({...v,slotCapacities:{...v.slotCapacities,[label]:e.target.value}}))} className="mt-1 w-full rounded-[10px] border border-slate-200 px-2 py-1.5 text-sm"/></label></div>)}</div></div>
      <button disabled={saving} onClick={()=>void save()} className="mt-5 rounded-full bg-[#3E155C] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Create zone"}</button>
    </section>
    <section className="mt-6 rounded-[14px] border border-[#e3eaf0] bg-white p-4 shadow-sm"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search zone, city or pincode" className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm"/></div></section>
    <section className="mt-4 overflow-hidden rounded-[14px] border border-[#e3eaf0] bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f5fbff] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Zone</th><th className="px-5 py-4">Coverage</th><th className="px-5 py-4">Delivery</th><th className="px-5 py-4">Mode</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody>{visible.map((zone)=><tr key={zone.id} className="border-t border-slate-100"><td className="px-5 py-4"><strong className="text-[#3E155C]">{zone.name}</strong><small className="block text-xs text-slate-500">{zone.state || zone.country}</small></td><td className="px-5 py-4 text-xs text-slate-600">{zone.pincodes.length} pincodes · {zone.cities.length} cities</td><td className="px-5 py-4 text-xs text-slate-600">{zone.delivery.sameDay ? "Same-day" : `${zone.delivery.minDays ?? 0}–${zone.delivery.maxDays ?? 0} days`} · ₹{zone.delivery.fee ?? 0}</td><td className="px-5 py-4 text-xs">{zone.overrideProductDelivery ? "Zone override" : "Product fallback"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${zone.active ? "bg-[#fde8f0] text-[#bd1d52]" : "bg-slate-100 text-slate-500"}`}>{zone.active ? "Active" : "Disabled"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={()=>edit(zone)} className="rounded-full border border-slate-200 p-2 text-[#3E155C]" title="Edit"><Pencil size={15}/></button><button onClick={()=>void remove(zone)} className="rounded-full border border-[#f0cbd7] p-2 text-[#bd1d52]" title="Delete"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>{visible.length===0&&<div className="p-10 text-center text-sm text-slate-500">No delivery zones yet.</div>}</section>
  </div></main>;
}
