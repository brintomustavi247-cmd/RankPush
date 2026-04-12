// components/dashboard/RightPanel.tsx
// Right column: Global Leaderboard, Daily Quests, Chapter Boss Fight card.

"use client";

import React from "react";
import {
  Trophy,
  Flame,
  Layers,
  Lock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import {
  LeaderboardEntry,
  DailyQuest,
  UserStats,
} from "./RankSystem";

// ============================================================
// PROPS
// ============================================================
interface RightPanelProps {
  stats: UserStats;
  leaderboard: LeaderboardEntry[];
  dailyQuests: DailyQuest[];
  setShowProModal: (v: boolean) => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function RightPanel({
  stats,
  leaderboard,
  dailyQuests,
  setShowProModal,
}: RightPanelProps) {
  const doneCount = dailyQuests.filter((q) => q.done).length;

  return (
    <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-5">

      {/* ── Global Leaderboard ── */}
      <div className="card p-5 md:p-6 border-l-[3px] border-sky-500/50">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[9px] font-black tracking-widest uppercase opacity-60 flex items-center gap-2">
            <Trophy size={12} color="#f59e0b" /> Global Elite
          </h3>
          <span className="text-[8px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {leaderboard.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl cursor-pointer transition-all"
              style={{
                background:
                  i === 0 ? "rgba(34,211,238,0.05)" : "transparent",
                border:
                  i === 0
                    ? "1px solid rgba(34,211,238,0.1)"
                    : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (i !== 0)
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (i !== 0)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              {/* Rank number */}
              <span
                className="text-[13px] font-black italic min-w-[24px]"
                style={{
                  color:
                    i === 0 ? "#22d3ee" : "rgba(255,255,255,0.35)",
                }}
              >
                {p.rank}
              </span>

              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={p.avatar}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
                  style={{ border: `2px solid ${p.rankInfo.color}` }}
                  alt={p.name}
                />
                <span className="absolute -bottom-0.5 -right-0.5 text-[9px]">
                  {p.rankInfo.icon}
                </span>
              </div>

              {/* Name + mini bar */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-extrabold uppercase italic truncate"
                  style={{
                    color:
                      i === 0 ? "#22d3ee" : "rgba(255,255,255,0.8)",
                  }}
                >
                  {p.name}
                </p>
                <div className="h-[3px] bg-white/5 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${100 - i * 12}%`,
                      background: p.rankInfo.color,
                    }}
                  />
                </div>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-cyan-400">
                  {p.score}
                </p>
                <p className="text-[7px] opacity-35 uppercase">EXP</p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-3 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
          View Full Leaderboard <ArrowRight size={11} />
        </button>
      </div>

      {/* ── Daily Quests ── */}
      <div className="card p-5 md:p-6 border-l-[3px] border-orange-500 bg-orange-500/5">
        <div className="flex items-center gap-2 mb-4 opacity-80">
          <Flame size={14} color="#f97316" />
          <h3 className="text-[9px] font-black tracking-widest uppercase">
            Daily Quests
          </h3>
          <span className="ml-auto text-[9px] text-orange-500 font-extrabold">
            {doneCount}/{dailyQuests.length} Done
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {dailyQuests.map((q) => (
            <div
              key={q.id}
              className="rounded-xl p-3 md:p-3.5"
              style={{
                background: q.done
                  ? "rgba(34,197,94,0.05)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  q.done
                    ? "rgba(34,197,94,0.2)"
                    : "rgba(255,255,255,0.05)"
                }`,
              }}
            >
              <div
                className={`flex items-start gap-2.5 ${
                  q.done ? "mb-0" : "mb-2.5"
                }`}
              >
                <q.icon
                  size={14}
                  className="shrink-0 mt-0.5"
                  color={q.done ? "#22c55e" : q.color}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p
                      className="text-[10px] font-extrabold"
                      style={{
                        color: q.done
                          ? "#22c55e"
                          : "rgba(255,255,255,0.85)",
                        textDecoration: q.done ? "line-through" : "none",
                      }}
                    >
                      {q.title}
                    </p>
                    <span
                      className="text-[9px] font-black"
                      style={{ color: q.color }}
                    >
                      +{q.xp} XP
                    </span>
                  </div>
                  <p className="text-[8px] opacity-45 mt-0.5">{q.desc}</p>
                </div>
              </div>

              {/* Progress bar (only for incomplete quests) */}
              {!q.done && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] opacity-35 uppercase">
                      Progress
                    </span>
                    <span
                      className="text-[8px] font-extrabold"
                      style={{ color: q.color }}
                    >
                      {q.progress}/{q.total}
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="quest-bar h-full rounded-full"
                      style={{
                        width: `${(q.progress / q.total) * 100}%`,
                        background: `linear-gradient(90deg,${q.color},${q.color}aa)`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chapter Boss Fight ── */}
      <div
        className="card p-5 md:p-6 bg-gradient-to-br from-red-500/5 to-purple-600/5 border border-red-500/15 relative overflow-hidden"
      >
        {/* BG emoji */}
        <div
          style={{
            position: "absolute",
            right: -8,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.05,
            fontSize: 110,
            lineHeight: 1,
          }}
        >
          💀
        </div>

        <div className="flex items-center gap-2 mb-2.5">
          <Layers size={14} color="#ef4444" />
          <h3 className="text-[9px] font-black tracking-widest uppercase opacity-80">
            Chapter Boss
          </h3>
          <span className="ml-auto text-[8px] bg-red-500/15 text-red-500 px-2 py-0.5 rounded-md font-black">
            NEW
          </span>
        </div>

        <p className="text-[13px] font-bold text-white/80 mb-1.5">
          Physics Chapter 3 Boss
        </p>
        <p className="text-[10px] opacity-35 mb-4">
          10 hard questions. Defeat the boss to earn rare XP!
        </p>

        <button
          onClick={() => setShowProModal(true)}
          className="w-full py-2.5 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 font-black text-[10px] flex items-center justify-center gap-1.5"
        >
          <Lock size={12} /> PRO Feature
        </button>
      </div>
    </div>
  );
}