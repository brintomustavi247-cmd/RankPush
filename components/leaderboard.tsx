"use client"

import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"

interface Player {
  rank: number
  username: string
  role: string
  score: number
  wins: number
  trend: "up" | "down" | "stable"
  avatar: string
}

const mockPlayers: Player[] = [
  { rank: 1, username: "PhysicsKing_BD", role: "Wing Spiker", score: 98500, wins: 342, trend: "stable", avatar: "https://i.pravatar.cc/100?img=1" },
  { rank: 2, username: "MathWizard007", role: "Middle Blocker", score: 95200, wins: 318, trend: "up", avatar: "https://i.pravatar.cc/100?img=2" },
  { rank: 3, username: "ChemMaster_Pro", role: "Libero", score: 92800, wins: 301, trend: "up", avatar: "https://i.pravatar.cc/100?img=3" },
  { rank: 4, username: "BiologyNinja", role: "Setter", score: 89400, wins: 287, trend: "down", avatar: "https://i.pravatar.cc/100?img=4" },
  { rank: 5, username: "ScienceGuru99", role: "Ace", score: 87100, wins: 275, trend: "stable", avatar: "https://i.pravatar.cc/100?img=5" },
]

// Theme-specific avatars
const getAvatarUrl = (theme: string, player: Player) => {
  if (theme === "pixel") {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${player.username}`
  }
  return player.avatar
}

const TrendIcon = ({ trend }: { trend: Player["trend"] }) => {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

const getRankColor = (rank: number, theme: string) => {
  const colors = {
    1: theme === "islamic" ? "text-accent" : "text-yellow-500",
    2: "text-slate-400",
    3: "text-amber-600",
  }
  return colors[rank as keyof typeof colors] || "text-muted-foreground"
}

export function Leaderboard() {
  const { theme } = useTheme()

  return (
    <div className={`theme-card overflow-hidden h-full ${theme === "pixel" ? "" : "rounded-xl"}`}>
      {/* Header */}
      <div className={`
        flex items-center justify-between px-5 py-5 border-b border-border/40
        ${theme === "shounen" ? "bg-primary/15" : "bg-secondary/40"}
      `}>
        <div className="flex items-center gap-3">
          <Trophy className={`w-6 h-6 ${theme === "islamic" ? "text-accent" : "text-primary"}`} />
          <h3 className={`
            font-extrabold text-lg font-display uppercase tracking-wider
            ${theme === "shounen" ? "text-primary italic" : ""}
            ${theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"}
          `}>
            {theme === "islamic" ? "Top Scholars" : "Top Warriors"}
          </h3>
        </div>
        <button className={`
          text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors
          ${theme === "islamic" ? "text-primary hover:text-primary/80" : "text-accent hover:text-accent/80"}
        `}>
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Player Cards */}
      <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
        {mockPlayers.map((player) => (
          <div
            key={player.rank}
            className={`
              relative flex items-center gap-4 p-4 transition-all duration-200 cursor-pointer group
              ${theme === "pixel" 
                ? "bg-secondary border-3 border-transparent hover:border-primary" 
                : theme === "shounen"
                ? "bg-card rounded-xl border-l-4 hover:shadow-xl shadow-md"
                : theme === "islamic"
                ? "bg-card/70 rounded-xl border-l-3 hover:bg-card shadow-sm"
                : "bg-secondary/40 border-l-3 hover:bg-secondary/60"
              }
              ${player.rank === 1 
                ? theme === "islamic" ? "border-l-accent" : "border-l-yellow-500" 
                : player.rank === 2 
                ? "border-l-slate-400" 
                : player.rank === 3 
                ? "border-l-amber-600" 
                : theme === "islamic" ? "border-l-primary/40" : "border-l-accent/40"
              }
            `}
          >
            {/* Rank Number */}
            <div className={`
              w-10 h-10 flex items-center justify-center font-extrabold font-display text-lg
              ${getRankColor(player.rank, theme)}
            `}>
              {theme === "pixel" ? `#${player.rank}` : String(player.rank).padStart(2, '0')}
            </div>

            {/* Avatar */}
            <div className={`
              relative w-12 h-12 overflow-hidden flex-shrink-0
              ${theme === "pixel" ? "border-3 border-primary" : "rounded-full border-2 border-primary/50"}
            `}>
              <Image
                src={getAvatarUrl(theme, player)}
                alt={player.username}
                fill
                className={`object-cover ${theme === "pixel" ? "" : "rounded-full"}`}
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className={`
                font-extrabold text-sm truncate uppercase tracking-wide
                group-hover:text-primary transition-colors
                ${theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"}
              `}>
                {player.username}
              </div>
              <div className={`
                text-[10px] font-bold uppercase tracking-widest
                ${theme === "islamic" ? "text-accent/80" : "text-primary/80"}
              `}>
                {player.role}
              </div>
            </div>

            {/* Score */}
            <div className="text-right flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className={`font-extrabold text-sm font-display ${
                  theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"
                }`}>{player.score.toLocaleString()}</span>
                <TrendIcon trend={player.trend} />
              </div>
              <button className={`
                text-[10px] px-3 py-1 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity
                ${theme === "pixel"
                  ? "bg-accent text-accent-foreground border-2 border-black"
                  : theme === "shounen"
                  ? "bg-accent text-accent-foreground rounded-full"
                  : theme === "islamic"
                  ? "border-2 border-primary/60 text-primary rounded-lg"
                  : "border-2 border-accent/60 text-accent"
                }
              `}>
                {theme === "pixel" ? "VIEW" : "Read More"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
