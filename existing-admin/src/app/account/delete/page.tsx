"use client";

import { signOut as firebaseSignOut } from "firebase/auth";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { loginHref } from "@/lib/auth/redirect";

export default function DeleteAccountPage() {
  const { user, loading } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function deleteAccount() {
    if (!user || confirmation !== "DELETE" || busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken(true);
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; code?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to delete your account.");
      setDone(true);
      await firebaseSignOut(auth).catch(() => undefined);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete your account.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Header />
    <main className="min-h-[70vh] bg-[#fffafd] px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-[#2f628f] hover:text-[#d92f66]"><ArrowLeft size={16} />Back to account</Link>
        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#eadfe5] bg-white shadow-[0_22px_60px_rgba(33,76,114,0.09)]">
          <div className="bg-[#214c72] px-7 py-8 text-white sm:px-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><ShieldCheck size={23} /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#f5b3c7]">Privacy & account</p>
            <h1 className="gift-heading mt-2 text-3xl font-bold sm:text-4xl">Delete your Gift4U account</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">This permanently removes your sign-in and customer profile. Gift4U keeps only limited transaction records where they are still needed for completed commerce, fraud prevention, accounting, disputes or legal obligations.</p>
          </div>

          <div className="space-y-6 p-7 sm:p-10">
            {loading ? <p className="text-sm text-slate-500">Checking your account…</p> : done ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800" role="status">
                <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} />Your account deletion is complete.</div>
                <p className="mt-2 leading-6">You have been signed out. You can continue browsing Gift4U without an account.</p>
                <Link href="/" className="mt-4 inline-flex rounded-full bg-[#214c72] px-5 py-2.5 font-bold text-white">Return home</Link>
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-[#dce8f2] bg-[#f7fbfe] p-5">
                <p className="font-bold text-[#214c72]">Sign in to verify ownership</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Account deletion requires authentication so another person cannot delete your Gift4U account.</p>
                <Link href={loginHref("/account/delete")} className="mt-4 inline-flex rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white">Sign in to continue</Link>
              </div>
            ) : <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e6edf2] p-5"><p className="font-bold text-[#214c72]">Removed</p><p className="mt-2 text-sm leading-6 text-slate-600">Profile, saved addresses, cart, wishlist, support tickets, review content, push-device registrations and authentication account.</p></div>
                <div className="rounded-2xl border border-[#e6edf2] p-5"><p className="font-bold text-[#214c72]">Minimised retention</p><p className="mt-2 text-sm leading-6 text-slate-600">Completed or terminal order records may remain with customer identity, address, gift message and personalisation removed where operational or legal retention is still required.</p></div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <div className="flex items-center gap-2 font-bold"><AlertTriangle size={18} />Active orders must be resolved first</div>
                <p className="mt-2">If an order is still awaiting payment, processing, shipping, delivery, or return resolution, deletion is blocked so Gift4U does not lose the information needed to fulfil or resolve that order. You can review Orders or contact Support first.</p>
              </div>

              <label className="block text-sm font-bold text-slate-700">Type <span className="text-[#b42318]">DELETE</span> to confirm
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoCapitalize="characters" autoComplete="off" className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 outline-none focus:border-[#b42318] focus:ring-4 focus:ring-red-100" placeholder="DELETE" />
              </label>

              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</div> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={confirmation !== "DELETE" || busy} onClick={() => void deleteAccount()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#b42318] px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"><Trash2 size={17} />{busy ? "Deleting account…" : "Permanently delete account"}</button>
                <Link href="/account" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3 font-bold text-[#214c72]">Keep my account</Link>
              </div>
            </>}
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
