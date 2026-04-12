// components/dashboard/PlayerSidebar.tsx
// Left column: Player Card, Neural Attributes, Daily Streak,
// Achievements, and the Daily Directive quote card.

"use client";

import React from "react";
import {
  Brain,
  Flame,
  Award,
  Quote,
  Edit3,
  User,
  Swords,
} from "lucide-react";

import {
  RankInfo,
  UserStats,
  ACHIEVEMENTS,
  STREAK_DAYS,
  STREAK_DONE,
} from "./RankSystem";
import { RankBadge, XPProgressBar, StatBar } from "./UIComponents";

// ============================================================
// PROPS
// ============================================================
interface PlayerSidebarProps {
  user: any;
  stats: UserStats;
  rank: RankInfo;
  nextRank: RankInfo | null;
  xpPct: number;
  animXP: number;
  setShowProfile: (v: boolean) => void;
  setShowRankModal: (v: boolean) => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function PlayerSidebar({
  user,
  stats,
  rank,
  nextRank,
  xpPct,
  animXP,
  setShowProfile,
  setShowRankModal,
}: PlayerSidebarProps) {
  return (
    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

      {/* ── Player Card ── */}
      <div
        className="card p-6 md:p-7 text-center relative overflow-hidden"
        style={{ borderTop: `3px solid ${rank.color}` }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: rank.color,
            opacity: 0.06,
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        {/* Avatar */}
        <div
          className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full cursor-pointer hover:scale-105 transition-transform"
          style={{
            border: `2px solid ${rank.color}`,
            boxShadow: `0 0 24px ${rank.glowColor}`,
          }}
          onClick={() => setShowProfile(true)}
        >
          <img
            src={
              user?.photoURL ||
              "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"
            }
            className="w-full h-full rounded-full object-cover"
            alt="Profile"
          />
          {/* Level badge */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              background: `linear-gradient(135deg,${rank.color},${rank.color}bb)`,
              borderRadius: 8,
              padding: "3px 7px",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 8,
              fontWeight: 900,
              border: "2px solid #02010a",
            }}
          >
            LVL {stats.level}
          </div>
          {/* Edit hover overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "1")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "0")
            }
          >
            <Edit3 size={14} color="white" />
          </div>
        </div>

        {/* Name */}
        <h2 className="font-logo text-base md:text-lg tracking-wide mb-3 text-white">
          {user?.displayName || "CYBER HUNTER"}
        </h2>

        {/* Rank Badge — click opens rank progression modal */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowRankModal(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <RankBadge rank={rank} size="md" />
          </button>
        </div>

        {/* Animated XP counter */}
        <div className="bg-white/5 border border-white/10 rounded-full px-5 py-2 inline-flex items-center gap-2 mb-4">
          <span className="font-black text-sm md:text-base text-white">
            {animXP.toLocaleString()}
          </span>
          <span className="text-cyan-400 font-black text-[10px]">EXP</span>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-3">
          <XPProgressBar
            xpPct={xpPct}
            rank={rank}
            nextRank={nextRank}
            currentXP={stats.xp}
            showLabels
          />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
          {[
            { l: "Battles",  v: stats.totalBattles },
            { l: "Streak",   v: `${stats.streak}🔥` },
            { l: "Accuracy", v: `${stats.accuracy}%` },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-sm font-black text-white">{s.v}</p>
              <p className="text-[8px] opacity-35 uppercase tracking-widest mt-0.5">
                {s.l}
              </p>
            </div>
          ))}
        </div>

        {/* Full profile button */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full mt-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors"
        >
          <User size={11} /> View Full Profile
        </button>
      </div>

      {/* ── Neural Attributes ── */}
      <div className="card p-5 md:p-6">
        <h3 className="text-[9px] font-black tracking-widest opacity-50 uppercase mb-5 flex items-center gap-2">
          <Brain size={13} color="#22d3ee" /> Neural Attributes
        </h3>
        <div className="flex flex-col gap-3.5">
          <StatBar
            label="Accuracy"
            value={stats.accuracy}
            display={`${stats.accuracy}%`}
            color="#22d3ee"
          />
          <StatBar
            label="Speed"
            value={stats.speed}
            display={`${stats.speed}%`}
            color="#0ea5e9"
          />
          <StatBar
            label="IQ"
            value={75}
            display={`${stats.iq}`}
            color="rgba(255,255,255,0.7)"
          />
          <StatBar
            label="Logic"
            value={stats.logic}
            display={`${stats.logic}%`}
            color="#34d399"
          />
          <StatBar
            label="Focus"
            value={stats.focus}
            display={`${stats.focus}%`}
            color="#a855f7"
          />
        </div>
      </div>

      {/* ── Daily Streak ── */}
      <div className="card p-5 md:p-6 border-l-[3px] border-amber-500 bg-amber-500/5">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} color="#f59e0b" />
          <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">
            Daily Streak
          </h3>
          <span className="ml-auto text-lg font-black text-amber-500">
            {stats.streak} 🔥
          </span>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          {STREAK_DAYS.map((d, i) => (
            <div
              key={i}
              className="streak-pip flex-1 text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="h-7 md:h-8 rounded-lg flex items-center justify-center mb-1"
                style={{
                  background: STREAK_DONE[i]
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.05)",
                  border: STREAK_DONE[i]
                    ? "none"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: STREAK_DONE[i]
                    ? "0 0 10px rgba(245,158,11,0.4)"
                    : "none",
                }}
              >
                {STREAK_DONE[i] && (
                  <span className="text-[10px]">✓</span>
                )}
              </div>
              <span className="text-[8px] font-bold opacity-40 uppercase">
                {d}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Achievements (desktop only) ── */}
      <div className="card p-5 hidden lg:block">
        <div className="flex items-center gap-2 mb-4">
          <Award size={14} color="#f59e0b" />
          <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">
            Achievements
          </h3>
          <span className="ml-auto text-[9px] text-cyan-400 font-extrabold">
            2/6
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.slice(0, 4).map((a) => (
            <div
              key={a.title}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: a.unlocked
                  ? "rgba(34,211,238,0.05)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  a.unlocked
                    ? "rgba(34,211,238,0.2)"
                    : "rgba(255,255,255,0.05)"
                }`,
                opacity: a.unlocked ? 1 : 0.4,
              }}
            >
              <div className="text-xl mb-1.5">{a.icon}</div>
              <p
                className="text-[9px] font-extrabold mb-0.5"
                style={{ color: a.unlocked ? "#22d3ee" : "white" }}
              >
                {a.title}
              </p>
              <p className="text-[8px] opacity-40">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Directive (desktop only) ── */}
      <div className="card p-5 border-l-[3px] border-emerald-400 bg-emerald-400/5 hidden lg:block">
        <div className="flex items-center gap-2 mb-3 opacity-70">
          <Quote size={14} color="#34d399" />
          <h3 className="text-[9px] font-black tracking-widest uppercase">
            Daily Directive
          </h3>
        </div>
        <p className="text-[13px] italic font-semibold leading-relaxed text-white/80 mb-2 font-bangla">
          "Seek knowledge from the cradle to the grave."
        </p>
        <p className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">
          — PROPHET MUHAMMAD (PBUH)
        </p>
      </div>
    </div>
  );
}