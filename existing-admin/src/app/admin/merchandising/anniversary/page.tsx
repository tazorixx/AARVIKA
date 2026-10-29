"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import { DEFAULT_ANNIVERSARY_HERO } from "@/lib/merchandising/client-defaults";

export default function AnniversaryMerchandisingPage() {
  return <MerchandisingManager page="anniversary" title="Anniversary" description="Manage Anniversary presentation without editing customer page code." initialHero={DEFAULT_ANNIVERSARY_HERO} sections={[
    { type: "category", label: "Anniversary Categories", relation: "categories", placeholder: "Chocolates" },
    { type: "lovedOne", label: "Loved Ones", relation: "recipients", placeholder: "For Couples" },
    { type: "milestone", label: "Milestones", numbers: "years", placeholder: "25th Anniversary" },
    { type: "budget", label: "Anniversary Budgets", numbers: "budget", placeholder: "Under ₹1000" },
    { type: "featured", label: "Featured anniversary gifts" },
  ]} />;
}
