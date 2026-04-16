"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Camera, Lock, User, Mail, Phone,
  Shield, Zap, Trophy, Save, Edit3, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ============================================================
// CONSTANTS
// ============================================================
const CRANK_XP_REQUIREMENT = 5000;

const DEFAULT_USER = {
  uid: "",
  displayName: "Hunter",
  email: "",
  phone: "",
  bio: "Leveling up in the shadows.",
  photoURL: "https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg",
  xp: 0,
};

export default function ProfilePage() {
  const router = useRouter();
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [user, setUser] = useState(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName,
    phone: user.phone,
    bio: user.bio,
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Firebase auth listener ──
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/");
        return;
      }
      setAuthUid(firebaseUser.uid);
    });
    return () => unsubAuth();
  }, [router]);

  // ── Firestore real-time listener ──
  useEffect(() => {
    if (!authUid) return;
    const userRef = doc(db, "users", authUid);
    const unsubDoc = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUser({
          uid: authUid,
          displayName: data.displayName ?? DEFAULT_USER.displayName,
          email: data.email ?? "",
          phone: data.phone ?? "",
          bio: data.bio ?? DEFAULT_USER.bio,
          photoURL: data.photoURL ?? DEFAULT_USER.photoURL,
          xp: data.xp ?? 0,
        });
      }
      setIsLoading(false);
    });
    return () => unsubDoc();
  }, [authUid]);

  // ── Sync form data when user data changes, but only when not editing ──
  useEffect(() => {
    if (!isEditing) {
      setFormData({ displayName: user.displayName, phone: user.phone, bio: user.bio });
    }
  }, [user, isEditing]);

  // Rank Logic
  const isCRankUnlocked = user.xp >= CRANK_XP_REQUIREMENT;
  const progressToCRank = Math.min((user.xp / CRANK_XP_REQUIREMENT) * 100, 100);

  const handleSave = async () => {
    if (!authUid) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", authUid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        bio: formData.bio,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = () => {
    if (isCRankUnlocked && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#02010a] flex items-center justify-center">
        <p style={{ fontFamily: "'Orbitron',sans-serif", color: "#22d3ee", fontSize: 14, letterSpacing: "0.3em" }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div className="profile-page min-h-screen bg-[#02010a] text-white font-sans overflow-x-hidden pb-12 relative">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&display=swap" rel="stylesheet" />

      <style>{`
        .font-logo { font-family: 'Orbitron', sans-serif; }
        .profile-page { font-family: 'Outfit', sans-serif; background-color: #02010a; }
        .profile-page::before { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px); pointer-events: none; z-index: 1; }
        
        .input-field {
          width: 100%; padding: 14px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: white; outline: none; transition: all 0.3s;
        }
        .input-field:focus {
          background: rgba(34,211,238,0.05); border-color: rgba(34,211,238,0.4);
          box-shadow: 0 0 15px rgba(34,211,238,0.1);
        }
        .input-field:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* AMBIENT BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto px-4 md:px-8 pt-8 md:pt-12">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} className="text-white/70" />
            </button>
            <div>
              <h1 className="font-logo text-xl md:text-2xl font-black tracking-widest uppercase">
                HUNTER <span className="text-cyan-400">PROFILE</span>
              </h1>
            </div>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-5 py-2.5 rounded-xl font-black text-[10px] md:text-xs tracking-widest uppercase flex items-center gap-2 transition-all ${isEditing ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'}`}
          >
            {isEditing ? (isSaving ? <span className="animate-pulse">SAVING...</span> : <><Save size={14} /> SAVE RECORD</>) : <><Edit3 size={14} /> EDIT PROFILE</>}
          </button>
        </div>

        {/* MAIN PROFILE CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            
            {/* AVATAR SECTION WITH LOCK LOGIC */}
            <div className="flex flex-col items-center">
              <div 
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 transition-all duration-500 ${isCRankUnlocked ? 'cursor-pointer hover:scale-105' : ''}`}
                style={{ 
                  border: `2px solid ${isCRankUnlocked ? '#22d3ee' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isCRankUnlocked ? '0 0 30px rgba(34,211,238,0.2)' : 'none'
                }}
                onClick={handleImageClick}
              >
                <img 
                  src={user.photoURL} 
                  className={`w-full h-full rounded-full object-cover transition-all duration-500 ${!isCRankUnlocked ? 'grayscale blur-[3px] opacity-40' : ''}`}
                  alt="Avatar" 
                />
                
                {/* Lock Overlay */}
                {!isCRankUnlocked && (
                  <div className="absolute inset-0 m-1.5 bg-black/60 rounded-full flex flex-col items-center justify-center border border-white/5">
                    <Lock size={24} className="text-red-400 mb-2 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                    <span className="font-logo text-[9px] font-black text-white tracking-widest text-center px-2">
                      LOCKED
                    </span>
                  </div>
                )}

                {/* Edit Camera Overlay (When Unlocked & Editing) */}
                {isCRankUnlocked && isEditing && (
                  <div className="absolute inset-0 m-1.5 bg-black/50 rounded-full flex items-center justify-center border border-cyan-400/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Camera size={28} className="text-cyan-400" />
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
              </div>

              {/* Status Badge */}
              {!isCRankUnlocked ? (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center max-w-[180px]">
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                    <ShieldAlert size={10} /> C-Rank Required
                  </p>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${progressToCRank}%` }} />
                  </div>
                  <p className="text-[8px] text-white/40 mt-1.5 uppercase tracking-widest">{user.xp} / {CRANK_XP_REQUIREMENT} XP</p>
                </div>
              ) : (
                <div className="mt-4 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                  <Shield size={12} className="text-cyan-400" />
                  <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase">Customization Unlocked</span>
                </div>
              )}
            </div>

            {/* FORM SECTION */}
            <div className="flex-1 w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} /> Hunter Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    disabled={!isEditing}
                    className="input-field font-logo text-sm tracking-wide"
                  />
                </div>

                {/* Email (Always disabled/Read-only usually) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Mail size={12} /> Sync Email
                  </label>
                  <input 
                    type="email" 
                    value={user.email}
                    disabled
                    className="input-field text-sm opacity-50"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Phone size={12} /> Comms Link
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="input-field text-sm"
                    placeholder="+880..."
                  />
                </div>

                {/* Total XP (Read Only Stat) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={12} /> Total Experience
                  </label>
                  <div className="input-field text-sm font-logo text-amber-500 font-bold flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.1)' }}>
                    <span>{user.xp.toLocaleString()} XP</span>
                    <Trophy size={14} />
                  </div>
                </div>

              </div>

              {/* Bio/Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield size={12} /> Hunter Bio / Status
                </label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={3}
                  className="input-field text-sm resize-none custom-scrollbar"
                  placeholder="E.g., Leveling up in the shadows..."
                />
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
