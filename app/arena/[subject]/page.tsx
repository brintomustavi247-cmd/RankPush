"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions"; 
import { Trophy, ArrowLeft, ShieldAlert, Swords, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ArenaPage() {
  const params = useParams();
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(100);
  const [exp, setExp] = useState(0);
  // টেস্টিং এর জন্য ডিফল্ট state "playing" রাখবেন, তবে "won" বা "lost" দিয়েও চেক করতে পারেন।
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  
  const [isWrong, setIsWrong] = useState(false);
  const currentQuestion = physicsQuestions[currentIdx];

  const handleAnswer = (selectedOption: string) => {
    if (gameState !== "playing") return;
    if (selectedOption === currentQuestion.correctAnswer) {
      setExp((prev) => prev + 100);
      if (currentIdx < physicsQuestions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        setGameState("won");
      }
    } else {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500); 
      
      setHp((prev) => {
        const newHp = prev - 25;
        if (newHp <= 0) setGameState("lost");
        return newHp;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#02010a] text-white relative overflow-x-hidden font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@600;900&display=swap');
        
        .font-logo { font-family: 'Orbitron', sans-serif; }
        body { font-family: 'Outfit', sans-serif; background-color: #02010a; }

        .nebula-bg {
          background: 
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            url('https://www.transparenttextures.com/patterns/stardust.png'),
            #02010a;
          position: fixed; inset: 0; z-index: 0;
        }

        .nebula-cloud {
          position: absolute; width: 100%; height: 100%;
          background-image: url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop');
          opacity: 0.07; mix-blend-mode: screen; pointer-events: none;
          filter: saturate(1.5) blur(2px);
        }

        .system-card {
          background: rgba(10, 8, 25, 0.7);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-left: 4px solid #8b5cf6;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
        }

        /* --- PREMIUM MONARCH MESSAGE CARD --- */
        .monarch-msg {
          background: linear-gradient(180deg, rgba(15, 10, 30, 0.8) 0%, rgba(6, 4, 15, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 
            0 0 40px rgba(139, 92, 246, 0.2),
            inset 0 0 20px rgba(139, 92, 246, 0.1);
          clip-path: polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px));
          position: relative;
        }

        /* Tech Corners for the Premium Vibe */
        .monarch-msg::before, .monarch-msg::after {
          content: ''; position: absolute; width: 30px; height: 30px;
          border: 2px solid transparent; pointer-events: none;
        }
        .monarch-msg::before {
          top: 0; left: 0;
          border-top-color: #a855f7; border-left-color: #a855f7;
        }
        .monarch-msg::after {
          bottom: 0; right: 0;
          border-bottom-color: #a855f7; border-right-color: #a855f7;
        }

        .option-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.1);
          transition: 0.3s;
        }
        .option-btn:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: #a78bfa;
          transform: scale(1.02);
        }

        /* --- PREMIUM BUTTON --- */
        .btn-monarch {
          background: linear-gradient(90deg, #7c3aed, #9333ea);
          font-weight: 900;
          letter-spacing: 0.2em;
          transition: all 0.4s ease;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        .btn-monarch:hover {
          box-shadow: 0 0 30px rgba(147, 51, 234, 0.6);
          text-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
      `}</style>

      <div className="nebula-bg">
        <div className="nebula-cloud"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-12">
        
        <header className="max-w-6xl mx-auto w-full flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="flex items-center gap-2 group">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:border-purple-500 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[9px] font-black tracking-[0.3em] uppercase opacity-40">Exit</span>
          </button>

          <div className="flex gap-4 items-center">
            <div className="text-right hidden xs:block">
              <p className="text-[9px] font-black text-rose-500 uppercase mb-1">HP</p>
              <motion.div 
                className="w-24 md:w-40 h-1 bg-white/5 rounded-full overflow-hidden"
                animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="h-full bg-rose-600 shadow-[0_0_10px_red]" 
                  initial={{ width: "100%" }}
                  animate={{ width: `${hp}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </motion.div>
            </div>
            <div className="bg-purple-900/40 px-4 py-2 border border-purple-500/30 backdrop-blur-md rounded-lg shadow-[inset_0_0_10px_rgba(168,85,247,0.2)]">
              <p className="text-[8px] font-black text-purple-400 uppercase leading-none mb-1">EXP</p>
              <p className="font-logo text-lg leading-none text-purple-100">{exp}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full pb-10">
          <AnimatePresence mode="wait">
            {gameState === "playing" ? (
              <motion.div 
                key={currentIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="w-full space-y-8"
              >
                <div className="system-card p-6 md:p-16 rounded-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Swords size={16} className="text-purple-400" />
                    <span className="text-[10px] font-black text-purple-400 tracking-[0.4em] uppercase">Floor 0{currentIdx + 1}</span>
                  </div>
                  <h2 className="text-2xl md:text-5xl font-bold leading-tight text-white/95">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {currentQuestion.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleAnswer(opt)}
                      className="option-btn p-5 md:p-7 rounded-xl text-left flex items-center gap-4 group"
                    >
                      <span className="font-logo text-[10px] text-purple-500/40 group-hover:text-purple-400">0{i+1}</span>
                      <span className="text-lg font-bold text-white/70 group-hover:text-white">{opt}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* --- UPGRADED SYSTEM MESSAGE POPUP --- */
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
                className={`monarch-msg w-full max-w-[95%] md:max-w-2xl text-center overflow-hidden flex flex-col ${gameState === 'lost' ? '!border-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.3)]' : ''}`}
              >
                
                {/* Subtle Scanline Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>

                <div className="p-10 md:p-20 flex flex-col items-center gap-8 relative z-10">
                  {gameState === "won" ? (
                    <>
                      <motion.div 
                        animate={{ y: [0, -10, 0] }} 
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Trophy size={60} className="md:size-24 text-purple-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]" />
                      </motion.div>
                      
                      <div className="space-y-2">
                        {/* Gradient Text for Premium Look */}
                        <h1 className="font-logo text-4xl md:text-6xl tracking-tighter uppercase bg-gradient-to-b from-white via-purple-100 to-purple-500 text-transparent bg-clip-text drop-shadow-lg">
                          QUEST CLEARED
                        </h1>
                        <p className="text-[10px] font-black text-purple-400/80 tracking-[0.4em] uppercase flex items-center justify-center gap-2">
                          <span className="w-4 h-[1px] bg-purple-500/50"></span>
                          Rewards Transferred
                          <span className="w-4 h-[1px] bg-purple-500/50"></span>
                        </p>
                      </div>

                      {/* Holographic EXP Box */}
                      <div className="relative mt-4 w-full max-w-[320px] group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-30 blur-md group-hover:opacity-50 transition duration-500 rounded-lg"></div>
                        <div className="relative bg-purple-950/40 border border-purple-500/30 p-6 md:p-8 rounded-lg backdrop-blur-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.15)] flex flex-col items-center justify-center">
                          <p className="text-5xl md:text-6xl font-logo font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                            +{exp} <span className="text-sm font-sans opacity-50 uppercase tracking-widest">EXP</span>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={60} className="md:size-24 text-rose-500 drop-shadow-[0_0_40px_rgba(225,29,72,0.8)] animate-pulse" />
                      <div className="space-y-2">
                        <h1 className="font-logo text-4xl md:text-6xl tracking-tighter uppercase bg-gradient-to-b from-white via-rose-100 to-rose-500 text-transparent bg-clip-text drop-shadow-lg">
                          QUEST FAILED
                        </h1>
                        <p className="text-[10px] font-black text-rose-500/80 tracking-[0.4em] uppercase">Vitality Depleted</p>
                      </div>
                      <p className="text-sm md:text-base text-white/50 italic px-4 mt-4">
                        "Your stats are too low for this floor. Return to the sanctuary."
                      </p>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => router.push("/dashboard")}
                  className={`btn-monarch w-full py-6 text-[12px] flex items-center justify-center gap-3 group relative z-10 ${gameState === 'lost' ? '!bg-gradient-to-r !from-rose-600 !to-rose-800' : ''}`}
                >
                  <Sparkles size={16} className="text-white/80 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="relative">
                    Return to Sanctuary
                    <span className="absolute left-0 bottom-0 w-full h-[1px] bg-white/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </span>
                  <ChevronRight size={18} className="text-white/80 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto text-center py-6 opacity-20">
          <p className="font-logo text-[8px] tracking-[1em] uppercase text-purple-500">System Link: Active</p>
        </footer>
      </div>
    </div>
  );
}