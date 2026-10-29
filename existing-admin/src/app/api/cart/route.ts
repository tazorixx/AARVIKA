import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  getAdminDb,
  verifyBearerToken,
} from "@/lib/firebase-admin";
import {
  createCartKey,
  normalizeCartQuantity,
  MAX_CART_ITEMS,
  type CartItem,
  type CartPersonalization,
} from "@/lib/cart/types";
import { mergeGuestIntoAccount } from "@/lib/cart/merge";
import { resolveAuthoritativeCartSelection } from "@/lib/cart/pricing";
import type { Product } from "@/lib/catalog/types";

function errorResponse(
  error: unknown,
  fallback = "Unable to update your cart.",
) {
  const message =
    error instanceof Error
      ? error.message
      : fallback;

  const status =
    message === "Missing bearer token." ||
    message === "Invalid token."
      ? 401
      : 400;

  return NextResponse.json(
    { error: message },
    { status },
  );
}

function parsePersonalization(
  value: unknown,
): CartPersonalization | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const entries = Object.entries(value).filter(
    ([key, val]) =>
      key.trim().length > 0 &&
      typeof val === "string",
  );

  return entries.length > 0
    ? Object.fromEntries(entries)
    : undefined;
}

type ParsedGuestCartItem = Omit<CartItem, "priceAtAdd">;

function parseGuestItem(
  value: unknown,
): ParsedGuestCartItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const productId =
    typeof item.productId === "string"
      ? item.productId.trim()
      : "";

  if (!productId) return null;

  const personalization =
    parsePersonalization(item.personalization);

  const variantId =
    typeof item.variantId === "string"
      ? item.variantId
      : undefined;

  const deliveryDate =
    typeof item.deliveryDate === "string"
      ? item.deliveryDate
      : undefined;

  const deliverySlot =
    typeof item.deliverySlot === "string"
      ? item.deliverySlot
      : undefined;

  const giftMessage =
    typeof item.giftMessage === "string"
      ? item.giftMessage.slice(0, 500)
      : undefined;

  const base = {
    productId,
    variantId,
    deliveryDate,
    deliverySlot,
    personalization,
    giftMessage,
  };

  const qty = normalizeCartQuantity(item.qty);

  return {
    cartKey: createCartKey(base),
    productId,
    qty,
    variantId,
    variant:
      typeof item.variant === "string"
        ? item.variant.slice(0, 200)
        : undefined,
    personalization,
    giftMessage,
    deliveryDate,
    deliverySlot,
    deliveryFee:
      typeof item.deliveryFee === "number" &&
      Number.isFinite(item.deliveryFee) &&
      item.deliveryFee >= 0
        ? item.deliveryFee
        : 0,
  };
}

async function readCart(uid: string) {
  const snapshot = await getAdminDb()
    .collection("carts")
    .doc(uid)
    .get();

  const data = snapshot.data();

  return Array.isArray(data?.items)
    ? (data.items as CartItem[])
    : [];
}

async function enrichCart(items: CartItem[]) {
  if (items.length === 0) return [];

  const db = getAdminDb();
  const uniqueIds = [
    ...new Set(
      items.map((item) => item.productId),
    ),
  ];

  const refs = uniqueIds.map((id) =>
    db.collection("products").doc(id),
  );

  const snapshots = await db.getAll(...refs);
  const products = new Map(
    snapshots.map((snapshot) => [
      snapshot.id,
      snapshot.data(),
    ]),
  );

  return items
    .filter((item) =>
      products.has(item.productId),
    )
    .map((item) => {
      const product =
        products.get(item.productId) || {};
      return {
        ...item,
        qty: normalizeCartQuantity(item.qty),
        title:
          typeof product.title === "string"
            ? product.title
            : item.title || item.productId,
        image:
          typeof product.thumbnail === "string"
            ? product.thumbnail
            : item.image,
        // priceAtAdd is an immutable snapshot. Do not overwrite it during
        // cart reads/enrichment. The current catalog price is display-only.
        priceAtAdd: item.priceAtAdd,
      };
    });
}

