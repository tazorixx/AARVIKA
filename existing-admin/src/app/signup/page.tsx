"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Eye, EyeOff, Gift, ShieldCheck } from "lucide-react";
import { assertFirebaseClientConfig, auth } from "../../lib/firebase";
import { describeAuthError, logAuthDebug } from "../../lib/auth/errors";
import { resolveSafeRedirect } from "../../lib/auth/redirect";

function SignupForm() {
  const params = useSearchParams();
  const destination = resolveSafeRedirect(params, "/account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password !== confirm) { setError("Your passwords do not match."); return; }
    setBusy(true);

    try {
      assertFirebaseClientConfig();
      logAuthDebug("sign-up started", { destination });
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name.trim() });
      await credential.user.getIdToken(true);
      if (!auth.currentUser || auth.currentUser.uid !== credential.user.uid) throw new Error("The Firebase session was not ready after sign-up.");

      // A Firebase Auth account is not enough for Gift4U. The customer profile
      // document is the application-level account record used by the dashboard.
      // Do not redirect until the server has successfully persisted it.
      const token = await credential.user.getIdToken(true);
      const profileResponse = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim(), phone: "" }),
        cache: "no-store",
      });

      const profilePayload = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) {
        const message =
          typeof profilePayload?.error === "string"
            ? profilePayload.error
            : `Profile creation failed (HTTP ${profileResponse.status}).`;
        throw new Error(message);
      }

      logAuthDebug("customer profile persisted", { uid: credential.user.uid });
      logAuthDebug("sign-up succeeded; navigating", destination);
      window.location.assign(destination);
    } catch (signupError) {
      logAuthDebug("sign-up failed", signupError instanceof Error ? signupError.message : signupError);
      setError(describeAuthError(signupError));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[#214c72]" aria-label="Gift4U home"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d92f66] text-white"><Gift size={20} /></span><span><strong className="block text-lg leading-none">Gift4U</strong><small className="text-[9px] font-bold tracking-[0.14em] text-[#bd1d52]">GIFTS FOR A HAPPIER YOU</small></span></Link>
        <section className="mt-7 grid overflow-hidden rounded-[24px] border border-[#eadfe5] bg-white shadow-[0_24px_70px_rgba(33,76,114,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden overflow-hidden bg-[#214c72] p-8 text-white sm:p-12 lg:block lg:min-h-[690px] lg:p-14"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d92f66]/25 blur-3xl" /><div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#2f628f]/40 blur-3xl" /><div className="relative"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><ShieldCheck size={22} /></span><p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b3c7]">Join Gift4U</p><h1 className="gift-heading mt-3 max-w-lg text-4xl font-bold leading-tight sm:text-5xl">Keep every thoughtful detail in one place.</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/75">Save addresses, keep favourite gifts close and make your next celebration easier to plan.</p></div></div>
          <div className="p-7 sm:p-10 lg:p-14"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d92f66]">Gift4U account</p><h2 className="gift-heading mt-2 text-3xl font-bold text-[#214c72] sm:text-4xl">Create your account</h2><p className="mt-2 text-sm leading-6 text-slate-500">A few details now means a smoother gifting experience later.</p>
            {error && <div className="mt-6 rounded-2xl border border-[#f0c9d6] bg-[#fff5f8] p-4 text-sm leading-6 text-[#8f2348]" role="alert">{error}</div>}
            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm font-bold text-slate-700">Full name<input className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
              <label className="block text-sm font-bold text-slate-700">Email<input className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label className="block text-sm font-bold text-slate-700">Password<span className="relative mt-2 block"><input className="w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 pr-12 outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type={showPassword ? "text" : "password"} minLength={6} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              <label className="block text-sm font-bold text-slate-700">Confirm password<span className="relative mt-2 block"><input className="w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 pr-12 outline-none focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type={showConfirm ? "text" : "password"} minLength={6} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" /><button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400" aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-5 py-3.5 font-bold text-white hover:bg-[#bd1d52] disabled:opacity-60">{busy ? "Creating your account…" : "Create account"}{!busy && <ArrowRight size={17} />}</button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link href={`/login?next=${encodeURIComponent(destination)}`} className="font-bold text-[#2f628f]">Sign in</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() { return <Suspense fallback={<main className="min-h-screen bg-[#fffafd] p-8"><div className="mx-auto max-w-6xl animate-pulse rounded-[24px] bg-white p-12">Loading Gift4U signup…</div></main>}><SignupForm /></Suspense>; }
