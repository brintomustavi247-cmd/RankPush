"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions";
import {
  Trophy, ArrowLeft, Swords, ChevronRight, Sparkles,
  Target, Zap, Clock, Heart, Flame, Shield, Star,
  Brain, Crown, Atom, FlaskConical, Sigma, Dna,
  Lock, CheckCircle, XCircle, BarChart2, Crosshair
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// TYPES
// ============================================================
type GameState = "playing" | "won" | "lost";
type FeedbackType = "success" | "danger" | "warning";

interface Feedback {
  text: string;
  type: FeedbackType;
  id: number;
}

interface AnswerLog {
  question: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
  timeMs: number;
}

// ============================================================
// CONSTANTS — matches dashboard rank/color system
// ============================================================
const SUBJECT_META: Record<string, { color: string; glow: string; icon: React.ReactNode; label: string }> = {
  physics:   { color: "#22d3ee", glow: "rgba(34,211,238,0.3)",   icon: <Atom size={18} />,        label: "Physics"   },
  chemistry: { color: "#a78bfa", glow: "rgba(167,139,250,0.3)",  icon: <FlaskConical size={18} />, label: "Chemistry" },
  math:      { color: "#34d399", glow: "rgba(52,211,153,0.3)",   icon: <Sigma size={18} />,        label: "Math"      },
  biology:   { color: "#f87171", glow: "rgba(248,113,113,0.3)",  icon: <Dna size={18} />,          label: "Biology"   },
};

const COMBO_THRESHOLDS = [
  { min: 10, multiplier: 4,   label: "LEGENDARY", color: "#ec4899" },
  { min: 7,  multiplier: 3,   label: "EPIC",      color: "#a855f7" },
  { min: 5,  multiplier: 2.5, label: "RARE",      color: "#f59e0b" },
  { min: 3,  multiplier: 2,   label: "UNCOMMON",  color: "#22d3ee" },
  { min: 1,  multiplier: 1.5, label: "COMBO",     color: "#34d399" },
  { min: 0,  multiplier: 1,   label: "",          color: "white"   },
];

const getComboInfo = (combo: number) =>
  COMBO_THRESHOLDS.find(t => combo >= t.min) || COMBO_THRESHOLDS[COMBO_THRESHOLDS.length - 1];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ArenaPage() {
  const params  = useParams();
  const router  = useRouter();

  const subject     = (params?.subject as string || "physics").toLowerCase();
  const subjectMeta = SUBJECT_META[subject] || SUBJECT_META.physics;
  const questions   = physicsQuestions || [];
  const total       = questions.length;

  // ── Core Game State ──
  const [idx,        setIdx]       = useState(0);
  const [hp,         setHp]        = useState(100);
  const [exp,        setExp]       = useState(0);
  const [gameState,  setGameState] = useState<GameState>("playing");
  const [timeLeft,   setTimeLeft]  = useState(15);

  // ── Combat State ──
  const [combo,        setCombo]        = useState(0);
  const [maxCombo,     setMaxCombo]     = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [multiplier,   setMultiplier]   = useState(1);
  const [isWrong,      setIsWrong]      = useState(false);
  const [feedback,     setFeedback]     = useState<Feedback[]>([]);
  const [answerLog,    setAnswerLog]    = useState<AnswerLog[]>([]);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [selectedOpt,  setSelectedOpt]  = useState<string | null>(null);
  const [showAnswer,   setShowAnswer]  = useState(false);

  // ── Power-ups ──
  const [hasFreeze,   setHasFreeze]   = useState(true);
  const [hasHeal,     setHasHeal]     = useState(true);
  const [hasShield,   setHasShield]   = useState(true); 
  const [isFrozen,    setIsFrozen]    = useState(false);
  const [shieldActive,setShieldActive]= useState(false);

  // ── UI State ──
  const [showReview,  setShowReview]  = useState(false);
  const [animExp,     setAnimExp]     = useState(0);

  const feedbackId  = useRef(0);
  const currentQ    = questions[idx] || null;
  const accuracy    = total > 0 ? Math.round((correctCount / Math.max(idx, 1)) * 100) : 0;
  const comboInfo   = getComboInfo(combo);

  // ── EXP count-up on result ──
  useEffect(() => {
    if (gameState !== "playing") {
      let start = 0;
      const step = exp / 60;
      const timer = setInterval(() => {
        start = Math.min(start + step, exp);
        setAnimExp(Math.round(start));
        if (start >= exp) clearInterval(timer);
      }, 16);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // ── Multiplier sync ──
  useEffect(() => {
    const info = getComboInfo(combo);
    setMultiplier(info.multiplier);
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo]);

  // ── Timer ──
  useEffect(() => {
    if (gameState !== "playing" || !currentQ || isFrozen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleTimeout(); return 15; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [idx, gameState, isFrozen]);

  // ── Helpers ──
  const addFeedback = useCallback((text: string, type: FeedbackType) => {
    const id = feedbackId.current++;
    setFeedback(prev => [...prev, { text, type, id }]);
    setTimeout(() => setFeedback(prev => prev.filter(f => f.id !== id)), 1600);
  }, []);

  const nextQuestion = useCallback(() => {
    setSelectedOpt(null);
    setShowAnswer(false);
    setTimeout(() => {
      if (idx < total - 1) {
        setIdx(prev => prev + 1);
        setTimeLeft(15);
        setIsFrozen(false);
        setQuestionStart(Date.now());
      } else {
        setGameState("won");
      }
    }, 600);
  }, [idx, total]);

  const takeDamage = useCallback((amount: number) => {
    if (shieldActive) {
      setShieldActive(false);
      addFeedback("🛡️ SHIELD BLOCKED!", "warning");
      return;
    }
    setIsWrong(true);
    setTimeout(() => setIsWrong(false), 500);
    setHp(prev => {
      const next = prev - amount;
      if (next <= 0) { setGameState("lost"); return 0; }
      return next;
    });
  }, [shieldActive, addFeedback]);

  const handleTimeout = useCallback(() => {
    setCombo(0);
    addFeedback("⏰ TIME OUT! -20 HP", "danger");
    takeDamage(20);
    if (hp > 20) nextQuestion();
  }, [hp, addFeedback, takeDamage, nextQuestion]);

  // ── Answer Handler ──
  const handleAnswer = useCallback((opt: string) => {
    if (gameState !== "playing" || selectedOpt) return;
    const elapsed = Date.now() - questionStart;
    setSelectedOpt(opt);
    setShowAnswer(true);

    const log: AnswerLog = {
      question:  currentQ?.questionText || "",
      selected:  opt,
      correct:   currentQ?.correctAnswer || "",
      isCorrect: opt === currentQ?.correctAnswer,
      timeMs:    elapsed,
    };
    setAnswerLog(prev => [...prev, log]);

    if (opt === currentQ?.correctAnswer) {
      const earned = Math.round(100 * multiplier);
      const speedBonus = elapsed < 5000 ? Math.round(50 * multiplier) : 0;
      setExp(prev => prev + earned + speedBonus);
      setCombo(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
      addFeedback(`+${earned + speedBonus} EXP${speedBonus > 0 ? " ⚡FAST!" : ""}`, "success");
      if (combo > 0) addFeedback(`${combo + 1}x ${comboInfo.label}!`, "success");
    } else {
      setCombo(0);
      addFeedback("✗ MISS! -25 HP", "danger");
      takeDamage(25);
    }
    nextQuestion();
  }, [gameState, selectedOpt, currentQ, multiplier, combo, comboInfo, questionStart, addFeedback, takeDamage, nextQuestion]);

  // ── Power-up Handlers ──
  const useFreeze = () => {
    if (!hasFreeze || gameState !== "playing") return;
    setHasFreeze(false);
    setIsFrozen(true);
    addFeedback("❄️ TIME FROZEN (5s)", "warning");
    setTimeout(() => setIsFrozen(false), 5000);
  };

  const useHeal = () => {
    if (!hasHeal || hp >= 100 || gameState !== "playing") return;
    setHasHeal(false);
    setHp(prev => Math.min(prev + 35, 100));
    addFeedback("💚 +35 HP RESTORED", "success");
  };

  const useShield = () => {
    if (!hasShield || gameState !== "playing") return;
    setHasShield(false);
    setShieldActive(true);
    addFeedback("🛡️ SHIELD ACTIVATED", "warning");
  };

  // ── HP Color ──
  const hpColor = hp > 60 ? "#22c55e" : hp > 30 ? "#f97316" : "#ef4444";
  const hpGlow  = hp > 60 ? "rgba(34,197,94,0.4)" : hp > 30 ? "rgba(249,115,22,0.4)" : "rgba(239,68,68,0.4)";

  // ── Loading ──
  if (!currentQ && gameState === "playing") {
    return (
      <div style={{ minHeight: "100vh", background: "#02010a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Orbitron', sans-serif", color: "#22d3ee", fontSize: 18, letterSpacing: "0.5em", animation: "pulse 1.5s infinite" }}>
          INITIALIZING...
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet" />
      <script src="https://cdn.tailwindcss.com" async />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        /* Fix: Allowed vertical scrolling, removed strict height limit */
        html, body {
          background: #02010a;
          color: white;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
          min-height: 100vh; 
        }
        .font-logo { font-family: 'Orbitron', sans-serif; }
        .font-bangla { font-family: 'Hind Siliguri', sans-serif; }

        body::before {
          content: '';
          position: fixed; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
          pointer-events: none; z-index: 1;
        }

        .q-card {
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 4px solid var(--sub-color);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        .q-card::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, var(--sub-color), transparent);
        }

        .opt-btn {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          width: 100%;
          color: white;
        }
        .opt-btn:hover:not(:disabled) {
          background: rgba(var(--sub-rgb), 0.08);
          border-color: var(--sub-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(var(--sub-rgb), 0.15);
        }
        .opt-btn.correct {
          background: rgba(34,197,94,0.1) !important;
          border-color: #22c55e !important;
          box-shadow: 0 0 20px rgba(34,197,94,0.2) !important;
        }
        .opt-btn.wrong {
          background: rgba(239,68,68,0.1) !important;
          border-color: #ef4444 !important;
        }

        .power-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          font-family: 'Outfit', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .power-btn:hover:not(:disabled) {
          border-color: var(--btn-color);
          background: rgba(var(--btn-rgb), 0.1);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(var(--btn-rgb), 0.2);
        }
        .power-btn:disabled {
          opacity: 0.3; cursor: not-allowed;
        }

        @keyframes damageFlash { 0%, 100% { opacity: 0; } 50% { opacity: 0.6; } }
        .damage-flash { animation: damageFlash 0.5s ease; }

        @keyframes urgentPulse { 0%, 100% { transform: scale(1); color: #ef4444; } 50% { transform: scale(1.15); color: #fca5a5; } }
        .timer-urgent { animation: urgentPulse 0.6s infinite; }

        @keyframes comboPop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        .combo-pop { animation: comboPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        @keyframes hpBeat { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .hp-critical { animation: hpBeat 0.7s infinite; }

        @keyframes statReveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .stat-reveal { animation: statReveal 0.5s ease forwards; }

        @keyframes shieldGlow { 0%, 100% { box-shadow: 0 0 10px rgba(250,204,21,0.3); } 50% { box-shadow: 0 0 25px rgba(250,204,21,0.7); } }
        .shield-active { animation: shieldGlow 1s ease infinite; border-color: #facc15 !important; }
      `}</style>

      {/* ── AMBIENT BG ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, background: subjectMeta.color, opacity: 0.05, filter: "blur(130px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, background: "#7c3aed", opacity: 0.04, filter: "blur(130px)", borderRadius: "50%" }} />
      </div>

      {/* ── DAMAGE OVERLAY ── */}
      <AnimatePresence>
        {isWrong && (
          <motion.div
            initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: "fixed", inset: 0, background: "#ef4444", mixBlendMode: "overlay", zIndex: 200, pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>

      {/* ── SHIELD OVERLAY ── */}
      <AnimatePresence>
        {shieldActive && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, border: "3px solid #facc15", borderRadius: 0, zIndex: 199, pointerEvents: "none", boxShadow: "inset 0 0 60px rgba(250,204,21,0.1)" }}
          />
        )}
      </AnimatePresence>

      {/* ── FLOATING FEEDBACK ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AnimatePresence>
          {feedback.map(f => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: -60, scale: 1 }}
              exit={{ opacity: 0, y: -120, scale: 1.1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-center w-full px-4"
              style={{
                position: "absolute",
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "clamp(20px, 6vw, 36px)",
                fontWeight: 900,
                fontStyle: "italic",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: f.type === "success" ? "#22d3ee" : f.type === "warning" ? "#facc15" : "#f87171",
                textShadow: `0 0 20px ${f.type === "success" ? "rgba(34,211,238,0.7)" : f.type === "warning" ? "rgba(250,204,21,0.7)" : "rgba(248,113,113,0.7)"}`,
              }}
            >
              {f.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── MAIN LAYOUT (Fixed for scroll and responsiveness) ── */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "20px 5%", position: "relative", zIndex: 10, overflowX: "hidden", overflowY: "auto" }}>

        {/* ═══════ HUD HEADER ═══════ */}
        <AnimatePresence>
          {gameState === "playing" && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-wrap md:flex-nowrap justify-between items-start md:items-center mb-6 shrink-0 relative z-20 gap-y-4"
            >
              {/* Left: Back + Subject + Progress */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto order-1">
                <button
                  onClick={() => router.back()}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "rgba(255,255,255,0.6)", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" }}
                >
                  <ArrowLeft size={16} />
                  <span className="hidden xs:inline" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Flee</span>
                </button>

                {/* Subject badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: `rgba(${subjectMeta.color === "#22d3ee" ? "34,211,238" : "167,139,250"},0.08)`, border: `1px solid ${subjectMeta.color}33`, borderRadius: 100, padding: "6px 12px" }}>
                  <span style={{ color: subjectMeta.color }}>{subjectMeta.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: subjectMeta.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>{subjectMeta.label}</span>
                </div>

                {/* Progress */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.5 }}>
                  <Target size={12} color="#a855f7" />
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Trial {idx + 1}/{total}</span>
                </div>

                {/* Combo badge */}
                <AnimatePresence>
                  {combo >= 2 && (
                    <motion.div
                      key={combo}
                      className="combo-pop"
                      style={{ display: "flex", alignItems: "center", gap: 6, background: `${comboInfo.color}22`, border: `1px solid ${comboInfo.color}55`, borderRadius: 100, padding: "4px 10px" }}
                    >
                      <Flame size={12} color={comboInfo.color} />
                      <span className="font-logo" style={{ fontSize: 11, fontWeight: 900, color: comboInfo.color, fontStyle: "italic" }}>
                        {combo}x {comboInfo.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Center: Timer (Moves to new row on mobile) */}
              <div className="flex flex-col items-center order-3 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 md:order-2 mt-2 md:mt-0">
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <motion.circle
                      cx="50%" cy="50%" r="44%"
                      fill="none"
                      stroke={isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : subjectMeta.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "276", strokeDashoffset: "0" }}
                      animate={{ strokeDashoffset: 276 - (276 * timeLeft / 15) }}
                      transition={{ duration: 1, ease: "linear" }}
                      style={{ filter: `drop-shadow(0 0 6px ${isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : subjectMeta.color})` }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span
                      className={`font-logo ${timeLeft <= 5 && !isFrozen ? "timer-urgent" : ""}`}
                      style={{ fontSize: 20, fontWeight: 900, color: isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : "white" }}
                    >
                      {isFrozen ? "❄" : timeLeft}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.4, marginTop: 4 }}>
                  {isFrozen ? "FROZEN" : "TIME LEFT"}
                </span>
              </div>

              {/* Right: HP + EXP */}
              <div className="flex items-center gap-3 md:gap-4 order-2 md:order-3 ml-auto md:ml-0">
                {/* HP */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Heart size={12} color={hpColor} style={{ filter: `drop-shadow(0 0 6px ${hpGlow})` }} className={hp <= 25 ? "hp-critical" : ""} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: hpColor, letterSpacing: "0.1em", textTransform: "uppercase" }} className={hp <= 25 ? "hp-critical" : ""}>
                      VITALITY: {hp}%
                    </span>
                  </div>
                  <div className="w-24 md:w-32" style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <motion.div
                      style={{ height: "100%", background: `linear-gradient(90deg, ${hpColor}, ${hpColor}cc)`, borderRadius: 4, boxShadow: `0 0 8px ${hpGlow}` }}
                      animate={{ width: `${hp}%` }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                    />
                  </div>
                </div>

                {/* EXP */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px", textAlign: "right" }}>
                  <p style={{ fontSize: 8, fontWeight: 800, color: subjectMeta.color, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 2 }}>Experience</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="font-logo" style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{exp}</span>
                    <span style={{ fontSize: 9, color: "#a855f7", fontWeight: 900 }}>{multiplier}x</span>
                    <Zap size={12} color={subjectMeta.color} />
                  </div>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* ═══════ POWER-UPS ═══════ */}
        <AnimatePresence>
          {gameState === "playing" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20, flexShrink: 0 }}
              className="flex-wrap"
            >
              <button
                className="power-btn px-3 py-2 text-[9px] md:text-[11px]"
                onClick={useFreeze}
                disabled={!hasFreeze}
                style={{ "--btn-color": "#3b82f6", "--btn-rgb": "59,130,246" } as any}
              >
                <Clock size={14} color={hasFreeze ? "#3b82f6" : "rgba(255,255,255,0.3)"} />
                <span style={{ color: hasFreeze ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", textDecoration: hasFreeze ? "none" : "line-through" }}>Freeze</span>
              </button>

              <button
                className="power-btn px-3 py-2 text-[9px] md:text-[11px]"
                onClick={useHeal}
                disabled={!hasHeal || hp >= 100}
                style={{ "--btn-color": "#22c55e", "--btn-rgb": "34,197,94" } as any}
              >
                <Heart size={14} color={hasHeal && hp < 100 ? "#22c55e" : "rgba(255,255,255,0.3)"} />
                <span style={{ color: hasHeal && hp < 100 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", textDecoration: hasHeal && hp < 100 ? "none" : "line-through" }}>Heal</span>
              </button>

              <button
                className={`power-btn px-3 py-2 text-[9px] md:text-[11px] ${shieldActive ? "shield-active" : ""}`}
                onClick={useShield}
                disabled={!hasShield || shieldActive}
                style={{ "--btn-color": "#facc15", "--btn-rgb": "250,204,21" } as any}
              >
                <Shield size={14} color={hasShield ? "#facc15" : "rgba(255,255,255,0.3)"} />
                <span style={{ color: hasShield ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", textDecoration: hasShield ? "none" : "line-through" }}>
                  {shieldActive ? "Active" : "Shield"}
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="flex-1 flex flex-col items-center max-w-[900px] mx-auto w-full relative z-10 pb-10">
          <AnimatePresence mode="wait">

            {/* ── PLAYING STATE ── */}
            {gameState === "playing" && currentQ && (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Question Card */}
                <div
                  className="q-card p-5 md:p-8"
                  style={{ "--sub-color": subjectMeta.color } as any}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${subjectMeta.color}18`, border: `1px solid ${subjectMeta.color}33`, borderRadius: 100, padding: "6px 14px" }}>
                      <Swords size={13} color={subjectMeta.color} />
                      <span style={{ fontSize: 9, fontWeight: 900, color: subjectMeta.color, letterSpacing: "0.3em", textTransform: "uppercase" }}>Tactical Query</span>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      ID: {currentQ.exam || "SYS-TEST"}
                    </span>
                  </div>

                  <h2 className="font-bangla text-xl md:text-2xl lg:text-[28px] font-bold leading-relaxed text-white">
                    {currentQ.questionText}
                  </h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
                  {currentQ.options.map((opt: string, i: number) => {
                    const isSelected = selectedOpt === opt;
                    const isCorrect  = showAnswer && opt === currentQ.correctAnswer;
                    const isWrongSel = showAnswer && isSelected && opt !== currentQ.correctAnswer;
                    const optLabels  = ["A", "B", "C", "D"];

                    return (
                      <button
                        key={i}
                        className={`opt-btn py-4 px-4 md:py-5 md:px-5 ${isCorrect ? "correct" : ""} ${isWrongSel ? "wrong" : ""}`}
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selectedOpt}
                        style={{ "--sub-color": subjectMeta.color, "--sub-rgb": "34,211,238" } as any}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: isCorrect ? "rgba(34,197,94,0.2)" : isWrongSel ? "rgba(239,68,68,0.2)" : `${subjectMeta.color}18`, border: `1px solid ${isCorrect ? "#22c55e" : isWrongSel ? "#ef4444" : subjectMeta.color + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isCorrect ? <CheckCircle size={14} color="#22c55e" /> : isWrongSel ? <XCircle size={14} color="#ef4444" /> : (
                            <span className="font-logo" style={{ fontSize: 11, color: subjectMeta.color }}>{optLabels[i]}</span>
                          )}
                        </div>
                        <span className="font-bangla text-sm md:text-[15px] font-semibold text-left" style={{ color: isCorrect ? "#22c55e" : isWrongSel ? "#f87171" : "rgba(255,255,255,0.85)", wordBreak: "break-word" }}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress bar at bottom */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", background: `linear-gradient(90deg, ${subjectMeta.color}, ${subjectMeta.color}88)`, borderRadius: 2 }}
                      animate={{ width: `${((idx + 1) / total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.4, whiteSpace: "nowrap", letterSpacing: "0.1em" }}>{idx + 1}/{total}</span>
                </div>
              </motion.div>
            )}

            {/* ── RESULT STATE ── */}
            {(gameState === "won" || gameState === "lost") && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
                style={{
                  width: "100%", maxWidth: 740,
                  background: "linear-gradient(135deg, rgba(10,8,25,0.95), rgba(5,3,15,0.98))",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${gameState === "won" ? "rgba(34,211,238,0.25)" : "rgba(239,68,68,0.25)"}`,
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: `0 40px 80px rgba(0,0,0,0.8), 0 0 60px ${gameState === "won" ? "rgba(34,211,238,0.08)" : "rgba(239,68,68,0.08)"}`,
                }}
              >
                {/* Result Header */}
                <div style={{ padding: "36px 20px 28px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <motion.h1
                    className="font-logo"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{
                      fontSize: "clamp(32px, 8vw, 48px)", fontStyle: "italic", textTransform: "uppercase",
                      background: gameState === "won"
                        ? "linear-gradient(135deg, #22d3ee, #a855f7)"
                        : "linear-gradient(135deg, #ef4444, #f87171)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      marginBottom: 6,
                    }}
                  >
                    {gameState === "won" ? "DUNGEON CLEARED" : "SYSTEM FAILED"}
                  </motion.h1>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.5 }}>
                    {gameState === "won" ? "Performance Evaluation" : "Fatal Error Detected"}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 md:p-8">
                  {[
                    { label: "Accuracy",    value: `${accuracy}%`,      icon: Crosshair, color: "#22d3ee", delay: 0.1 },
                    { label: "Max Combo",   value: `${maxCombo}x`,      icon: Flame,     color: "#f59e0b", delay: 0.2 },
                    { label: "Remaining HP",value: `${hp}`,             icon: Heart,     color: hpColor,   delay: 0.3 },
                    { label: "Total EXP",   value: `+${animExp}`,       icon: Zap,       color: subjectMeta.color, delay: 0.4 },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      className="stat-reveal"
                      style={{ animationDelay: `${s.delay}s`, background: i === 3 ? `${subjectMeta.color}10` : "rgba(255,255,255,0.03)", border: `1px solid ${i === 3 ? subjectMeta.color + "33" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: "16px 10px", textAlign: "center" }}
                    >
                      <s.icon size={16} color={s.color} style={{ margin: "0 auto 8px", opacity: 0.7 }} />
                      <p style={{ fontSize: "clamp(20px, 5vw, 26px)", fontWeight: 900, color: s.color, fontFamily: "'Orbitron', sans-serif", marginBottom: 2 }}>{s.value}</p>
                      <p style={{ fontSize: 8, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Review Toggle */}
                <div style={{ padding: "0 24px 16px" }}>
                  <button
                    onClick={() => setShowReview(!showReview)}
                    style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 800, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <BarChart2 size={13} />
                    {showReview ? "Hide" : "Review"} Answers ({correctCount}/{total})
                  </button>

                  <AnimatePresence>
                    {showReview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden", marginTop: 10 }}
                      >
                        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
                          {answerLog.map((a, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", background: a.isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${a.isCorrect ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`, borderRadius: 8 }}>
                              {a.isCorrect ? <CheckCircle size={14} color="#22c55e" className="shrink-0" /> : <XCircle size={14} color="#ef4444" className="shrink-0" />}
                              <span className="font-bangla" style={{ fontSize: 12, opacity: 0.8, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                Q{i + 1}: {a.question.slice(0, 40)}...
                              </span>
                              <span style={{ fontSize: 9, color: a.isCorrect ? "#22c55e" : "#ef4444", fontWeight: 800, whiteSpace: "nowrap" }}>
                                {Math.round(a.timeMs / 1000)}s
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button
                    onClick={() => { setIdx(0); setHp(100); setExp(0); setCombo(0); setMaxCombo(0); setCorrectCount(0); setGameState("playing"); setTimeLeft(15); setAnswerLog([]); setHasFreeze(true); setHasHeal(true); setHasShield(true); setShieldActive(false); setAnimExp(0); setSelectedOpt(null); setShowAnswer(false); }}
                    style={{ padding: "18px", background: "rgba(255,255,255,0.03)", border: "none", borderRight: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontWeight: 900, fontSize: 11, cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" }}
                  >
                    <Swords size={13} /> Retry
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    style={{ padding: "18px", background: `${subjectMeta.color}15`, border: "none", color: subjectMeta.color, fontWeight: 900, fontSize: 11, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" }}
                  >
                    <Sparkles size={13} /> Sanctuary <ChevronRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer style={{ textAlign: "center", paddingTop: 16, opacity: 0.2, flexShrink: 0 }}>
          <p className="font-logo" style={{ fontSize: 8, letterSpacing: "1.5em", color: subjectMeta.color, textTransform: "uppercase" }}>
            System Engine v9.1
          </p>
        </footer>
      </div>
    </>
  );
}