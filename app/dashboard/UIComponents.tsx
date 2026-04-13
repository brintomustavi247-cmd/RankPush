// components/dashboard/UIComponents.tsx
// Reusable, shared UI primitives used across multiple dashboard components.

"use client";

import React from "react";
import { RankInfo } from "./RankSystem";

// ============================================================
// RANK BADGE SVG ICONS — Gorgeous LoL-style emblems
// Each rank has a unique SVG badge design with gradients & gems
// ============================================================
export function RankBadgeSVG({ rankId, size = 24 }: { rankId: string; size?: number }) {
  const uid = `rb-${rankId}`;

  const badges: Record<string, React.ReactElement> = {

    // ── E-Rank: Bronze Shield ──────────────────────────────────
    e: (
      <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b5651d"/>
            <stop offset="100%" stopColor="#5c2d0a"/>
          </linearGradient>
          <linearGradient id={`${uid}-gem`} x1="14" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0a862"/>
            <stop offset="50%" stopColor="#cd7f32"/>
            <stop offset="100%" stopColor="#7b3f00"/>
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8913a" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#7b3f00" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Shield body */}
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-bg)`} stroke="#7b3f00" strokeWidth="1.5"/>
        {/* Shine overlay */}
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-shine)`}/>
        {/* Horizontal band */}
        <line x1="4" y1="16" x2="36" y2="16" stroke="rgba(255,180,80,0.25)" strokeWidth="0.8"/>
        {/* Center diamond gem */}
        <polygon points="20,12 27,20 20,29 13,20"
          fill={`url(#${uid}-gem)`} stroke="#e8913a" strokeWidth="1"/>
        <polygon points="20,15 24,20 20,26 16,20" fill="rgba(255,200,120,0.5)"/>
        {/* Top marker */}
        <circle cx="20" cy="7" r="2" fill="#b5651d" stroke="#e8913a" strokeWidth="0.8"/>
        <circle cx="20" cy="7" r="1" fill="#f0a862"/>
      </svg>
    ),

    // ── D-Rank: Silver Shield ─────────────────────────────────
    d: (
      <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4d8e0"/>
            <stop offset="100%" stopColor="#6b7280"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="40%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="45%" stopColor="#c8cdd6"/>
            <stop offset="100%" stopColor="#8a9299"/>
          </radialGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#6b7280" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Shield body */}
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-bg)`} stroke="#9ca3af" strokeWidth="1.5"/>
        {/* Shine */}
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-shine)`}/>
        {/* Inner frame */}
        <path d="M20 5 L33 10 L33 25 Q33 35 20 40 Q7 35 7 25 L7 10 Z"
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
        {/* Six-point star gem */}
        <polygon points="20,12 22,17 27,16 23,20 27,24 22,23 20,28 18,23 13,24 17,20 13,16 18,17"
          fill={`url(#${uid}-gem)`} stroke="#d4d8e0" strokeWidth="0.7"/>
        {/* Center highlight */}
        <circle cx="20" cy="20" r="2.5" fill="rgba(255,255,255,0.6)"/>
        {/* Top badge */}
        <circle cx="20" cy="7" r="2.5" fill="#9ca3af" stroke="#d4d8e0" strokeWidth="0.8"/>
        <circle cx="20" cy="7" r="1.2" fill="#ffffff"/>
      </svg>
    ),

    // ── C-Rank: Gold Shield ───────────────────────────────────
    c: (
      <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="20" y1="0" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4a017"/>
            <stop offset="50%" stopColor="#b8860b"/>
            <stop offset="100%" stopColor="#7a5800"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#fff9e0"/>
            <stop offset="40%" stopColor="#ffd700"/>
            <stop offset="100%" stopColor="#a07800"/>
          </radialGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffec7a" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#7a5800" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Shield body */}
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-bg)`} stroke="#a07800" strokeWidth="1.5"/>
        <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
          fill={`url(#${uid}-shine)`}/>
        {/* Horizontal accent */}
        <line x1="4" y1="15" x2="36" y2="15" stroke="rgba(255,220,60,0.3)" strokeWidth="0.9"/>
        {/* Inner border */}
        <path d="M20 5 L33 10 L33 25 Q33 36 20 41 Q7 36 7 25 L7 10 Z"
          fill="none" stroke="rgba(255,215,0,0.25)" strokeWidth="0.8"/>
        {/* Diamond gem */}
        <polygon points="20,11 28,19 20,28 12,19"
          fill={`url(#${uid}-gem)`} stroke="#ffd700" strokeWidth="1"/>
        <polygon points="20,14 25,19 20,25 15,19" fill="rgba(255,255,220,0.55)"/>
        {/* Side ornament dots */}
        <circle cx="10" cy="14" r="1.8" fill="#ffd700" opacity="0.65"/>
        <circle cx="30" cy="14" r="1.8" fill="#ffd700" opacity="0.65"/>
        {/* Top ornament */}
        <polygon points="20,2 22.5,7 20,6 17.5,7" fill="#ffd700"/>
      </svg>
    ),

    // ── B-Rank: Platinum (teal gem + small wings) ─────────────
    b: (
      <svg width={size} height={size} viewBox="0 0 46 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="23" y1="0" x2="23" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e2f6f9"/>
            <stop offset="100%" stopColor="#7ab8c4"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="#f0fbff"/>
            <stop offset="45%" stopColor="#22d3ee"/>
            <stop offset="100%" stopColor="#0891b2"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a5e0ea"/>
            <stop offset="100%" stopColor="#5baabd"/>
          </linearGradient>
        </defs>
        {/* Left wing */}
        <path d="M3 22 Q1 15 5 10 Q8 15 10 22 Q8 27 5 28 Q2 27 3 22Z"
          fill={`url(#${uid}-wing)`} stroke="#7ab8c4" strokeWidth="0.8" opacity="0.9"/>
        <path d="M3 18 Q6 15 8 13" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M3 22 Q6 20 8 18" stroke="#ffffff" strokeWidth="0.5" fill="none" opacity="0.5"/>
        {/* Right wing */}
        <path d="M43 22 Q45 15 41 10 Q38 15 36 22 Q38 27 41 28 Q44 27 43 22Z"
          fill={`url(#${uid}-wing)`} stroke="#7ab8c4" strokeWidth="0.8" opacity="0.9"/>
        <path d="M43 18 Q40 15 38 13" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M43 22 Q40 20 38 18" stroke="#ffffff" strokeWidth="0.5" fill="none" opacity="0.5"/>
        {/* Main shield */}
        <path d="M23 2 L38 8 L38 26 Q38 37 23 43 Q8 37 8 26 L8 8 Z"
          fill={`url(#${uid}-bg)`} stroke="#7ab8c4" strokeWidth="1.5"/>
        {/* Inner frame */}
        <path d="M23 5 L35 10 L35 25 Q35 35 23 40 Q11 35 11 25 L11 10 Z"
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        {/* Gem */}
        <polygon points="23,11 31,19 23,28 15,19"
          fill={`url(#${uid}-gem)`} stroke="#7eeaf8" strokeWidth="1"/>
        <polygon points="23,14 28,19 23,25 18,19" fill="rgba(240,251,255,0.6)"/>
        {/* Cross lines on gem */}
        <line x1="23" y1="11" x2="23" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
        <line x1="15" y1="19" x2="31" y2="19" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
        {/* Top */}
        <circle cx="23" cy="6" r="2.2" fill="#7ab8c4" stroke="#a5e0ea" strokeWidth="0.8"/>
        <circle cx="23" cy="6" r="1" fill="#e2f6f9"/>
      </svg>
    ),

    // ── A-Rank: Diamond/Purple (diamond body + wings) ─────────
    a: (
      <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="23" y1="0" x2="23" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333ea"/>
            <stop offset="60%" stopColor="#6d28d9"/>
            <stop offset="100%" stopColor="#3b0764"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#f3e8ff"/>
            <stop offset="40%" stopColor="#c084fc"/>
            <stop offset="100%" stopColor="#6d28d9"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7"/>
            <stop offset="100%" stopColor="#5b21b6"/>
          </linearGradient>
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Left wing */}
        <path d="M1 24 Q0 14 6 8 Q10 16 11 24 Q9 30 5 32 Q1 30 1 24Z"
          fill={`url(#${uid}-wing)`} opacity="0.9"/>
        <path d="M2 18 Q6 14 9 11" stroke="#d8b4fe" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <path d="M1 24 Q5 21 9 18" stroke="#d8b4fe" strokeWidth="0.7" fill="none" opacity="0.6"/>
        <path d="M2 29 Q5 27 9 25" stroke="#d8b4fe" strokeWidth="0.5" fill="none" opacity="0.5"/>
        {/* Right wing */}
        <path d="M45 24 Q46 14 40 8 Q36 16 35 24 Q37 30 41 32 Q45 30 45 24Z"
          fill={`url(#${uid}-wing)`} opacity="0.9"/>
        <path d="M44 18 Q40 14 37 11" stroke="#d8b4fe" strokeWidth="0.8" fill="none" opacity="0.7"/>
        <path d="M45 24 Q41 21 37 18" stroke="#d8b4fe" strokeWidth="0.7" fill="none" opacity="0.6"/>
        <path d="M44 29 Q41 27 37 25" stroke="#d8b4fe" strokeWidth="0.5" fill="none" opacity="0.5"/>
        {/* Diamond-shape main body */}
        <polygon points="23,2 39,20 23,44 7,20"
          fill={`url(#${uid}-bg)`} stroke="#a855f7" strokeWidth="1.5"/>
        {/* Inner diamond frame */}
        <polygon points="23,6 35,20 23,38 11,20"
          fill="none" stroke="rgba(192,132,252,0.3)" strokeWidth="0.9"/>
        {/* Top spike accent */}
        <polygon points="23,2 26,8 23,7 20,8" fill="#c084fc"/>
        {/* Center gem */}
        <polygon points="23,12 32,21 23,31 14,21"
          fill={`url(#${uid}-gem)`} stroke="#d8b4fe" strokeWidth="1" filter={`url(#${uid}-glow)`}/>
        <polygon points="23,16 28,21 23,27 18,21" fill="rgba(255,255,255,0.5)"/>
        {/* Gem cross */}
        <line x1="23" y1="12" x2="23" y2="31" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7"/>
        <line x1="14" y1="21" x2="32" y2="21" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7"/>
      </svg>
    ),

    // ── S-Rank: Master (Gold, crown, large wings) ─────────────
    s: (
      <svg width={size} height={size} viewBox="0 0 48 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="24" y1="0" x2="24" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24"/>
            <stop offset="45%" stopColor="#d97706"/>
            <stop offset="100%" stopColor="#78350f"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#fefce8"/>
            <stop offset="40%" stopColor="#fcd34d"/>
            <stop offset="100%" stopColor="#b45309"/>
          </radialGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24"/>
            <stop offset="100%" stopColor="#92400e"/>
          </linearGradient>
          <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Wings — larger */}
        <path d="M0 26 Q-1 14 6 8 Q11 17 12 26 Q10 32 5 34 Q0 31 0 26Z"
          fill={`url(#${uid}-wing)`} opacity="0.92"/>
        <path d="M1 20 Q6 16 9 13" stroke="#fde68a" strokeWidth="0.9" fill="none"/>
        <path d="M0 26 Q5 23 9 20" stroke="#fde68a" strokeWidth="0.7" fill="none"/>
        <path d="M1 31 Q5 29 9 27" stroke="#fde68a" strokeWidth="0.6" fill="none" opacity="0.7"/>
        <path d="M48 26 Q49 14 42 8 Q37 17 36 26 Q38 32 43 34 Q48 31 48 26Z"
          fill={`url(#${uid}-wing)`} opacity="0.92"/>
        <path d="M47 20 Q42 16 39 13" stroke="#fde68a" strokeWidth="0.9" fill="none"/>
        <path d="M48 26 Q43 23 39 20" stroke="#fde68a" strokeWidth="0.7" fill="none"/>
        <path d="M47 31 Q43 29 39 27" stroke="#fde68a" strokeWidth="0.6" fill="none" opacity="0.7"/>
        {/* Crown at top */}
        <path d="M14 7 L24 2 L34 7 L31 11 L27.5 9 L24 11 L20.5 9 L17 11 Z"
          fill={`url(#${uid}-wing)`} stroke="#fde68a" strokeWidth="0.9"/>
        <circle cx="24" cy="3" r="2.5" fill="#fcd34d" filter={`url(#${uid}-glow)`}/>
        <circle cx="24" cy="3" r="1.2" fill="#ffffff"/>
        <circle cx="16" cy="8" r="1.3" fill="#fbbf24"/>
        <circle cx="32" cy="8" r="1.3" fill="#fbbf24"/>
        {/* Main shield */}
        <path d="M24 10 L40 17 L40 31 Q40 43 24 49 Q8 43 8 31 L8 17 Z"
          fill={`url(#${uid}-bg)`} stroke="#fbbf24" strokeWidth="1.8"/>
        {/* Inner frame */}
        <path d="M24 14 L36 20 L36 30 Q36 41 24 46 Q12 41 12 30 L12 20 Z"
          fill="none" stroke="rgba(253,230,138,0.35)" strokeWidth="1"/>
        {/* Center gem */}
        <polygon points="24,18 33,26 24,36 15,26"
          fill={`url(#${uid}-gem)`} stroke="#fde68a" strokeWidth="1.2" filter={`url(#${uid}-glow)`}/>
        <polygon points="24,22 29,26 24,32 19,26" fill="rgba(255,255,220,0.6)"/>
        {/* Gem sparkle */}
        <line x1="24" y1="18" x2="24" y2="36" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
        <line x1="15" y1="26" x2="33" y2="26" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
        {/* Bottom tip */}
        <polygon points="24,49 27,44 24,46 21,44" fill="#fcd34d"/>
      </svg>
    ),

    // ── National Level: Grandmaster (Pink+Gold, grand wings+crown) ──
    national: (
      <svg width={size} height={size} viewBox="0 0 50 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="25" y1="0" x2="25" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f472b6"/>
            <stop offset="45%" stopColor="#db2777"/>
            <stop offset="100%" stopColor="#831843"/>
          </linearGradient>
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a"/>
            <stop offset="100%" stopColor="#d97706"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#fce7f3"/>
            <stop offset="40%" stopColor="#f9a8d4"/>
            <stop offset="100%" stopColor="#be185d"/>
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Grand wings */}
        <path d="M0 28 Q-1 15 7 8 Q12 18 13 28 L11 37 Q5 35 0 28Z"
          fill={`url(#${uid}-gold)`} opacity="0.95"/>
        <path d="M1 20 Q7 16 10 13" stroke="#fef9c3" strokeWidth="1" fill="none"/>
        <path d="M0 27 Q6 23 10 20" stroke="#fef9c3" strokeWidth="0.8" fill="none"/>
        <path d="M1 33 Q6 31 10 28" stroke="#fef9c3" strokeWidth="0.6" fill="none" opacity="0.6"/>
        <path d="M50 28 Q51 15 43 8 Q38 18 37 28 L39 37 Q45 35 50 28Z"
          fill={`url(#${uid}-gold)`} opacity="0.95"/>
        <path d="M49 20 Q43 16 40 13" stroke="#fef9c3" strokeWidth="1" fill="none"/>
        <path d="M50 27 Q44 23 40 20" stroke="#fef9c3" strokeWidth="0.8" fill="none"/>
        <path d="M49 33 Q44 31 40 28" stroke="#fef9c3" strokeWidth="0.6" fill="none" opacity="0.6"/>
        {/* Grand crown */}
        <path d="M13 7 L25 2 L37 7 L34 12 L30.5 10 L25 13 L19.5 10 L16 12 Z"
          fill={`url(#${uid}-gold)`} stroke="#fef9c3" strokeWidth="1"/>
        {/* Crown gems */}
        <circle cx="25" cy="3.5" r="3" fill="#f472b6" filter={`url(#${uid}-glow)`}/>
        <circle cx="25" cy="3.5" r="1.5" fill="#fce7f3"/>
        <circle cx="17" cy="9" r="1.8" fill="#fbbf24"/>
        <circle cx="33" cy="9" r="1.8" fill="#fbbf24"/>
        {/* Main shield */}
        <path d="M25 11 L42 18 L42 33 Q42 45 25 51 Q8 45 8 33 L8 18 Z"
          fill={`url(#${uid}-bg)`} stroke={`url(#${uid}-gold)`} strokeWidth="2"/>
        {/* Inner frame */}
        <path d="M25 15 L38 21 L38 32 Q38 43 25 48 Q12 43 12 32 L12 21 Z"
          fill="none" stroke="rgba(253,230,138,0.4)" strokeWidth="1.2"/>
        {/* Center gem */}
        <polygon points="25,20 34,29 25,40 16,29"
          fill={`url(#${uid}-gem)`} stroke="#f9a8d4" strokeWidth="1.3" filter={`url(#${uid}-glow)`}/>
        <polygon points="25,24 30,29 25,35 20,29" fill="rgba(255,255,255,0.55)"/>
        {/* Gem cross */}
        <line x1="25" y1="20" x2="25" y2="40" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
        <line x1="16" y1="29" x2="34" y2="29" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7"/>
        {/* Bottom point */}
        <polygon points="25,51 28,46 25,48 22,46" fill="#fde68a"/>
      </svg>
    ),

    // ── Shadow Monarch: Ultimate dark badge ───────────────────
    shadow_monarch: (
      <svg width={size} height={size} viewBox="0 0 50 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="25" y1="0" x2="25" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed"/>
            <stop offset="50%" stopColor="#4c1d95"/>
            <stop offset="100%" stopColor="#1e0a3c"/>
          </linearGradient>
          <linearGradient id={`${uid}-wing`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d28d9"/>
            <stop offset="100%" stopColor="#1e0a3c"/>
          </linearGradient>
          <radialGradient id={`${uid}-gem`} cx="38%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#faf5ff"/>
            <stop offset="35%" stopColor="#c084fc"/>
            <stop offset="100%" stopColor="#5b21b6"/>
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Dark wings — large, angular */}
        <path d="M0 30 Q-1 15 8 7 Q14 19 15 30 Q13 40 6 43 Q1 38 0 30Z"
          fill={`url(#${uid}-wing)`} opacity="0.95"/>
        {/* Wing veins */}
        <path d="M1 22 Q8 16 12 12" stroke="#a855f7" strokeWidth="0.9" fill="none" opacity="0.8"/>
        <path d="M0 30 Q7 25 12 21" stroke="#a855f7" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M1 36 Q7 33 12 30" stroke="#a855f7" strokeWidth="0.6" fill="none" opacity="0.5"/>
        <path d="M50 30 Q51 15 42 7 Q36 19 35 30 Q37 40 44 43 Q49 38 50 30Z"
          fill={`url(#${uid}-wing)`} opacity="0.95"/>
        <path d="M49 22 Q42 16 38 12" stroke="#a855f7" strokeWidth="0.9" fill="none" opacity="0.8"/>
        <path d="M50 30 Q43 25 38 21" stroke="#a855f7" strokeWidth="0.7" fill="none" opacity="0.7"/>
        <path d="M49 36 Q43 33 38 30" stroke="#a855f7" strokeWidth="0.6" fill="none" opacity="0.5"/>
        {/* Shadow crown — spiky */}
        <path d="M13 9 L25 3 L37 9" stroke="#c084fc" strokeWidth="1.8" fill="none"/>
        <line x1="25" y1="3" x2="25" y2="10" stroke="#c084fc" strokeWidth="2.2"/>
        <line x1="17" y1="6" x2="19" y2="10" stroke="#c084fc" strokeWidth="1.2" opacity="0.8"/>
        <line x1="33" y1="6" x2="31" y2="10" stroke="#c084fc" strokeWidth="1.2" opacity="0.8"/>
        {/* Crown orb */}
        <circle cx="25" cy="3" r="3.5" fill="#4c1d95" stroke="#c084fc" strokeWidth="1.2" filter={`url(#${uid}-soft)`}/>
        <circle cx="25" cy="3" r="2" fill="#7c3aed" filter={`url(#${uid}-glow)`}/>
        <circle cx="25" cy="3" r="1" fill="#f3e8ff"/>
        {/* Main shield — pointed bottom */}
        <path d="M25 9 L42 17 L42 33 Q42 46 25 54 Q8 46 8 33 L8 17 Z"
          fill={`url(#${uid}-bg)`} stroke="#8b5cf6" strokeWidth="2"/>
        {/* Inner glowing frame */}
        <path d="M25 13 L38 20 L38 32 Q38 44 25 50 Q12 44 12 32 L12 20 Z"
          fill="none" stroke="rgba(192,132,252,0.25)" strokeWidth="1.2"/>
        {/* Large center gem */}
        <polygon points="25,19 36,30 25,42 14,30"
          fill={`url(#${uid}-gem)`} stroke="#c084fc" strokeWidth="1.5" filter={`url(#${uid}-glow)`}/>
        <polygon points="25,23 32,30 25,38 18,30" fill="rgba(255,255,255,0.4)"/>
        {/* Gem cross */}
        <line x1="25" y1="19" x2="25" y2="42" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        <line x1="14" y1="30" x2="36" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
        {/* Floating shadow orbs */}
        <circle cx="19" cy="22" r="1.2" fill="#c084fc" opacity="0.6" filter={`url(#${uid}-soft)`}/>
        <circle cx="31" cy="38" r="1" fill="#c084fc" opacity="0.5" filter={`url(#${uid}-soft)`}/>
        <circle cx="18" cy="36" r="0.8" fill="#c084fc" opacity="0.7" filter={`url(#${uid}-soft)`}/>
        <circle cx="32" cy="24" r="0.9" fill="#c084fc" opacity="0.4" filter={`url(#${uid}-soft)`}/>
        {/* Bottom spike */}
        <polygon points="25,54 28.5,48 25,51 21.5,48" fill="#8b5cf6"/>
      </svg>
    ),
  };

  return badges[rankId] ?? (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
      <path d="M20 2 L36 8 L36 26 Q36 37 20 43 Q4 37 4 26 L4 8 Z"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    </svg>
  );
}

