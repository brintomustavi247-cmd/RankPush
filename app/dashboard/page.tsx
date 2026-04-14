"use client";
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // db ইমপোর্ট করতে ভুলবেন না
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { debounce } from "@/lib/debounce-utils";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Zap, Trophy, Swords, Bell, Target,
  Brain, Play, Crown, Flame, LayoutDashboard,
  Atom, FlaskConical, Sigma, Dna, Quote,
  Sword, LogOut, X, CheckCircle, Lock,
  TrendingUp, Award, Sparkles,
  ChevronUp, BarChart2, Clock, Crosshair,
  Layers, Wifi, Timer, ChevronDown, User,
  Settings, Shield, Star, BookOpen, Zap as ZapIcon,
  Eye, EyeOff, Copy, ExternalLink, Edit3,
  Activity, Calendar, GitBranch, ArrowRight,
  ChevronRight, Medal, Moon, Sunrise, CheckCheck, BellOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { useXPNotifications, useBattleNotifications, useSessionNotifications, useRealtimeNotifications, relativeTime, NOTIF_CONFIG } from "@/lib/notification-utils";
import { initializeDefaultQuests, checkAndResetWeeklyStats, DEFAULT_QUESTS } from "@/lib/xp-utils";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { UserProfileModal } from "@/components/UserProfileModal";

// ============================================================
// SOLO LEVELING RANK SYSTEM — S → E (reversed, S is highest)
// ============================================================
type Plan = "free" | "pro";
type RankId = "e" | "d" | "c" | "b" | "a" | "s" | "national" | "shadow_monarch";

interface RankInfo {
  id: RankId;
  name: string;
  title: string;       // Solo Leveling flavor title
  color: string;
  glowColor: string;
  bgColor: string;
  icon: string;
  minXP: number;
  maxXP: number;
  description: string;
}

const RANKS: RankInfo[] = [
  {
    id: "e", name: "E-Rank", title: "Weakest Hunter",
    color: "#6b7280", glowColor: "rgba(107,114,128,0.4)", bgColor: "rgba(107,114,128,0.08)",
    icon: "🪨", minXP: 0, maxXP: 1999,
    description: "The starting point. Every Shadow Lord began here."
  },
  {
    id: "d", name: "D-Rank", title: "Awakened Hunter",
    color: "#b45309", glowColor: "rgba(180,83,9,0.4)", bgColor: "rgba(180,83,9,0.08)",
    icon: "🔰", minXP: 2000, maxXP: 5999,
    description: "Awakening confirmed. The system acknowledges your power."
  },
  {
    id: "c", name: "C-Rank", title: "Gate Raider",
    color: "#0ea5e9", glowColor: "rgba(14,165,233,0.4)", bgColor: "rgba(14,165,233,0.08)",
    icon: "🌀", minXP: 6000, maxXP: 13999,
    description: "You raid dungeons others fear. Gates tremble at your approach."
  },
  {
    id: "b", name: "B-Rank", title: "Elite Fighter",
    color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)", bgColor: "rgba(34,211,238,0.08)",
    icon: "⚡", minXP: 14000, maxXP: 27999,
    description: "Elite class. Guild leaders take notice of your strength."
  },
  {
    id: "a", name: "A-Rank", title: "Dungeon Breaker",
    color: "#a855f7", glowColor: "rgba(168,85,247,0.4)", bgColor: "rgba(168,85,247,0.08)",
    icon: "💜", minXP: 28000, maxXP: 49999,
    description: "Ranked among the nation's finest. Dungeons fall before you."
  },
  {
    id: "s", name: "S-Rank", title: "Sovereign Hunter",
    color: "#f59e0b", glowColor: "rgba(245,158,11,0.5)", bgColor: "rgba(245,158,11,0.08)",
    icon: "👑", minXP: 50000, maxXP: 79999,
    description: "The pinnacle of mankind. Only the chosen few reach this rank."
  },
  {
    id: "national", name: "National Level", title: "Absolute Monarch",
    color: "#ec4899", glowColor: "rgba(236,72,153,0.5)", bgColor: "rgba(236,72,153,0.08)",
    icon: "🔱", minXP: 80000, maxXP: 119999,
    description: "Transcends all ranks. A force capable of protecting nations."
  },
  {
    id: "shadow_monarch", name: "Shadow Monarch", title: "Arise.",
    color: "#c084fc", glowColor: "rgba(192,132,252,0.6)", bgColor: "rgba(192,132,252,0.08)",
    icon: "⚔️", minXP: 120000, maxXP: Infinity,
    description: "The king of all shadows. None stand above you."
  },
];

const getRankByXP = (xp: number): RankInfo =>
  RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];

