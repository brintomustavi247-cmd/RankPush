// components/dashboard/RankSystem.ts
// Central data source and configuration for the ranking logic.

import { Atom, FlaskConical, Sigma, Dna, Clock, Flame } from "lucide-react";

// ============================================================
// TYPES
// ============================================================
export type Plan = "free" | "pro";
export type RankId =
  | "e"
  | "d"
  | "c"
  | "b"
  | "a"
  | "s"
  | "national"
  | "shadow_monarch";

export interface RankInfo {
  id: RankId;
  name: string;
  title: string;
  color: string;
  glowColor: string;
  bgColor: string;
  icon: string;
  minXP: number;
  maxXP: number;
  description: string;
}

export interface Subject {
  name: string;
  icon: React.ElementType;
  color: string;
  locked: boolean;
  questions: number;
}

export interface DailyQuest {
  id: number;
  title: string;
  desc: string;
  xp: number;
  progress: number;
  total: number;
  icon: React.ElementType;
  color: string;
  done: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: string;
  rank: string;
  avatar: string;
  rankInfo: RankInfo;
}

export interface Achievement {
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  xp: number;
}

export interface UserStats {
  xp: number;
  level: number;
  accuracy: number;
  speed: number;
  iq: number;
  logic: number;
  focus: number;
  streak: number;
  totalBattles: number;
  weeklyXP: number;
  plan: Plan;
  joinDate: string;
  totalHoursStudied: number;
  questionsAttempted: number;
  correctAnswers: number;
}

// ============================================================
// RANK DEFINITIONS — E (weakest) → Shadow Monarch (highest)
// ============================================================
export const RANKS: RankInfo[] = [
  {
    id: "e",
    name: "E-Rank",
    title: "Weakest Hunter",
    color: "#6b7280",
    glowColor: "rgba(107,114,128,0.4)",
    bgColor: "rgba(107,114,128,0.08)",
    icon: "🪨",
    minXP: 0,
    maxXP: 1999,
    description: "The starting point. Every Shadow Lord began here.",
  },
  {
    id: "d",
    name: "D-Rank",
    title: "Awakened Hunter",
    color: "#b45309",
    glowColor: "rgba(180,83,9,0.4)",
    bgColor: "rgba(180,83,9,0.08)",
    icon: "🔰",
    minXP: 2000,
    maxXP: 5999,
    description: "Awakening confirmed. The system acknowledges your power.",
  },
  {
    id: "c",
    name: "C-Rank",
    title: "Gate Raider",
    color: "#0ea5e9",
    glowColor: "rgba(14,165,233,0.4)",
    bgColor: "rgba(14,165,233,0.08)",
    icon: "🌀",
    minXP: 6000,
    maxXP: 13999,
    description: "You raid dungeons others fear. Gates tremble at your approach.",
  },
  {
    id: "b",
    name: "B-Rank",
    title: "Elite Fighter",
    color: "#22d3ee",
    glowColor: "rgba(34,211,238,0.4)",
    bgColor: "rgba(34,211,238,0.08)",
    icon: "⚡",
    minXP: 14000,
    maxXP: 27999,
    description: "Elite class. Guild leaders take notice of your strength.",
  },
  {
    id: "a",
    name: "A-Rank",
    title: "Dungeon Breaker",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.4)",
    bgColor: "rgba(168,85,247,0.08)",
    icon: "💜",
    minXP: 28000,
    maxXP: 49999,
    description: "Ranked among the nation's finest. Dungeons fall before you.",
  },
  {
    id: "s",
    name: "S-Rank",
    title: "Sovereign Hunter",
    color: "#f59e0b",
    glowColor: "rgba(245,158,11,0.5)",
    bgColor: "rgba(245,158,11,0.08)",
    icon: "👑",
    minXP: 50000,
    maxXP: 79999,
    description: "The pinnacle of mankind. Only the chosen few reach this rank.",
  },
  {
    id: "national",
    name: "National Level",
    title: "Absolute Monarch",
    color: "#ec4899",
    glowColor: "rgba(236,72,153,0.5)",
    bgColor: "rgba(236,72,153,0.08)",
    icon: "🔱",
    minXP: 80000,
    maxXP: 119999,
    description: "Transcends all ranks. A force capable of protecting nations.",
  },
  {
    id: "shadow_monarch",
    name: "Shadow Monarch",
    title: "Arise.",
    color: "#c084fc",
    glowColor: "rgba(192,132,252,0.6)",
    bgColor: "rgba(192,132,252,0.08)",
    icon: "⚔️",
    minXP: 120000,
    maxXP: Infinity,
    description: "The king of all shadows. None stand above you.",
  },
];

