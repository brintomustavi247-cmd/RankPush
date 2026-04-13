"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Timer, Play, Pause, RotateCcw, Zap, Trophy,
  Flame, Crown, ChevronRight, Clock, Target,
  CheckCircle, BarChart2, TrendingUp, Medal,
  Swords, Brain, Star, Users, Coffee, BookOpen,
  Moon, Sunrise, Lock, Award, ArrowLeft,
  ChevronDown, LayoutDashboard, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { awardTimerXP, saveSessionHistory } from "@/lib/xp-utils";
import { useAuthUid } from "@/hooks/use-auth-uid";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type TimerMode = "free" | "pomodoro";
type PomodoroPhase = "focus" | "short" | "long";

interface Session {
  id: number;
  type: string;
  duration: number; // minutes
  xp: number;
  timestamp: Date;
  subject?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  todayMinutes: number;
  totalXP: number;
  streak: number;
  rankIcon: string;
  rankColor: string;
  isCurrentUser?: boolean;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const POMODORO_PRESETS: Record<PomodoroPhase, { label: string; mins: number; xp: number; color: string; desc: string; icon: React.ElementType }> = {
  focus: { label: "FOCUS",       mins: 25, xp: 50,  color: "#22d3ee", desc: "Shadow Seal Active",    icon: Brain    },
  short: { label: "SHORT BREAK", mins: 5,  xp: 10,  color: "#34d399", desc: "Mana Recovery",         icon: Coffee   },
  long:  { label: "LONG BREAK",  mins: 15, xp: 20,  color: "#a855f7", desc: "Deep Rest Protocol",    icon: Moon     },
};

const SUBJECTS = ["Physics", "Chemistry", "Math", "Biology", "English", "ICT"];

const XP_PER_MINUTE = 2; // free timer: 2 XP per minute

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: "S-Rank_Slayer", avatar: "https://i.pravatar.cc/150?u=slayer",  todayMinutes: 185, totalXP: 24500, streak: 12, rankIcon: "⚔️", rankColor: "#ec4899" },
  { rank: 2, name: "ZeroOne",       avatar: "https://i.pravatar.cc/150?u=zeroone", todayMinutes: 162, totalXP: 22100, streak: 8,  rankIcon: "👑", rankColor: "#a855f7" },
  { rank: 3, name: "GhostVibes",    avatar: "https://i.pravatar.cc/150?u=ghost",   todayMinutes: 140, totalXP: 19850, streak: 6,  rankIcon: "💠", rankColor: "#3b82f6" },
  { rank: 4, name: "YOU",           avatar: "https://i.pravatar.cc/150?u=you",     todayMinutes: 0,   totalXP: 15420, streak: 4,  rankIcon: "🥇", rankColor: "#f59e0b", isCurrentUser: true },
  { rank: 5, name: "NightCrawler",  avatar: "https://i.pravatar.cc/150?u=night",   todayMinutes: 98,  totalXP: 17200, streak: 5,  rankIcon: "💠", rankColor: "#3b82f6" },
  { rank: 6, name: "PhantomX",      avatar: "https://i.pravatar.cc/150?u=phantom", todayMinutes: 75,  totalXP: 15900, streak: 3,  rankIcon: "🥈", rankColor: "#9ca3af" },
];

