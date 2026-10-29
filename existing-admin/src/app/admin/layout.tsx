"use client";

import {useEffect,type ReactNode} from "react";
import { usePathname } from "next/navigation";
import AdminGuard from "../../components/admin/AdminGuard";
import AdminNav from "../../components/admin/AdminNav";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  useEffect(()=>{const previous=document.title;document.title="AARVIKA Admin · Isolated demo";return()=>{document.title=previous;};},[pathname]);

  // The login page lives inside the /admin namespace so its canonical URL is
  // /admin/login, but it must not itself be wrapped by the authenticated admin
  // shell or it would immediately redirect back to the login page.
  if (pathname === "/admin/login") {
    return children;
  }

  return (
    <AdminGuard>
      <AdminNav>{children}</AdminNav>
    </AdminGuard>
  );
}
