"use client";

import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Gift, Mail, ShieldCheck } from "lucide-react";
import { assertFirebaseClientConfig, auth } from "../../lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      assertFirebaseClientConfig();
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch {
      setError("We couldn't send the reset email. Please check the address and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page-shell">
        <Link href="/" className="auth-brand" aria-label="Gift4U home">
          <span className="auth-brand-mark"><Gift size={21} /></span>
          <span><strong>Gift4U</strong><small>GIFTS FOR A HAPPIER YOU</small></span>
        </Link>

        <section className="auth-card auth-card-forgot">
          <div className="auth-showcase">
            <div className="auth-showcase-orb auth-showcase-orb-one" />
            <div className="auth-showcase-orb auth-showcase-orb-two" />
            <div className="auth-showcase-content">
              <span className="auth-showcase-icon"><ShieldCheck size={23} /></span>
              <p className="auth-eyebrow">Gift4U account</p>
              <h1 className="gift-heading">A fresh start is one email away.</h1>
              <p className="auth-showcase-copy">Reset your password securely and get back to the gifts, celebrations and little surprises you were planning.</p>
            </div>
          </div>

          <div className="auth-form-panel">
            <Link href="/login" className="auth-back-link"><ArrowLeft size={15} /> Back to sign in</Link>
            <div className="auth-form-heading auth-form-heading-spaced">
              <div className="auth-inline-icon"><Mail size={20} /></div>
              <p className="auth-eyebrow">Password recovery</p>
              <h2 className="gift-heading">Forgot your password?</h2>
              <p>Enter the email you use for Gift4U and we&apos;ll send you a secure reset link.</p>
            </div>

            {sent ? (
              <div className="auth-success" role="status">
                <div className="auth-success-icon"><CheckCircle2 size={21} /></div>
                <div><strong>Check your inbox</strong><p>If an account uses that email, Firebase has sent a password-reset link.</p></div>
                <Link href="/login" className="auth-submit auth-submit-link">Return to sign in <ArrowRight size={17} /></Link>
              </div>
            ) : (
              <form onSubmit={submit} className="auth-form">
                <label><span>Email address</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
                {error && <div className="auth-alert" role="alert">{error}</div>}
                <button type="submit" className="auth-submit" disabled={busy}>{busy ? "Sending reset link…" : "Send reset link"}{!busy && <ArrowRight size={17} />}</button>
              </form>
            )}

            <p className="auth-note">For your security, the reset link is handled by Firebase and expires according to your account settings.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
