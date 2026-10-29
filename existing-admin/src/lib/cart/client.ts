import type { CartItem, GuestCartItem } from "./types";
import {
  CART_UPDATED_EVENT,
  clearGuestCart,
  guestCartToServerItems,
  readGuestCart,
  writeGuestCart,
} from "./storage";

export type CartAuthUser = {
  getIdToken: () => Promise<string>;
};

let guestMergePromise: Promise<CartItem[] | null> | null = null;

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

async function authHeaders(user: CartAuthUser) {
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function mergeGuestCartIntoAccount(
  user: CartAuthUser,
) {
  if (guestMergePromise) return guestMergePromise;

  guestMergePromise = (async () => {
    const guestItems = readGuestCart();
    if (guestItems.length === 0) return null;

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: await authHeaders(user),
      body: JSON.stringify({
        items: guestCartToServerItems(guestItems),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        "Unable to sync your cart.",
      );
    }

    const data = (await response.json()) as {
      items?: CartItem[];
    };

    // Clear local data only after the server confirms the merge.
    clearGuestCart();

    return data.items || [];
  })();

  void guestMergePromise.finally(() => {
    guestMergePromise = null;
  });

  return guestMergePromise;
}

export async function getAccountCart(
  user: CartAuthUser,
) {
  const token = await user.getIdToken();
  const response = await fetch("/api/cart", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Unable to load your cart.",
    );
  }

  const data = (await response.json()) as {
    items?: CartItem[];
  };

  return data.items || [];
}

export async function updateAccountCartItem(
  user: CartAuthUser,
  cartKey: string,
  qty: number,
) {
  const response = await fetch("/api/cart", {
    method: "PATCH",
    headers: await authHeaders(user),
    body: JSON.stringify({ cartKey, qty }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Unable to update your cart.",
    );
  }

  const data = (await response.json()) as {
    items: CartItem[];
  };
  notifyCartUpdated();
  return data;
}

export async function removeAccountCartItem(
  user: CartAuthUser,
  cartKey: string,
) {
  const token = await user.getIdToken();
  const response = await fetch(
    `/api/cart?cartKey=${encodeURIComponent(cartKey)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to remove that gift.",
    );
  }

  const data = (await response.json()) as {
    items: CartItem[];
  };
  notifyCartUpdated();
  return data;
}

export async function clearAccountCart(
  user: CartAuthUser,
) {
  const token = await user.getIdToken();
  const response = await fetch("/api/cart", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Unable to clear your cart.",
    );
  }

  const data = (await response.json()) as {
    items: CartItem[];
  };
  notifyCartUpdated();
  return data;
}

export function saveGuestCart(
  items: GuestCartItem[],
) {
  writeGuestCart(items);
}
