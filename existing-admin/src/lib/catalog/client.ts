import type { Product } from "./types";

export type CatalogResponse = {
  products: Product[];
  categories: Array<{ id: string; name: string; slug: string; image?: string; description?: string; sortOrder: number; active: boolean }>;
  occasions: Array<{ id: string; name: string; slug: string; image?: string; description?: string; sortOrder: number; active: boolean }>;
  recipients: Array<{ id: string; name: string; slug: string; image?: string; description?: string; sortOrder: number; active: boolean }>;
  collections: Array<{ id: string; name: string; slug: string; image?: string; description?: string; sortOrder: number; active: boolean }>;
};

export async function fetchCatalog(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const response = await fetch(`/api/catalog${query.size ? `?${query}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load catalog.");
  return (await response.json()) as CatalogResponse;
}

export async function fetchProductBySlug(slug: string) {
  const data = await fetchCatalog({ slug, limit: 1 });
  return data.products[0] ?? null;
}
