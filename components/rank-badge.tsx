"use client";

import React from "react";
import Image from "next/image";

// ─────────────────────────────────────────────
// Rank badge metadata (mirrors dashboard/page.tsx)
// ─────────────────────────────────────────────
type RankId = "e" | "d" | "c" | "b" | "a" | "s" | "national" | "shadow_monarch";

interface RankBadgeInfo {
  id: RankId;
  name: string;
  title: string;
  color: string;
  glowColor: string;
  bgColor: string;
  badgeImage: string;
  minXP: number;
  maxXP: number;
}

const RANK_BADGES: RankBadgeInfo[] = [
  {
    id: "e", name: "E-Rank", title: "Weakest Hunter",
    color: "#6b7280", glowColor: "rgba(107,114,128,0.4)", bgColor: "rgba(107,114,128,0.08)",
    badgeImage: "/rank-badges/bronze-badge.png",
    minXP: 0, maxXP: 1999,
  },
  {
    id: "d", name: "D-Rank", title: "Awakened Hunter",
    color: "#b45309", glowColor: "rgba(180,83,9,0.4)", bgColor: "rgba(180,83,9,0.08)",
    badgeImage: "/rank-badges/silver-badge.png",
    minXP: 2000, maxXP: 5999,
  },
  {
    id: "c", name: "C-Rank", title: "Gate Raider",
    color: "#0ea5e9", glowColor: "rgba(14,165,233,0.4)", bgColor: "rgba(14,165,233,0.08)",
    badgeImage: "/rank-badges/gold-badge.png",
    minXP: 6000, maxXP: 13999,
  },
  {
    id: "b", name: "B-Rank", title: "Elite Fighter",
    color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)", bgColor: "rgba(34,211,238,0.08)",
    badgeImage: "/rank-badges/platinum-badge.png",
    minXP: 14000, maxXP: 27999,
  },
  {
    id: "a", name: "A-Rank", title: "Dungeon Breaker",
    color: "#a855f7", glowColor: "rgba(168,85,247,0.4)", bgColor: "rgba(168,85,247,0.08)",
    badgeImage: "/rank-badges/diamond-badge.png",
    minXP: 28000, maxXP: 49999,
  },
  {
    id: "s", name: "S-Rank", title: "Sovereign Hunter",
    color: "#f59e0b", glowColor: "rgba(245,158,11,0.5)", bgColor: "rgba(245,158,11,0.08)",
    badgeImage: "/rank-badges/master-badge.png",
    minXP: 50000, maxXP: 79999,
  },
  {
    id: "national", name: "National Level", title: "Absolute Monarch",
    color: "#ec4899", glowColor: "rgba(236,72,153,0.5)", bgColor: "rgba(236,72,153,0.08)",
    badgeImage: "/rank-badges/grandmaster-badge.png",
    minXP: 80000, maxXP: 119999,
  },
  {
    id: "shadow_monarch", name: "Shadow Monarch", title: "Arise.",
    color: "#c084fc", glowColor: "rgba(192,132,252,0.6)", bgColor: "rgba(192,132,252,0.08)",
    badgeImage: "/rank-badges/shadow-badge.png",
    minXP: 120000, maxXP: Infinity,
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function getRankBadgeByXP(xp: number): RankBadgeInfo {
  return RANK_BADGES.find(r => xp >= r.minXP && xp <= r.maxXP) || RANK_BADGES[0];
}

export function getRankBadgeById(id: RankId): RankBadgeInfo {
  return RANK_BADGES.find(r => r.id === id) || RANK_BADGES[0];
}

export { RANK_BADGES };
export type { RankBadgeInfo, RankId };

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface RankBadgeProps {
  /** Rank info object from getRankBadgeByXP / getRankBadgeById */
  rank: { name: string; title?: string; color: string; glowColor: string; bgColor: string; badgeImage?: string };
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
}

const sizes = {
  sm: { img: 24, px: "6px 12px", fs: 9,  gap: 6  },
  md: { img: 32, px: "8px 14px", fs: 11, gap: 8  },
  lg: { img: 44, px: "12px 20px", fs: 14, gap: 10 },
};

export const RankBadge = React.memo(function RankBadge({ rank, size = "md", showTitle }: RankBadgeProps) {
  const s = sizes[size];
  const badgeImage = (rank as RankBadgeInfo).badgeImage;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      padding: s.px, borderRadius: 30,
      background: rank.bgColor, border: `1px solid ${rank.color}44`,
      boxShadow: `0 0 14px ${rank.glowColor}`,
    }}>
      {badgeImage ? (
        <Image
          src={badgeImage}
          width={s.img}
          height={s.img}
          alt={rank.name}
          loading="lazy"
          style={{ flexShrink: 0 }}
          unoptimized
        />
      ) : null}
      <div>
        <p style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: s.fs, fontWeight: 900,
          letterSpacing: "0.12em", color: rank.color, lineHeight: 1,
        }}>{rank.name}</p>
        {(showTitle || size === "lg") && rank.title && (
          <p style={{ fontSize: Math.max(s.fs - 2, 8), color: `${rank.color}99`, marginTop: 2, letterSpacing: "0.06em" }}>{rank.title}</p>
        )}
      </div>
    </div>
  );
});
