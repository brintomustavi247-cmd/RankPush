"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  username: string;
  xp: number;
  avatar: string;
  studyTime?: number;
}

/**
 * Real-time leaderboard hook.
 * Listens to the Firestore "users" collection ordered by xp (desc)
 * and auto-updates whenever any field on a user document changes
 * (including xp or study_time).
 *
 * @param topN - Number of top entries to return (default: 5)
 */
export function useLeaderboardRealtime(topN = 5) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("xp", "desc"),
      limit(topN)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: LeaderboardEntry[] = snap.docs.map((d, i) => {
          const doc = d.data();
          return {
            rank: i + 1,
            uid: d.id,
            username:
              doc.displayName || doc.name || "Hunter",
            xp: doc.xp ?? 0,
            avatar:
              doc.photoURL ||
              `https://i.pravatar.cc/150?u=${d.id}`,
            studyTime: doc.study_time ?? undefined,
          };
        });
        setEntries(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [topN]);

  return { entries, loading, error };
}
