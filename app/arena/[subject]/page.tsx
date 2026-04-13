"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions";
import { awardBattleXP, saveBattleHistory } from "@/lib/xp-utils";
import { useAuthUid } from "@/hooks/use-auth-uid";
import {
  Swords, ChevronRight, Sparkles, Target, Zap, Clock,
  Heart, Flame, Shield, ArrowLeft, CheckCircle, XCircle,
  BarChart2, Crosshair, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type GameState = "playing" | "won" | "lost";
type FeedbackType = "success" | "danger" | "warning";
interface Feedback { text: string; type: FeedbackType; id: number; }
interface AnswerLog {
  question: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
  timeMs: number;
  explanation?: string;
}

// ─────────────────────────────────────────────
// SUBJECT META
// ─────────────────────────────────────────────
const SUBJECT_META: Record<string, { color: string; rgb: string; label: string }> = {
  physics:   { color: "#22d3ee", rgb: "34,211,238",   label: "Physics"   },
  chemistry: { color: "#a78bfa", rgb: "167,139,250",  label: "Chemistry" },
  math:      { color: "#34d399", rgb: "52,211,153",   label: "Math"      },
  biology:   { color: "#f87171", rgb: "248,113,113",  label: "Biology"   },
};

const COMBO_TIERS = [
  { min: 10, label: "LEGENDARY ✦", color: "#ec4899" },
  { min: 7,  label: "EPIC ★",      color: "#a855f7" },
  { min: 5,  label: "RARE ◆",      color: "#f59e0b" },
  { min: 3,  label: "HOT 🔥",      color: "#22d3ee" },
  { min: 1,  label: "COMBO",       color: "#34d399" },
  { min: 0,  label: "",            color: "white"   },
];
const getCombo = (n: number) => COMBO_TIERS.find(t => n >= t.min)!;
const getMultiplier = (n: number) => n >= 10 ? 4 : n >= 7 ? 3 : n >= 5 ? 2.5 : n >= 3 ? 2 : n >= 1 ? 1.5 : 1;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function ArenaPage() {
  const params  = useParams();
  const router  = useRouter();
  const subject = ((params?.subject as string) || "physics").toLowerCase();
  const meta    = SUBJECT_META[subject] || SUBJECT_META.physics;
  const questions = physicsQuestions || [];
  const total     = questions.length;

  // Core state
  const [idx,          setIdx]          = useState(0);
  const [hp,           setHp]           = useState(100);
  const [exp,          setExp]          = useState(0);
  const [gameState,    setGameState]    = useState<GameState>("playing");
  const [timeLeft,     setTimeLeft]     = useState(15);

  // Combat
  const [combo,        setCombo]        = useState(0);
  const [maxCombo,     setMaxCombo]     = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isWrong,      setIsWrong]      = useState(false);
  const [feedbacks,    setFeedbacks]    = useState<Feedback[]>([]);
  const [answerLog,    setAnswerLog]    = useState<AnswerLog[]>([]);
  const [selectedOpt,  setSelectedOpt] = useState<string | null>(null);
  const [showAnswer,   setShowAnswer]  = useState(false);
  const [qStartTime,   setQStartTime]  = useState(Date.now());

  // Power-ups
  const [hasFreeze,    setHasFreeze]    = useState(true);
  const [hasHeal,      setHasHeal]      = useState(true);
  const [hasShield,    setHasShield]    = useState(true);
  const [isFrozen,     setIsFrozen]     = useState(false);
  const [shieldActive, setShieldActive] = useState(false);

  // Result
  const [animExp,      setAnimExp]      = useState(0);
  const [expandedLog,  setExpandedLog]  = useState<number | null>(null);
  const [xpAwarded,    setXpAwarded]    = useState<number | null>(null);

  const fbId            = useRef(0);
  const xpSavedRef      = useRef(false); // prevent double-save
  const uidRef          = useAuthUid();  // cached auth uid
  // Snapshot of final battle values so the save effect only needs [gameState]
  const battleSnapRef   = useRef({ idx: 0, correctCount: 0, exp: 0, maxCombo: 0 });

  const currentQ = questions[idx] || null;
  const multiplier = getMultiplier(combo);
  const comboInfo  = getCombo(combo);
  const accuracy   = idx > 0 ? Math.round((correctCount / idx) * 100) : 0;
  const hpColor    = hp > 60 ? "#22c55e" : hp > 30 ? "#f97316" : "#ef4444";

  // Keep battle snapshot ref up to date
  useEffect(() => {
    battleSnapRef.current = { idx, correctCount, exp, maxCombo };
  }, [idx, correctCount, exp, maxCombo]);

  // EXP count-up on result
  useEffect(() => {
    if (gameState === "playing") return;
    let cur = 0;
    const step = exp / 50;
    const t = setInterval(() => {
      cur = Math.min(cur + step, exp);
      setAnimExp(Math.round(cur));
      if (cur >= exp) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [gameState, exp]);

  // Save battle result to Firebase when game ends
  useEffect(() => {
    if (gameState === "playing" || xpSavedRef.current) return;
    if (!uidRef.current) return;
    const uid = uidRef.current;
    const won = gameState === "won";
    const { idx: finalIdx, correctCount: finalCC, exp: finalExp, maxCombo: finalMax } = battleSnapRef.current;
    const acc = finalIdx > 0 ? Math.round((finalCC / finalIdx) * 100) : 0;

    (async () => {
      try {
        const awarded = await awardBattleXP(uid, won, acc);
        xpSavedRef.current = true; // mark saved only after success
        setXpAwarded(awarded);
        await saveBattleHistory(uid, {
          subject,
          won,
          exp: finalExp,
          accuracy: acc,
          maxCombo: finalMax,
          totalQuestions: total,
          correctCount: finalCC,
          xpAwarded: awarded,
        });
      } catch (err) {
        console.error(`Failed to save battle to Firebase (uid=${uid}, subject=${subject}, won=${won}, acc=${acc}):`, err);
      }
    })();
  }, [gameState, subject, total, uidRef]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing" || isFrozen || !currentQ) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { doTimeout(); return 15; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, gameState, isFrozen]);

  // Combo max track
  useEffect(() => {
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo]);

  const addFb = useCallback((text: string, type: FeedbackType) => {
    const id = fbId.current++;
    setFeedbacks(prev => [...prev, { text, type, id }]);
    setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== id)), 1800);
  }, []);

  const doNext = useCallback(() => {
    setSelectedOpt(null);
    setShowAnswer(false);
    setTimeout(() => {
      if (idx < total - 1) {
        setIdx(p => p + 1);
        setTimeLeft(15);
        setIsFrozen(false);
        setQStartTime(Date.now());
      } else {
        setGameState("won");
      }
    }, 700);
  }, [idx, total]);

  const doDamage = useCallback((amt: number) => {
    if (shieldActive) {
      setShieldActive(false);
      addFb("🛡️ SHIELD BLOCKED!", "warning");
      return;
    }
    setIsWrong(true);
    setTimeout(() => setIsWrong(false), 500);
    setHp(prev => {
      const next = prev - amt;
      if (next <= 0) { setGameState("lost"); return 0; }
      return next;
    });
  }, [shieldActive, addFb]);

  const doTimeout = useCallback(() => {
    setCombo(0);
    addFb("⏰ TIME OUT! -20 HP", "danger");
    doDamage(20);
    doNext();
  }, [addFb, doDamage, doNext]);

  const handleAnswer = useCallback((opt: string) => {
    if (gameState !== "playing" || selectedOpt) return;
    const elapsed = Date.now() - qStartTime;
    setSelectedOpt(opt);
    setShowAnswer(true);

    const isCorrect = opt === currentQ?.correctAnswer;
    setAnswerLog(prev => [...prev, {
      question:    currentQ?.questionText || "",
      selected:    opt,
      correct:     currentQ?.correctAnswer || "",
      isCorrect,
      timeMs:      elapsed,
      explanation: currentQ?.explanation || "",
    }]);

    if (isCorrect) {
      const earned     = Math.round(100 * multiplier);
      const speedBonus = elapsed < 5000 ? Math.round(30 * multiplier) : 0;
      setExp(p => p + earned + speedBonus);
      setCombo(p => p + 1);
      setCorrectCount(p => p + 1);
      addFb(`+${earned + speedBonus} EXP${speedBonus > 0 ? " ⚡" : ""}`, "success");
    } else {
      setCombo(0);
      addFb("✗ MISS! -25 HP", "danger");
      doDamage(25);
    }
    doNext();
  }, [gameState, selectedOpt, currentQ, multiplier, qStartTime, addFb, doDamage, doNext]);

  const useFreeze = () => {
    if (!hasFreeze || gameState !== "playing") return;
    setHasFreeze(false); setIsFrozen(true);
    addFb("❄️ TIME FROZEN", "warning");
    setTimeout(() => setIsFrozen(false), 5000);
  };
  const useHeal = () => {
    if (!hasHeal || hp >= 100 || gameState !== "playing") return;
    setHasHeal(false);
    setHp(p => Math.min(p + 35, 100));
    addFb("💚 +35 HP", "success");
  };
  const useShield = () => {
    if (!hasShield || shieldActive || gameState !== "playing") return;
    setHasShield(false); setShieldActive(true);
    addFb("🛡️ SHIELD ON", "warning");
  };

  const doRetry = () => {
    setIdx(0); setHp(100); setExp(0); setCombo(0); setMaxCombo(0);
    setCorrectCount(0); setGameState("playing"); setTimeLeft(15);
    setAnswerLog([]); setHasFreeze(true); setHasHeal(true); setHasShield(true);
    setShieldActive(false); setAnimExp(0); setSelectedOpt(null);
    setShowAnswer(false); setQStartTime(Date.now()); setExpandedLog(null);
    setXpAwarded(null);
    xpSavedRef.current = false;
  };

  if (!currentQ && gameState === "playing") {
    return (
      <div style={{ minHeight: "100dvh", background: "#02010a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Orbitron',sans-serif", color: "#22d3ee", fontSize: 16, letterSpacing: "0.4em" }}>LOADING...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html {
          height: -webkit-fill-available;
          background: #02010a;
        }
        body {
          min-height: 100vh;
          min-height: -webkit-fill-available;
          background: #02010a;
          color: white;
          font-family: 'Outfit', sans-serif;
          overflow: hidden;
          position: fixed;
          width: 100%;
        }

        /* Scanlines */
        body::before {
          content: '';
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
        }

        .font-logo  { font-family: 'Orbitron', sans-serif; }
        .font-bn    { font-family: 'Hind Siliguri', sans-serif; }

        /* Full screen layout */
        .arena-root {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 10;
          padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
        }

        /* HUD */
        .hud {
          flex-shrink: 0;
          padding: 12px 14px 0;
        }

        /* Row 1: Back | Timer | HP+EXP */
        .hud-row1 {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .hud-left  { display: flex; align-items: center; gap: 8px; }
        .hud-right { display: flex; align-items: flex-end; flex-direction: column; gap: 4px; }

        /* Row 2: Power-ups centered */
        .hud-row2 {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        /* Power-up btn */
        .pw-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.7);
          cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .pw-btn:disabled { opacity: 0.28; cursor: not-allowed; }
        .pw-btn.freeze:not(:disabled):hover { border-color: #3b82f6; color: #93c5fd; }
        .pw-btn.heal:not(:disabled):hover   { border-color: #22c55e; color: #86efac; }
        .pw-btn.shield:not(:disabled):hover { border-color: #facc15; color: #fde68a; }
        .pw-btn.shield-on { border-color: #facc15 !important; color: #fde68a !important; box-shadow: 0 0 12px rgba(250,204,21,0.3); }

        /* Subject + trial pill */
        .sub-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px;
          border-radius: 100px;
          font-size: 10px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* Back btn */
        .back-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.5); transition: all 0.2s;
          white-space: nowrap;
        }

        /* Timer circle */
        .timer-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }

        /* HP bar */
        .hp-bar-outer {
          width: 100px; height: 5px;
          background: rgba(255,255,255,0.06);
          border-radius: 3px; overflow: hidden;
        }

        /* Scrollable question area */
        .q-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding: 0 14px 12px;
          /* hide scrollbar on mobile */
          scrollbar-width: none;
        }
        .q-scroll::-webkit-scrollbar { display: none; }

        /* Question card */
        .q-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-left: 3px solid var(--sc);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }
        .q-card::after {
          content: '';
          position: absolute; top: 0; left: 3px; right: 0; height: 1px;
          background: linear-gradient(90deg, var(--sc), transparent);
        }

        /* Options */
        .opt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .opt-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          cursor: pointer; transition: all 0.2s;
          text-align: left; color: white;
          width: 100%;
        }
        .opt-btn:not(:disabled):hover {
          background: rgba(var(--sr), 0.08);
          border-color: var(--sc);
          transform: translateY(-1px);
        }
        .opt-btn:disabled { cursor: not-allowed; }
        .opt-btn.correct  { background: rgba(34,197,94,0.1) !important; border-color: #22c55e !important; }
        .opt-btn.wrong    { background: rgba(239,68,68,0.1) !important; border-color: #ef4444 !important; }

        /* Combo badge — fixed position so never overlaps */
        .combo-badge {
          position: fixed;
          top: 14px; left: 50%; transform: translateX(-50%);
          z-index: 60;
          display: flex; align-items: center; gap: 5px;
          padding: 4px 12px;
          border-radius: 100px;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px; font-weight: 900; font-style: italic;
          white-space: nowrap;
          pointer-events: none;
        }

        /* Feedback — stacked vertically, right side */
        .fb-container {
          position: fixed;
          right: 14px; top: 50%; transform: translateY(-50%);
          z-index: 120;
          display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
          pointer-events: none;
        }
        .fb-item {
          font-family: 'Orbitron', sans-serif;
          font-size: 13px; font-weight: 900; font-style: italic;
          white-space: nowrap;
          padding: 5px 10px;
          border-radius: 8px;
        }

        /* Damage flash */
        .dmg-flash {
          position: fixed; inset: 0; z-index: 200; pointer-events: none;
          background: #ef4444; mix-blend-mode: overlay;
        }
        /* Shield border */
        .shield-border {
          position: fixed; inset: 0; z-index: 199; pointer-events: none;
          border: 3px solid #facc15;
          box-shadow: inset 0 0 40px rgba(250,204,21,0.08);
        }

        /* Progress bar */
        .prog-bar { height: 2px; background: rgba(255,255,255,0.05); border-radius: 1px; margin-bottom: 8px; }

        /* ═══════ RESULT SCREEN ═══════ */
        .result-root {
          position: fixed; inset: 0; z-index: 300;
          background: #02010a;
          display: flex; flex-direction: column;
          overflow-y: auto; overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .result-root::-webkit-scrollbar { display: none; }

        /* Result header */
        .result-header {
          padding: 40px 20px 24px;
          text-align: center;
          background: linear-gradient(180deg, rgba(34,211,238,0.04) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
          flex-shrink: 0;
        }

        /* Stars */
        .stars { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }

        /* Stat grid */
        .stat-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; padding: 16px;
        }
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 14px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          text-align: center;
        }

        /* Review section */
        .review-section { padding: 0 16px 16px; }
        .review-item {
          border-radius: 12px;
          margin-bottom: 8px;
          overflow: hidden;
          border: 1px solid transparent;
        }
        .review-item.correct { border-color: rgba(34,197,94,0.2); background: rgba(34,197,94,0.04); }
        .review-item.wrong   { border-color: rgba(239,68,68,0.2);  background: rgba(239,68,68,0.04); }
        .review-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; cursor: pointer;
        }
        .review-body { padding: 0 12px 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
        .expl-box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 12px;
          margin-top: 8px;
        }

        /* Action btns */
        .action-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
          position: sticky; bottom: 0;
        }
        .action-btn {
          padding: 18px 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 12px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.1em;
          cursor: pointer; border: none;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: all 0.2s;
          color: white;
        }

        /* Animations */
        @keyframes dmg { 0%,100%{opacity:0} 30%{opacity:.7} }
        .dmg-anim { animation: dmg 0.5s ease; }
        @keyframes comboPop { 0%{transform:translateX(-50%) scale(.7);opacity:0} 60%{transform:translateX(-50%) scale(1.1)} 100%{transform:translateX(-50%) scale(1);opacity:1} }
        .combo-pop { animation: comboPop .35s cubic-bezier(.34,1.56,.64,1) forwards; }
        @keyframes fbIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .fb-in { animation: fbIn .2s ease; }
        @keyframes statReveal { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes urgentPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .urgent { animation: urgentPulse .5s infinite; }
        @keyframes hpBeat { 0%,100%{opacity:1} 50%{opacity:.4} }
        .hp-crit { animation: hpBeat .7s infinite; }
        @keyframes shieldGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        .shield-pulse { animation: shieldGlow .8s infinite; }

        /* Stars animation */
        @keyframes starPop { 0%{transform:scale(0)rotate(-30deg);opacity:0} 80%{transform:scale(1.2)rotate(5deg)} 100%{transform:scale(1)rotate(0);opacity:1} }
      `}</style>

      {/* ── AMBIENT ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-15%", width: 500, height: 500, background: meta.color, opacity: 0.04, filter: "blur(120px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: 500, height: 500, background: "#7c3aed", opacity: 0.04, filter: "blur(120px)", borderRadius: "50%" }} />
      </div>

      {/* ── DAMAGE FLASH ── */}
      <AnimatePresence>
        {isWrong && (
          <motion.div className="dmg-flash" initial={{ opacity: .6 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: .5 }} />
        )}
      </AnimatePresence>

      {/* ── SHIELD BORDER ── */}
      {shieldActive && <div className="shield-border shield-pulse" />}

      {/* ── COMBO BADGE (fixed, never overlaps) ── */}
      <AnimatePresence>
        {gameState === "playing" && combo >= 2 && (
          <motion.div
            key={combo}
            className="combo-badge combo-pop"
            style={{ background: `${comboInfo.color}22`, border: `1px solid ${comboInfo.color}44`, color: comboInfo.color }}
            exit={{ opacity: 0, scale: .8 }}
          >
            <Flame size={12} color={comboInfo.color} />
            {combo}x {comboInfo.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FEEDBACK (stacked right side) ── */}
      <div className="fb-container">
        <AnimatePresence>
          {feedbacks.map(f => (
            <motion.div
              key={f.id}
              className="fb-item fb-in"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: .3 } }}
              style={{
                background: f.type === "success" ? "rgba(34,211,238,0.12)" : f.type === "warning" ? "rgba(250,204,21,0.12)" : "rgba(239,68,68,0.12)",
                color: f.type === "success" ? "#22d3ee" : f.type === "warning" ? "#facc15" : "#f87171",
                border: `1px solid ${f.type === "success" ? "rgba(34,211,238,0.3)" : f.type === "warning" ? "rgba(250,204,21,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}
            >
              {f.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════
          PLAYING STATE
      ══════════════════════════════════ */}
      {gameState === "playing" && (
        <div className="arena-root" style={{ zIndex: 20 }}>

          {/* ── HUD ── */}
          <div className="hud" style={{ background: "rgba(2,1,10,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

            {/* Row 1 */}
            <div className="hud-row1">
              {/* Left: Back + Subject */}
              <div className="hud-left">
                <button className="back-btn" onClick={() => router.back()}>
                  <ArrowLeft size={13} /> Flee
                </button>
                <div className="sub-pill" style={{ background: `rgba(${meta.rgb},0.1)`, border: `1px solid rgba(${meta.rgb},0.25)`, color: meta.color }}>
                  {meta.label}
                </div>
              </div>

              {/* Center: Timer only */}
              <div className="timer-wrap">
                <div style={{ position: "relative", width: 52, height: 52 }}>
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                    <motion.circle
                      cx="50%" cy="50%" r="44%"
                      fill="none"
                      stroke={isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : meta.color}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 4px ${isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : meta.color})` }}
                      initial={{ strokeDasharray: "276", strokeDashoffset: "0" }}
                      animate={{ strokeDashoffset: 276 - (276 * timeLeft / 15) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span
                      className={`font-logo ${!isFrozen && timeLeft <= 5 ? "urgent" : ""}`}
                      style={{ fontSize: 16, fontWeight: 900, color: isFrozen ? "#3b82f6" : timeLeft <= 5 ? "#ef4444" : "white" }}
                    >
                      {isFrozen ? "❄" : timeLeft}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.35 }}>
                  {isFrozen ? "FROZEN" : "TIME"}
                </span>
              </div>

              {/* Right: HP + EXP */}
              <div className="hud-right">
                {/* HP */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Heart size={11} color={hpColor} className={hp <= 25 ? "hp-crit" : ""} />
                  <span style={{ fontSize: 10, fontWeight: 900, color: hpColor, letterSpacing: "0.05em" }} className={hp <= 25 ? "hp-crit" : ""}>
                    {hp}%
                  </span>
                </div>
                <div className="hp-bar-outer">
                  <motion.div
                    style={{ height: "100%", background: `linear-gradient(90deg, ${hpColor}, ${hpColor}cc)`, borderRadius: 3, boxShadow: `0 0 6px ${hpColor}88` }}
                    animate={{ width: `${hp}%` }}
                    transition={{ type: "spring", bounce: .2, duration: .7 }}
                  />
                </div>
                {/* EXP */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={11} color={meta.color} />
                  <span className="font-logo" style={{ fontSize: 13, fontWeight: 900, color: "white" }}>{exp}</span>
                  <span style={{ fontSize: 9, color: "#a855f7", fontWeight: 900 }}>{multiplier}x</span>
                </div>
              </div>
            </div>

            {/* Row 2: Power-ups */}
            <div className="hud-row2">
              <button className={`pw-btn freeze ${!hasFreeze ? "" : ""}`} onClick={useFreeze} disabled={!hasFreeze}>
                <Clock size={12} color={hasFreeze ? "#3b82f6" : "rgba(255,255,255,0.25)"} />
                <span style={{ color: hasFreeze ? undefined : "rgba(255,255,255,0.25)", textDecoration: hasFreeze ? undefined : "line-through" }}>Freeze</span>
              </button>
              <button className="pw-btn heal" onClick={useHeal} disabled={!hasHeal || hp >= 100}>
                <Heart size={12} color={hasHeal && hp < 100 ? "#22c55e" : "rgba(255,255,255,0.25)"} />
                <span style={{ color: hasHeal && hp < 100 ? undefined : "rgba(255,255,255,0.25)", textDecoration: hasHeal && hp < 100 ? undefined : "line-through" }}>Heal</span>
              </button>
              <button className={`pw-btn shield ${shieldActive ? "shield-on" : ""}`} onClick={useShield} disabled={!hasShield || shieldActive}>
                <Shield size={12} color={hasShield ? "#facc15" : "rgba(255,255,255,0.25)"} />
                <span style={{ color: hasShield ? undefined : "rgba(255,255,255,0.25)", textDecoration: hasShield ? undefined : "line-through" }}>
                  {shieldActive ? "Active!" : "Shield"}
                </span>
              </button>
            </div>
          </div>

          {/* ── SCROLLABLE QUESTION AREA ── */}
          <div className="q-scroll">
            <AnimatePresence mode="wait">
              {currentQ && (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: .25 }}
                >
                  {/* Progress bar */}
                  <div className="prog-bar" style={{ marginTop: 12 }}>
                    <motion.div
                      style={{ height: "100%", background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`, borderRadius: 1 }}
                      animate={{ width: `${((idx + 1) / total) * 100}%` }}
                      transition={{ duration: .4 }}
                    />
                  </div>

                  {/* Trial */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.45 }}>
                      <Target size={11} color="#a855f7" />
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        Trial {idx + 1} / {total}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 5, textTransform: "uppercase" }}>
                      {currentQ.exam || "SYS"}
                    </span>
                  </div>

                  {/* Question Card */}
                  <div className="q-card" style={{ "--sc": meta.color } as any}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, background: `rgba(${meta.rgb},0.1)`, border: `1px solid rgba(${meta.rgb},0.2)`, borderRadius: 100, padding: "4px 10px" }}>
                        <Swords size={11} color={meta.color} />
                        <span style={{ fontSize: 8, fontWeight: 900, color: meta.color, letterSpacing: "0.25em", textTransform: "uppercase" }}>Tactical Query</span>
                      </div>
                    </div>
                    <h2 className="font-bn" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.55, color: "white" }}>
                      {currentQ.questionText}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="opt-grid" style={{ "--sc": meta.color, "--sr": meta.rgb } as any}>
                    {currentQ.options.map((opt: string, i: number) => {
                      const labels = ["A", "B", "C", "D"];
                      const isSelected = selectedOpt === opt;
                      const isCorrect  = showAnswer && opt === currentQ.correctAnswer;
                      const isWrongSel = showAnswer && isSelected && !isCorrect;
                      return (
                        <button
                          key={i}
                          className={`opt-btn ${isCorrect ? "correct" : ""} ${isWrongSel ? "wrong" : ""}`}
                          style={{ "--sc": meta.color, "--sr": meta.rgb } as any}
                          onClick={() => handleAnswer(opt)}
                          disabled={!!selectedOpt}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: isCorrect ? "rgba(34,197,94,0.2)" : isWrongSel ? "rgba(239,68,68,0.2)" : `rgba(${meta.rgb},0.1)`, border: `1px solid ${isCorrect ? "#22c55e" : isWrongSel ? "#ef4444" : `rgba(${meta.rgb},0.3)`}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {isCorrect ? <CheckCircle size={14} color="#22c55e" /> : isWrongSel ? <XCircle size={14} color="#ef4444" /> : (
                              <span className="font-logo" style={{ fontSize: 10, color: meta.color }}>{labels[i]}</span>
                            )}
                          </div>
                          <span className="font-bn" style={{ fontSize: 14, fontWeight: 600, color: isCorrect ? "#22c55e" : isWrongSel ? "#f87171" : "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom spacer */}
                  <div style={{ height: 20 }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          RESULT SCREEN
      ══════════════════════════════════ */}
      <AnimatePresence>
        {(gameState === "won" || gameState === "lost") && (
          <motion.div
            className="result-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: .4 }}
          >
            {/* Ambient */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
              <div style={{ position: "absolute", top: "-20%", left: "-20%", width: 500, height: 500, background: gameState === "won" ? meta.color : "#ef4444", opacity: 0.05, filter: "blur(130px)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: "-20%", right: "-20%", width: 400, height: 400, background: "#7c3aed", opacity: 0.05, filter: "blur(120px)", borderRadius: "50%" }} />
            </div>

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100%" }}>

              {/* ── HEADER ── */}
              <div className="result-header">
                {/* Stars */}
                <div className="stars">
                  {[0,1,2].map(i => {
                    const lit = gameState === "won" ? (accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1) > i : 0 > i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2 + i * 0.15, type: "spring", bounce: 0.5 }}
                        style={{ fontSize: 32, filter: lit ? `drop-shadow(0 0 12px ${meta.color})` : "none", opacity: lit ? 1 : 0.2 }}
                      >
                        ★
                      </motion.div>
                    );
                  })}
                </div>

                <motion.h1
                  className="font-logo"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
                  style={{
                    fontSize: 32, fontStyle: "italic", textTransform: "uppercase",
                    background: gameState === "won"
                      ? `linear-gradient(135deg, ${meta.color}, #a855f7)`
                      : "linear-gradient(135deg, #ef4444, #f87171)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    marginBottom: 6, lineHeight: 1.1,
                  }}
                >
                  {gameState === "won" ? "DUNGEON\nCLEARED" : "SYSTEM\nFAILED"}
                </motion.h1>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.4 }}>
                  {gameState === "won" ? "Performance Evaluation" : "Fatal Error Detected"}
                </p>
              </div>

              {/* ── STAT GRID ── */}
              <div className="stat-grid">
                {[
                  { label: "Accuracy",    val: `${accuracy}%`,   icon: Crosshair, color: meta.color,  delay: .1 },
                  { label: "Max Combo",   val: `${maxCombo}x`,   icon: Flame,     color: "#f59e0b",   delay: .18 },
                  { label: "Remaining HP",val: `${hp}`,          icon: Heart,     color: hpColor,     delay: .26 },
                  { label: "Total EXP",   val: `+${animExp}`,    icon: Zap,       color: meta.color,  delay: .34, highlight: true },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: s.delay, type: "spring", bounce: .3 }}
                    style={s.highlight ? { background: `rgba(${meta.rgb},0.08)`, border: `1px solid rgba(${meta.rgb},0.2)` } : {}}
                  >
                    <s.icon size={18} color={s.color} style={{ opacity: .7 }} />
                    <span className="font-logo" style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 9, opacity: .4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* ── FIREBASE XP BADGE ── */}
              {xpAwarded !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
                  style={{
                    margin: "0 16px 16px",
                    padding: "14px 18px",
                    borderRadius: 16,
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Zap size={18} color="#f59e0b" />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)" }}>Firebase XP Saved</p>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Profile updated in real-time</p>
                    </div>
                  </div>
                  <span className="font-logo" style={{ fontSize: 22, fontWeight: 900, color: "#f59e0b" }}>+{xpAwarded}</span>
                </motion.div>
              )}

              {/* ── REVIEW SECTION ── */}
              <div className="review-section">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 2px" }}>
                  <BookOpen size={14} color={meta.color} />
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", opacity: .7 }}>
                    Answer Review
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 900, color: meta.color }}>
                    {correctCount}/{total}
                  </span>
                </div>

                {answerLog.map((log, i) => (
                  <div key={i} className={`review-item ${log.isCorrect ? "correct" : "wrong"}`}>
                    {/* Header row */}
                    <div className="review-header" onClick={() => setExpandedLog(expandedLog === i ? null : i)}>
                      {log.isCorrect
                        ? <CheckCircle size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                        : <XCircle    size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                      }
                      <span className="font-bn" style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.8)", opacity: .9 }}>
                        Q{i + 1}: {log.question.slice(0, 45)}{log.question.length > 45 ? "…" : ""}
                      </span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginLeft: 6, flexShrink: 0 }}>
                        {Math.round(log.timeMs / 1000)}s
                      </span>
                      {expandedLog === i
                        ? <ChevronUp   size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                        : <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                      }
                    </div>

                    {/* Expanded body */}
                    <AnimatePresence>
                      {expandedLog === i && (
                        <motion.div
                          className="review-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: .25 }}
                          style={{ overflow: "hidden" }}
                        >
                          {/* Full question */}
                          <p className="font-bn" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginBottom: 10 }}>
                            {log.question}
                          </p>

                          {/* Your answer vs correct */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 8 }}>
                              <CheckCircle size={13} color="#22c55e" />
                              <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>Correct: </span>
                              <span className="font-bn" style={{ fontSize: 12, color: "#86efac" }}>{log.correct}</span>
                            </div>
                            {!log.isCorrect && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8 }}>
                                <XCircle size={13} color="#ef4444" />
                                <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>Your answer: </span>
                                <span className="font-bn" style={{ fontSize: 12, color: "#fca5a5" }}>{log.selected}</span>
                              </div>
                            )}
                          </div>

                          {/* Explanation */}
                          {log.explanation ? (
                            <div className="expl-box">
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <BookOpen size={12} color={meta.color} />
                                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color, letterSpacing: "0.15em", textTransform: "uppercase" }}>ব্যাখ্যা</span>
                              </div>
                              <p className="font-bn" style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
                                {log.explanation}
                              </p>
                            </div>
                          ) : (
                            <div className="expl-box" style={{ opacity: .5 }}>
                              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>ব্যাখ্যা শীঘ্রই আসছে...</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* spacer */}
              <div style={{ flex: 1 }} />

              {/* ── ACTION BUTTONS ── */}
              <div className="action-row" style={{ background: "rgba(2,1,10,0.95)", backdropFilter: "blur(20px)" }}>
                <button
                  className="action-btn"
                  onClick={doRetry}
                  style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
                  onTouchStart={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                  onTouchEnd={e   => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                >
                  <Swords size={14} /> Retry
                </button>
                <button
                  className="action-btn"
                  onClick={() => router.push("/dashboard")}
                  style={{ background: `rgba(${meta.rgb},0.08)`, color: meta.color }}
                  onTouchStart={e => (e.currentTarget.style.background = `rgba(${meta.rgb},0.15)`)}
                  onTouchEnd={e   => (e.currentTarget.style.background = `rgba(${meta.rgb},0.08)`)}
                >
                  <Sparkles size={14} /> Sanctuary <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}