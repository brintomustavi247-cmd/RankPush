import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────
// Level calculation (1 level per 500 XP)
// ─────────────────────────────────────────────
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

// ─────────────────────────────────────────────
// Add XP to a user and update their level
// ─────────────────────────────────────────────
export async function updateUserXP(uid: string, xpAmount: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const currentXP: number = snap.exists() ? (snap.data().xp ?? 0) : 0;
  const newXP = currentXP + xpAmount;
  const newLevel = calculateLevel(newXP);
  await updateDoc(userRef, { xp: newXP, level: newLevel });
}

// ─────────────────────────────────────────────
// Award XP for a battle result
// Returns the total XP awarded
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
// Award XP for a timer session
// Returns the total XP awarded
// ─────────────────────────────────────────────
export async function awardTimerXP(
  uid: string,
  minutes: number,
  type: string
): Promise<number> {
  const xpPerMinute = type === "POMODORO" || type === "FOCUS" ? 2 : 1;
  const totalXP = Math.max(1, Math.round(minutes * xpPerMinute));

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const currentXP: number = snap.exists() ? (snap.data().xp ?? 0) : 0;
  const newXP = currentXP + totalXP;
  const newLevel = calculateLevel(newXP);

  await updateDoc(userRef, {
    xp: newXP,
    level: newLevel,
    totalHoursStudied: increment(minutes / 60),
  });

  return totalXP;
}

// ─────────────────────────────────────────────
// Save a battle result to the battles sub-collection
// and increment the user's totalBattles counter
// ─────────────────────────────────────────────
export async function saveBattleHistory(
  uid: string,
  battleData: Record<string, unknown>
): Promise<void> {
  const battlesRef = collection(db, "users", uid, "battles");
  await addDoc(battlesRef, { ...battleData, timestamp: serverTimestamp() });
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { totalBattles: increment(1) });
}

// ─────────────────────────────────────────────
// Save a study session to the sessions sub-collection
// ─────────────────────────────────────────────
export async function saveSessionHistory(
  uid: string,
  sessionData: Record<string, unknown>
): Promise<void> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  await addDoc(sessionsRef, { ...sessionData, timestamp: serverTimestamp() });
}
