export type MerchandisingKey = "bestsellers" | "newArrivals" | "featured";
export type MerchandisingMode = "automatic" | "manual";
export type MerchandisingSetting = { key: MerchandisingKey; mode: MerchandisingMode; productIds: string[]; limit: number; active: boolean };

export const MERCHANDISING_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"] as const;
export const MERCHANDISING_KEYS: MerchandisingKey[] = ["bestsellers", "newArrivals", "featured"];

export const DEFAULT_MERCHANDISING: Record<MerchandisingKey, MerchandisingSetting> = {
  bestsellers: { key: "bestsellers", mode: "automatic", productIds: [], limit: 4, active: true },
  newArrivals: { key: "newArrivals", mode: "automatic", productIds: [], limit: 4, active: true },
  featured: { key: "featured", mode: "automatic", productIds: [], limit: 4, active: true },
};

export function normalizeMerchandisingSetting(key: MerchandisingKey, data?: Record<string, unknown>): MerchandisingSetting {
  const fallback = DEFAULT_MERCHANDISING[key];
  const mode = data?.mode === "manual" ? "manual" : "automatic";
  const ids = Array.isArray(data?.productIds) ? data!.productIds.filter((id): id is string => typeof id === "string").slice(0, 20) : [];
  const limit = Math.min(Math.max(Number(data?.limit ?? fallback.limit) || fallback.limit, 1), 12);
  return { key, mode, productIds: ids, limit, active: data?.active !== false };
}