const getNextRank = (rank: RankInfo): RankInfo | null => {
  const idx = RANKS.findIndex(r => r.id === rank.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
};

const getXPProgress = (xp: number, rank: RankInfo): number => {
  if (rank.maxXP === Infinity) return 100;
  return Math.round(((xp - rank.minXP) / (rank.maxXP - rank.minXP)) * 100);
};

// ============================================================
// CONSTANTS
// ============================================================
const SUBJECTS = [
  { name: "Physics",   icon: Atom,         color: "#22d3ee", locked: false, questions: 48  },
  { name: "Chemistry", icon: FlaskConical, color: "#a78bfa", locked: false, questions: 36  },
  { name: "Math",      icon: Sigma,        color: "#34d399", locked: false, questions: 24  },
  { name: "Biology",   icon: Dna,          color: "#f87171", locked: false, questions: 20  },
];

const DAILY_QUESTS = [
  { id: 1, title: "Physics Mastery",  desc: "Solve 20 MCQ",       xp: 500, progress: 12, total: 20, icon: Atom,     color: "#22d3ee", done: false },
  { id: 2, title: "Speed Demon",      desc: "Answer in <5s × 10", xp: 300, progress: 10, total: 10, icon: Clock,    color: "#f59e0b", done: true  },
  { id: 3, title: "Combo Master",     desc: "Get 5x combo streak", xp: 400, progress: 3,  total: 5,  icon: Flame,    color: "#f87171", done: false },
];


const ACHIEVEMENTS = [
  { title: "First Blood",  desc: "Complete first battle",  icon: "🩸", unlocked: true,  xp: 100  },
  { title: "Speed Freak",  desc: "10 answers under 3s",    icon: "⚡", unlocked: true,  xp: 200  },
  { title: "Combo God",    desc: "20x combo streak",       icon: "🔥", unlocked: false, xp: 500  },
  { title: "Scholar",      desc: "100 questions solved",   icon: "📚", unlocked: false, xp: 1000 },
  { title: "Gate Opener",  desc: "Reach B-Rank",           icon: "🌀", unlocked: false, xp: 2000 },
  { title: "Shadow Army",  desc: "7-day streak",           icon: "👥", unlocked: false, xp: 800  },
];


const MOCK_STATS = {
  xp: 15420, level: 47,
  accuracy: 88, speed: 94, iq: 145, logic: 91, focus: 78,
  streak: 4, totalBattles: 284, weeklyXP: 2340,
  plan: "free" as Plan,
  joinDate: "January 2026",
  totalHoursStudied: 127,
  questionsAttempted: 1840,
  correctAnswers: 1619,
};

// ============================================================
// GLOBAL STYLES — Performance Optimized
// ============================================================
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #02010a; color: white;
    font-family: 'Outfit', sans-serif;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  body {
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 0%, rgba(14,165,233,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,58,237,0.06) 0%, transparent 60%),
      linear-gradient(to bottom, #02010a, #050b14);
    min-height: 100vh;
  }

  /* Scanline - DESKTOP ONLY */
  @media (min-width: 1024px) {
    body::before {
      content: ''; position: fixed; inset: 0;
      background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
      pointer-events: none; z-index: 1;
    }
  }

  .font-logo  { font-family: 'Orbitron', sans-serif; }
  .font-bangla { font-family: 'Hind Siliguri', sans-serif; }

  /* CARD - Mobile: solid dark, Desktop: glassmorphism */
  .card {
    background: rgba(8, 10, 20, 0.92);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    transition: border-color 0.2s ease;
  }
  @media (min-width: 768px) {
    .card {
      background: rgba(255,255,255,0.028);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .card:hover {
      border-color: rgba(34,211,238,0.18);
      background: rgba(255,255,255,0.04);
    }
  }

  /* KEYFRAMES */
  @keyframes xpFill    { from { width: 0% } }
  @keyframes questFill { from { width: 0% } }
  @keyframes statFill  { from { width: 0% } }
  @keyframes streakPop { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes glowPulse  { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes badgeBounce{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  @keyframes shadowFloat{ 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-6px) rotate(1deg)} }
  @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }

  /* ONE-SHOT animations (mobile + desktop) */
  .xp-bar     { animation: xpFill    1.2s cubic-bezier(0.4,0,0.2,1) forwards; }
  .quest-bar  { animation: questFill 1s   ease forwards; }
  .stat-bar   { animation: statFill  1.5s cubic-bezier(0.4,0,0.2,1) forwards; }
  .streak-pip { animation: streakPop 0.3s ease forwards; }

  /* INFINITE animations - DESKTOP ONLY */
  @media (min-width: 768px) {
    .glow-pulse   { animation: glowPulse   3s ease-in-out infinite; }
    .float        { animation: floatY      6s ease-in-out infinite; }
    .badge-bounce { animation: badgeBounce 2s ease          infinite; }
    .shadow-float { animation: shadowFloat 6s ease-in-out infinite; }
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
  }
  @media (max-width: 767px) {
    .shimmer-text {
      background: linear-gradient(90deg, #a855f7, #ec4899, #f59e0b);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .rank-shimmer {
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .rank-card-hover:hover { transform: none; }
  }

  /* SUBJECT BUTTONS */
  .sub-btn {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 20px 12px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease;
    position: relative; overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  @media (min-width: 768px) {
    .sub-btn { padding: 24px 16px; }
    .sub-btn:hover:not(.sub-locked) {
      border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.06);
      transform: translateY(-2px);
    }
  }
  .sub-btn.sub-active {
    border-color: var(--sub-color) !important;
    background: rgba(var(--sub-rgb),0.1) !important;
    box-shadow: 0 6px 20px rgba(var(--sub-rgb),0.22) !important;
  }
  .sub-locked { opacity: 0.35; cursor: not-allowed; }

  /* ARENA BUTTON */
  .arena-btn {
    width: 100%; padding: 18px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    border: 1px solid rgba(255,255,255,0.18); border-radius: 16px; color: white;
    font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 900;
    letter-spacing: 0.15em; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .arena-btn:active { transform: scale(0.97); }
  @media (min-width: 768px) {
    .arena-btn { padding: 20px; font-size: 18px; letter-spacing: 0.2em; }
    .arena-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,165,233,0.35); }
  }

  .nav-link {
    font-size: 11px; font-weight: 800; letter-spacing: 0.15em;
    text-transform: uppercase; opacity: 0.4; transition: opacity 0.15s;
    cursor: pointer; color: white; text-decoration: none;
  }
  .nav-link:hover { opacity: 0.8; }
  .nav-link.active { opacity: 1; color: #22d3ee; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.3); border-radius: 2px; }

  .rank-card-hover { transition: transform 0.15s ease; }
  .rank-card-hover:hover { transform: scale(1.02); }
`;



// ============================================================
// RANK BADGE SVG ICONS — Gorgeous LoL-style emblems
// ============================================================
function RankBadgeSVG({ rankId, size = 24 }: { rankId: string; size?: number }) {
  const uid = `pg-${rankId}`;
  const s = size;

  const badges: Record<string, React.ReactElement> = {
    e: (
      <svg width={s} height={s} viewBox="0 0 40 44" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b5651d"/><stop offset="100%" stopColor="#5c2d0a"/>
          </linearGradient>
          <linearGradient id={`${uid}-gem`} x1="14" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0a862"/><stop offset="50%" stopColor="#cd7f32"/><stop offset="100%" stopColor="#7b3f00"/>
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8913a" stopOpacity="0.5"/><stop offset="100%" stopColor="#7b3f00" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-bg)`} stroke="#7b3f00" strokeWidth="1.5"/>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-shine)`}/>
        <line x1="4" y1="16" x2="36" y2="16" stroke="rgba(255,180,80,0.25)" strokeWidth="0.8"/>
        <polygon points="20,12 27,20 20,29 13,20" fill={`url(#${uid}-gem)`} stroke="#e8913a" strokeWidth="1"/>
        <polygon points="20,15 24,20 20,26 16,20" fill="rgba(255,200,120,0.5)"/>
        <circle cx="20" cy="7" r="2" fill="#b5651d" stroke="#e8913a" strokeWidth="0.8"/>
        <circle cx="20" cy="7" r="1" fill="#f0a862"/>
      </svg>
    ),
    d: (
      <svg width={s} height={s} viewBox="0 0 40 44" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4d8e0"/><stop offset="100%" stopColor="#6b7280"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#ffffff"/><stop offset="45%" stopColor="#c8cdd6"/><stop offset="100%" stopColor="#8a9299"/>
          </radialGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/><stop offset="100%" stopColor="#6b7280" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-bg)`} stroke="#9ca3af" strokeWidth="1.5"/>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-shine)`}/>
        <path d="M20 5 L33 10 L33 25 Q33 35 20 40 Q7 35 7 25 L7 10 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
        <polygon points="20,12 22,17 27,16 23,20 27,24 22,23 20,28 18,23 13,24 17,20 13,16 18,17" fill={`url(#${uid}-gem)`} stroke="#d4d8e0" strokeWidth="0.7"/>
        <circle cx="20" cy="20" r="2.5" fill="rgba(255,255,255,0.6)"/>
        <circle cx="20" cy="7" r="2.5" fill="#9ca3af" stroke="#d4d8e0" strokeWidth="0.8"/>
        <circle cx="20" cy="7" r="1.2" fill="#ffffff"/>
      </svg>
    ),
    c: (
      <svg width={s} height={s} viewBox="0 0 40 44" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4a017"/><stop offset="50%" stopColor="#b8860b"/><stop offset="100%" stopColor="#7a5800"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#fff9e0"/><stop offset="40%" stopColor="#ffd700"/><stop offset="100%" stopColor="#a07800"/>
          </radialGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffec7a" stopOpacity="0.45"/><stop offset="100%" stopColor="#7a5800" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-bg)`} stroke="#a07800" strokeWidth="1.5"/>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z" fill={`url(#${uid}-shine)`}/>
        <line x1="4" y1="15" x2="36" y2="15" stroke="rgba(255,220,60,0.3)" strokeWidth="0.9"/>
        <path d="M20 5 L33 10 L33 25 Q33 36 20 41 Q7 36 7 25 L7 10 Z" fill="none" stroke="rgba(255,215,0,0.25)" strokeWidth="0.8"/>
        <polygon points="20,11 28,19 20,28 12,19" fill={`url(#${uid}-gem)`} stroke="#ffd700" strokeWidth="1"/>
        <polygon points="20,14 25,19 20,25 15,19" fill="rgba(255,255,220,0.55)"/>
        <circle cx="10" cy="14" r="1.8" fill="#ffd700" opacity="0.65"/>
        <circle cx="30" cy="14" r="1.8" fill="#ffd700" opacity="0.65"/>
        <polygon points="20,2 22.5,7 20,6 17.5,7" fill="#ffd700"/>
      </svg>
    ),
    b: (
      <svg width={s} height={s} viewBox="0 0 46 44" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="23" y1="0" x2="23" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e2f6f9"/><stop offset="100%" stopColor="#7ab8c4"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#f0fbff"/><stop offset="45%" stopColor="#22d3ee"/><stop offset="100%" stopColor="#0891b2"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a5e0ea"/><stop offset="100%" stopColor="#5baabd"/>
          </linearGradient>
        </defs>
        <path d="M3 22 Q1 15 5 10 Q8 15 10 22 Q8 27 5 28 Q2 27 3 22Z" fill={`url(#${uid}-wing)`} stroke="#7ab8c4" strokeWidth="0.8" opacity="0.9"/>
        <path d="M3 18 Q6 15 8 13" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M43 22 Q45 15 41 10 Q38 15 36 22 Q38 27 41 28 Q44 27 43 22Z" fill={`url(#${uid}-wing)`} stroke="#7ab8c4" strokeWidth="0.8" opacity="0.9"/>
        <path d="M43 18 Q40 15 38 13" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M23 2 L38 8 L38 26 Q38 37 23 43 Q8 37 8 26 L8 8 Z" fill={`url(#${uid}-bg)`} stroke="#7ab8c4" strokeWidth="1.5"/>
        <path d="M23 5 L35 10 L35 25 Q35 35 23 40 Q11 35 11 25 L11 10 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        <polygon points="23,11 31,19 23,28 15,19" fill={`url(#${uid}-gem)`} stroke="#7eeaf8" strokeWidth="1"/>
        <polygon points="23,14 28,19 23,25 18,19" fill="rgba(240,251,255,0.6)"/>
        <line x1="23" y1="11" x2="23" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
        <line x1="15" y1="19" x2="31" y2="19" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
        <circle cx="23" cy="6" r="2.2" fill="#7ab8c4" stroke="#a5e0ea" strokeWidth="0.8"/>
      </svg>
    ),
    a: (
      <svg width={s} height={s} viewBox="0 0 46 46" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="23" y1="0" x2="23" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333ea"/><stop offset="60%" stopColor="#6d28d9"/><stop offset="100%" stopColor="#3b0764"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#f3e8ff"/><stop offset="40%" stopColor="#c084fc"/><stop offset="100%" stopColor="#6d28d9"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7"/><stop offset="100%" stopColor="#5b21b6"/>
          </linearGradient>
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M1 24 Q0 14 6 8 Q10 16 11 24 Q9 30 5 32 Q1 30 1 24Z" fill={`url(#${uid}-wing)`} opacity="0.9"/>
        <path d="M2 18 Q6 14 9 11" stroke="#d8b4fe" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <path d="M45 24 Q46 14 40 8 Q36 16 35 24 Q37 30 41 32 Q45 30 45 24Z" fill={`url(#${uid}-wing)`} opacity="0.9"/>
        <path d="M44 18 Q40 14 37 11" stroke="#d8b4fe" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <polygon points="23,2 39,20 23,44 7,20" fill={`url(#${uid}-bg)`} stroke="#a855f7" strokeWidth="1.5"/>
        <polygon points="23,6 35,20 23,38 11,20" fill="none" stroke="rgba(192,132,252,0.3)" strokeWidth="0.9"/>
        <polygon points="23,2 26,8 23,7 20,8" fill="#c084fc"/>
        <polygon points="23,12 32,21 23,31 14,21" fill={`url(#${uid}-gem)`} stroke="#d8b4fe" strokeWidth="1" filter={`url(#${uid}-glow)`}/>
        <polygon points="23,16 28,21 23,27 18,21" fill="rgba(255,255,255,0.5)"/>
      </svg>
    ),
    s: (
      <svg width={s} height={s} viewBox="0 0 48 50" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="24" y1="0" x2="24" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24"/><stop offset="45%" stopColor="#d97706"/><stop offset="100%" stopColor="#78350f"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#fefce8"/><stop offset="40%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#b45309"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#92400e"/>
          </linearGradient>
          <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M0 26 Q-1 14 6 8 Q11 17 12 26 Q10 32 5 34 Q0 31 0 26Z" fill={`url(#${uid}-wing)`} opacity="0.92"/>
        <path d="M1 20 Q6 16 9 13" stroke="#fde68a" strokeWidth="0.9" fill="none"/>
        <path d="M0 26 Q5 23 9 20" stroke="#fde68a" strokeWidth="0.7" fill="none"/>
        <path d="M48 26 Q49 14 42 8 Q37 17 36 26 Q38 32 43 34 Q48 31 48 26Z" fill={`url(#${uid}-wing)`} opacity="0.92"/>
        <path d="M47 20 Q42 16 39 13" stroke="#fde68a" strokeWidth="0.9" fill="none"/>
        <path d="M48 26 Q43 23 39 20" stroke="#fde68a" strokeWidth="0.7" fill="none"/>
        <path d="M14 7 L24 2 L34 7 L31 11 L27.5 9 L24 11 L20.5 9 L17 11 Z" fill={`url(#${uid}-wing)`} stroke="#fde68a" strokeWidth="0.9"/>
        <circle cx="24" cy="3" r="2.5" fill="#fcd34d" filter={`url(#${uid}-glow)`}/>
        <circle cx="24" cy="3" r="1.2" fill="#ffffff"/>
        <circle cx="16" cy="8" r="1.3" fill="#fbbf24"/>
        <circle cx="32" cy="8" r="1.3" fill="#fbbf24"/>
        <path d="M24 10 L40 17 L40 31 Q40 43 24 49 Q8 43 8 31 L8 17 Z" fill={`url(#${uid}-bg)`} stroke="#fbbf24" strokeWidth="1.8"/>
        <path d="M24 14 L36 20 L36 30 Q36 41 24 46 Q12 41 12 30 L12 20 Z" fill="none" stroke="rgba(253,230,138,0.35)" strokeWidth="1"/>
        <polygon points="24,18 33,26 24,36 15,26" fill={`url(#${uid}-gem)`} stroke="#fde68a" strokeWidth="1.2" filter={`url(#${uid}-glow)`}/>
        <polygon points="24,22 29,26 24,32 19,26" fill="rgba(255,255,220,0.6)"/>
        <polygon points="24,49 27,44 24,46 21,44" fill="#fcd34d"/>
      </svg>
    ),
    national: (
      <svg width={s} height={s} viewBox="0 0 50 52" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="25" y1="0" x2="25" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f472b6"/><stop offset="45%" stopColor="#db2777"/><stop offset="100%" stopColor="#831843"/>
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor="#d97706"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#fce7f3"/><stop offset="40%" stopColor="#f9a8d4"/><stop offset="100%" stopColor="#be185d"/>
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M0 28 Q-1 15 7 8 Q12 18 13 28 L11 37 Q5 35 0 28Z" fill={`url(#${uid}-gold)`} opacity="0.95"/>
        <path d="M1 20 Q7 16 10 13" stroke="#fef9c3" strokeWidth="1" fill="none"/>
        <path d="M0 27 Q6 23 10 20" stroke="#fef9c3" strokeWidth="0.8" fill="none"/>
        <path d="M50 28 Q51 15 43 8 Q38 18 37 28 L39 37 Q45 35 50 28Z" fill={`url(#${uid}-gold)`} opacity="0.95"/>
        <path d="M49 20 Q43 16 40 13" stroke="#fef9c3" strokeWidth="1" fill="none"/>
        <path d="M50 27 Q44 23 40 20" stroke="#fef9c3" strokeWidth="0.8" fill="none"/>
        <path d="M13 7 L25 2 L37 7 L34 12 L30.5 10 L25 13 L19.5 10 L16 12 Z" fill={`url(#${uid}-gold)`} stroke="#fef9c3" strokeWidth="1"/>
        <circle cx="25" cy="3.5" r="3" fill="#f472b6" filter={`url(#${uid}-glow)`}/>
        <circle cx="25" cy="3.5" r="1.5" fill="#fce7f3"/>
        <circle cx="17" cy="9" r="1.8" fill="#fbbf24"/>
        <circle cx="33" cy="9" r="1.8" fill="#fbbf24"/>
        <path d="M25 11 L42 18 L42 33 Q42 45 25 51 Q8 45 8 33 L8 18 Z" fill={`url(#${uid}-bg)`} stroke={`url(#${uid}-gold)`} strokeWidth="2"/>
        <path d="M25 15 L38 21 L38 32 Q38 43 25 48 Q12 43 12 32 L12 21 Z" fill="none" stroke="rgba(253,230,138,0.4)" strokeWidth="1.2"/>
        <polygon points="25,20 34,29 25,40 16,29" fill={`url(#${uid}-gem)`} stroke="#f9a8d4" strokeWidth="1.3" filter={`url(#${uid}-glow)`}/>
        <polygon points="25,24 30,29 25,35 20,29" fill="rgba(255,255,255,0.55)"/>
        <polygon points="25,51 28,46 25,48 22,46" fill="#fde68a"/>
      </svg>
    ),
    shadow_monarch: (
      <svg width={s} height={s} viewBox="0 0 50 54" fill="none">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="25" y1="0" x2="25" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed"/><stop offset="50%" stopColor="#4c1d95"/><stop offset="100%" stopColor="#1e0a3c"/>
          </linearGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d28d9"/><stop offset="100%" stopColor="#1e0a3c"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#faf5ff"/><stop offset="35%" stopColor="#c084fc"/><stop offset="100%" stopColor="#5b21b6"/>
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M0 30 Q-1 15 8 7 Q14 19 15 30 Q13 40 6 43 Q1 38 0 30Z" fill={`url(#${uid}-wing)`} opacity="0.95"/>
        <path d="M1 22 Q8 16 12 12" stroke="#a855f7" strokeWidth="0.9" fill="none" opacity="0.8"/>
        <path d="M0 30 Q7 25 12 21" stroke="#a855f7" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M50 30 Q51 15 42 7 Q36 19 35 30 Q37 40 44 43 Q49 38 50 30Z" fill={`url(#${uid}-wing)`} opacity="0.95"/>
        <path d="M49 22 Q42 16 38 12" stroke="#a855f7" strokeWidth="0.9" fill="none" opacity="0.8"/>
        <path d="M50 30 Q43 25 38 21" stroke="#a855f7" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M13 9 L25 3 L37 9" stroke="#c084fc" strokeWidth="1.8" fill="none"/>
        <line x1="25" y1="3" x2="25" y2="10" stroke="#c084fc" strokeWidth="2.2"/>
        <line x1="17" y1="6" x2="19" y2="10" stroke="#c084fc" strokeWidth="1.2" opacity="0.8"/>
        <line x1="33" y1="6" x2="31" y2="10" stroke="#c084fc" strokeWidth="1.2" opacity="0.8"/>
        <circle cx="25" cy="3" r="3.5" fill="#4c1d95" stroke="#c084fc" strokeWidth="1.2" filter={`url(#${uid}-soft)`}/>
        <circle cx="25" cy="3" r="2" fill="#7c3aed" filter={`url(#${uid}-glow)`}/>
        <circle cx="25" cy="3" r="1" fill="#f3e8ff"/>
        <path d="M25 9 L42 17 L42 33 Q42 46 25 54 Q8 46 8 33 L8 17 Z" fill={`url(#${uid}-bg)`} stroke="#8b5cf6" strokeWidth="2"/>
        <path d="M25 13 L38 20 L38 32 Q38 44 25 50 Q12 44 12 32 L12 20 Z" fill="none" stroke="rgba(192,132,252,0.25)" strokeWidth="1.2"/>
        <polygon points="25,19 36,30 25,42 14,30" fill={`url(#${uid}-gem)`} stroke="#c084fc" strokeWidth="1.5" filter={`url(#${uid}-glow)`}/>
        <polygon points="25,23 32,30 25,38 18,30" fill="rgba(255,255,255,0.4)"/>
        <circle cx="19" cy="22" r="1.2" fill="#c084fc" opacity="0.6" filter={`url(#${uid}-soft)`}/>
        <circle cx="31" cy="38" r="1" fill="#c084fc" opacity="0.5" filter={`url(#${uid}-soft)`}/>
        <circle cx="18" cy="36" r="0.8" fill="#c084fc" opacity="0.7" filter={`url(#${uid}-soft)`}/>
        <polygon points="25,54 28.5,48 25,51 21.5,48" fill="#8b5cf6"/>
      </svg>
    ),
  };

  return badges[rankId] ?? (
    <svg width={s} height={s} viewBox="0 0 40 44" fill="none">
      <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    </svg>
  );
}

