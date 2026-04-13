"use client";

import { useEffect, useRef, useState } from "react";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type NotifType = "xp" | "levelup" | "battle_win" | "battle_loss" | "session" | "rank_up" | "rank_down" | "quest" | "system";

export interface NotifRecord {
  id:        string;
  type:      NotifType;
  message:   string;
  subtext?:  string;
  read:      boolean;
  createdAt: Timestamp | null;
}

// ─────────────────────────────────────────────────────────────
// ICON + STYLE MAP
// ─────────────────────────────────────────────────────────────
const NOTIF_CONFIG: Record<NotifType, { icon: string; color: string; border: string }> = {
  xp:          { icon: "⚡",  color: "#22d3ee", border: "rgba(34,211,238,0.5)"   },
  levelup:     { icon: "🎉",  color: "#f59e0b", border: "rgba(245,158,11,0.6)"   },
  battle_win:  { icon: "🏆",  color: "#34d399", border: "rgba(52,211,153,0.5)"   },
  battle_loss: { icon: "💀",  color: "#f87171", border: "rgba(248,113,113,0.5)"  },
  session:     { icon: "⏱️",  color: "#22c55e", border: "rgba(34,197,94,0.5)"    },
  rank_up:     { icon: "🔱",  color: "#c084fc", border: "rgba(192,132,252,0.6)"  },
  rank_down:   { icon: "📉",  color: "#fb923c", border: "rgba(251,146,60,0.5)"   },
  quest:       { icon: "📋",  color: "#f59e0b", border: "rgba(245,158,11,0.4)"   },
  system:      { icon: "🔔",  color: "#94a3b8", border: "rgba(148,163,184,0.4)"  },
};

// ─────────────────────────────────────────────────────────────
// TOAST HELPER
// ─────────────────────────────────────────────────────────────
export function showNotification({
  type,
  message,
  duration = 4000,
}: {
  type: NotifType;
  message: string;
  duration?: number;
}) {
  const cfg = NOTIF_CONFIG[type] || NOTIF_CONFIG.system;
  toast(`${cfg.icon} ${message}`, {
    duration,
    style: {
      background:   "rgba(2,1,10,0.97)",
      border:       `1px solid ${cfg.border}`,
      color:        cfg.color,
      fontFamily:   "'Orbitron', sans-serif",
      fontWeight:   900,
      letterSpacing: "0.05em",
      fontSize:     13,
      borderRadius: 12,
    },
    position: "top-right",
  });
}

// ─────────────────────────────────────────────────────────────
// FIRESTORE HELPER — write a notification to users/{uid}/notifications
// ─────────────────────────────────────────────────────────────
export async function pushNotification(
  uid: string,
  type: NotifType,
  message: string,
  subtext?: string
): Promise<void> {
  try {
    const notifRef = collection(db, "users", uid, "notifications");
    await addDoc(notifRef, {
      type,
      message,
      subtext: subtext || "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// RELATIVE TIME HELPER
// ─────────────────────────────────────────────────────────────
export function relativeTime(ts: Timestamp | null): string {
  if (!ts) return "just now";
  const diffMs  = Date.now() - ts.toMillis();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr  < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────
// HOOK: Real-time bell panel notifications
// Listens to users/{uid}/notifications (last 20, ordered by time)
// Returns: notifications array, unread count, markAllRead fn
// ─────────────────────────────────────────────────────────────
export function useRealtimeNotifications(uid: string | null) {
  const [notifications, setNotifications] = useState<NotifRecord[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const notifRef = collection(db, "users", uid, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"), limit(20));

    const unsub = onSnapshot(q, (snap) => {
      const items: NotifRecord[] = snap.docs.map((d) => ({
        id:        d.id,
        type:      (d.data().type as NotifType) || "system",
        message:   d.data().message || "",
        subtext:   d.data().subtext || "",
        read:      d.data().read ?? false,
        createdAt: d.data().createdAt || null,
      }));

      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);

      // Toast for new incoming notifications (after first load)
      if (initializedRef.current) {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (!data.read) {
              showNotification({
                type:    data.type as NotifType || "system",
                message: data.message || "",
              });
            }
          }
        });
      }
      initializedRef.current = true;
    }, () => {
      // Firestore offline fallback
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => unsub();
  }, [uid]);

  async function markAllRead() {
    if (!uid) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, "users", uid, "notifications", n.id), { read: true })
      )
    );
  }

  async function markOneRead(id: string) {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "notifications", id), { read: true });
  }

  return { notifications, unreadCount, markAllRead, markOneRead };
}

