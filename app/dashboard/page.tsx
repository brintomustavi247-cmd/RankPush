"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, collection,
  query, orderBy, limit, getDocs
} from "firebase/firestore";
import {
  Zap, Trophy, Swords, Bell, Target, Brain, Play, Crown,
  Flame, LayoutDashboard, Atom, FlaskConical, Sigma, Dna,
  Quote, Sword, LogOut, X, CheckCircle, Lock, TrendingUp,
  Award, ChevronUp, BarChart2, Clock, Crosshair, Layers,
  Wifi, Timer, ChevronDown, User, Settings, BookOpen,
  ArrowRight, Menu, Sparkles, Star, Zap as ZapIcon,
  Calendar, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════
// RANK SYSTEM
// ═══════════════════════════════════════════
type Plan = "free" | "pro";
type RankId = "e"|"d"|"c"|"b"|"a"|"s"|"national"|"shadow_monarch";

interface RankInfo {
  id: RankId; name: string; title: string;
  color: string; glowColor: string; bgColor: string;
  icon: string; minXP: number; maxXP: number;
}

const RANKS: RankInfo[] = [
  { id:"e",              name:"E-Rank",         title:"Weakest Hunter",    color:"#6b7280", glowColor:"rgba(107,114,128,0.4)", bgColor:"rgba(107,114,128,0.08)", icon:"🪨", minXP:0,      maxXP:1999      },
  { id:"d",              name:"D-Rank",         title:"Awakened Hunter",   color:"#b45309", glowColor:"rgba(180,83,9,0.4)",    bgColor:"rgba(180,83,9,0.08)",    icon:"🔰", minXP:2000,   maxXP:5999      },
  { id:"c",              name:"C-Rank",         title:"Gate Raider",       color:"#0ea5e9", glowColor:"rgba(14,165,233,0.4)",  bgColor:"rgba(14,165,233,0.08)",  icon:"🌀", minXP:6000,   maxXP:13999     },
  { id:"b",              name:"B-Rank",         title:"Elite Fighter",     color:"#22d3ee", glowColor:"rgba(34,211,238,0.4)",  bgColor:"rgba(34,211,238,0.08)",  icon:"⚡", minXP:14000,  maxXP:27999     },
  { id:"a",              name:"A-Rank",         title:"Dungeon Breaker",   color:"#a855f7", glowColor:"rgba(168,85,247,0.4)",  bgColor:"rgba(168,85,247,0.08)",  icon:"💜", minXP:28000,  maxXP:49999     },
  { id:"s",              name:"S-Rank",         title:"Sovereign Hunter",  color:"#f59e0b", glowColor:"rgba(245,158,11,0.5)",  bgColor:"rgba(245,158,11,0.08)",  icon:"👑", minXP:50000,  maxXP:79999     },
  { id:"national",       name:"National Level", title:"Absolute Monarch",  color:"#ec4899", glowColor:"rgba(236,72,153,0.5)",  bgColor:"rgba(236,72,153,0.08)",  icon:"🔱", minXP:80000,  maxXP:119999    },
  { id:"shadow_monarch", name:"Shadow Monarch", title:"Arise.",            color:"#c084fc", glowColor:"rgba(192,132,252,0.6)", bgColor:"rgba(192,132,252,0.08)", icon:"⚔️", minXP:120000, maxXP:Infinity  },
];

const getRankByXP = (xp: number) => RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];
const getNextRank = (rank: RankInfo) => { const i = RANKS.findIndex(r => r.id === rank.id); return i < RANKS.length - 1 ? RANKS[i+1] : null; };
const getXPPct   = (xp: number, rank: RankInfo) => rank.maxXP === Infinity ? 100 : Math.round(((xp - rank.minXP) / (rank.maxXP - rank.minXP)) * 100);

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════
const SUBJECTS = [
  { name:"Physics",   icon:Atom,         color:"#22d3ee", rgb:"34,211,238",  locked:false, questions:48  },
  { name:"Chemistry", icon:FlaskConical, color:"#a78bfa", rgb:"167,139,250", locked:false, questions:36  },
  { name:"Math",      icon:Sigma,        color:"#34d399", rgb:"52,211,153",  locked:true,  questions:0   },
  { name:"Biology",   icon:Dna,          color:"#f87171", rgb:"248,113,113", locked:true,  questions:0   },
];

const DAILY_QUESTS = [
  { id:1, title:"Physics Mastery",  desc:"Solve 20 MCQ",       xp:500, progress:12, total:20, icon:Atom,  color:"#22d3ee", done:false },
  { id:2, title:"Speed Demon",      desc:"Answer in <5s × 10", xp:300, progress:10, total:10, icon:Clock, color:"#f59e0b", done:true  },
  { id:3, title:"Combo Master",     desc:"Get 5x combo streak", xp:400, progress:3,  total:5,  icon:Flame, color:"#f87171", done:false },
];

const STREAK_DAYS = ["M","T","W","T","F","S","S"];

const ACHIEVEMENTS = [
  { title:"First Blood",  desc:"Complete first battle", icon:"🩸", unlocked:true,  xp:100  },
  { title:"Speed Freak",  desc:"10 answers under 3s",   icon:"⚡", unlocked:true,  xp:200  },
  { title:"Combo God",    desc:"20x combo streak",      icon:"🔥", unlocked:false, xp:500  },
  { title:"Scholar",      desc:"100 questions solved",  icon:"📚", unlocked:false, xp:1000 },
];

// Default user data (before Firebase loads)
const DEFAULT_USER_DATA = {
  xp: 0, level: 1, accuracy: 0, speed: 0, iq: 0, logic: 0, focus: 0,
  streak: 0, totalBattles: 0, weeklyXP: 0, plan: "free" as Plan,
  questionsAttempted: 0, correctAnswers: 0, streakDays: [false,false,false,false,false,false,false],
  joinDate: "", totalHoursStudied: 0,
};

