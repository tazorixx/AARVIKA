import { normalizeCouponCode, type Coupon, type CouponType } from "@/lib/checkout/coupon";

export type CouponInput = Omit<Coupon, "code" | "active" | "usedCount"> & { code: string; active?: boolean };

function optionalNumber(input: Record<string, unknown>, key: string) {
  if (input[key] === undefined || input[key] === null || input[key] === "") return undefined;
  const value = Number(input[key]);
  return Number.isFinite(value) ? value : null;
}

function validDate(value: unknown) {
  if (value === undefined || value === null || value === "") return true;
  const date = new Date(String(value));
  return !Number.isNaN(date.getTime());
}

export function validateCouponInput(input: Record<string, unknown>): { ok: true; value: CouponInput } | { ok: false; error: string } {
  const code = normalizeCouponCode(input.code);
  const type = input.type;
  const value = Number(input.value);
  if (!code) return { ok: false, error: "Coupon code is required." };
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { ok: false, error: "Coupon code must be 3-40 characters using letters, numbers, hyphens or underscores." };
  if (type !== "percent" && type !== "fixed") return { ok: false, error: "Coupon type must be percent or fixed." };
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Coupon value must be greater than zero." };
  if (type === "percent" && value > 100) return { ok: false, error: "Percentage discount cannot exceed 100%." };

  const minSubtotal = optionalNumber(input, "minSubtotal");
  const maxDiscount = optionalNumber(input, "maxDiscount");
  const usageLimit = optionalNumber(input, "usageLimit");
  const perUserLimit = optionalNumber(input, "perUserLimit");
  if (minSubtotal === null || maxDiscount === null || usageLimit === null || perUserLimit === null) return { ok: false, error: "Coupon limits must be valid numbers." };
  if (minSubtotal !== undefined && minSubtotal < 0) return { ok: false, error: "Minimum subtotal cannot be negative." };
  if (maxDiscount !== undefined && maxDiscount < 0) return { ok: false, error: "Maximum discount cannot be negative." };
  if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) return { ok: false, error: "Usage limit must be a whole number of at least 1." };
  if (perUserLimit !== undefined && (!Number.isInteger(perUserLimit) || perUserLimit < 1)) return { ok: false, error: "Per-user limit must be a whole number of at least 1." };
  if (!validDate(input.startsAt) || !validDate(input.expiresAt)) return { ok: false, error: "Start and expiry dates must be valid." };
  if (input.startsAt && input.expiresAt && new Date(String(input.expiresAt)) <= new Date(String(input.startsAt))) return { ok: false, error: "Expiry date must be after the start date." };

  return { ok: true, value: {
    code, type: type as CouponType, value,
    active: input.active !== false,
    minSubtotal: minSubtotal ?? 0,
    maxDiscount: maxDiscount,
    usageLimit: usageLimit === undefined ? undefined : Math.floor(usageLimit),
    perUserLimit: perUserLimit === undefined ? undefined : Math.floor(perUserLimit),
    expiresAt: input.expiresAt || undefined,
    startsAt: input.startsAt || undefined,
  } };
}