async function saveCart(
  uid: string,
  items: CartItem[],
) {
  const bounded = items.slice(0, MAX_CART_ITEMS);

  await getAdminDb()
    .collection("carts")
    .doc(uid)
    .set(
      {
        items: bounded,
        updatedAt:
          FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return enrichCart(bounded);
}

export async function GET(request: Request) {
  try {
    const { uid } =
      await verifyBearerToken(request);

    return NextResponse.json({
      items: await enrichCart(
        await readCart(uid),
      ),
    });
  } catch (error) {
    return errorResponse(
      error,
      "Unable to load your cart.",
    );
  }
}

export async function POST(request: Request) {
  try {
    const { uid } =
      await verifyBearerToken(request);

    const body = (await request.json()) as {
      items?: unknown[];
    };

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        {
          error:
            "Cart items are required.",
        },
        { status: 400 },
      );
    }

    const incoming = body.items
      .map(parseGuestItem)
      .filter(
        (item): item is ParsedGuestCartItem =>
          Boolean(item),
      );

    const db = getAdminDb();
    const cartRef = db.collection("carts").doc(uid);

    const productRefs = [...new Set(incoming.map((item) => item.productId))].map((id) =>
      db.collection("products").doc(id),
    );
    const productSnapshots = productRefs.length ? await db.getAll(...productRefs) : [];
    const products = new Map<string, Product>(
      productSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => [snapshot.id, { id: snapshot.id, ...(snapshot.data() as Omit<Product, "id">) }]),
    );

    const pricedIncoming: CartItem[] = incoming.map((item) => {
      const product = products.get(item.productId);
      if (!product || product.status !== "live") {
        throw new Error(`Unable to add "${item.productId}" because it is no longer available.`);
      }

      const selection = resolveAuthoritativeCartSelection(product, item.variantId);
      return {
        ...item,
        // Price, variant identity and display label are captured from the live
        // catalog. Client-supplied price/variant labels are never authoritative.
        variantId: selection.variantId,
        variant: selection.variant,
        priceAtAdd: selection.price,
        pricingVersion: selection.pricingVersion,
      };
    });

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(cartRef);
      const data = snapshot.data();
      const current = Array.isArray(data?.items)
        ? (data.items as CartItem[])
        : [];

      const merged = mergeGuestIntoAccount(
        current,
        pricedIncoming,
      );

      tx.set(
        cartRef,
        {
          items: merged,
          updatedAt:
            FieldValue.serverTimestamp(),
          recoveryStatus: "active",
          abandonedAt: FieldValue.delete(),
        },
        { merge: true },
      );
    });

    return NextResponse.json({
      items: await enrichCart(
        await readCart(uid),
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { uid } =
      await verifyBearerToken(request);

    const body = (await request.json()) as {
      cartKey?: unknown;
      qty?: unknown;
    };

    if (
      typeof body.cartKey !== "string" ||
      !body.cartKey
    ) {
      return NextResponse.json(
        {
          error:
            "Cart item is required.",
        },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const cartRef = db
      .collection("carts")
      .doc(uid);

    let updatedItems: CartItem[] = [];

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(cartRef);
      const data = snapshot.data();
      const items = Array.isArray(data?.items)
        ? (data.items as CartItem[])
        : [];

      const item = items.find(
        (candidate) =>
          candidate.cartKey === body.cartKey,
      );

      if (!item) {
        throw new Error(
          "That gift is no longer in your cart.",
        );
      }

      item.qty = normalizeCartQuantity(
        body.qty,
      );
      updatedItems = items;

      tx.set(
        cartRef,
        {
          items,
          updatedAt:
            FieldValue.serverTimestamp(),
          recoveryStatus: "active",
          abandonedAt: FieldValue.delete(),
        },
        { merge: true },
      );
    });

    return NextResponse.json({
      items: await enrichCart(updatedItems),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid } =
      await verifyBearerToken(request);

    const cartKey = new URL(
      request.url,
    ).searchParams.get("cartKey");

    const db = getAdminDb();
    const cartRef = db
      .collection("carts")
      .doc(uid);

    let updatedItems: CartItem[] = [];

    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(cartRef);
      const data = snapshot.data();
      const current = Array.isArray(data?.items)
        ? (data.items as CartItem[])
        : [];

      updatedItems = cartKey
        ? current.filter(
            (item) => item.cartKey !== cartKey,
          )
        : [];

      tx.set(
        cartRef,
        {
          items: updatedItems,
          updatedAt:
            FieldValue.serverTimestamp(),
          recoveryStatus: updatedItems.length ? "active" : "empty",
          abandonedAt: FieldValue.delete(),
        },
        { merge: true },
      );
    });

    return NextResponse.json({
      items: await enrichCart(updatedItems),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
