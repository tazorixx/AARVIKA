import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { getCartQuantity, type CartItem } from "@/lib/cart/types";
import {
  isValidPincode,
  isServiceable,
  isSupportedDeliveryDate,
  isSupportedDeliverySlot,
  validateAddress,
} from "@/lib/checkout/validation";
import { checkDeliveryCapacity, getDeliveryFee, isBeforeDeliveryCutoff } from "@/lib/checkout/delivery-rules";
import { calculateCouponDiscount, normalizeCouponCode, parseCoupon } from "@/lib/checkout/coupon";
import { applyDeliveryZone, findDeliveryZone, isZoneHoliday } from "@/lib/checkout/delivery-zones";
import type {
  CheckoutAddress,
  CheckoutDeliverySelection,
  DeliveryValidationError,
  DeliveryValidationResponse,
} from "@/lib/checkout/types";
import type { Product } from "@/lib/catalog/types";

function errorResponse(message: string, field: DeliveryValidationError["field"] = "cart", cartKey?: string, status = 400) {
  return NextResponse.json({ valid: false, error: message, field, cartKey }, { status });
}

function clean(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sanitizeAddress(value: CheckoutAddress): CheckoutAddress {
  return {
    id: clean(value.id, 80) || undefined,
    label: clean(value.label, 40) || undefined,
    name: clean(value.name, 100),
    phone: clean(value.phone, 20),
    addressLine: clean(value.addressLine, 240),
    city: clean(value.city, 80),
    state: clean(value.state, 80),
    pincode: clean(value.pincode, 10),
    landmark: clean(value.landmark, 120) || undefined,
  };
}

function sanitizeSelection(value: unknown): CheckoutDeliverySelection | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.cartKey !== "string" || typeof raw.pincode !== "string" || typeof raw.date !== "string" || typeof raw.slot !== "string") return null;
  return { cartKey: raw.cartKey, pincode: raw.pincode.trim(), date: raw.date.trim(), slot: raw.slot.trim() };
}

