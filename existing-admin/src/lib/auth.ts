"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getFreshIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdTokenResult(true);
}
