export const MAX_BULK_ITEMS = 50;

export function validateBulkIds(input: unknown): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "ids must be an array." };
  const ids = [...new Set(input.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim()))];
  if (!ids.length) return { ok: false, error: "Select at least one item." };
  if (ids.length > MAX_BULK_ITEMS) return { ok: false, error: `You can update at most ${MAX_BULK_ITEMS} items at once.` };
  return { ok: true, ids };
}

export function bulkProductPatch(action: unknown) {
  switch (action) {
    case "publish": return { status: "live" as const };
    case "draft": return { status: "draft" as const };
    case "archive": return { status: "archived" as const };
    case "feature": return { featured: true };
    case "unfeature": return { featured: false };
    case "bestseller": return { bestseller: true };
    case "not_bestseller": return { bestseller: false };
    case "new_arrival": return { newArrival: true };
    case "not_new_arrival": return { newArrival: false };
    default: return null;
  }
}

export function validateBulkQuantity(input: unknown): { ok: true; quantity: number } | { ok: false; error: string } {
  const quantity = Number(input);
  if (!Number.isInteger(quantity) || quantity < 0) return { ok: false, error: "Quantity must be a whole number of 0 or greater." };
  return { ok: true, quantity };
}
