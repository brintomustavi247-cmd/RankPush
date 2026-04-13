// components/dashboard/UIComponents.tsx
// Reusable, shared UI primitives used across multiple dashboard components.

"use client";

import React from "react";
import { RankInfo } from "./RankSystem";

// ============================================================
// RANK BADGE
// ============================================================
interface RankBadgeProps {
  rank: RankInfo;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizes = {
    sm: { imgSize: 40, px: "6px 10px", fs: 8,  gap: 6 },
    md: { imgSize: 56, px: "8px 14px", fs: 10, gap: 8 },
    lg: { imgSize: 80, px: "12px 20px", fs: 13, gap: 10 },
  };
  const s = sizes[size];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.px,
        borderRadius: 30,
        background: rank.bgColor,
        border: `1px solid ${rank.color}44`,
        boxShadow: `0 0 16px ${rank.glowColor}`,
      }}
    >
      <img
        src={rank.badgeImage}
        alt={rank.name}
        style={{
          width: s.imgSize,
          height: s.imgSize,
          objectFit: "contain",
          filter: `drop-shadow(0 0 6px ${rank.glowColor})`,
        }}
      />
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
        {size !== "sm" && (
          <p
            style={{
              fontSize: s.fs - 2,
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