"use client";

import { useEffect, useRef } from "react";
import {
  doc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface NotificationOptions {
  type: "xp" | "levelup" | "battle" | "session";
  message: string;
  duration?: number;
}

// ─────────────────────────────────────────────
// Show a notification toast
// ─────────────────────────────────────────────
export function showNotification({ type, message, duration = 3000 }: NotificationOptions) {
  const styles: Record<string, { icon: string; style: React.CSSProperties }> = {
    xp: {
      icon: "⚡",
      style: {
        background: "rgba(2,1,10,0.95)",
        border: "1px solid rgba(34,211,238,0.5)",
        color: "#22d3ee",
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.05em",
        fontSize: 14,
      },
    },
    levelup: {
      icon: "🎉",
      style: {
        background: "rgba(2,1,10,0.95)",
        border: "1px solid rgba(245,158,11,0.6)",
        color: "#f59e0b",
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.05em",
        fontSize: 14,
      },
    },
    battle: {
      icon: "⚔️",
      style: {
        background: "rgba(2,1,10,0.95)",
        border: "1px solid rgba(168,85,247,0.5)",
        color: "#a855f7",
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.05em",
        fontSize: 14,
      },
    },
    session: {
      icon: "✅",
      style: {
        background: "rgba(2,1,10,0.95)",
        border: "1px solid rgba(34,197,94,0.5)",
        color: "#22c55e",
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        letterSpacing: "0.05em",
        fontSize: 14,
      },
    },
  };

  const s = styles[type] || styles.xp;
  toast(`${s.icon} ${message}`, {
    duration,
    style: s.style as any,
    position: "top-right",
  });
}

// ─────────────────────────────────────────────
// Hook: Listen for XP and Level-up changes
// ─────────────────────────────────────────────
export function useXPNotifications(uid: string | null) {
  const prevXPRef    = useRef<number | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  // Track whether this is the initial snapshot (don't notify on first load)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const newXP: number    = data.xp    ?? 0;
      const newLevel: number = data.level ?? 1;

      if (!initializedRef.current) {
        // Store baseline on first snapshot — no notification
        prevXPRef.current    = newXP;
        prevLevelRef.current = newLevel;
        initializedRef.current = true;
        return;
      }

      // Level-up takes priority
      if (prevLevelRef.current !== null && newLevel > prevLevelRef.current) {
        showNotification({
          type: "levelup",
          message: `LEVEL UP! Now Level ${newLevel}`,
          duration: 5000,
        });
      } else if (prevXPRef.current !== null && newXP > prevXPRef.current) {
        const gained = newXP - prevXPRef.current;
        showNotification({
          type: "xp",
          message: `+${gained} XP ACQUIRED`,
          duration: 3000,
        });
      }

      prevXPRef.current    = newXP;
      prevLevelRef.current = newLevel;
    });

    return () => unsub();
  }, [uid]);
}

// ─────────────────────────────────────────────
// Hook: Listen for new battle results
// ─────────────────────────────────────────────
export function useBattleNotifications(uid: string | null) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const battlesRef = collection(db, "users", uid, "battles");
    const unsub = onSnapshot(battlesRef, (snap) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const won  = data.won === true;
          showNotification({
            type: "battle",
            message: won ? "VICTORY! Battle won!" : "Defeat — train harder!",
            duration: 4000,
          });
        }
      });
    });

    return () => unsub();
  }, [uid]);
}
