import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountNav from "@/components/account/AccountNav";

export default function AccountShell({
  children,
  header,
  backToAccount = true,
}: {
  children: ReactNode;
  header: ReactNode;
  backToAccount?: boolean;
}) {
  return (
    <>
      <Header />
      <main className="customer-shell min-h-screen bg-[linear-gradient(180deg,#fffafd_0%,#ffffff_48%,#f5fbff_100%)] pb-16">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:py-9 lg:px-6">
          {backToAccount && (
            <Link href="/account" className="inline-flex items-center gap-2 text-sm font-semibold text-[#214c72] transition hover:text-[#d92f66]">
              <ArrowLeft size={16} /> Back to account
            </Link>
          )}
          {header}
          <AccountNav />
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
