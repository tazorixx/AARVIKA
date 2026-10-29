"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, Home, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import AccountShell from "../../../components/account/AccountShell";
import AccountPageHeader from "../../../components/account/AccountPageHeader";
import AccountCard from "../../../components/account/AccountCard";
import AccountEmptyState from "../../../components/account/AccountEmptyState";
import AddressAutocomplete from "../../../components/AddressAutocomplete";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  isDefault: boolean;
};

type AddressForm = Omit<Address, "id" | "isDefault"> & { isDefault: boolean };

const emptyForm: AddressForm = { label: "Home", name: "", phone: "", addressLine: "", city: "", state: "", pincode: "", landmark: "", isDefault: false };

export default function AddressesPage() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addressSearch, setAddressSearch] = useState("");

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/account/addresses", { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load addresses.");
      setAddresses(data.addresses || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your addresses.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (!authLoading) void Promise.resolve().then(() => loadAddresses()); }, [authLoading, loadAddresses]);

  function openNew() { setEditingId(null); setForm({ ...emptyForm, isDefault: addresses.length === 0 }); setAddressSearch(""); setShowForm(true); setError(""); setMessage(""); }
  function openEdit(address: Address) { setEditingId(address.id); setForm({ ...address }); setAddressSearch(address.addressLine); setShowForm(true); setError(""); setMessage(""); }
  function closeForm() { if (!saving) setShowForm(false); }
  function update(field: keyof AddressForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(editingId ? `/api/account/addresses/${editingId}` : "/api/account/addresses", {
        method: editingId ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save address.");
      setShowForm(false); setMessage(editingId ? "Address updated." : "Address saved.");
      await loadAddresses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this address.");
    } finally { setSaving(false); }
  }

  async function remove(address: Address) {
    if (!user || !window.confirm(`Remove the ${address.label.toLowerCase()} address?`)) return;
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove address.");
      setMessage("Address removed."); await loadAddresses();
    } catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Unable to remove this address."); }
  }

  if (authLoading) return <>
    <Header />
    <main className="customer-shell min-h-screen bg-[#fffafd] px-4 py-20 text-center text-sm text-slate-500">Loading your addresses…</main>
    <Footer />
  </>;
  if (!user) return <>
    <Header />
    <main className="customer-shell min-h-screen bg-[#fffafd] px-4 py-20 text-center"><p className="text-slate-600">Please sign in to manage your saved addresses.</p><Link href="/login?next=/account/addresses" className="mt-4 inline-flex rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white">Sign in</Link></main>
    <Footer />
  </>;

  return (
    <AccountShell header={<AccountPageHeader eyebrow="Delivery made easier" title="Saved addresses" description="Keep your favourite delivery spots ready for the next thoughtful surprise." icon={<MapPin size={24} />} action={<button onClick={openNew} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd1d52] sm:w-auto"><Plus size={17} /> Add address</button>} />}>
      <AccountCard className="mt-5 p-5 sm:p-7">
        {message && <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><Check size={18} /> {message}</div>}
        {error && <div className="mb-5 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#bd1d52]" role="alert">{error}</div>}
        {loading ? <div className="rounded-[14px] border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">Loading your saved addresses…</div> : addresses.length === 0 ? (
          <AccountEmptyState icon={<MapPin size={25} />} title="No saved addresses yet" description="Add your home, office or a favourite delivery spot once. We’ll keep it ready for checkout." actions={<button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#bd1d52]"><Plus size={17} /> Add your first address</button>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="relative rounded-[14px] border border-[#e5edf4] bg-white p-5 shadow-[0_4px_18px_rgba(33,76,114,0.035)] transition hover:border-[#efbfd0] hover:shadow-md">
                <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f5] text-[#d92f66]"><Home size={19} /></span><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-800">{address.label}</h2>{address.isDefault && <span className="rounded-full bg-[#f5fbff] px-2.5 py-1 text-[11px] font-bold text-[#2f628f]">Default</span>}</div><p className="mt-0.5 text-xs text-slate-400">{address.name}</p></div></div><div className="flex gap-1"><button aria-label={`Edit ${address.label} address`} onClick={() => openEdit(address)} className="rounded-full p-2 text-slate-400 hover:bg-[#f5fbff] hover:text-[#2f628f]"><Pencil size={16} /></button><button aria-label={`Delete ${address.label} address`} onClick={() => void remove(address)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-[#bd1d52]"><Trash2 size={16} /></button></div></div>
                <div className="mt-5 space-y-1 text-sm leading-6 text-slate-600"><p>{address.addressLine}</p><p>{address.city}, {address.state} — {address.pincode}</p>{address.landmark && <p className="text-slate-400">Near {address.landmark}</p>}<p className="pt-2 font-semibold text-slate-700">{address.phone}</p></div>
              </article>
            ))}
          </div>
        )}
      </AccountCard>

      {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"><div className="w-full max-h-[92vh] overflow-hidden rounded-t-[26px] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[26px]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-6"><div><h2 className="gift-heading text-xl font-bold text-[#214c72] sm:text-2xl">{editingId ? "Edit address" : "Add a delivery address"}</h2><p className="mt-0.5 text-[11px] text-slate-500">Use the details exactly as your courier should receive them.</p></div><button onClick={closeForm} className="rounded-full p-2 text-slate-400 hover:bg-slate-50" aria-label="Close"><X size={20} /></button></div>
        <form onSubmit={submit} className="grid gap-2.5 overflow-y-auto p-4 sm:gap-3 sm:p-5">
          <div className="sm:col-span-2 rounded-xl border border-[#dfeaf1] bg-[#f7fbfd] p-2.5 sm:p-3">
            <label className="block text-xs font-bold text-slate-700">Search address</label>
            <AddressAutocomplete
              value={addressSearch}
              onChange={setAddressSearch}
              onAddressSelected={(address) => {
                setAddressSearch(address.addressLine);
                setForm((current) => ({
                  ...current,
                  addressLine: address.addressLine,
                  city: address.city || current.city,
                  state: address.state || current.state,
                  pincode: address.pincode || current.pincode,
                }));
              }}
              placeholder="Search your address, building, street..."
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2f628f] focus:ring-2 focus:ring-[#2f628f]/10"
            />
            <span className="mt-0.5 block text-[10px] leading-4 font-normal text-slate-400">Select a suggestion to auto-fill the details below.</span>
          </div>

          <label className="sm:col-span-2 block text-sm font-semibold text-slate-700">Address<span className="text-[#d92f66]"> *</span>
            <input required value={form.addressLine} onChange={(e) => update("addressLine", e.target.value)} placeholder="Flat, building, street" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 text-sm outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" />
            <span className="mt-1 block text-[11px] font-normal text-slate-400">You can edit the address after selecting a suggestion.</span>
          </label>

          {([ ["city","City","City"], ["state","State","State"], ["pincode","Pincode","6-digit pincode"], ["landmark","Landmark","Optional"] ] as const).map(([field, label, placeholder]) => <label key={field} className="block text-sm font-semibold text-slate-700">{label}{field !== "landmark" && <span className="text-[#d92f66]"> *</span>}<input required={field !== "landmark"} inputMode={field === "pincode" ? "numeric" : undefined} maxLength={field === "pincode" ? 6 : undefined} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 text-sm outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" value={String(form[field])} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} /></label>)}

          {([ ["name","Recipient name","Full name"], ["phone","Phone number","10-digit mobile number"] ] as const).map(([field, label, placeholder]) => <label key={field} className="block text-sm font-semibold text-slate-700">{label}<span className="text-[#d92f66]"> *</span><input required inputMode={field === "phone" ? "numeric" : undefined} maxLength={field === "phone" ? 10 : undefined} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 text-sm outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" value={String(form[field])} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} /></label>)}

          <label className="block text-sm font-semibold text-slate-700">Label<span className="text-[#d92f66]"> *</span><input required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#fbfcfd] px-3.5 py-2.5 text-sm outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Home / Office" /></label>
          <label className="flex min-h-[42px] items-center gap-2 rounded-xl border border-[#e5eef4] bg-[#f5fbff] px-3.5 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={form.isDefault} onChange={(e) => update("isDefault", e.target.checked)} className="h-4 w-4 shrink-0 accent-[#d92f66]" /> Make this my default delivery address</label>
          {error && <p className="sm:col-span-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#bd1d52]" role="alert">{error}</p>}
          <div className="sm:col-span-2 flex flex-row justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={closeForm} className="rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-bold text-slate-600">Cancel</button><button disabled={saving} className="rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#bd1d52] disabled:opacity-60">{saving ? "Saving…" : editingId ? "Save changes" : "Save address"}</button></div>
        </form>
      </div></div>}
    </AccountShell>
  );
}