// ═══════════════════════════════════════════
// RANK BADGE
// ═══════════════════════════════════════════
function RankBadge({ rank, size="md" }: { rank:RankInfo; size?:"sm"|"md"|"lg" }) {
  const s = { sm:{px:"7px 11px",fs:9,icon:13}, md:{px:"9px 15px",fs:11,icon:17}, lg:{px:"13px 20px",fs:14,icon:22} }[size];
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:s.px, borderRadius:30, background:rank.bgColor, border:`1px solid ${rank.color}44`, boxShadow:`0 0 14px ${rank.glowColor}` }}>
      <span style={{ fontSize:s.icon }}>{rank.icon}</span>
      <div>
        <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:s.fs, fontWeight:900, letterSpacing:"0.1em", color:rank.color, lineHeight:1 }}>{rank.name}</p>
        {size==="lg" && <p style={{ fontSize:9, color:`${rank.color}99`, marginTop:2 }}>{rank.title}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RANK-UP CELEBRATION
// ═══════════════════════════════════════════
function RankUpCelebration({ rank, onDone }: { rank:RankInfo; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)", flexDirection:"column", gap:20 }}
    >
      {/* Particle burst */}
      {[...Array(16)].map((_,i) => (
        <motion.div key={i}
          initial={{ x:0, y:0, opacity:1, scale:1 }}
          animate={{ x:(Math.cos(i*(Math.PI*2/16))*180), y:(Math.sin(i*(Math.PI*2/16))*180), opacity:0, scale:0 }}
          transition={{ duration:1.5, delay:0.2, ease:"easeOut" }}
          style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:rank.color, boxShadow:`0 0 10px ${rank.color}` }}
        />
      ))}
      <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }} transition={{ type:"spring", bounce:0.5, delay:0.1 }}>
        <span style={{ fontSize:80 }}>{rank.icon}</span>
      </motion.div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} style={{ textAlign:"center" }}>
        <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"0.3em", color:rank.color, marginBottom:8, textTransform:"uppercase" }}>System Alert</p>
        <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:36, fontWeight:900, color:"white", marginBottom:8, fontStyle:"italic" }}>RANK UP!</h2>
        <RankBadge rank={rank} size="lg" />
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:12, fontStyle:"italic" }}>{rank.title}</p>
      </motion.div>
      <motion.button
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
        onClick={onDone}
        style={{ marginTop:16, padding:"10px 28px", background:`${rank.color}22`, border:`1px solid ${rank.color}55`, borderRadius:12, color:rank.color, fontWeight:900, fontSize:12, cursor:"pointer", letterSpacing:"0.1em", textTransform:"uppercase" }}
      >
        Continue →
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// PRO MODAL
// ═══════════════════════════════════════════
function ProModal({ onClose }: { onClose:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)" }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:"linear-gradient(135deg,#0a0f1e,#111827)", border:"1px solid rgba(168,85,247,0.4)", borderRadius:24, maxWidth:420, width:"100%", padding:32, position:"relative", boxShadow:"0 0 60px rgba(168,85,247,0.2)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.05)", border:"none", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={18}/></button>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>👑</div>
          <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, color:"#a855f7", marginBottom:8 }}>UPGRADE TO PRO</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>Unlock your full potential</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {["Unlimited questions — all subjects","S-Rank & above unlocked","Rival Battle System (1v1)","Boss Fight mode","Detailed analytics","Unlimited power-ups"].map(f => (
            <div key={f} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <CheckCircle size={15} color="#a855f7"/>
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ flex:1, padding:"14px 0", background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:12, color:"white", fontWeight:900, fontSize:14, cursor:"pointer" }}>৳১৯৯/month</button>
          <button style={{ flex:1, padding:"14px 0", background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:12, color:"#a855f7", fontWeight:900, fontSize:14, cursor:"pointer" }}>৳১৪৯৯/year</button>
        </div>
        <p style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:12 }}>bKash • Nagad • Card accepted</p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RIVAL MODAL
// ═══════════════════════════════════════════
function RivalModal({ onClose }: { onClose:()=>void }) {
  const [copied, setCopied] = useState(false);
  const link = "https://rank-push.vercel.app/rival/abc123";
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)" }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:"linear-gradient(135deg,#0a0f1e,#111827)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:24, maxWidth:400, width:"100%", padding:32, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.05)", border:"none", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={18}/></button>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>⚔️</div>
          <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, color:"#ef4444", marginBottom:8 }}>RIVAL BATTLE</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>Challenge a friend to 1v1 MCQ battle</p>
        </div>
        <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16, wordBreak:"break-all", fontSize:12, color:"rgba(255,255,255,0.6)" }}>{link}</div>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
          style={{ width:"100%", padding:"14px 0", background:copied?"rgba(34,197,94,0.2)":"linear-gradient(135deg,#dc2626,#ef4444)", border:copied?"1px solid #22c55e":"none", borderRadius:12, color:"white", fontWeight:900, fontSize:14, cursor:"pointer" }}>
          {copied ? "✓ Copied!" : "Copy Battle Link"}
        </button>
        <p style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:12 }}>PRO — Share via WhatsApp</p>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RANK MODAL