// ============================================================
// RANK BADGE COMPONENT
// ============================================================
function RankBadge({ rank, size = "md" }: { rank: RankInfo; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { px: "6px 10px",  fs: 9,  img: 18 },
    md: { px: "8px 14px",  fs: 11, img: 24 },
    lg: { px: "12px 20px", fs: 14, img: 32 },
  };
  const s = sizes[size];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: s.px, borderRadius: 30,
      background: rank.bgColor, border: `1px solid ${rank.color}44`,
      boxShadow: `0 0 16px ${rank.glowColor}`,
    }}>
      <RankBadgeSVG rankId={rank.id} size={s.img} />
      <div>
        <p style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: s.fs, fontWeight: 900,
          letterSpacing: "0.12em", color: rank.color, lineHeight: 1,
        }}>{rank.name}</p>
        {size === "lg" && (
          <p style={{ fontSize: 10, color: `${rank.color}99`, marginTop: 2, letterSpacing: "0.06em" }}>{rank.title}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// RANK PROGRESSION MODAL
// ============================================================
function RankModal({ onClose, currentXP }: { onClose: () => void; currentXP: number }) {
  const currentRank = getRankByXP(currentXP);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: "#080613", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, maxWidth: 520, width: "100%", padding: 28, maxHeight: "85vh", overflowY: "auto", position: "relative" }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}>
          <X size={18} />
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "#22d3ee", marginBottom: 8 }}>SYSTEM · RANK PROGRESSION</p>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: "0.1em" }}>Hunter Rank System</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RANKS.map((r, i) => {
            const isCurrent = r.id === currentRank.id;
            const isUnlocked = currentXP >= r.minXP;
            return (
              <div key={r.id} className="rank-card-hover" style={{
                padding: "14px 18px", borderRadius: 14,
                background: isCurrent ? r.bgColor : "rgba(255,255,255,0.02)",
                border: isCurrent ? `1px solid ${r.color}66` : "1px solid rgba(255,255,255,0.05)",
                opacity: isUnlocked ? 1 : 0.45,
                boxShadow: isCurrent ? `0 0 20px ${r.glowColor}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RankBadgeSVG rankId={r.id} size={30} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900, color: r.color, letterSpacing: "0.1em" }}>{r.name}</p>
                      <p style={{ fontSize: 10, color: `${r.color}88`, fontStyle: "italic" }}>{r.title}</p>
                      {isCurrent && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: r.bgColor, border: `1px solid ${r.color}44`, color: r.color, fontWeight: 800, letterSpacing: "0.06em" }}>CURRENT</span>}
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{r.description}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
                      {r.maxXP === Infinity ? `${r.minXP.toLocaleString()}+` : `${r.minXP.toLocaleString()} – ${r.maxXP.toLocaleString()}`}
                    </p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>XP</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// PROFILE MODAL — Professional Level
// ============================================================
function ProfileModal({ onClose, user, stats }: { onClose: () => void; user: any; stats: typeof MOCK_STATS }) {
  const rank = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct = getXPProgress(stats.xp, rank);
  const [activeTab, setActiveTab] = useState<"overview"|"stats"|"achievements">("overview");

  const tabStyle = (t: string) => ({
    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
    fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 900,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    background: activeTab === t ? "rgba(34,211,238,0.1)" : "transparent",
    border: activeTab === t ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
    color: activeTab === t ? "#22d3ee" : "rgba(255,255,255,0.3)",
    transition: "all 0.2s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: "#06040f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, maxWidth: 560, width: "100%", overflow: "hidden", maxHeight: "90vh", overflowY: "auto", position: "relative" }}
      >
        {/* Profile Header BG */}
        <div style={{ height: 120, background: `linear-gradient(135deg, ${rank.bgColor}, rgba(0,0,0,0))`, borderBottom: `1px solid ${rank.color}22`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: rank.color, opacity: 0.06, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: 8, right: 16, fontFamily: "'Orbitron', sans-serif", fontSize: 48, fontWeight: 900, opacity: 0.06, letterSpacing: "-2px" }}>{rank.name.toUpperCase()}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "0 24px 28px", marginTop: -48 }}>
          {/* Avatar Row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", border: `3px solid ${rank.color}`, boxShadow: `0 0 24px ${rank.glowColor}`, overflow: "hidden" }}>
                <img src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "default"}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
              </div>
              <div style={{ position: "absolute", bottom: 0, right: -4, background: `linear-gradient(135deg, ${rank.color}, ${rank.color}bb)`, borderRadius: 8, padding: "3px 7px", fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 900, border: "2px solid #06040f" }}>
                LVL {stats.level}
              </div>
            </div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 6 }}>
                {user?.displayName || "CYBER HUNTER"}
              </h2>
              <RankBadge rank={rank} size="sm" />
            </div>
          </div>

          {/* Bio */}
          {(stats as any).bio && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic" }}>
                "{(stats as any).bio}"
              </p>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, color: rank.color }}>{stats.xp.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>XP</span>
              </div>
              {nextRank && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>NEXT RANK</p>
                  <p style={{ fontSize: 11, fontWeight: 800, color: nextRank.color, fontFamily: "'Orbitron', sans-serif" }}>{nextRank.name}</p>
                </div>
              )}
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div className="xp-bar" style={{ height: "100%", width: `${xpPct}%`, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}bb)`, borderRadius: 3, boxShadow: `0 0 8px ${rank.glowColor}` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{xpPct}% to {nextRank?.name || "MAX"}</span>
              {nextRank && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{(nextRank.minXP - stats.xp).toLocaleString()} XP needed</span>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 18 }}>
            {(["overview","stats","achievements"] as const).map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { l: "Member since", v: stats.joinDate, icon: Calendar, c: "#22d3ee" },
                  { l: "Total battles", v: stats.totalBattles, icon: Swords, c: "#f59e0b" },
                  { l: "Hours studied", v: `${stats.totalHoursStudied}h`, icon: Clock, c: "#a855f7" },
                  { l: "Daily streak", v: `${stats.streak} days 🔥`, icon: Flame, c: "#f97316" },
                ].map(item => (
                  <div key={item.l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <item.icon size={16} color={item.c} style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.l}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "white", marginTop: 2 }}>{item.v}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Rank journey */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>Rank Journey</p>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  {RANKS.map((r, i) => {
                    const unlocked = stats.xp >= r.minXP;
                    const isCurrent = r.id === getRankByXP(stats.xp).id;
                    return (
                      <React.Fragment key={r.id}>
                        <div title={r.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
                          <div style={{
                            width: isCurrent ? 36 : 26, height: isCurrent ? 36 : 26,
                            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: unlocked ? r.bgColor : "rgba(255,255,255,0.04)",
                            border: isCurrent ? `2px solid ${r.color}` : unlocked ? `1px solid ${r.color}55` : "1px solid rgba(255,255,255,0.08)",
                            boxShadow: isCurrent ? `0 0 14px ${r.glowColor}` : "none",
                            transition: "all 0.3s", overflow: "hidden",
                            opacity: unlocked ? 1 : 0.35,
                          }}><RankBadgeSVG rankId={r.id} size={isCurrent ? 26 : 18} /></div>
                          {isCurrent && <div style={{ width: 4, height: 4, borderRadius: "50%", background: r.color }} />}
                        </div>
                        {i < RANKS.length - 1 && (
                          <div style={{ height: 1, flex: 1, background: stats.xp >= RANKS[i+1].minXP ? `linear-gradient(90deg, ${r.color}66, ${RANKS[i+1].color}66)` : "rgba(255,255,255,0.06)", minWidth: 4 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Stats */}
          {activeTab === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { l: "Questions attempted", v: stats.questionsAttempted.toLocaleString(), c: "#22d3ee" },
                  { l: "Correct answers",      v: stats.correctAnswers.toLocaleString(),    c: "#34d399" },
                  { l: "Accuracy",             v: `${stats.accuracy}%`,                     c: "#f59e0b" },
                  { l: "Total XP earned",      v: stats.xp.toLocaleString(),                c: "#a855f7" },
                ].map(s => (
                  <div key={s.l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                    <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {/* Attributes */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px" }}>
                <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 14 }}>Neural Attributes</p>
                {[
                  { l: "Accuracy", v: stats.accuracy, d: `${stats.accuracy}%`, c: "#22d3ee" },
                  { l: "Speed",    v: stats.speed,    d: `${stats.speed}%`,    c: "#0ea5e9" },
                  { l: "Logic",    v: stats.logic,    d: `${stats.logic}%`,    c: "#34d399" },
                  { l: "Focus",    v: stats.focus,    d: `${stats.focus}%`,    c: "#a855f7" },
                ].map(a => (
                  <div key={a.l} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{a.l}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: a.c }}>{a.d}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div className="stat-bar" style={{ height: "100%", width: `${a.v}%`, background: a.c, borderRadius: 2, boxShadow: `0 0 6px ${a.c}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Achievements */}
          {activeTab === "achievements" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.title} style={{
                  borderRadius: 14, padding: "14px 12px", textAlign: "center",
                  background: a.unlocked ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${a.unlocked ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}`,
                  opacity: a.unlocked ? 1 : 0.45,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: a.unlocked ? "#22d3ee" : "white", marginBottom: 2 }}>{a.title}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{a.desc}</p>
                  <p style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b" }}>+{a.xp} XP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// PRO UPGRADE MODAL
// ============================================================
function ProUpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: "linear-gradient(135deg, #0a0f1e, #111827)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 24, maxWidth: 420, width: "100%", padding: 32, position: "relative", boxShadow: "0 0 60px rgba(168,85,247,0.2)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={18} /></button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, color: "#a855f7", marginBottom: 8 }}>UPGRADE TO PRO</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Unlock your full potential</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {["Unlimited questions — all subjects","S-Rank & above unlocked","Rival Battle System (1v1 real-time)","Boss Fight mode","Detailed analytics & heatmaps","Unlimited power-ups"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={16} color="#a855f7" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "14px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 12, color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>৳১৯৯/month</button>
          <button style={{ flex: 1, padding: "14px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, color: "#a855f7", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>৳১৪৯৯/year</button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 12 }}>bKash • Nagad • Card accepted</p>
      </motion.div>
    </div>
  );
}

// ============================================================
// RIVAL MODAL
// ============================================================
function RivalModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = "https://rank-push.vercel.app/rival/abc123";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: "linear-gradient(135deg, #0a0f1e, #111827)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 24, maxWidth: 400, width: "100%", padding: 32, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={18} /></button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, color: "#ef4444", marginBottom: 8 }}>RIVAL BATTLE</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Challenge a friend to 1v1 MCQ battle</p>
        </div>
        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, wordBreak: "break-all", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{link}</div>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ width: "100%", padding: "14px 0", background: copied ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #dc2626, #ef4444)", border: copied ? "1px solid #22c55e" : "none", borderRadius: 12, color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>
          {copied ? "✓ Copied!" : "Copy Battle Link"}
        </button>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 12 }}>PRO feature — Share via WhatsApp</p>
      </motion.div>
    </div>
  );
}

// Leaderboard entry shape used inside the dashboard Firebase listener
interface DashboardLeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  avatar: string;
  rankInfo: RankInfo;
  isCurrentUser: boolean;
  score: string;
  rank: string;
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function RankPushDashboard() {
  const [selectedSub, setSelectedSub]       = useState("Physics");
  const [user, setUser]                     = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading]   = useState(true);
  const [showProModal, setShowProModal]     = useState(false);
  const [showRivalModal, setShowRivalModal] = useState(false);
  const [showRankModal, setShowRankModal]   = useState(false);
  const [showProfile, setShowProfile]       = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [showNotif, setShowNotif]           = useState(false);
  const [isMobileMenuOpen, setMobileMenu]   = useState(false);
  const [animXP, setAnimXP]                 = useState(0);
  
  // 🔥 State
  const [stats, setStats]                         = useState<any>(MOCK_STATS);
  const [liveLeaderboard, setLiveLeaderboard]      = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading]= useState(true);
  const [onlineCount, setOnlineCount]              = useState(3892);
  const [liveQuests, setLiveQuests]                = useState<any[]>([]);
  
  const router = useRouter();

  // Memoized rank computations — no re-run unless xp changes
  const rank     = useMemo(() => getRankByXP(stats.xp),        [stats.xp]);
  const nextRank = useMemo(() => getNextRank(rank),             [rank]);
  const xpPct    = useMemo(() => getXPProgress(stats.xp, rank),[stats.xp, rank]);

  // Real streak calculation
  const { streakDays, streakDone } = useMemo(() => {
    const days = ["M","T","W","T","F","S","S"];
    const done = Array(7).fill(false);
    const streak = stats.streak || 0;
    
    // Fill backwards from today based on streak count (cap at 7 for UI)
    const todayIdx = (new Date().getDay() + 6) % 7;
    const count = Math.min(streak, 7);
    
    const lastStudyTimestamp = stats.lastStudyDate?.toMillis?.() || 0;
    const isToday = new Date().toDateString() === new Date(lastStudyTimestamp).toDateString();
    
    // If not studied today, the streak boxes end at yesterday
    const endIdx = isToday ? todayIdx : (todayIdx - 1 + 7) % 7;
    
    for (let i = 0; i < count; i++) {
        const idx = (endIdx - i + 7) % 7;
        done[idx] = true;
    }
    
    return { streakDays: days, streakDone: done };
  }, [stats.streak, stats.lastStudyDate]);

  // 🔥 Firebase Real-Time Listeners (User + Leaderboard + Online Count + Quests)
  useEffect(() => {
    // Track cleanup functions for staggered listeners
    const staggeredTimers: ReturnType<typeof setTimeout>[] = [];
    let unsubUser:        (() => void) | null = null;
    let unsubLeaderboard: (() => void) | null = null;
    let unsubOnline:      (() => void) | null = null;
    let unsubQuests:      (() => void) | null = null;

    // Snapshot key and debounced setter are created once per effect mount.
    // Placing them here (outside onAuthStateChanged) ensures a single, stable
    // debounce instance that is NOT reset on every auth-state emission.
    let prevLbKey = "";
    const debouncedSetLeaderboard = debounce((combined: DashboardLeaderboardEntry[]) => {
      setLiveLeaderboard(combined);
      setLeaderboardLoading(false);
    }, 300);

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setIsAuthLoading(false);
      if (!u) { router.push("/"); return; }
      setUser(u);

      // ── Weekly reset check on load ──
      checkAndResetWeeklyStats(u.uid);
      // ── Initialize default quests if not present ──
      initializeDefaultQuests(u.uid);

      // Clean up any previous subscriptions before setting up new ones
      // (guards against onAuthStateChanged firing multiple times)
      unsubUser?.();
      unsubLeaderboard?.();
      unsubOnline?.();
      unsubQuests?.();
      staggeredTimers.forEach(clearTimeout);
      staggeredTimers.length = 0;

      // ── ① ইউজার ডেটা (immediate) ──
      const userRef = doc(db, "users", u.uid);
      unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setStats({ ...MOCK_STATS, ...snap.data() } as any);
        } else {
          const initialData = {
            ...MOCK_STATS, xp: 0, level: 1,
            displayName: u.displayName || "Hunter",
            photoURL: u.photoURL || "",
            weeklyXP: 0, weeklyBattles: 0,
            weeklyCorrect: 0, weeklyRankUps: 0,
          };
          setDoc(userRef, initialData);
          setStats(initialData);
        }
      }, (err) => {
        console.error("[Dashboard] User snapshot error:", err.code, err.message);
      });

      // ── ② লিডারবোর্ড — staggered by 150 ms ──
      const t1 = setTimeout(() => {
        const lbQuery = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
        unsubLeaderboard = onSnapshot(lbQuery, (snap) => {
          const realUsers = snap.empty ? [] : snap.docs.map(d => {
            const data = d.data();
            return {
              id:            d.id,
              name:          data.displayName || data.name || "Hunter",
              xp:            data.xp || 0,
              avatar:        data.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${d.id}`,
              rankInfo:      getRankByXP(data.xp || 0),
              isCurrentUser: d.id === u.uid,
            };
          });

          const combined: DashboardLeaderboardEntry[] = realUsers
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 5)
            .map((p, i) => ({
               ...p,
               score: p.xp.toLocaleString(),
               rank: String(i + 1).padStart(2, "0")
            }));

          // Skip update if rankings have not changed (uid + xp key comparison)
          const lbKey = combined.map(p => `${p.id}:${p.xp}`).join("|");
          if (lbKey === prevLbKey) {
            setLeaderboardLoading(false);
            return;
          }
          prevLbKey = lbKey;

          debouncedSetLeaderboard(combined);
        }, () => {
          setLeaderboardLoading(false);
        });
      }, 150);
      staggeredTimers.push(t1);

      // ── ③ Online Count — staggered by 300 ms ──
      const t2 = setTimeout(() => {
        const metaRef = doc(db, "meta", "online");
        unsubOnline = onSnapshot(metaRef, (snap) => {
          if (snap.exists() && snap.data().count) setOnlineCount(snap.data().count);
        }, () => {});
      }, 300);
      staggeredTimers.push(t2);

      // ── ④ Quest real-time listener — staggered by 450 ms ──
      const t3 = setTimeout(() => {
        const questRef = collection(db, "users", u.uid, "quests");
        unsubQuests = onSnapshot(questRef, (snap) => {
          if (!snap.empty) {
            const iconMap: Record<string, any> = { atom: Atom, clock: Clock, flame: Flame };
            const quests = snap.docs.map(d => ({
              ...d.data(),
              id: d.id,
              icon: iconMap[d.data().iconName] || Atom,
            }));
            setLiveQuests(quests);
          }
        }, () => {});
      }, 450);
      staggeredTimers.push(t3);
    });

    return () => {
      unsubAuth();
      staggeredTimers.forEach(clearTimeout);
      unsubUser?.();
      unsubLeaderboard?.();
      unsubOnline?.();
      unsubQuests?.();
    };
  }, [router]);

  // XP এনিমেশন
  useEffect(() => {
    let start = 0; const end = stats.xp; const step = end / (1200 / 16);
    const t = setInterval(() => { start = Math.min(start + step, end); setAnimXP(Math.round(start)); if (start >= end) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [stats.xp]);

  useEffect(() => {
    const close = () => setMobileMenu(false);
    if (isMobileMenuOpen) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isMobileMenuOpen]);

  const handleSignOut = useCallback(async () => { await signOut(auth); router.push("/"); }, [router]);

  // Real-time notification hooks
  useXPNotifications(user?.uid ?? null);
  useBattleNotifications(user?.uid ?? null);
  useSessionNotifications(user?.uid ?? null);
  const { notifications: liveNotifs, unreadCount, markAllRead, markOneRead } = useRealtimeNotifications(user?.uid ?? null);

  // Show a full-screen loading spinner while Firebase resolves auth state.
  // This prevents the page from briefly flashing mock content or redirecting
  // prematurely on reload before the persisted session is confirmed.
  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#02010a" }}
      >
        <div
          className="w-12 h-12 rounded-full animate-spin mb-4"
          style={{ border: "3px solid rgba(34,211,238,0.15)", borderTopColor: "#22d3ee" }}
        />
        <p
          className="text-[11px] uppercase tracking-widest font-black"
          style={{ fontFamily: "'Orbitron',sans-serif", color: "rgba(34,211,238,0.6)" }}
        >
          Loading...
        </p>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{GLOBAL_CSS}</style>

      {/* Sonner toaster for real-time notifications */}
      <Toaster position="top-right" richColors={false} />

      {showProModal   && <ProUpgradeModal  onClose={() => setShowProModal(false)} />}
      {showRivalModal && <RivalModal       onClose={() => setShowRivalModal(false)} />}
      {showRankModal  && <RankModal        onClose={() => setShowRankModal(false)} currentXP={stats.xp} />}
      {showProfile    && <ProfileModal     onClose={() => setShowProfile(false)} user={user} stats={stats} />}
      {showUploadModal && (
        <ProfilePictureUpload
          onClose={() => setShowUploadModal(false)}
          currentPhotoURL={user?.photoURL}
          onUploadSuccess={(url) => setUser((prev: any) => ({ ...prev, photoURL: url }))}
        />
      )}
      {selectedProfileUserId && (
        <UserProfileModal
          userId={selectedProfileUserId}
          viewerUid={user?.uid}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}

      {/* Ambient BG — simplified for mobile (no blur filter), full effect on desktop */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:700, height:700, background:"#0ea5e9", opacity:0.05, filter:"blur(140px)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:700, height:700, background:rank.color, opacity:0.04, filter:"blur(140px)", borderRadius:"50%" }} />
      </div>
      {/* Mobile: simple radial gradient BG (no blur filter = no GPU hit) */}
      <div className="fixed inset-0 z-0 pointer-events-none md:hidden" style={{
        background: `radial-gradient(ellipse at 20% 10%, rgba(14,165,233,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, ${rank.color}08 0%, transparent 50%)`
      }} />

      <div className="min-h-screen w-full flex justify-center relative z-10">
        <div className="w-full px-4 md:px-6 py-6 md:py-8 max-w-[1920px]">
        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-6 xl:gap-8 items-start">

        <aside aria-label="Dashboard sidebar navigation" className="hidden xl:flex xl:sticky xl:top-6 h-[calc(100vh-3rem)] card p-5 flex-col border border-white/10">
          <div className="flex items-center gap-3 mb-7">
            <div className="p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20">
              <Swords size={18} color="white" />
            </div>
            <span className="font-logo text-[20px] tracking-tight">RANKPUSH</span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "default"}`}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-black truncate">{user?.displayName || "Hunter"}</p>
              <p className="text-[8px] opacity-45 uppercase tracking-widest truncate">{rank.name}</p>
            </div>
          </div>

          <nav aria-label="Primary dashboard navigation" className="flex flex-col gap-1">
            {[
              { label: "Dashboard", icon: LayoutDashboard, fn: () => router.push("/dashboard"), active: true },
              { label: "Profile", icon: User, fn: () => setShowProfile(true) },
              { label: "Battle Arena", icon: Swords, fn: () => router.push(`/arena/${selectedSub.toLowerCase()}`) },
              { label: "Shadow Focus", icon: Timer, fn: () => router.push("/timer") },
              { label: "Leaderboard", icon: Trophy, disabled: true },
              { label: "Analytics", icon: BarChart2, disabled: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.fn ?? (() => {})}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${item.active ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/25" : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"}`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon size={14} />
                  {item.label}
                </span>
                <ChevronRight size={12} className={item.active ? "opacity-100" : "opacity-30"} />
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2">
            {stats.plan === "free" && (
              <button
                onClick={() => setShowProModal(true)}
                className="w-full bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl px-4 py-3 text-white font-black text-[10px] tracking-widest flex items-center justify-center gap-2"
              >
                <Crown size={14} /> GO PRO
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 font-black text-[10px] tracking-widest flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> SIGN OUT
            </button>
          </div>
        </aside>

        <div className="min-w-0">

        {/* ═══ HEADER ═══ */}
        <header className="flex justify-between items-center mb-8 md:mb-10">
          <div className="flex items-center gap-6 md:gap-10">
            {/* Logo */}
            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={e => { e.stopPropagation(); setMobileMenu(v => !v); }}>
                <div className="p-2 md:p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20 group-hover:scale-105 transition-transform">
                  <Swords size={18} color="white" />
                </div>
                <span className="font-logo text-lg md:text-[22px] tracking-tight">RANKPUSH</span>
                <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 xl:hidden ${isMobileMenuOpen ? "rotate-180" : ""}`} />
              </div>
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div initial={{ opacity:0, y:-10, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-10, scale:0.95 }} transition={{ duration:0.2 }}
                    className="absolute top-full left-0 mt-4 w-64 bg-[#0a0f1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1 xl:hidden"
                    onClick={e => e.stopPropagation()}>
                    {[
                      { label: "Dashboard",     icon: LayoutDashboard, fn: () => { router.push("/"); setMobileMenu(false); }, active: true },
                      { label: "Profile",       icon: User,           fn: () => { setShowProfile(true); setMobileMenu(false); } },
                      { label: "Battle Arena",  icon: Swords,         fn: () => { router.push(`/arena/${selectedSub.toLowerCase()}`); setMobileMenu(false); } },
                      { label: "Shadow Focus",  icon: Timer,          fn: () => { router.push("/timer"); setMobileMenu(false); } },
                      { label: "Leaderboard",   icon: Trophy,         fn: () => {} },
                      { label: "Analytics",     icon: BarChart2,      fn: () => {} },
                    ].map(item => (
                      <button key={item.label} onClick={item.fn} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs tracking-widest uppercase transition-colors ${item.active ? "bg-cyan-400/10 text-cyan-400" : "hover:bg-white/5 text-white/60 hover:text-white"}`}>
                        <item.icon size={15} /> {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <TrendingUp size={14} color="#22c55e" />
              <span className="text-[11px] font-extrabold text-green-500 tracking-widest">+{stats.weeklyXP.toLocaleString()} THIS WEEK</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 8px #22c55e" }} />
              <span className="text-[11px] font-extrabold tracking-widest opacity-70">{onlineCount.toLocaleString()} ONLINE</span>
            </div>
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotif(!showNotif); }}
                className="bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer text-white flex relative"
              >
                <Bell size={18} />
              </button>
              {/* Unread badge — real count */}
              {unreadCount > 0 && (
                <div className="badge-bounce absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#02010a] px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
              <AnimatePresence>
                {showNotif && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:0.95 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:8, scale:0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-12 -right-14 md:right-0 w-[300px] md:w-80 z-50"
                    style={{
                      background: "rgba(8,6,20,0.98)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 20,
                      boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Bell size={13} color="#22d3ee" />
                        <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:900, letterSpacing:"0.15em", color:"#22d3ee" }}>
                          NOTIFICATIONS
                        </p>
                        {unreadCount > 0 && (
                          <span style={{ fontSize:9, background:"rgba(34,211,238,0.15)", border:"1px solid rgba(34,211,238,0.3)", color:"#22d3ee", borderRadius:20, padding:"2px 7px", fontWeight:800 }}>
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead()}
                          style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:"rgba(255,255,255,0.35)", fontWeight:700, cursor:"pointer", background:"none", border:"none" }}
                        >
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div style={{ maxHeight: 320, overflowY:"auto", padding:"8px 0" }}>
                      {liveNotifs.length === 0 ? (
                        <div style={{ padding:"28px 16px", textAlign:"center" }}>
                          <BellOff size={28} color="rgba(255,255,255,0.15)" style={{ margin:"0 auto 10px" }} />
                          <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"'Orbitron',sans-serif", letterSpacing:"0.1em" }}>NO NOTIFICATIONS</p>
                          <p style={{ fontSize:9, color:"rgba(255,255,255,0.15)", marginTop:4 }}>Notifications will appear here when you earn XP, win battles, or level up.</p>
                        </div>
                      ) : liveNotifs.map((n, i) => {
                        const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
                        return (
                          <div
                            key={n.id}
                            onClick={() => !n.read && markOneRead(n.id)}
                            style={{
                              display:"flex", alignItems:"flex-start", gap:12,
                              padding:"10px 16px",
                              borderBottom: i < liveNotifs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                              background: n.read ? "transparent" : `${cfg.color}08`,
                              cursor: n.read ? "default" : "pointer",
                              transition: "background 0.2s",
                            }}
                          >
                            {/* Icon dot */}
                            <div style={{
                              width:32, height:32, borderRadius:"50%", flexShrink:0,
                              background: `${cfg.color}15`,
                              border: `1px solid ${cfg.color}30`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:14, marginTop:1,
                            }}>
                              {cfg.icon}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:11, fontWeight:700, color: n.read ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", marginBottom:2, lineHeight:1.4 }}>
                                {n.message}
                              </p>
                              {n.subtext && (
                                <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>{n.subtext}</p>
                              )}
                              <p style={{ fontSize:9, color: cfg.color, fontWeight:700, opacity: n.read ? 0.5 : 0.8 }}>
                                {relativeTime(n.createdAt)}
                              </p>
                            </div>
                            {/* Unread dot */}
                            {!n.read && (
                              <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, flexShrink:0, marginTop:6, boxShadow:`0 0 6px ${cfg.color}` }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    {liveNotifs.length > 0 && (
                      <div style={{ padding:"10px 16px", borderTop:"1px solid rgba(255,255,255,0.06)", textAlign:"center" }}>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.08em" }}>
                          Showing last {liveNotifs.length} notifications
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {stats.plan === "free" ? (
              <button onClick={() => setShowProModal(true)} className="bg-gradient-to-br from-violet-600 to-purple-500 border-none rounded-xl px-3 py-2 md:px-4 md:py-2.5 cursor-pointer text-white font-black text-[10px] md:text-xs tracking-widest flex items-center gap-1.5">
                <Crown size={14} /> <span className="hidden sm:inline">GO PRO</span>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest flex items-center gap-1.5">
                <Crown size={14} /> PRO
              </div>
            )}
            <button onClick={handleSignOut} className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 cursor-pointer text-red-500 flex">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

            {/* ★ PLAYER CARD — Upgraded */}
            <div className="card p-6 md:p-7 text-center relative overflow-hidden" style={{ borderTop: `3px solid ${rank.color}` }}>
              <div style={{ position:"absolute", top:"-30%", left:"50%", transform:"translateX(-50%)", width:220, height:220, borderRadius:"50%", background:rank.color, opacity:0.06, filter:"blur(50px)", pointerEvents:"none" }} />

              {/* Avatar — clickable opens upload modal */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full cursor-pointer hover:scale-105 transition-transform"
                style={{ border: `2px solid ${rank.color}`, boxShadow: `0 0 24px ${rank.glowColor}` }}
                onClick={() => setShowUploadModal(true)}>
                <img 
  src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || "default"}`} 
  style={{ width: "96px", height: "96px", minWidth: "96px", minHeight: "96px", objectFit: "cover", borderRadius: "50%" }} 
  alt="Profile" 
/>
                <div style={{ position:"absolute", bottom:-4, right:-4, background:`linear-gradient(135deg,${rank.color},${rank.color}bb)`, borderRadius:8, padding:"3px 7px", fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900, border:"2px solid #02010a" }}>
                  LVL {stats.level}
                </div>
                {/* Edit overlay */}
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity="1"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity="0"}>
                  <Edit3 size={14} color="white" />
                </div>
              </div>

              <h2 className="font-logo text-base md:text-lg tracking-wide mb-1 text-white">
                {user?.displayName || "CYBER HUNTER"}
              </h2>

              {/* Bio */}
              {(stats as any).bio && (
                <p className="text-[10px] text-white/40 italic mb-3 px-2 leading-relaxed">
                  {(stats as any).bio}
                </p>
              )}

              {/* Rank Badge — clickable opens rank modal */}
              <div className="flex justify-center mb-4">
                <button onClick={() => setShowRankModal(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <RankBadge rank={rank} size="md" />
                </button>
              </div>

              {/* XP */}
              <div className="bg-white/5 border border-white/10 rounded-full px-5 py-2 inline-flex items-center gap-2 mb-4">
                <span className="font-black text-sm md:text-base text-white">{animXP.toLocaleString()}</span>
                <span className="text-cyan-400 font-black text-[10px]">EXP</span>
              </div>

              {/* XP Bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[9px] font-extrabold opacity-40 uppercase tracking-widest">Next: {nextRank?.name || "MAX"}</span>
                  <span className="text-[9px] font-extrabold text-cyan-400">{xpPct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="xp-bar h-full rounded-full" style={{ width:`${xpPct}%`, background:`linear-gradient(90deg,${rank.color},${rank.color}cc)`, boxShadow:`0 0 8px ${rank.glowColor}` }} />
                </div>
                {nextRank && (
                  <p className="text-[9px] text-right mt-1 opacity-30">{(nextRank.minXP - stats.xp).toLocaleString()} XP to {nextRank.name}</p>
                )}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                {[
                  { l: "Battles", v: stats.totalBattles },
                  { l: "Streak",  v: `${stats.streak}🔥` },
                  { l: "Accuracy",v: `${stats.accuracy}%` },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-sm font-black text-white">{s.v}</p>
                    <p className="text-[8px] opacity-35 uppercase tracking-widest mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* View full profile button */}
              <button onClick={() => setShowProfile(true)}
                className="w-full mt-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                <User size={11} /> View Full Profile
              </button>
            </div>

            {/* Neural Attributes */}
            <div className="card p-5 md:p-6">
              <h3 className="text-[9px] font-black tracking-widest opacity-50 uppercase mb-5 flex items-center gap-2">
                <Brain size={13} color="#22d3ee" /> Neural Attributes
              </h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { l:"Accuracy", v:stats.accuracy, d:`${stats.accuracy}%`, c:"#22d3ee" },
                  { l:"Speed",    v:stats.speed,    d:`${stats.speed}%`,    c:"#0ea5e9" },
                  { l:"IQ",       v:75,             d:`${stats.iq}`,        c:"rgba(255,255,255,0.7)" },
                  { l:"Logic",    v:stats.logic,    d:`${stats.logic}%`,    c:"#34d399" },
                  { l:"Focus",    v:stats.focus,    d:`${stats.focus}%`,    c:"#a855f7" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{s.l}</span>
                      <span className="text-[9px] font-black" style={{ color:s.c }}>{s.d}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="stat-bar h-full rounded-full" style={{ width:`${s.v}%`, background:s.c, boxShadow:`0 0 6px ${s.c}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Streak */}
            <div className="card p-5 md:p-6 border-l-[3px] border-amber-500 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} color="#f59e0b" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Daily Streak</h3>
                <span className="ml-auto text-lg font-black text-amber-500">{stats.streak || 0} 🔥</span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                {streakDays.map((d,i) => (
                  <div key={i} className="streak-pip flex-1 text-center" style={{ animationDelay:`${i*80}ms` }}>
                    <div className="h-7 md:h-8 rounded-lg flex items-center justify-center mb-1" style={{ background:streakDone[i]?"#f59e0b":"rgba(255,255,255,0.05)", border:streakDone[i]?"none":"1px solid rgba(255,255,255,0.08)", boxShadow:streakDone[i]?"0 0 10px rgba(245,158,11,0.4)":"none" }}>
                      {streakDone[i] && <span className="text-[10px]">✓</span>}
                    </div>
                    <span className="text-[8px] font-bold opacity-40 uppercase">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="card p-5 hidden lg:block">
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} color="#f59e0b" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Achievements</h3>
                <span className="ml-auto text-[9px] text-cyan-400 font-extrabold">2/6</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.slice(0,4).map(a => (
                  <div key={a.title} className="rounded-xl p-2.5 text-center" style={{ background:a.unlocked?"rgba(34,211,238,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${a.unlocked?"rgba(34,211,238,0.2)":"rgba(255,255,255,0.05)"}`, opacity:a.unlocked?1:0.4 }}>
                    <div className="text-xl mb-1.5">{a.icon}</div>
                    <p className="text-[9px] font-extrabold mb-0.5" style={{ color:a.unlocked?"#22d3ee":"white" }}>{a.title}</p>
                    <p className="text-[8px] opacity-40">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Directive */}
            <div className="card p-5 border-l-[3px] border-emerald-400 bg-emerald-400/5 hidden lg:block">
              <div className="flex items-center gap-2 mb-3 opacity-70">
                <Quote size={14} color="#34d399" />
                <h3 className="text-[9px] font-black tracking-widest uppercase">Daily Directive</h3>
              </div>
              <p className="text-[13px] italic font-semibold leading-relaxed text-white/80 mb-2 font-bangla">
                "Seek knowledge from the cradle to the grave."
              </p>
              <p className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">— PROPHET MUHAMMAD (PBUH)</p>
            </div>
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-5">

            {/* Hero Banner */}
            <div className="card p-6 md:p-11 bg-gradient-to-br from-sky-500/10 to-purple-600/5 border-t-[3px] border-sky-500 relative overflow-hidden">
              <div style={{ position:"absolute", right:-20, top:"50%", transform:"translateY(-50%)", opacity:0.04 }}>
                <LayoutDashboard size={220} />
              </div>
              {/* Shadow monarch silhouette BG */}
              <div className="shadow-float" style={{ position:"absolute", right:20, bottom:0, fontSize:110, opacity:0.04, pointerEvents:"none", lineHeight:1 }}>⚔️</div>
              <div className="relative z-10">
                <p className="text-[9px] md:text-[11px] font-extrabold tracking-[0.3em] text-cyan-400 uppercase mb-2 md:mb-3 opacity-80">
                  ⚔️ System Status: {rank.title}
                </p>
                <h1 className="font-logo text-3xl md:text-5xl lg:text-[56px] italic leading-[0.95] uppercase mb-4 md:mb-5">
                  DOMINATE<br />
                  <span style={{ color:"#22d3ee", textShadow:"0 0 30px rgba(34,211,238,0.4)" }}>THE META</span>
                </h1>
                <div className="grid grid-cols-2 md:flex flex-wrap gap-3 md:gap-4">
                  {[
                    { label:"Total Battles", value:stats.totalBattles,    icon:Swords,     color:"#22d3ee" },
                    { label:"Accuracy",      value:`${stats.accuracy}%`,  icon:Crosshair,  color:"#34d399" },
                    { label:"Best Streak",   value:`${stats.streak} days`,icon:Flame,      color:"#f59e0b" },
                    { label:"Questions",     value:stats.questionsAttempted, icon:BookOpen, color:"#a855f7" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-3">
                      <s.icon size={15} color={s.color} />
                      <div>
                        <p className="text-sm font-black" style={{ color:s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                        <p className="text-[8px] opacity-40 uppercase tracking-widest">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow Focus Banner */}
            <div className="card p-6 md:p-7 border-l-[4px] border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent flex flex-col md:flex-row items-start md:items-center gap-5" style={{ boxShadow:"0 0 30px rgba(168,85,247,0.08)" }}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/15 rounded-xl border border-purple-500/25">
                  <Timer size={24} color="#a855f7" />
                </div>
                <div>
                  <h3 className="font-logo text-base md:text-lg text-purple-400 uppercase tracking-wider mb-1">Shadow Focus</h3>
                  <p className="text-[10px] text-white/45 leading-relaxed max-w-[300px]">
                    Enter deep focus mode. Pomodoro or Free Timer — earn bonus XP and climb the daily study leaderboard.
                  </p>
                </div>
              </div>
              <button onClick={() => router.push("/timer")}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow:"0 0 20px rgba(168,85,247,0.3)" }}>
                <Play size={14} fill="currentColor" /> Enter Focus
              </button>
            </div>

            {/* Tactical Arena */}
            <div className="card p-5 md:p-8 border-t-[3px] border-sky-500">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-logo text-lg md:text-[22px] uppercase mb-1">Tactical <span className="text-sky-500">Arena</span></h2>
                  <p className="text-[9px] font-bold opacity-35 uppercase tracking-widest">Select your mastery field</p>
                </div>
                <div className="float w-11 h-11 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
                  <Swords size={20} color="#22d3ee" />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {SUBJECTS.map(sub => {
                  const isActive = selectedSub === sub.name;
                  const hex = sub.color.startsWith("#") ? sub.color.slice(1) : "22d3ee";
                  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
                  return (
                    <button key={sub.name} type="button"
                      className={`sub-btn p-4 md:p-6 ${isActive?"sub-active":""} ${sub.locked?"sub-locked":""}`}
                      style={{ "--sub-color":sub.color, "--sub-rgb":`${r},${g},${b}` } as any}
                      onClick={() => { if (!sub.locked) setSelectedSub(sub.name); else setShowProModal(true); }}>
                      {sub.locked && <div className="absolute top-2 right-2"><Lock size={10} color="rgba(255,255,255,0.35)" /></div>}
                      <sub.icon size={24} color={isActive?sub.color:"rgba(255,255,255,0.45)"} style={{ filter:isActive?`drop-shadow(0 0 8px ${sub.color})`:"none", transition:"all 0.3s" }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color:isActive?"white":"rgba(255,255,255,0.45)" }}>{sub.name}</span>
                      {!sub.locked ? <span className="text-[8px] font-bold" style={{ color:isActive?sub.color:"rgba(255,255,255,0.25)" }}>{sub.questions} QS</span>
                        : <span className="text-[8px] font-bold text-purple-500">PRO</span>}
                    </button>
                  );
                })}
              </div>
              <button className="arena-btn glow-pulse" onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)}>
                ENTER ARENA <Play size={18} fill="white" />
              </button>
            </div>

            {/* Rival Battle */}
            <div className="card p-5 md:p-7 bg-gradient-to-r from-red-500/5 to-transparent border-l-[3px] border-red-500 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5">
              <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shrink-0">
                <Sword size={20} color="#ef4444" />
              </div>
              <div className="flex-1">
                <h3 className="font-logo text-sm md:text-base text-red-500 uppercase mb-1">Rival Battle</h3>
                <p className="text-[10px] opacity-45">Challenge a friend to real-time 1v1 MCQ battle</p>
              </div>
              <button onClick={() => setShowRivalModal(true)}
                className="w-full md:w-auto bg-gradient-to-br from-red-600 to-red-500 border-none rounded-xl py-2.5 px-5 text-white font-black text-[10px] tracking-wide flex items-center justify-center gap-2">
                <Wifi size={14} /> Find Rival
              </button>
            </div>

            {/* Performance Analytics */}
            <div className="card p-5 md:p-7">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={14} color="#22d3ee" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Performance This Week</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:"Battles",   value: stats.weeklyBattles ?? 18,  suffix:"",   color:"#22d3ee", icon:Swords      },
                  { label:"Correct",   value: stats.weeklyCorrect ?? 142,  suffix:"",   color:"#34d399", icon:CheckCircle },
                  { label:"XP Earned", value: stats.weeklyXP     ?? 0,   suffix:"",   color:"#f59e0b", icon:Zap         },
                  { label:"Rank ▲",    value: stats.weeklyRankUps?? 0,   suffix:" ↑", color:"#a855f7", icon:ChevronUp   },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
                    <s.icon size={16} className="mx-auto mb-2" color={s.color} />
                    <p className="text-lg md:text-[22px] font-black mb-0.5" style={{ color:s.color }}>{s.value.toLocaleString()}{s.suffix}</p>
                    <p className="text-[8px] opacity-35 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-5">

            {/* Leaderboard */}
            <div className="card p-5 md:p-6 border-l-[3px] border-sky-500/50">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-60 flex items-center gap-2">
                  <Trophy size={12} color="#f59e0b" /> Global Elite
                </h3>
                <span className="text-[8px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              {/* Leaderboard skeleton while loading */}
              {leaderboardLoading ? (
                <div className="flex flex-col gap-2">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="flex items-center gap-2.5 p-2.5 rounded-xl animate-pulse">
                      <div className="w-6 h-3 bg-white/10 rounded"/>
                      <div className="w-9 h-9 bg-white/10 rounded-full"/>
                      <div className="flex-1">
                        <div className="h-2.5 bg-white/10 rounded w-24 mb-1.5"/>
                        <div className="h-1.5 bg-white/5 rounded w-full"/>
                      </div>
                      <div className="w-12 h-3 bg-white/10 rounded"/>
                    </div>
                  ))}
                </div>
              ) : liveLeaderboard.map((p, i) => (
                  <div key={p.id || p.name}
                    className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl cursor-pointer transition-all"
                    onClick={() => p.id && setSelectedProfileUserId(p.id)}
                    style={{
                      background: p.isCurrentUser
                        ? `rgba(${p.rankInfo?.color ? "34,211,238" : "34,211,238"},0.08)`
                        : i===0 ? "rgba(34,211,238,0.05)" : "transparent",
                      border: p.isCurrentUser
                        ? `1px solid ${p.rankInfo?.color || "#22d3ee"}44`
                        : i===0 ? "1px solid rgba(34,211,238,0.1)" : "1px solid transparent",
                    }}
                    onMouseEnter={e => { if(!p.isCurrentUser && i!==0)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if(!p.isCurrentUser && i!==0)(e.currentTarget as HTMLElement).style.background="transparent"; }}
                  >
                    {/* Rank number */}
                    <span className="text-[13px] font-black italic min-w-[24px]" style={{ color: i===0?"#22d3ee":"rgba(255,255,255,0.35)" }}>
                      {p.rank}
                    </span>
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={p.avatar} loading="lazy"
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
                        style={{ border:`2px solid ${p.rankInfo?.color || "#22d3ee"}` }}
                        alt={p.name}
                      />
                      {/* SVG rank mini-badge */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center" style={{ filter:"drop-shadow(0 0 3px rgba(0,0,0,0.8))" }}>
                        <RankBadgeSVG rankId={p.rankInfo?.id || "e"} size={14} />
                      </div>
                    </div>
                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[10px] font-extrabold uppercase italic truncate"
                          style={{ color: p.isCurrentUser ? p.rankInfo?.color || "#22d3ee" : i===0?"#22d3ee":"rgba(255,255,255,0.8)" }}
                        >{p.name}</p>
                        {p.isCurrentUser && <span className="text-[7px] bg-cyan-400/20 text-cyan-400 px-1 py-0.5 rounded font-black shrink-0">YOU</span>}
                      </div>
                      <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${Math.max(20, 100-i*15)}%`, background: p.rankInfo?.color || "#22d3ee" }} />
                      </div>
                    </div>
                    {/* XP Score */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black" style={{ color: p.rankInfo?.color || "#22d3ee" }}>{p.score}</p>
                      <p className="text-[7px] opacity-35 uppercase">EXP</p>
                    </div>
                  </div>
                ))}
              <button className="w-full mt-3 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
                View Full Leaderboard <ArrowRight size={11} />
              </button>
            </div>

            {/* Daily Quests — Real Firestore */}
            <div className="card p-5 md:p-6 border-l-[3px] border-orange-500 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Flame size={14} color="#f97316" />
                <h3 className="text-[9px] font-black tracking-widest uppercase">Daily Quests</h3>
                <span className="ml-auto text-[9px] text-orange-500 font-extrabold">
                  {(liveQuests.length > 0 ? liveQuests : DAILY_QUESTS).filter(q => q.done).length}/{(liveQuests.length > 0 ? liveQuests : DAILY_QUESTS).length} Done
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {(liveQuests.length > 0 ? liveQuests : DAILY_QUESTS).map(q => (
                  <div key={q.id} className="rounded-xl p-3 md:p-3.5" style={{ background:q.done?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.03)", border:`1px solid ${q.done?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.05)"}` }}>
                    <div className={`flex items-start gap-2.5 ${q.done?"mb-0":"mb-2.5"}`}>
                      <q.icon size={14} className="shrink-0 mt-0.5" color={q.done?"#22c55e":q.color} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-extrabold" style={{ color:q.done?"#22c55e":"rgba(255,255,255,0.85)", textDecoration:q.done?"line-through":"none" }}>{q.title}</p>
                          <span className="text-[9px] font-black" style={{ color:q.color }}>+{q.xp} XP</span>
                        </div>
                        <p className="text-[8px] opacity-45 mt-0.5">{q.desc}</p>
                      </div>
                    </div>
                    {!q.done && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] opacity-35 uppercase">Progress</span>
                          <span className="text-[8px] font-extrabold" style={{ color:q.color }}>{q.progress}/{q.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="quest-bar h-full rounded-full" style={{ width:`${Math.round((q.progress/q.total)*100)}%`, background:`linear-gradient(90deg,${q.color},${q.color}aa)` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Fight */}
            <div className="card p-5 md:p-6 bg-gradient-to-br from-red-500/5 to-purple-600/5 border border-red-500/15 relative overflow-hidden">
              <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", opacity:0.05, fontSize:110, lineHeight:1 }}>💀</div>
              <div className="flex items-center gap-2 mb-2.5">
                <Layers size={14} color="#ef4444" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-80">Chapter Boss</h3>
                <span className="ml-auto text-[8px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded-md font-black">NEW</span>
              </div>
              <p className="text-[13px] font-bold text-white/80 mb-1.5">Physics Chapter 3 Boss</p>
              <p className="text-[10px] opacity-35 mb-4">10 hard questions. Defeat the boss to earn rare XP!</p>
              <button onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)} className="w-full py-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 font-black text-[10px] flex items-center justify-center gap-1.5">
                <Layers size={12} /> Start Boss Fight
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
          <footer className="mt-12 md:mt-[60px] pt-6 border-t border-white/5 text-center opacity-20">
            <p className="font-logo text-[9px] tracking-[1.2em] text-cyan-400 uppercase">RankPush · Shadow System · 2026</p>
          </footer>
        </div>
        </div>
        </div>
      </div>
    </>
  );
}
