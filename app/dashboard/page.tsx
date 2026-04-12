"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Zap, Trophy, Swords, Bell, Target,
  Brain, Play, Crown, Flame, LayoutDashboard,
  Atom, FlaskConical, Sigma, Dna, Quote,
  Sword, LogOut, X, CheckCircle, Lock,
  TrendingUp, Award, ChevronUp, BarChart2,
  Clock, Crosshair, Layers, Wifi, Timer,
  ChevronDown, User, BookOpen, ArrowRight, Edit3, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════
// RANK SYSTEM
// ═══════════════════════════════════════════════════════
type Plan = "free" | "pro";
type RankId = "e"|"d"|"c"|"b"|"a"|"s"|"national"|"shadow_monarch";

interface RankInfo {
  id: RankId; name: string; title: string;
  color: string; glowColor: string; bgColor: string;
  gradient: string;   // bar gradient
  icon: string;       // emoji fallback
  svgEmblem: string;  // SVG path data
  barStyle: "simple"|"dual"|"triple"|"epic"|"mythic"|"legendary"|"divine"|"shadow";
  minXP: number; maxXP: number; description: string;
}

const RANKS: RankInfo[] = [
  {
    id:"e", name:"E-Rank", title:"Weakest Hunter",
    color:"#6b7280", glowColor:"rgba(107,114,128,0.5)", bgColor:"rgba(107,114,128,0.08)",
    gradient:"linear-gradient(90deg, #4b5563, #6b7280)",
    icon:"🪨", barStyle:"simple",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="30" stroke="#6b7280" stroke-width="2" opacity="0.4"/>
      <circle cx="40" cy="40" r="20" stroke="#6b7280" stroke-width="1.5" opacity="0.6"/>
      <text x="40" y="46" text-anchor="middle" fill="#6b7280" font-size="16" font-weight="bold" font-family="monospace">E</text>
    </svg>`,
    minXP:0, maxXP:1999, description:"The starting point."
  },
  {
    id:"d", name:"D-Rank", title:"Awakened Hunter",
    color:"#b45309", glowColor:"rgba(180,83,9,0.5)", bgColor:"rgba(180,83,9,0.08)",
    gradient:"linear-gradient(90deg, #78350f, #b45309, #d97706)",
    icon:"🔰", barStyle:"dual",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,8 72,26 72,54 40,72 8,54 8,26" stroke="#b45309" stroke-width="2" fill="rgba(180,83,9,0.1)"/>
      <polygon points="40,18 62,30 62,50 40,62 18,50 18,30" stroke="#d97706" stroke-width="1" fill="none" opacity="0.6"/>
      <text x="40" y="46" text-anchor="middle" fill="#f59e0b" font-size="15" font-weight="bold" font-family="monospace">D</text>
    </svg>`,
    minXP:2000, maxXP:5999, description:"Awakening confirmed."
  },
  {
    id:"c", name:"C-Rank", title:"Gate Raider",
    color:"#0ea5e9", glowColor:"rgba(14,165,233,0.5)", bgColor:"rgba(14,165,233,0.08)",
    gradient:"linear-gradient(90deg, #0c4a6e, #0ea5e9, #38bdf8)",
    icon:"🌀", barStyle:"triple",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 6 L70 22 L70 58 L40 74 L10 58 L10 22 Z" stroke="#0ea5e9" stroke-width="2" fill="rgba(14,165,233,0.08)"/>
      <path d="M40 14 L63 27 L63 53 L40 66 L17 53 L17 27 Z" stroke="#38bdf8" stroke-width="1.5" fill="none" opacity="0.5"/>
      <circle cx="40" cy="40" r="8" fill="rgba(14,165,233,0.3)" stroke="#0ea5e9"/>
      <line x1="40" y1="14" x2="40" y2="32" stroke="#38bdf8" stroke-width="1" opacity="0.5"/>
      <line x1="40" y1="48" x2="40" y2="66" stroke="#38bdf8" stroke-width="1" opacity="0.5"/>
      <line x1="17" y1="27" x2="32" y2="35" stroke="#38bdf8" stroke-width="1" opacity="0.5"/>
      <line x1="48" y1="45" x2="63" y2="53" stroke="#38bdf8" stroke-width="1" opacity="0.5"/>
      <text x="40" y="45" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="bold" font-family="monospace">C</text>
    </svg>`,
    minXP:6000, maxXP:13999, description:"Gates tremble at your approach."
  },
  {
    id:"b", name:"B-Rank", title:"Elite Fighter",
    color:"#22d3ee", glowColor:"rgba(34,211,238,0.55)", bgColor:"rgba(34,211,238,0.08)",
    gradient:"linear-gradient(90deg, #0e7490, #22d3ee, #67e8f9)",
    icon:"⚡", barStyle:"epic",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-b"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M40 4 L76 20 L76 60 L40 76 L4 60 L4 20 Z" stroke="#22d3ee" stroke-width="2" fill="rgba(34,211,238,0.06)" filter="url(#glow-b)"/>
      <path d="M40 14 L68 28 L68 52 L40 66 L12 52 L12 28 Z" stroke="#67e8f9" stroke-width="1" fill="none" opacity="0.4"/>
      <path d="M44 20 L36 38 L44 38 L36 60" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" filter="url(#glow-b)"/>
      <circle cx="40" cy="40" r="18" stroke="#22d3ee" stroke-width="0.5" opacity="0.3" stroke-dasharray="3 4"/>
    </svg>`,
    minXP:14000, maxXP:27999, description:"Guild leaders take notice."
  },
  {
    id:"a", name:"A-Rank", title:"Dungeon Breaker",
    color:"#a855f7", glowColor:"rgba(168,85,247,0.55)", bgColor:"rgba(168,85,247,0.08)",
    gradient:"linear-gradient(90deg, #581c87, #a855f7, #c084fc)",
    icon:"💜", barStyle:"mythic",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-a"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="ga" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#c084fc"/></linearGradient>
      </defs>
      <path d="M40 4 L58 14 L76 34 L76 46 L58 66 L40 76 L22 66 L4 46 L4 34 L22 14 Z" stroke="url(#ga)" stroke-width="2" fill="rgba(168,85,247,0.07)" filter="url(#glow-a)"/>
      <path d="M40 16 L52 24 L64 36 L64 44 L52 56 L40 64 L28 56 L16 44 L16 36 L28 24 Z" stroke="#c084fc" stroke-width="1" fill="none" opacity="0.4"/>
      <path d="M40 10 L40 30 M40 50 L40 70 M10 40 L30 40 M50 40 L70 40" stroke="#a855f7" stroke-width="1.5" opacity="0.5"/>
      <circle cx="40" cy="40" r="10" fill="rgba(168,85,247,0.25)" stroke="#a855f7" stroke-width="1.5" filter="url(#glow-a)"/>
      <path d="M40 30 L44 38 L40 34 L36 38 Z" fill="#c084fc"/>
    </svg>`,
    minXP:28000, maxXP:49999, description:"Dungeons fall before you."
  },
  {
    id:"s", name:"S-Rank", title:"Sovereign Hunter",
    color:"#f59e0b", glowColor:"rgba(245,158,11,0.6)", bgColor:"rgba(245,158,11,0.08)",
    gradient:"linear-gradient(90deg, #78350f, #f59e0b, #fcd34d, #f59e0b)",
    icon:"👑", barStyle:"legendary",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-s"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
      </defs>
      <!-- Crown shape -->
      <path d="M14 54 L14 36 L26 46 L40 20 L54 46 L66 36 L66 54 Z" fill="rgba(245,158,11,0.15)" stroke="url(#gs)" stroke-width="2.5" stroke-linejoin="round" filter="url(#glow-s)"/>
      <circle cx="14" cy="36" r="4" fill="#f59e0b" filter="url(#glow-s)"/>
      <circle cx="40" cy="20" r="4" fill="#fcd34d" filter="url(#glow-s)"/>
      <circle cx="66" cy="36" r="4" fill="#f59e0b" filter="url(#glow-s)"/>
      <rect x="12" y="54" width="56" height="6" rx="2" fill="url(#gs)" filter="url(#glow-s)"/>
      <!-- S letter -->
      <text x="40" y="50" text-anchor="middle" fill="#fcd34d" font-size="18" font-weight="900" font-family="serif" filter="url(#glow-s)">S</text>
      <!-- Corner stars -->
      <path d="M40 6 L41.5 10 L46 10 L42.5 12.5 L44 17 L40 14 L36 17 L37.5 12.5 L34 10 L38.5 10 Z" fill="#fcd34d" opacity="0.7"/>
    </svg>`,
    minXP:50000, maxXP:79999, description:"The pinnacle of mankind."
  },
  {
    id:"national", name:"National Level", title:"Absolute Monarch",
    color:"#ec4899", glowColor:"rgba(236,72,153,0.6)", bgColor:"rgba(236,72,153,0.08)",
    gradient:"linear-gradient(90deg, #831843, #ec4899, #f9a8d4, #ec4899)",
    icon:"🔱", barStyle:"divine",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-n"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="gn" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f9a8d4"/><stop offset="100%" stop-color="#be185d"/></linearGradient>
        <linearGradient id="gn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ec4899"/><stop offset="100%" stop-color="#9d174d"/></linearGradient>
      </defs>
      <!-- Outer ring -->
      <circle cx="40" cy="40" r="35" stroke="url(#gn)" stroke-width="2" fill="rgba(236,72,153,0.05)" filter="url(#glow-n)"/>
      <circle cx="40" cy="40" r="28" stroke="#ec4899" stroke-width="1" fill="none" opacity="0.3" stroke-dasharray="6 3"/>
      <!-- Trident shape -->
      <line x1="40" y1="15" x2="40" y2="65" stroke="url(#gn2)" stroke-width="3" stroke-linecap="round" filter="url(#glow-n)"/>
      <path d="M32 22 C32 22 36 28 40 22 C44 28 48 22 48 22 L48 34 C48 34 44 30 40 34 C36 30 32 34 32 34 Z" fill="url(#gn)" filter="url(#glow-n)"/>
      <line x1="28" y1="52" x2="52" y2="52" stroke="#ec4899" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-n)"/>
      <!-- Sparkles -->
      <circle cx="20" cy="25" r="2" fill="#f9a8d4" opacity="0.6"/>
      <circle cx="60" cy="25" r="2" fill="#f9a8d4" opacity="0.6"/>
      <circle cx="15" cy="50" r="1.5" fill="#ec4899" opacity="0.5"/>
      <circle cx="65" cy="50" r="1.5" fill="#ec4899" opacity="0.5"/>
    </svg>`,
    minXP:80000, maxXP:119999, description:"A force capable of protecting nations."
  },
  {
    id:"shadow_monarch", name:"Shadow Monarch", title:"Arise.",
    color:"#c084fc", glowColor:"rgba(192,132,252,0.7)", bgColor:"rgba(192,132,252,0.08)",
    gradient:"linear-gradient(90deg, #1a0533, #7c3aed, #c084fc, #e879f9, #c084fc, #7c3aed)",
    icon:"⚔️", barStyle:"shadow",
    svgEmblem:`<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-sm"><feGaussianBlur stdDeviation="4.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="gsm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e879f9"/><stop offset="50%" stop-color="#c084fc"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
        <radialGradient id="gsm2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#e879f9" stop-opacity="0.3"/><stop offset="100%" stop-color="transparent"/></radialGradient>
      </defs>
      <!-- Outer glow circle -->
      <circle cx="40" cy="40" r="36" fill="url(#gsm2)" filter="url(#glow-sm)"/>
      <!-- Shadow wings -->
      <path d="M40 40 L8 20 L16 40 L8 60 Z" fill="rgba(124,58,237,0.4)" stroke="#7c3aed" stroke-width="1" filter="url(#glow-sm)"/>
      <path d="M40 40 L72 20 L64 40 L72 60 Z" fill="rgba(124,58,237,0.4)" stroke="#7c3aed" stroke-width="1" filter="url(#glow-sm)"/>
      <!-- Center cross/sword -->
      <line x1="40" y1="8" x2="40" y2="72" stroke="url(#gsm)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-sm)"/>
      <line x1="22" y1="32" x2="58" y2="32" stroke="url(#gsm)" stroke-width="2" stroke-linecap="round" filter="url(#glow-sm)"/>
      <!-- Crown points -->
      <path d="M28 14 L32 22 L36 14 L40 8 L44 14 L48 22 L52 14" stroke="#e879f9" stroke-width="1.5" fill="none" stroke-linecap="round" filter="url(#glow-sm)"/>
      <!-- Center gem -->
      <circle cx="40" cy="40" r="6" fill="rgba(192,132,252,0.4)" stroke="url(#gsm)" stroke-width="2" filter="url(#glow-sm)"/>
      <circle cx="40" cy="40" r="3" fill="#e879f9" filter="url(#glow-sm)"/>
      <!-- Orbiting dots -->
      <circle cx="40" cy="20" r="2" fill="#c084fc" filter="url(#glow-sm)"/>
      <circle cx="55" cy="30" r="1.5" fill="#e879f9" opacity="0.7" filter="url(#glow-sm)"/>
      <circle cx="55" cy="50" r="1.5" fill="#e879f9" opacity="0.7" filter="url(#glow-sm)"/>
      <circle cx="40" cy="60" r="2" fill="#c084fc" filter="url(#glow-sm)"/>
      <circle cx="25" cy="50" r="1.5" fill="#e879f9" opacity="0.7" filter="url(#glow-sm)"/>
      <circle cx="25" cy="30" r="1.5" fill="#e879f9" opacity="0.7" filter="url(#glow-sm)"/>
    </svg>`,
    minXP:120000, maxXP:Infinity, description:"The king of all shadows. None stand above you."
  },
];

const getRankByXP = (xp: number) => RANKS.find(r => xp >= r.minXP && xp <= r.maxXP) || RANKS[0];
const getNextRank = (rank: RankInfo) => { const i = RANKS.findIndex(r=>r.id===rank.id); return i<RANKS.length-1?RANKS[i+1]:null; };
const getXPPct = (xp: number, rank: RankInfo) => rank.maxXP===Infinity?100:Math.round(((xp-rank.minXP)/(rank.maxXP-rank.minXP))*100);

// ═══════════════════════════════════════════════════════
// RANK EMBLEM COMPONENT
// ═══════════════════════════════════════════════════════
function RankEmblem({ rank, size=80 }: { rank: RankInfo; size?: number }) {
  return (
    <div
      style={{ width:size, height:size, position:"relative", display:"inline-block" }}
      dangerouslySetInnerHTML={{ __html: rank.svgEmblem }}
    />
  );
}

// ═══════════════════════════════════════════════════════
// RANK XP BAR — unique per rank tier
// ═══════════════════════════════════════════════════════
function RankXPBar({ rank, pct, showLabel=true }: { rank: RankInfo; pct: number; showLabel?: boolean }) {
  const barStyle = rank.barStyle;

  // Shadow Monarch — animated rainbow
  if (barStyle === "shadow") return (
    <div style={{ position:"relative" }}>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>To Shadow Monarch</span>
          <span style={{ fontSize:8, fontWeight:900, color:"#c084fc" }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:10, background:"rgba(0,0,0,0.4)", borderRadius:6, overflow:"hidden", border:"1px solid rgba(192,132,252,0.3)", position:"relative" }}>
        {/* Animated bg */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,rgba(124,58,237,0.3),rgba(192,132,252,0.2),rgba(232,121,249,0.3))", animation:"shimmerBar 3s linear infinite" }}/>
        <div style={{ position:"relative", height:"100%", width:`${pct}%`, background:rank.gradient, backgroundSize:"200% 100%", borderRadius:5, boxShadow:`0 0 16px ${rank.glowColor}, 0 0 32px rgba(192,132,252,0.3)`, transition:"width 1.5s cubic-bezier(0.4,0,0.2,1)", animation:"shimmerBar 2s linear infinite" }}/>
        {/* Sparkle on tip */}
        <div style={{ position:"absolute", right:`${100-pct}%`, top:"50%", transform:"translateY(-50%) translateX(50%)", width:6, height:6, borderRadius:"50%", background:"#e879f9", boxShadow:"0 0 10px #e879f9", animation:"twinkle 1s ease-in-out infinite" }}/>
      </div>
      {/* 3 lines beneath */}
      <div style={{ display:"flex", gap:3, marginTop:4 }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ height:2, flex:1, borderRadius:1, background:pct>=(i+1)*33?rank.gradient:"rgba(255,255,255,0.06)", boxShadow:pct>=(i+1)*33?`0 0 6px ${rank.glowColor}`:"none", transition:"all 0.5s" }}/>
        ))}
      </div>
    </div>
  );

  // Divine (National) — dual-layer ornate
  if (barStyle === "divine") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Absolute Power</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      {/* Outer bar */}
      <div style={{ height:8, background:"rgba(0,0,0,0.4)", borderRadius:4, overflow:"hidden", border:`1px solid ${rank.color}44`, marginBottom:3 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:rank.gradient, backgroundSize:"200% 100%", borderRadius:3, boxShadow:`0 0 12px ${rank.glowColor}`, transition:"width 1.5s ease", animation:"shimmerBar 2.5s linear infinite" }}/>
      </div>
      {/* Inner thin bar */}
      <div style={{ height:3, background:"rgba(0,0,0,0.3)", borderRadius:2, overflow:"hidden", border:`1px solid ${rank.color}22` }}>
        <div style={{ height:"100%", width:`${Math.min(pct*1.2,100)}%`, background:`${rank.color}88`, borderRadius:2, transition:"width 1.5s ease 0.3s" }}/>
      </div>
      {/* Tick marks */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {[0,25,50,75,100].map(t=>(
          <div key={t} style={{ width:1, height:4, background:pct>=t?rank.color:"rgba(255,255,255,0.1)", boxShadow:pct>=t?`0 0 4px ${rank.color}`:"none", transition:"all 0.5s" }}/>
        ))}
      </div>
    </div>
  );

  // Legendary (S-Rank) — gold ornate with segments
  if (barStyle === "legendary") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Sovereign Power</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      {/* Segmented bar */}
      <div style={{ display:"flex", gap:2, marginBottom:3 }}>
        {[...Array(10)].map((_,i)=>{
          const filled = pct >= (i+1)*10;
          const partial = pct > i*10 && pct < (i+1)*10;
          return (
            <div key={i} style={{ flex:1, height:8, borderRadius:2, background:filled?rank.gradient:partial?`${rank.color}44`:"rgba(255,255,255,0.06)", border:`1px solid ${filled||partial?rank.color+"55":"rgba(255,255,255,0.06)"}`, boxShadow:filled?`0 0 8px ${rank.glowColor}`:"none", transition:"all 0.4s", backgroundSize:"200% 100%", animation:filled?"shimmerBar 2s linear infinite":"none" }}/>
          );
        })}
      </div>
      {/* Solid bar beneath */}
      <div style={{ height:3, background:"rgba(0,0,0,0.3)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${rank.color}66, ${rank.color})`, borderRadius:2, transition:"width 1.5s ease" }}/>
      </div>
    </div>
  );

  // Mythic (A-Rank) — purple with pulse
  if (barStyle === "mythic") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Dungeon Power</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:7, background:"rgba(0,0,0,0.35)", borderRadius:4, overflow:"hidden", border:`1px solid ${rank.color}33`, position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(90deg,transparent,${rank.color}22,transparent)`, animation:"shimmerBar 2s linear infinite" }}/>
        <div style={{ position:"relative", height:"100%", width:`${pct}%`, background:rank.gradient, borderRadius:3, boxShadow:`0 0 12px ${rank.glowColor}`, transition:"width 1.5s ease" }}/>
      </div>
      <div style={{ display:"flex", gap:4, marginTop:3 }}>
        {[...Array(5)].map((_,i)=>(
          <div key={i} style={{ flex:1, height:2, borderRadius:1, background:pct>=(i+1)*20?rank.color:"rgba(255,255,255,0.06)", transition:"all 0.4s", boxShadow:pct>=(i+1)*20?`0 0 4px ${rank.color}`:"none" }}/>
        ))}
      </div>
    </div>
  );

  // Epic (B-Rank) — cyan dual
  if (barStyle === "epic") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Elite Power</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:6, background:"rgba(0,0,0,0.3)", borderRadius:3, overflow:"hidden", border:`1px solid ${rank.color}33`, marginBottom:3 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:rank.gradient, borderRadius:2, boxShadow:`0 0 10px ${rank.glowColor}`, transition:"width 1.5s ease" }}/>
      </div>
      <div style={{ height:3, background:"rgba(0,0,0,0.2)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(pct+10,100)}%`, background:`${rank.color}44`, borderRadius:1, transition:"width 1.5s ease 0.2s" }}/>
      </div>
    </div>
  );

  // Triple (C-Rank) — blue triple line
  if (barStyle === "triple") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Gate Power</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      {[0,2,4].map((offset,i)=>(
        <div key={i} style={{ height:3, background:"rgba(0,0,0,0.25)", borderRadius:2, overflow:"hidden", marginBottom:2 }}>
          <div style={{ height:"100%", width:`${Math.max(0,pct-offset*8)}%`, background:rank.gradient, borderRadius:1, opacity:1-i*0.25, transition:`width ${1.5+i*0.3}s ease` }}/>
        </div>
      ))}
    </div>
  );

  // Dual (D-Rank)
  if (barStyle === "dual") return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Awakening</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:5, background:"rgba(0,0,0,0.25)", borderRadius:3, overflow:"hidden", marginBottom:2 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:rank.gradient, borderRadius:2, transition:"width 1.5s ease" }}/>
      </div>
      <div style={{ height:2, background:"rgba(0,0,0,0.2)", borderRadius:1, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`${rank.color}77`, borderRadius:1, transition:"width 1.5s ease 0.3s" }}/>
      </div>
    </div>
  );

  // Simple (E-Rank)
  return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:8, fontWeight:800, opacity:0.4, textTransform:"uppercase", letterSpacing:"0.1em" }}>Beginner</span>
          <span style={{ fontSize:8, fontWeight:900, color:rank.color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height:4, background:"rgba(0,0,0,0.25)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:rank.gradient, borderRadius:2, transition:"width 1.5s ease" }}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RANK BADGE with emblem
// ═══════════════════════════════════════════════════════
function RankBadge({ rank, size="md" }: { rank:RankInfo; size?:"sm"|"md"|"lg" }) {
  const emblemSize = {sm:24,md:32,lg:48}[size];
  const fs = {sm:9,md:11,lg:14}[size];
  const px = {sm:"6px 10px",md:"8px 14px",lg:"12px 20px"}[size];

  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:px, borderRadius:30, background:rank.bgColor, border:`1px solid ${rank.color}44`, boxShadow:`0 0 16px ${rank.glowColor}` }}>
      <div style={{ width:emblemSize, height:emblemSize, flexShrink:0 }} dangerouslySetInnerHTML={{ __html: rank.svgEmblem }}/>
      <div>
        <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:fs, fontWeight:900, letterSpacing:"0.1em", color:rank.color, lineHeight:1 }}>{rank.name}</p>
        {size==="lg" && <p style={{ fontSize:10, color:`${rank.color}99`, marginTop:2 }}>{rank.title}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// RANK PROGRESSION MODAL — with emblems + styled bars
// ═══════════════════════════════════════════════════════
function RankModal({ onClose, currentXP }: { onClose:()=>void; currentXP:number }) {
  const cur = getRankByXP(currentXP);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(16px)" }}>
      <motion.div initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} transition={{ type:"spring", bounce:0.3 }}
        style={{ background:"#060310", border:"1px solid rgba(255,255,255,0.08)", borderRadius:28, maxWidth:560, width:"100%", padding:28, maxHeight:"88vh", overflowY:"auto", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.05)", border:"none", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={16}/></button>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.25em", color:"#22d3ee", marginBottom:7 }}>SYSTEM · RANK PROGRESSION</p>
          <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:19, fontWeight:900 }}>Hunter Rank System</h2>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {RANKS.map((r) => {
            const isCur = r.id === cur.id;
            const unlocked = currentXP >= r.minXP;
            return (
              <div key={r.id} style={{ padding:"14px 16px", borderRadius:16, background:isCur?r.bgColor:"rgba(255,255,255,0.02)", border:isCur?`1px solid ${r.color}55`:"1px solid rgba(255,255,255,0.05)", opacity:unlocked?1:0.4, boxShadow:isCur?`0 0 20px ${r.glowColor}, inset 0 0 20px rgba(255,255,255,0.02)`:"none", transition:"all 0.3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  {/* Emblem */}
                  <div style={{ width:44, height:44, flexShrink:0 }} dangerouslySetInnerHTML={{ __html: r.svgEmblem }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                      <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:900, color:r.color }}>{r.name}</p>
                      <p style={{ fontSize:9, color:`${r.color}88`, fontStyle:"italic" }}>{r.title}</p>
                      {isCur && <span style={{ fontSize:8, padding:"2px 7px", borderRadius:20, background:r.bgColor, border:`1px solid ${r.color}44`, color:r.color, fontWeight:800 }}>CURRENT</span>}
                    </div>
                    {/* Styled bar */}
                    <RankXPBar rank={r} pct={isCur?getXPPct(currentXP,r):unlocked?100:0} showLabel={false}/>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:5 }}>{r.description}</p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, minWidth:80 }}>
                    <p style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.4)" }}>{r.maxXP===Infinity?`${r.minXP.toLocaleString()}+`:`${r.minXP.toLocaleString()} – ${r.maxXP.toLocaleString()}`}</p>
                    <p style={{ fontSize:8, color:"rgba(255,255,255,0.2)" }}>XP</p>
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

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
const SUBJECTS = [
  { name:"Physics",   icon:Atom,         color:"#22d3ee", rgb:"34,211,238",  locked:false, questions:48  },
  { name:"Chemistry", icon:FlaskConical, color:"#a78bfa", rgb:"167,139,250", locked:false, questions:36  },
  { name:"Math",      icon:Sigma,        color:"#34d399", rgb:"52,211,153",  locked:true,  questions:0   },
  { name:"Biology",   icon:Dna,          color:"#f87171", rgb:"248,113,113", locked:true,  questions:0   },
];

