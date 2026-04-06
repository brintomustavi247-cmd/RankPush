"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import { auth, googleProvider } from "./firebase"; // পাথ ঠিক করা আছে
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  sendPasswordResetEmail // 🔥 ফর্গেট পাসওয়ার্ডের জন্য নতুন ইম্পোর্ট
} from "firebase/auth";
import { 
  Swords, Target, Fingerprint, User, Key, Mail, Globe, AlertTriangle
} from "lucide-react";

export default function RankPushLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState("HSC");
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 
  
  const router = useRouter(); 

  const quests = [
    { id: "HSC", label: "HSC Level" },
    { id: "Engineering", label: "Engineering" },
    { id: "Medical", label: "Medical" },
    { id: "Varsity", label: "Varsity" }
  ];

  // 🔥 পাসওয়ার্ড রিসেট করার ফাংশন
  const handleForgotPassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!email) {
      setErrorMsg("SYSTEM ALERT: ENTER CONTACT SIGNAL (EMAIL) FIRST!");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("RECOVERY SIGNAL SENT! CHECK YOUR EMAIL INBOX/SPAM.");
    } catch (error: any) {
      const errorCode = error.code ? error.code.split('/')[1].replace(/-/g, ' ').toUpperCase() : "RECOVERY FAILED";
      setErrorMsg(`SYSTEM ERROR: ${errorCode}`);
    }
  };

  const handleNavigation = async () => {
    setErrorMsg(""); 
    setSuccessMsg("");

    if (isSignUp) {
      if (!username || !email || !password) {
        setErrorMsg("SYSTEM ALERT: MISSING HUNTER CREDENTIALS!");
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        await signOut(auth); 
        
        setIsSignUp(false); 
        setPassword(""); 
        setSuccessMsg("HUNTER AWAKENED! PLEASE INITIATE LOGIN."); 
        
      } catch (error: any) {
        const errorCode = error.code ? error.code.split('/')[1].replace(/-/g, ' ').toUpperCase() : "REGISTRATION FAILED";
        setErrorMsg(`SYSTEM ERROR: ${errorCode}`);
      }
    } else {
      if (!email || !password) {
        setErrorMsg("SYSTEM ALERT: INVALID ACCESS KEY!");
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard"); 
      } catch (error: any) {
        const errorCode = error.code ? error.code.split('/')[1].replace(/-/g, ' ').toUpperCase() : "LOGIN FAILED";
        setErrorMsg(`SYSTEM ERROR: ${errorCode}`);
      }
    }
  };

  const handleSocialLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg("SYSTEM ALERT: GOOGLE AUTH INTERRUPTED!");
    }
  };

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@800&display=swap');
        
        html, body { 
          max-width: 100vw;
          overflow-x: hidden;
        }

        body { 
          background-color: #02010a;
          color: white; 
          font-family: 'Outfit', sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        
        .font-logo { font-family: 'Orbitron', sans-serif; }

        .tactical-grid {
          background-image: 
            linear-gradient(rgba(14, 165, 233, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.07) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center center;
        }
        
        .auth-card {
          background: rgba(10, 15, 30, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 165, 233, 0.2); 
          border-top: 2px solid #0ea5e9; 
          border-radius: 30px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .cyber-input {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
        }
        .cyber-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
          outline: none;
        }

        .quest-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        .quest-btn-active {
          background: linear-gradient(135deg, #0284c7, #0ea5e9) !important;
          border-color: #22d3ee !important;
          color: white !important;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.5) !important;
          transform: scale(1.05);
        }

        @keyframes cyber-pulse {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        
        .btn-auth {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          animation: cyber-pulse 2s infinite;
          position: relative;
          overflow: hidden;
        }

        .btn-auth:active {
          transform: scale(0.95);
        }

        .neon-blue { color: #22d3ee; text-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
        .italic-black { font-style: italic; font-weight: 900; letter-spacing: -0.02em; }

        @keyframes slow-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        .orb-1 { animation: slow-pulse 8s ease-in-out infinite; }
        .orb-2 { animation: slow-pulse 12s ease-in-out infinite 2s; }
      `}</style>

      <div className="fixed inset-0 z-[-2] bg-[#02010a] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 tactical-grid"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#0ea5e9] blur-[150px] rounded-full orb-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#7c3aed] blur-[180px] rounded-full orb-2"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#02010a_100%)] opacity-80"></div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        
        <div className="flex items-center gap-3 mb-8 animate-pulse">
          <div className="p-3 bg-[#0ea5e9]/10 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] border border-[#0ea5e9]/40 backdrop-blur-md">
            <Swords size={24} className="text-[#22d3ee]"/>
          </div>
          <span className="font-logo text-3xl tracking-tighter text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">RANKPUSH</span>
        </div>

        <div className="auth-card w-full max-w-md p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0ea5e9]/20 to-transparent opacity-50 pointer-events-none"></div>
          <div className="absolute top-4 right-4 w-2 h-2 bg-[#22d3ee] shadow-[0_0_10px_#22d3ee] rounded-full animate-pulse"></div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl italic-black uppercase tracking-tight mb-2 drop-shadow-md">
              {isSignUp ? <span className="neon-blue">Awaken</span> : <span className="neon-blue">System</span>} <br/>
              {isSignUp ? "Your Hunter" : "Initialization"}
            </h1>
            <p className="text-[10px] font-bold opacity-50 tracking-[0.2em] uppercase text-white">
              {isSignUp ? "Register your profile" : "Enter your credentials to continue"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 animate-pulse">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <p className="text-[10px] font-black tracking-widest uppercase text-red-500 shadow-red-500">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3 animate-pulse">
              <User size={18} className="text-green-400 shrink-0" />
              <p className="text-[10px] font-black tracking-widest uppercase text-green-400 shadow-green-500">{successMsg}</p>
            </div>
          )}

          <button type="button" onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white/5 border border-white/10 active:bg-[#0ea5e9]/20 transition-all mb-6 cursor-pointer relative z-20">
            <Globe size={20} className="text-[#22d3ee]" />
            <span className="text-xs font-bold tracking-widest uppercase text-white">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 mb-6 opacity-40">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/50"></div>
            <span className="text-[9px] font-black tracking-widest uppercase text-white/80">Or Manual Override</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/50"></div>
          </div>

          <div className="space-y-4">
            
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50 text-white">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="HUNTER ALIAS (Username)" 
                  className="cyber-input w-full py-4 pl-12 pr-4 rounded-xl text-sm font-medium tracking-wide placeholder:text-xs placeholder:font-bold placeholder:tracking-widest placeholder:uppercase placeholder:text-white/30"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50 text-white">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="CONTACT SIGNAL (Email)" 
                className="cyber-input w-full py-4 pl-12 pr-4 rounded-xl text-sm font-medium tracking-wide placeholder:text-xs placeholder:font-bold placeholder:tracking-widest placeholder:uppercase placeholder:text-white/30"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50 text-white">
                <Key size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SECRET KEY (Password)" 
                className="cyber-input w-full py-4 pl-12 pr-4 rounded-xl text-sm font-medium tracking-wide placeholder:text-xs placeholder:font-bold placeholder:tracking-widest placeholder:uppercase placeholder:text-white/30"
              />
            </div>

            {/* 🔥 Forgot Password Button (শুধু লগিন পেজে দেখাবে) */}
            {!isSignUp && (
              <div className="flex justify-end pr-2 -mt-2 relative z-20">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-[#0ea5e9] hover:text-[#22d3ee] transition-colors uppercase tracking-widest cursor-pointer"
                >
                  Lost Secret Key?
                </button>
              </div>
            )}

            {isSignUp && (
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-black tracking-widest opacity-70 uppercase mb-3 flex items-center gap-2 text-white">
                  <Target size={14} className="text-[#0ea5e9]"/> Select Main Quest
                </p>
                <div className="grid grid-cols-2 gap-3 relative z-20">
                  {quests.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuest(q.id)}
                      className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest quest-btn cursor-pointer ${
                        selectedQuest === q.id ? 'quest-btn-active' : 'text-white/50 hover:text-white/90 border-white/10'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="button" 
              onClick={handleNavigation}
              className="w-full btn-auth mt-6 py-5 rounded-xl border border-white/20 active:scale-95 cursor-pointer relative z-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-white text-lg italic-black tracking-[0.2em] uppercase transition-all">
                {isSignUp ? "Accept Quest" : "Enter Dungeon"} 
                <Fingerprint size={20} className="text-[#22d3ee] drop-shadow-[0_0_5px_#22d3ee]"/>
              </span>
            </button>
          </div>

          <div className="mt-8 text-center relative z-50">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest text-white">
              {isSignUp ? "Already a Hunter?" : "Not awakened yet?"}
            </p>
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(""); 
                setSuccessMsg(""); 
              }}
              className="mt-2 text-xs font-black uppercase tracking-widest text-[#22d3ee] active:text-white transition-all border-b border-[#0ea5e9]/50 pb-1 cursor-pointer p-2 -m-2"
            >
              {isSignUp ? "Initialize Login System" : "Register New Profile"}
            </button>
          </div>

        </div>

        <footer className="mt-12 text-center opacity-40">
            <p className="text-[9px] font-logo tracking-[0.5em] uppercase text-[#22d3ee]">RankPush Pro // SECURE CONNECTION</p>
        </footer>

      </div>
    </>
  );
}