// ============================================================
// RANK BADGE — pill component with SVG icon
// ============================================================
interface RankBadgeProps {
  rank: RankInfo;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizes = {
    sm: { px: "6px 10px",  fs: 9,  icon: 18 },
    md: { px: "8px 14px",  fs: 11, icon: 24 },
    lg: { px: "12px 20px", fs: 14, icon: 32 },
  };
  const s = sizes[size];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: s.px,
        borderRadius: 30,
        background: rank.bgColor,
        border: `1px solid ${rank.color}44`,
        boxShadow: `0 0 16px ${rank.glowColor}`,
      }}
    >
      <RankBadgeSVG rankId={rank.id} size={s.icon} />
      <div>
        <p
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: s.fs,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: rank.color,
            lineHeight: 1,
          }}
        >
          {rank.name}
        </p>
        {size === "lg" && (
          <p
            style={{
              fontSize: 10,
              color: `${rank.color}99`,
              marginTop: 2,
              letterSpacing: "0.06em",
            }}
          >
            {rank.title}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// XP PROGRESS BAR
// ============================================================
interface XPProgressBarProps {
  xpPct: number;
  rank: RankInfo;
  nextRank: RankInfo | null;
  currentXP: number;
  showLabels?: boolean;
}

export function XPProgressBar({
  xpPct,
  rank,
  nextRank,
  currentXP,
  showLabels = true,
}: XPProgressBarProps) {
  return (
    <div>
      {showLabels && (
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] font-extrabold opacity-40 uppercase tracking-widest">
            Next: {nextRank?.name || "MAX"}
          </span>
          <span className="text-[9px] font-extrabold text-cyan-400">
            {xpPct}%
          </span>
        </div>
      )}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className="xp-bar h-full rounded-full"
          style={{
            width: `${xpPct}%`,
            background: `linear-gradient(90deg,${rank.color},${rank.color}cc)`,
            boxShadow: `0 0 8px ${rank.glowColor}`,
          }}
        />
      </div>
      {showLabels && nextRank && (
        <p className="text-[9px] text-right mt-1 opacity-30">
          {(nextRank.minXP - currentXP).toLocaleString()} XP to {nextRank.name}
        </p>
      )}
    </div>
  );
}

// ============================================================
// STAT BAR (Neural Attributes)
// ============================================================
interface StatBarProps {
  label: string;
  value: number;   // 0–100 for bar width
  display: string; // displayed text e.g. "88%" or "145"
  color: string;
}

export function StatBar({ label, value, display, color }: StatBarProps) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">
          {label}
        </span>
        <span className="text-[9px] font-black" style={{ color }}>
          {display}
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="stat-bar h-full rounded-full"
          style={{
            width: `${value}%`,
            background: color,
            boxShadow: `0 0 6px ${color}88`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================
interface SectionHeadingProps {
  icon: React.ReactNode;
  label: string;
  rightContent?: React.ReactNode;
}

export function SectionHeading({
  icon,
  label,
  rightContent,
}: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2 mb-4 opacity-80">
      {icon}
      <h3 className="text-[9px] font-black tracking-widest uppercase">
        {label}
      </h3>
      {rightContent && <span className="ml-auto">{rightContent}</span>}
    </div>
  );
}