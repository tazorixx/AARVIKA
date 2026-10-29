"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type { MerchandisingHero } from "@/lib/merchandising/types";
const HERO: MerchandisingHero = { eyebrow: "Lifestyle gifting", heading: "Gifts matched to their lifestyle", description: "Shop by personality and discover brands worth gifting.", ctaText: "Explore lifestyle gifts", ctaLink: "/lifestyle", desktopImage: "", mobileImage: "", active: true };
export default function LifestyleMerchandisingPage() { return <MerchandisingManager page="lifestyle" title="Lifestyle" description="Manage lifestyle personalities and brands that power the storefront presentation." sections={[{ type: "personality", label: "Personalities" }, { type: "brand", label: "Brands" }]} initialHero={HERO} />; }
