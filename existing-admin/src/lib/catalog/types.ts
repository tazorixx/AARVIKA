import type { AuthoringFields } from "@aarvika/catalogue/admin-contracts";
import type { DepartmentId } from "@aarvika/catalogue/departments";
export type CatalogStatus = "draft" | "live" | "archived";

export interface TaxonomyBase {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category extends TaxonomyBase {
  furnitureSector?: 'Home'|'Commercial'|'';
  parentId?: string | null;
  departmentId?: DepartmentId;
  level?: 1 | 2 | 3;
}
export type Occasion = TaxonomyBase;
export type Recipient = TaxonomyBase;
export type Collection = TaxonomyBase;

export interface ProductImage {
  url: string;
  alt?: string;
  fileId?: string;
  filePath?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id?: string;
  name: string;
  value?: string;
  options?: string[];
  price?: number;
  priceDelta?: number;
  attributes?: Record<string, string>;
  quantity?: number;
  sku?: string;
}

export interface ProductPersonalization {
  enabled: boolean;
  fields?: string[];
  maxCharacters?: number;
  maxLength?: number;
  imageUpload?: boolean;
  instructions?: string;
}

export interface ProductInventory {
  quantity: number;
  reserved: number;
  sold: number;
  trackInventory?: boolean;
  stock?: number;
}

export interface ProductDelivery {
  minDays?: number;
  maxDays?: number;
  sameDay?: boolean;
  express?: boolean;
  scheduled?: boolean;
  midnight?: boolean;
  courier?: boolean;
  fee?: number;
  slotFees?: Record<string, number>;
  slotCapacities?: Record<string, number>;
  cutoffHour?: number;
  capacityPerSlot?: number;
  /** Legacy products keep existing delivery values; zone rules can inherit when enabled. */
  zoneMode?: "legacy" | "inherit";
}

export interface ProductServiceability {
  pincodes?: string[];
  cities?: string[];
  nationwide?: boolean;
}

export interface Product {
  aarvika?: AuthoringFields;
  aarvikaSkuIds?: string[];
  id: string;
  sku: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryIds: string[];
  occasionIds: string[];
  recipientIds: string[];
  tagIds: string[];
  collectionIds: string[];
  cultureTagIds?: string[];
  stateTagIds?: string[];
  images: ProductImage[];
  thumbnail: string;
  price: number;
  mrp: number;
  discount: number;
  variants: ProductVariant[];
  personalization: ProductPersonalization;
  inventory: ProductInventory;
  delivery: ProductDelivery;
  serviceability: ProductServiceability;
  status: CatalogStatus;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  relatedProductsMode?: "auto" | "manual";
  relatedProductIds?: string[];
  rating: number;
  reviewCount: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type TaxonomyType = "categories" | "occasions" | "recipients" | "collections";
export type EntityType = TaxonomyType | "products";

export const ADMIN_CATALOG_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"] as const;
export type CatalogAdminRole = (typeof ADMIN_CATALOG_ROLES)[number];
