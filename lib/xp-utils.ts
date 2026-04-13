import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────
// XP UTILITIES
// ─────────────────────────────────────────────

/**
 * Add XP to a user's account in Firestore.
 * Reads current XP, adds the given amount, and writes back.
 */
export async function updateUserXP(uid: string, xpAmount: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const current = snap.data().xp || 0;
    await updateDoc(userRef, { xp: current + xpAmount });
  }
}

// ─────────────────────────────────────────────
// BATTLE XP
// ─────────────────────────────────────────────

export interface BattleResult {
  opponent: string;
  subject: string;
  result: "victory" | "defeat";
  score: string;        // e.g. "7/10"
  xpGained: number;
  coinsGained: number;
}

/**
 * Award XP for a battle result and save the battle record to Firestore.
 * Returns the XP awarded.
 */
export async function awardBattleXP(
  uid: string,
  won: boolean,
  correctCount: number,
  totalQuestions: number,
  subject: string,
  earnedExp: number
): Promise<number> {
  const xpGained = won
    ? Math.round(earnedExp + (correctCount / totalQuestions) * 200)
    : Math.round(earnedExp * 0.3 + 20);
  const coinsGained = won ? Math.round(xpGained / 5) : 10;

  const battleRecord: BattleResult & { timestamp: ReturnType<typeof serverTimestamp> } = {
    opponent: "AI Dungeon",
    subject,
    result: won ? "victory" : "defeat",
    score: `${correctCount}/${totalQuestions}`,
    xpGained,
    coinsGained,
    timestamp: serverTimestamp(),
  };

  // Save battle to user's sub-collection
  const battlesRef = collection(db, "users", uid, "battles");
  await addDoc(battlesRef, battleRecord);

  // Update user's total XP
  await updateUserXP(uid, xpGained);

  return xpGained;
}

// ─────────────────────────────────────────────
// TIMER / FOCUS SESSION XP
// ─────────────────────────────────────────────

/**
 * Award XP for a completed focus/timer session and save the session record.
 * Returns the XP awarded.
 */
export async function awardTimerXP(
  uid: string,
  minutes: number,
  xp: number,
  subject: string,
  type: string
): Promise<number> {
  // Save session record
  const sessionsRef = collection(db, "users", uid, "sessions");
  await addDoc(sessionsRef, {
    type,
    duration: minutes,
    xp,
    subject,
    timestamp: serverTimestamp(),
  });

  // Update totalHoursStudied stat on the user doc
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    const currentXP = data.xp || 0;
    const currentMins = data.totalMinutesStudied || 0;
    await updateDoc(userRef, {
      xp: currentXP + xp,
      totalMinutesStudied: currentMins + minutes,
    });
  }

  return xp;
}

// ─────────────────────────────────────────────
// BATTLE HISTORY
// ─────────────────────────────────────────────

export interface BattleHistoryEntry {
  id: string;
  opponent: string;
  subject: string;
  result: "victory" | "defeat";
  score: string;
  xpGained: number;
  coinsGained: number;
  timeAgo: string;
}

function timeAgoFromTimestamp(ts: any): string {
  if (!ts) return "just now";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Subscribe to real-time battle history for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToBattleHistory(
  uid: string,
  onUpdate: (battles: BattleHistoryEntry[]) => void,
  maxEntries = 10
): Unsubscribe {
  const battlesRef = collection(db, "users", uid, "battles");
  const q = query(battlesRef, orderBy("timestamp", "desc"), limit(maxEntries));

  return onSnapshot(q, (snap) => {
    const battles: BattleHistoryEntry[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        opponent: data.opponent || "Unknown",
        subject: data.subject || "Battle",
        result: data.result || "defeat",
        score: data.score || "0/0",
        xpGained: data.xpGained || 0,
        coinsGained: data.coinsGained || 0,
        timeAgo: timeAgoFromTimestamp(data.timestamp),
      };
    });
    onUpdate(battles);
  });
}

/**
 * Fetch battle history once (non-realtime).
 */
export async function getBattleHistory(
  uid: string,
  maxEntries = 10
): Promise<BattleHistoryEntry[]> {
  const battlesRef = collection(db, "users", uid, "battles");
  const q = query(battlesRef, orderBy("timestamp", "desc"), limit(maxEntries));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      opponent: data.opponent || "Unknown",
      subject: data.subject || "Battle",
      result: data.result || "defeat",
      score: data.score || "0/0",
      xpGained: data.xpGained || 0,
      coinsGained: data.coinsGained || 0,
      timeAgo: timeAgoFromTimestamp(data.timestamp),
    };
  });
}