const MOTIVATIONAL_LINES = [
  "Shadow soldiers don't rest. They level up.",
  "Every minute is +XP. Don't waste the dungeon.",
  "The meta belongs to those who focus.",
  "Arise. Read. Dominate.",
  "Your rival is studying right now.",
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60}m`;
}

// ─────────────────────────────────────────────
// SVG RING COMPONENT
// ─────────────────────────────────────────────
function TimerRing({
  progress, color, size = 280, stroke = 12, children
}: {
  progress: number; color: string; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const cx = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Outer deco ring */}
        <circle cx={cx} cy={cx} r={r + stroke + 6}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1.5}
          strokeDasharray="4 10" />
        {/* Track */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {/* Progress */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.4s ease", filter: `drop-shadow(0 0 12px ${color}88)` }} />
        {/* Inner deco */}
        <circle cx={cx} cy={cx} r={r - stroke - 8}
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1}
          strokeDasharray="2 6" />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column"
      }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// XP NOTIFICATION
// ─────────────────────────────────────────────
function XPNotif({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", top: 80, right: 24, zIndex: 999,
      background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))",
      border: "1px solid rgba(34,211,238,0.4)",
      borderRadius: 16, padding: "16px 24px",
      animation: "slideInRight 0.4s ease, fadeOut 0.4s ease 2.4s forwards",
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, color: "#22d3ee", fontWeight: 900, letterSpacing: "0.1em" }}>
        +{xp} XP ACQUIRED
      </p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Session complete</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// FREE TIMER SECTION
// ─────────────────────────────────────────────
function FreeTimer({
  onSessionComplete
}: {
  onSessionComplete: (mins: number, xp: number, subject: string) => void;
}) {
  const [running, setRunning]       = useState(false);
  const [elapsed, setElapsed]       = useState(0); // seconds
  const [subject, setSubject]       = useState("Physics");
  const [lapTime, setLapTime]       = useState(0);
  const [laps, setLaps]             = useState<{label: string; secs: number}[]>([]);
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef                = useRef<number>(0);

  const tick = useCallback(() => {
    setElapsed(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  const handleStartStop = () => {
    if (!running && elapsed === 0) startTimeRef.current = Date.now();
    setRunning(r => !r);
  };

  const handleLap = () => {
    const lapSecs = elapsed - lapTime;
    setLaps(prev => [...prev, { label: `Lap ${prev.length + 1}`, secs: lapSecs }]);
    setLapTime(elapsed);
  };

  const handleStop = () => {
    if (elapsed < 60) { setRunning(false); setElapsed(0); setLaps([]); setLapTime(0); return; }
    const mins = Math.floor(elapsed / 60);
    const xp = mins * XP_PER_MINUTE;
    onSessionComplete(mins, xp, subject);
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    setLapTime(0);
  };

  const progress = Math.min(elapsed / (120 * 60), 1); // visual: fills over 2h
  const color = running ? "#22d3ee" : elapsed > 0 ? "#f59e0b" : "#444466";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", margin: "0 auto" }}>

      {/* Subject Selector (Bigger & Softer) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: "600px", margin: "0 auto" }}>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => { if (!running) setSubject(s); }}
            style={{
              padding: "8px 18px", borderRadius: 24, fontSize: 13, fontWeight: 800,
              letterSpacing: "0.08em", cursor: running ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif", textTransform: "uppercase",
              background: subject === s ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.03)",
              border: subject === s ? "2px solid rgba(34,211,238,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: subject === s ? "#22d3ee" : "rgba(255,255,255,0.5)",
              transition: "all 0.2s",
              opacity: running && subject !== s ? 0.4 : 1,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Ring (Bigger) */}
      <TimerRing progress={progress} color={color} size={280} stroke={10}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 48, fontWeight: 900,
            color: running ? "#22d3ee" : elapsed > 0 ? "#f59e0b" : "rgba(255,255,255,0.9)",
            letterSpacing: -2, lineHeight: 1,
            textShadow: running ? "0 0 30px rgba(34,211,238,0.6)" : "none",
            transition: "all 0.4s",
          }}>
            {formatTime(elapsed)}
          </p>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", marginTop: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            {running ? subject + " · IN SESSION" : elapsed > 0 ? "PAUSED" : "FREE STUDY TIMER"}
          </p>
          {elapsed > 0 && (
            <p style={{ fontSize: 13, color: "#22d3ee", fontWeight: 800, marginTop: 6, fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px #22d3ee" }}>
              +{Math.floor(elapsed / 60) * XP_PER_MINUTE} XP
            </p>
          )}
        </div>
      </TimerRing>

      {/* Controls (Bigger & Softer) */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
        <button onClick={handleStartStop} style={{
          padding: "16px 40px", borderRadius: 16,
          fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900,
          letterSpacing: "0.15em", cursor: "pointer",
          background: running ? "rgba(239,68,68,0.15)" : "rgba(34,211,238,0.15)",
          border: running ? "2px solid rgba(239,68,68,0.5)" : "2px solid rgba(34,211,238,0.5)",
          color: running ? "#ef4444" : "#22d3ee",
          transition: "all 0.2s",
        }}>
          {running ? "PAUSE" : elapsed > 0 ? "RESUME" : "START"}
        </button>

        {elapsed > 0 && (
          <>
            <button onClick={handleLap} style={{
              padding: "16px 24px", borderRadius: 16, fontSize: 14, cursor: "pointer", letterSpacing: "0.1em",
              background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.4)",
              color: "#f59e0b", fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            }}>
              LAP
            </button>
            <button onClick={handleStop} style={{
              padding: "16px 24px", borderRadius: 16, fontSize: 14, cursor: "pointer", letterSpacing: "0.1em",
              background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.4)",
              color: "#22c55e", fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            }}>
              DONE
            </button>
          </>
        )}
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 8, margin: "0 auto" }}>
          {laps.map((l, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 13, color: "rgba(255,255,255,0.6)",
            }}>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 800 }}>{l.label}</span>
              <span style={{ color: "#22d3ee", fontWeight: 900, fontSize: 14 }}>{formatTime(l.secs)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// POMODORO SECTION
// ─────────────────────────────────────────────
function PomodoroTimer({
  onSessionComplete
}: {
  onSessionComplete: (mins: number, xp: number, subject: string, phase: string) => void;
}) {
  const [phase, setPhase]           = useState<PomodoroPhase>("focus");
  const [running, setRunning]       = useState(false);
  const [remaining, setRemaining]   = useState(POMODORO_PRESETS.focus.mins * 60);
  const [subject, setSubject]       = useState("Physics");
  const [cycle, setCycle]           = useState(1); // pomodoro cycle count
  const [streak, setStreak]         = useState(0); // consecutive focus sessions
  const intervalRef                 = useRef<NodeJS.Timeout | null>(null);
  const totalSecs                   = POMODORO_PRESETS[phase].mins * 60;
  const preset                      = POMODORO_PRESETS[phase];
  const progress                    = remaining / totalSecs;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { completeSession(); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const completeSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    const p = POMODORO_PRESETS[phase];
    let xp = p.xp;
    const newStreak = phase === "focus" ? streak + 1 : streak;
    if (phase === "focus") setStreak(newStreak);
    if (newStreak >= 3 && phase === "focus") xp = Math.round(xp * 1.5);
    onSessionComplete(p.mins, xp, subject, p.label);
    
    if (phase === "focus") {
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      setPhase(nextCycle % 4 === 0 ? "long" : "short");
      setRemaining(POMODORO_PRESETS[nextCycle % 4 === 0 ? "long" : "short"].mins * 60);
    } else {
      setPhase("focus");
      setRemaining(POMODORO_PRESETS.focus.mins * 60);
    }
  };

  const switchPhase = (p: PomodoroPhase) => {
    if (running) return;
    setPhase(p);
    setRemaining(POMODORO_PRESETS[p].mins * 60);
  };

  const toggleTimer = () => setRunning(r => !r);

  const resetTimer = () => {
    setRunning(false);
    setRemaining(POMODORO_PRESETS[phase].mins * 60);
  };

  const bonusActive = streak >= 2 && phase === "focus";
  const displayXP   = bonusActive ? Math.round(preset.xp * 1.5) : preset.xp;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: "100%", margin: "0 auto" }}>

      {/* Phase tabs (Bigger & Softer) */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        {(["focus", "short", "long"] as PomodoroPhase[]).map(p => {
          const pr = POMODORO_PRESETS[p];
          const isActive = phase === p;
          return (
            <button key={p} onClick={() => switchPhase(p)} style={{
              flex: 1, padding: "16px 8px", borderRadius: 16, cursor: running ? "not-allowed" : "pointer",
              fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: isActive ? `rgba(${p === "focus" ? "34,211,238" : p === "short" ? "52,211,153" : "168,85,247"},0.15)` : "rgba(255,255,255,0.03)",
              border: isActive ? `2px solid ${pr.color}66` : "1px solid rgba(255,255,255,0.1)",
              color: isActive ? pr.color : "rgba(255,255,255,0.4)",
              transition: "all 0.2s",
              opacity: running && !isActive ? 0.4 : 1,
            }}>
              {pr.label}<br />
              <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4, display: "inline-block" }}>{pr.mins}M</span>
            </button>
          );
        })}
      </div>

      {/* Subject (Bigger & Softer) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: "500px", margin: "0 auto" }}>
        {SUBJECTS.slice(0, 4).map(s => (
          <button key={s} onClick={() => { if (!running) setSubject(s); }}
            style={{
              padding: "8px 18px", borderRadius: 24, fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              cursor: running ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.08em",
              background: subject === s ? `${preset.color}20` : "rgba(255,255,255,0.03)",
              border: subject === s ? `2px solid ${preset.color}66` : "1px solid rgba(255,255,255,0.1)",
              color: subject === s ? preset.color : "rgba(255,255,255,0.5)",
              transition: "all 0.2s",
              opacity: running && subject !== s ? 0.3 : 1,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Ring (Bigger) */}
      <TimerRing progress={progress} color={preset.color} size={280} stroke={10}>
        <div style={{ textAlign: "center" }}>
          {/* Cycle dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i <= (cycle % 4 === 0 && phase !== "focus" ? 4 : cycle % 4) ? preset.color : "rgba(255,255,255,0.15)",
                boxShadow: i <= (cycle % 4 === 0 && phase !== "focus" ? 4 : cycle % 4) ? `0 0 10px ${preset.color}` : "none",
                transition: "all 0.5s"
              }} />
            ))}
          </div>
          <p style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 48, fontWeight: 900,
            color: running ? preset.color : "rgba(255,255,255,0.9)",
            letterSpacing: -2, lineHeight: 1,
            textShadow: running ? `0 0 30px ${preset.color}66` : "none",
            transition: "all 0.4s",
          }}>
            {formatTime(remaining)}
          </p>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", marginTop: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
            {running ? preset.desc : preset.label}
          </p>
          <p style={{ fontSize: 13, color: bonusActive ? "#f59e0b" : preset.color, fontWeight: 800, marginTop: 6, fontFamily: "'Orbitron', sans-serif", textShadow: `0 0 10px ${bonusActive ? "#f59e0b" : preset.color}` }}>
            +{displayXP} XP {bonusActive && "🔥x1.5"}
          </p>
        </div>
      </TimerRing>

      {/* Streak & bonus */}
      {streak > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderRadius: 24,
          background: bonusActive ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
          border: bonusActive ? "2px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)",
          margin: "0 auto"
        }}>
          <Flame size={16} color={bonusActive ? "#f59e0b" : "rgba(255,255,255,0.4)"} />
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Orbitron', sans-serif", color: bonusActive ? "#f59e0b" : "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
            {streak} STREAK {bonusActive ? "— BONUS ACTIVE" : ""}
          </span>
        </div>
      )}

      {/* Controls (Bigger) */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
        <button onClick={toggleTimer} style={{
          padding: "16px 44px", borderRadius: 16,
          fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 900,
          letterSpacing: "0.15em", cursor: "pointer",
          background: running ? "rgba(239,68,68,0.15)" : `${preset.color}20`,
          border: running ? "2px solid rgba(239,68,68,0.5)" : `2px solid ${preset.color}66`,
          color: running ? "#ef4444" : preset.color,
          transition: "all 0.2s",
        }}>
          {running ? "PAUSE" : remaining === totalSecs ? "ENTER DUNGEON" : "RESUME"}
        </button>
        <button onClick={resetTimer} style={{
          padding: "16px 20px", borderRadius: 16, cursor: "pointer",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.6)", transition: "all 0.2s",
        }}>
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Pomodoro tip */}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.6, maxWidth: 300, fontStyle: "italic", fontWeight: 600, margin: "0 auto" }}>
        {phase === "focus" ? `Cycle ${cycle} · Focus for ${preset.mins}min → short break` : `Rest up Hunter · Next: Focus session`}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDY LEADERBOARD
// ─────────────────────────────────────────────
function StudyLeaderboard({ todayMinutes }: { todayMinutes: number }) {
  const data = LEADERBOARD_DATA.map(e =>
    e.isCurrentUser ? { ...e, todayMinutes } : e
  ).sort((a, b) => b.todayMinutes - a.todayMinutes).map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={18} color="#f59e0b" />
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.8)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Today's Study Board
          </h3>
        </div>
        <span style={{ fontSize: 10, color: "#22d3ee", fontWeight: 900, border: "1px solid rgba(34,211,238,0.4)", padding: "4px 12px", borderRadius: 20, background: "rgba(34,211,238,0.1)" }}>LIVE</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((p, i) => (
          <div key={p.name} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
            borderRadius: 16, cursor: "pointer", transition: "all 0.2s",
            background: p.isCurrentUser ? "rgba(34,211,238,0.08)" : i === 0 ? "rgba(245,158,11,0.06)" : "transparent",
            border: p.isCurrentUser ? "1px solid rgba(34,211,238,0.3)" : i === 0 ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
          }}>
            {/* Rank number (Bigger) */}
            <span style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, minWidth: 26, textAlign: "center", fontStyle: "italic",
              color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "rgba(255,255,255,0.4)",
            }}>
              {String(p.rank).padStart(2, "0")}
            </span>

            {/* Avatar (Bigger) */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={p.avatar} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${p.rankColor}` }} alt={p.name} />
              <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12 }}>{p.rankIcon}</span>
            </div>

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 14, fontWeight: 800, letterSpacing: "0.05em",
                color: p.isCurrentUser ? "#22d3ee" : "rgba(255,255,255,0.9)",
                textTransform: "uppercase", fontStyle: "italic",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2
              }}>
                {p.name} {p.isCurrentUser && "(YOU)"}
              </p>
              {/* Study bar (Thicker & Softer) */}
              <div style={{ height: 8, background: "rgba(0,0,0,0.4)", borderRadius: 4, marginTop: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${Math.min(100, (p.todayMinutes / 200) * 100)}%`,
                  background: p.isCurrentUser ? "#22d3ee" : p.rankColor,
                  transition: "width 0.8s ease",
                  boxShadow: `0 0 10px ${p.rankColor}aa`
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 900, color: p.isCurrentUser ? "#22d3ee" : "rgba(255,255,255,0.9)" }}>
                {formatMinutes(p.todayMinutes)}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2, fontWeight: 700, textTransform: "uppercase" }}>TODAY</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", fontWeight: 600, fontStyle: "italic" }}>
          Study more to climb the leaderboard today!
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STATS PANEL
// ─────────────────────────────────────────────
function StatsPanel({ sessions }: { sessions: Session[] }) {
  const todayMins   = sessions.reduce((a, s) => a + s.duration, 0);
  const totalXP     = sessions.reduce((a, s) => a + s.xp, 0);
  const focusSess   = sessions.filter(s => s.type === "FOCUS").length;
  const avgMins     = sessions.length ? Math.round(todayMins / sessions.length) : 0;

  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <BarChart2 size={18} color="#22d3ee" />
        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.8)", letterSpacing: "0.15em" }}>
          TODAY'S STATS
        </h3>
      </div>

      {/* Stat grid (Bigger) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Study Time",    value: formatMinutes(todayMins), color: "#22d3ee", icon: Clock       },
          { label: "Focus XP",      value: `+${totalXP}`,           color: "#f59e0b", icon: Zap          },
          { label: "Focus Sessions", value: focusSess,              color: "#a855f7", icon: Brain        },
          { label: "Avg Session",   value: `${avgMins}m`,           color: "#34d399", icon: TrendingUp   },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "16px 20px", textAlign: "center",
          }}>
            <s.icon size={20} color={s.color} style={{ margin: "0 auto 8px", opacity: 0.9 }} />
            <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Session log (Bigger) */}
      {sessions.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>SESSION LOG</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
            {[...sessions].reverse().map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.type} <span style={{ opacity: 0.5, margin: "0 4px" }}>·</span> {s.subject}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{s.duration} minutes</p>
                </div>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900, color: "#f59e0b" }}>+{s.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 0", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <BookOpen size={36} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>No sessions cleared today</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ShadowTimer() {
  const router = useRouter();
  const [mode, setMode]             = useState<TimerMode>("pomodoro");
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [xpNotif, setXpNotif]       = useState<number | null>(null);
  const [motiveLine, setMotiveLine] = useState(MOTIVATIONAL_LINES[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const sessionIdRef = useRef(0);
  const uidRef       = useAuthUid(); // cached auth uid

  const todayMins = sessions.reduce((a, s) => a + s.duration, 0);

  useEffect(() => {
    const t = setInterval(() => {
      setMotiveLine(MOTIVATIONAL_LINES[Math.floor(Math.random() * MOTIVATIONAL_LINES.length)]);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const handleSessionComplete = (mins: number, xp: number, subject: string, type = "FREE") => {
    const newSession: Session = {
      id: ++sessionIdRef.current,
      type, duration: mins, xp, timestamp: new Date(), subject,
    };
    setSessions(prev => [...prev, newSession]);
    setXpNotif(xp);

    // Persist to Firebase using the cached uid
    const uid = uidRef.current;
    if (uid) {
      (async () => {
        try {
          await awardTimerXP(uid, mins, type);
          await saveSessionHistory(uid, { type, duration: mins, xp, subject });
        } catch (err) {
          console.error(`Failed to save session to Firebase (uid=${uid}, type=${type}, mins=${mins}, subject=${subject}):`, err);
        }
      })();
    }
  };

  useEffect(() => {
    const closeMenu = () => setIsMobileMenuOpen(false);
    if (isMobileMenuOpen) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen font-sans text-white pb-12 px-4 md:px-8" style={{
      background: "#02010a",
      backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(14,165,233,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 80% 100%, rgba(124,58,237,0.05) 0%, transparent 60%)",
      overflowX: "hidden"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&display=swap" rel="stylesheet" />
      
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        .font-logo { font-family: 'Orbitron', sans-serif; }
        body { font-family: 'Outfit', sans-serif; background-color: #02010a; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.3); border-radius: 4px; }
      `}</style>

      {xpNotif !== null && (
        <XPNotif xp={xpNotif} onDone={() => setXpNotif(null)} />
      )}

      <div className="max-w-[1400px] mx-auto pt-6 md:pt-10 w-full">

        {/* ═══════════════════════════════════════════════════
            HEADER (FIXED FOR MOBILE & DESKTOP)
        ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 w-full relative z-50">
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8 w-full md:w-auto">
            
            {/* 🆕 INTERACTIVE LOGO WITH DROPDOWN (Replacing Back Button) */}
            <div className="relative order-1">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
              >
                <div className="p-2 md:p-2.5 bg-sky-500 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] border border-white/20 group-hover:scale-105 transition-transform">
                  <Swords size={18} color="white" />
                </div>
                <span className="font-logo text-lg md:text-[22px] tracking-tight">RANKPUSH</span>
                <ChevronDown size={16} className={`text-white/50 transition-transform duration-300 ${isMobileMenuOpen ? "rotate-180" : ""}`} />
              </div>

              {/* DROPDOWN MENU */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-4 w-64 bg-[#0a0f1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100] flex flex-col gap-1.5"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <button onClick={() => { router.push('/dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-black text-[13px] tracking-widest uppercase transition-colors">
                      <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button onClick={() => { router.push('/profile'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-black text-[13px] tracking-widest uppercase transition-colors">
                      <User size={18} /> Profile
                    </button>
                    <button onClick={() => { router.push('/arena/physics'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-black text-[13px] tracking-widest uppercase transition-colors">
                      <Swords size={18} /> Battle Arena
                    </button>
                    <button onClick={() => { setIsMobileMenuOpen(false); }} className="flex items-center gap-3.5 px-4 py-4 rounded-xl bg-cyan-400/10 text-cyan-400 font-black text-[13px] tracking-widest uppercase transition-colors">
                      <Timer size={18} /> Shadow Focus
                    </button>
                    <button className="flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-black text-[13px] tracking-widest uppercase transition-colors">
                      <Trophy size={18} /> Leaderboards
                    </button>
                    <button className="flex items-center gap-3.5 px-4 py-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white font-black text-[13px] tracking-widest uppercase transition-colors">
                      <BarChart2 size={18} /> Analytics
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Title Block */}
            <div className="flex items-center gap-3 md:gap-4 order-2 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-none md:pl-6 md:border-l">
              <div className="p-2.5 md:p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Timer size={22} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="font-logo text-2xl md:text-3xl font-black tracking-widest uppercase leading-none">
                  SHADOW <span className="text-cyan-400">FOCUS</span>
                </h1>
                <p className="text-[10px] md:text-xs text-white/40 tracking-[0.2em] mt-1.5 font-bold uppercase">Study Timer System</p>
              </div>
            </div>

          </div>

          {/* Live stats pills - Order 3 */}
          <div className="flex gap-3 flex-wrap order-3 w-full md:w-auto mt-2 md:mt-0 justify-start md:justify-end">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Clock size={14} className="text-amber-500" />
              <span className="font-logo text-xs md:text-sm font-black text-amber-500">{formatMinutes(todayMins)}</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-2.5 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Zap size={14} className="text-cyan-400" />
              <span className="font-logo text-xs md:text-sm font-black text-cyan-400">+{sessions.reduce((a, s) => a + s.xp, 0)} XP</span>
            </div>
          </div>
        </div>

        {/* Motivational banner */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          borderLeft: "4px solid #22d3ee", borderRadius: 12, padding: "14px 20px",
          marginBottom: 32, width: "100%", margin: "0 auto 32px auto"
        }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: "italic", letterSpacing: "0.06em", fontWeight: 600 }}>
            ⚔️ {motiveLine}
          </p>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 6, maxWidth: 500, margin: "0 auto 32px auto" }}>
          {(["pomodoro", "free"] as TimerMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "14px", borderRadius: 12, cursor: "pointer",
              fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 900,
              letterSpacing: "0.15em", textTransform: "uppercase",
              background: mode === m ? "rgba(34,211,238,0.12)" : "transparent",
              border: mode === m ? "1px solid rgba(34,211,238,0.35)" : "1px solid transparent",
              color: mode === m ? "#22d3ee" : "rgba(255,255,255,0.4)",
              transition: "all 0.25s",
            }}>
              {m === "pomodoro" ? "⏱ Pomodoro" : "∞ Free Timer"}
            </button>
          ))}
        </div>

        {/* Main layout: Timer | Leaderboard + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

          {/* Timer Card */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center w-full" style={{
            background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)", borderTop: "4px solid #22d3ee",
            borderRadius: 24, padding: "40px 30px", margin: "0 auto"
          }}>
            {mode === "pomodoro" ? (
              <PomodoroTimer onSessionComplete={handleSessionComplete} />
            ) : (
              <FreeTimer onSessionComplete={handleSessionComplete} />
            )}
          </div>

          {/* Right column: Leaderboard + Stats */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 w-full">

            {/* Leaderboard */}
            <div style={{
              background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)", borderLeft: "4px solid rgba(34,211,238,0.6)",
              borderRadius: 24, padding: "28px", width: "100%", margin: "0 auto"
            }}>
              <StudyLeaderboard todayMinutes={todayMins} />
            </div>

            {/* Stats */}
            <div style={{
              background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)", borderLeft: "4px solid rgba(168,85,247,0.6)",
              borderRadius: 24, padding: "28px", width: "100%", margin: "0 auto"
            }}>
              <StatsPanel sessions={sessions} />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: "center", opacity: 0.2 }}>
          <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: "1.5em", color: "#22d3ee", textTransform: "uppercase", fontWeight: 900 }}>
            RankPush · Shadow Focus · 2026
          </p>
        </div>

      </div>
    </div>
  );
}