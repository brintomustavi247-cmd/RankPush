"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions"; 
import { Trophy, ArrowLeft, ShieldAlert, Swords, ChevronRight, Sparkles, Target, Zap, Clock, Heart, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArenaPage() {
  const params = useParams();
  const router = useRouter();
  
  // --- Core Game States ---
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(100);
  const [exp, setExp] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [timeLeft, setTimeLeft] = useState(15);
  
  // --- Advanced Combat States ---
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isWrong, setIsWrong] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'danger'; id: number }[]>([]);
  
  // --- Items / Skills ---
  const [hasTimeFreeze, setHasTimeFreeze] = useState(true);
  const [hasHeal, setHasHeal] = useState(true);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);

  const currentQuestion = physicsQuestions ? physicsQuestions[currentIdx] : null;
  const totalQuestions = physicsQuestions ? physicsQuestions.length : 0;
  let feedbackIdCounter = useRef(0);

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState !== "playing" || !currentQuestion || isTimeFrozen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeOut();
          return 15; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, gameState, currentQuestion, isTimeFrozen]);

  // --- Combo & Multiplier Logic ---
  useEffect(() => {
    if (combo >= 5) setMultiplier(3);
    else if (combo >= 3) setMultiplier(2);
    else if (combo >= 1) setMultiplier(1.5);
    else setMultiplier(1);

    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo]);

  // --- Feedback Notification Logic ---
  const showFeedback = (text: string, type: 'success' | 'danger') => {
    const id = feedbackIdCounter.current++;
    setFeedback(prev => [...prev, { text, type, id }]);
    setTimeout(() => {
      setFeedback(prev => prev.filter(f => f.id !== id));
    }, 1500); // Remove after 1.5s
  };

  // --- Handlers ---
  const handleTimeOut = () => {
    setCombo(0);
    showFeedback("TIME OUT! -25 HP", "danger");
    triggerDamage();
    moveToNextQuestion();
  };

  const triggerDamage = () => {
    setIsWrong(true);
    setTimeout(() => setIsWrong(false), 500); 
    setHp((prev) => {
      const newHp = prev - 25;
      if (newHp <= 0) setGameState("lost");
      return newHp;
    });
  };

  const moveToNextQuestion = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(15);
      setIsTimeFrozen(false);
    } else {
      setGameState("won");
    }
  };

  const handleAnswer = (selectedOption: string) => {
    if (gameState !== "playing") return;
    
    if (selectedOption === currentQuestion?.correctAnswer) {
      // Success Logic
      const earnedExp = 100 * multiplier;
      setExp((prev) => prev + earnedExp);
      setCombo((prev) => prev + 1);
      setCorrectAnswersCount((prev) => prev + 1);
      showFeedback(`+${earnedExp} EXP!`, "success");
      if (combo > 1) showFeedback(`${combo}x COMBO!`, "success");
      
      moveToNextQuestion();
    } else {
      // Failure Logic
      setCombo(0);
      showFeedback("MISS! -25 HP", "danger");
      triggerDamage();
    }
  };

  // --- Skill Handlers ---
  const useTimeFreeze = () => {
    if (hasTimeFreeze && gameState === "playing") {
      setHasTimeFreeze(false);
      setIsTimeFrozen(true);
      showFeedback("TIME FROZEN (5s)", "success");
      setTimeout(() => setIsTimeFrozen(false), 5000);
    }
  };

  const useHeal = () => {
    if (hasHeal && hp < 100 && gameState === "playing") {
      setHasHeal(false);
      setHp(prev => Math.min(prev + 30, 100));
      showFeedback("+30 HP RESTORED", "success");
    }
  };

  // Safe Check
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#030108] flex items-center justify-center font-logo text-cyan-400 text-2xl animate-pulse tracking-[0.5em]">
        INITIALIZING SYSTEM...
      </div>
    );
  }

  // Calculate Accuracy
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#030108] text-white relative overflow-hidden font-sans selection:bg-cyan-500/30">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@600;800;900&display=swap');
        
        .font-logo { font-family: 'Orbitron', sans-serif; }
        body { font-family: 'Outfit', sans-serif; background-color: #030108; overflow: hidden; }

        /* --- IMMERSIVE NEBULA BG WITH SCANLINES --- */
        .nebula-bg {
          background: 
            radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 85% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
            url('https://www.transparenttextures.com/patterns/stardust.png'),
            #030108;
          position: fixed; inset: 0; z-index: 0;
        }

        .scanlines {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.25) 51%);
          background-size: 100% 4px;
          opacity: 0.3;
        }

        .nebula-cloud {
          position: absolute; width: 100%; height: 100%;
          background-image: url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop');
          opacity: 0.15; mix-blend-mode: screen; pointer-events: none;
          filter: saturate(2.5) blur(4px);
          animation: floatCloud 40s linear infinite alternate;
        }

        @keyframes floatCloud {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-20px, 20px); }
        }

        /* --- ARENA SYSTEM CARD --- */
        .system-card {
          background: linear-gradient(145deg, rgba(10, 8, 25, 0.7) 0%, rgba(5, 3, 15, 0.9) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34, 211, 238, 0.15);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
        }
        
        .system-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
          background: linear-gradient(to bottom, #22d3ee, #a855f7);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.8);
        }

        /* --- OPTIONS BUTTON ANIMATION --- */
        .option-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(139, 92, 246, 0.15);
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .option-btn::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transform: skewX(-20deg); transition: 0.5s;
        }
        .option-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: #22d3ee;
          box-shadow: 0 10px 25px -5px rgba(34, 211, 238, 0.2);
          transform: translateY(-3px);
        }
        .option-btn:hover::after { left: 200%; }

        /* --- SKILL BUTTONS --- */
        .skill-btn {
          background: rgba(10, 8, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          transition: 0.3s;
        }
        .skill-btn:not(:disabled):hover {
          background: rgba(34, 211, 238, 0.15);
          border-color: #22d3ee;
          transform: translateY(-2px);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
        }
        .skill-btn:disabled {
          opacity: 0.3; cursor: not-allowed; filter: grayscale(100%);
        }

        /* --- EXTREME MAGICAL MODAL --- */
        .magical-modal {
          background: radial-gradient(circle at 50% 0%, rgba(30, 20, 50, 0.9) 0%, rgba(5, 3, 15, 0.95) 80%);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.9),
            0 0 80px rgba(139, 92, 246, 0.2),
            inset 0 0 40px rgba(34, 211, 238, 0.05);
        }

        .timer-urgent { color: #f43f5e; text-shadow: 0 0 15px #f43f5e; animation: pulseBeat 1s infinite; }
        .timer-frozen { color: #3b82f6; text-shadow: 0 0 15px #3b82f6; }
        @keyframes pulseBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      `}</style>

      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="nebula-bg"><div className="nebula-cloud"></div></div>
      <div className="scanlines"></div>

      {/* --- DYNAMIC FEEDBACK OVERLAY --- */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <AnimatePresence>
          {feedback.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 1.5 }}
              transition={{ type: "spring", damping: 15 }}
              className={`absolute font-logo text-4xl md:text-6xl font-black italic tracking-widest uppercase text-transparent bg-clip-text ${
                f.type === 'success' 
                  ? 'bg-gradient-to-t from-cyan-400 to-white drop-shadow-[0_0_20px_cyan]' 
                  : 'bg-gradient-to-t from-rose-600 to-rose-300 drop-shadow-[0_0_20px_red]'
              }`}
            >
              {f.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 h-screen flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto">
        
        {/* --- 🌟 HUD HEADER 🌟 --- */}
        <header className="max-w-[1400px] mx-auto w-full grid grid-cols-3 items-start mb-4 md:mb-10">
          
          {/* Left: Progress & Combo */}
          <div className="space-y-4">
            <button onClick={() => router.back()} className="flex items-center gap-3 group w-fit">
              <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl group-hover:border-cyan-400 group-hover:bg-cyan-400/10 transition-all">
                <ArrowLeft size={18} className="text-white/60 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 group-hover:text-cyan-400 group-hover:opacity-100 transition-all">Flee</span>
            </button>
            
            <div className="hidden md:flex flex-col gap-2">
              <div className="flex items-center gap-3 opacity-60">
                <Target size={14} className="text-purple-400" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">Trial {currentIdx + 1} / {totalQuestions}</span>
              </div>
              
              {/* Combo Display */}
              <AnimatePresence>
                {combo > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0 }}
                    className="flex items-center gap-2 text-orange-400 drop-shadow-[0_0_8px_orange]"
                  >
                    <Flame size={18} className="animate-pulse" />
                    <span className="font-logo font-black text-xl italic">{combo}x COMBO!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Dynamic Timer */}
          <div className="flex flex-col items-center justify-start mt-2">
            <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" className="fill-none stroke-white/5 stroke-[3]" />
                <motion.circle 
                  cx="50%" cy="50%" r="45%" 
                  className={`fill-none stroke-[3] stroke-linecap-round ${isTimeFrozen ? 'stroke-blue-500' : timeLeft <= 5 ? 'stroke-rose-500' : 'stroke-cyan-400'}`}
                  initial={{ strokeDasharray: "283", strokeDashoffset: "0" }}
                  animate={{ strokeDashoffset: 283 - (283 * timeLeft) / 15 }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <span className={`font-logo text-xl md:text-3xl font-black ${isTimeFrozen ? 'timer-frozen' : timeLeft <= 5 ? 'timer-urgent' : 'text-white'}`}>
                {isTimeFrozen ? '❄️' : timeLeft}
              </span>
            </div>
            <span className="text-[8px] font-black tracking-[0.3em] uppercase opacity-40 mt-2">
              {isTimeFrozen ? 'FROZEN' : 'Time Left'}
            </span>
          </div>

          {/* Right: HP & EXP Stats */}
          <div className="flex flex-col items-end gap-5">
            <div className="flex items-center gap-4 bg-purple-900/20 px-5 py-3 rounded-2xl border border-purple-500/20 backdrop-blur-md">
              <div className="text-right">
                <p className="text-[9px] font-black text-rose-500 uppercase mb-1.5 tracking-widest drop-shadow-[0_0_5px_red]">Vitality: {hp}%</p>
                <motion.div 
                  className="w-24 md:w-32 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5"
                  animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-rose-700 to-rose-400 shadow-[0_0_10px_red]" 
                    initial={{ width: "100%" }}
                    animate={{ width: `${hp}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                  />
                </motion.div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[8px] font-black text-cyan-400 uppercase leading-none mb-1 tracking-[0.2em]">Experience</p>
                <p className="font-logo text-2xl leading-none text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  {exp} <span className="text-[10px] text-purple-400">({multiplier}x)</span>
                </p>
              </div>
              <div className="size-10 rounded-full border border-cyan-400/30 flex items-center justify-center bg-cyan-400/10">
                <Zap size={16} className="text-cyan-400" />
              </div>
            </div>
          </div>
        </header>

        {/* --- 🌟 SKILL BAR (New) 🌟 --- */}
        {gameState === "playing" && (
          <div className="max-w-[1000px] mx-auto w-full flex justify-center gap-4 mb-6 z-10 relative">
             <button onClick={useTimeFreeze} disabled={!hasTimeFreeze} className="skill-btn px-4 py-2 rounded-xl flex items-center gap-2 group">
               <Clock size={16} className={hasTimeFreeze ? 'text-blue-400' : 'text-gray-500'} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white">Freeze (1x)</span>
             </button>
             <button onClick={useHeal} disabled={!hasHeal || hp === 100} className="skill-btn px-4 py-2 rounded-xl flex items-center gap-2 group">
               <Heart size={16} className={hasHeal && hp < 100 ? 'text-green-400' : 'text-gray-500'} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white">Heal (1x)</span>
             </button>
          </div>
        )}

        {/* --- 🌟 ARENA MAIN 🌟 --- */}
        <main className="flex-1 flex flex-col items-center justify-center max-w-[1000px] mx-auto w-full pb-10">
          <AnimatePresence mode="wait">
            {gameState === "playing" ? (
              <motion.div 
                key={currentIdx}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)", scale: 0.95 }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                className="w-full space-y-6"
              >
                {/* Question Card */}
                <div className="system-card p-8 md:p-14 rounded-3xl">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-cyan-400/10 rounded-full border border-cyan-400/20 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]">
                      <Swords size={16} className="text-cyan-400 animate-pulse" />
                      <span className="text-[10px] font-black text-cyan-400 tracking-[0.3em] uppercase">Tactical Query</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1 rounded">
                      ID: {currentQuestion.exam || "SYS-TEST"}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight text-white drop-shadow-lg">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {currentQuestion.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 70 }}
                      onClick={() => handleAnswer(opt)}
                      className="option-btn p-5 md:p-7 rounded-2xl text-left flex items-center gap-6 group"
                    >
                      <div className="size-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-cyan-400/20 group-hover:border-cyan-400/50 transition-colors shadow-[inset_0_0_10px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                        <span className="font-logo text-[12px] text-purple-400 group-hover:text-cyan-300">0{i+1}</span>
                      </div>
                      <span className="text-base md:text-xl font-bold text-white/80 group-hover:text-white transition-colors">{opt}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* --- 🌟 ADVANCED SYSTEM POST-MATCH POPUP 🌟 --- */
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className={`magical-modal w-full max-w-[95%] md:max-w-4xl text-center flex flex-col relative z-50 rounded-3xl ${gameState === 'lost' ? '!border-rose-500 shadow-[0_0_80px_rgba(225,29,72,0.4)]' : ''}`}
              >
                <div className="p-8 md:p-16 flex flex-col items-center gap-8 relative z-10">
                  
                  {/* Title Section */}
                  <div className="space-y-2">
                    <h1 className={`font-logo text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(139,92,246,0.8)] ${gameState === 'won' ? 'bg-gradient-to-br from-cyan-300 via-purple-300 to-purple-600' : 'bg-gradient-to-b from-white via-rose-300 to-rose-600'}`}>
                      {gameState === "won" ? "DUNGEON CLEARED" : "SYSTEM FAILED"}
                    </h1>
                    <p className={`text-[12px] font-black tracking-[0.6em] uppercase ${gameState === 'won' ? 'text-cyan-400/80' : 'text-rose-500/80'}`}>
                      {gameState === "won" ? "Performance Evaluation" : "Fatal Error Detected"}
                    </p>
                  </div>

                  {/* Detailed Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-6">
                     <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
                        <Target size={20} className="text-cyan-400 mb-2 opacity-50" />
                        <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Accuracy</span>
                        <span className="font-logo text-2xl md:text-3xl font-black text-white">{accuracy}%</span>
                     </div>
                     <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
                        <Flame size={20} className="text-orange-400 mb-2 opacity-50" />
                        <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Max Combo</span>
                        <span className="font-logo text-2xl md:text-3xl font-black text-white">{maxCombo}x</span>
                     </div>
                     <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center">
                        <Heart size={20} className={hp > 50 ? 'text-green-400 mb-2 opacity-50' : 'text-rose-500 mb-2 opacity-50 animate-pulse'} />
                        <span className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Remaining HP</span>
                        <span className="font-logo text-2xl md:text-3xl font-black text-white">{hp}</span>
                     </div>
                     <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-xl flex flex-col items-center justify-center shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]">
                        <Zap size={20} className="text-cyan-400 mb-2" />
                        <span className="text-[10px] uppercase tracking-widest text-cyan-400/80 mb-1">Total EXP</span>
                        <span className="font-logo text-2xl md:text-3xl font-black text-cyan-300 drop-shadow-[0_0_10px_cyan]">+{exp}</span>
                     </div>
                  </div>
                </div>
                
                {/* Massive Premium Button */}
                <button 
                  onClick={() => router.push("/dashboard")}
                  className={`relative w-full py-6 md:py-8 group overflow-hidden bg-purple-900/40 border-t-2 border-purple-500/50 hover:bg-purple-800/60 transition-all duration-500 ${gameState === 'lost' ? '!bg-rose-950/60 !border-rose-500/50 hover:!bg-rose-900/80' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ${gameState === 'lost' ? 'from-rose-500/20 to-orange-500/20' : ''}`}></div>
                  
                  <div className="relative z-10 flex items-center justify-center gap-5">
                    <Sparkles size={20} className="text-cyan-300 group-hover:animate-pulse" />
                    <span className="font-bold text-[12px] md:text-[14px] uppercase tracking-[0.4em] text-cyan-50 group-hover:text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                      Return to Sanctuary
                    </span>
                    <ChevronRight size={20} className="text-cyan-300 group-hover:translate-x-3 transition-transform duration-300" />
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto text-center py-4 opacity-20 relative z-10">
          <p className="font-logo text-[8px] tracking-[1.5em] uppercase text-cyan-500">System Engine v9.0 // Monarch Level</p>
        </footer>
      </div>
    </div>
  );
}