const DAILY_QUESTS = [
  { id:1, title:"Physics Mastery", desc:"Solve 20 MCQ",        xp:500, progress:12, total:20, icon:Atom,  color:"#22d3ee", done:false },
  { id:2, title:"Speed Demon",     desc:"Answer in <5s × 10",  xp:300, progress:10, total:10, icon:Clock, color:"#f59e0b", done:true  },
  { id:3, title:"Combo Master",    desc:"Get 5x combo streak",  xp:400, progress:3,  total:5,  icon:Flame, color:"#f87171", done:false },
];

const LEADERBOARD = [
  { name:"S-Rank_Slayer", score:"24,500", rank:"01", avatar:"https://i.pravatar.cc/150?u=slayer",  rankInfo:RANKS[7] },
  { name:"ZeroOne",       score:"22,100", rank:"02", avatar:"https://i.pravatar.cc/150?u=zeroone", rankInfo:RANKS[6] },
  { name:"GhostVibes",    score:"19,850", rank:"03", avatar:"https://i.pravatar.cc/150?u=ghost",   rankInfo:RANKS[5] },
  { name:"NightCrawler",  score:"17,200", rank:"04", avatar:"https://i.pravatar.cc/150?u=night",   rankInfo:RANKS[4] },
  { name:"PhantomX",      score:"15,900", rank:"05", avatar:"https://i.pravatar.cc/150?u=phantom", rankInfo:RANKS[3] },
];