// ============================================================
// RANK HELPER FUNCTIONS
// ============================================================
export const getRankByXP = (xp: number): RankInfo =>
  RANKS.find((r) => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];

export const getNextRank = (rank: RankInfo): RankInfo | null => {
  const idx = RANKS.findIndex((r) => r.id === rank.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
};

export const getXPProgress = (xp: number, rank: RankInfo): number => {
  if (rank.maxXP === Infinity) return 100;
  return Math.round(
    ((xp - rank.minXP) / (rank.maxXP - rank.minXP)) * 100
  );
};

// ============================================================
// SUBJECTS
// ============================================================
export const SUBJECTS: Subject[] = [
  {
    name: "Physics",
    icon: Atom,
    color: "#22d3ee",
    locked: false,
    questions: 48,
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    color: "#a78bfa",
    locked: false,
    questions: 36,
  },
  {
    name: "Math",
    icon: Sigma,
    color: "#34d399",
    locked: true,
    questions: 0,
  },
  {
    name: "Biology",
    icon: Dna,
    color: "#f87171",
    locked: true,
    questions: 0,
  },
];

// ============================================================
// DAILY QUESTS
// ============================================================
export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: 1,
    title: "Physics Mastery",
    desc: "Solve 20 MCQ",
    xp: 500,
    progress: 12,
    total: 20,
    icon: Atom,
    color: "#22d3ee",
    done: false,
  },
  {
    id: 2,
    title: "Speed Demon",
    desc: "Answer in <5s × 10",
    xp: 300,
    progress: 10,
    total: 10,
    icon: Clock,
    color: "#f59e0b",
    done: true,
  },
  {
    id: 3,
    title: "Combo Master",
    desc: "Get 5x combo streak",
    xp: 400,
    progress: 3,
    total: 5,
    icon: Flame,
    color: "#f87171",
    done: false,
  },
];

// ============================================================
// LEADERBOARD
// ============================================================
export const LEADERBOARD: LeaderboardEntry[] = [
  {
    name: "S-Rank_Slayer",
    score: "24,500",
    rank: "01",
    avatar: "https://i.pravatar.cc/150?u=slayer",
    rankInfo: RANKS[7],
  },
  {
    name: "ZeroOne",
    score: "22,100",
    rank: "02",
    avatar: "https://i.pravatar.cc/150?u=zeroone",
    rankInfo: RANKS[6],
  },
  {
    name: "GhostVibes",
    score: "19,850",
    rank: "03",
    avatar: "https://i.pravatar.cc/150?u=ghost",
    rankInfo: RANKS[5],
  },
  {
    name: "NightCrawler",
    score: "17,200",
    rank: "04",
    avatar: "https://i.pravatar.cc/150?u=night",
    rankInfo: RANKS[4],
  },
  {
    name: "PhantomX",
    score: "15,900",
    rank: "05",
    avatar: "https://i.pravatar.cc/150?u=phantom",
    rankInfo: RANKS[3],
  },
];

// ============================================================
// ACHIEVEMENTS
// ============================================================
export const ACHIEVEMENTS: Achievement[] = [
  {
    title: "First Blood",
    desc: "Complete first battle",
    icon: "🩸",
    unlocked: true,
    xp: 100,
  },
  {
    title: "Speed Freak",
    desc: "10 answers under 3s",
    icon: "⚡",
    unlocked: true,
    xp: 200,
  },
  {
    title: "Combo God",
    desc: "20x combo streak",
    icon: "🔥",
    unlocked: false,
    xp: 500,
  },
  {
    title: "Scholar",
    desc: "100 questions solved",
    icon: "📚",
    unlocked: false,
    xp: 1000,
  },
  {
    title: "Gate Opener",
    desc: "Reach B-Rank",
    icon: "🌀",
    unlocked: false,
    xp: 2000,
  },
  {
    title: "Shadow Army",
    desc: "7-day streak",
    icon: "👥",
    unlocked: false,
    xp: 800,
  },
];

// ============================================================
// STREAK DATA
// ============================================================
export const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
export const STREAK_DONE = [true, true, true, true, false, false, false];

