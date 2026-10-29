"use client";
import MerchandisingManager from "@/components/admin/merchandising/MerchandisingManager";
import type { MerchandisingHero } from "@/lib/merchandising/types";
const HERO: MerchandisingHero = { eyebrow: "Curated hampers", heading: "Gift-ready hampers for every moment", description: "Curated gift sets assembled for easy, thoughtful gifting.", ctaText: "Shop hampers", ctaLink: "/hampers", desktopImage: "", mobileImage: "", active: true };
export default function HampersMerchandisingPage() { return <MerchandisingManager page="hampers" title="Hampers" description="Control how existing collections and curated gift sets are presented without duplicating catalog products." sections={[{ type: "collection", label: "Collections", relation: "collections" }, { type: "featured", label: "Featured hampers" }, { type: "curated", label: "Curated gift sets" }]} initialHero={HERO} />; }
