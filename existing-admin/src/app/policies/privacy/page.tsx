import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GRIEVANCE_OFFICER } from "@/lib/seo/site";

export default function PrivacyPage() {
  return <><Header /><main className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d92f66]">Legal</p>
    <h1 className="gift-heading mt-2 text-4xl font-bold text-[#214c72]">Privacy Policy</h1>
    <p className="mt-3 text-sm text-slate-500">Last updated: October 2026</p>
    <div className="prose prose-slate mt-8 max-w-none">
      <p>Gift4U collects information needed to create accounts, process orders, provide delivery, support customers, prevent fraud and improve the service.</p>
      <h2>Information we use</h2><p>This may include account details, contact information, delivery addresses, order information, payment references, support messages and information you voluntarily provide for personalisation.</p>
      <h2>Payments</h2><p>Payment processing is handled through the configured payment provider. Gift4U does not need full card credentials when the payment provider handles the transaction.</p>
      <h2>Sharing</h2><p>Information may be shared with service providers required to fulfil an order, such as payment, delivery, hosting and customer-support providers, subject to applicable requirements.</p>
      <h2>Account and data deletion</h2>
      <p>You can request permanent deletion from the Gift4U app or from the <Link href="/account/delete">account deletion page</Link>. After ownership is verified, Gift4U deletes customer-profile data such as saved addresses, cart, wishlist, support tickets, review content and registered mobile notification tokens.</p>
      <p>Deletion may be temporarily blocked while an order is active or unresolved because the information is still needed to fulfil or resolve that transaction. Completed or terminal transaction records may be retained where required for accounting, fraud prevention, dispute handling or legal obligations. When an account is deleted, Gift4U minimises those retained order records by removing the customer-account link, delivery identity/address, gift messages and personalisation.</p>
      <h2>Contact</h2><p>For privacy questions or complaints, contact the support address published on the site. Grievance officer: {GRIEVANCE_OFFICER || "[ADD BEFORE LAUNCH]"}.</p>
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Before production launch, this policy must be reviewed against the final processors, analytics, cookies, retention practices and applicable legal requirements. Do not publish placeholder contact details.</p>
    </div>
  </main><Footer /></>;
}