function safePersonalization(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value).filter(([key, val]) => key.trim().length > 0 && typeof val === "string");
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as { address?: unknown; delivery?: unknown; couponCode?: unknown };

    if (!validateAddress(body.address)) return errorResponse("Please provide a complete delivery address.", "address");

    const submittedAddress = sanitizeAddress(body.address);
    if (!submittedAddress.id) {
      return errorResponse("Choose a saved delivery address before continuing.", "address");
    }

    const db = getAdminDb();
    const addressSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .doc(submittedAddress.id)
      .get();

    if (!addressSnapshot.exists) {
      return errorResponse("That saved address could not be found. Please choose another address.", "address");
    }

    const storedAddress = addressSnapshot.data() || {};
    const address: CheckoutAddress = sanitizeAddress({
      id: addressSnapshot.id,
      label: storedAddress.label,
      name: storedAddress.name,
      phone: storedAddress.phone,
      addressLine: storedAddress.addressLine,
      city: storedAddress.city,
      state: storedAddress.state,
      pincode: storedAddress.pincode,
      landmark: storedAddress.landmark,
    });

    if (!validateAddress(address)) return errorResponse("The selected saved address is incomplete.", "address");
    if (!isValidPincode(address.pincode)) return errorResponse("The selected address has an invalid pincode.", "pincode");

    const selections = (Array.isArray(body.delivery) ? body.delivery : [])
      .map(sanitizeSelection)
      .filter((value): value is CheckoutDeliverySelection => Boolean(value));

    const cartSnapshot = await db.collection("carts").doc(uid).get();
    const cartData = cartSnapshot.data();
    const cartItems = Array.isArray(cartData?.items) ? (cartData.items as CartItem[]) : [];
    if (!cartItems.length) return errorResponse("Your cart is empty.", "cart");

    const productIds = [...new Set(cartItems.map((item) => item.productId))];
    const productSnapshots = await db.getAll(...productIds.map((id) => db.collection("products").doc(id)));
    const products = new Map(productSnapshots.map((snapshot) => [snapshot.id, snapshot.data() as Product]));
    const zone = await findDeliveryZone(db, address.pincode, address.city);
    if (zone) {
      for (const [productId, product] of products.entries()) {
        products.set(productId, { ...product, delivery: applyDeliveryZone(product, zone) });
      }
    }

    let subtotal = 0;
    const lines: DeliveryValidationResponse["lines"] = [];
    const normalizedSelections: CheckoutDeliverySelection[] = [];
    let delivery = 0;

    for (const item of cartItems) {
      const product = products.get(item.productId);
      if (!product || product.status !== "live") return errorResponse("One of the gifts in your cart is no longer available.", "cart", item.cartKey);

      const selection = selections.find((candidate) => candidate.cartKey === item.cartKey);
      if (!selection) return errorResponse("Choose delivery details for every gift in your cart.", "date", item.cartKey);
      if (selection.pincode !== address.pincode) return errorResponse("The delivery pincode must match the selected address.", "pincode", item.cartKey);
      if (!isServiceable(product, address.pincode, address.city)) return errorResponse("This gift is not currently serviceable to the selected pincode or city.", "pincode", item.cartKey);
      if (isZoneHoliday(zone, selection.date)) return errorResponse("Delivery is unavailable on the selected date in this delivery zone. Choose another date.", "date", item.cartKey);
      if (!isSupportedDeliveryDate(product, selection.date)) return errorResponse("Choose a delivery date supported by this gift.", "date", item.cartKey);
      if (!isBeforeDeliveryCutoff(product, selection.date)) return errorResponse("The same-day delivery cutoff has passed. Choose another delivery date.", "date", item.cartKey);
      if (!isSupportedDeliverySlot(product, selection.slot)) return errorResponse("Choose a delivery time slot supported by this gift.", "slot", item.cartKey);

      const qty = getCartQuantity(item);
      const price = Number(item.priceAtAdd ?? 0);
      if (!Number.isFinite(price) || price <= 0) return errorResponse("A gift in your cart has an invalid saved price. Please remove it and add it again.", "cart", item.cartKey);

      const lineTotal = price * qty;
      subtotal += lineTotal;
      delivery += getDeliveryFee(product, selection.slot);
      normalizedSelections.push(selection);
      lines.push({
        cartKey: item.cartKey,
        productId: item.productId,
        title: typeof product.title === "string" ? product.title : item.productId,
        image: typeof product.thumbnail === "string" ? product.thumbnail : item.image,
        qty,
        unitPrice: price,
        lineTotal,
        variant: item.variant,
        personalization: safePersonalization(item.personalization),
        giftMessage: item.giftMessage,
        deliveryDate: selection.date,
        deliverySlot: selection.slot,
      });
    }

    const capacityError = await checkDeliveryCapacity(
      db,
      lines.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        date: line.deliveryDate,
        slot: line.deliverySlot,
      })),
      products,
    );
    if (capacityError) return errorResponse(capacityError, "slot");

    let discount = 0;
    const couponCode = normalizeCouponCode(body.couponCode);
    if (couponCode) {
      const couponSnapshot = await db.collection("coupons").doc(couponCode).get();
      const coupon = parseCoupon(couponSnapshot.data(), couponCode);
      if (!coupon) return errorResponse("This coupon code is not valid.", "cart");
      const redemption = await couponSnapshot.ref.collection("redemptions").doc(uid).get();
      const userUses = Math.max(0, Number(redemption.data()?.count || 0));
      if (coupon.perUserLimit !== undefined && userUses >= coupon.perUserLimit) return errorResponse("You have already used this coupon the maximum number of times.", "cart");
      const couponResult = calculateCouponDiscount(coupon, subtotal);
      if (!couponResult.valid) return errorResponse(couponResult.error, "cart");
      discount = couponResult.discount;
    }
    const tax = 0;
    const response: DeliveryValidationResponse = {
      valid: true,
      lines,
      totals: { subtotal, delivery, discount, tax, grandTotal: subtotal + delivery - discount + tax },
      delivery: normalizedSelections,
      address,
    };

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/checkout/delivery failed", error);
    const message = error instanceof Error ? error.message : "Unable to validate delivery.";
    if (message === "Missing bearer token.") return errorResponse("Please sign in before checkout.", "cart", undefined, 401);
    if (message === "Invalid token.") return errorResponse("Please sign in before checkout.", "cart", undefined, 401);
    return errorResponse("Unable to validate delivery right now.", "cart", undefined, 400);
  }
}
