"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Gift, ShieldCheck } from "lucide-react";
import { assertFirebaseClientConfig, auth } from "../../../lib/firebase";
import { describeAuthError, logAuthDebug } from "../../../lib/auth/errors";
import { resolveAdminRedirect } from "../../../lib/auth/redirect";

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "SUPPORT",
]);

function AdminLoginForm() {
  const params = useSearchParams();
  const destination = resolveAdminRedirect(params, "/admin");
  const [ready,setReady]=useState(false);
  useEffect(()=>{void Promise.resolve().then(()=>setReady(true));},[]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready) return;

    setError("");
    setBusy(true);

    try {
      assertFirebaseClientConfig();
      logAuthDebug("admin sign-in started", { destination });

      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = credential.user;
      if (!user) throw new Error("Sign-in did not return an authenticated user.");

      await user.getIdToken(true);
      if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
        throw new Error("The Firebase session was not ready after sign-in.");
      }

      const tokenResult = await user.getIdTokenResult(true);
      const role = tokenResult.claims.role;

      if (typeof role !== "string" || !ADMIN_ROLES.has(role)) {
        // Do not leave a customer session active after an admin-portal rejection.
        await signOut(auth);
        setError("This account does not have administrator access. Use your administrator account to sign in here.");
        setBusy(false);
        return;
      }

      logAuthDebug("admin role verified", { uid: user.uid, role });
      window.location.assign(destination);
    } catch (loginError) {
      logAuthDebug("admin sign-in failed", loginError instanceof Error ? loginError.message : loginError);
      setError(describeAuthError(loginError));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-[#172033] sm:py-12 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[0.88fr_1.12fr]">
          <div className="relative hidden min-h-[610px] overflow-hidden bg-[#172033] p-10 text-white sm:p-12 lg:block">
            <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#3E155C]/25 blur-3xl" />
            <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#62298E]/20 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E9DDF7] text-[#62298E]"><Gift size={20} /></span>
                  <div>
                    <strong className="block font-[Georgia,serif] text-xl leading-none">AARVIKA</strong>
                    <small className="mt-1 block text-[8px] font-extrabold tracking-[0.18em] text-white/55">ADMIN CONSOLE</small>
                  </div>
                </div>

                <span className="mt-14 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#f5b3c7]"><ShieldCheck size={22} /></span>
                <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#f5b3c7]">Secure operations</p>
                <h1 className="mt-3 max-w-md font-[Georgia,serif] text-4xl font-bold leading-tight sm:text-5xl">Manage your AARVIKA store with confidence.</h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/65">Access orders, products, customers, merchandising and store operations from the protected admin console.</p>
              </div>

              <div className="grid max-w-md grid-cols-3 gap-3 text-[10px] font-bold text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Orders</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Catalog</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">Operations</div>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10 lg:p-14">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E9DDF7] text-[#62298E]"><Gift size={20} /></span>
              <div>
                <strong className="block font-[Georgia,serif] text-xl leading-none text-[#3E155C]">AARVIKA</strong>
                <small className="mt-1 block text-[8px] font-extrabold tracking-[0.18em] text-slate-500">ADMIN CONSOLE</small>
              </div>
            </div>

            <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#3E155C] lg:mt-0">Administrator access</p>
            <h2 className="mt-2 font-[Georgia,serif] text-3xl font-bold text-[#172033] sm:text-4xl">Sign in to Admin Console</h2>
            <p className="mt-3 text-sm leading-6 text-[#667085]">Use an authorized AARVIKA administrator account to continue.</p>

            {error && (
              <div className="mt-6 rounded-xl border border-[#f0c9d6] bg-[#fff5f8] p-4 text-sm leading-6 text-[#8f2348]" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              <label className="block text-sm font-bold text-[#344054]">
                Email
                <input className="mt-2 w-full rounded-xl border border-[#dfe5ec] bg-[#fbfcfe] px-4 py-3.5 outline-none transition focus:border-[#3E155C] focus:ring-4 focus:ring-[#3E155C]/10" type="email" disabled={!ready||busy} required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
              </label>

              <label className="block text-sm font-bold text-[#344054]">
                Password
                <span className="relative mt-2 block">
                  <input className="w-full rounded-xl border border-[#dfe5ec] bg-[#fbfcfe] px-4 py-3.5 pr-12 outline-none transition focus:border-[#3E155C] focus:ring-4 focus:ring-[#3E155C]/10" type={showPassword ? "text" : "password"} disabled={!ready||busy} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-[#3E155C]" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              <button type="submit" disabled={busy||!ready} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E155C] px-5 py-3.5 font-bold text-white transition hover:bg-[#172033] disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? "Verifying access…" : "Sign in to Admin"}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>

            <div className="mt-7 flex flex-col gap-3 border-t border-[#e8edf3] pt-6 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <Link href="/" className="font-bold text-[#3E155C] hover:text-[#3E155C]">← View storefront</Link>
              <Link href="/login" className="font-bold text-[#667085] hover:text-[#3E155C]">Customer sign in</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminLoginFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-6">
      <div className="w-full max-w-md animate-pulse rounded-[20px] border border-[#e2e8f0] bg-white p-10 shadow-sm">
        <div className="h-5 w-40 rounded bg-slate-100" />
        <div className="mt-4 h-9 w-72 rounded bg-slate-100" />
        <div className="mt-8 h-12 rounded-xl bg-slate-100" />
        <div className="mt-4 h-12 rounded-xl bg-slate-100" />
        <div className="mt-5 h-12 rounded-xl bg-slate-100" />
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
