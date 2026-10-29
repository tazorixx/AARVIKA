import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export type WishlistProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating?: string;
  image?: string;
  slug?: string;
};

function errorResponse(error: unknown, fallback = "Unable to update your wishlist.") {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    message === "Missing bearer token." || message === "Invalid token." ? 401 : 400;
  return NextResponse.json({ error: message }, { status });
}

function parseWishlistItem(value: unknown): WishlistProduct | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  if (!id) return null;

  return {
    id,
    name: typeof item.name === "string" ? item.name.slice(0, 300) : "",
    category: typeof item.category === "string" ? item.category.slice(0, 100) : "",
    price: typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0,
    oldPrice:
      typeof item.oldPrice === "number" && Number.isFinite(item.oldPrice)
        ? item.oldPrice
        : undefined,
    rating: typeof item.rating === "string" ? item.rating : undefined,
    image: typeof item.image === "string" ? item.image : undefined,
    slug: typeof item.slug === "string" ? item.slug : undefined,
  };
}

async function readWishlist(uid: string): Promise<WishlistProduct[]> {
  const snapshot = await getAdminDb().collection("wishlists").doc(uid).get();
  const data = snapshot.data();
  return Array.isArray(data?.items) ? (data.items as WishlistProduct[]) : [];
}

// GET: return the authenticated user's Firestore-backed wishlist.
export async function GET(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const items = await readWishlist(uid);
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error, "Unable to load your wishlist.");
  }
}

// POST: merge incoming items (e.g. from a guest's localStorage wishlist,
// or a single new save) into the account wishlist. De-duplicates by id.
export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as { items?: unknown[] };

    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "Wishlist items are required." }, { status: 400 });
    }

    const incoming = body.items
      .map(parseWishlistItem)
      .filter((item): item is WishlistProduct => Boolean(item));

    const existing = await readWishlist(uid);
    const merged = new Map<string, WishlistProduct>();
    for (const item of existing) merged.set(item.id, item);
    for (const item of incoming) merged.set(item.id, item);

    const items = [...merged.values()];

    await getAdminDb()
      .collection("wishlists")
      .doc(uid)
      .set({ items, updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE: remove a single product from the account wishlist by id.
export async function DELETE(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    }

    const existing = await readWishlist(uid);
    const items = existing.filter((item) => item.id !== id);

    await getAdminDb()
      .collection("wishlists")
      .doc(uid)
      .set({ items, updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}