const ACHIEVEMENTS = [
  { title:"First Blood", desc:"Complete first battle", icon:"🩸", unlocked:true,  xp:100  },
  { title:"Speed Freak", desc:"10 answers under 3s",   icon:"⚡", unlocked:true,  xp:200  },
  { title:"Combo God",   desc:"20x combo streak",      icon:"🔥", unlocked:false, xp:500  },
  { title:"Scholar",     desc:"100 questions solved",  icon:"📚", unlocked:false, xp:1000 },
  { title:"Gate Opener", desc:"Reach B-Rank",          icon:"🌀", unlocked:false, xp:2000 },
  { title:"Shadow Army", desc:"7-day streak",          icon:"👥", unlocked:false, xp:800  },
];

const STREAK_DAYS = ["M","T","W","T","F","S","S"];
const STREAK_DONE = [true,true,true,true,false,false,false];

const MOCK_STATS = {
  xp:15420, level:47, accuracy:88, speed:94, iq:145, logic:91, focus:78,
  streak:4, totalBattles:284, weeklyXP:2340,
  plan:"free" as Plan, joinDate:"January 2026",
  totalHoursStudied:127, questionsAttempted:1840, correctAnswers:1619,
};

// ═══════════════════════════════════════════════════════
// PRO MODAL
// ═══════════════════════════════════════════════════════
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
          {["Unlimited questions — all subjects","S-Rank & above unlocked","Rival Battle System (1v1)","Boss Fight mode","Detailed analytics","Unlimited power-ups"].map(f=>(
            <div key={f} style={{ display:"flex", alignItems:"center", gap:10 }}><CheckCircle size={15} color="#a855f7"/><span style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{f}</span></div>
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

// ═══════════════════════════════════════════════════════
// RIVAL MODAL
// ═══════════════════════════════════════════════════════
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
        </div>
        <div style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16, wordBreak:"break-all", fontSize:12, color:"rgba(255,255,255,0.6)" }}>{link}</div>
        <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
          style={{ width:"100%", padding:"14px 0", background:copied?"rgba(34,197,94,0.2)":"linear-gradient(135deg,#dc2626,#ef4444)", border:copied?"1px solid #22c55e":"none", borderRadius:12, color:"white", fontWeight:900, fontSize:14, cursor:"pointer" }}>
          {copied?"✓ Copied!":"Copy Battle Link"}
        </button>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════════════════
function ProfileModal({ onClose, user, stats }: { onClose:()=>void; user:any; stats:typeof MOCK_STATS }) {
  const rank = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct = getXPPct(stats.xp, rank);
  const [tab, setTab] = useState<"overview"|"stats"|"achievements">("overview");
  const ts = (t:string) => ({
    flex:1, padding:"9px", borderRadius:9, cursor:"pointer",
    fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900,
    letterSpacing:"0.08em", textTransform:"uppercase" as const,
    background:tab===t?"rgba(34,211,238,0.1)":"transparent",
    border:tab===t?"1px solid rgba(34,211,238,0.3)":"1px solid transparent",
    color:tab===t?"#22d3ee":"rgba(255,255,255,0.3)", transition:"all 0.2s",
  });
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.9)", backdropFilter:"blur(12px)" }}>
      <motion.div initial={{ scale:0.92, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
        style={{ background:"#06040f", border:"1px solid rgba(255,255,255,0.08)", borderRadius:28, maxWidth:520, width:"100%", overflow:"hidden", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ height:100, background:`linear-gradient(135deg,${rank.bgColor},rgba(0,0,0,0))`, borderBottom:`1px solid ${rank.color}22`, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:rank.color, opacity:0.07, filter:"blur(40px)" }}/>
          {/* Large emblem watermark */}
          <div style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", width:80, height:80, opacity:0.15 }} dangerouslySetInnerHTML={{ __html:rank.svgEmblem }}/>
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.1)", color:"white", borderRadius:8, padding:6, cursor:"pointer" }}><X size={15}/></button>
        </div>
        <div style={{ padding:"0 22px 26px", marginTop:-44 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:18 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:80, height:80, borderRadius:"50%", border:`3px solid ${rank.color}`, boxShadow:`0 0 20px ${rank.glowColor}`, overflow:"hidden" }}>
                <img src={user?.photoURL||"https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="avatar"/>
              </div>
              <div style={{ position:"absolute", bottom:0, right:-4, background:`linear-gradient(135deg,${rank.color},${rank.color}bb)`, borderRadius:7, padding:"2px 6px", fontFamily:"'Orbitron',sans-serif", fontSize:8, fontWeight:900, border:"2px solid #06040f" }}>LVL {stats.level}</div>
            </div>
            <div style={{ flex:1, paddingBottom:4 }}>
              <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, marginBottom:5 }}>{user?.displayName||"CYBER HUNTER"}</h2>
              <RankBadge rank={rank} size="sm"/>
            </div>
          </div>
          {/* XP section with styled bar */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div><span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:17, fontWeight:900, color:rank.color }}>{stats.xp.toLocaleString()}</span><span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginLeft:5 }}>XP</span></div>
              {nextRank && <div style={{ textAlign:"right" }}><p style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>NEXT RANK</p><p style={{ fontSize:10, fontWeight:800, color:nextRank.color, fontFamily:"'Orbitron',sans-serif" }}>{nextRank.name}</p></div>}
            </div>
            <RankXPBar rank={rank} pct={xpPct}/>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", borderRadius:11, padding:4, marginBottom:16 }}>
            {(["overview","stats","achievements"] as const).map(t=><button key={t} style={ts(t)} onClick={()=>setTab(t)}>{t}</button>)}
          </div>
          {tab==="overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
              {[{l:"Battles",v:stats.totalBattles,icon:Swords,c:"#22d3ee"},{l:"Streak",v:`${stats.streak} days 🔥`,icon:Flame,c:"#f97316"},{l:"Hours",v:`${stats.totalHoursStudied}h`,icon:Clock,c:"#a855f7"},{l:"Questions",v:stats.questionsAttempted,icon:Target,c:"#34d399"}].map(s=>(
                <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11, padding:"11px 13px", display:"flex", alignItems:"center", gap:9 }}>
                  <s.icon size={15} color={s.c} style={{ flexShrink:0 }}/>
                  <div><p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", textTransform:"uppercase" }}>{s.l}</p><p style={{ fontSize:13, fontWeight:800, marginTop:1 }}>{typeof s.v==="number"?s.v.toLocaleString():s.v}</p></div>
                </div>
              ))}
              {/* Rank journey with emblems */}
              <div style={{ gridColumn:"1/-1", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:13, padding:"14px" }}>
                <p style={{ fontSize:8, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:12 }}>Rank Journey</p>
                <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                  {RANKS.map((r,i)=>{
                    const unlocked = stats.xp >= r.minXP;
                    const isCur = r.id === rank.id;
                    return (
                      <React.Fragment key={r.id}>
                        <div title={r.name} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                          <div style={{ width:isCur?36:26, height:isCur?36:26, opacity:unlocked?1:0.3, filter:isCur?`drop-shadow(0 0 8px ${r.color})`:"none", transition:"all 0.3s" }} dangerouslySetInnerHTML={{ __html:r.svgEmblem }}/>
                          {isCur && <div style={{ width:4, height:4, borderRadius:"50%", background:r.color, boxShadow:`0 0 6px ${r.color}` }}/>}
                        </div>
                        {i<RANKS.length-1 && <div style={{ height:1, flex:1, background:stats.xp>=RANKS[i+1].minXP?`linear-gradient(90deg,${r.color}55,${RANKS[i+1].color}55)`:"rgba(255,255,255,0.06)", minWidth:3 }}/>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab==="stats" && (
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                {[{l:"Questions",v:stats.questionsAttempted.toLocaleString(),c:"#22d3ee"},{l:"Correct",v:stats.correctAnswers.toLocaleString(),c:"#34d399"},{l:"Accuracy",v:`${stats.accuracy}%`,c:"#f59e0b"},{l:"Total XP",v:stats.xp.toLocaleString(),c:"#a855f7"}].map(s=>(
                  <div key={s.l} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11, padding:"13px", textAlign:"center" }}>
                    <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:19, fontWeight:900, color:s.c }}>{s.v}</p>
                    <p style={{ fontSize:8, color:"rgba(255,255,255,0.3)", marginTop:3, textTransform:"uppercase" }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==="achievements" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {ACHIEVEMENTS.map(a=>(
                <div key={a.title} style={{ borderRadius:13, padding:"12px 10px", textAlign:"center", background:a.unlocked?"rgba(34,211,238,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${a.unlocked?"rgba(34,211,238,0.18)":"rgba(255,255,255,0.05)"}`, opacity:a.unlocked?1:0.38 }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{a.icon}</div>
                  <p style={{ fontSize:9, fontWeight:800, color:a.unlocked?"#22d3ee":"white", marginBottom:1 }}>{a.title}</p>
                  <p style={{ fontSize:7, opacity:0.35, marginBottom:4 }}>{a.desc}</p>
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

// ═══════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════
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
  @keyframes shimmerBar{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes streakPop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
  @keyframes badgeBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  @keyframes questFill{from{width:0%}}
  @keyframes statFill{from{width:0%}}
  @keyframes shadowFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-8px) rotate(1deg)}}
  @keyframes twinkle{0%,100%{opacity:1;transform:translateY(-50%) translateX(50%) scale(1)}50%{opacity:0.4;transform:translateY(-50%) translateX(50%) scale(0.6)}}
  @keyframes emblemPulse{0%,100%{filter:drop-shadow(0 0 6px currentColor)}50%{filter:drop-shadow(0 0 14px currentColor)}}

  .xp-bar{animation:xpFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards}
  .glow-pulse{animation:glowPulse 2s ease-in-out infinite}
  .float{animation:floatY 3s ease-in-out infinite}
  .badge-bounce{animation:badgeBounce 1s ease infinite}
  .quest-bar{animation:questFill 1s ease forwards}
  .stat-bar{animation:statFill 1.5s cubic-bezier(0.4,0,0.2,1) forwards}
  .streak-pip{animation:streakPop 0.4s ease forwards}
  .shadow-float{animation:shadowFloat 4s ease-in-out infinite}
  .emblem-pulse{animation:emblemPulse 2s ease-in-out infinite}

  .shimmer-text{background:linear-gradient(90deg,#a855f7,#ec4899,#f59e0b,#a855f7);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmerBar 3s linear infinite}

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
  @media(max-width:1280px){
    .mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(2,1,10,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.07);padding:8px 0 env(safe-area-inset-bottom,8px)}
    .hide-mobile{display:none!important}
  }
`;

// ═══════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════
export default function RankPushDashboard() {
  const router = useRouter();
  const [selectedSub,   setSelectedSub]   = useState("Physics");
  const [user,          setUser]          = useState<any>(null);
  const [showPro,       setShowPro]       = useState(false);
  const [showRival,     setShowRival]     = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showNotif,     setShowNotif]     = useState(false);
  const [mobileMenu,    setMobileMenu]    = useState(false);
  const [animXP,        setAnimXP]       = useState(0);

  const stats    = MOCK_STATS;
  const rank     = getRankByXP(stats.xp);
  const nextRank = getNextRank(rank);
  const xpPct    = getXPPct(stats.xp, rank);

  useEffect(() => { const unsub = onAuthStateChanged(auth,u=>setUser(u)); return ()=>unsub(); }, []);
  useEffect(() => {
    let cur=0; const end=stats.xp; const step=end/(1200/16);
    const t=setInterval(()=>{ cur=Math.min(cur+step,end); setAnimXP(Math.round(cur)); if(cur>=end) clearInterval(t); },16);
    return ()=>clearInterval(t);
  },[]);
  useEffect(() => {
    const close=()=>{ setMobileMenu(false); setShowNotif(false); };
    window.addEventListener("click",close);
    return ()=>window.removeEventListener("click",close);
  },[]);

  const handleSignOut = async () => { await signOut(auth); router.push("/"); };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Orbitron:wght@700;800;900&family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{CSS}</style>

      {showPro       && <ProModal     onClose={()=>setShowPro(false)}/>}
      {showRival     && <RivalModal   onClose={()=>setShowRival(false)}/>}
      {showRankModal && <RankModal    onClose={()=>setShowRankModal(false)} currentXP={stats.xp}/>}
      {showProfile   && <ProfileModal onClose={()=>setShowProfile(false)} user={user} stats={stats}/>}

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:700, height:700, background:"#0ea5e9", opacity:0.05, filter:"blur(140px)", borderRadius:"50%" }}/>
        <div style={{ position:"absolute", bottom:"-15%", right:"-10%", width:700, height:700, background:rank.color, opacity:0.04, filter:"blur(140px)", borderRadius:"50%" }}/>
      </div>

      <div style={{ minHeight:"100vh", padding:"0 0 80px", position:"relative", zIndex:10 }}>

        {/* HEADER */}
        <header style={{ position:"sticky", top:0, zIndex:40, background:"rgba(2,1,10,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 20px" }}>
          <div style={{ maxWidth:1800, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                <div style={{ padding:9, background:"#0ea5e9", borderRadius:12, boxShadow:"0 0 16px rgba(14,165,233,0.5)", border:"1px solid rgba(255,255,255,0.2)" }}>
                  <Swords size={17} color="white"/>
                </div>
                <span className="font-logo" style={{ fontSize:20, letterSpacing:"-0.02em" }}>RANKPUSH</span>
              </div>
              <nav style={{ display:"flex", gap:22 }} className="hidden xl:flex">
                <a className="nav-link active">Dashboard</a>
                <a className="nav-link" onClick={()=>router.push(`/arena/${selectedSub.toLowerCase()}`)}>Battle Arena</a>
                <a className="nav-link" onClick={()=>router.push("/timer")}>Shadow Focus</a>
                <a className="nav-link">Leaderboard</a>
              </nav>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:100, padding:"6px 14px" }} className="hidden md:flex">
                <TrendingUp size={13} color="#22c55e"/>
                <span style={{ fontSize:10, fontWeight:800, color:"#22c55e", letterSpacing:"0.1em" }}>+{stats.weeklyXP.toLocaleString()} THIS WEEK</span>
              </div>
              <div style={{ position:"relative" }}>
                <button onClick={e=>{e.stopPropagation();setShowNotif(v=>!v);}} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:11, padding:9, cursor:"pointer", color:"white", display:"flex" }}>
                  <Bell size={17}/>
                </button>
                <div className="badge-bounce" style={{ position:"absolute", top:-3, right:-3, width:15, height:15, background:"#ef4444", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:900, border:"2px solid #02010a" }}>3</div>
                <AnimatePresence>
                  {showNotif && (
                    <motion.div initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.95}}
                      onClick={e=>e.stopPropagation()}
                      style={{ position:"absolute", top:46, right:0, width:260, background:"#0d1420", border:"1px solid rgba(255,255,255,0.09)", borderRadius:18, padding:16, zIndex:60, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
                      {[{msg:`You're ${rank.name} — ${rank.title} ${rank.icon}`,time:"2m ago",color:"#22d3ee"},{msg:"Daily quest reset!",time:"1h ago",color:"#f59e0b"},{msg:"ZeroOne challenged you ⚔️",time:"3h ago",color:"#ef4444"}].map((n,i)=>(
                        <div key={i} style={{ padding:"10px 0", borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
                          <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginBottom:3 }}>{n.msg}</p>
                          <p style={{ fontSize:10, color:n.color }}>{n.time}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {stats.plan==="free" ? (
                <button onClick={()=>setShowPro(true)} style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", borderRadius:11, padding:"9px 16px", cursor:"pointer", color:"white", fontWeight:900, fontSize:11, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                  <Crown size={13}/> GO PRO
                </button>
              ) : (
                <div style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)", borderRadius:11, padding:"9px 16px", fontSize:11, fontWeight:900, letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:5 }}>
                  <Crown size={13}/> PRO
                </div>
              )}
              <button onClick={handleSignOut} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:11, padding:9, cursor:"pointer", color:"#ef4444", display:"flex" }}>
                <LogOut size={17}/>
              </button>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div style={{ maxWidth:1800, margin:"0 auto", padding:"22px 20px 0", display:"grid", gridTemplateColumns:"300px 1fr 280px", gap:20, alignItems:"start" }}>

          {/* LEFT */}
          <div className="hide-mobile" style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Player Card */}
            <div className="card" style={{ padding:"26px 22px", textAlign:"center", borderTop:`3px solid ${rank.color}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-25%", left:"50%", transform:"translateX(-50%)", width:200, height:200, borderRadius:"50%", background:rank.color, opacity:0.06, filter:"blur(50px)", pointerEvents:"none" }}/>

              {/* Avatar */}
              <div style={{ position:"relative", width:84, height:84, margin:"0 auto 14px", borderRadius:"50%", border:`2px solid ${rank.color}`, boxShadow:`0 0 22px ${rank.glowColor}`, cursor:"pointer" }} onClick={()=>setShowProfile(true)}>
                <img src={user?.photoURL||"https://i.pinimg.com/736x/8e/31/31/8e3131065715975e53381e4b85c2c77d.jpg"} style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} alt="Profile"/>
                <div style={{ position:"absolute", bottom:-3, right:-3, background:`linear-gradient(135deg,${rank.color},${rank.color}bb)`, borderRadius:8, padding:"2px 6px", fontFamily:"'Orbitron',sans-serif", fontSize:7, fontWeight:900, border:"2px solid #02010a" }}>LVL {stats.level}</div>
              </div>

              <h2 className="font-logo" style={{ fontSize:15, letterSpacing:"0.04em", marginBottom:10 }}>{user?.displayName||"CYBER HUNTER"}</h2>

              {/* Rank Badge with emblem — clickable */}
              <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                <button onClick={()=>setShowRankModal(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <RankBadge rank={rank} size="md"/>
                </button>
              </div>

              {/* XP */}
              <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:100, padding:"6px 16px", display:"inline-flex", alignItems:"center", gap:6, marginBottom:14 }}>
                <span style={{ fontWeight:900, fontSize:15 }}>{animXP.toLocaleString()}</span>
                <span style={{ color:"#22d3ee", fontWeight:900, fontSize:9 }}>EXP</span>
              </div>

              {/* RANK-STYLED XP BAR */}
              <div style={{ marginBottom:12 }}>
                <RankXPBar rank={rank} pct={xpPct}/>
                {nextRank && <p style={{ fontSize:8, textAlign:"right", marginTop:4, opacity:0.25 }}>{(nextRank.minXP-stats.xp).toLocaleString()} XP to {nextRank.name}</p>}
              </div>

              {/* Quick stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                {[{l:"Battles",v:stats.totalBattles},{l:"Streak",v:`${stats.streak}🔥`},{l:"Accuracy",v:`${stats.accuracy}%`}].map(s=>(
                  <div key={s.l}><p style={{ fontSize:13, fontWeight:900 }}>{typeof s.v==="number"?s.v.toLocaleString():s.v}</p><p style={{ fontSize:7, opacity:0.3, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{s.l}</p></div>
                ))}
              </div>

              <button onClick={()=>setShowProfile(true)} style={{ width:"100%", marginTop:12, padding:"7px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, color:"rgba(255,255,255,0.32)", fontSize:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                <User size={10}/> View Full Profile
              </button>
            </div>

            {/* Neural Attributes */}
            <div className="card" style={{ padding:"20px" }}>
              <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", opacity:0.45, textTransform:"uppercase", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
                <Brain size={12} color="#22d3ee"/> Neural Attributes
              </h3>
              <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                {[{l:"Accuracy",v:stats.accuracy,d:`${stats.accuracy}%`,c:"#22d3ee"},{l:"Speed",v:stats.speed,d:`${stats.speed}%`,c:"#0ea5e9"},{l:"IQ",v:75,d:`${stats.iq}`,c:"rgba(255,255,255,0.7)"},{l:"Logic",v:stats.logic,d:`${stats.logic}%`,c:"#34d399"},{l:"Focus",v:stats.focus,d:`${stats.focus}%`,c:"#a855f7"}].map(s=>(
                  <div key={s.l}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", opacity:0.55 }}>{s.l}</span>
                      <span style={{ fontSize:8, fontWeight:900, color:s.c }}>{s.d}</span>
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
                      <div className="stat-bar" style={{ height:"100%", width:`${s.v}%`, background:s.c, borderRadius:2, boxShadow:`0 0 6px ${s.c}88` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Streak */}
            <div className="card" style={{ padding:"20px", borderLeft:"3px solid #f59e0b", background:"rgba(245,158,11,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                <Flame size={14} color="#f59e0b"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Daily Streak</h3>
                <span style={{ marginLeft:"auto", fontSize:16, fontWeight:900, color:"#f59e0b" }}>{stats.streak} 🔥</span>
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {STREAK_DAYS.map((d,i)=>{
                  const done = STREAK_DONE[i];
                  return (
                    <div key={i} className="streak-pip" style={{ animationDelay:`${i*70}ms`, flex:1, textAlign:"center" }}>
                      <div style={{ height:28, borderRadius:7, background:done?"#f59e0b":"rgba(255,255,255,0.04)", border:done?"none":"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:3, boxShadow:done?"0 0 10px rgba(245,158,11,0.4)":"none" }}>
                        {done && <span style={{ fontSize:9 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:7, fontWeight:700, opacity:0.38, textTransform:"uppercase" }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements */}
            <div className="card" style={{ padding:"20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:13 }}>
                <Award size={12} color="#f59e0b"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Achievements</h3>
                <span style={{ marginLeft:"auto", fontSize:8, color:"#22d3ee", fontWeight:800 }}>2/6</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {ACHIEVEMENTS.slice(0,4).map(a=>(
                  <div key={a.title} style={{ borderRadius:11, padding:"10px 8px", textAlign:"center", background:a.unlocked?"rgba(34,211,238,0.05)":"rgba(255,255,255,0.02)", border:`1px solid ${a.unlocked?"rgba(34,211,238,0.18)":"rgba(255,255,255,0.05)"}`, opacity:a.unlocked?1:0.38 }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{a.icon}</div>
                    <p style={{ fontSize:8, fontWeight:800, color:a.unlocked?"#22d3ee":"white", marginBottom:1 }}>{a.title}</p>
                    <p style={{ fontSize:7, opacity:0.32 }}>{a.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote */}
            <div className="card" style={{ padding:"20px", borderLeft:"3px solid #34d399", background:"rgba(52,211,153,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9, opacity:0.7 }}>
                <Quote size={12} color="#34d399"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Daily Directive</h3>
              </div>
              <p className="font-bn" style={{ fontSize:12, fontStyle:"italic", fontWeight:600, lineHeight:1.65, color:"rgba(255,255,255,0.78)", marginBottom:7 }}>
                "Seek knowledge from the cradle to the grave."
              </p>
              <p style={{ fontSize:7, fontWeight:900, color:"#34d399", letterSpacing:"0.14em", textTransform:"uppercase" }}>— PROPHET MUHAMMAD (PBUH)</p>
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Hero */}
            <div className="card" style={{ padding:"32px 36px", background:"linear-gradient(135deg,rgba(14,165,233,0.08),rgba(124,58,237,0.04))", borderTop:"3px solid #0ea5e9", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-20, top:"50%", transform:"translateY(-50%)", opacity:0.04 }}><LayoutDashboard size={200}/></div>
              <div className="shadow-float" style={{ position:"absolute", right:20, bottom:0, fontSize:100, opacity:0.04, pointerEvents:"none", lineHeight:1 }}>⚔️</div>
              <div style={{ position:"relative", zIndex:1 }}>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:"0.3em", color:"#22d3ee", textTransform:"uppercase", marginBottom:9, opacity:0.8 }}>⚔️ System Status: {rank.title}</p>
                <h1 className="font-logo" style={{ fontSize:46, fontStyle:"italic", lineHeight:0.95, textTransform:"uppercase", marginBottom:16 }}>
                  DOMINATE<br/><span style={{ color:"#22d3ee", textShadow:"0 0 30px rgba(34,211,238,0.4)" }}>THE META</span>
                </h1>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {[{label:"Total Battles",value:stats.totalBattles,icon:Swords,color:"#22d3ee"},{label:"Accuracy",value:`${stats.accuracy}%`,icon:Crosshair,color:"#34d399"},{label:"Best Streak",value:`${stats.streak} days`,icon:Flame,color:"#f59e0b"},{label:"Questions",value:stats.questionsAttempted,icon:BookOpen,color:"#a855f7"}].map(s=>(
                    <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:11, padding:"9px 13px" }}>
                      <s.icon size={14} color={s.color}/>
                      <div><p style={{ fontSize:14, fontWeight:900, color:s.color }}>{typeof s.value==="number"?s.value.toLocaleString():s.value}</p><p style={{ fontSize:7, opacity:0.35, textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow Focus */}
            <div className="card" style={{ padding:"20px 24px", borderLeft:"4px solid #a855f7", background:"linear-gradient(90deg,rgba(168,85,247,0.08),transparent)", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ padding:11, background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:13 }}><Timer size={22} color="#a855f7"/></div>
              <div style={{ flex:1, minWidth:160 }}>
                <h3 className="font-logo" style={{ fontSize:14, color:"#a855f7", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>Shadow Focus</h3>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.38)", lineHeight:1.5 }}>Pomodoro or Free Timer — earn bonus XP and climb the study leaderboard.</p>
              </div>
              <button onClick={()=>router.push("/timer")} style={{ padding:"10px 20px", borderRadius:11, fontWeight:900, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", background:"linear-gradient(135deg,#7c3aed,#a855f7)", border:"none", color:"white", cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 0 18px rgba(168,85,247,0.3)", whiteSpace:"nowrap" }}>
                <Play size={12} fill="white"/> Enter Focus
              </button>
            </div>

            {/* Arena */}
            <div className="card" style={{ padding:"24px 26px", borderTop:"3px solid #0ea5e9" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <h2 className="font-logo" style={{ fontSize:19, textTransform:"uppercase", marginBottom:2 }}>Tactical <span style={{ color:"#0ea5e9" }}>Arena</span></h2>
                  <p style={{ fontSize:8, fontWeight:700, opacity:0.3, textTransform:"uppercase", letterSpacing:"0.2em" }}>Select your mastery field</p>
                </div>
                <div className="float" style={{ width:42, height:42, background:"rgba(14,165,233,0.1)", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(14,165,233,0.2)" }}>
                  <Swords size={19} color="#22d3ee"/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9, marginBottom:18 }}>
                {SUBJECTS.map(sub=>{
                  const isActive = selectedSub===sub.name;
                  return (
                    <button key={sub.name} type="button" className={`sub-btn ${isActive?"sub-active":""} ${sub.locked?"sub-locked":""}`}
                      style={{ "--sc":sub.color,"--sr":sub.rgb } as any}
                      onClick={()=>{ if(!sub.locked) setSelectedSub(sub.name); else setShowPro(true); }}>
                      {sub.locked && <div style={{ position:"absolute", top:7, right:7 }}><Lock size={9} color="rgba(255,255,255,0.3)"/></div>}
                      <sub.icon size={22} color={isActive?sub.color:"rgba(255,255,255,0.4)"} style={{ filter:isActive?`drop-shadow(0 0 8px ${sub.color})`:"none", transition:"all 0.3s" }}/>
                      <span style={{ fontSize:8, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:isActive?"white":"rgba(255,255,255,0.4)" }}>{sub.name}</span>
                      {!sub.locked?<span style={{ fontSize:7, color:isActive?sub.color:"rgba(255,255,255,0.2)", fontWeight:700 }}>{sub.questions} QS</span>:<span style={{ fontSize:7, color:"#a855f7", fontWeight:700 }}>PRO</span>}
                    </button>
                  );
                })}
              </div>
              <button className="arena-btn glow-pulse" onClick={()=>router.push(`/arena/${selectedSub.toLowerCase()}`)}>
                ENTER ARENA <Play size={16} fill="white"/>
              </button>
            </div>

            {/* Rival */}
            <div className="card" style={{ padding:"20px 24px", background:"linear-gradient(90deg,rgba(239,68,68,0.05),transparent)", borderLeft:"3px solid #ef4444", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ width:42, height:42, background:"rgba(239,68,68,0.1)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(239,68,68,0.2)", flexShrink:0 }}><Sword size={19} color="#ef4444"/></div>
              <div style={{ flex:1, minWidth:140 }}>
                <h3 className="font-logo" style={{ fontSize:13, color:"#ef4444", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>Rival Battle</h3>
                <p style={{ fontSize:10, opacity:0.38 }}>Challenge a friend to real-time 1v1 MCQ battle</p>
              </div>
              <button onClick={()=>stats.plan==="pro"?setShowRival(true):setShowPro(true)}
                style={{ padding:"9px 18px", background:"linear-gradient(135deg,#dc2626,#ef4444)", border:"none", borderRadius:11, color:"white", fontWeight:900, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
                {stats.plan==="pro"?<><Wifi size={12}/> Find Rival</>:<><Lock size={12}/> PRO Only</>}
              </button>
            </div>

            {/* Performance */}
            <div className="card" style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16 }}>
                <BarChart2 size={13} color="#22d3ee"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.55 }}>Performance This Week</h3>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9 }}>
                {[{label:"Battles",value:18,color:"#22d3ee",icon:Swords},{label:"Correct",value:142,color:"#34d399",icon:CheckCircle},{label:"XP Earned",value:2340,color:"#f59e0b",icon:Zap},{label:"Rank ▲",value:"3 ↑",color:"#a855f7",icon:ChevronUp}].map(s=>(
                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"13px 9px", textAlign:"center" }}>
                    <s.icon size={14} color={s.color} style={{ margin:"0 auto 7px" }}/>
                    <p style={{ fontSize:18, fontWeight:900, color:s.color, marginBottom:2 }}>{typeof s.value==="number"?s.value.toLocaleString():s.value}</p>
                    <p style={{ fontSize:7, opacity:0.3, textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hide-mobile" style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Leaderboard */}
            <div className="card" style={{ padding:"20px", borderLeft:"3px solid rgba(14,165,233,0.5)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.55, display:"flex", alignItems:"center", gap:6 }}>
                  <Trophy size={11} color="#f59e0b"/> Global Elite
                </h3>
                <span style={{ fontSize:7, fontWeight:900, color:"#22d3ee", border:"1px solid rgba(34,211,238,0.3)", padding:"2px 8px", borderRadius:100 }}>LIVE</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {LEADERBOARD.map((p,i)=>(
                  <div key={p.name} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 9px", borderRadius:11, background:i===0?"rgba(34,211,238,0.05)":"transparent", border:i===0?"1px solid rgba(34,211,238,0.1)":"1px solid transparent", cursor:"pointer" }}>
                    {/* Mini emblem */}
                    <div style={{ width:18, height:18, flexShrink:0 }} dangerouslySetInnerHTML={{ __html:p.rankInfo.svgEmblem }}/>
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <img src={p.avatar} style={{ width:30, height:30, borderRadius:"50%", objectFit:"cover", border:`2px solid ${p.rankInfo.color}` }} alt={p.name}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:9, fontWeight:800, textTransform:"uppercase", fontStyle:"italic", color:i===0?"#22d3ee":"rgba(255,255,255,0.75)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                      <div style={{ height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, marginTop:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${100-i*12}%`, background:p.rankInfo.color, borderRadius:1 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ fontSize:9, fontWeight:900, color:"#22d3ee" }}>{p.score}</p>
                      <p style={{ fontSize:7, opacity:0.3, textTransform:"uppercase" }}>EXP</p>
                    </div>
                  </div>
                ))}
              </div>
              <button style={{ width:"100%", marginTop:10, padding:"8px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, color:"rgba(255,255,255,0.32)", fontSize:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                View Full <ArrowRight size={10}/>
              </button>
            </div>

            {/* Daily Quests */}
            <div className="card" style={{ padding:"20px", borderLeft:"3px solid #f97316", background:"rgba(249,115,22,0.03)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14, opacity:0.8 }}>
                <Flame size={13} color="#f97316"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Daily Quests</h3>
                <span style={{ marginLeft:"auto", fontSize:8, color:"#f97316", fontWeight:800 }}>1/3 Done</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {DAILY_QUESTS.map(q=>(
                  <div key={q.id} style={{ background:q.done?"rgba(34,197,94,0.05)":"rgba(255,255,255,0.025)", border:`1px solid ${q.done?"rgba(34,197,94,0.18)":"rgba(255,255,255,0.05)"}`, borderRadius:12, padding:"11px 13px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:q.done?0:7 }}>
                      <q.icon size={12} color={q.done?"#22c55e":q.color} style={{ flexShrink:0, marginTop:1 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <p style={{ fontSize:9, fontWeight:800, color:q.done?"#22c55e":"rgba(255,255,255,0.82)", textDecoration:q.done?"line-through":"none" }}>{q.title}</p>
                          <span style={{ fontSize:8, fontWeight:900, color:q.color }}>+{q.xp} XP</span>
                        </div>
                        <p style={{ fontSize:7, opacity:0.38, marginTop:1 }}>{q.desc}</p>
                      </div>
                    </div>
                    {!q.done && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                          <span style={{ fontSize:7, opacity:0.3, textTransform:"uppercase" }}>Progress</span>
                          <span style={{ fontSize:7, fontWeight:800, color:q.color }}>{q.progress}/{q.total}</span>
                        </div>
                        <div style={{ height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, overflow:"hidden" }}>
                          <div className="quest-bar" style={{ height:"100%", width:`${(q.progress/q.total)*100}%`, background:`linear-gradient(90deg,${q.color},${q.color}aa)`, borderRadius:1 }}/>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boss Fight */}
            <div className="card" style={{ padding:"20px", background:"linear-gradient(135deg,rgba(239,68,68,0.05),rgba(124,58,237,0.03))", border:"1px solid rgba(239,68,68,0.12)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", fontSize:95, opacity:0.05, lineHeight:1, pointerEvents:"none" }}>💀</div>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
                <Layers size={12} color="#ef4444"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase", opacity:0.7 }}>Chapter Boss</h3>
                <span style={{ marginLeft:"auto", fontSize:7, background:"rgba(239,68,68,0.14)", color:"#ef4444", padding:"2px 6px", borderRadius:4, fontWeight:900 }}>NEW</span>
              </div>
              <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>Physics Chapter 3 Boss</p>
              <p style={{ fontSize:9, opacity:0.28, marginBottom:12 }}>10 hard questions. Rare XP reward!</p>
              <button onClick={()=>setShowPro(true)} style={{ width:"100%", padding:"9px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:9, color:"#ef4444", fontWeight:900, fontSize:9, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                <Lock size={10}/> PRO Feature
              </button>
            </div>

            {/* Wisdom */}
            <div className="card" style={{ padding:"20px", background:"linear-gradient(135deg,rgba(14,165,233,0.05),transparent)", borderBottom:"3px solid #0ea5e9" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9, opacity:0.5 }}>
                <Crown size={12} color="#0ea5e9"/>
                <h3 style={{ fontSize:8, fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>Monarch's Wisdom</h3>
              </div>
              <p style={{ fontSize:11, fontStyle:"italic", fontWeight:600, lineHeight:1.7, color:"rgba(255,255,255,0.8)", borderLeft:"2px solid #22d3ee", paddingLeft:9, marginBottom:8 }}>
                "I will grow stronger. Much, much stronger."
              </p>
              <p className="font-logo" style={{ fontSize:7, color:"#22d3ee", letterSpacing:"0.16em" }}>— SUNG JIN-WOO</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1800, margin:"32px auto 0", padding:"0 20px 16px", textAlign:"center", opacity:0.14 }}>
          <p className="font-logo" style={{ fontSize:7, letterSpacing:"1.2em", color:"#22d3ee", textTransform:"uppercase" }}>RankPush · Shadow System · 2026</p>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav" style={{ gap:0 }}>
        {[{icon:LayoutDashboard,label:"Home",fn:()=>{}},{icon:Swords,label:"Arena",fn:()=>router.push(`/arena/${selectedSub.toLowerCase()}`)},{icon:Timer,label:"Focus",fn:()=>router.push("/timer")},{icon:Trophy,label:"Ranks",fn:()=>setShowRankModal(true)},{icon:User,label:"Profile",fn:()=>setShowProfile(true)}].map(item=>(
          <button key={item.label} onClick={item.fn} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, padding:"8px 4px", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", transition:"color 0.2s" }}>
            <item.icon size={19}/>
            <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}