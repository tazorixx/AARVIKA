export type MerchandisingPage = "wedding" | "birthday" | "anniversary" | "hampers" | "personalised" | "clothing" | "stationery" | "furniture" | "lifestyle";

export type WeddingItemType = "event" | "category" | "budget" | "culture" | "state" | "featured";
export type BirthdayItemType = "recipient" | "ageGroup" | "category" | "giftType" | "budget" | "featured";
export type AnniversaryItemType = "category" | "lovedOne" | "milestone" | "budget" | "featured";
export type HampersItemType = "collection" | "featured" | "curated";
export type PersonalisedItemType = "category" | "recipient" | "collection" | "promotion" | "featured";
export type LifestyleItemType = "personality" | "brand";
export type MerchandisingItemType = WeddingItemType | BirthdayItemType | AnniversaryItemType | HampersItemType | PersonalisedItemType | LifestyleItemType;

export interface MerchandisingHero {
  eyebrow: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage: string;
  active: boolean;
}

export interface MerchandisingPageConfig {
  id: string;
  page: MerchandisingPage;
  hero: MerchandisingHero;
  banner?: { title: string; description?: string; image?: string; active: boolean };
  settings?: {
    sectionVisibility?: Record<string, boolean>;
    productLimit?: number;
    sortBy?: "manual" | "newest" | "priceAsc" | "priceDesc" | "featured";
  };
  updatedAt?: unknown;
}

export interface MerchandisingItem {
  id: string;
  page: MerchandisingPage;
  type: MerchandisingItemType;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  image?: string;
  relatedId?: string;
  featuredProductIds?: string[];
  min?: number;
  max?: number;
  years?: number;
  minimumAge?: number;
  maximumAge?: number;
  sortOrder: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WeddingMerchandisingResponse {
  page: MerchandisingPageConfig;
  items: MerchandisingItem[];
}

export interface BirthdayMerchandisingResponse {
  page: MerchandisingPageConfig;
  items: MerchandisingItem[];
}

export interface AnniversaryMerchandisingResponse {
  page: MerchandisingPageConfig;
  items: MerchandisingItem[];
}
