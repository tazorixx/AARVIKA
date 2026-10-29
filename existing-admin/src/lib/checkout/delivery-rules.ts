import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { Product, ProductDelivery } from "@/lib/catalog/types";
import type { CheckoutDeliverySelection } from "./types";

export const DELIVERY_TIME_ZONE = "Asia/Kolkata";

export function getDeliveryFee(product: { delivery: ProductDelivery }, slot: string) {
  const base = Math.max(0, Number(product.delivery?.fee || 0));
  const slotFee = Math.max(0, Number(product.delivery?.slotFees?.[slot] || 0));
  return base + slotFee;
}

function istHour(date = new Date()) {
  const hour = new Intl.DateTimeFormat("en-IN", {
    timeZone: DELIVERY_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date).find((part) => part.type === "hour")?.value;
  return Number(hour || 0);
}

export function isBeforeDeliveryCutoff(product: { delivery: ProductDelivery }, selectedDate: string, now = new Date()) {
  const cutoff = product.delivery?.cutoffHour;
  if (cutoff === undefined || !Number.isFinite(Number(cutoff))) return true;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: DELIVERY_TIME_ZONE }).format(now);
  if (selectedDate !== today) return true;
  return istHour(now) < Math.max(0, Math.min(23, Number(cutoff)));
}

function capacityDocId(productId: string, date: string, slot: string) {
  return `${encodeURIComponent(productId)}__${encodeURIComponent(date)}__${encodeURIComponent(slot)}`;
}

export async function reserveDeliveryCapacity(
  tx: Transaction,
  db: Firestore,
  items: Array<CheckoutDeliverySelection & { productId: string; qty: number }>,
  products: Map<string, Product>,
) {
  const grouped = new Map<string, CheckoutDeliverySelection & { productId: string; qty: number }>();
  for (const item of items) {
    const key = capacityDocId(item.productId, item.date, item.slot);
    const current = grouped.get(key);
    grouped.set(key, current ? { ...current, qty: current.qty + item.qty } : item);
  }
  for (const item of grouped.values()) {
    const product = products.get(item.productId);
    const configured = product?.delivery?.slotCapacities?.[item.slot] ?? product?.delivery?.capacityPerSlot;
    if (!product || configured === undefined) continue;
    const capacity = Math.max(0, Math.floor(Number(configured)));
    if (capacity <= 0) continue;
    const ref = db.collection("delivery_capacity").doc(capacityDocId(item.productId, item.date, item.slot));
    const snap = await tx.get(ref);
    const currentRemaining = snap.exists ? Math.max(0, Math.floor(Number(snap.data()?.remaining ?? capacity))) : capacity;
    if (item.qty > currentRemaining) throw new Error(`The ${item.slot} delivery slot for "${product.title}" is full. Please choose another slot.`);
    tx.set(ref, { productId: item.productId, date: item.date, slot: item.slot, remaining: currentRemaining - item.qty, capacity, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
}

export async function checkDeliveryCapacity(
  db: Firestore,
  items: Array<{ productId: string; qty: number; date: string; slot: string }>,
  products: Map<string, Product>,
) {
  const grouped = new Map<string, { productId: string; qty: number; date: string; slot: string }>();
  for (const item of items) {
    const key = capacityDocId(item.productId, item.date, item.slot);
    const current = grouped.get(key);
    grouped.set(key, current ? { ...current, qty: current.qty + item.qty } : item);
  }
  for (const item of grouped.values()) {
    const product = products.get(item.productId);
    const configured = product?.delivery?.slotCapacities?.[item.slot] ?? product?.delivery?.capacityPerSlot;
    if (!product || configured === undefined) continue;
    const capacity = Math.max(0, Math.floor(Number(configured)));
    if (capacity <= 0) continue;
    const ref = db.collection("delivery_capacity").doc(capacityDocId(item.productId, item.date, item.slot));
    const snap = await ref.get();
    const remaining = snap.exists ? Math.max(0, Math.floor(Number(snap.data()?.remaining ?? capacity))) : capacity;
    if (item.qty > remaining) return `The ${item.slot} delivery slot for "${product.title}" is full. Please choose another slot.`;
  }
  return null;
}

export async function releaseDeliveryCapacity(
  tx: Transaction,
  db: Firestore,
  items: Array<{ productId: string; qty: number; deliveryDate?: string; deliverySlot?: string }>,
  products?: Map<string, Product>,
) {
  const grouped = new Map<string, { productId: string; qty: number; deliveryDate: string; deliverySlot: string }>();
  for (const item of items) {
    if (!item.deliveryDate || !item.deliverySlot) continue;
    const key = capacityDocId(item.productId, item.deliveryDate, item.deliverySlot);
    const current = grouped.get(key);
    grouped.set(key, current ? { ...current, qty: current.qty + item.qty } : { ...item, deliveryDate: item.deliveryDate, deliverySlot: item.deliverySlot });
  }
  for (const item of grouped.values()) {
    const configured = products?.get(item.productId)?.delivery?.slotCapacities?.[item.deliverySlot] ?? products?.get(item.productId)?.delivery?.capacityPerSlot;
    if (products && configured === undefined) continue;
    const ref = db.collection("delivery_capacity").doc(capacityDocId(item.productId, item.deliveryDate, item.deliverySlot));
    const snap = await tx.get(ref);
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const capacity = Math.max(0, Math.floor(Number(data.capacity ?? configured ?? 0)));
    const remaining = Math.max(0, Math.min(capacity, Number(data.remaining ?? 0) + item.qty));
    tx.update(ref, { remaining, updatedAt: FieldValue.serverTimestamp() });
  }
}
