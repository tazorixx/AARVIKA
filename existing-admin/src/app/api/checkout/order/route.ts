import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import {
  isServiceable,
  isSupportedDeliveryDate,
  isSupportedDeliverySlot,
  validateAddress,
} from "@/lib/checkout/validation";
import { generateTransactionalOrderId } from "@/lib/checkout/order-id";
import { reserveInventory } from "@/lib/checkout/inventory";
import { createRazorpayOrder, getRazorpayKeys, type RazorpayOrderResponse } from "@/lib/checkout/razorpay";
import { releaseOrderReservationAfterPaymentSetupFailure } from "@/lib/checkout/payment";
import { getCartQuantity, type CartItem } from "@/lib/cart/types";
import { validateStoredVariantSelection } from "@/lib/cart/pricing";
import { validateCartPriceSnapshots } from "@/lib/checkout/order-pricing";
import { checkDeliveryCapacity, getDeliveryFee, isBeforeDeliveryCutoff, reserveDeliveryCapacity } from "@/lib/checkout/delivery-rules";
import { calculateCouponDiscount, normalizeCouponCode, parseCoupon } from "@/lib/checkout/coupon";
import type { CheckoutAddress, CheckoutDeliverySelection } from "@/lib/checkout/types";
import type { Product } from "@/lib/catalog/types";
import { applyDeliveryZone, findDeliveryZone, isZoneHoliday } from "@/lib/checkout/delivery-zones";
import { CHECKOUT_ATTEMPT_COLLECTION, checkoutAttemptDocId, hashCheckoutIntent, normalizeCheckoutRequestId } from "@/lib/checkout/idempotency";

class CheckoutRouteError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutRouteError";
  }
}

async function existingOrderResponse(
  db: FirebaseFirestore.Firestore,
  uid: string,
  orderId: string,
  checkoutIntentChanged = false,
) {
  const orderSnapshot = await db.collection("orders").doc(orderId).get();
  if (!orderSnapshot.exists) {
    throw new CheckoutRouteError(409, "CHECKOUT_ATTEMPT_INCOMPLETE", "Your previous checkout attempt is incomplete. Please wait a moment and try again.");
  }

  const order = orderSnapshot.data() || {};
  const razorpayOrderId = typeof order.razorpayOrderId === "string" ? order.razorpayOrderId : "";
  if (!razorpayOrderId) {
    if (order.status === "payment_setup_failed") {
      throw new CheckoutRouteError(409, "CHECKOUT_ATTEMPT_FAILED", "The previous payment setup failed. Start payment again to create a new attempt.");
    }
    throw new CheckoutRouteError(409, "CHECKOUT_ATTEMPT_IN_PROGRESS", "Gift4U is still preparing your previous payment attempt. Please try again in a moment.");
  }

  const address = (order.address || {}) as CheckoutAddress;
  const grandTotal = Number(order.totals?.grandTotal || 0);
  const { keyId } = getRazorpayKeys();
  const userRecord = await getAdminAuth().getUser(uid).catch(() => null);

  return NextResponse.json({
    ok: true,
    orderId,
    recovered: true,
    checkoutIntentChanged,
    orderStatus: String(order.status || "pending_payment"),
    razorpayOrder: {
      id: razorpayOrderId,
      amount: Math.round(grandTotal * 100),
      currency: "INR",
      receipt: orderId,
      keyId: keyId || "rzp_test_placeholder",
      ...(razorpayOrderId.startsWith("rzp_mock_") ? { mock: true } : {}),
    },
    customer: {
      name: address.name || "",
      email: userRecord?.email || "",
      phone: address.phone || "",
    },
  });
}

