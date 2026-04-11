"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Zap, Trophy, Swords, Bell, Settings, Target,
  Shield, Star, Users, Brain, Activity,
  Play, ChevronRight, Crown, Flame, LayoutDashboard,
  Atom, FlaskConical, Sigma, Dna, Quote,
  Sword, LogOut, X, CheckCircle, Lock,
  TrendingUp, Calendar, Award, Sparkles,
  ChevronUp, BarChart2, Clock, Crosshair,
  GitBranch, Layers, Medal, Wifi, Timer
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
type Plan = "free" | "pro";
type RankId = "iron" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "monarch" | "shadow_lord";

interface RankInfo {
  id: RankId;
  name: string;
  color: string;
  glowColor: string;
  icon: string;
  minXP: number;
  maxXP: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const RANKS: RankInfo[] = [
  { id: "iron",       name: "Iron",        color: "#6b7280", glowColor: "rgba(107,114,128,0.4)", icon: "⚙️", minXP: 0,      maxXP: 999   },
  { id: "bronze",     name: "Bronze",      color: "#b45309", glowColor: "rgba(180,83,9,0.4)",    icon: "🥉", minXP: 1000,  maxXP: 4999  },
  { id: "silver",     name: "Silver",      color: "#9ca3af", glowColor: "rgba(156,163,175,0.4)", icon: "🥈", minXP: 5000,  maxXP: 9999  },
  { id: "gold",       name: "Gold",        color: "#f59e0b", glowColor: "rgba(245,158,11,0.4)",  icon: "🥇", minXP: 10000, maxXP: 19999 },
  { id: "platinum",   name: "Platinum",    color: "#06b6d4", glowColor: "rgba(6,182,212,0.4)",   icon: "💎", minXP: 20000, maxXP: 34999 },
  { id: "diamond",    name: "Diamond",     color: "#3b82f6", glowColor: "rgba(59,130,246,0.4)",  icon: "💠", minXP: 35000, maxXP: 49999 },
  { id: "monarch",    name: "Monarch",     color: "#a855f7", glowColor: "rgba(168,85,247,0.4)",  icon: "👑", minXP: 50000, maxXP: 74999 },
  { id: "shadow_lord",name: "Shadow Lord", color: "#ec4899", glowColor: "rgba(236,72,153,0.4)",  icon: "⚔️", minXP: 75000, maxXP: Infinity },
];

const getRankByXP = (xp: number): RankInfo =>
  RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];

const getXPProgress = (xp: number, rank: RankInfo): number => {
  if (rank.maxXP === Infinity) return 100;
  return Math.round(((xp - rank.minXP) / (rank.maxXP - rank.minXP)) * 100);
};

const SUBJECTS = [
  { name: "Physics",   icon: Atom,         color: "#22d3ee", locked: false, questions: 48  },
  { name: "Chemistry", icon: FlaskConical, color: "#a78bfa", locked: false, questions: 36  },
  { name: "Math",      icon: Sigma,        color: "#34d399", locked: true,  questions: 0   },
  { name: "Biology",   icon: Dna,          color: "#f87171", locked: true,  questions: 0   },
];

const DAILY_QUESTS = [
  { id: 1, title: "Physics Mastery",   desc: "Solve 20 MCQ",        xp: 500,  progress: 12, total: 20, icon: Atom,     color: "#22d3ee", done: false },
  { id: 2, title: "Speed Demon",       desc: "Answer in <5s × 10", xp: 300,  progress: 10, total: 10, icon: Clock,    color: "#f59e0b", done: true  },
  { id: 3, title: "Combo Master",      desc: "Get 5x combo streak", xp: 400,  progress: 3,  total: 5,  icon: Flame,    color: "#f87171", done: false },
];

