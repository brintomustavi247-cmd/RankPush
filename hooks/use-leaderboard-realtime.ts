"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { debounce } from "@/lib/debounce-utils";

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
 * Updates are debounced (300 ms) and skipped when the serialised
 * data has not changed, preventing excessive re-renders caused by
 * multiple simultaneous listener firings on mount / refresh.
 *
 * @param topN - Number of top entries to return (default: 5)
 */
export function useLeaderboardRealtime(topN = 5) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track the last serialised snapshot so we can skip no-change updates.
  const prevSnapshotKey = useRef<string>("");

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("xp", "desc"),
      limit(topN)
    );

    // Debounced setter — waits 300 ms of silence before updating state.
    const debouncedSet = debounce((data: LeaderboardEntry[]) => {
      setEntries(data);
      setLoading(false);
    }, 300);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: LeaderboardEntry[] = snap.docs.map((d, i) => {
          const docData = d.data();
          return {
            rank: i + 1,
            uid: d.id,
            username: docData.displayName || docData.name || "Hunter",
            xp: docData.xp ?? 0,
            avatar:
              docData.photoURL ||
              `https://i.pravatar.cc/150?u=${d.id}`,
            studyTime: docData.study_time ?? undefined,
          };
        });

        // Build a lightweight key from uid + xp pairs to detect real changes.
        const snapshotKey = data.map((e) => `${e.uid}:${e.xp}`).join("|");
        if (snapshotKey === prevSnapshotKey.current) {
          // Data hasn't changed — skip the state update entirely.
          setLoading(false);
          return;
        }
        prevSnapshotKey.current = snapshotKey;

        debouncedSet(data);
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
