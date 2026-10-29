import type { Firestore } from "firebase-admin/firestore";
import type { ProductDelivery } from "@/lib/catalog/types";

export type DeliverySlotRule = {
  label: string;
  fee?: number;
  capacityPerSlot?: number;
  active?: boolean;
};

export type DeliveryZone = {
  id: string;
  name: string;
  country: string;
  state?: string;
  cities: string[];
  pincodes: string[];
  active: boolean;
  overrideProductDelivery: boolean;
  delivery: ProductDelivery & { slots?: DeliverySlotRule[]; holidays?: string[] };
  createdAt?: unknown;
  updatedAt?: unknown;
};

function normalizeString(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeList(value: unknown, maxItems = 500, maxLength = 20) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => normalizeString(item, maxLength)).filter(Boolean))].slice(0, maxItems);
}

export function normalizeDeliveryZoneInput(value: unknown, id?: string): DeliveryZone {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawDelivery = raw.delivery && typeof raw.delivery === "object" ? raw.delivery as Record<string, unknown> : {};
  const rawSlots = Array.isArray(rawDelivery.slots) ? rawDelivery.slots : [];
  const slots: DeliverySlotRule[] = rawSlots.map((item) => {
    const slot = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      label: normalizeString(slot.label, 80),
      fee: Number.isFinite(Number(slot.fee)) ? Math.max(0, Number(slot.fee)) : 0,
      capacityPerSlot: Number.isFinite(Number(slot.capacityPerSlot)) ? Math.max(0, Math.floor(Number(slot.capacityPerSlot))) : 0,
      active: slot.active !== false,
    };
  }).filter((slot) => slot.label);

  const minDays = Number.isFinite(Number(rawDelivery.minDays)) ? Math.max(0, Math.floor(Number(rawDelivery.minDays))) : undefined;
  const maxDaysValue = Number.isFinite(Number(rawDelivery.maxDays)) ? Math.max(0, Math.floor(Number(rawDelivery.maxDays))) : undefined;
  const maxDays = maxDaysValue === undefined ? undefined : Math.max(minDays ?? 0, maxDaysValue);
  const cutoffHour = Number.isFinite(Number(rawDelivery.cutoffHour)) ? Math.min(23, Math.max(0, Math.floor(Number(rawDelivery.cutoffHour)))) : undefined;

  return {
    id: id || normalizeString(raw.id, 120),
    name: normalizeString(raw.name, 120),
    country: normalizeString(raw.country, 80) || "India",
    state: normalizeString(raw.state, 80) || undefined,
    cities: normalizeList(raw.cities, 100, 80).map((city) => city.toLowerCase()),
    pincodes: normalizeList(raw.pincodes, 2000, 10),
    active: raw.active !== false,
    overrideProductDelivery: raw.overrideProductDelivery !== false,
    delivery: {
      minDays,
      maxDays,
      sameDay: rawDelivery.sameDay === true,
      express: rawDelivery.express === true,
      scheduled: rawDelivery.scheduled !== false,
      midnight: rawDelivery.midnight === true,
      courier: rawDelivery.courier === true,
      fee: Number.isFinite(Number(rawDelivery.fee)) ? Math.max(0, Number(rawDelivery.fee)) : undefined,
      slotFees: rawDelivery.slotFees && typeof rawDelivery.slotFees === "object" ? Object.fromEntries(Object.entries(rawDelivery.slotFees as Record<string, unknown>).map(([key, value]) => [key, Math.max(0, Number(value) || 0)])) : undefined,
      cutoffHour,
      capacityPerSlot: Number.isFinite(Number(rawDelivery.capacityPerSlot)) ? Math.max(0, Math.floor(Number(rawDelivery.capacityPerSlot))) : undefined,
      slots,
      holidays: normalizeList(rawDelivery.holidays, 1000, 10),
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function findDeliveryZone(db: Firestore, pincode: string, city?: string) {
  const normalizedPincode = pincode.trim();
  const normalizedCity = city?.trim().toLowerCase();
  const byPincode = await db.collection("delivery_zones").where("pincodes", "array-contains", normalizedPincode).limit(20).get();
  const candidates = byPincode.docs.map((doc) => normalizeDeliveryZoneInput(doc.data(), doc.id)).filter((zone) => zone.active);
  if (candidates.length) return candidates.sort((a, b) => Number(b.pincodes.length > 0) - Number(a.pincodes.length > 0))[0];
  if (!normalizedCity) return null;
  const byCity = await db.collection("delivery_zones").where("cities", "array-contains", normalizedCity).limit(20).get();
  return byCity.docs.map((doc) => normalizeDeliveryZoneInput(doc.data(), doc.id)).find((zone) => zone.active) || null;
}

export function applyDeliveryZone(product: { delivery: ProductDelivery }, zone: DeliveryZone | null): ProductDelivery {
  if (!zone || !zone.overrideProductDelivery || product.delivery.zoneMode !== "inherit") return { ...product.delivery };
  const zoneDelivery = zone.delivery;
  const slotFees = { ...(product.delivery.slotFees || {}), ...(zoneDelivery.slotFees || {}) };
  const slotCapacities = { ...(product.delivery.slotCapacities || {}) };
  for (const slot of zoneDelivery.slots || []) {
    if (slot.active !== false) {
      if (slot.fee !== undefined) slotFees[slot.label] = slot.fee;
      if (slot.capacityPerSlot !== undefined) slotCapacities[slot.label] = slot.capacityPerSlot;
    }
  }
  return {
    ...product.delivery,
    ...Object.fromEntries(Object.entries(zoneDelivery).filter(([key, value]) => value !== undefined && !["slots", "holidays"].includes(key))),
    slotFees,
    slotCapacities,
  };
}

export function isZoneHoliday(zone: DeliveryZone | null, date: string) {
  return Boolean(zone?.delivery.holidays?.includes(date));
}
