"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  Swords, Target, Fingerprint, User, Key, Mail, Globe, AlertTriangle
} from "lucide-react";

// Loading skeleton component
function AuthSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <div className="skeleton w-12 h-12 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-48 mx-auto rounded-lg" />
        <div className="skeleton h-4 w-32 mx-auto rounded" />
        <div className="space-y-4 mt-8">
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
          <div className="skeleton h-14 rounded-xl" />
        </div>
        <div className="skeleton h-12 rounded-xl mt-6" />
      </div>
    </div>
  );
}

export default function RankPushLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState("HSC");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch - only show full UI after client mount
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const quests = [
    { id: "HSC", label: "HSC Level" },
    { id: "Engineering", label: "Engineering" },
    { id: "Medical", label: "Medical" },
    { id: "Varsity", label: "Varsity" }
  ];

  const handleForgotPassword = useCallback(async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!email) {
      setErrorMsg("SYSTEM ALERT: ENTER CONTACT SIGNAL (EMAIL) FIRST!");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("RECOVERY SIGNAL SENT! CHECK YOUR EMAIL INBOX/SPAM.");
    } catch (error: any) {
      const errorCode = error.code ? error.code.split('/')[1].replace(/-/g, ' ').toUpperCase() : "RECOVERY FAILED";
      setErrorMsg(`SYSTEM ERROR: ${errorCode}`);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const handleNavigation = useCallback(async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    if (isSignUp) {
      if (!username || !email || !password) {
        setErrorMsg("SYSTEM ALERT: MISSING HUNTER CREDENTIALS!");
        setIsLoading(false);
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
        setIsLoading(false);
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
    setIsLoading(false);
  }, [isSignUp, username, email, password, router]);

  const handleSocialLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg("SYSTEM ALERT: GOOGLE AUTH INTERRUPTED!");
      setIsLoading(false);
    }
  }, [router]);

  const toggleMode = useCallback(() => {
    setIsSignUp(prev => !prev);
    setErrorMsg("");
    setSuccessMsg("");
  }, []);

  // Show skeleton during SSR/hydration to prevent layout shift
  if (!isClient) {
    return <AuthSkeleton />;
  }

  return (
    <>
      {/* Background - Optimized: no blur on mobile, CSS-only animations */}
      <div className="fixed inset-0 z-[-2] bg-[#02010a] overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(14, 165, 233, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 165, 233, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            backgroundPosition: 'center center',
          }}
        />
        {/* Orbs - simplified, no blur on mobile */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full opacity-[0.08]"
          style={{ background: '#0ea5e9', filter: 'blur(80px)' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] rounded-full opacity-[0.07]"
          style={{ background: '#7c3aed', filter: 'blur(90px)' }}
        />
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(circle at center, transparent 0%, #02010a 100%)', 
            opacity: 0.75 
          }}
        />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#0ea5e9]/10 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] border border-[#0ea5e9]/40">
            <Swords size={24} className="text-[#22d3ee]" />
          </div>
          <span 
            className="text-3xl tracking-tighter text-white"
            style={{ fontFamily: 'var(--font-orbitron), Orbitron, sans-serif' }}
          >
            RANKPUSH
          </span>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md p-8 md:p-10 relative overflow-hidden"
          style={{
            background: 'rgba(8, 12, 25, 0.95)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderTop: '2px solid #0ea5e9',
            borderRadius: '30px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Desktop glassmorphism */}
          <style>{`
            @media (min-width: 768px) {
              .auth-card-desktop {
                background: rgba(10, 15, 30, 0.5) !important;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
              }
            }
          `}</style>
          <div className="auth-card-desktop absolute inset-0 rounded-[30px] pointer-events-none" />

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0ea5e9]/20 to-transparent opacity-50 pointer-events-none" />
          <div className="absolute top-4 right-4 w-2 h-2 bg-[#22d3ee] shadow-[0_0_10px_#22d3ee] rounded-full" />

          {/* Header */}
          <div className="text-center mb-6">
            <h1 
              className="text-3xl italic font-black uppercase tracking-tight mb-2"
              style={{ fontFamily: 'var(--font-orbitron), Orbitron, sans-serif' }}
            >
              {isSignUp ? (
                <><span className="neon-blue">Awaken</span><br/>Your Hunter</>
              ) : (
                <><span className="neon-blue">System</span><br/>Initialization</>
              )}
            </h1>
            <p className="text-[10px] font-bold opacity-50 tracking-[0.2em] uppercase">
              {isSignUp ? "Register your profile" : "Enter your credentials to continue"}
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <p className="text-[10px] font-black tracking-widest uppercase text-red-500">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3">
              <User size={18} className="text-green-400 shrink-0" />
              <p className="text-[10px] font-black tracking-widest uppercase text-green-400">{successMsg}</p>
            </div>
          )}

          {/* Google Login */}
          <button
            type="button"
            onClick={handleSocialLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#0ea5e9]/20 transition-all mb-6 cursor-pointer relative z-20 disabled:opacity-50"
          >
            <Globe size={20} className="text-[#22d3ee]" />
            <span className="text-xs font-bold tracking-widest uppercase">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6 opacity-40">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/50" />
            <span className="text-[9px] font-black tracking-widest uppercase">Or Manual Override</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/50" />
          </div>

          {/* Form */}
          <div className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50">
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
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50">
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
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50">
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

            {/* Forgot Password */}
            {!isSignUp && (
              <div className="flex justify-end pr-2 -mt-2 relative z-20">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-[10px] font-bold text-[#0ea5e9] hover:text-[#22d3ee] transition-colors uppercase tracking-widest cursor-pointer disabled:opacity-50"
                >
                  Lost Secret Key?
                </button>
              </div>
            )}

            {/* Quest Selection */}
            {isSignUp && (
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-black tracking-widest opacity-70 uppercase mb-3 flex items-center gap-2">
                  <Target size={14} className="text-[#0ea5e9]"/> Select Main Quest
                </p>
                <div className="grid grid-cols-2 gap-3 relative z-20">
                  {quests.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuest(q.id)}
                      disabled={isLoading}
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

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleNavigation}
              disabled={isLoading}
              className="w-full btn-auth mt-6 py-5 rounded-xl border border-white/20 active:scale-95 cursor-pointer relative z-50 disabled:opacity-70"
            >
              <span 
                className="relative z-10 flex items-center justify-center gap-3 text-white text-lg font-black tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-orbitron), Orbitron, sans-serif' }}
              >
                {isLoading ? (
                  <span className="animate-pulse">PROCESSING...</span>
                ) : (
                  <>
                    {isSignUp ? "Accept Quest" : "Enter Dungeon"}
                    <Fingerprint size={20} className="text-[#22d3ee]" />
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="mt-8 text-center relative z-50">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
              {isSignUp ? "Already a Hunter?" : "Not awakened yet?"}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="mt-2 text-xs font-black uppercase tracking-widest text-[#22d3ee] hover:text-white transition-all border-b border-[#0ea5e9]/50 pb-1 cursor-pointer p-2 -m-2"
            >
              {isSignUp ? "Initialize Login System" : "Register New Profile"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center opacity-40">
          <p 
            className="text-[9px] tracking-[0.5em] uppercase text-[#22d3ee]"
            style={{ fontFamily: 'var(--font-orbitron), Orbitron, sans-serif' }}
          >
            RankPush Pro // SECURE CONNECTION
          </p>
        </footer>
      </div>
    </>
  );
}