// ═══════════════════════════════════════════
function RankModal({ onClose, currentXP }: { onClose:()=>void; currentXP:number }) {
  const cur = getRankByXP(currentXP);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(12px)" }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:"#080613", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, maxWidth:500, width:"100%", padding:24, maxHeight:"88vh", overflowY:"auto", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.05)", border:"none", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={16}/></button>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.2em", color:"#22d3ee", marginBottom:6 }}>SYSTEM · RANK PROGRESSION</p>
          <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900 }}>Hunter Rank System</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {RANKS.map(r => {
            const isCur = r.id === cur.id;
            const isUnlocked = currentXP >= r.minXP;
            return (
              <div key={r.id} style={{ padding:"12px 16px", borderRadius:12, background:isCur?r.bgColor:"rgba(255,255,255,0.02)", border:isCur?`1px solid ${r.color}55`:"1px solid rgba(255,255,255,0.05)", opacity:isUnlocked?1:0.4, boxShadow:isCur?`0 0 16px ${r.glowColor}`:"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:20, width:28, textAlign:"center" }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                      <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:900, color:r.color }}>{r.name}</p>
                      <p style={{ fontSize:9, color:`${r.color}88`, fontStyle:"italic" }}>{r.title}</p>
                      {isCur && <span style={{ fontSize:8, padding:"2px 7px", borderRadius:20, background:r.bgColor, border:`1px solid ${r.color}44`, color:r.color, fontWeight:800 }}>CURRENT</span>}
                    </div>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{r.maxXP===Infinity?`${r.minXP.toLocaleString()}+ XP`:`${r.minXP.toLocaleString()} – ${r.maxXP.toLocaleString()} XP`}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════
function ProfileModal({ onClose, user, userData }: { onClose:()=>void; user:any; userData:typeof DEFAULT_USER_DATA }) {
  const rank     = getRankByXP(userData.xp);
  const nextRank = getNextRank(rank);
  const xpPct    = getXPPct(userData.xp, rank);
  const [tab, setTab] = useState<"overview"|"stats"|"achievements">("overview");
  const ts = (t: string) => ({
    flex:1, padding:"9px", borderRadius:9, cursor:"pointer",
    fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900,
    letterSpacing:"0.08em", textTransform:"uppercase" as const,
    background:tab===t?"rgba(34,211,238,0.1)":"transparent",
    border:tab===t?"1px solid rgba(34,211,238,0.3)":"1px solid transparent",
    color:tab===t?"#22d3ee":"rgba(255,255,255,0.3)", transition:"all 0.2s",
  });
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(12px)" }}>
      <motion.div initial={{ scale:0.92, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
        style={{ background:"#06040f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:28, maxWidth:520, width:"100%", overflow:"hidden", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Header BG */}
        <div style={{ height:100, background:`linear-gradient(135deg,${rank.bgColor},rgba(0,0,0,0))`, borderBottom:`1px solid ${rank.color}22`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:rank.color, opacity:0.07, filter:"blur(40px)" }}/>
          <div style={{ position:"absolute", bottom:8, right:14, fontFamily:"'Orbitron',sans-serif", fontSize:40, opacity:0.06, letterSpacing:"-1px" }}>{rank.name.toUpperCase()}</div>
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.1)", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={15}/></button>
        </div>
        <div style={{ padding:"0 22px 26px", marginTop:-44 }}>
          {/* Avatar row */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:18 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:80, height:80, borderRadius:"50%", border:`3px solid ${rank.color}`, boxShadow:`0 0 20px ${rank.glowColor}`, overflow:"hidden" }}>
                <img src={user?.photoURL||"https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="avatar"/>
              </div>
              <div style={{ position:"absolute", bottom:0, right:-4, background:`linear-gradient(135deg,${rank.color},${rank.color}bb)`, borderRadius:7, padding:"2px 6px", fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900, border:"2px solid #06040f" }}>LVL {userData.level}</div>
            </div>
            <div style={{ flex:1, paddingBottom:4 }}>
              <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, letterSpacing:"0.05em", marginBottom:5 }}>{user?.displayName||"CYBER HUNTER"}</h2>
              <RankBadge rank={rank} size="sm"/>
            </div>
          </div>
          {/* XP Bar */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
              <div><span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:17, fontWeight:900, color:rank.color }}>{userData.xp.toLocaleString()}</span><span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginLeft:5 }}>XP</span></div>
              {nextRank && <div style={{ textAlign:"right" }}><p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:"0.08em" }}>NEXT RANK</p><p style={{ fontSize:10, fontWeight:800, color:nextRank.color, fontFamily:"'Orbitron',sans-serif" }}>{nextRank.name}</p></div>}
            </div>
            <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${xpPct}%`, background:`linear-gradient(90deg,${rank.color},${rank.color}bb)`, borderRadius:3, boxShadow:`0 0 8px ${rank.glowColor}`, transition:"width 1s ease" }}/>
            </div>
            {nextRank && <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)", marginTop:5, textAlign:"right" }}>{(nextRank.minXP-userData.xp).toLocaleString()} XP to {nextRank.name}</p>}
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", borderRadius:11, padding:4, marginBottom:16 }}>
            {(["overview","stats","achievements"] as const).map(t => <button key={t} style={ts(t)} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          {/* Tab: Overview */}
          {tab==="overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              {[
                { l:"Battles",      v:userData.totalBattles,        icon:Swords,   c:"#22d3ee" },
                { l:"Streak",       v:`${userData.streak} days 🔥`, icon:Flame,    c:"#f97316" },
                { l:"Hours Studied",v:`${userData.totalHoursStudied}h`, icon:Clock,c:"#a855f7" },
                { l:"Questions",    v:userData.questionsAttempted,  icon:Target,   c:"#34d399" },
              ].map(s => (
                <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11, padding:"11px 13px", display:"flex", alignItems:"center", gap:9 }}>
                  <s.icon size={15} color={s.c} style={{ flexShrink:0 }}/>
                  <div><p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.l}</p><p style={{ fontSize:13, fontWeight:800, marginTop:1 }}>{typeof s.v==="number"?s.v.toLocaleString():s.v}</p></div>
                </div>
              ))}
            </div>
          )}
          {/* Tab: Stats */}
          {tab==="stats" && (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                {[
                  { l:"Questions",  v:userData.questionsAttempted.toLocaleString(), c:"#22d3ee" },
                  { l:"Correct",    v:userData.correctAnswers.toLocaleString(),     c:"#34d399" },
                  { l:"Accuracy",   v:`${userData.accuracy}%`,                      c:"#f59e0b" },
                  { l:"Total XP",   v:userData.xp.toLocaleString(),                c:"#a855f7" },
                ].map(s => (
                  <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11, padding:"13px", textAlign:"center" }}>
                    <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:19, fontWeight:900, color:s.c }}>{s.v}</p>
                    <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {/* Attributes */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:13, padding:"14px" }}>
                <p style={{ fontSize:8, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:12 }}>Neural Attributes</p>
                {[{l:"Accuracy",v:userData.accuracy,c:"#22d3ee"},{l:"Speed",v:userData.speed,c:"#0ea5e9"},{l:"Logic",v:userData.logic,c:"#34d399"},{l:"Focus",v:userData.focus,c:"#a855f7"}].map(a => (
                  <div key={a.l} style={{ marginBottom:9 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)", textTransform:"uppercase" }}>{a.l}</span>
                      <span style={{ fontSize:9, fontWeight:800, color:a.c }}>{a.v}%</span>
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${a.v}%`, background:a.c, borderRadius:2 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Tab: Achievements */}
          {tab==="achievements" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {ACHIEVEMENTS.map(a => (
                <div key={a.title} style={{ borderRadius:13, padding:"13px 11px", textAlign:"center", background:a.unlocked?"rgba(34,211,238,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${a.unlocked?"rgba(34,211,238,0.2)":"rgba(255,255,255,0.05)"}`, opacity:a.unlocked?1:0.4 }}>
                  <div style={{ fontSize:24, marginBottom:7 }}>{a.icon}</div>
                  <p style={{ fontSize:9, fontWeight:800, color:a.unlocked?"#22d3ee":"white", marginBottom:2 }}>{a.title}</p>
                  <p style={{ fontSize:8, color:"rgba(255,255,255,0.35)", marginBottom:5 }}>{a.desc}</p>
                  <p style={{ fontSize:9, fontWeight:800, color:"#f59e0b" }}>+{a.xp} XP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════
const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#02010a;color:white;font-family:'Outfit',sans-serif;overflow-x:hidden;scroll-behavior:smooth}
  body{background-image:radial-gradient(ellipse 80% 50% at 20% 0%,rgba(14,165,233,0.07) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 100%,rgba(124,58,237,0.06) 0%,transparent 60%),linear-gradient(to bottom,#02010a,#050b14);min-height:100vh}
  body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);pointer-events:none;z-index:1}
  .font-logo{font-family:'Orbitron',sans-serif}
  .font-bn{font-family:'Hind Siliguri',sans-serif}

  .card{background:rgba(255,255,255,0.025);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06);border-radius:20px;transition:all 0.3s ease}
  .card:hover{border-color:rgba(34,211,238,0.12);background:rgba(255,255,255,0.032)}

  @keyframes xpFill{from{width:0%}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.3)}50%{box-shadow:0 0 40px rgba(14,165,233,0.6)}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes streakPop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
  @keyframes questFill{from{width:0%}}
  @keyframes statFill{from{width:0%}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes badgeBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  @keyframes shadowFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-8px) rotate(1deg)}}
  @keyframes rankGlow{0%,100%{opacity:0.6}50%{opacity:1}}

  .xp-bar{animation:xpFill 1.4s cubic-bezier(0.4,0,0.2,1) forwards}
  .glow-pulse{animation:glowPulse 2s ease-in-out infinite}
  .float{animation:floatY 3s ease-in-out infinite}
  .badge-bounce{animation:badgeBounce 1.2s ease infinite}
  .quest-bar{animation:questFill 1s ease forwards}
  .stat-bar{animation:statFill 1.6s cubic-bezier(0.4,0,0.2,1) forwards}
  .streak-pip{animation:streakPop 0.4s ease forwards}
  .shadow-float{animation:shadowFloat 4s ease-in-out infinite}

  .shimmer-text{background:linear-gradient(90deg,#a855f7,#ec4899,#f59e0b,#a855f7);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}

  .sub-btn{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px 12px;display:flex;flex-direction:column;align-items:center;gap:9px;cursor:pointer;transition:all 0.25s ease;position:relative;overflow:hidden}
  .sub-btn:hover:not(.sub-locked){border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.055);transform:translateY(-2px)}
  .sub-btn.sub-active{border-color:var(--sc)!important;background:rgba(var(--sr),0.1)!important;box-shadow:0 8px 24px rgba(var(--sr),0.22)!important;transform:translateY(-3px) scale(1.02)}
  .sub-locked{opacity:0.32;cursor:not-allowed}

  .arena-btn{width:100%;padding:19px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:1px solid rgba(255,255,255,0.2);border-radius:15px;color:white;font-family:'Orbitron',sans-serif;font-size:17px;font-weight:900;letter-spacing:0.2em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:11px;transition:all 0.3s;position:relative;overflow:hidden}
  .arena-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(14,165,233,0.4)}
  .arena-btn:active{transform:translateY(0) scale(0.98)}

  .nav-link{font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;opacity:0.4;transition:opacity 0.2s;cursor:pointer;color:white;text-decoration:none}
  .nav-link:hover{opacity:0.8}
  .nav-link.active{opacity:1;color:#22d3ee;border-bottom:2px solid #0ea5e9;padding-bottom:4px}

  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(14,165,233,0.3);border-radius:2px}

  /* Mobile bottom nav */
  .mobile-nav{display:none}
  @media(max-width:1024px){
    .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(2,1,10,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.07);padding:8px 0 env(safe-area-inset-bottom,8px)}
    .desktop-sidebar{display:none!important}
    .right-col{display:none!important}
  }
  @media(max-width:768px){
    .center-col{padding:0 12px!important}
    .hero-title{font-size:32px!important}
  }
`;

// ═══════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════
export default function RankPushDashboard() {
  const router = useRouter();

  // Auth & User
  const [user,         setUser]         = useState<any>(null);
  const [userData,     setUserData]     = useState(DEFAULT_USER_DATA);
  const [dataLoading,  setDataLoading]  = useState(true);

  // UI State
  const [selectedSub,   setSelectedSub]   = useState("Physics");
  const [showPro,       setShowPro]       = useState(false);
  const [showRival,     setShowRival]     = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showNotif,     setShowNotif]     = useState(false);
  const [showMobileMenu,setMobileMenu]   = useState(false);
  const [animXP,        setAnimXP]       = useState(0);
  const [rankUpRank,    setRankUpRank]   = useState<RankInfo|null>(null);
  const [leaderboard,   setLeaderboard]  = useState<any[]>([]);

  const prevRankRef = useRef<string>("");

  const rank     = getRankByXP(userData.xp);
  const nextRank = getNextRank(rank);
  const xpPct    = getXPPct(userData.xp, rank);

  // ── Firebase Auth ──────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) { router.push("/"); return; }

      // Fetch or create user doc
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // New user — create doc
        const newData = {
          ...DEFAULT_USER_DATA,
          displayName: u.displayName || "Cyber Hunter",
          email: u.email || "",
          avatar: u.photoURL || "",
          plan: "free",
          joinDate: new Date().toISOString(),
          createdAt: new Date(),
          streakDays: [false,false,false,false,false,false,false],
        };
        await setDoc(ref, newData);
        setUserData(newData as any);
      } else {
        setUserData(snap.data() as any);
        prevRankRef.current = getRankByXP((snap.data() as any).xp || 0).id;
      }
      setDataLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Real-time XP listener ──────────────
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as typeof DEFAULT_USER_DATA;
      const newRank = getRankByXP(data.xp);

      // Check rank-up
      if (prevRankRef.current && prevRankRef.current !== newRank.id) {
        const oldIdx = RANKS.findIndex(r => r.id === prevRankRef.current);
        const newIdx = RANKS.findIndex(r => r.id === newRank.id);
        if (newIdx > oldIdx) setRankUpRank(newRank);
      }
      prevRankRef.current = newRank.id;
      setUserData(data);
    });
    return () => unsub();
  }, [user]);

  // ── XP count-up animation ──────────────
  useEffect(() => {
    let cur = 0; const end = userData.xp; const step = end / (1200/16);
    const t = setInterval(() => { cur = Math.min(cur+step, end); setAnimXP(Math.round(cur)); if(cur>=end) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [userData.xp]);

  // ── Leaderboard fetch ──────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db,"users"), orderBy("xp","desc"), limit(5));
        const snap = await getDocs(q);
        setLeaderboard(snap.docs.map((d,i) => ({ ...d.data(), rank:i+1, id:d.id })));
      } catch { /* offline fallback */ }
    };
    fetch();
  }, []);

  // ── Close notif on outside click ──────
  useEffect(() => {
    const close = () => { setShowNotif(false); setMobileMenu(false); };
    if (showNotif || showMobileMenu) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showNotif, showMobileMenu]);

  const handleSignOut = async () => { await signOut(auth); router.push("/"); };

  // ── Skeleton loader ────────────────────
  if (dataLoading) {
    return (
      <div style={{ minHeight:"100vh", background:"#02010a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ width:56, height:56, background:"rgba(14,165,233,0.1)", border:"1px solid rgba(14,165,233,0.3)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Swords size={24} color="#22d3ee" />
        </div>
        <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"0.3em", color:"rgba(34,211,238,0.6)", textTransform:"uppercase" }}>Loading System...</p>
        <div style={{ width:160, height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#0ea5e9,#a855f7)", borderRadius:1, animation:"xpFill 1.5s ease-in-out infinite alternate" }}/>
        </div>
      </div>
    );
  }

  // ── RENDER ─────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{CSS}</style>

      {/* MODALS */}
      <AnimatePresence>
        {rankUpRank && <RankUpCelebration rank={rankUpRank} onDone={() => setRankUpRank(null)} />}
      </AnimatePresence>
      {showPro        && <ProModal      onClose={() => setShowPro(false)} />}
      {showRival      && <RivalModal    onClose={() => setShowRival(false)} />}
      {showRankModal  && <RankModal     onClose={() => setShowRankModal(false)} currentXP={userData.xp} />}
      {showProfile    && <ProfileModal  onClose={() => setShowProfile(false)} user={user} userData={userData} />}

      {/* AMBIENT */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:700, height:700, background:"#0ea5e9", opacity:0.05, filter:"blur(140px)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:700, height:700, background:rank.color, opacity:0.04, filter:"blur(140px)", borderRadius:"50%" }}/>
      </div>

      <div style={{ minHeight:"100vh", padding:"0 0 80px 0", position:"relative", zIndex:10 }}>

        {/* ═══════════ HEADER ═══════════ */}
        <header style={{ position:"sticky", top:0, zIndex:40, background:"rgba(2,1,10,0.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 20px" }}>
          <div style={{ maxWidth:1800, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>

            {/* Left: Logo + Nav */}
            <div style={{ display:"flex", alignItems:"center", gap:32 }}>
              {/* Logo */}
              <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                <div style={{ padding:9, background:"#0ea5e9", borderRadius:12, boxShadow:"0 0 16px rgba(14,165,233,0.5)", border:"1px solid rgba(255,255,255,0.2)" }}>
                  <Swords size={17} color="white"/>
                </div>
                <span className="font-logo" style={{ fontSize:20, letterSpacing:"-0.02em" }}>RANKPUSH</span>
              </div>
              {/* Desktop nav */}
              <nav style={{ display:"flex", gap:24 }} className="hidden xl:flex">
                <a className="nav-link active">Dashboard</a>
                <a className="nav-link" onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)}>Battle Arena</a>
                <a className="nav-link" onClick={() => router.push("/timer")}>Shadow Focus</a>
                <a className="nav-link">Leaderboard</a>
                <a className="nav-link">Analytics</a>
              </nav>
            </div>

            {/* Right */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* Weekly XP pill */}
              <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:100, padding:"6px 14px" }} className="hidden md:flex">
                <TrendingUp size={13} color="#22c55e"/>
                <span style={{ fontSize:10, fontWeight:800, color:"#22c55e", letterSpacing:"0.1em" }}>+{userData.weeklyXP.toLocaleString()} THIS WEEK</span>
              </div>

              {/* Notifications */}
              <div style={{ position:"relative" }}>
                <button onClick={e => { e.stopPropagation(); setShowNotif(v=>!v); }}
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:11, padding:9, cursor:"pointer", color:"white", display:"flex" }}>
                  <Bell size={17}/>
                </button>
                <div className="badge-bounce" style={{ position:"absolute", top:-3, right:-3, width:15, height:15, background:"#ef4444", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900, border:"2px solid #02010a" }}>3</div>
                <AnimatePresence>
                  {showNotif && (
                    <motion.div initial={{ opacity:0, y:8, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:8, scale:0.95 }}
                      onClick={e=>e.stopPropagation()}
                      style={{ position:"absolute", top:46, right:0, width:270, background:"#0d1420", border:"1px solid rgba(255,255,255,0.09)", borderRadius:18, padding:16, zIndex:60, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                      {[
                        { msg:`You ranked up to ${rank.name}! ${rank.icon}`, time:"2m ago",  color:"#22d3ee" },
                        { msg:"Daily quest reset — new challenges!",          time:"1h ago",  color:"#f59e0b" },
                        { msg:"ZeroOne challenged you ⚔️",                   time:"3h ago",  color:"#ef4444" },
                      ].map((n,i) => (
                        <div key={i} style={{ padding:"10px 0", borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
                          <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginBottom:3 }}>{n.msg}</p>
                          <p style={{ fontSize:10, color:n.color }}>{n.time}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pro badge */}
              {userData.plan==="free" ? (
                <button onClick={() => setShowPro(true)}
                  style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:11, padding:"9px 16px", cursor:"pointer", color:"white", fontWeight:900, fontSize:11, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                  <Crown size={13}/> GO PRO
                </button>
              ) : (
                <div style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius:11, padding:"9px 16px", fontSize:11, fontWeight:900, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                  <Crown size={13}/> PRO
                </div>
              )}

              {/* Sign out */}
              <button onClick={handleSignOut}
                style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:11, padding:9, cursor:"pointer", color:"#ef4444", display:"flex" }}>
                <LogOut size={17}/>
              </button>
            </div>
          </div>
        </header>

        {/* ═══════════ BODY ═══════════ */}
        <div style={{ maxWidth:1800, margin:"0 auto", padding:"24px 20px 0", display:"grid", gridTemplateColumns:"300px 1fr 280px", gap:22, alignItems:"start" }}>

          {/* ── LEFT SIDEBAR ── */}
          <div className="desktop-sidebar" style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Player Card */}
            <div className="card" style={{ padding:"28px 24px", textAlign:"center", borderTop:`3px solid ${rank.color}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-25%", left:"50%", transform:"translateX(-50%)", width:200, height:200, borderRadius:"50%", background:rank.color, opacity:0.06, filter:"blur(50px)", pointerEvents:"none" }}/>

              {/* Avatar */}
              <div style={{ position:"relative", width:88, height:88, margin:"0 auto 16px", borderRadius:"50%", border:`2px solid ${rank.color}`, boxShadow:`0 0 24px ${rank.glowColor}`, cursor:"pointer" }}
                onClick={() => setShowProfile(true)}>
                <img src={user?.photoURL||"https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"}
                  style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} alt="Profile"/>
                <div style={{ position:"absolute", bottom:-3, right:-3, background:`linear-gradient(135deg,${rank.color},${rank.color}bb)`, borderRadius:8, padding:"3px 7px", fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900, border:"2px solid #02010a" }}>
                  LVL {userData.level}
                </div>
              </div>

              <h2 className="font-logo" style={{ fontSize:16, letterSpacing:"0.04em", marginBottom:10 }}>
                {user?.displayName||"CYBER HUNTER"}
              </h2>

              {/* Rank badge — clickable */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
                <button onClick={() => setShowRankModal(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <RankBadge rank={rank} size="md"/>
                </button>
              </div>

              {/* XP */}
              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:100, padding:"7px 18px", display:"inline-flex", alignItems:"center", gap:6, marginBottom:16 }}>
                <span style={{ fontWeight:900, fontSize:16 }}>{animXP.toLocaleString()}</span>
                <span style={{ color:"#22d3ee", fontWeight:900, fontSize:10 }}>EXP</span>
              </div>

              {/* XP Bar */}
              <div style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:8, fontWeight:800, opacity:0.4, textTransform:"uppercase", letterSpacing:"0.1em" }}>Next: {nextRank?.name||"MAX"}</span>
                  <span style={{ fontSize:8, fontWeight:800, color:"#22d3ee" }}>{xpPct}%</span>
                </div>
                <div style={{ height:5, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                  <div className="xp-bar" style={{ height:"100%", width:`${xpPct}%`, background:`linear-gradient(90deg,${rank.color},${rank.color}cc)`, borderRadius:3, boxShadow:`0 0 8px ${rank.glowColor}` }}/>
                </div>
                {nextRank && <p style={{ fontSize:8, textAlign:"right", marginTop:4, opacity:0.25 }}>{(nextRank.minXP-userData.xp).toLocaleString()} XP to go</p>}
              </div>

              {/* Quick stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16, paddingTop:16, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                {[{l:"Battles",v:userData.totalBattles},{l:"Streak",v:`${userData.streak}🔥`},{l:"Accuracy",v:`${userData.accuracy}%`}].map(s => (
                  <div key={s.l}>
                    <p style={{ fontSize:13, fontWeight:900 }}>{typeof s.v==="number"?s.v.toLocaleString():s.v}</p>
                    <p style={{ fontSize:7, opacity:0.32, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{s.l}</p>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowProfile(true)}
                style={{ width:"100%", marginTop:14, padding:"8px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:11, color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <User size={10}/> View Full Profile
              </button>
            </div>

            {/* Neural Attributes */}
            <div className="card" style={{ padding:"22px" }}>
              <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", opacity:0.45, textTransform:"uppercase", marginBottom:18, display:"flex", alignItems:"center", gap:7 }}>
                <Brain size={12} color="#22d3ee"/> Neural Attributes
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  {l:"Accuracy",v:userData.accuracy,d:`${userData.accuracy}%`,c:"#22d3ee"},
                  {l:"Speed",   v:userData.speed,   d:`${userData.speed}%`,   c:"#0ea5e9"},
                  {l:"IQ",      v:Math.min(userData.iq,100),d:`${userData.iq}`,c:"rgba(255,255,255,0.7)"},
                  {l:"Logic",   v:userData.logic,   d:`${userData.logic}%`,   c:"#34d399"},
                  {l:"Focus",   v:userData.focus,   d:`${userData.focus}%`,   c:"#a855f7"},
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", opacity:0.6 }}>{s.l}</span>
                      <span style={{ fontSize:9, fontWeight:900, color:s.c }}>{s.d}</span>
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                      <div className="stat-bar" style={{ height:"100%", width:`${s.v}%`, background:s.c, borderRadius:2, boxShadow:`0 0 6px ${s.c}88` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Streak */}
            <div className="card" style={{ padding:"22px", borderLeft:"3px solid #f59e0b", background:"rgba(245,158,11,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                <Flame size={15} color="#f59e0b"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Daily Streak</h3>
                <span style={{ marginLeft:"auto", fontSize:17, fontWeight:900, color:"#f59e0b" }}>{userData.streak} 🔥</span>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                {STREAK_DAYS.map((d,i) => {
                  const done = userData.streakDays?.[i] || false;
                  return (
                    <div key={i} className="streak-pip flex-1 text-center" style={{ animationDelay:`${i*70}ms`, flex:1, textAlign:"center" }}>
                      <div style={{ height:30, borderRadius:8, background:done?"#f59e0b":"rgba(255,255,255,0.04)", border:done?"none":"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:3, boxShadow:done?"0 0 10px rgba(245,158,11,0.4)":"none" }}>
                        {done && <span style={{ fontSize:10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:7, fontWeight:700, opacity:0.4, textTransform:"uppercase" }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements */}
            <div className="card" style={{ padding:"22px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
                <Award size={13} color="#f59e0b"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Achievements</h3>
                <span style={{ marginLeft:"auto", fontSize:9, color:"#22d3ee", fontWeight:800 }}>2/4</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {ACHIEVEMENTS.map(a => (
                  <div key={a.title} style={{ borderRadius:12, padding:"11px 9px", textAlign:"center", background:a.unlocked?"rgba(34,211,238,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${a.unlocked?"rgba(34,211,238,0.18)":"rgba(255,255,255,0.05)"}`, opacity:a.unlocked?1:0.38 }}>
                    <div style={{ fontSize:20, marginBottom:5 }}>{a.icon}</div>
                    <p style={{ fontSize:9, fontWeight:800, color:a.unlocked?"#22d3ee":"white", marginBottom:1 }}>{a.title}</p>
                    <p style={{ fontSize:7, opacity:0.35 }}>{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Directive */}
            <div className="card" style={{ padding:"22px", borderLeft:"3px solid #34d399", background:"rgba(52,211,153,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10, opacity:0.7 }}>
                <Quote size={13} color="#34d399"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Daily Directive</h3>
              </div>
              <p className="font-bn" style={{ fontSize:12, fontStyle:"italic", fontWeight:600, lineHeight:1.65, color:"rgba(255,255,255,0.8)", marginBottom:8 }}>
                "Seek knowledge from the cradle to the grave."
              </p>
              <p style={{ fontSize:8, fontWeight:900, color:"#34d399", letterSpacing:"0.15em", textTransform:"uppercase" }}>— PROPHET MUHAMMAD (PBUH)</p>
            </div>
          </div>

          {/* ── CENTER COLUMN ── */}
          <div className="center-col" style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Hero Banner */}
            <div className="card" style={{ padding:"36px 40px", background:"linear-gradient(135deg,rgba(14,165,233,0.08),rgba(124,58,237,0.04))", borderTop:"3px solid #0ea5e9", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-20, top:"50%", transform:"translateY(-50%)", opacity:0.04 }}><LayoutDashboard size={200}/></div>
              <div className="shadow-float" style={{ position:"absolute", right:20, bottom:0, fontSize:100, opacity:0.04, pointerEvents:"none", lineHeight:1 }}>⚔️</div>
              <div style={{ position:"relative", zIndex:1 }}>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.3em", color:"#22d3ee", textTransform:"uppercase", marginBottom:10, opacity:0.8 }}>
                  ⚔️ System Status: {rank.title}
                </p>
                <h1 className="font-logo hero-title" style={{ fontSize:48, fontStyle:"italic", lineHeight:0.95, textTransform:"uppercase", marginBottom:18 }}>
                  DOMINATE<br/><span style={{ color:"#22d3ee", textShadow:"0 0 30px rgba(34,211,238,0.4)" }}>THE META</span>
                </h1>
                <div style={{ display:"flex", flexWrap:"wrap", gap:12 }}>
                  {[
                    {label:"Total Battles",value:userData.totalBattles,      icon:Swords,    color:"#22d3ee"},
                    {label:"Accuracy",     value:`${userData.accuracy}%`,    icon:Crosshair, color:"#34d399"},
                    {label:"Best Streak",  value:`${userData.streak} days`,  icon:Flame,     color:"#f59e0b"},
                    {label:"Questions",    value:userData.questionsAttempted, icon:BookOpen, color:"#a855f7"},
                  ].map(s => (
                    <div key={s.label} style={{ display:"flex", alignItems:"center", gap:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 14px" }}>
                      <s.icon size={14} color={s.color}/>
                      <div>
                        <p style={{ fontSize:15, fontWeight:900, color:s.color }}>{typeof s.value==="number"?s.value.toLocaleString():s.value}</p>
                        <p style={{ fontSize:8, opacity:0.38, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow Focus Banner */}
            <div className="card" style={{ padding:"22px 26px", borderLeft:"4px solid #a855f7", background:"linear-gradient(90deg,rgba(168,85,247,0.08),transparent)", display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
              <div style={{ padding:12, background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:14 }}>
                <Timer size={22} color="#a855f7"/>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <h3 className="font-logo" style={{ fontSize:15, color:"#a855f7", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Shadow Focus</h3>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>Pomodoro or Free Timer — earn bonus XP and climb the study leaderboard.</p>
              </div>
              <button onClick={() => router.push("/timer")}
                style={{ padding:"11px 22px", borderRadius:12, fontWeight:900, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", color:"white", cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 0 20px rgba(168,85,247,0.3)", whiteSpace:"nowrap" }}>
                <Play size={13} fill="white"/> Enter Focus
              </button>
            </div>

            {/* Tactical Arena */}
            <div className="card" style={{ padding:"26px 28px", borderTop:"3px solid #0ea5e9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                <div>
                  <h2 className="font-logo" style={{ fontSize:20, textTransform:"uppercase", marginBottom:3 }}>
                    Tactical <span style={{ color:"#0ea5e9" }}>Arena</span>
                  </h2>
                  <p style={{ fontSize:9, fontWeight:700, opacity:0.33, textTransform:"uppercase", letterSpacing:"0.2em" }}>Select your mastery field</p>
                </div>
                <div className="float" style={{ width:44, height:44, background:"rgba(14,165,233,0.1)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(14,165,233,0.2)" }}>
                  <Swords size={20} color="#22d3ee"/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {SUBJECTS.map(sub => {
                  const isActive = selectedSub === sub.name;
                  return (
                    <button key={sub.name} type="button"
                      className={`sub-btn ${isActive?"sub-active":""} ${sub.locked?"sub-locked":""}`}
                      style={{ "--sc":sub.color, "--sr":sub.rgb } as any}
                      onClick={() => { if(!sub.locked) setSelectedSub(sub.name); else setShowPro(true); }}>
                      {sub.locked && <div style={{ position:"absolute", top:7, right:7 }}><Lock size={9} color="rgba(255,255,255,0.3)"/></div>}
                      <sub.icon size={22} color={isActive?sub.color:"rgba(255,255,255,0.4)"} style={{ filter:isActive?`drop-shadow(0 0 8px ${sub.color})`:"none", transition:"all 0.3s" }}/>
                      <span style={{ fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.12em", color:isActive?"white":"rgba(255,255,255,0.4)" }}>{sub.name}</span>
                      {!sub.locked
                        ? <span style={{ fontSize:8, color:isActive?sub.color:"rgba(255,255,255,0.22)", fontWeight:700 }}>{sub.questions} QS</span>
                        : <span style={{ fontSize:8, color:"#a855f7", fontWeight:700 }}>PRO</span>}
                    </button>
                  );
                })}
              </div>

              <button className="arena-btn glow-pulse" onClick={() => router.push(`/arena/${selectedSub.toLowerCase()}`)}>
                ENTER ARENA <Play size={17} fill="white"/>
              </button>
            </div>

            {/* Rival Battle */}
            <div className="card" style={{ padding:"22px 26px", background:"linear-gradient(90deg,rgba(239,68,68,0.05),transparent)", borderLeft:"3px solid #ef4444", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ width:44, height:44, background:"rgba(239,68,68,0.1)", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(239,68,68,0.2)", flexShrink:0 }}>
                <Sword size={20} color="#ef4444"/>
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <h3 className="font-logo" style={{ fontSize:14, color:"#ef4444", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>Rival Battle</h3>
                <p style={{ fontSize:10, opacity:0.4 }}>Challenge a friend to real-time 1v1 MCQ battle</p>
              </div>
              <button onClick={() => userData.plan==="pro" ? setShowRival(true) : setShowPro(true)}
                style={{ padding:"10px 20px", background:"linear-gradient(135deg,#dc2626,#ef4444)", border:"none", borderRadius:12, color:"white", fontWeight:900, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" }}>
                {userData.plan==="pro" ? <><Wifi size={13}/> Find Rival</> : <><Lock size={13}/> PRO Only</>}
              </button>
            </div>

            {/* Weekly Performance */}
            <div className="card" style={{ padding:"22px 26px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:18 }}>
                <BarChart2 size={14} color="#22d3ee"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.6 }}>Performance This Week</h3>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {[
                  {label:"Battles",   value:userData.totalBattles>0?Math.min(18,userData.totalBattles):18, color:"#22d3ee", icon:Swords      },
                  {label:"Correct",   value:userData.correctAnswers>0?Math.min(142,userData.correctAnswers):142, color:"#34d399", icon:CheckCircle},
                  {label:"XP Earned", value:userData.weeklyXP||2340,                                       color:"#f59e0b", icon:Zap          },
                  {label:"Rank ▲",    value:"3 ↑",                                                         color:"#a855f7", icon:ChevronUp    },
                ].map(s => (
                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:13, padding:"14px 10px", textAlign:"center" }}>
                    <s.icon size={15} color={s.color} style={{ margin:"0 auto 8px" }}/>
                    <p style={{ fontSize:20, fontWeight:900, color:s.color, marginBottom:2 }}>{typeof s.value==="number"?s.value.toLocaleString():s.value}</p>
                    <p style={{ fontSize:8, opacity:0.33, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="right-col" style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Live Leaderboard */}
            <div className="card" style={{ padding:"22px", borderLeft:"3px solid rgba(14,165,233,0.5)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.55, display:"flex", alignItems:"center", gap:7 }}>
                  <Trophy size={12} color="#f59e0b"/> Global Elite
                </h3>
                <span style={{ fontSize:8, fontWeight:900, color:"#22d3ee", border:"1px solid rgba(34,211,238,0.3)", padding:"2px 9px", borderRadius:100, background:"rgba(34,211,238,0.06)" }}>LIVE</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {(leaderboard.length > 0 ? leaderboard : [
                  {displayName:"S-Rank_Slayer", xp:24500, rank:1},
                  {displayName:"ZeroOne",       xp:22100, rank:2},
                  {displayName:"GhostVibes",    xp:19850, rank:3},
                  {displayName:"NightCrawler",  xp:17200, rank:4},
                  {displayName:"PhantomX",      xp:15900, rank:5},
                ]).map((p: any, i: number) => {
                  const pRank = getRankByXP(p.xp||0);
                  const isMe = p.id === user?.uid;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 10px", borderRadius:12, background:isMe?"rgba(34,211,238,0.06)":i===0?"rgba(34,211,238,0.04)":"transparent", border:isMe?"1px solid rgba(34,211,238,0.2)":i===0?"1px solid rgba(34,211,238,0.08)":"1px solid transparent", transition:"all 0.2s", cursor:"pointer" }}>
                      <span style={{ fontSize:12, fontWeight:900, fontStyle:"italic", minWidth:22, color:i===0?"#22d3ee":"rgba(255,255,255,0.35)" }}>{String(i+1).padStart(2,"0")}</span>
                      <div style={{ position:"relative", flexShrink:0 }}>
                        <img src={p.avatar||`https://i.pravatar.cc/150?u=${p.displayName}`} style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", border:`2px solid ${pRank.color}` }} alt={p.displayName}/>
                        <span style={{ position:"absolute", bottom:-2, right:-2, fontSize:9 }}>{pRank.icon}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", fontStyle:"italic", color:isMe?"#22d3ee":i===0?"#22d3ee":"rgba(255,255,255,0.75)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {p.displayName||"Hunter"}{isMe?" (You)":""}
                        </p>
                        <div style={{ height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, marginTop:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(100,(p.xp||0)/300)}%`, background:pRank.color }}/>
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <p style={{ fontSize:10, fontWeight:900, color:"#22d3ee" }}>{(p.xp||0).toLocaleString()}</p>
                        <p style={{ fontSize:7, opacity:0.32, textTransform:"uppercase" }}>EXP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button style={{ width:"100%", marginTop:12, padding:"9px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                View Full Leaderboard <ArrowRight size={11}/>
              </button>
            </div>

            {/* Daily Quests */}
            <div className="card" style={{ padding:"22px", borderLeft:"3px solid #f97316", background:"rgba(249,115,22,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16, opacity:0.8 }}>
                <Flame size={14} color="#f97316"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Daily Quests</h3>
                <span style={{ marginLeft:"auto", fontSize:9, color:"#f97316", fontWeight:800 }}>1/3 Done</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                {DAILY_QUESTS.map(q => (
                  <div key={q.id} style={{ background:q.done?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.025)", border:`1px solid ${q.done?"rgba(34,197,94,0.18)":"rgba(255,255,255,0.05)"}`, borderRadius:13, padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:9, marginBottom:q.done?0:8 }}>
                      <q.icon size={13} color={q.done?"#22c55e":q.color} style={{ flexShrink:0, marginTop:2 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <p style={{ fontSize:10, fontWeight:800, color:q.done?"#22c55e":"rgba(255,255,255,0.85)", textDecoration:q.done?"line-through":"none" }}>{q.title}</p>
                          <span style={{ fontSize:9, fontWeight:900, color:q.color }}>+{q.xp} XP</span>
                        </div>
                        <p style={{ fontSize:8, opacity:0.4, marginTop:2 }}>{q.desc}</p>
                      </div>
                    </div>
                    {!q.done && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:7, opacity:0.32, textTransform:"uppercase" }}>Progress</span>
                          <span style={{ fontSize:8, fontWeight:800, color:q.color }}>{q.progress}/{q.total}</span>
                        </div>
                        <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                          <div className="quest-bar" style={{ height:"100%", width:`${(q.progress/q.total)*100}%`, background:`linear-gradient(90deg,${q.color},${q.color}aa)`, borderRadius:2 }}/>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Fight */}
            <div className="card" style={{ padding:"22px", background:"linear-gradient(135deg,rgba(239,68,68,0.05),rgba(124,58,237,0.03))", border:"1px solid rgba(239,68,68,0.13)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", fontSize:100, opacity:0.05, lineHeight:1, pointerEvents:"none" }}>💀</div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
                <Layers size={13} color="#ef4444"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Chapter Boss</h3>
                <span style={{ marginLeft:"auto", fontSize:8, background:"rgba(239,68,68,0.14)", color:"#ef4444", padding:"2px 7px", borderRadius:5, fontWeight:900 }}>NEW</span>
              </div>
              <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.78)", marginBottom:5 }}>Physics Chapter 3 Boss</p>
              <p style={{ fontSize:10, opacity:0.3, marginBottom:14 }}>10 hard questions. Defeat the boss for rare XP!</p>
              <button onClick={() => setShowPro(true)} style={{ width:"100%", padding:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10, color:"#ef4444", fontWeight:900, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Lock size={11}/> PRO Feature
              </button>
            </div>

            {/* Wisdom */}
            <div className="card" style={{ padding:"22px", background:"linear-gradient(135deg,rgba(14,165,233,0.05),transparent)", borderBottom:"3px solid #0ea5e9" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10, opacity:0.55 }}>
                <Crown size={14} color="#0ea5e9"/>
                <h3 style={{ fontSize:9, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Monarch's Wisdom</h3>
              </div>
              <Quote size={18} color="#22d3ee" style={{ opacity:0.3, marginBottom:7 }}/>
              <p style={{ fontSize:12, fontStyle:"italic", fontWeight:600, lineHeight:1.7, color:"rgba(255,255,255,0.82)", borderLeft:"2px solid #22d3ee", paddingLeft:10, marginBottom:10 }}>
                "I will grow stronger. Much, much stronger."
              </p>
              <p className="font-logo" style={{ fontSize:8, color:"#22d3ee", letterSpacing:"0.18em" }}>— SUNG JIN-WOO</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ maxWidth:1800, margin:"40px auto 0", padding:"0 20px 20px", textAlign:"center", opacity:0.15 }}>
          <p className="font-logo" style={{ fontSize:8, letterSpacing:"1.2em", color:"#22d3ee", textTransform:"uppercase" }}>RankPush · Shadow System · 2026</p>
        </div>
      </div>

      {/* ══════════════════════════════
          MOBILE BOTTOM NAV
      ══════════════════════════════ */}
      <nav className="mobile-nav" style={{ gap:0 }}>
        {[
          { icon:LayoutDashboard, label:"Home",   fn:()=>{},                                   active:true  },
          { icon:Swords,          label:"Arena",  fn:()=>router.push(`/arena/${selectedSub.toLowerCase()}`), active:false },
          { icon:Timer,           label:"Focus",  fn:()=>router.push("/timer"),                 active:false },
          { icon:Trophy,          label:"Ranks",  fn:()=>setShowRankModal(true),                active:false },
          { icon:User,            label:"Profile",fn:()=>setShowProfile(true),                  active:false },
        ].map(item => (
          <button key={item.label} onClick={item.fn}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"8px 4px", background:"none", border:"none", cursor:"pointer", color:item.active?"#22d3ee":"rgba(255,255,255,0.35)", transition:"color 0.2s" }}>
            <item.icon size={20} />
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}