// ============================================================
// MOCK USER STATS (replace with Firebase data in production)
// ============================================================
export const MOCK_STATS: UserStats = {
  xp: 15420,
  level: 47,
  accuracy: 88,
  speed: 94,
  iq: 145,
  logic: 91,
  focus: 78,
  streak: 4,
  totalBattles: 284,
  weeklyXP: 2340,
  plan: "free",
  joinDate: "January 2026",
  totalHoursStudied: 127,
  questionsAttempted: 1840,
  correctAnswers: 1619,
};

// ============================================================
// GLOBAL CSS STRING (shared across files via import)
// ============================================================
export const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #02010a; color: white;
    font-family: 'Outfit', sans-serif;
    overflow-x: hidden; scroll-behavior: smooth;
  }
  body {
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 0%, rgba(14,165,233,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,58,237,0.06) 0%, transparent 60%),
      linear-gradient(to bottom, #02010a, #050b14);
    min-height: 100vh;
  }
  body::before {
    content: ''; position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
    pointer-events: none; z-index: 1;
  }
  .font-logo  { font-family: 'Orbitron', sans-serif; }
  .font-bangla { font-family: 'Hind Siliguri', sans-serif; }

  .card {
    background: rgba(255,255,255,0.025);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.06); border-radius: 20px;
    transition: all 0.3s ease;
  }
  .card:hover { border-color: rgba(34,211,238,0.15); background: rgba(255,255,255,0.035); }

  @keyframes xpFill   { from { width: 0% } }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.3)}50%{box-shadow:0 0 40px rgba(14,165,233,0.6)} }
  @keyframes floatY   { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
  @keyframes shimmer  { 0%{background-position:-200% center}100%{background-position:200% center} }
  @keyframes streakPop{ 0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1} }
  @keyframes badgeBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  @keyframes questFill{ from{width:0%} }
  @keyframes statFill { from{width:0%} }
  @keyframes rankGlow { 0%,100%{opacity:0.6}50%{opacity:1} }
  @keyframes slideUp  { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
  @keyframes pulseRing{ 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
  @keyframes shadowFloat{ 0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-8px) rotate(1deg)} }

  .xp-bar        { animation: xpFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }
  .glow-pulse    { animation: glowPulse 2s ease-in-out infinite; }
  .float         { animation: floatY 3s ease-in-out infinite; }
  .badge-bounce  { animation: badgeBounce 1s ease infinite; }
  .quest-bar     { animation: questFill 1s ease forwards; }
  .stat-bar      { animation: statFill 1.5s cubic-bezier(0.4,0,0.2,1) forwards; }
  .streak-pip    { animation: streakPop 0.4s ease forwards; }
  .shadow-float  { animation: shadowFloat 4s ease-in-out infinite; }

  .shimmer-text {
    background: linear-gradient(90deg, #a855f7, #ec4899, #f59e0b, #a855f7);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }
  .rank-shimmer {
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 2s linear infinite;
  }

  .sub-btn {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 24px 16px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    cursor: pointer; transition: all 0.25s ease;
    position: relative; overflow: hidden;
  }
  .sub-btn:hover:not(.sub-locked) {
    border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); transform: translateY(-2px);
  }
  .sub-btn.sub-active {
    border-color: var(--sub-color) !important;
    background: rgba(var(--sub-rgb),0.1) !important;
    box-shadow: 0 8px 24px rgba(var(--sub-rgb),0.25) !important;
    transform: translateY(-3px) scale(1.02);
  }
  .sub-locked { opacity: 0.35; cursor: not-allowed; }

  .arena-btn {
    width: 100%; padding: 20px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; color: white;
    font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900;
    letter-spacing: 0.2em; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    transition: all 0.3s; position: relative; overflow: hidden;
  }
  .arena-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,165,233,0.4); }
  .arena-btn:active { transform: translateY(0) scale(0.98); }

  .nav-link {
    font-size: 11px; font-weight: 800; letter-spacing: 0.15em;
    text-transform: uppercase; opacity: 0.4; transition: opacity 0.2s;
    cursor: pointer; color: white; text-decoration: none;
  }
  .nav-link:hover { opacity: 0.8; }
  .nav-link.active { opacity: 1; color: #22d3ee; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.3); border-radius: 2px; }

  .rank-card-hover:hover { transform: scale(1.02); }
  .rank-card-hover { transition: transform 0.2s ease; }
`;