export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as {
      address: CheckoutAddress;
      delivery: CheckoutDeliverySelection[];
      couponCode?: string;
      clientRequestId?: string;
    };

    const clientRequestId = normalizeCheckoutRequestId(body.clientRequestId);
    if (!clientRequestId) {
      return NextResponse.json(
        { error: "A valid checkout request ID is required.", code: "CHECKOUT_REQUEST_ID_REQUIRED" },
        { status: 400 },
      );
    }

    if (!validateAddress(body.address) || !body.address.id) {
      return NextResponse.json(
        { error: "Please choose a valid saved delivery address." },
        { status: 400 },
      );
    }

    const db = getAdminDb();

    // The order endpoint is a trusted boundary and must not rely on the
    // browser having called the delivery-validation endpoint first. Resolve
    // the selected address from the authenticated user's own address record.
    const addressSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .doc(body.address.id)
      .get();

    if (!addressSnapshot.exists) {
      return NextResponse.json(
        { error: "That saved delivery address could not be found." },
        { status: 400 },
      );
    }

    const storedAddress = addressSnapshot.data() || {};
    const address: CheckoutAddress = {
      id: addressSnapshot.id,
      label: typeof storedAddress.label === "string" ? storedAddress.label : undefined,
      name: typeof storedAddress.name === "string" ? storedAddress.name.trim() : "",
      phone: typeof storedAddress.phone === "string" ? storedAddress.phone.trim() : "",
      addressLine: typeof storedAddress.addressLine === "string" ? storedAddress.addressLine.trim() : "",
      city: typeof storedAddress.city === "string" ? storedAddress.city.trim() : "",
      state: typeof storedAddress.state === "string" ? storedAddress.state.trim() : "",
      pincode: typeof storedAddress.pincode === "string" ? storedAddress.pincode.trim() : "",
      landmark: typeof storedAddress.landmark === "string" ? storedAddress.landmark.trim() : undefined,
    };

    if (!validateAddress(address)) {
      return NextResponse.json(
        { error: "The selected saved address is incomplete or invalid." },
        { status: 400 },
      );
    }

    const requestHash = hashCheckoutIntent({
      addressId: address.id || "",
      delivery: body.delivery,
      couponCode: body.couponCode,
    });
    const attemptRef = db.collection(CHECKOUT_ATTEMPT_COLLECTION).doc(
      checkoutAttemptDocId(uid, clientRequestId),
    );
    const existingAttempt = await attemptRef.get();
    if (existingAttempt.exists) {
      const attempt = existingAttempt.data() || {};
      const existingOrderId = typeof attempt.orderId === "string" ? attempt.orderId : "";
      if (!existingOrderId) {
        throw new CheckoutRouteError(409, "CHECKOUT_ATTEMPT_INCOMPLETE", "Your previous checkout attempt is incomplete. Please try again in a moment.");
      }
      // Idempotency keys are immutable: once a request ID creates an order,
      // every retry resolves to that first order even if the UI changed since
      // the original dispatch. This is safer than creating a second reservation.
      return existingOrderResponse(db, uid, existingOrderId, attempt.requestHash !== requestHash);
    }

    // 1. Fetch user's cart from Firestore
    const cartSnapshot = await db
      .collection("carts")
      .doc(uid)
      .get();

    if (!cartSnapshot.exists) {
      return NextResponse.json(
        { error: "Your cart is empty. Add a gift before checking out." },
        { status: 400 },
      );
    }

    const cartData = cartSnapshot.data();
    const cartItems = Array.isArray(cartData?.items)
      ? (cartData.items as CartItem[])
      : [];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty. Add a gift before checking out." },
        { status: 400 },
      );
    }

    // Map delivery selections onto cart items
    const deliveryMap = new Map<string, CheckoutDeliverySelection>();
    if (Array.isArray(body.delivery)) {
      for (const d of body.delivery) {
        if (d?.cartKey) deliveryMap.set(d.cartKey, d);
      }
    }

    const orderItems = cartItems.map((item) => {
      const customDelivery = deliveryMap.get(item.cartKey);
      return {
        ...item,
        qty: getCartQuantity(item),
        deliveryDate: customDelivery?.date || item.deliveryDate || "",
        deliverySlot: customDelivery?.slot || item.deliverySlot || "",
      };
    });

    const priceValidation = validateCartPriceSnapshots(orderItems);
    if (!priceValidation.valid) {
      return NextResponse.json(
        { error: priceValidation.message },
        { status: 400 },
      );
    }

    // Re-check delivery constraints at the order boundary. The client cannot
    // bypass serviceability/date/slot rules by calling this endpoint directly.
    const productIds = [...new Set(orderItems.map((item) => item.productId))];
    const productSnapshots = await db.getAll(
      ...productIds.map((id) => db.collection("products").doc(id)),
    );
    const products = new Map(
      productSnapshots.map((snapshot) => [snapshot.id, snapshot.data() as Product]),
    );
    const zone = await findDeliveryZone(db, address.pincode, address.city);
    if (zone) {
      for (const [productId, product] of products.entries()) {
        products.set(productId, { ...product, delivery: applyDeliveryZone(product, zone) });
      }
    }

    for (const item of orderItems) {
      const product = products.get(item.productId);
      if (product) {
        const variantValidation = validateStoredVariantSelection(product, item);
        if (!variantValidation.valid) {
          return NextResponse.json(
            { error: variantValidation.message, code: "CART_PRICE_REFRESH_REQUIRED" },
            { status: 409 },
          );
        }
      }
    }

    for (const item of orderItems) {
      const product = products.get(item.productId);
      if (!product || product.status !== "live") {
        return NextResponse.json(
          { error: `The gift "${item.title || item.productId}" is no longer available.` },
          { status: 400 },
        );
      }

      const customDelivery = deliveryMap.get(item.cartKey);
      const pincode = customDelivery?.pincode?.trim() || "";
      if (pincode !== address.pincode) {
        return NextResponse.json(
          { error: `The delivery pincode for "${item.title || item.productId}" must match the selected address.` },
          { status: 400 },
        );
      }

      if (!isServiceable(product, address.pincode, address.city)) {
        return NextResponse.json(
          { error: `The gift "${item.title || item.productId}" is not serviceable to the selected address.` },
          { status: 400 },
        );
      }

      if (item.deliveryDate && isZoneHoliday(zone, item.deliveryDate)) {
        return NextResponse.json(
          { error: `Delivery is unavailable on ${item.deliveryDate} in the selected delivery zone.` },
          { status: 400 },
        );
      }

      if (!item.deliveryDate || !isSupportedDeliveryDate(product, item.deliveryDate)) {
        return NextResponse.json(
          { error: `Please choose a supported delivery date for "${item.title || item.productId}".` },
          { status: 400 },
        );
      }

      if (item.deliveryDate && !isBeforeDeliveryCutoff(product, item.deliveryDate)) {
        return NextResponse.json(
          { error: `The same-day delivery cutoff has passed for "${item.title || item.productId}". Please choose another date.` },
          { status: 400 },
        );
      }

      if (!item.deliverySlot || !isSupportedDeliverySlot(product, item.deliverySlot)) {
        return NextResponse.json(
          { error: `Please choose a supported delivery time slot for "${item.title || item.productId}".` },
          { status: 400 },
        );
      }
    }

    // 2. Compute authoritative delivery fees, capacity, and coupon discount.
    const subtotal = orderItems.reduce(
      (sum, it) => sum + Number(it.priceAtAdd || 0) * it.qty,
      0,
    );
    const deliveryFee = orderItems.reduce((sum, item) => {
      const product = products.get(item.productId)!;
      return sum + getDeliveryFee(product, item.deliverySlot);
    }, 0);
    const couponCode = normalizeCouponCode(body.couponCode);
    let discount = 0;
    if (couponCode) {
      const couponSnapshot = await db.collection("coupons").doc(couponCode).get();
      const coupon = parseCoupon(couponSnapshot.data(), couponCode);
      if (!coupon) return NextResponse.json({ error: "This coupon code is not valid." }, { status: 400 });
      const redemption = await couponSnapshot.ref.collection("redemptions").doc(uid).get();
      const userUses = Math.max(0, Number(redemption.data()?.count || 0));
      if (coupon.perUserLimit !== undefined && userUses >= coupon.perUserLimit) return NextResponse.json({ error: "You have already used this coupon the maximum number of times." }, { status: 400 });
      const couponResult = calculateCouponDiscount(coupon, subtotal);
      if (!couponResult.valid) return NextResponse.json({ error: couponResult.error }, { status: 400 });
      discount = couponResult.discount;
    }
    const grandTotal = subtotal + deliveryFee - discount;

    const capacityError = await checkDeliveryCapacity(
      db,
      orderItems.map((item) => ({ productId: item.productId, qty: item.qty, date: item.deliveryDate, slot: item.deliverySlot })),
      products,
    );
    if (capacityError) return NextResponse.json({ error: capacityError }, { status: 409 });

    if (grandTotal <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount." },
        { status: 400 },
      );
    }

    // 3. Run one atomic reservation transaction. The checkout request ID is
    // persisted in the same transaction as the order so concurrent/retried
    // requests cannot reserve inventory, delivery capacity, or coupons twice.
    const reservation = await db.runTransaction(async (tx) => {
      const attemptSnapshot = await tx.get(attemptRef);
      if (attemptSnapshot.exists) {
        const attempt = attemptSnapshot.data() || {};
        const existingOrderId = typeof attempt.orderId === "string" ? attempt.orderId : "";
        if (!existingOrderId) {
          throw new CheckoutRouteError(409, "CHECKOUT_ATTEMPT_INCOMPLETE", "Your previous checkout attempt is incomplete. Please try again in a moment.");
        }
        return {
          orderId: existingOrderId,
          orderRef: db.collection("orders").doc(existingOrderId),
          duplicate: true as const,
          checkoutIntentChanged: attempt.requestHash !== requestHash,
        };
      }

      const orderId = await generateTransactionalOrderId(tx, db);

      await reserveInventory(
        tx,
        db,
        orderItems.map((it) => ({
          productId: it.productId,
          qty: it.qty,
          title: it.title,
        })),
      );

      await reserveDeliveryCapacity(
        tx,
        db,
        orderItems.map((item) => ({
          cartKey: item.cartKey,
          pincode: address.pincode,
          date: item.deliveryDate,
          slot: item.deliverySlot,
          productId: item.productId,
          qty: item.qty,
        })),
        products,
      );

      if (couponCode) {
        const couponRef = db.collection("coupons").doc(couponCode);
        const couponRedemptionRef = couponRef.collection("redemptions").doc(uid);
        const couponSnapshot = await tx.get(couponRef);
        const coupon = parseCoupon(couponSnapshot.data(), couponCode);
        if (!coupon) throw new Error("This coupon code is no longer valid.");
        const redemptionSnapshot = await tx.get(couponRedemptionRef);
        const userUses = Math.max(0, Number(redemptionSnapshot.data()?.count || 0));
        if (coupon.perUserLimit !== undefined && userUses >= coupon.perUserLimit) throw new Error("You have already used this coupon the maximum number of times.");
        const couponResult = calculateCouponDiscount(coupon, subtotal);
        if (!couponResult.valid) throw new Error(couponResult.error);
        if (Math.abs(couponResult.discount - discount) > 0.001) throw new Error("The coupon changed. Please apply it again.");
        tx.set(couponRef, { usedCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(couponRedemptionRef, { count: FieldValue.increment(1), lastUsedAt: FieldValue.serverTimestamp() }, { merge: true });
      }

      const orderRef = db.collection("orders").doc(orderId);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      tx.set(orderRef, {
        id: orderId,
        userId: uid,
        status: "pending_payment",
        items: orderItems,
        address,
        totals: {
          subtotal,
          delivery: deliveryFee,
          discount,
          tax: 0,
          grandTotal,
        },
        ...(couponCode ? { coupon: { code: couponCode, discount } } : {}),
        checkoutRequestId: clientRequestId,
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.create(attemptRef, {
        userId: uid,
        clientRequestId,
        requestHash,
        orderId,
        state: "reserved",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { orderId, orderRef, duplicate: false as const, checkoutIntentChanged: false };
    });

    if (reservation.duplicate) {
      return existingOrderResponse(db, uid, reservation.orderId, reservation.checkoutIntentChanged);
    }

    const { orderId, orderRef: orderDocRef } = reservation;

    // 4. Create Razorpay Order
    const userRecord = await getAdminAuth().getUser(uid).catch(() => null);

    let razorpayOrder: RazorpayOrderResponse;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountInPaise: grandTotal * 100,
        currency: "INR",
        receipt: orderId,
        notes: {
          orderId,
          userId: uid,
          recipient: address.name,
          pincode: address.pincode,
        },
      });

      // Link the Razorpay order and mark the request reusable for safe recovery
      // if the HTTP response is lost after the server has completed setup.
      const linkBatch = db.batch();
      linkBatch.update(orderDocRef, {
        razorpayOrderId: razorpayOrder.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
      linkBatch.set(attemptRef, {
        state: "ready",
        razorpayOrderId: razorpayOrder.id,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await linkBatch.commit();
    } catch (razorpayError) {
      // Do not leave inventory/capacity/coupon reservations behind when the
      // payment order cannot be prepared. The client receives a definite code
      // so it can discard this failed request ID before a fresh attempt.
      await releaseOrderReservationAfterPaymentSetupFailure(db, orderDocRef);
      await attemptRef.set({
        state: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw new CheckoutRouteError(502, "PAYMENT_SETUP_FAILED", razorpayError instanceof Error
        ? razorpayError.message
        : "Payment setup failed. Please start a new attempt.");
    }

    return NextResponse.json({
      ok: true,
      orderId,
      recovered: false,
      orderStatus: "pending_payment",
      razorpayOrder,
      customer: {
        name: address.name,
        email: userRecord?.email || "",
        phone: address.phone,
      },
    });
  } catch (error) {
    console.error("POST /api/checkout/order failed:", error);
    if (error instanceof CheckoutRouteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unable to initiate order.";
    if (/coupon|delivery slot|cutoff|serviceable|supported delivery/i.test(message)) {
      return NextResponse.json({ error: message }, { status: /delivery slot/i.test(message) ? 409 : 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
