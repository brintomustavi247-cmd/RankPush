import {
  doc,
  updateDoc,
  addDoc,
  collection,
  increment,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────
// XP rate constants
// ─────────────────────────────────────────────
const FOCUSED_XP_PER_MINUTE  = 2; // Pomodoro/Focus sessions
const STANDARD_XP_PER_MINUTE = 1; // Free timer sessions

// ─────────────────────────────────────────────
// Level calculation (1 level per 500 XP)
// ─────────────────────────────────────────────
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

// ─────────────────────────────────────────────
// Add XP to a user and update their level.
// Uses a Firestore transaction to prevent race conditions
// when called from multiple sources.
// ─────────────────────────────────────────────
export async function updateUserXP(uid: string, xpAmount: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const currentXP: number = snap.data()?.xp ?? 0;
    const newXP = currentXP + xpAmount;
    tx.update(userRef, { xp: newXP, level: calculateLevel(newXP) });
  });
}

// ─────────────────────────────────────────────
// Award XP for a battle result.
// Returns the total XP awarded.
// ─────────────────────────────────────────────
export async function awardBattleXP(
  uid: string,
  won: boolean,
  accuracy: number
): Promise<number> {
  const baseXP = won ? 200 : 50;
  const accuracyBonus = Math.round(accuracy * 1.5);
  const totalXP = baseXP + accuracyBonus;
  await updateUserXP(uid, totalXP);
  return totalXP;
}

// ─────────────────────────────────────────────
// Award XP for a timer session and update
// totalHoursStudied. Returns the total XP awarded.
// ─────────────────────────────────────────────
export async function awardTimerXP(
  uid: string,
  minutes: number,
  type: string
): Promise<number> {
  const xpPerMinute =
    type === "POMODORO" || type === "FOCUS"
      ? FOCUSED_XP_PER_MINUTE
      : STANDARD_XP_PER_MINUTE;
  const totalXP = Math.max(1, Math.round(minutes * xpPerMinute));
  await updateUserXP(uid, totalXP);
  // Update totalHoursStudied atomically with increment
  await updateDoc(doc(db, "users", uid), {
    totalHoursStudied: increment(minutes / 60),
  });
  return totalXP;
}

// ─────────────────────────────────────────────
// Save a battle result to the battles sub-collection
// and increment the user's totalBattles counter.
// ─────────────────────────────────────────────
export async function saveBattleHistory(
  uid: string,
  battleData: Record<string, unknown>
): Promise<void> {
  const battlesRef = collection(db, "users", uid, "battles");
  await addDoc(battlesRef, { ...battleData, timestamp: serverTimestamp() });
  await updateDoc(doc(db, "users", uid), { totalBattles: increment(1) });
}

// ─────────────────────────────────────────────
// Save a study session to the sessions sub-collection.
// ─────────────────────────────────────────────
export async function saveSessionHistory(
  uid: string,
  sessionData: Record<string, unknown>
): Promise<void> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  await addDoc(sessionsRef, { ...sessionData, timestamp: serverTimestamp() });
}
