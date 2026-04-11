"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Timer, Play, Pause, RotateCcw, Zap, Trophy,
  Flame, Crown, ChevronRight, Clock, Target,
  CheckCircle, BarChart2, TrendingUp, Medal,
  Swords, Brain, Star, Users, Coffee, BookOpen,
  Moon, Sunrise, Lock, Award
} from "lucide-react";

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
  progress, color, size = 220, stroke = 8, children
}: {
  progress: number; color: string; size?: number; stroke?: number; children?: React.ReactNode;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  const cx = size / 2;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Outer deco ring */}
        <circle cx={cx} cy={cx} r={r + stroke + 4}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1}
          strokeDasharray="3 8" />
        {/* Track */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {/* Progress */}
        <circle cx={cx} cy={cx} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.4s ease" }} />
        {/* Inner deco */}
        <circle cx={cx} cy={cx} r={r - stroke - 6}
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
      borderRadius: 16, padding: "12px 20px",
      animation: "slideInRight 0.4s ease, fadeOut 0.4s ease 2.4s forwards",
      backdropFilter: "blur(12px)",
    }}>
      <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "#22d3ee", fontWeight: 900, letterSpacing: "0.1em" }}>
        +{xp} XP ACQUIRED
      </p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Session complete</p>
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

      {/* Subject Selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => { if (!running) setSubject(s); }}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.06em", cursor: running ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              background: subject === s ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
              border: subject === s ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: subject === s ? "#22d3ee" : "rgba(255,255,255,0.4)",
              transition: "all 0.2s",
              opacity: running && subject !== s ? 0.4 : 1,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Ring */}
      <TimerRing progress={progress} color={color} size={220} stroke={7}>
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 34, fontWeight: 900,
            color: running ? "#22d3ee" : elapsed > 0 ? "#f59e0b" : "rgba(255,255,255,0.8)",
            letterSpacing: -1, lineHeight: 1,
            textShadow: running ? "0 0 20px rgba(34,211,238,0.5)" : "none",
            transition: "all 0.4s",
          }}>
            {formatTime(elapsed)}
          </p>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", marginTop: 6, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            {running ? subject + " · IN SESSION" : elapsed > 0 ? "PAUSED" : "FREE STUDY TIMER"}
          </p>
          {elapsed > 0 && (
            <p style={{ fontSize: 10, color: "#22d3ee", fontWeight: 800, marginTop: 4, fontFamily: "'Orbitron', sans-serif" }}>
              +{Math.floor(elapsed / 60) * XP_PER_MINUTE} XP
            </p>
          )}
        </div>
      </TimerRing>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleStartStop} style={{
          padding: "12px 32px", borderRadius: 12,
          fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900,
          letterSpacing: "0.1em", cursor: "pointer",
          background: running ? "rgba(239,68,68,0.1)" : "rgba(34,211,238,0.1)",
          border: running ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(34,211,238,0.4)",
          color: running ? "#ef4444" : "#22d3ee",
          transition: "all 0.2s",
        }}>
          {running ? "PAUSE" : elapsed > 0 ? "RESUME" : "START"}
        </button>

        {elapsed > 0 && (
          <>
            <button onClick={handleLap} style={{
              padding: "12px 16px", borderRadius: 12, fontSize: 12, cursor: "pointer",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b", fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            }}>
              LAP
            </button>
            <button onClick={handleStop} style={{
              padding: "12px 16px", borderRadius: 12, fontSize: 12, cursor: "pointer",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e", fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            }}>
              DONE
            </button>
          </>
        )}
      </div>

      {/* Laps */}
      {laps.length > 0 && (
        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 6 }}>
          {laps.map((l, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11, color: "rgba(255,255,255,0.5)",
            }}>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10 }}>{l.label}</span>
              <span style={{ color: "#22d3ee", fontWeight: 800 }}>{formatTime(l.secs)}</span>
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
    } else {
      setPhase("focus");
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

      {/* Phase tabs */}
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {(["focus", "short", "long"] as PomodoroPhase[]).map(p => {
          const pr = POMODORO_PRESETS[p];
          return (
            <button key={p} onClick={() => switchPhase(p)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, cursor: running ? "not-allowed" : "pointer",
              fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: phase === p ? `rgba(${p === "focus" ? "34,211,238" : p === "short" ? "52,211,153" : "168,85,247"},0.1)` : "rgba(255,255,255,0.03)",
              border: phase === p ? `1px solid ${pr.color}66` : "1px solid rgba(255,255,255,0.06)",
              color: phase === p ? pr.color : "rgba(255,255,255,0.3)",
              transition: "all 0.2s",
              opacity: running && phase !== p ? 0.4 : 1,
            }}>
              {pr.label}<br />
              <span style={{ fontSize: 8, opacity: 0.7 }}>{pr.mins}M</span>
            </button>
          );
        })}
      </div>

      {/* Subject */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {SUBJECTS.slice(0, 4).map(s => (
          <button key={s} onClick={() => { if (!running) setSubject(s); }}
            style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif",
              background: subject === s ? `${preset.color}15` : "rgba(255,255,255,0.03)",
              border: subject === s ? `1px solid ${preset.color}44` : "1px solid rgba(255,255,255,0.07)",
              color: subject === s ? preset.color : "rgba(255,255,255,0.35)",
              transition: "all 0.2s",
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Ring */}
      <TimerRing progress={progress} color={preset.color} size={220} stroke={7}>
        <div style={{ textAlign: "center" }}>
          {/* Cycle dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i < cycle % 4 + 1 ? preset.color : "rgba(255,255,255,0.1)",
                boxShadow: i < cycle % 4 + 1 ? `0 0 6px ${preset.color}` : "none",
              }} />
            ))}
          </div>
          <p style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 34, fontWeight: 900,
            color: running ? preset.color : "rgba(255,255,255,0.8)",
            letterSpacing: -1, lineHeight: 1,
            textShadow: running ? `0 0 20px ${preset.color}66` : "none",
            transition: "all 0.4s",
          }}>
            {formatTime(remaining)}
          </p>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", marginTop: 6, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            {running ? preset.desc : preset.label}
          </p>
          <p style={{ fontSize: 10, color: bonusActive ? "#f59e0b" : preset.color, fontWeight: 800, marginTop: 5, fontFamily: "'Orbitron', sans-serif" }}>
            +{displayXP} XP {bonusActive && "🔥x1.5"}
          </p>
        </div>
      </TimerRing>

      {/* Streak & bonus */}
      {streak > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20,
          background: bonusActive ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
          border: bonusActive ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)",
        }}>
          <Flame size={13} color={bonusActive ? "#f59e0b" : "rgba(255,255,255,0.3)"} />
          <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "'Orbitron', sans-serif", color: bonusActive ? "#f59e0b" : "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
            {streak} STREAK {bonusActive ? "— BONUS ACTIVE" : ""}
          </span>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={toggleTimer} style={{
          padding: "12px 36px", borderRadius: 12,
          fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 900,
          letterSpacing: "0.1em", cursor: "pointer",
          background: running ? "rgba(239,68,68,0.1)" : `${preset.color}15`,
          border: running ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${preset.color}44`,
          color: running ? "#ef4444" : preset.color,
          transition: "all 0.2s",
        }}>
          {running ? "PAUSE" : remaining === totalSecs ? "ENTER DUNGEON" : "RESUME"}
        </button>
        <button onClick={resetTimer} style={{
          padding: "12px 14px", borderRadius: 12, cursor: "pointer",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.4)", transition: "all 0.2s",
        }}>
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Pomodoro tip */}
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.5, maxWidth: 260 }}>
        {phase === "focus" ? `Cycle ${cycle} · Focus for ${preset.mins}min → short break` : `Rest up · Next: Focus session`}
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={14} color="#f59e0b" />
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Today's Study Board
          </h3>
        </div>
        <span style={{ fontSize: 9, color: "#22d3ee", fontWeight: 800, border: "1px solid rgba(34,211,238,0.3)", padding: "2px 8px", borderRadius: 20 }}>LIVE</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((p, i) => (
          <div key={p.name} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
            borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
            background: p.isCurrentUser ? "rgba(34,211,238,0.06)" : i === 0 ? "rgba(245,158,11,0.04)" : "transparent",
            border: p.isCurrentUser ? "1px solid rgba(34,211,238,0.2)" : i === 0 ? "1px solid rgba(245,158,11,0.15)" : "1px solid transparent",
          }}>
            {/* Rank number */}
            <span style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 900, minWidth: 22, textAlign: "center", fontStyle: "italic",
              color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "rgba(255,255,255,0.3)",
            }}>
              {String(p.rank).padStart(2, "0")}
            </span>

            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={p.avatar} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid ${p.rankColor}` }} alt={p.name} />
              <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 9 }}>{p.rankIcon}</span>
            </div>

            {/* Name + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                color: p.isCurrentUser ? "#22d3ee" : "rgba(255,255,255,0.8)",
                textTransform: "uppercase", fontStyle: "italic",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {p.name} {p.isCurrentUser && "(YOU)"}
              </p>
              {/* Study bar */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${Math.min(100, (p.todayMinutes / 200) * 100)}%`,
                  background: p.isCurrentUser ? "#22d3ee" : p.rankColor,
                  transition: "width 0.8s ease",
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 900, color: p.isCurrentUser ? "#22d3ee" : "rgba(255,255,255,0.7)" }}>
                {formatMinutes(p.todayMinutes)}
              </p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>TODAY</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
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
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <BarChart2 size={14} color="#22d3ee" />
        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em" }}>
          TODAY'S STATS
        </h3>
      </div>

      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Study Time",    value: formatMinutes(todayMins), color: "#22d3ee", icon: Clock       },
          { label: "Focus XP",      value: `+${totalXP}`,           color: "#f59e0b", icon: Zap          },
          { label: "Focus Sessions", value: focusSess,              color: "#a855f7", icon: Brain        },
          { label: "Avg Session",   value: `${avgMins}m`,           color: "#34d399", icon: TrendingUp   },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "12px 14px", textAlign: "center",
          }}>
            <s.icon size={16} color={s.color} style={{ margin: "0 auto 6px" }} />
            <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Session log */}
      {sessions.length > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 8 }}>SESSION LOG</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
            {[...sessions].reverse().map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{s.type} · {s.subject}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{s.duration}min</p>
                </div>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 900, color: "#f59e0b" }}>+{s.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <BookOpen size={32} color="rgba(255,255,255,0.1)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Start a session to track stats</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ShadowTimer() {
  const [mode, setMode]             = useState<TimerMode>("pomodoro");
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [xpNotif, setXpNotif]       = useState<number | null>(null);
  const [motiveLine, setMotiveLine] = useState(MOTIVATIONAL_LINES[0]);
  const sessionIdRef                = useRef(0);

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
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; pointer-events: none; } }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 12px rgba(34,211,238,0.3)} 50%{box-shadow:0 0 24px rgba(34,211,238,0.6)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 2px; }
      `}</style>

      {xpNotif !== null && (
        <XPNotif xp={xpNotif} onDone={() => setXpNotif(null)} />
      )}

      <div style={{
        background: "#02010a", minHeight: "100vh",
        fontFamily: "'Outfit', sans-serif", color: "white",
        padding: "28px 20px",
        backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(14,165,233,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 80% 100%, rgba(124,58,237,0.05) 0%, transparent 60%)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: 8, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 10, display: "flex", alignItems: "center" }}>
              <Timer size={18} color="#22d3ee" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: "0.1em" }}>
                SHADOW <span style={{ color: "#22d3ee" }}>FOCUS</span>
              </h1>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 2 }}>STUDY TIMER SYSTEM</p>
            </div>
          </div>

          {/* Live stats pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 20, padding: "5px 12px" }}>
              <Clock size={12} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", fontFamily: "'Orbitron', sans-serif" }}>{formatMinutes(todayMins)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 20, padding: "5px 12px" }}>
              <Zap size={12} color="#22d3ee" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#22d3ee", fontFamily: "'Orbitron', sans-serif" }}>
                +{sessions.reduce((a, s) => a + s.xp, 0)} XP
              </span>
            </div>
          </div>
        </div>

        {/* Motivational banner */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
          borderLeft: "3px solid #22d3ee", borderRadius: 10, padding: "10px 16px",
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic", letterSpacing: "0.04em" }}>
            ⚔️ {motiveLine}
          </p>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 5 }}>
          {(["pomodoro", "free"] as TimerMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer",
              fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 900,
              letterSpacing: "0.1em", textTransform: "uppercase",
              background: mode === m ? "rgba(34,211,238,0.12)" : "transparent",
              border: mode === m ? "1px solid rgba(34,211,238,0.35)" : "1px solid transparent",
              color: mode === m ? "#22d3ee" : "rgba(255,255,255,0.3)",
              transition: "all 0.25s",
            }}>
              {m === "pomodoro" ? "⏱ Pomodoro" : "∞ Free Timer"}
            </button>
          ))}
        </div>

        {/* Main layout: Timer | Leaderboard + Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

          {/* Timer Card */}
          <div style={{
            background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.07)", borderTop: "3px solid #22d3ee",
            borderRadius: 20, padding: "28px 24px",
          }}>
            {mode === "pomodoro" ? (
              <PomodoroTimer onSessionComplete={handleSessionComplete} />
            ) : (
              <FreeTimer onSessionComplete={handleSessionComplete} />
            )}
          </div>

          {/* Right column: Leaderboard + Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Leaderboard */}
            <div style={{
              background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(34,211,238,0.5)",
              borderRadius: 20, padding: "20px",
            }}>
              <StudyLeaderboard todayMinutes={todayMins} />
            </div>

            {/* Stats */}
            <div style={{
              background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid rgba(168,85,247,0.5)",
              borderRadius: 20, padding: "20px",
            }}>
              <StatsPanel sessions={sessions} />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, textAlign: "center", opacity: 0.2 }}>
          <p style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: "1.2em", color: "#22d3ee", textTransform: "uppercase" }}>
            RankPush · Shadow Focus · 2026
          </p>
        </div>

      </div>
    </>
  );
}