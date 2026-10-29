"use client";

import { CalendarDays, CheckCircle2, Clock3, MapPin, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product, ProductDelivery } from "@/lib/catalog/types";

export type DeliverySelection = { pincode: string; date: string; slot: string };
const STANDARD_SLOTS = ["9 AM – 12 PM", "12 PM – 3 PM", "3 PM – 6 PM", "6 PM – 9 PM"];

function dateKey(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function dateLabel(date: Date) { return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
function buildDates(delivery: ProductDelivery, holidays: string[]) {
  const startOffset = delivery.sameDay ? 0 : Math.max(0, delivery.minDays ?? 2);
  const maxDays = Math.max(startOffset, delivery.maxDays ?? startOffset + 14);
  const result: { value: string; label: string }[] = [];
  for (let offset = startOffset; offset <= maxDays && result.length < 5; offset += 1) {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + offset);
    const key = dateKey(date); if (!holidays.includes(key)) result.push({ value: key, label: dateLabel(date) });
  }
  return result;
}

export default function DeliveryChecker({ product, value, onChange }: { product: Product; value: DeliverySelection | null; onChange: (value: DeliverySelection | null) => void }) {
  const [pincode, setPincode] = useState(value?.pincode || "");
  const [message, setMessage] = useState("");
  const [serviceable, setServiceable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [effectiveDelivery, setEffectiveDelivery] = useState<ProductDelivery>(product.delivery);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [zoneName, setZoneName] = useState("");

  const dates = useMemo(() => buildDates(effectiveDelivery, holidays), [effectiveDelivery, holidays]);
  const slots = useMemo(() => {
    const base = [...STANDARD_SLOTS];
    if (effectiveDelivery.midnight) base.push("10 PM – 12 AM");
    return base;
  }, [effectiveDelivery.midnight]);

  async function check() {
    const valueToCheck = pincode.trim(); setServiceable(false); onChange(null); setMessage("");
    if (!/^\d{6}$/.test(valueToCheck)) { setMessage("Enter a valid 6-digit pincode."); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/delivery/availability?productId=${encodeURIComponent(product.id)}&pincode=${encodeURIComponent(valueToCheck)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to check delivery.");
      setEffectiveDelivery(data.delivery || product.delivery); setHolidays(Array.isArray(data.holidays) ? data.holidays : []); setZoneName(data.zone?.name || ""); setServiceable(true);
      setMessage(data.zone?.name ? `Delivery is available in ${data.zone.name}. Choose a date and preferred time slot.` : "Delivery is available to this pincode. Choose a date and preferred time slot.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to check delivery right now."); }
    finally { setLoading(false); }
  }

  function selectDate(date: string) { if (!serviceable) return; onChange({ pincode, date, slot: value?.slot || "" }); }
  function selectSlot(slot: string) { if (!serviceable) return; onChange({ pincode, date: value?.date || dates[0]?.value || "", slot }); }

  return <div className="rounded-[14px] border border-[#e6edf2] bg-[#f5fbff] p-4">
    <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#2f628f] shadow-sm"><Truck size={17} /></div><div><p className="text-sm font-bold text-[#214c72]">Check delivery to your address</p><p className="mt-1 text-xs leading-5 text-slate-500">Enter your pincode first, then choose the delivery date and preferred time.</p></div></div>
    <div className="mt-3 flex flex-wrap gap-2">{effectiveDelivery.sameDay && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#d92f66]">Same-day available</span>}{effectiveDelivery.express && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#2f628f]">Express delivery</span>}{effectiveDelivery.scheduled && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#214c72]">Scheduled delivery</span>}{effectiveDelivery.midnight && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#7d5b13]">Midnight delivery</span>}</div>
    <div className="mt-3 flex gap-2"><div className="relative min-w-0 flex-1"><MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={pincode} onChange={(event)=>{const next=event.target.value.replace(/\D/g,"").slice(0,6);setPincode(next);setServiceable(false);setMessage("");onChange(null);}} onKeyDown={(event)=>{if(event.key==="Enter")void check();}} inputMode="numeric" maxLength={6} placeholder="6-digit pincode" aria-label="Delivery pincode" className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#2f628f] focus:ring-2 focus:ring-[#2f628f]/10" /></div><button type="button" onClick={()=>void check()} disabled={loading} className="rounded-full bg-[#2f628f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#214c72] disabled:opacity-60">{loading ? "Checking…" : "Check"}</button></div>
    {message && <p className={`mt-3 flex items-start gap-2 text-sm font-semibold ${serviceable ? "text-emerald-700" : "text-[#bd1d52]"}`}>{serviceable ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : null}{message}</p>}
    {serviceable && <div className="mt-4 space-y-4 border-t border-[#dcebf4] pt-4"><div><div className="flex items-center gap-2"><CalendarDays size={16} className="text-[#2f628f]" /><p className="text-sm font-bold text-[#214c72]">Choose delivery date</p></div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">{dates.map((date)=><button key={date.value} type="button" onClick={()=>selectDate(date.value)} className={`rounded-[14px] border px-2 py-3 text-xs font-bold transition ${value?.date===date.value?"border-[#d92f66] bg-[#fff0f5] text-[#bd1d52]":"border-slate-200 bg-white text-[#214c72] hover:border-[#2f628f]"}`}>{date.label}</button>)}</div></div><div><div className="flex items-center gap-2"><Clock3 size={16} className="text-[#2f628f]" /><p className="text-sm font-bold text-[#214c72]">Preferred time slot</p></div><div className="mt-2 grid grid-cols-2 gap-2">{slots.map((slot)=><button key={slot} type="button" onClick={()=>selectSlot(slot)} className={`rounded-full border px-3 py-2.5 text-xs font-bold transition ${value?.slot===slot?"border-[#d92f66] bg-[#fff0f5] text-[#bd1d52]":"border-slate-200 bg-white text-[#214c72] hover:border-[#2f628f]"}`}>{slot}</button>)}</div></div>{zoneName && <p className="rounded-[14px] bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">Delivery zone: <span className="text-[#214c72]">{zoneName}</span></p>}{value?.date&&value.slot&&<p className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-3 text-xs font-bold text-[#214c72]"><CheckCircle2 size={15} className="text-emerald-600" />Delivery selected for {dateLabel(new Date(`${value.date}T12:00:00`))}, {value.slot}.</p>}</div>}
  </div>;
}
