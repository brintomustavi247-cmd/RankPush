// components/dashboard/MainArena.tsx
// Center column: Hero banner, Shadow Focus banner, Tactical Arena,
// Rival Battle banner, and Performance Analytics.

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Swords,
  Crosshair,
  Flame,
  Play,
  Timer,
  LayoutDashboard,
  Lock,
  BookOpen,
  Sword,
  Wifi,
  ChevronUp,
  CheckCircle,
  BarChart2,
  Zap,
  Clock,
} from "lucide-react";

import { RankInfo, UserStats, SUBJECTS } from "./RankSystem";

// ============================================================
// PROPS
// ============================================================
interface MainArenaProps {
  stats: UserStats;
  rank: RankInfo;
  selectedSub: string;
  setSelectedSub: (sub: string) => void;
  setShowProModal: (v: boolean) => void;
  setShowRivalModal: (v: boolean) => void;
}

// ============================================================
// COMPONENT
// ============================================================
export function MainArena({
  stats,
  rank,
  selectedSub,
  setSelectedSub,
  setShowProModal,
  setShowRivalModal,
}: MainArenaProps) {
  const router = useRouter();

  return (
    <div className="lg:col-span-8 xl:col-span-6 flex flex-col gap-5">

      {/* ── Hero Banner ── */}
      <div
        className="card p-6 md:p-11 bg-gradient-to-br from-sky-500/10 to-purple-600/5 border-t-[3px] border-sky-500 relative overflow-hidden"
      >
        {/* Background icons */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.04,
          }}
        >
          <LayoutDashboard size={220} />
        </div>
        <div
          className="shadow-float"
          style={{
            position: "absolute",
            right: 20,
            bottom: 0,
            fontSize: 110,
            opacity: 0.04,
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          ⚔️
        </div>

        <div className="relative z-10">
          <p className="text-[9px] md:text-[11px] font-extrabold tracking-[0.3em] text-cyan-400 uppercase mb-2 md:mb-3 opacity-80">
            ⚔️ System Status: {rank.title}
          </p>
          <h1 className="font-logo text-3xl md:text-5xl lg:text-[56px] italic leading-[0.95] uppercase mb-4 md:mb-5">
            DOMINATE
            <br />
            <span
              style={{
                color: "#22d3ee",
                textShadow: "0 0 30px rgba(34,211,238,0.4)",
              }}
            >
              THE META
            </span>
          </h1>

          <div className="grid grid-cols-2 md:flex flex-wrap gap-3 md:gap-4">
            {[
              {
                label: "Total Battles",
                value: stats.totalBattles,
                Icon: Swords,
                color: "#22d3ee",
              },
              {
                label: "Accuracy",
                value: `${stats.accuracy}%`,
                Icon: Crosshair,
                color: "#34d399",
              },
              {
                label: "Best Streak",
                value: `${stats.streak} days`,
                Icon: Flame,
                color: "#f59e0b",
              },
              {
                label: "Questions",
                value: stats.questionsAttempted,
                Icon: BookOpen,
                color: "#a855f7",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 md:p-3"
              >
                <s.Icon size={15} color={s.color} />
                <div>
                  <p className="text-sm font-black" style={{ color: s.color }}>
                    {typeof s.value === "number"
                      ? s.value.toLocaleString()
                      : s.value}
                  </p>
                  <p className="text-[8px] opacity-40 uppercase tracking-widest">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shadow Focus Banner ── */}
      <div
        className="card p-6 md:p-7 border-l-[4px] border-purple-500 bg-gradient-to-r from-purple-500/10 to-transparent flex flex-col md:flex-row items-start md:items-center gap-5"
        style={{ boxShadow: "0 0 30px rgba(168,85,247,0.08)" }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/15 rounded-xl border border-purple-500/25">
            <Timer size={24} color="#a855f7" />
          </div>
          <div>
            <h3 className="font-logo text-base md:text-lg text-purple-400 uppercase tracking-wider mb-1">
              Shadow Focus
            </h3>
            <p className="text-[10px] text-white/45 leading-relaxed max-w-[300px]">
              Enter deep focus mode. Pomodoro or Free Timer — earn bonus XP
              and climb the daily study leaderboard.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/timer")}
          className="w-full md:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            boxShadow: "0 0 20px rgba(168,85,247,0.3)",
          }}
        >
          <Play size={14} fill="currentColor" /> Enter Focus
        </button>
      </div>

      {/* ── Tactical Arena ── */}
      <div className="card p-5 md:p-8 border-t-[3px] border-sky-500">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-logo text-lg md:text-[22px] uppercase mb-1">
              Tactical <span className="text-sky-500">Arena</span>
            </h2>
            <p className="text-[9px] font-bold opacity-35 uppercase tracking-widest">
              Select your mastery field
            </p>
          </div>
          <div className="float w-11 h-11 bg-sky-500/10 rounded-2xl flex items-center justify-center border border-sky-500/20">
            <Swords size={20} color="#22d3ee" />
          </div>
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {SUBJECTS.map((sub) => {
            const isActive = selectedSub === sub.name;
            // Compute rgb from hex for CSS custom property
            const hex = sub.color.startsWith("#")
              ? sub.color.slice(1)
              : "22d3ee";
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);

            return (
              <button
                key={sub.name}
                type="button"
                className={`sub-btn p-4 md:p-6 ${isActive ? "sub-active" : ""} ${sub.locked ? "sub-locked" : ""}`}
                style={
                  {
                    "--sub-color": sub.color,
                    "--sub-rgb": `${r},${g},${b}`,
                  } as React.CSSProperties
                }
                onClick={() => {
                  if (!sub.locked) setSelectedSub(sub.name);
                  else setShowProModal(true);
                }}
              >
                {sub.locked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={10} color="rgba(255,255,255,0.35)" />
                  </div>
                )}
                <sub.icon
                  size={24}
                  color={isActive ? sub.color : "rgba(255,255,255,0.45)"}
                  style={{
                    filter: isActive
                      ? `drop-shadow(0 0 8px ${sub.color})`
                      : "none",
                    transition: "all 0.3s",
                  }}
                />
                <span
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{
                    color: isActive ? "white" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {sub.name}
                </span>
                {!sub.locked ? (
                  <span
                    className="text-[8px] font-bold"
                    style={{
                      color: isActive ? sub.color : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {sub.questions} QS
                  </span>
                ) : (
                  <span className="text-[8px] font-bold text-purple-500">
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Enter Arena CTA */}
        <button
          className="arena-btn glow-pulse"
          onClick={() =>
            router.push(`/arena/${selectedSub.toLowerCase()}`)
          }
        >
          ENTER ARENA <Play size={18} fill="white" />
        </button>
      </div>

      {/* ── Rival Battle Banner ── */}
      <div className="card p-5 md:p-7 bg-gradient-to-r from-red-500/5 to-transparent border-l-[3px] border-red-500 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5">
        <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shrink-0">
          <Sword size={20} color="#ef4444" />
        </div>
        <div className="flex-1">
          <h3 className="font-logo text-sm md:text-base text-red-500 uppercase mb-1">
            Rival Battle
          </h3>
          <p className="text-[10px] opacity-45">
            Challenge a friend to real-time 1v1 MCQ battle
          </p>
        </div>
        <button
          onClick={() =>
            stats.plan === "pro"
              ? setShowRivalModal(true)
              : setShowProModal(true)
          }
          className="w-full md:w-auto bg-gradient-to-br from-red-600 to-red-500 border-none rounded-xl py-2.5 px-5 text-white font-black text-[10px] tracking-wide flex items-center justify-center gap-2"
        >
          {stats.plan === "pro" ? (
            <>
              <Wifi size={14} /> Find Rival
            </>
          ) : (
            <>
              <Lock size={14} /> PRO Only
            </>
          )}
        </button>
      </div>

      {/* ── Performance Analytics ── */}
      <div className="card p-5 md:p-7">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={14} color="#22d3ee" />
          <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">
            Performance This Week
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Battles",
              value: 18,
              suffix: "",
              color: "#22d3ee",
              Icon: Swords,
            },
            {
              label: "Correct",
              value: 142,
              suffix: "",
              color: "#34d399",
              Icon: CheckCircle,
            },
            {
              label: "XP Earned",
              value: 2340,
              suffix: "",
              color: "#f59e0b",
              Icon: Zap,
            },
            {
              label: "Rank ▲",
              value: 3,
              suffix: " ↑",
              color: "#a855f7",
              Icon: ChevronUp,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 text-center"
            >
              <s.Icon
                size={16}
                className="mx-auto mb-2"
                color={s.color}
              />
              <p
                className="text-lg md:text-[22px] font-black mb-0.5"
                style={{ color: s.color }}
              >
                {s.value.toLocaleString()}
                {s.suffix}
              </p>
              <p className="text-[8px] opacity-35 uppercase tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}