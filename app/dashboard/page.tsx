"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { auth } from "@/lib/firebase"; // নিশ্চিত করো তোমার ফায়ারবেস পাথ এটাই কি না
import { onAuthStateChanged } from "firebase/auth";
import { 
  Zap, Trophy, Swords, Bell, Settings, Target, 
  History, Shield, Star, Users, Brain, Activity,
  Play, ChevronRight, Crown, Flame, LayoutDashboard, Coins,
  Atom, FlaskConical, Sigma, Dna, Quote 
} from "lucide-react";

export default function RankPushSoloLevelingEdition() {
  const [selectedSub, setSelectedSub] = useState("Physics");
  const [user, setUser] = useState(null); // ইউজার স্টেট যোগ করা হয়েছে
  const router = useRouter(); 

  // লগইন করা ইউজারকে ট্র্যাক করার লজিক
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const subjectList = [
    { name: "Physics", icon: <Atom size={26}/> },
    { name: "Chemistry", icon: <FlaskConical size={26}/> },
    { name: "Math", icon: <Sigma size={26}/> }, 
    { name: "Biology", icon: <Dna size={26}/> }
  ];

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@800&display=swap');
        
        html, body { 
          max-width: 100vw;
          overflow-x: hidden;
          background-color: #02010a;
        }

        body { 
          background-image: 
            linear-gradient(to bottom, rgba(2, 1, 10, 0.8), rgba(2, 1, 10, 0.95)),
            url('https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: white; 
          font-family: 'Outfit', sans-serif;
          position: relative;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(34, 211, 238, 0.03) 50%, transparent);
          animation: scanline 10s linear infinite;
          pointer-events: none;
          z-index: 50;
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .font-logo { font-family: 'Orbitron', sans-serif; }
        
        .dashboard-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(14, 165, 233, 0.15); 
          border-radius: 24px;
          transition: all 0.3s ease;
        }

        .dashboard-card:hover {
          border-color: rgba(34, 211, 238, 0.4); 
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 8px 25px -5px rgba(14, 165, 233, 0.2); 
        }

        @keyframes cyber-pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        
        .btn-arena {
          background: linear-gradient(135deg, #0ea5e9, #0284c7); 
          animation: cyber-pulse-blue 2s infinite;
          position: relative;
          overflow: hidden;
          transition: 0.3s;
        }
        
        .neon-blue { color: #22d3ee; text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
        .italic-black { font-style: italic; font-weight: 900; letter-spacing: -0.02em; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .subject-btn {
          background-color: rgba(255, 255, 255, 0.04); 
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5); 
          transition: all 0.2s ease-in-out;
        }
        
        .subject-btn-active {
          background: linear-gradient(135deg, #0284c7, #0ea5e9) !important;
          border: 1px solid #22d3ee !important; 
          color: #ffffff !important; 
          box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5) !important;
          transform: scale(1.05);
        }
        
        .subject-btn-active .icon-container {
          color: #ffffff !important;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.6));
          animation: float 2s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .hero-title { font-size: 2.5rem !important; line-height: 1.1 !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] size-[600px] bg-[#0ea5e9] opacity-[0.08] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-[#7c3aed] opacity-[0.06] blur-[120px] rounded-full"></div>
      </div>

      <div className="min-h-screen p-4 lg:p-6 relative z-10">
        <header className="max-w-[1800px] mx-auto flex justify-between items-center mb-12 px-2">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2.5 bg-[#0ea5e9] rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.5)] group-hover:rotate-12 transition-transform border border-white/20">
                <Swords size={20} className="text-white"/>
              </div>
              <span className="font-logo text-2xl tracking-tighter text-white">RANKPUSH</span>
            </div>
            <nav className="hidden xl:flex gap-8 text-[11px] font-bold tracking-[0.2em] uppercase opacity-40">
              <a href="#" className="text-[#22d3ee] opacity-100 border-b-2 border-[#0ea5e9] pb-1">Dashboard</a>
              <a href="#" className="hover:opacity-100 transition-all text-white">Battle Arena</a>
              <a href="#" className="hover:opacity-100 transition-all text-white">Leaderboard</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[10px] font-black tracking-widest opacity-80 uppercase hidden sm:block text-white">3,892 ONLINE</span>
            </div>
            <div 
              onClick={() => router.push("/")}
              className="p-2.5 dashboard-card border-none rounded-xl cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-all group"
              title="Sign Out"
            >
              <Settings size={20} className="opacity-50 group-hover:opacity-100 group-hover:rotate-90 transition-all text-white" />
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          <div className="lg:col-span-3 space-y-6">
            <div className="dashboard-card p-10 text-center relative overflow-hidden group border-t-2 border-[#0ea5e9]">
               <div className="relative size-28 mx-auto mb-6 p-1 rounded-full border-2 border-[#0ea5e9] group-hover:scale-105 transition-transform">
                 <img 
                   src={user?.photoURL || "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"}
                   className="rounded-full w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all" 
                   alt="Profile" 
                 />
                 <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-white text-[10px] px-2.5 py-1 rounded font-black italic shadow-lg border border-white/30">LVL 47</div>
               </div>
               <h2 className="text-2xl font-logo tracking-widest mb-1 group-hover:text-[#22d3ee] transition-colors text-white">
                 {user?.displayName || "Cyber Hunter"}
               </h2>
               
               <div className="flex justify-center items-center gap-2 mt-2">
                 <Crown size={14} className="text-yellow-400 fill-yellow-400/20" />
                 <p className="text-[10px] font-black text-[#0ea5e9] tracking-[0.2em] uppercase">Monarch Rank</p>
               </div>

               <div className="mt-4 mb-8">
                 <span className="text-[12px] font-black text-white tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                   15,420 <span className="text-[#22d3ee]">EXP</span>
                 </span>
               </div>
               
               <div className="space-y-4 pt-4 border-t border-white/10 text-left">
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-60 text-white"><span>Next: Shadow Lord</span> <span className="text-[#22d3ee]">91.3%</span></div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee]" style={{ width: '91.3%' }}></div>
                  </div>
               </div>
            </div>

            <div className="dashboard-card p-6 space-y-5 border-t border-[#0ea5e9]/20">
               <h3 className="text-[10px] font-black tracking-widest opacity-50 uppercase flex items-center gap-2 italic text-white"><Target size={14}/> Neural Attributes</h3>
               {[
                 {l:'Accuracy', v:88, d:'88%', c:'bg-[#22d3ee]'}, 
                 {l:'Speed', v:94, d:'94%', c:'bg-[#0ea5e9]'}, 
                 {l:'IQ', v:75, d:'145', c:'bg-white/80'}, 
                 {l:'Logic', v:91, d:'91%', c:'bg-emerald-400'}
               ].map((s) => (
                 <div key={s.l} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold uppercase opacity-80 text-white"><span>{s.l}</span><span>{s.d}</span></div>
                   <div className="h-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${s.c}`} style={{ width: `${s.v}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>

            <div className="dashboard-card p-6 border-l-4 border-emerald-500 bg-emerald-500/5">
               <div className="flex items-center gap-2 mb-3 opacity-60 text-white">
                 <Quote size={16} className="text-emerald-500" />
                 <h3 className="text-[10px] font-black tracking-widest uppercase italic">Daily Directive</h3>
               </div>
               <p className="text-sm italic font-semibold leading-relaxed mb-3 text-white/90">
                 "Seek knowledge from the cradle to the grave."
               </p>
               <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest italic">— PROPHET MUHAMMAD (PBUH)</p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <div className="dashboard-card p-6 md:p-10 flex items-center justify-between bg-gradient-to-br from-[#0ea5e9]/10 to-transparent relative overflow-hidden">
               <div className="relative z-10 w-full text-center md:text-left">
                 <h1 className="text-4xl sm:text-5xl md:text-7xl italic-black leading-[0.95] mb-2 uppercase hero-title text-white">DOMINATE <br /><span className="neon-blue">THE META</span></h1>
                 <p className="text-[10px] opacity-50 font-bold tracking-[0.3em] uppercase mt-2 text-white">System Status: Monarch Awakening</p>
               </div>
               <div className="opacity-5 absolute right-[-20px] rotate-12 hidden md:block text-white"><LayoutDashboard size={220} /></div>
            </div>

            <div className="dashboard-card p-6 md:p-8 border-t-4 border-[#0ea5e9]">
               <div className="flex justify-between items-center mb-10">
                  <div>
                      <h3 className="text-xl md:text-2xl italic-black tracking-tight uppercase text-white">Tactical <span className="text-[#0ea5e9]">Arena</span></h3>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-white">Select your mastery field</p>
                  </div>
                  <div className="size-10 md:size-12 bg-[#0ea5e9]/10 rounded-2xl flex items-center justify-center animate-bounce shadow-inner border border-[#0ea5e9]/20"><Swords className="neon-blue w-5 md:w-6 h-5 md:h-6" /></div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
                  {subjectList.map(sub => (
                    <button 
                      key={sub.name} 
                      type="button"
                      onClick={() => setSelectedSub(sub.name)}
                      className={`flex flex-col items-center gap-3 py-6 md:py-8 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none select-none subject-btn transition-all duration-300 ${
                        selectedSub === sub.name ? 'subject-btn-active' : 'opacity-40 hover:opacity-100 hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className={`icon-container transition-all duration-300 ${selectedSub === sub.name ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] text-white' : 'text-white'}`}>
                        {sub.icon}
                      </div>
                      <span className="z-10 text-white">{sub.name}</span>
                    </button>
                  ))}
               </div>

               <button className="w-full btn-arena py-5 md:py-6 rounded-2xl border border-white/20 active:scale-95 group focus:outline-none shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                 <span className="relative z-10 flex items-center justify-center gap-2 md:gap-4 text-white text-xl md:text-3xl italic-black tracking-widest md:tracking-[0.25em] uppercase whitespace-nowrap transition-all md:group-hover:tracking-[0.3em]">
                    Enter Arena <Play className="w-5 h-5 md:w-7 md:h-7 fill-white group-hover:translate-x-1 md:group-hover:translate-x-3 transition-transform text-white"/>
                 </span>
               </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="dashboard-card p-6 md:p-7 min-h-[300px] border-l-4 border-[#0ea5e9]/50">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-[11px] font-black tracking-widest opacity-60 uppercase flex items-center gap-2 italic text-white"><Trophy size={14} className="text-yellow-500"/> Global Elite</h3>
                 <span className="text-[9px] font-bold text-[#0ea5e9] border border-[#0ea5e9]/30 px-2 py-0.5 rounded-full">S-RANK</span>
               </div>
               <div className="space-y-4">
                  {[
                    {name: 'S-Rank_Slayer', rank: '01', score: '24,500', color: 'text-[#22d3ee]'}, 
                    {name: 'ZeroOne', rank: '02', score: '22,100', color: 'opacity-50 text-white'}, 
                    {name: 'GhostVibes', rank: '03', score: '19,850', color: 'opacity-50 text-white'}
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/5 group">
                      <span className={`text-base italic-black ${p.color}`}>{p.rank}</span>
                      <img src={`https://i.pravatar.cc/150?u=${p.name}`} className="size-10 rounded-full border-2 border-white/10" alt="avatar" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold italic uppercase text-white/90 truncate group-hover:text-[#22d3ee] transition-colors">{p.name}</p>
                        <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full ${p.rank === '01' ? 'bg-[#22d3ee]' : 'bg-[#0ea5e9]'}`} style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-[#22d3ee] tracking-wider">{p.score}</p>
                        <p className="text-[8px] opacity-50 font-bold uppercase text-white">EXP</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="dashboard-card p-6 border-l-4 border-orange-500 bg-orange-500/5 group">
               <div className="flex items-center gap-2 mb-5 opacity-80 text-white">
                 <Flame size={16} className="text-orange-500" />
                 <h3 className="text-[10px] font-black tracking-widest uppercase italic">Daily Quests</h3>
               </div>
               <div className="space-y-3">
                 <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer">
                   <Target size={16} className="text-[#22d3ee] shrink-0 mt-0.5" />
                   <div>
                     <p className="text-[11px] font-bold text-white uppercase leading-tight">Physics Mastery</p>
                     <p className="text-[9px] opacity-60 mt-1 uppercase text-white">Solve 20 MCQ <span className="text-[#22d3ee] font-black group-hover:underline">(+500 EXP)</span></p>
                   </div>
                 </div>
               </div>
            </div>

            <div className="dashboard-card p-6 bg-gradient-to-t from-[#0ea5e9]/20 to-transparent border-b-4 border-[#0ea5e9]">
               <div className="flex items-center gap-2 mb-3 opacity-60 text-white">
                 <Crown size={16} className="text-[#0ea5e9]" />
                 <h3 className="text-[10px] font-black tracking-widest uppercase italic">Monarch's Wisdom</h3>
               </div>
               <Quote className="text-[#0ea5e9] mb-2 opacity-40" size={24} />
               <p className="text-sm italic font-semibold leading-relaxed text-white/90 border-l-2 border-[#22d3ee] pl-3 italic">
                 "I will grow stronger. Much, much stronger."
               </p>
               <p className="text-[10px] font-black mt-4 text-[#22d3ee] tracking-[0.2em] uppercase">— SUNG JIN-WOO</p>
            </div>
          </div>
        </main>

        <footer className="mt-20 text-center py-12 opacity-20 border-t border-white/5">
            <p className="font-logo text-[10px] md:text-[11px] tracking-[1.5em] uppercase text-[#22d3ee]">RankPush Pro // Level Up // 2026</p>
        </footer>
      </div>
    </>
  );
}