const LEADERBOARD = [
  { name: "S-Rank_Slayer", score: "24,500", rank: "01", avatar: "https://i.pravatar.cc/150?u=slayer",  rankInfo: RANKS[7] },
  { name: "ZeroOne",       score: "22,100", rank: "02", avatar: "https://i.pravatar.cc/150?u=zeroone", rankInfo: RANKS[6] },
  { name: "GhostVibes",    score: "19,850", rank: "03", avatar: "https://i.pravatar.cc/150?u=ghost",   rankInfo: RANKS[6] },
  { name: "NightCrawler",  score: "17,200", rank: "04", avatar: "https://i.pravatar.cc/150?u=night",   rankInfo: RANKS[5] },
  { name: "PhantomX",      score: "15,900", rank: "05", avatar: "https://i.pravatar.cc/150?u=phantom", rankInfo: RANKS[5] },
];

const ACHIEVEMENTS = [
  { title: "First Blood",    desc: "Complete first battle",    icon: "🩸", unlocked: true  },
  { title: "Speed Freak",    desc: "10 answers under 3s",      icon: "⚡", unlocked: true  },
  { title: "Combo God",      desc: "20x combo streak",         icon: "🔥", unlocked: false },
  { title: "Scholar",        desc: "100 questions solved",     icon: "📚", unlocked: false },
];

const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_DONE = [true, true, true, true, false, false, false];

// ============================================================
// MOCK USER DATA
// ============================================================
const MOCK_STATS = {
  xp: 15420,
  level: 47,
  accuracy: 88,
  speed: 94,
  iq: 145,
  logic: 91,
  streak: 4,
  totalBattles: 284,
  weeklyXP: 2340,
  plan: "free" as Plan,
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ProUpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0f1e, #111827)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 24, maxWidth: 420, width: "100%", padding: 32, position: "relative", boxShadow: "0 0 60px rgba(168,85,247,0.2)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}>
          <X size={18} />
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, color: "#a855f7", marginBottom: 8 }}>UPGRADE TO PRO</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Unlock your full potential</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {["Unlimited questions all subjects", "All ranks unlocked (Shadow Lord)", "Rival Battle System (1v1)", "Detailed performance analytics", "Unlimited Freeze + Heal power-ups"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={16} color="#a855f7" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "14px 0", background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 12, color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            ৳১৯৯/month
          </button>
          <button style={{ flex: 1, padding: "14px 0", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 12, color: "#a855f7", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>
            ৳১৪৯৯/year
          </button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 12 }}>bKash • Nagad • Card accepted</p>
      </div>
    </div>
  );
}

function RivalModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = "https://rank-push.vercel.app/rival/abc123";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0a0f1e, #111827)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 24, maxWidth: 400, width: "100%", padding: 32, position: "relative", boxShadow: "0 0 60px rgba(239,68,68,0.15)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.05)", border: "none", color: "white", borderRadius: 8, padding: 6, cursor: "pointer" }}>
          <X size={18} />
        </button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, color: "#ef4444", marginBottom: 8 }}>RIVAL BATTLE</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Challenge a friend to 1v1 MCQ battle</p>
        </div>
        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, wordBreak: "break-all", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          {link}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ width: "100%", padding: "14px 0", background: copied ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #dc2626, #ef4444)", border: copied ? "1px solid #22c55e" : "none", borderRadius: 12, color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}
        >
          {copied ? "✓ Copied!" : "Copy Battle Link"}
        </button>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 12 }}>PRO feature — Share via WhatsApp</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function RankPushDashboard() {
  const [selectedSub, setSelectedSub]     = useState("Physics");
  const [user, setUser]                   = useState<any>(null);
  const [showProModal, setShowProModal]   = useState(false);
  const [showRivalModal, setShowRivalModal] = useState(false);
  const [showNotif, setShowNotif]         = useState(false);
  const [animXP, setAnimXP]              = useState(0);
  const router = useRouter();

  const stats  = MOCK_STATS;
  const rank   = getRankByXP(stats.xp);
  const nextRank = RANKS[RANKS.findIndex(r => r.id === rank.id) + 1];
  const xpPct  = getXPProgress(stats.xp, rank);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // XP count-up animation
  useEffect(() => {
    let start = 0;
    const end = stats.xp;
    const duration = 1200;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setAnimXP(Math.round(start));
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
      {/* ── GOOGLE FONTS + TAILWIND ── */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com" async />

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #02010a;
          color: white;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        body {
          background-image: 
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(14,165,233,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124,58,237,0.06) 0%, transparent 60%),
            linear-gradient(to bottom, #02010a, #050b14);
          min-height: 100vh;
        }

        /* Scanline overlay */
        body::before {
          content: '';
          position: fixed; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
          pointer-events: none;
          z-index: 1;
        }

        .font-logo { font-family: 'Orbitron', sans-serif; }
        .font-bangla { font-family: 'Hind Siliguri', sans-serif; }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .card:hover {
          border-color: rgba(34,211,238,0.2);
          background: rgba(255,255,255,0.04);
        }

        /* XP bar animation */
        @keyframes xpFill {
          from { width: 0% }
        }
        .xp-bar { animation: xpFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* Glow pulse */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(14,165,233,0.3); }
          50%        { box-shadow: 0 0 40px rgba(14,165,233,0.6); }
        }
        .glow-pulse { animation: glowPulse 2s ease-in-out infinite; }

        /* Float */
        @keyframes floatY {
          0%, 100% { transform: translateY(0);   }
          50%        { transform: translateY(-6px); }
        }
        .float { animation: floatY 3s ease-in-out infinite; }

        /* Rank badge shimmer */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #a855f7, #ec4899, #f59e0b, #a855f7);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }

        /* Streak pip */
        @keyframes streakPop {
          0%   { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .streak-pip { animation: streakPop 0.4s ease forwards; }

        /* Notification badge */
        @keyframes badgeBounce {
          0%, 100% { transform: scale(1); }
          50%        { transform: scale(1.2); }
        }
        .badge-bounce { animation: badgeBounce 1s ease infinite; }

        /* Quest progress bar */
        @keyframes questFill {
          from { width: 0% }
        }
        .quest-bar { animation: questFill 1s ease forwards; }

        /* Stat bar */
        @keyframes statFill {
          from { width: 0% }
        }
        .stat-bar { animation: statFill 1.5s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* Subject button */
        .sub-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .sub-btn:hover:not(.sub-locked) {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
        }
        .sub-btn.sub-active {
          border-color: var(--sub-color) !important;
          background: rgba(var(--sub-rgb), 0.1) !important;
          box-shadow: 0 8px 24px rgba(var(--sub-rgb), 0.25) !important;
          transform: translateY(-3px) scale(1.02);
        }
        .sub-locked {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Enter Arena button */
        .arena-btn {
          width: 100%;
          padding: 20px;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 16px;
          color: white;
          font-family: 'Orbitron', sans-serif;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.2em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .arena-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .arena-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,165,233,0.4); }
        .arena-btn:hover::before { opacity: 1; }
        .arena-btn:active { transform: translateY(0) scale(0.98); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.3); border-radius: 2px; }

        /* Nav link */
        .nav-link {
          font-size: 11px; font-weight: 800; letter-spacing: 0.15em;
          text-transform: uppercase; opacity: 0.4;
          transition: opacity 0.2s; cursor: pointer; color: white;
          text-decoration: none;
        }
        .nav-link:hover { opacity: 0.8; }
        .nav-link.active { opacity: 1; color: #22d3ee; border-bottom: 2px solid #0ea5e9; padding-bottom: 4px; }
      `}</style>

      {/* ── MODALS ── */}
      {showProModal   && <ProUpgradeModal  onClose={() => setShowProModal(false)}   />}
      {showRivalModal && <RivalModal       onClose={() => setShowRivalModal(false)} />}

      {/* ── AMBIENT BG ── */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, background: "#0ea5e9", opacity: 0.05, filter: "blur(140px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 700, height: 700, background: "#7c3aed", opacity: 0.04, filter: "blur(140px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "40%", left: "40%", width: 400, height: 400, background: "#ec4899", opacity: 0.03, filter: "blur(100px)", borderRadius: "50%" }} />
      </div>

      <div className="min-h-screen px-4 md:px-6 py-6 md:py-8 relative z-10 max-w-[1920px] mx-auto">

        {/* ═══════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════ */}
        <header className="flex justify-between items-center mb-8 md:mb-10">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6 md:gap-10">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="p-2 md:p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20">
                <Swords size={18} color="white" />
              </div>
              <span className="font-logo text-lg md:text-[22px] tracking-tight">RANKPUSH</span>
            </div>
            <nav className="hidden xl:flex gap-7">
              <a href="#" className="nav-link active">Dashboard</a>
              <a href="#" className="nav-link" onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)}>Battle Arena</a>
              {/* 🆕 NEW TIMER LINK */}
              <a href="#" className="nav-link flex items-center gap-1.5" onClick={() => router.push('/timer')}>
                <Timer size={12} className="text-cyan-400" /> Shadow Focus
              </a>
              <a href="#" className="nav-link">Leaderboard</a>
              <a href="#" className="nav-link">Analytics</a>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Weekly XP - Hidden on very small mobile */}
            <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <TrendingUp size={14} color="#22c55e" />
              <span className="text-[11px] font-extrabold text-green-500 tracking-widest">+{stats.weeklyXP.toLocaleString()} THIS WEEK</span>
            </div>

            {/* Online count - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-[glowPulse_2s_infinite]" />
              <span className="text-[11px] font-extrabold tracking-widest opacity-70">3,892 ONLINE</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer text-white flex"
              >
                <Bell size={18} />
              </button>
              <div className="badge-bounce absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#02010a]">3</div>
              {showNotif && (
                <div className="absolute top-12 right-0 w-72 bg-[#0d1420] border border-white/10 rounded-2xl p-4 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                  {[
                    { msg: "You ranked up to Monarch! 👑",  time: "2m ago",  color: "#a855f7" },
                    { msg: "Daily quest reset — new challenges await!", time: "1h ago", color: "#f59e0b" },
                    { msg: "ZeroOne challenged you to a rival battle ⚔️", time: "3h ago", color: "#ef4444" },
                  ].map((n, i) => (
                    <div key={i} className={`py-2.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
                      <p className="text-xs text-white/80 mb-1">{n.msg}</p>
                      <p className="text-[10px]" style={{ color: n.color }}>{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pro Badge / Upgrade */}
            {stats.plan === "free" ? (
              <button
                onClick={() => setShowProModal(true)}
                className="bg-gradient-to-br from-violet-600 to-purple-500 border-none rounded-xl px-3 py-2 md:px-4.5 md:py-2.5 cursor-pointer text-white font-black text-[10px] md:text-xs tracking-widest flex items-center gap-1.5"
              >
                <Crown size={14} /> <span className="hidden xs:inline">GO PRO</span>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl px-3 py-2 md:px-4.5 md:py-2.5 text-[10px] md:text-xs font-black tracking-widest flex items-center gap-1.5">
                <Crown size={14} /> PRO
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 cursor-pointer text-red-500 flex transition-all duration-200"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════
            MAIN GRID (Responsive Tailwind Setup)
        ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ─────────────────────────────────────────────
              LEFT COLUMN
          ───────────────────────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

            {/* Player Card */}
            <div className="card p-6 md:p-7 text-center relative overflow-hidden" style={{ borderTop: `3px solid ${rank.color}` }}>
              {/* Rank glow BG */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none opacity-10 blur-3xl" style={{ background: rank.color }} />

              {/* Avatar */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-full p-1" style={{ border: `2px solid ${rank.color}`, boxShadow: `0 0 20px ${rank.glowColor}` }}>
                <img
                  src={user?.photoURL || "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"}
                  className="w-full h-full rounded-full object-cover"
                  alt="Profile"
                />
                <div className="absolute -bottom-1 -right-1 text-white text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-black font-logo border-2 border-[#02010a]" style={{ background: `linear-gradient(135deg, ${rank.color}, ${rank.color}aa)` }}>
                  LVL {stats.level}
                </div>
              </div>

              {/* Name */}
              <h2 className="font-logo text-base md:text-lg tracking-wide mb-2 text-white">
                {user?.displayName || "Cyber Hunter"}
              </h2>

              {/* Rank Badge */}
              <div className="inline-flex items-center gap-1.5 mb-4">
                <span className="text-xs md:text-sm">{rank.icon}</span>
                <span className="shimmer-text text-[10px] md:text-[11px] font-black tracking-widest uppercase">{rank.name} Rank</span>
              </div>

              {/* XP Counter */}
              <div className="bg-white/5 border border-white/10 rounded-full px-4 py-2 md:px-5 md:py-2 inline-block mb-5">
                <span className="font-black text-sm md:text-base text-white">{animXP.toLocaleString()}</span>
                <span className="text-cyan-400 font-black ml-1 text-[10px] md:text-xs">EXP</span>
              </div>

              {/* XP Progress */}
              <div className="mb-2">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[9px] md:text-[10px] font-extrabold opacity-50 uppercase tracking-widest">
                    Next: {nextRank?.name || "MAX"}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-extrabold text-cyan-400">{xpPct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="xp-bar h-full rounded-full" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`, boxShadow: `0 0 8px ${rank.glowColor}` }} />
                </div>
              </div>
            </div>

            {/* Neural Attributes */}
            <div className="card p-5 md:p-6">
              <h3 className="text-[9px] md:text-[10px] font-black tracking-widest opacity-50 uppercase mb-4 md:mb-5 flex items-center gap-2">
                <Brain size={13} color="#22d3ee" /> Neural Attributes
              </h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { l: "Accuracy", v: stats.accuracy, d: `${stats.accuracy}%`, c: "#22d3ee" },
                  { l: "Speed",    v: stats.speed,    d: `${stats.speed}%`,    c: "#0ea5e9" },
                  { l: "IQ",       v: 75,             d: `${stats.iq}`,        c: "rgba(255,255,255,0.7)" },
                  { l: "Logic",    v: stats.logic,    d: `${stats.logic}%`,    c: "#34d399" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-70">{s.l}</span>
                      <span className="text-[9px] md:text-[10px] font-black" style={{ color: s.c }}>{s.d}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="stat-bar h-full rounded-full" style={{ width: `${s.v}%`, background: s.c, boxShadow: `0 0 6px ${s.c}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔥 Daily Streak */}
            <div className="card p-5 md:p-6 border-l-[3px] border-amber-500 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} color="#f59e0b" />
                <h3 className="text-[9px] md:text-[10px] font-black tracking-widest uppercase opacity-70">Daily Streak</h3>
                <span className="ml-auto text-base md:text-lg font-black text-amber-500">{stats.streak} 🔥</span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                {STREAK_DAYS.map((d, i) => (
                  <div key={i} className="streak-pip flex-1 text-center" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="h-7 md:h-8 rounded-lg flex items-center justify-center mb-1 transition-all" style={{ background: STREAK_DONE[i] ? "#f59e0b" : "rgba(255,255,255,0.05)", border: STREAK_DONE[i] ? "none" : "1px solid rgba(255,255,255,0.08)", boxShadow: STREAK_DONE[i] ? "0 0 10px rgba(245,158,11,0.4)" : "none" }}>
                      {STREAK_DONE[i] && <span className="text-[10px] md:text-xs">✓</span>}
                    </div>
                    <span className="text-[8px] md:text-[9px] font-bold opacity-50 uppercase">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="card p-5 md:p-6 hidden lg:block">
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} color="#f59e0b" />
                <h3 className="text-[9px] md:text-[10px] font-black tracking-widest uppercase opacity-70">Achievements</h3>
                <span className="ml-auto text-[9px] md:text-[10px] text-cyan-400 font-extrabold">2/4</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map(a => (
                  <div key={a.title} className="rounded-xl p-2.5 md:p-3 text-center" style={{ background: a.unlocked ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${a.unlocked ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}`, opacity: a.unlocked ? 1 : 0.4 }}>
                    <div className="text-xl md:text-2xl mb-1.5">{a.icon}</div>
                    <p className="text-[9px] md:text-[10px] font-extrabold mb-0.5" style={{ color: a.unlocked ? "#22d3ee" : "white" }}>{a.title}</p>
                    <p className="text-[8px] md:text-[9px] opacity-50">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* ─────────────────────────────────────────────
              CENTER COLUMN
          ───────────────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-5">

            {/* Hero Banner */}
            <div className="card p-6 md:p-11 bg-gradient-to-br from-sky-500/10 to-purple-600/5 border-t-[3px] border-sky-500 relative overflow-hidden">
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-5">
                <LayoutDashboard size={200} className="md:w-[240px] md:h-[240px]" />
              </div>
              <div className="relative z-10">
                <p className="text-[9px] md:text-[11px] font-extrabold tracking-[0.2em] md:tracking-[0.3em] text-cyan-400 uppercase mb-2 md:mb-3 opacity-80">
                  ⚔️ System Status: {rank.name} Awakening
                </p>
                <h1 className="font-logo text-3xl md:text-5xl lg:text-[56px] italic leading-[0.95] uppercase mb-4 md:mb-5">
                  DOMINATE<br />
                  <span className="text-cyan-400 shadow-cyan-400/40" style={{ textShadow: "0 0 30px rgba(34,211,238,0.4)" }}>THE META</span>
                </h1>
                
                {/* Hero Stats Grid - responsive */}
                <div className="grid grid-cols-2 md:flex flex-wrap gap-3 md:gap-5 mt-4 md:mt-0">
                  {[
                    { label: "Total Battles", value: stats.totalBattles, icon: Swords,     color: "#22d3ee" },
                    { label: "Accuracy",      value: `${stats.accuracy}%`, icon: Crosshair, color: "#34d399" },
                    { label: "Best Streak",   value: `${stats.streak} days`, icon: Flame,    color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 md:gap-2.5 bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-3">
                      <s.icon size={16} color={s.color} className="hidden xs:block" />
                      <div>
                        <p className="text-sm md:text-base font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[8px] md:text-[9px] opacity-50 uppercase tracking-widest">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🆕 SHADOW FOCUS TIMER CARD (ADDED HERE) */}
            <div className="card p-6 md:p-8 border-l-[4px] border-l-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <Timer size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-logo text-lg md:text-xl font-black uppercase text-purple-400 tracking-wider mb-1">Shadow Focus</h3>
                  <p className="text-[10px] md:text-xs text-white/50 leading-relaxed max-w-[300px]">
                    Enter deep focus mode. Study using Pomodoro or Free Timer to earn bonus XP and climb the daily leaderboard.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/timer')}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" /> Enter Focus
              </button>
            </div>

            {/* Tactical Arena */}
            <div className="card p-5 md:p-8 border-t-[3px] border-sky-500">
              <div className="flex justify-between items-center mb-5 md:mb-7">
                <div>
                  <h2 className="font-logo text-lg md:text-[22px] uppercase mb-1">
                    Tactical <span className="text-sky-500">Arena</span>
                  </h2>
                  <p className="text-[8px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest">Select your mastery field</p>
                </div>
                <div className="float w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-sky-500/20">
                  <Swords size={18} className="md:w-[22px] md:h-[22px]" color="#22d3ee" />
                </div>
              </div>

              {/* Subject Grid - Responsive */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 md:mb-6">
                {SUBJECTS.map(sub => {
                  const isActive = selectedSub === sub.name;
                  const hexToRgb = (hex: string) => {
                    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                    return `${r},${g},${b}`;
                  };
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      className={`sub-btn p-4 md:p-6 ${isActive ? "sub-active" : ""} ${sub.locked ? "sub-locked" : ""}`}
                      style={{ "--sub-color": sub.color, "--sub-rgb": sub.color.startsWith("#") ? hexToRgb(sub.color) : "34,211,238" } as any}
                      onClick={() => { if (!sub.locked) setSelectedSub(sub.name); else setShowProModal(true); }}
                    >
                      {sub.locked && (
                        <div className="absolute top-2 right-2">
                          <Lock size={10} className="md:w-3 md:h-3" color="rgba(255,255,255,0.4)" />
                        </div>
                      )}
                      <sub.icon size={24} className="md:w-7 md:h-7" color={isActive ? sub.color : "rgba(255,255,255,0.5)"} style={{ filter: isActive ? `drop-shadow(0 0 8px ${sub.color})` : "none", transition: "all 0.3s" }} />
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: isActive ? "white" : "rgba(255,255,255,0.5)" }}>{sub.name}</span>
                      {!sub.locked && (
                        <span className="text-[8px] md:text-[9px] font-bold" style={{ color: isActive ? sub.color : "rgba(255,255,255,0.3)" }}>{sub.questions} QS</span>
                      )}
                      {sub.locked && (
                        <span className="text-[8px] md:text-[9px] font-bold text-purple-500">PRO</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Enter Arena */}
              <button className="arena-btn glow-pulse py-4 md:py-5 text-base md:text-lg" onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)}>
                ENTER ARENA <Play size={18} className="md:w-5 md:h-5" fill="white" />
              </button>
            </div>

            {/* 🆕 PERFORMANCE ANALYTICS */}
            <div className="card p-5 md:p-7">
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <BarChart2 size={14} className="md:w-4 md:h-4" color="#22d3ee" />
                <h3 className="text-[9px] md:text-[11px] font-black tracking-widest uppercase opacity-70">Performance This Week</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Battles",  value: 18,   suffix: "",   color: "#22d3ee", icon: Swords    },
                  { label: "Correct",  value: 142,  suffix: "",   color: "#34d399", icon: CheckCircle },
                  { label: "XP Earned", value: 2340, suffix: "",   color: "#f59e0b", icon: Zap       },
                  { label: "Rank ▲",   value: 3,     suffix: " ↑", color: "#a855f7", icon: ChevronUp },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
                    <s.icon size={16} className="md:w-[18px] md:h-[18px] mx-auto mb-2" color={s.color} />
                    <p className="text-lg md:text-[22px] font-black mb-0.5" style={{ color: s.color }}>{s.value.toLocaleString()}{s.suffix}</p>
                    <p className="text-[8px] md:text-[9px] opacity-40 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────
              RIGHT COLUMN
          ───────────────────────────────────────────── */}
          <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-5">

            {/* Leaderboard */}
            <div className="card p-5 md:p-6 border-l-[3px] border-sky-500/50">
              <div className="flex justify-between items-center mb-4 md:mb-5">
                <h3 className="text-[9px] md:text-[11px] font-black tracking-widest uppercase opacity-60 flex items-center gap-2">
                  <Trophy size={12} className="md:w-3.5 md:h-3.5" color="#f59e0b" /> Global Elite
                </h3>
                <span className="text-[8px] md:text-[9px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full">S-RANK</span>
              </div>
              <div className="flex flex-col gap-1.5 md:gap-2">
                {LEADERBOARD.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl transition-all cursor-pointer" style={{ background: i === 0 ? "rgba(34,211,238,0.05)" : "transparent", border: i === 0 ? "1px solid rgba(34,211,238,0.1)" : "1px solid transparent" }}
                    onMouseEnter={e => { if (i !== 0) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (i !== 0) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span className="text-xs md:text-[13px] font-black italic min-w-[20px] md:min-w-[24px]" style={{ color: i === 0 ? "#22d3ee" : "rgba(255,255,255,0.4)" }}>{p.rank}</span>
                    <div className="relative shrink-0">
                      <img src={p.avatar} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover" style={{ border: `2px solid ${p.rankInfo.color}` }} alt={p.name} />
                      <span className="absolute -bottom-0.5 -right-0.5 text-[8px] md:text-[10px]">{p.rankInfo.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-[11px] font-extrabold uppercase italic truncate" style={{ color: i === 0 ? "#22d3ee" : "rgba(255,255,255,0.8)" }}>{p.name}</p>
                      <div className="h-[2px] md:h-[3px] bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${100 - i * 12}%`, background: p.rankInfo.color }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] md:text-[11px] font-black text-cyan-400">{p.score}</p>
                      <p className="text-[7px] md:text-[8px] opacity-40 uppercase">EXP</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 p-2 bg-white/5 border border-white/10 rounded-lg text-white/50 text-[9px] md:text-[11px] font-extrabold cursor-pointer uppercase tracking-widest">
                View Full Leaderboard →
              </button>
            </div>

            {/* Daily Quests */}
            <div className="card p-5 md:p-6 border-l-[3px] border-orange-500 bg-orange-500/5">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Flame size={14} className="md:w-4 md:h-4" color="#f97316" />
                <h3 className="text-[9px] md:text-[10px] font-black tracking-widest uppercase">Daily Quests</h3>
                <span className="ml-auto text-[9px] md:text-[10px] text-orange-500 font-extrabold">1/3 Done</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {DAILY_QUESTS.map(q => (
                  <div key={q.id} className="rounded-xl p-3 md:p-3.5" style={{ background: q.done ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${q.done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                    <div className={`flex items-start gap-2.5 ${q.done ? "mb-0" : "mb-2.5"}`}>
                      <q.icon size={14} className="md:w-4 md:h-4 shrink-0 mt-0.5" color={q.done ? "#22c55e" : q.color} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] md:text-xs font-extrabold" style={{ color: q.done ? "#22c55e" : "rgba(255,255,255,0.85)", textDecoration: q.done ? "line-through" : "none" }}>{q.title}</p>
                          <span className="text-[9px] md:text-[10px] font-black" style={{ color: q.color }}>+{q.xp} XP</span>
                        </div>
                        <p className="text-[8px] md:text-[10px] opacity-50 mt-0.5">{q.desc}</p>
                      </div>
                    </div>
                    {!q.done && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] md:text-[9px] opacity-40 uppercase">Progress</span>
                          <span className="text-[8px] md:text-[9px] font-extrabold" style={{ color: q.color }}>{q.progress}/{q.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="quest-bar h-full rounded-full" style={{ width: `${(q.progress / q.total) * 100}%`, background: `linear-gradient(90deg, ${q.color}, ${q.color}aa)` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Fight Teaser */}
            <div className="card p-5 md:p-6 bg-gradient-to-br from-red-500/5 to-purple-600/5 border border-red-500/15 relative overflow-hidden">
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-5 text-7xl md:text-[120px]">💀</div>
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Layers size={14} className="md:w-4 md:h-4" color="#ef4444" />
                <h3 className="text-[9px] md:text-[10px] font-black tracking-widest uppercase opacity-80">Chapter Boss</h3>
                <span className="ml-auto text-[8px] md:text-[9px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded-md font-black">NEW</span>
              </div>
              <p className="text-[11px] md:text-[13px] font-bold text-white/80 mb-1.5">Physics Chapter 3 Boss</p>
              <p className="text-[9px] md:text-[11px] opacity-40 mb-3.5 md:mb-4">10 hard questions. Defeat the boss to earn rare XP!</p>
              <button
                onClick={() => setShowProModal(true)}
                className="w-full py-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 font-black text-[10px] md:text-xs flex items-center justify-center gap-1.5"
              >
                <Lock size={12} /> PRO Feature
              </button>
            </div>
            
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 md:mt-[60px] pt-6 border-t border-white/5 text-center opacity-20">
          <p className="font-logo text-[8px] md:text-[10px] tracking-[1em] md:tracking-[1.5em] text-cyan-400 uppercase">
            RankPush Pro // Level Up // 2026
          </p>
        </footer>
      </div>
    </>
  );
}