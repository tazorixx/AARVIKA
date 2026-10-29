"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { ArrowRight, Heart, LogOut, MapPin, Package, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { auth } from "../../lib/firebase";
import { useWishlist } from "../../contexts/WishlistContext";
import AccountNav from "../../components/account/AccountNav";
import AccountPageHeader from "../../components/account/AccountPageHeader";
import AccountCard from "../../components/account/AccountCard";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Order = { id: string; status: string; statusLabel?: string; items?: Array<Record<string, unknown>>; totals?: { grandTotal?: number }; createdAt?: string | null; address?: { city?: string; state?: string } | null };
type Profile = { name?: string; phone?: string; email?: string };

function money(value: unknown) { return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`; }
function dateLabel(value?: string | null) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
function itemImage(item: Record<string, unknown>) { return typeof item.image === "string" ? item.image : typeof item.imageUrl === "string" ? item.imageUrl : ""; }
function itemName(item: Record<string, unknown>) { return typeof item.name === "string" ? item.name : typeof item.title === "string" ? item.title : "Gift item"; }

export default function AccountPage() {
  const { user, loading } = useAuth();
  const { wishlist } = useWishlist();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  async function loadAccount() {
    if (!user) return;
    setDataLoading(true);
    setDataError("");
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [profileResponse, ordersResponse, addressesResponse] = await Promise.all([
        fetch("/api/account/profile", { headers, cache: "no-store" }),
        fetch("/api/account/orders", { headers, cache: "no-store" }),
        fetch("/api/account/addresses", { headers, cache: "no-store" }),
      ]);
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.profile ?? null);
      }
      if (ordersResponse.ok) {
        const data = await ordersResponse.json();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      }
      if (addressesResponse.ok) {
        const data = await addressesResponse.json();
        setAddressCount(Array.isArray(data.addresses) ? data.addresses.length : 0);
      }
      if (!profileResponse.ok || !ordersResponse.ok || !addressesResponse.ok) setDataError("Some account details could not be loaded. You can refresh and try again.");
    } catch {
      setDataError("We couldn't load your account details right now.");
    } finally { setDataLoading(false); }
  }


  useEffect(() => { if (user) void Promise.resolve().then(() => loadAccount()); }, [user]);

  if (loading) return <><Header /><main className="min-h-screen bg-[#fffafd] px-4 py-20 text-center text-sm text-slate-500">Loading your Gift4U account…</main><Footer /></>;
  if (!user) return <><Header /><main className="min-h-screen bg-[#fffafd] px-4 py-16"><section className="mx-auto max-w-xl rounded-[16px] border border-[#e5edf4] bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0f5] text-[#d92f66]"><UserRound size={26} /></div><h1 className="gift-heading mt-5 text-3xl font-bold text-[#214c72]">Your gifting space</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">Sign in to manage your profile, saved addresses, wishlist and orders in one place.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/login?next=/account" className="rounded-full bg-[#d92f66] px-6 py-3 text-sm font-bold text-white">Sign in</Link><Link href="/signup?next=/account" className="rounded-full border border-[#dce8ef] bg-[#f5fbff] px-6 py-3 text-sm font-bold text-[#2f628f]">Create account</Link></div></section></main><Footer /></>;

  const displayName = profile?.name?.trim() || user.displayName?.trim() || user.email?.split("@")[0] || "there";
  const latest = orders[0];
  async function logout() { await signOut(auth); window.location.assign("/"); }

  return <>
    <Header />
    <main className="customer-shell min-h-screen bg-[linear-gradient(180deg,#fffafd_0%,#ffffff_48%,#f5fbff_100%)] pb-16">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-7 sm:py-9 lg:px-6">
        <AccountPageHeader
          eyebrow="My Gift4U"
          title={`Welcome back, ${displayName}`}
          description="Your orders, saved gifts and delivery details — all ready for the next celebration."
          icon={<UserRound size={24} />}
          action={<button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"><LogOut size={16} /> Sign out</button>}
        />
        <AccountNav />

        <section className="mt-6">
          {dataError && <div className="mb-5 flex flex-col gap-3 rounded-[14px] border border-[#f0c9d6] bg-[#fff5f8] p-4 text-sm text-[#8f2348] sm:flex-row sm:items-center sm:justify-between"><span>{dataError}</span><button onClick={() => void loadAccount()} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-[#214c72]"><RefreshCw size={15} /> Refresh</button></div>}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/orders" className="group rounded-[14px] border border-[#e5edf4] bg-white p-5 shadow-[0_6px_22px_rgba(33,76,114,0.045)] transition hover:-translate-y-0.5 hover:shadow-md"><Package className="text-[#2f628f]" size={20} /><p className="mt-3 text-3xl font-bold text-[#214c72]">{dataLoading ? "—" : orders.length}</p><p className="mt-1 text-sm font-semibold text-slate-600">Orders</p><span className="mt-3 inline-flex text-xs font-bold text-[#d92f66]">View orders <ArrowRight size={13} className="ml-1" /></span></Link>
            <Link href="/wishlist" className="group rounded-[14px] border border-[#e5edf4] bg-white p-5 shadow-[0_6px_22px_rgba(33,76,114,0.045)] transition hover:-translate-y-0.5 hover:shadow-md"><Heart className="text-[#d92f66]" size={20} /><p className="mt-3 text-3xl font-bold text-[#214c72]">{wishlist.length}</p><p className="mt-1 text-sm font-semibold text-slate-600">Saved gifts</p><span className="mt-3 inline-flex text-xs font-bold text-[#d92f66]">Open wishlist <ArrowRight size={13} className="ml-1" /></span></Link>
            <Link href="/account/addresses" className="group rounded-[14px] border border-[#e5edf4] bg-white p-5 shadow-[0_6px_22px_rgba(33,76,114,0.045)] transition hover:-translate-y-0.5 hover:shadow-md"><MapPin className="text-[#2f628f]" size={20} /><p className="mt-3 text-3xl font-bold text-[#214c72]">{dataLoading ? "—" : addressCount}</p><p className="mt-1 text-sm font-semibold text-slate-600">Saved addresses</p><span className="mt-3 inline-flex text-xs font-bold text-[#d92f66]">Manage addresses <ArrowRight size={13} className="ml-1" /></span></Link>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <AccountCard className="p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#d92f66]">Latest activity</p><h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72]">Your latest order</h2></div><Link href="/orders" className="text-xs font-bold text-[#d92f66] hover:underline">View all</Link></div>
              {dataLoading ? <div className="mt-6 h-32 animate-pulse rounded-[12px] bg-[#f5fbff]" /> : latest ? <div className="mt-5 flex flex-col gap-4 rounded-[12px] border border-[#e5edf4] bg-[#fbfdff] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#f5fbff] text-[#2f628f]">{latest.items?.[0] ? (itemImage(latest.items[0]) ? <img src={itemImage(latest.items[0])} alt="" className="h-full w-full object-cover" /> : <Package size={20} />) : <Package size={20} />}</div><div><p className="text-xs font-semibold text-slate-400">{latest.id} · {dateLabel(latest.createdAt)}</p><p className="mt-1 text-sm font-bold text-[#214c72]">{latest.items?.[0] ? itemName(latest.items[0]) : "Your latest gift"}</p></div></div><div className="text-left sm:text-right"><p className="text-sm font-extrabold text-[#214c72]">{money(latest.totals?.grandTotal)}</p><Link href={`/orders/${latest.id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#d92f66]">View order <ArrowRight size={13} /></Link></div></div> : <div className="mt-5 rounded-[12px] border border-dashed border-[#dbe8ef] bg-[linear-gradient(135deg,#fffafd,#f5fbff)] px-5 py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2f628f] shadow-sm"><Package size={22} /></div><h3 className="gift-heading mt-4 text-xl font-bold text-[#214c72]">No orders yet</h3><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Your first celebration gift is just a few clicks away.</p><Link href="/products" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white">Start gifting <ArrowRight size={15} /></Link></div>}
            </AccountCard>

            <AccountCard className="bg-[linear-gradient(145deg,#fff7fa,#f5fbff)] p-6 sm:p-7"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#d92f66]">Quick actions</p><div className="mt-4 space-y-2"><Link href="/account/profile" className="flex items-center justify-between rounded-[10px] bg-white px-4 py-3 text-sm font-bold text-[#214c72] transition hover:bg-[#fffafd]"><span>Profile</span><ArrowRight size={15} /></Link><Link href="/account/addresses" className="flex items-center justify-between rounded-[10px] bg-white px-4 py-3 text-sm font-bold text-[#214c72] transition hover:bg-[#fffafd]"><span>Addresses</span><ArrowRight size={15} /></Link><Link href="/wishlist" className="flex items-center justify-between rounded-[10px] bg-white px-4 py-3 text-sm font-bold text-[#214c72] transition hover:bg-[#fffafd]"><span>Wishlist</span><ArrowRight size={15} /></Link><Link href="/support" className="flex items-center justify-between rounded-[10px] bg-white px-4 py-3 text-sm font-bold text-[#214c72] transition hover:bg-[#fffafd]"><span>Help</span><ArrowRight size={15} /></Link></div></AccountCard>
          </div>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
