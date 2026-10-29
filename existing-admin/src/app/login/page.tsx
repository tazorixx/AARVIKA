"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Eye, EyeOff, Gift, ShieldCheck } from "lucide-react";
import { assertFirebaseClientConfig, auth } from "../../lib/firebase";
import { describeAuthError, logAuthDebug } from "../../lib/auth/errors";
import { resolveSafeRedirect } from "../../lib/auth/redirect";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = resolveSafeRedirect(params, "/account");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    logAuthDebug("sign-in started", { destination });

    try {
      assertFirebaseClientConfig();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = credential.user;
      if (!user) throw new Error("Sign-in did not return an authenticated user.");

      logAuthDebug("Firebase sign-in succeeded", user.uid);
      await user.getIdToken(true);
      if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
        throw new Error("The Firebase session was not ready after sign-in.");
      }
      logAuthDebug("Firebase session verified");

      {
        // Customer login is intentionally independent from admin role claims.
        // An administrator may use the storefront like any other customer.
        // The customer redirect resolver already prevents a customer login
        // request from being used to enter the /admin namespace.
        // Repair/migrate older accounts that have Firebase Auth but no Gift4U
        // customer document, and verify the document before entering /account.
        const token = await user.getIdToken(true);
        const fallbackName =
          user.displayName?.trim() || user.email?.split("@")[0]?.trim() || "Gift4U customer";
        const profileResponse = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: fallbackName, phone: "" }),
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
        logAuthDebug("customer profile verified", { uid: user.uid });
      }

      logAuthDebug("navigating", destination);
      window.location.assign(destination);
    } catch (loginError) {
      logAuthDebug("sign-in failed", loginError instanceof Error ? loginError.message : loginError);
      setError(describeAuthError(loginError));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[#214c72]" aria-label="Gift4U home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d92f66] text-white"><Gift size={20} /></span>
          <span><strong className="block text-lg leading-none">Gift4U</strong><small className="text-[9px] font-bold tracking-[0.14em] text-[#bd1d52]">GIFTS FOR A HAPPIER YOU</small></span>
        </Link>

        <section className="mt-7 grid overflow-hidden rounded-[24px] border border-[#eadfe5] bg-white shadow-[0_24px_70px_rgba(33,76,114,0.10)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-[#214c72] p-8 text-white sm:p-12 lg:min-h-[620px] lg:p-14">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#d92f66]/25 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#2f628f]/40 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><ShieldCheck size={22} /></span>
                <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b3c7]">Welcome back</p>
                <h1 className="gift-heading mt-3 max-w-lg text-4xl font-bold leading-tight sm:text-5xl">Make every moment worth remembering.</h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/75">Sign in to keep your saved gifts, orders and delivery details together — and continue exactly where you left off.</p>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-3 text-xs font-semibold text-white/80">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Saved gifts</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Easy checkout</div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Order updates</div>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d92f66]">Gift4U account</p>
            <h2 className="gift-heading mt-2 text-3xl font-bold text-[#214c72] sm:text-4xl">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your gifts and orders are just a sign-in away.</p>

            {error && <div className="mt-6 rounded-2xl border border-[#f0c9d6] bg-[#fff5f8] p-4 text-sm leading-6 text-[#8f2348]" role="alert">{error}</div>}

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              <label className="block text-sm font-bold text-slate-700">Email
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 outline-none transition focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                <span className="flex items-center justify-between">Password <Link href="/forgot-password" className="text-xs text-[#2f628f] hover:text-[#d92f66]">Forgot password?</Link></span>
                <span className="relative mt-2 block">
                  <input className="w-full rounded-2xl border border-slate-200 bg-[#fbfcfd] px-4 py-3.5 pr-12 outline-none transition focus:border-[#2f628f] focus:ring-4 focus:ring-[#2f628f]/10" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-[#214c72]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                </span>
              </label>
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d92f66] px-5 py-3.5 font-bold text-white transition hover:bg-[#bd1d52] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}{!busy && <ArrowRight size={17} />}</button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">New to Gift4U? <Link className="font-bold text-[#2f628f] hover:text-[#d92f66]" href={`/signup?next=${encodeURIComponent(destination)}`}>Create an account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#fffafd] p-8"><div className="mx-auto max-w-6xl animate-pulse rounded-[24px] bg-white p-12">Loading Gift4U sign in…</div></main>}><LoginForm /></Suspense>;
}
