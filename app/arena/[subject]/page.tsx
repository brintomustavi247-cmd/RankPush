"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions"; 
import { Trophy, ArrowLeft, ShieldAlert, Swords, ChevronRight, Sparkles } from "lucide-react";
// Framer Motion ইমপোর্ট
import { motion, AnimatePresence } from "framer-motion";

export default function ArenaPage() {
  const params = useParams();
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(100);
  const [exp, setExp] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  
  // ভুল উত্তরের জন্য শেক ইফেক্ট কন্ট্রোল করার স্টেট
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
      // ভুল হলে অ্যানিমেশন ট্রিগার হবে
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500); // আধা সেকেন্ড পর শেক ইফেক্ট বন্ধ হবে
      
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

        .monarch-msg {
          background: rgba(6, 4, 15, 0.95);
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 50px rgba(139, 92, 246, 0.3);
          clip-path: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px));
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

        .btn-monarch {
          background: #8b5cf6;
          font-weight: 900;
          letter-spacing: 0.2em;
          transition: 0.4s;
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
              {/* HP বারে কাঁপুনির (Shake) ইফেক্ট */}
              <motion.div 
                className="w-24 md:w-40 h-1 bg-white/5 rounded-full overflow-hidden"
                animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="h-full bg-rose-600" 
                  initial={{ width: "100%" }}
                  animate={{ width: `${hp}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </motion.div>
            </div>
            <div className="bg-purple-500/10 px-4 py-2 border-l-2 border-purple-500">
              <p className="text-[8px] font-black text-purple-400 uppercase leading-none mb-1">EXP</p>
              <p className="font-logo text-lg leading-none">{exp}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full pb-10">
          <AnimatePresence mode="wait">
            {gameState === "playing" ? (
              // প্রশ্ন আসার সময় স্লাইড অ্যানিমেশন
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
                  <h2 className="text-2xl md:text-5xl font-bold leading-tight text-white/90">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {currentQuestion.options.map((opt, i) => (
                    // অপশনগুলো এক এক করে (Stagger) আসার অ্যানিমেশন
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
              // কোয়েস্ট কমপ্লিট বা ফেইল হওয়ার পপআপ অ্যানিমেশন
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`monarch-msg p-8 md:p-20 w-full max-w-[95%] md:max-w-2xl text-center space-y-6 md:space-y-10 ${gameState === 'lost' ? '!border-rose-500' : ''}`}
              >
                <div className="flex flex-col items-center gap-6">
                  {gameState === "won" ? (
                    <>
                      <Trophy size={50} className="md:size-16 text-purple-400 drop-shadow-[0_0_15px_#8b5cf6]" />
                      <div>
                        <h1 className="font-logo text-3xl md:text-6xl tracking-tighter text-white mb-2 uppercase">QUEST CLEARED</h1>
                        <p className="text-[10px] font-black text-purple-400 tracking-[0.3em] uppercase">Rewards Transferred</p>
                      </div>
                      <div className="bg-purple-500/10 p-5 md:p-8 border border-purple-500/20 w-full max-w-[280px]">
                        <p className="text-4xl md:text-5xl font-logo text-white">+{exp} <span className="text-xs opacity-50 uppercase">EXP</span></p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={50} className="md:size-16 text-rose-500 animate-pulse" />
                      <div>
                        <h1 className="font-logo text-3xl md:text-6xl tracking-tighter text-rose-600 mb-2 uppercase">QUEST FAILED</h1>
                        <p className="text-[10px] font-black text-rose-500/50 tracking-[0.3em] uppercase">Vitality Depleted</p>
                      </div>
                      <p className="text-sm md:text-lg text-white/40 italic px-4">
                        "Level up your stats before challenging this floor again."
                      </p>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => router.push("/dashboard")}
                  className={`btn-monarch w-full py-5 rounded-none uppercase text-[11px] flex items-center justify-center gap-3 group ${gameState === 'lost' ? '!bg-rose-600' : ''}`}
                >
                  <Sparkles size={14} className="group-hover:rotate-90 transition-transform" />
                  Return to Sanctuary
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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