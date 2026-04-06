"use client"

import { Swords, Trophy, Skull, Clock, ChevronRight } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface Battle {
  id: string
  opponent: string
  subject: string
  result: "victory" | "defeat"
  score: string
  xpGained: number
  coinsGained: number
  timeAgo: string
}

const mockBattles: Battle[] = [
  { id: "1", opponent: "QuizMaster99", subject: "Physics", result: "victory", score: "8-5", xpGained: 250, coinsGained: 100, timeAgo: "2m ago" },
  { id: "2", opponent: "MathGenius_BD", subject: "Math", result: "defeat", score: "4-7", xpGained: 50, coinsGained: 20, timeAgo: "15m ago" },
  { id: "3", opponent: "ChemWizard01", subject: "Chemistry", result: "victory", score: "9-3", xpGained: 300, coinsGained: 150, timeAgo: "1h ago" },
  { id: "4", opponent: "SciencePro_BD", subject: "Biology", result: "victory", score: "7-6", xpGained: 200, coinsGained: 80, timeAgo: "2h ago" },
  { id: "5", opponent: "BrainStorm123", subject: "Physics", result: "defeat", score: "5-8", xpGained: 40, coinsGained: 15, timeAgo: "3h ago" },
]

export function BattleLog() {
  const { theme } = useTheme()

  return (
    <div className={`theme-card overflow-hidden h-full ${theme === "pixel" ? "" : "rounded-xl"}`}>
      {/* Header */}
      <div className={`
        flex items-center justify-between px-5 py-5 border-b border-border/40
        ${theme === "shounen" ? "bg-accent/15" : "bg-secondary/40"}
      `}>
        <div className="flex items-center gap-3">
          <Swords className={`w-6 h-6 ${theme === "shounen" ? "text-accent" : "text-primary"}`} />
          <h3 className={`
            font-extrabold text-lg font-display uppercase tracking-wider
            ${theme === "shounen" ? "text-accent italic" : ""}
            ${theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"}
          `}>
            {theme === "islamic" ? "Recent Challenges" : "Battle Log"}
          </h3>
        </div>
        <button className={`
          text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors
          ${theme === "shounen" ? "text-primary hover:text-primary/80" : "text-accent hover:text-accent/80"}
        `}>
          History <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Battle List */}
      <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
        {mockBattles.map((battle) => (
          <div
            key={battle.id}
            className={`
              p-4 transition-all duration-200 cursor-pointer group
              ${theme === "pixel"
                ? "bg-secondary border-3 hover:border-primary"
                : theme === "shounen"
                ? "bg-card rounded-xl border-l-4 hover:shadow-xl shadow-md"
                : theme === "islamic"
                ? "bg-card/70 rounded-xl border-l-3 hover:bg-card shadow-sm"
                : "bg-secondary/40 border-l-3 hover:bg-secondary/60"
              }
              ${battle.result === "victory" 
                ? "border-l-green-500" 
                : "border-l-red-500"
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {battle.result === "victory" ? (
                  <Trophy className="w-5 h-5 text-green-500" />
                ) : (
                  <Skull className="w-5 h-5 text-red-500" />
                )}
                <span className={`
                  font-extrabold text-xs uppercase tracking-widest
                  ${battle.result === "victory" ? "text-green-500" : "text-red-500"}
                `}>
                  {theme === "pixel" 
                    ? battle.result === "victory" ? "WIN!" : "LOSE"
                    : battle.result === "victory" ? "Victory" : "Defeat"
                  }
                </span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold ${
                theme === "shounen" || theme === "islamic" ? "text-gray-500" : "text-gray-400"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {battle.timeAgo}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className={`
                  font-extrabold text-sm uppercase tracking-wide
                  group-hover:text-primary transition-colors
                  ${theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"}
                `}>
                  vs {battle.opponent}
                </div>
                <div className={`
                  text-[10px] font-bold uppercase tracking-widest mt-1
                  ${theme === "shounen" ? "text-accent/80" : "text-primary/80"}
                `}>
                  {battle.subject}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-extrabold text-xl font-display ${
                  theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-gray-100"
                }`}>{battle.score}</div>
                <div className="flex items-center gap-3 text-[10px] mt-1 font-bold">
                  <span className="text-primary">+{battle.xpGained} XP</span>
                  <span className="text-yellow-500">+{battle.coinsGained}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