// ─────────────────────────────────────────────────────────────
// HOOK: XP + Level-up listener (toast only — writes notif to Firestore)
// ─────────────────────────────────────────────────────────────
export function useXPNotifications(uid: string | null) {
  const prevXPRef      = useRef<number | null>(null);
  const prevLevelRef   = useRef<number | null>(null);
  const prevRankRef    = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const newXP:    number = data.xp    ?? 0;
      const newLevel: number = data.level ?? 1;
      const newRank:  string = data.rank  ?? "";

      if (!initializedRef.current) {
        prevXPRef.current    = newXP;
        prevLevelRef.current = newLevel;
        prevRankRef.current  = newRank;
        initializedRef.current = true;
        return;
      }

      // ── Level-up ──
      if (prevLevelRef.current !== null && newLevel > prevLevelRef.current) {
        showNotification({ type: "levelup", message: `LEVEL UP! Now Level ${newLevel}`, duration: 5000 });
        await pushNotification(uid, "levelup", `Level Up! Now Level ${newLevel}`, `+${newXP - (prevXPRef.current ?? 0)} XP`);
      }
      // ── Rank change ──
      else if (prevRankRef.current && newRank && newRank !== prevRankRef.current) {
        const isUp = true; // simplified; you can compare rank index
        showNotification({ type: isUp ? "rank_up" : "rank_down", message: `Rank changed → ${newRank}`, duration: 5000 });
        await pushNotification(uid, isUp ? "rank_up" : "rank_down", `Rank → ${newRank}!`, "Keep pushing!");
      }
      // ── XP gained ──
      else if (prevXPRef.current !== null && newXP > prevXPRef.current) {
        const gained = newXP - prevXPRef.current;
        showNotification({ type: "xp", message: `+${gained} XP ACQUIRED`, duration: 3000 });
        await pushNotification(uid, "xp", `+${gained} XP Acquired`);
      }

      prevXPRef.current    = newXP;
      prevLevelRef.current = newLevel;
      prevRankRef.current  = newRank;
    });

    return () => unsub();
  }, [uid]);
}

// ─────────────────────────────────────────────────────────────
// HOOK: Battle result listener
// ─────────────────────────────────────────────────────────────
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
      snap.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data  = change.doc.data();
          const won   = data.won === true;
          const xp    = data.xpEarned ?? (won ? 200 : 50);
          const accur = data.accuracy ?? 0;
          if (won) {
            showNotification({ type: "battle_win",  message: `VICTORY! +${xp} XP earned!`,          duration: 5000 });
            await pushNotification(uid, "battle_win",  `Victory! +${xp} XP`, `Accuracy: ${accur}%`);
          } else {
            showNotification({ type: "battle_loss", message: "DEFEAT — Keep training, Hunter.",        duration: 4000 });
            await pushNotification(uid, "battle_loss", "Battle Defeated", "Don't give up!");
          }
        }
      });
    }, () => {});

    return () => unsub();
  }, [uid]);
}

// ─────────────────────────────────────────────────────────────
// HOOK: Study session completion listener
// ─────────────────────────────────────────────────────────────
export function useSessionNotifications(uid: string | null) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const sessionsRef = collection(db, "users", uid, "sessions");
    const unsub = onSnapshot(sessionsRef, (snap) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return;
      }
      snap.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data    = change.doc.data();
          const minutes = data.minutes ?? 0;
          const xp      = data.xpEarned ?? 0;
          showNotification({ type: "session", message: `Session complete! ${minutes}m studied, +${xp} XP`, duration: 4000 });
          await pushNotification(uid, "session", `Session Complete! +${xp} XP`, `${minutes} minutes studied`);
        }
      });
    }, () => {});

    return () => unsub();
  }, [uid]);
}

// Re-export NOTIF_CONFIG for use in UI
export { NOTIF_CONFIG };
