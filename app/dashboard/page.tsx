"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Zap, Trophy, Swords, Bell, Target,
  Brain, Play, Crown, Flame, LayoutDashboard,
  Atom, FlaskConical, Sigma, Dna, Quote,
  Sword, LogOut, X, CheckCircle, Lock,
  TrendingUp, Award, Sparkles,
  ChevronUp, BarChart2, Clock, Crosshair,
  Layers, Wifi, Timer, ChevronDown, User,
  Settings, Shield, Star, BookOpen,
  Eye, EyeOff, Copy, ExternalLink, Edit3,
  Activity, Calendar, GitBranch, ArrowRight,
  ChevronRight, Medal, Moon, Sunrise
} from "lucide-react";

// ============================================================
// TYPES & CONSTANTS
// ============================================================
type Plan = "free" | "pro";
type RankId = "e" | "d" | "c" | "b" | "a" | "s" | "national" | "shadow_monarch";

interface RankInfo {
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

const RANKS: RankInfo[] = [
  { id: "e", name: "E-Rank", title: "Weakest Hunter", color: "#6b7280", glowColor: "rgba(107,114,128,0.4)", bgColor: "rgba(107,114,128,0.08)", icon: "🪨", minXP: 0, maxXP: 1999, description: "The starting point. Every Shadow Lord began here." },
  { id: "d", name: "D-Rank", title: "Awakened Hunter", color: "#b45309", glowColor: "rgba(180,83,9,0.4)", bgColor: "rgba(180,83,9,0.08)", icon: "🔰", minXP: 2000, maxXP: 5999, description: "Awakening confirmed. The system acknowledges your power." },
  { id: "c", name: "C-Rank", title: "Gate Raider", color: "#0ea5e9", glowColor: "rgba(14,165,233,0.4)", bgColor: "rgba(14,165,233,0.08)", icon: "🌀", minXP: 6000, maxXP: 13999, description: "You raid dungeons others fear. Gates tremble at your approach." },
  { id: "b", name: "B-Rank", title: "Elite Fighter", color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)", bgColor: "rgba(34,211,238,0.08)", icon: "⚡", minXP: 14000, maxXP: 27999, description: "Elite class. Guild leaders take notice of your strength." },
  { id: "a", name: "A-Rank", title: "Dungeon Breaker", color: "#a855f7", glowColor: "rgba(168,85,247,0.4)", bgColor: "rgba(168,85,247,0.08)", icon: "💜", minXP: 28000, maxXP: 49999, description: "Ranked among the nation's finest. Dungeons fall before you." },
  { id: "s", name: "S-Rank", title: "Sovereign Hunter", color: "#f59e0b", glowColor: "rgba(245,158,11,0.5)", bgColor: "rgba(245,158,11,0.08)", icon: "👑", minXP: 50000, maxXP: 79999, description: "The pinnacle of mankind. Only the chosen few reach this rank." },
  { id: "national", name: "National Level", title: "Absolute Monarch", color: "#ec4899", glowColor: "rgba(236,72,153,0.5)", bgColor: "rgba(236,72,153,0.08)", icon: "🔱", minXP: 80000, maxXP: 119999, description: "Transcends all ranks. A force capable of protecting nations." },
  { id: "shadow_monarch", name: "Shadow Monarch", title: "Arise.", color: "#c084fc", glowColor: "rgba(192,132,252,0.6)", bgColor: "rgba(192,132,252,0.08)", icon: "⚔️", minXP: 120000, maxXP: Infinity, description: "The king of all shadows. None stand above you." },
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

const SUBJECTS = [
  { name: "Physics", icon: Atom, color: "#22d3ee", locked: false, questions: 48 },
  { name: "Chemistry", icon: FlaskConical, color: "#a78bfa", locked: false, questions: 36 },
  { name: "Math", icon: Sigma, color: "#34d399", locked: true, questions: 0 },
  { name: "Biology", icon: Dna, color: "#f87171", locked: true, questions: 0 },
];

const DAILY_QUESTS = [
  { id: 1, title: "Physics Mastery", desc: "Solve 20 MCQ", xp: 500, progress: 12, total: 20, icon: Atom, color: "#22d3ee", done: false },
  { id: 2, title: "Speed Demon", desc: "Answer in <5s × 10", xp: 300, progress: 10, total: 10, icon: Clock, color: "#f59e0b", done: true },
  { id: 3, title: "Combo Master", desc: "Get 5x combo streak", xp: 400, progress: 3, total: 5, icon: Flame, color: "#f87171", done: false },
];

const LEADERBOARD = [
  { name: "S-Rank_Slayer", score: "24,500", rank: "01", avatar: "https://i.pravatar.cc/150?u=slayer", rankInfo: RANKS[7] },
  { name: "ZeroOne", score: "22,100", rank: "02", avatar: "https://i.pravatar.cc/150?u=zeroone", rankInfo: RANKS[6] },
  { name: "GhostVibes", score: "19,850", rank: "03", avatar: "https://i.pravatar.cc/150?u=ghost", rankInfo: RANKS[5] },
  { name: "NightCrawler", score: "17,200", rank: "04", avatar: "https://i.pravatar.cc/150?u=night", rankInfo: RANKS[4] },
  { name: "PhantomX", score: "15,900", rank: "05", avatar: "https://i.pravatar.cc/150?u=phantom", rankInfo: RANKS[3] },
];

const ACHIEVEMENTS = [
  { title: "First Blood", desc: "Complete first battle", icon: "🩸", unlocked: true, xp: 100 },
  { title: "Speed Freak", desc: "10 answers under 3s", icon: "⚡", unlocked: true, xp: 200 },
  { title: "Combo God", desc: "20x combo streak", icon: "🔥", unlocked: false, xp: 500 },
  { title: "Scholar", desc: "100 questions solved", icon: "📚", unlocked: false, xp: 1000 },
  { title: "Gate Opener", desc: "Reach B-Rank", icon: "🌀", unlocked: false, xp: 2000 },
  { title: "Shadow Army", desc: "7-day streak", icon: "👥", unlocked: false, xp: 800 },
];

const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_DONE = [true, true, true, true, false, false, false];

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
// LOADING SKELETON
// ============================================================
function DashboardSkeleton() {
  return (
    <div className="min-h-screen px-4 md:px-6 py-6 md:py-8 max-w-[1920px] mx-auto">
      <div className="skeleton h-12 w-full rounded-xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
        <div className="lg:col-span-8 xl:col-span-6 space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
        <div className="lg:col-span-12 xl:col-span-3 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RANK BADGE
// ============================================================
const RankBadge = React.memo(function RankBadge({ rank, size = "md" }: { rank: RankInfo; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: { px: "8px 12px", fs: 9, icon: 14 }, md: { px: "10px 16px", fs: 11, icon: 18 }, lg: { px: "14px 22px", fs: 14, icon: 24 } };
  const s = sizes[size];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: s.px, borderRadius: 30,
      background: rank.bgColor, border: `1px solid ${rank.color}44`,
      boxShadow: `0 0 16px ${rank.glowColor}`,
    }}>
      <span style={{ fontSize: s.icon }}>{rank.icon}</span>
      <div>
        <p style={{
          fontFamily: "var(--font-orbitron), Orbitron, sans-serif", fontSize: s.fs, fontWeight: 900,
          letterSpacing: "0.12em", color: rank.color, lineHeight: 1,
        }}>{rank.name}</p>
        {size === "lg" && (
          <p style={{ fontSize: 10, color: `${rank.color}99`, marginTop: 2, letterSpacing: "0.06em" }}>{rank.title}</p>
        )}
      </div>
    </div>
  );
});

// ============================================================
// MODALS
// ============================================================
const RankModal = React.memo(function RankModal({ onClose, currentXP }: { onClose: () => void; currentXP: number }) {
  const currentRank = getRankByXP(currentXP);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" style={{ backdropFilter: "blur(8px)" }}>
      <div className="bg-[#080613] border border-white/10 rounded-3xl max-w-[520px] w-full p-7 max-h-[85vh] overflow-y-auto relative"
        style={{ animation: "streakPop 0.2s ease" }}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/5 border-none text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.2em] text-[#22d3ee] mb-2" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>SYSTEM · RANK PROGRESSION</p>
          <h2 className="text-xl font-black tracking-[0.1em]" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>Hunter Rank System</h2>
        </div>
        <div className="flex flex-col gap-2">
          {RANKS.map((r) => {
            const isCurrent = r.id === currentRank.id;
            const isUnlocked = currentXP >= r.minXP;
            return (
              <div key={r.id} className="rank-card-hover p-3.5 rounded-xl" style={{
                background: isCurrent ? r.bgColor : "rgba(255,255,255,0.02)",
                border: isCurrent ? `1px solid ${r.color}66` : "1px solid rgba(255,255,255,0.05)",
                opacity: isUnlocked ? 1 : 0.45,
                boxShadow: isCurrent ? `0 0 20px ${r.glowColor}` : "none",
              }}>
                <div className="flex items-center gap-3.5">
                  <span className="text-xl w-8 text-center">{r.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-black tracking-[0.1em]" style={{ color: r.color, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>{r.name}</p>
                      <p className="text-[10px] italic" style={{ color: `${r.color}88` }}>{r.title}</p>
                      {isCurrent && <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-[0.06em]" style={{ background: r.bgColor, border: `1px solid ${r.color}44`, color: r.color }}>CURRENT</span>}
                    </div>
                    <p className="text-[10px] text-white/35">{r.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-extrabold text-white/40">
                      {r.maxXP === Infinity ? `${r.minXP.toLocaleString()}+` : `${r.minXP.toLocaleString()} – ${r.maxXP.toLocaleString()}`}
                    </p>
                    <p className="text-[9px] text-white/20">XP</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const ProfileModal = React.memo(function ProfileModal({ onClose, user, stats }: { onClose: () => void; user: any; stats: typeof MOCK_STATS }) {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "achievements">("overview");
  const rank = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct = getXPProgress(stats.xp, rank);

  const tabStyle = (t: string) => ({
    flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
    fontFamily: "var(--font-orbitron), Orbitron, sans-serif", fontSize: 9, fontWeight: 900,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    background: activeTab === t ? "rgba(34,211,238,0.1)" : "transparent",
    border: activeTab === t ? "1px solid rgba(34,211,238,0.3)" : "1px solid transparent",
    color: activeTab === t ? "#22d3ee" : "rgba(255,255,255,0.3)",
    transition: "all 0.2s",
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" style={{ backdropFilter: "blur(8px)" }}>
      <div className="bg-[#06040f] border border-white/8 rounded-[28px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto relative"
        style={{ animation: "streakPop 0.25s ease" }}>
        <div className="h-[120px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${rank.bgColor}, rgba(0,0,0,0))`, borderBottom: `1px solid ${rank.color}22` }}>
          <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full opacity-[0.06]" style={{ background: rank.color, filter: "blur(40px)" }} />
          <div className="absolute bottom-2 right-4 text-5xl font-black opacity-[0.06] tracking-tighter" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>{rank.name.toUpperCase()}</div>
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 border border-white/10 text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-7 -mt-12">
          <div className="flex items-end gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="w-[88px] h-[88px] rounded-full overflow-hidden" style={{ border: `3px solid ${rank.color}`, boxShadow: `0 0 24px ${rank.glowColor}` }}>
                <img src={user?.photoURL || "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"} className="w-full h-full object-cover" alt="avatar" />
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-lg px-1.5 py-0.5 text-[9px] font-black border-2 border-[#06040f]"
                style={{ background: `linear-gradient(135deg,${rank.color},${rank.color}bb)`, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                LVL {stats.level}
              </div>
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-lg font-black tracking-[0.05em] mb-1.5" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                {user?.displayName || "CYBER HUNTER"}
              </h2>
              <RankBadge rank={rank} size="sm" />
            </div>
          </div>

          {/* XP Bar */}
          <div className="bg-white/5 border border-white/7 rounded-xl px-4 py-3.5 mb-5">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-lg font-black" style={{ color: rank.color, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>{stats.xp.toLocaleString()}</span>
                <span className="text-[11px] text-white/40 ml-1.5">XP</span>
              </div>
              {nextRank && (
                <div className="text-right">
                  <p className="text-[9px] text-white/30 tracking-[0.08em]">NEXT RANK</p>
                  <p className="text-[11px] font-extrabold" style={{ color: nextRank.color, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>{nextRank.name}</p>
                </div>
              )}
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="xp-bar h-full rounded-full" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}bb)`, boxShadow: `0 0 8px ${rank.glowColor}` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-white/25">{xpPct}% to {nextRank?.name || "MAX"}</span>
              {nextRank && <span className="text-[9px] text-white/25">{(nextRank.minXP - stats.xp).toLocaleString()} XP needed</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/3 rounded-xl p-1 mb-4">
            {(["overview", "stats", "achievements"] as const).map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { l: "Member since", v: stats.joinDate, icon: Calendar, c: "#22d3ee" },
                  { l: "Total battles", v: stats.totalBattles, icon: Swords, c: "#f59e0b" },
                  { l: "Hours studied", v: `${stats.totalHoursStudied}h`, icon: Clock, c: "#a855f7" },
                  { l: "Daily streak", v: `${stats.streak} days 🔥`, icon: Flame, c: "#f97316" },
                ].map(item => (
                  <div key={item.l} className="bg-white/3 border border-white/6 rounded-xl p-3 flex items-center gap-2.5">
                    <item.icon size={16} color={item.c} className="shrink-0" />
                    <div>
                      <p className="text-[9px] text-white/30 tracking-[0.06em] uppercase">{item.l}</p>
                      <p className="text-[13px] font-extrabold text-white mt-0.5">{item.v}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white/2 border border-white/5 rounded-xl p-4">
                <p className="text-[9px] tracking-[0.1em] text-white/30 uppercase mb-3">Rank Journey</p>
                <div className="flex items-center gap-0">
                  {RANKS.map((r, i) => {
                    const unlocked = stats.xp >= r.minXP;
                    const isCurrent = r.id === getRankByXP(stats.xp).id;
                    return (
                      <React.Fragment key={r.id}>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="flex items-center justify-center rounded-full transition-all" style={{
                            width: isCurrent ? 34 : 26, height: isCurrent ? 34 : 26,
                            background: unlocked ? r.bgColor : "rgba(255,255,255,0.04)",
                            border: isCurrent ? `2px solid ${r.color}` : unlocked ? `1px solid ${r.color}55` : "1px solid rgba(255,255,255,0.08)",
                            fontSize: isCurrent ? 16 : 12,
                            boxShadow: isCurrent ? `0 0 14px ${r.glowColor}` : "none",
                          }}>{r.icon}</div>
                          {isCurrent && <div className="w-1 h-1 rounded-full" style={{ background: r.color }} />}
                        </div>
                        {i < RANKS.length - 1 && (
                          <div className="h-px flex-1 min-w-[4px]" style={{ background: stats.xp >= RANKS[i + 1].minXP ? `linear-gradient(90deg, ${r.color}66, ${RANKS[i + 1].color}66)` : "rgba(255,255,255,0.06)" }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { l: "Questions attempted", v: stats.questionsAttempted.toLocaleString(), c: "#22d3ee" },
                  { l: "Correct answers", v: stats.correctAnswers.toLocaleString(), c: "#34d399" },
                  { l: "Accuracy", v: `${stats.accuracy}%`, c: "#f59e0b" },
                  { l: "Total XP earned", v: stats.xp.toLocaleString(), c: "#a855f7" },
                ].map(s => (
                  <div key={s.l} className="bg-white/3 border border-white/6 rounded-xl p-3.5 text-center">
                    <p className="text-xl font-black" style={{ color: s.c, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>{s.v}</p>
                    <p className="text-[9px] text-white/30 mt-1 uppercase tracking-[0.06em]">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/2 border border-white/5 rounded-xl p-4">
                <p className="text-[9px] tracking-[0.1em] text-white/30 uppercase mb-3.5">Neural Attributes</p>
                {[
                  { l: "Accuracy", v: stats.accuracy, d: `${stats.accuracy}%`, c: "#22d3ee" },
                  { l: "Speed", v: stats.speed, d: `${stats.speed}%`, c: "#0ea5e9" },
                  { l: "Logic", v: stats.logic, d: `${stats.logic}%`, c: "#34d399" },
                  { l: "Focus", v: stats.focus, d: `${stats.focus}%`, c: "#a855f7" },
                ].map(a => (
                  <div key={a.l} className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-white/50 tracking-[0.06em] uppercase">{a.l}</span>
                      <span className="text-[10px] font-extrabold" style={{ color: a.c }}>{a.d}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="stat-bar h-full rounded-full" style={{ width: `${a.v}%`, background: a.c, boxShadow: `0 0 6px ${a.c}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map(a => (
                <div key={a.title} className="rounded-xl p-3.5 text-center" style={{
                  background: a.unlocked ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${a.unlocked ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}`,
                  opacity: a.unlocked ? 1 : 0.45,
                }}>
                  <div className="text-2xl mb-2">{a.icon}</div>
                  <p className="text-[10px] font-extrabold mb-0.5" style={{ color: a.unlocked ? "#22d3ee" : "white" }}>{a.title}</p>
                  <p className="text-[9px] text-white/35 mb-1.5">{a.desc}</p>
                  <p className="text-[9px] font-extrabold text-[#f59e0b]">+{a.xp} XP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ProUpgradeModal = React.memo(function ProUpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/88" style={{ backdropFilter: "blur(8px)" }}>
      <div className="bg-gradient-to-br from-[#0a0f1e] to-[#111827] border border-[#a855f7]/40 rounded-3xl max-w-[420px] w-full p-8 relative"
        style={{ boxShadow: "0 0 60px rgba(168,85,247,0.2)", animation: "streakPop 0.2s ease" }}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/5 border-none text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">👑</div>
          <h2 className="text-[22px] text-[#a855f7] mb-2" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>UPGRADE TO PRO</h2>
          <p className="text-white/50 text-[13px]">Unlock your full potential</p>
        </div>
        <div className="flex flex-col gap-2.5 mb-6">
          {["Unlimited questions — all subjects", "S-Rank & above unlocked", "Rival Battle System (1v1 real-time)", "Boss Fight mode", "Detailed analytics & heatmaps", "Unlimited power-ups"].map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <CheckCircle size={16} color="#a855f7" />
              <span className="text-white/80 text-[13px]">{f}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2.5">
          <button className="flex-1 py-3.5 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] border-none rounded-xl text-white font-black text-sm cursor-pointer hover:opacity-90 transition-opacity">
            ৳১৯৯/month
          </button>
          <button className="flex-1 py-3.5 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-xl text-[#a855f7] font-black text-sm cursor-pointer hover:bg-[#a855f7]/20 transition-colors">
            ৳১৪৯৯/year
          </button>
        </div>
        <p className="text-center text-white/30 text-[11px] mt-3">bKash • Nagad • Card accepted</p>
      </div>
    </div>
  );
});

const RivalModal = React.memo(function RivalModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = "https://rank-push.vercel.app/rival/abc123";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/88" style={{ backdropFilter: "blur(8px)" }}>
      <div className="bg-gradient-to-br from-[#0a0f1e] to-[#111827] border border-[#ef4444]/40 rounded-3xl max-w-[400px] w-full p-8 relative"
        style={{ animation: "streakPop 0.2s ease" }}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/5 border-none text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚔️</div>
          <h2 className="text-xl text-[#ef4444] mb-2" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>RIVAL BATTLE</h2>
          <p className="text-white/50 text-[13px]">Challenge a friend to 1v1 MCQ battle</p>
        </div>
        <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl p-3 mb-4 break-all text-xs text-white/60">
          {link}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="w-full py-3.5 rounded-xl text-white font-black text-sm cursor-pointer transition-all"
          style={{ background: copied ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #dc2626, #ef4444)", border: copied ? "1px solid #22c55e" : "none" }}
        >
          {copied ? "✓ Copied!" : "Copy Battle Link"}
        </button>
        <p className="text-center text-white/30 text-[11px] mt-3">PRO feature — Share via WhatsApp</p>
      </div>
    </div>
  );
});

// ============================================================
// NOTIFICATION DROPDOWN
// ============================================================
const NotificationDropdown = React.memo(function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = [
    { msg: "You ranked up to B-Rank! ⚡", time: "2m ago", color: "#22d3ee" },
    { msg: "Daily quest reset — new challenges!", time: "1h ago", color: "#f59e0b" },
    { msg: "ZeroOne challenged you ⚔️", time: "3h ago", color: "#ef4444" },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notif-dropdown')) onClose();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div className="notif-dropdown absolute top-12 -right-14 md:right-0 w-[270px] md:w-72 bg-[#0d1420] border border-white/10 rounded-2xl p-4 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      style={{ animation: "streakPop 0.15s ease" }}>
      {notifications.map((n, i) => (
        <div key={i} className={`py-2.5 ${i < 2 ? "border-b border-white/5" : ""}`}>
          <p className="text-xs text-white/80 mb-1">{n.msg}</p>
          <p className="text-[10px]" style={{ color: n.color }}>{n.time}</p>
        </div>
      ))}
    </div>
  );
});

// ============================================================
// MOBILE MENU
// ============================================================
const MobileMenu = React.memo(function MobileMenu({ onClose, onProfile, onArena, onTimer }: { onClose: () => void; onProfile: () => void; onArena: () => void; onTimer: () => void }) {
  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, fn: () => onClose(), active: true },
    { label: "Profile", icon: User, fn: () => { onProfile(); onClose(); } },
    { label: "Battle Arena", icon: Swords, fn: () => { onArena(); onClose(); } },
    { label: "Shadow Focus", icon: Timer, fn: () => { onTimer(); onClose(); } },
    { label: "Leaderboard", icon: Trophy, fn: () => {} },
    { label: "Analytics", icon: BarChart2, fn: () => {} },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-menu-container')) onClose();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div className="mobile-menu-container absolute top-full left-0 mt-4 w-64 bg-[#0a0f1e]/95 border border-white/10 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1"
      style={{ animation: "streakPop 0.15s ease" }}>
      {menuItems.map(item => (
        <button key={item.label} onClick={item.fn}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs tracking-widest uppercase transition-colors ${
            item.active ? "bg-cyan-400/10 text-cyan-400" : "hover:bg-white/5 text-white/60 hover:text-white"
          }`}>
          <item.icon size={15} /> {item.label}
        </button>
      ))}
    </div>
  );
});

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function RankPushDashboard() {
  const [selectedSub, setSelectedSub] = useState("Physics");
  const [user, setUser] = useState<any>(null);
  const [showProModal, setShowProModal] = useState(false);
  const [showRivalModal, setShowRivalModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [isMobileMenuOpen, setMobileMenu] = useState(false);
  const [animXP, setAnimXP] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const stats = MOCK_STATS;
  const rank = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct = getXPProgress(stats.xp, rank);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // XP animation - optimized with requestAnimationFrame
  useEffect(() => {
    if (!isClient) return;
    const duration = 800;
    const startTime = performance.now();
    const end = stats.xp;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimXP(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isClient, stats.xp]);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    router.push("/");
  }, [router]);

  const handleArenaNavigation = useCallback(() => {
    router.push(`/arena/${selectedSub.toLowerCase()}`);
  }, [router, selectedSub]);

  const handleTimerNavigation = useCallback(() => {
    router.push("/timer");
  }, [router]);

  const toggleNotif = useCallback(() => setShowNotif(prev => !prev), []);
  const toggleMobileMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileMenu(prev => !prev);
  }, []);

  // Show skeleton during SSR/hydration
  if (!isClient) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {/* Modals */}
      {showProModal && <ProUpgradeModal onClose={() => setShowProModal(false)} />}
      {showRivalModal && <RivalModal onClose={() => setShowRivalModal(false)} />}
      {showRankModal && <RankModal onClose={() => setShowRankModal(false)} currentXP={stats.xp} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} user={user} stats={stats} />}

      {/* Ambient BG - Simplified, no heavy blur on mobile */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-[0.05]"
          style={{ background: '#0ea5e9', filter: 'blur(100px)' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-[0.04]"
          style={{ background: rank.color, filter: 'blur(100px)' }} />
      </div>

      <div className="min-h-screen px-4 md:px-6 py-6 md:py-8 relative z-10 max-w-[1920px] mx-auto">

        {/* ═══ HEADER ═══ */}
        <header className="flex justify-between items-center mb-8 md:mb-10">
          <div className="flex items-center gap-6 md:gap-10">
            {/* Logo */}
            <div className="relative">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={toggleMobileMenu}>
                <div className="p-2 md:p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20 group-hover:scale-105 transition-transform">
                  <Swords size={18} color="white" />
                </div>
                <span className="text-lg md:text-[22px] tracking-tight text-white" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>RANKPUSH</span>
                <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 xl:hidden ${isMobileMenuOpen ? "rotate-180" : ""}`} />
              </div>
              {isMobileMenuOpen && (
                <MobileMenu
                  onClose={() => setMobileMenu(false)}
                  onProfile={() => setShowProfile(true)}
                  onArena={handleArenaNavigation}
                  onTimer={handleTimerNavigation}
                />
              )}
            </div>

            {/* Desktop nav */}
            <nav className="hidden xl:flex gap-7">
              <span className="nav-link active cursor-pointer">Dashboard</span>
              <span className="nav-link cursor-pointer" onClick={handleArenaNavigation}>Battle Arena</span>
              <span className="nav-link cursor-pointer" onClick={handleTimerNavigation}>Shadow Focus</span>
              <span className="nav-link cursor-pointer">Leaderboard</span>
              <span className="nav-link cursor-pointer">Analytics</span>
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
              <TrendingUp size={14} color="#22c55e" />
              <span className="text-[11px] font-extrabold text-green-500 tracking-widest">+{stats.weeklyXP.toLocaleString()} THIS WEEK</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 8px #22c55e" }} />
              <span className="text-[11px] font-extrabold tracking-widest opacity-70">3,892 ONLINE</span>
            </div>
            {/* Notifications */}
            <div className="relative">
              <button onClick={toggleNotif} className="bg-white/5 border border-white/10 rounded-xl p-2.5 cursor-pointer text-white flex hover:bg-white/10 transition-colors">
                <Bell size={18} />
              </button>
              <div className="badge-bounce absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#02010a]">3</div>
              {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
            </div>
            {stats.plan === "free" ? (
              <button onClick={() => setShowProModal(true)} className="bg-gradient-to-br from-violet-600 to-purple-500 border-none rounded-xl px-3 py-2 md:px-4 md:py-2.5 cursor-pointer text-white font-black text-[10px] md:text-xs tracking-widest flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                <Crown size={14} /> <span className="hidden sm:inline">GO PRO</span>
              </button>
            ) : (
              <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl px-3 py-2 text-[10px] font-black tracking-widest flex items-center gap-1.5">
                <Crown size={14} /> PRO
              </div>
            )}
            <button onClick={handleSignOut} className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 cursor-pointer text-red-500 flex hover:bg-red-500/20 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

            {/* ★ PLAYER CARD */}
            <div className="card p-6 md:p-7 text-center relative overflow-hidden gpu-layer" style={{ borderTop: `3px solid ${rank.color}` }}>
              <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full pointer-events-none"
                style={{ background: rank.color, opacity: 0.06, filter: "blur(50px)" }} />

              <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full cursor-pointer hover:scale-105 transition-transform gpu-layer"
                style={{ border: `2px solid ${rank.color}`, boxShadow: `0 0 24px ${rank.glowColor}` }}
                onClick={() => setShowProfile(true)}>
                <img src={user?.photoURL || "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"}
                  className="w-full h-full rounded-full object-cover" alt="Profile" />
                <div className="absolute -bottom-1 -right-1 rounded-lg px-1.5 py-0.5 text-[8px] font-black border-2 border-[#02010a]"
                  style={{ background: `linear-gradient(135deg,${rank.color},${rank.color}bb)`, fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                  LVL {stats.level}
                </div>
              </div>

              <h2 className="text-base md:text-lg tracking-wide mb-3 text-white" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                {user?.displayName || "CYBER HUNTER"}
              </h2>

              <div className="flex justify-center mb-4">
                <button onClick={() => setShowRankModal(true)} className="bg-transparent border-none cursor-pointer p-0">
                  <RankBadge rank={rank} size="md" />
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-full px-5 py-2 inline-flex items-center gap-2 mb-4">
                <span className="font-black text-sm md:text-base text-white">{animXP.toLocaleString()}</span>
                <span className="text-cyan-400 font-black text-[10px]">EXP</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[9px] font-extrabold opacity-40 uppercase tracking-widest">Next: {nextRank?.name || "MAX"}</span>
                  <span className="text-[9px] font-extrabold text-cyan-400">{xpPct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="xp-bar h-full rounded-full" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg,${rank.color},${rank.color}cc)`, boxShadow: `0 0 8px ${rank.glowColor}` }} />
                </div>
                {nextRank && (
                  <p className="text-[9px] text-right mt-1 opacity-30">{(nextRank.minXP - stats.xp).toLocaleString()} XP to {nextRank.name}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                {[
                  { l: "Battles", v: stats.totalBattles },
                  { l: "Streak", v: `${stats.streak}🔥` },
                  { l: "Accuracy", v: `${stats.accuracy}%` },
                ].map(s => (
                  <div key={s.l}>
                    <p className="text-sm font-black text-white">{s.v}</p>
                    <p className="text-[8px] opacity-35 uppercase tracking-widest mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowProfile(true)}
                className="w-full mt-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                <User size={11} /> View Full Profile
              </button>
            </div>

            {/* Neural Attributes */}
            <div className="card p-5 md:p-6 gpu-layer">
              <h3 className="text-[9px] font-black tracking-widest opacity-50 uppercase mb-5 flex items-center gap-2">
                <Brain size={13} color="#22d3ee" /> Neural Attributes
              </h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { l: "Accuracy", v: stats.accuracy, d: `${stats.accuracy}%`, c: "#22d3ee" },
                  { l: "Speed", v: stats.speed, d: `${stats.speed}%`, c: "#0ea5e9" },
                  { l: "IQ", v: 75, d: `${stats.iq}`, c: "rgba(255,255,255,0.7)" },
                  { l: "Logic", v: stats.logic, d: `${stats.logic}%`, c: "#34d399" },
                  { l: "Focus", v: stats.focus, d: `${stats.focus}%`, c: "#a855f7" },
                ].map(s => (
                  <div key={s.l}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{s.l}</span>
                      <span className="text-[9px] font-black" style={{ color: s.c }}>{s.d}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="stat-bar h-full rounded-full" style={{ width: `${s.v}%`, background: s.c, boxShadow: `0 0 6px ${s.c}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Streak */}
            <div className="card p-5 md:p-6 border-l-[3px] border-amber-500 bg-amber-500/5 gpu-layer">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} color="#f59e0b" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Daily Streak</h3>
                <span className="ml-auto text-lg font-black text-amber-500">{stats.streak} 🔥</span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                {STREAK_DAYS.map((d, i) => (
                  <div key={i} className="streak-pip flex-1 text-center" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="h-7 md:h-8 rounded-lg flex items-center justify-center mb-1"
                      style={{
                        background: STREAK_DONE[i] ? "#f59e0b" : "rgba(255,255,255,0.05)",
                        border: STREAK_DONE[i] ? "none" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: STREAK_DONE[i] ? "0 0 10px rgba(245,158,11,0.4)" : "none"
                      }}>
                      {STREAK_DONE[i] && <span className="text-[10px]">✓</span>}
                    </div>
                    <span className="text-[8px] font-bold opacity-40 uppercase">{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements - Desktop only */}
            <div className="card p-5 hidden lg:block gpu-layer">
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} color="#f59e0b" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Achievements</h3>
                <span className="ml-auto text-[9px] text-cyan-400 font-extrabold">2/6</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.slice(0, 4).map(a => (
                  <div key={a.title} className="rounded-xl p-2.5 text-center"
                    style={{
                      background: a.unlocked ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${a.unlocked ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.05)"}`,
                      opacity: a.unlocked ? 1 : 0.4
                    }}>
                    <div className="text-xl mb-1.5">{a.icon}</div>
                    <p className="text-[9px] font-extrabold mb-0.5" style={{ color: a.unlocked ? "#22d3ee" : "white" }}>{a.title}</p>
                    <p className="text-[8px] opacity-40">{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Directive - Desktop only */}
            <div className="card p-5 border-l-[3px] border-emerald-400 bg-emerald-400/5 hidden lg:block gpu-layer">
              <div className="flex items-center gap-2 mb-3 opacity-70">
                <Quote size={14} color="#34d399" />
                <h3 className="text-[9px] font-black tracking-widest uppercase">Daily Directive</h3>
              </div>
              <p className="text-[13px] italic font-semibold leading-relaxed text-white/80 mb-2">
                "Seek knowledge from the cradle to the grave."
              </p>
              <p className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">— PROPHET MUHAMMAD (PBUH)</p>
            </div>
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-5">

            {/* Hero Banner */}
            <div className="card p-6 md:p-11 bg-gradient-to-br from-sky-500/10 to-purple-600/5 border-t-[3px] border-sky-500 relative overflow-hidden gpu-layer">
              <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-[0.04]">
                <LayoutDashboard size={220} />
              </div>
              <div className="absolute right-5 bottom-0 text-[110px] opacity-[0.04] pointer-events-none leading-none"
                style={{ animation: "floatY 4s ease-in-out infinite" }}>⚔️</div>
              <div className="relative z-10">
                <p className="text-[9px] md:text-[11px] font-extrabold tracking-[0.3em] text-cyan-400 uppercase mb-2 md:mb-3 opacity-80">
                  ⚔️ System Status: {rank.title}
                </p>
                <h1 className="text-3xl md:text-5xl lg:text-[56px] italic leading-[0.95] uppercase mb-4 md:mb-5"
                  style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                  DOMINATE<br />
                  <span className="text-[#22d3ee]" style={{ textShadow: "0 0 30px rgba(34,211,238,0.4)" }}>THE META</span>
                </h1>
                <div className="grid grid-cols-2 md:flex flex-wrap gap-3 md:gap-4">
                  {[
                    { label: "Total Battles", value: stats.totalBattles, icon: Swords, color: "#22d3ee" },
                    { label: "Accuracy", value: `${stats.accuracy}%`, icon: Crosshair, color: "#34d399" },
                    { label: "Best Streak", value: `${stats.streak} days`, icon: Flame, color: "#f59e0b" },
                    { label: "Questions", value: stats.questionsAttempted, icon: BookOpen, color: "#a855f7" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-3">
                      <s.icon size={15} color={s.color} />
                      <div>
                        <p className="text-sm font-black" style={{ color: s.color }}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                        <p className="text-[8px] opacity-40 uppercase tracking-widest">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow Focus Banner */}
            <div className="card p-6 md:p-7 border-l-[4px] border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent flex flex-col md:flex-row items-start md:items-center gap-5 gpu-layer"
              style={{ boxShadow: "0 0 30px rgba(168,85,247,0.08)" }}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/15 rounded-xl border border-purple-500/25">
                  <Timer size={24} color="#a855f7" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg text-purple-400 uppercase tracking-wider mb-1"
                    style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>Shadow Focus</h3>
                  <p className="text-[10px] text-white/45 leading-relaxed max-w-[300px]">
                    Enter deep focus mode. Pomodoro or Free Timer — earn bonus XP and climb the daily study leaderboard.
                  </p>
                </div>
              </div>
              <button onClick={handleTimerNavigation}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 20px rgba(168,85,247,0.3)" }}>
                <Play size={14} fill="currentColor" /> Enter Focus
              </button>
            </div>

            {/* Tactical Arena */}
            <div className="card p-5 md:p-8 border-t-[3px] border-sky-500 gpu-layer">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg md:text-[22px] uppercase mb-1" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>
                    Tactical <span className="text-sky-500">Arena</span>
                  </h2>
                  <p className="text-[9px] font-bold opacity-35 uppercase tracking-widest">Select your mastery field</p>
                </div>
                <div className="w-11 h-11 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20"
                  style={{ animation: "floatY 4s ease-in-out infinite" }}>
                  <Swords size={20} color="#22d3ee" />
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {SUBJECTS.map(sub => {
                  const isActive = selectedSub === sub.name;
                  const hex = sub.color.startsWith("#") ? sub.color.slice(1) : "22d3ee";
                  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
                  return (
                    <button key={sub.name} type="button"
                      className={`sub-btn p-4 md:p-6 ${isActive ? "sub-active" : ""} ${sub.locked ? "sub-locked" : ""}`}
                      style={{ "--sub-color": sub.color, "--sub-rgb": `${r},${g},${b}` } as React.CSSProperties}
                      onClick={() => { if (!sub.locked) setSelectedSub(sub.name); else setShowProModal(true); }}>
                      {sub.locked && <div className="absolute top-2 right-2"><Lock size={10} color="rgba(255,255,255,0.35)" /></div>}
                      <sub.icon size={24} color={isActive ? sub.color : "rgba(255,255,255,0.45)"} style={{ filter: isActive ? `drop-shadow(0 0 8px ${sub.color})` : "none", transition: "all 0.3s" }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: isActive ? "white" : "rgba(255,255,255,0.45)" }}>{sub.name}</span>
                      {!sub.locked ? (
                        <span className="text-[8px] font-bold" style={{ color: isActive ? sub.color : "rgba(255,255,255,0.25)" }}>{sub.questions} QS</span>
                      ) : (
                        <span className="text-[8px] font-bold text-purple-500">PRO</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button className="arena-btn" onClick={handleArenaNavigation}>
                ENTER ARENA <Play size={18} fill="white" />
              </button>
            </div>

            {/* Rival Battle */}
            <div className="card p-5 md:p-7 bg-gradient-to-r from-red-500/5 to-transparent border-l-[3px] border-red-500 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 gpu-layer">
              <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shrink-0">
                <Sword size={20} color="#ef4444" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base text-red-500 uppercase mb-1" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>Rival Battle</h3>
                <p className="text-[10px] opacity-45">Challenge a friend to real-time 1v1 MCQ battle</p>
              </div>
              <button onClick={() => stats.plan === "pro" ? setShowRivalModal(true) : setShowProModal(true)}
                className="w-full md:w-auto bg-gradient-to-br from-red-600 to-red-500 border-none rounded-xl py-2.5 px-5 text-white font-black text-[10px] tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                {stats.plan === "pro" ? <><Wifi size={14} /> Find Rival</> : <><Lock size={14} /> PRO Only</>}
              </button>
            </div>

            {/* Performance Analytics */}
            <div className="card p-5 md:p-7 gpu-layer">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={14} color="#22d3ee" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">Performance This Week</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Battles", value: 18, suffix: "", color: "#22d3ee", icon: Swords },
                  { label: "Correct", value: 142, suffix: "", color: "#34d399", icon: CheckCircle },
                  { label: "XP Earned", value: 2340, suffix: "", color: "#f59e0b", icon: Zap },
                  { label: "Rank ▲", value: 3, suffix: " ↑", color: "#a855f7", icon: ChevronUp },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center">
                    <s.icon size={16} className="mx-auto mb-2" color={s.color} />
                    <p className="text-lg md:text-[22px] font-black mb-0.5" style={{ color: s.color }}>{s.value.toLocaleString()}{s.suffix}</p>
                    <p className="text-[8px] opacity-35 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-5">

            {/* Leaderboard */}
            <div className="card p-5 md:p-6 border-l-[3px] border-sky-500/50 gpu-layer">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-60 flex items-center gap-2">
                  <Trophy size={12} color="#f59e0b" /> Global Elite
                </h3>
                <span className="text-[8px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {LEADERBOARD.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                    style={{ background: i === 0 ? "rgba(34,211,238,0.05)" : "transparent", border: i === 0 ? "1px solid rgba(34,211,238,0.1)" : "1px solid transparent" }}>
                    <span className="text-[13px] font-black italic min-w-[24px]" style={{ color: i === 0 ? "#22d3ee" : "rgba(255,255,255,0.35)" }}>{p.rank}</span>
                    <div className="relative shrink-0">
                      <img src={p.avatar} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover" style={{ border: `2px solid ${p.rankInfo.color}` }} alt={p.name} />
                      <span className="absolute -bottom-0.5 -right-0.5 text-[9px]">{p.rankInfo.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-extrabold uppercase italic truncate" style={{ color: i === 0 ? "#22d3ee" : "rgba(255,255,255,0.8)" }}>{p.name}</p>
                      <div className="h-[3px] bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${100 - i * 12}%`, background: p.rankInfo.color }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-cyan-400">{p.score}</p>
                      <p className="text-[7px] opacity-35 uppercase">EXP</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                View Full Leaderboard <ArrowRight size={11} />
              </button>
            </div>

            {/* Daily Quests */}
            <div className="card p-5 md:p-6 border-l-[3px] border-orange-500 bg-orange-500/5 gpu-layer">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Flame size={14} color="#f97316" />
                <h3 className="text-[9px] font-black tracking-widest uppercase">Daily Quests</h3>
                <span className="ml-auto text-[9px] text-orange-500 font-extrabold">1/3 Done</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {DAILY_QUESTS.map(q => (
                  <div key={q.id} className="rounded-xl p-3 md:p-3.5"
                    style={{ background: q.done ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${q.done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                    <div className={`flex items-start gap-2.5 ${q.done ? "mb-0" : "mb-2.5"}`}>
                      <q.icon size={14} className="shrink-0 mt-0.5" color={q.done ? "#22c55e" : q.color} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-extrabold" style={{ color: q.done ? "#22c55e" : "rgba(255,255,255,0.85)", textDecoration: q.done ? "line-through" : "none" }}>{q.title}</p>
                          <span className="text-[9px] font-black" style={{ color: q.color }}>+{q.xp} XP</span>
                        </div>
                        <p className="text-[8px] opacity-45 mt-0.5">{q.desc}</p>
                      </div>
                    </div>
                    {!q.done && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[8px] opacity-35 uppercase">Progress</span>
                          <span className="text-[8px] font-extrabold" style={{ color: q.color }}>{q.progress}/{q.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="quest-bar h-full rounded-full" style={{ width: `${(q.progress / q.total) * 100}%`, background: `linear-gradient(90deg,${q.color},${q.color}aa)` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Fight */}
            <div className="card p-5 md:p-6 bg-gradient-to-br from-red-500/5 to-purple-600/5 border border-red-500/15 relative overflow-hidden gpu-layer">
              <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 text-[110px] opacity-[0.05] leading-none pointer-events-none">💀</div>
              <div className="flex items-center gap-2 mb-2.5">
                <Layers size={14} color="#ef4444" />
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-80">Chapter Boss</h3>
                <span className="ml-auto text-[8px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded-md font-black">NEW</span>
              </div>
              <p className="text-[13px] font-bold text-white/80 mb-1.5">Physics Chapter 3 Boss</p>
              <p className="text-[10px] opacity-35 mb-4">10 hard questions. Defeat the boss to earn rare XP!</p>
              <button onClick={() => setShowProModal(true)} className="w-full py-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 font-black text-[10px] flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-colors cursor-pointer">
                <Lock size={12} /> PRO Feature
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 md:mt-[60px] pt-6 border-t border-white/5 text-center opacity-20">
          <p className="text-[9px] tracking-[1.2em] text-cyan-400 uppercase" style={{ fontFamily: "var(--font-orbitron), Orbitron, sans-serif" }}>RankPush · Shadow System · 2026</p>
        </footer>
      </div>
    </>
  );
}