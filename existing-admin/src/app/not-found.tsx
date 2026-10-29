import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-[#fffafd] px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-[20px] border border-[#e8dfe4] bg-white p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#d92f66]">Gift4U</p>
          <h1 className="gift-heading mt-3 text-4xl font-bold text-[#214c72]">Page not found</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">The page you requested may have moved or the gift is no longer available.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white">Go home</Link>
            <Link href="/products" className="rounded-full border border-[#c9dbe8] px-5 py-2.5 text-sm font-bold text-[#214c72]">Browse gifts</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
