import {
  doc,
  updateDoc,
  addDoc,
  collection,
  increment,
  serverTimestamp,
  runTransaction,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─────────────────────────────────────────────
// RANK SYSTEM (mirrored from dashboard — no circular import)
// ─────────────────────────────────────────────
const RANK_THRESHOLDS = [
  { id: "shadow_monarch", minXP: 120000 },
  { id: "national",       minXP: 80000  },
  { id: "s",              minXP: 50000  },
  { id: "a",              minXP: 28000  },
  { id: "b",              minXP: 14000  },
  { id: "c",              minXP: 6000   },
  { id: "d",              minXP: 2000   },
  { id: "e",              minXP: 0      },
];

function getRankId(xp: number): string {
  return RANK_THRESHOLDS.find(r => xp >= r.minXP)?.id || "e";
}

// ─────────────────────────────────────────────
// XP rate constants
// ─────────────────────────────────────────────
const FOCUSED_XP_PER_MINUTE  = 2;
const STANDARD_XP_PER_MINUTE = 1;

// ─────────────────────────────────────────────
// Level calculation (1 level per 500 XP)
// ─────────────────────────────────────────────
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

// ─────────────────────────────────────────────
// Weekly reset helper
// Checks if current Monday is different from stored weekStart
// Returns true if reset was performed
// ─────────────────────────────────────────────
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

export async function checkAndResetWeeklyStats(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) return;

    const data      = snap.data();
    const thisMonday = getMondayOf(new Date());
    const storedWeekStart = data.weekStart?.toDate?.() as Date | undefined;

    const needsReset =
      !storedWeekStart ||
      storedWeekStart.getTime() < thisMonday.getTime();

    if (needsReset) {
      await updateDoc(userRef, {
        weeklyXP:       0,
        weeklyBattles:  0,
        weeklyCorrect:  0,
        weeklyRankUps:  0,
        weekStart:      Timestamp.fromDate(thisMonday),
      });
    }
  } catch {}
}

// ─────────────────────────────────────────────
// Streak update helper
// Call after any study session or battle
// ─────────────────────────────────────────────
export async function updateStreak(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = data.lastStudyDate?.toDate?.() as Date | undefined;
    let   newStreak = data.streak ?? 0;

    if (!lastDate) {
      newStreak = 1;
    } else {
      const lastDay = new Date(lastDate);
      lastDay.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86400000);

      if (diffDays === 0) {
        // same day — no change
        return;
      } else if (diffDays === 1) {
        newStreak += 1; // consecutive day
      } else {
        newStreak = 1;  // streak broken
      }
    }

    await updateDoc(userRef, {
      streak:        newStreak,
      lastStudyDate: Timestamp.fromDate(today),
    });
  } catch {}
}

// ─────────────────────────────────────────────
// Add XP to a user and update level + rank + weeklyXP
// ─────────────────────────────────────────────
export async function updateUserXP(uid: string, xpAmount: number): Promise<void> {
  const userRef = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap       = await tx.get(userRef);
    const currentXP  = snap.data()?.xp ?? 0;
    const currentWXP = snap.data()?.weeklyXP ?? 0;
    const newXP      = currentXP + xpAmount;
    const newRankId  = getRankId(newXP);
    const oldRankId  = getRankId(currentXP);

    const update: Record<string, any> = {
      xp:       newXP,
      level:    calculateLevel(newXP),
      rank:     newRankId,
      weeklyXP: currentWXP + xpAmount,
    };

    // Track rank-up for weekly stats
    if (newRankId !== oldRankId) {
      update.weeklyRankUps = increment(1);
    }

    tx.set(userRef, update, { merge: true });
  });
}

// ─────────────────────────────────────────────
// Award XP for a battle result
// ─────────────────────────────────────────────
export async function awardBattleXP(
  uid: string,
  won: boolean,
  accuracy: number
): Promise<number> {
  const baseXP      = won ? 200 : 50;
  const accuracyBonus = Math.round(accuracy * 1.5);
  const totalXP     = baseXP + accuracyBonus;
  await updateUserXP(uid, totalXP);
  // Update weekly battle count
  await updateDoc(doc(db, "users", uid), {
    weeklyBattles: increment(1),
    ...(won ? {} : {}),
  });
  await updateStreak(uid);
  return totalXP;
}

// ─────────────────────────────────────────────
// Award XP for a timer session
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
  await updateDoc(doc(db, "users", uid), {
    totalHoursStudied: increment(minutes / 60),
  });
  await updateStreak(uid);
  return totalXP;
}

// ─────────────────────────────────────────────
// Save a battle result to the battles sub-collection
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
// Save a study session to the sessions sub-collection
// ─────────────────────────────────────────────
export async function saveSessionHistory(
  uid: string,
  sessionData: Record<string, unknown>
): Promise<void> {
  const sessionsRef = collection(db, "users", uid, "sessions");
  await addDoc(sessionsRef, { ...sessionData, timestamp: serverTimestamp() });
}

// ─────────────────────────────────────────────
// QUEST SYSTEM
// Default quests seeded into users/{uid}/quests/
// ─────────────────────────────────────────────
export const DEFAULT_QUESTS = [
  { id: "q1", title: "Physics Mastery",  desc: "Solve 20 MCQ",        xp: 500, total: 20, type: "questions", color: "#22d3ee", iconName: "atom"  },
  { id: "q2", title: "Speed Demon",      desc: "Answer in <5s × 10",  xp: 300, total: 10, type: "speed",     color: "#f59e0b", iconName: "clock" },
  { id: "q3", title: "Combo Master",     desc: "Get 5x combo streak",  xp: 400, total: 5,  type: "combo",     color: "#f87171", iconName: "flame" },
];

export async function initializeDefaultQuests(uid: string): Promise<void> {
  try {
    for (const quest of DEFAULT_QUESTS) {
      const qRef = doc(db, "users", uid, "quests", quest.id);
      const snap = await getDoc(qRef);
      if (!snap.exists()) {
        await setDoc(qRef, { ...quest, progress: 0, done: false, createdAt: serverTimestamp() });
      }
    }
  } catch {}
}

export async function updateQuestProgress(
  uid: string,
  type: "questions" | "speed" | "combo",
  amount = 1
): Promise<void> {
  try {
    const matching = DEFAULT_QUESTS.filter(q => q.type === type);
    for (const quest of matching) {
      const qRef = doc(db, "users", uid, "quests", quest.id);
      const snap = await getDoc(qRef);
      if (!snap.exists() || snap.data().done) continue;
      const cur  = snap.data().progress ?? 0;
      const tot  = snap.data().total    ?? quest.total;
      const next = Math.min(cur + amount, tot);
      await updateDoc(qRef, { progress: next, done: next >= tot });
    }
  } catch {}
}
