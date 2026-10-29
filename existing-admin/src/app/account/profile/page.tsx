"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import AccountShell from "../../../components/account/AccountShell";
import AccountPageHeader from "../../../components/account/AccountPageHeader";
import AccountCard from "../../../components/account/AccountCard";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

export default function AccountProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      if (!authLoading) Promise.resolve().then(() => setLoading(false));
      return;
    }
    const authUser = user;
    let cancelled = false;
    async function load() {
      try {
        const token = await authUser.getIdToken();
        const response = await fetch("/api/account/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Unable to load profile");
        const data = await response.json();
        if (!cancelled) {
          setName(data.profile?.name || authUser.displayName || "");
          setPhone(data.profile?.phone || "");
          setEmail(data.profile?.email || authUser.email || "");
        }
      } catch {
        if (!cancelled) setError("We couldn't load your profile. Please refresh and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading || loading) return <><Header /><main className="min-h-screen bg-[#fffafd] px-4 py-20 text-center text-sm text-slate-500">Loading your profile…</main><Footer /></>;
  if (!user) return <><Header /><main className="min-h-screen bg-[#fffafd] px-4 py-20 text-center"><p className="text-slate-600">Please sign in to view your profile.</p><Link href="/login?next=/account/profile" className="mt-4 inline-flex rounded-full bg-[#d92f66] px-5 py-3 text-sm font-bold text-white">Sign in</Link></main><Footer /></>;

  // Keep a narrowed, non-null reference for event handlers. TypeScript cannot
  // safely preserve the component-level narrowing of `user` inside `submit`.
  const authUser = user;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update profile");
      setMessage("Your profile has been saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update your profile right now.");
    } finally { setBusy(false); }
  }

  return (
    <AccountShell header={<AccountPageHeader eyebrow="Personal details" title="Your profile" description="Keep your details ready for smoother gifting and delivery." icon={<UserRound size={24} />} />}>
      <AccountCard className="mt-5">
        <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Full name<input className="mt-2 w-full rounded-[10px] border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 outline-none transition focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>
            <label className="block text-sm font-semibold text-slate-700">Phone number <span className="font-normal text-slate-400">(optional)</span><div className="mt-2 flex items-center rounded-[10px] border border-slate-200 bg-[#fbfcfd] focus-within:border-[#2f628f] focus-within:ring-4 focus-within:ring-[#2f628f]/10"><Phone size={17} className="ml-4 text-slate-400" /><input className="w-full bg-transparent px-3 py-3.5 outline-none" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile number" autoComplete="tel" inputMode="tel" /></div></label>
            <div className="sm:col-span-2"><label className="block text-sm font-semibold text-slate-700">Email address<div className="mt-2 flex items-center rounded-[10px] border border-slate-200 bg-slate-50"><Mail size={17} className="ml-4 text-slate-400" /><input className="w-full bg-transparent px-3 py-3.5 text-slate-500 outline-none" value={email} readOnly /></div></label><p className="mt-2 text-xs text-slate-400">Your sign-in email is managed securely by Firebase Authentication.</p></div>
          </div>
          {message && <div className="flex items-center gap-2 rounded-[10px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status"><CheckCircle2 size={18} /> {message}</div>}
          {error && <p className="rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-[#bd1d52]" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link href="/account" className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-bold text-slate-600 transition hover:border-[#2f628f] hover:text-[#214c72]">Cancel</Link><button disabled={busy} className="rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd1d52] disabled:opacity-60">{busy ? "Saving…" : "Save profile"}</button></div>
        </form>
      </AccountCard>
    </AccountShell>
  );
}
