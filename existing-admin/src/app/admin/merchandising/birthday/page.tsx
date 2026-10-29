"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import { DEFAULT_BIRTHDAY_HERO } from "@/lib/merchandising/client-defaults";

export default function BirthdayMerchandisingPage() {
  return <MerchandisingManager page="birthday" title="Birthday" description="Manage Birthday presentation without editing customer page code." initialHero={DEFAULT_BIRTHDAY_HERO} sections={[
    { type: "recipient", label: "Birthday Recipients", relation: "recipients", placeholder: "For Her" },
    { type: "ageGroup", label: "Age Groups", numbers: "age", placeholder: "18th Birthday" },
    { type: "category", label: "Birthday Categories", relation: "categories", placeholder: "Personalised Gifts" },
    { type: "giftType", label: "Gift Types", placeholder: "Jewellery" },
    { type: "budget", label: "Birthday Budgets", numbers: "budget", placeholder: "Under ₹500" },
    { type: "featured", label: "Featured birthday gifts" },
  ]} />;
}
