"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  clearGuestWishlist,
  fetchAccountWishlist,
  mergeGuestWishlistIntoAccount,
  readGuestWishlist,
  removeFromAccountWishlist,
  syncWishlistToAccount,
} from "@/lib/wishlist/client";

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

type WishlistContextType = {
  wishlist: WishlistProduct[];
  addToWishlist: (product: WishlistProduct) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (product: WishlistProduct) => void;
  isInWishlist: (id: string) => boolean;
};

const GUEST_WISHLIST_KEY = "wishlist";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const hasLoadedGuest = useRef(false);
  const previousUid = useRef<string | null>(null);

  // Guest (signed-out) state: load from localStorage once, keep it synced.
  useEffect(() => {
    if (user) return; // authenticated flow handled separately below
    if (!hasLoadedGuest.current) {
      setWishlist(readGuestWishlist());
      hasLoadedGuest.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (user) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, user]);

  // Authenticated flow: on login, merge any guest wishlist into the
  // account, then load the authoritative Firestore-backed wishlist.
  // Mirrors the existing guest-cart merge pattern exactly.
  useEffect(() => {
    if (!user || previousUid.current === user.uid) return;
    previousUid.current = user.uid;

    let cancelled = false;

    (async () => {
      try {
        const guestItems = readGuestWishlist();
        if (guestItems.length > 0) {
          await mergeGuestWishlistIntoAccount(user);
        }
        const items = await fetchAccountWishlist(user);
        if (!cancelled) setWishlist(items);
      } catch {
        // If the sync fails, fall back to whatever guest data exists
        // locally rather than losing the user's saved items.
        if (!cancelled) setWishlist(readGuestWishlist());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = (next: WishlistProduct[]) => {
    if (user) {
      void syncWishlistToAccount(user, next).catch(() => {
        // Optimistic UI update stands even if the background sync
        // fails; the next successful load will reconcile.
      });
    }
  };

  const addToWishlist = (product: WishlistProduct) => {
    setWishlist((current) => {
      if (current.some((item) => item.id === product.id)) return current;
      const next = [...current, product];
      persist(next);
      return next;
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((current) => {
      const next = current.filter((item) => item.id !== id);
      if (user) {
        void removeFromAccountWishlist(user, id).catch(() => {});
      } else {
        clearGuestWishlist();
      }
      return next;
    });
  };

  const toggleWishlist = (product: WishlistProduct) => {
    setWishlist((current) => {
      const exists = current.some((item) => item.id === product.id);
      const next = exists
        ? current.filter((item) => item.id !== product.id)
        : [...current, product];
      persist(next);
      return next;
    });
  };

  const isInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
