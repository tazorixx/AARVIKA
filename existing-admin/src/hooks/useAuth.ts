"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuth } from "../lib/auth";
import { mergeGuestCartIntoAccount } from "../lib/cart/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        void mergeGuestCartIntoAccount(
          nextUser,
        ).catch(() => {
          // The guest cart remains untouched when the
          // server sync fails. A later authenticated cart
          // load can retry without data loss.
        });
      }
    });
  }, []);

  return { user, loading };
}
