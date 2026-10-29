import type { WishlistProduct } from "@/app/api/wishlist/route";

export type WishlistAuthUser = {
  getIdToken: () => Promise<string>;
};

const GUEST_WISHLIST_KEY = "wishlist";

async function authHeaders(user: WishlistAuthUser) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function readGuestWishlist(): WishlistProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as WishlistProduct[]) : [];
  } catch {
    return [];
  }
}

export function clearGuestWishlist() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export async function fetchAccountWishlist(
  user: WishlistAuthUser,
): Promise<WishlistProduct[]> {
  const response = await fetch("/api/wishlist", {
    headers: await authHeaders(user),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load your wishlist.");
  const data = (await response.json()) as { items?: WishlistProduct[] };
  return data.items ?? [];
}

export async function syncWishlistToAccount(
  user: WishlistAuthUser,
  items: WishlistProduct[],
): Promise<WishlistProduct[]> {
  const response = await fetch("/api/wishlist", {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to save your wishlist.");
  const data = (await response.json()) as { items?: WishlistProduct[] };
  return data.items ?? [];
}

export async function removeFromAccountWishlist(
  user: WishlistAuthUser,
  id: string,
): Promise<WishlistProduct[]> {
  const response = await fetch(`/api/wishlist?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await authHeaders(user),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to update your wishlist.");
  const data = (await response.json()) as { items?: WishlistProduct[] };
  return data.items ?? [];
}

let guestMergePromise: Promise<WishlistProduct[] | null> | null = null;

// Mirrors mergeGuestCartIntoAccount: merges any localStorage wishlist
// into the account wishlist on login, only clearing local data after
// the server confirms the merge.
export function mergeGuestWishlistIntoAccount(user: WishlistAuthUser) {
  if (guestMergePromise) return guestMergePromise;

  guestMergePromise = (async () => {
    const guestItems = readGuestWishlist();
    if (guestItems.length === 0) return null;

    const merged = await syncWishlistToAccount(user, guestItems);
    clearGuestWishlist();
    return merged;
  })().finally(() => {
    guestMergePromise = null;
  });

  return guestMergePromise;
}
