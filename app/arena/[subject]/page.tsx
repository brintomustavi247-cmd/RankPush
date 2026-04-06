"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { physicsQuestions } from "@/lib/questions"; 
import { Heart, Trophy, Zap, ArrowLeft, ShieldAlert, Swords, Target, ChevronRight, Sparkles } from "lucide-react";

export default function ArenaPage() {
  const params = useParams();
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(100);
  const [exp, setExp] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");

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
      setHp((prev) => {
        const newHp = prev - 25;
        if (newHp <= 0) setGameState("lost");
        return newHp;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#02010a] text-white relative overflow-hidden font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@600;900&display=swap');
        
        .font-logo { font-family: 'Orbitron', sans-serif; }
        body { font-family: 'Outfit', sans-serif; background-color: #02010a; }

        /* --- SOLO LEVELING DUNGEON AURA --- */
        .dungeon-bg {
          background: radial-gradient(circle at 50% 50%, #0a051a 0%, #02010a 100%);
          position: fixed; inset: 0; z-index: 0;
        }

        .aura-purple {
          position: absolute; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
          filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 1;
          animation: pulse 8s infinite alternate;
        }
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0.8; } }

        /* --- SYSTEM QUESTION CARD --- */
        .system-card {
          background: rgba(10, 8, 25, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-left: 5px solid #8b5cf6;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        /* --- NEON CHARGE OPTIONS --- */
        .option-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(139, 92, 246, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .option-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: #a78bfa;
          transform: translateX(10px);
          box-shadow: -5px 0 20px rgba(139, 92, 246, 0.3);
        }

        /* --- MONARCH SYSTEM POPUP (Quest Cleared) --- */
        .monarch-msg {
          background: rgba(6, 4, 15, 0.98);
          border: 2px solid #8b5cf6;
          box-shadow: 0 0 80px rgba(139, 92, 246, 0.5);
          clip-path: polygon(0 15px, 15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px));
        }

        /* --- PREMIUM RETURN BUTTON --- */
        .btn-monarch {
          background: #8b5cf6;
          color: white;
          font-weight: 900;
          letter-spacing: 0.3em;
          transition: all 0.4s;
          position: relative;
          overflow: hidden;
        }
        .btn-monarch:hover {
          background: white;
          color: black;
          box-shadow: 0 0 40px white;
          transform: scale(1.02);
        }
        .btn-monarch::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shine 3s infinite;
        }
        @keyframes shine { 0% { left: -100%; } 100% { left: 100%; } }
      `}</style>

      {/* --- BG & AURA --- */}
      <div className="dungeon-bg"></div>
      <div className="aura-purple top-[-10%] right-[-10%]"></div>
      <div className="aura-purple bottom-[-10%] left-[-10%] !bg-blue-500/10"></div>

      <div className="relative z-10 min-h-screen flex flex-col p-6 md:p-12">
        
        {/* --- HUD HEADER --- */}
        <header className="max-w-6xl mx-auto w-full flex justify-between items-center mb-16">
          <button onClick={() => router.back()} className="flex items-center gap-3 group">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:border-purple-500 transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-30 group-hover:opacity-100">Exit Dungeon</span>
          </button>

          <div className="flex gap-8 items-center">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Vitality</p>
              <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 shadow-[0_0_10px_red]" style={{ width: `${hp}%` }}></div>
              </div>
            </div>
            <div className="bg-purple-500/10 px-6 py-2.5 border-l-4 border-purple-500">
              <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">System EXP</p>
              <p className="font-logo text-xl leading-none">{exp}</p>
            </div>
          </div>
        </header>

        {/* --- ARENA --- */}
        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full pb-20">
          {gameState === "playing" ? (
            <div className="w-full space-y-12 animate-in fade-in zoom-in duration-700">
              
              {/* Question Card */}
              <div className="system-card p-10 md:p-20 rounded-xl">
                <div className="flex items-center gap-3 mb-8">
                  <Swords size={20} className="text-purple-400" />
                  <span className="text-[11px] font-black text-purple-400 tracking-[0.5em] uppercase">Trial: {currentQuestion.topic}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white/95">
                  {currentQuestion.questionText}
                </h2>
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between opacity-30 text-[9px] font-mono tracking-widest uppercase">
                  <span>Source: {currentQuestion.exam}</span>
                  <span>System: Floor 0{currentIdx + 1}</span>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className="option-btn p-7 rounded-xl text-left flex items-center gap-6 group"
                  >
                    <span className="font-logo text-xs text-purple-500/30 group-hover:text-purple-400 transition-colors">0{i+1}</span>
                    <span className="text-xl font-bold text-white/70 group-hover:text-white transition-colors">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* --- SOLO LEVELING SYSTEM MESSAGE POPUP --- */
            <div className={`monarch-msg p-16 md:p-24 max-w-2xl w-full text-center space-y-10 animate-in zoom-in duration-500 ${gameState === 'lost' ? '!border-rose-500 !shadow-rose-500/30' : ''}`}>
              
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
                <div className="h-[1px] w-12 bg-purple-500"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">System Message</span>
                <div className="h-[1px] w-12 bg-purple-500"></div>
              </div>

              {gameState === "won" ? (
                <div className="space-y-8">
                  <Trophy size={80} className="mx-auto text-purple-400 drop-shadow-[0_0_20px_#8b5cf6]" />
                  <div>
                    <h1 className="font-logo text-5xl md:text-7xl tracking-tighter text-white mb-3">QUEST COMPLETED</h1>
                    <p className="text-[11px] font-black text-purple-400 tracking-[0.4em] uppercase">All rewards have been distributed</p>
                  </div>
                  <div className="bg-purple-500/10 p-8 border border-purple-500/20 inline-block mx-auto min-w-[300px]">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold font-logo">Obtained Rewards</p>
                    <p className="text-5xl font-logo text-white tracking-widest">+{exp} <span className="text-sm opacity-50">EXP</span></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <ShieldAlert size={80} className="mx-auto text-rose-500 drop-shadow-[0_0_20px_red] animate-pulse" />
                  <div>
                    <h1 className="font-logo text-5xl md:text-7xl tracking-tighter text-rose-600 mb-3">QUEST FAILED</h1>
                    <p className="text-[11px] font-black text-rose-500/40 tracking-[0.4em] uppercase">Neural link has been severed</p>
                  </div>
                  <p className="text-lg text-white/40 italic leading-relaxed max-w-sm mx-auto">
                    "This floor is too dangerous for your current stats. Return and sharpen your neural connection."
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => router.push("/dashboard")}
                className={`btn-monarch w-full py-6 rounded-none uppercase text-xs shadow-2xl flex items-center justify-center gap-4 group ${gameState === 'lost' ? '!bg-rose-600 !text-white' : ''}`}
              >
                <Sparkles size={16} className="group-hover:animate-spin" />
                Accept and Return
                <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          )}
        </main>

        <footer className="mt-auto text-center py-8 opacity-20 border-t border-white/5">
          <p className="font-logo text-[9px] tracking-[1.5em] uppercase text-purple-500">System Interface v6.0.1 // Dungeon Protocol</p>
        </footer>
      </div>
    </div>
  );
}