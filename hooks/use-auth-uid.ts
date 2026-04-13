"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Caches the current Firebase Auth UID in a ref.
 * The ref is always up-to-date but does NOT trigger re-renders,
 * which makes it ideal for use inside event handlers and IIFE callbacks.
 */
export function useAuthUid(): React.MutableRefObject<string | null> {
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      uidRef.current = u ? u.uid : null;
    });
    return () => unsub();
  }, []);

  return uidRef;
}
