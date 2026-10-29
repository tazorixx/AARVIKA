"use client";

import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "SUPPORT",
]);

function hasAdminRole(user: User, role: unknown) {
  return Boolean(user && typeof role === "string" && ADMIN_ROLES.has(role));
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    function redirectToLogin() {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/admin/login?next=${encodeURIComponent(next)}`);
    }

    async function checkAdmin(user: User | null) {
      if (!active) return;

      if (!user) {
        setAllowed(false);
        setChecking(false);
        redirectToLogin();
        return;
      }

      try {
        // Use the locally cached token first. This keeps normal admin navigation
        // fast and avoids a network token refresh on every /admin page change.
        let tokenResult = await user.getIdTokenResult(false);
        let role = tokenResult.claims.role;

        // A role may have just been assigned/changed by the server. Only then
        // force one refresh so the new custom claim becomes available.
        if (!hasAdminRole(user, role)) {
          tokenResult = await user.getIdTokenResult(true);
          role = tokenResult.claims.role;
        }

        if (!active) return;

        if (!hasAdminRole(user, role)) {
          setAllowed(false);
          setChecking(false);
          redirectToLogin();
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch (error) {
        console.error("Admin access check failed", error);

        if (!active) return;

        setAllowed(false);
        setChecking(false);
        redirectToLogin();
      }
    }

    // Firebase usually restores the existing session before this component
    // needs the auth listener. Check it immediately when available instead of
    // waiting for the listener callback.
    const currentUser = auth.currentUser;

    if (currentUser) {
      void checkAdmin(currentUser);
      return () => {
        active = false;
      };
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      void checkAdmin(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#f7f9fc] px-6">
        <p className="text-sm text-slate-600">Checking admin access…</p>
      </main>
    );
  }

  if (!allowed) return null;

  return children;
}
