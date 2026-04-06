"use client"

import { Coins, Zap, Crown, Shield, Star, Flame, Crosshair, Brain, Heart, Dumbbell } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"

const ranks = {
  gold: { name: "Gold", icon: Crown, color: "text-yellow-500" },
  diamond: { name: "Diamond", icon: Shield, color: "text-cyan-400" },
  grandmaster: { name: "Grandmaster", icon: Star, color: "text-primary" },
}

const titles = {
  noob: "Noob",
  scholar: "Scholar", 
  grandmaster: "Grandmaster",
}

// Professional stat icons matching the Alica/MagicCraft style
const statIcons = {
  Power: Dumbbell,
  Speed: Zap,
  Accuracy: Crosshair,
  Strategy: Brain,
  Endurance: Heart,
}

const playerStats = [
  { label: "Power", value: 85, color: "from-red-500 to-orange-500" },
  { label: "Speed", value: 92, color: "from-cyan-400 to-blue-500" },
  { label: "Accuracy", value: 78, color: "from-green-400 to-emerald-500" },
  { label: "Strategy", value: 88, color: "from-purple-400 to-violet-500" },
  { label: "Endurance", value: 70, color: "from-yellow-400 to-amber-500" },
]

// Theme-specific avatar URLs
const avatarUrls: Record<string, string> = {
  tactical: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=face",
  shounen: "https://i.pravatar.cc/200?img=33",
  pixel: "https://api.dicebear.com/7.x/pixel-art/svg?seed=warrior&backgroundColor=1a1a1a",
  islamic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
}

interface ProfileHeaderProps {
  username?: string
  title?: keyof typeof titles
  rank?: keyof typeof ranks
  level?: number
  xp?: number
  maxXp?: number
  coins?: number
  energy?: number
  maxEnergy?: number
}

export function ProfileHeader({
  username = "CyberWarrior_BD",
  title = "scholar",
  rank = "diamond",
  level = 42,
  xp = 7850,
  maxXp = 10000,
  coins = 12500,
  energy = 85,
  maxEnergy = 100,
}: ProfileHeaderProps) {
  const { theme } = useTheme()
  const RankIcon = ranks[rank].icon
  const xpPercentage = (xp / maxXp) * 100
  const energyPercentage = (energy / maxEnergy) * 100

  // Theme-specific username styling
  const getThemeUsername = () => {
    switch (theme) {
      case "shounen":
        return username.toUpperCase() + "!"
      case "pixel":
        return username.toUpperCase()
      case "islamic":
        return username
      default:
        return username
    }
  }

  return (
    <div className="theme-card p-6 md:p-8 rounded-lg">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Avatar + Main Info */}
        <div className="flex flex-col md:flex-row items-center gap-6 flex-1">
          {/* Avatar with theme-specific styling */}
          <div className="relative group">
            {/* Glow effect for tactical/shounen */}
            {(theme === "tactical" || theme === "shounen") && (
              <div className={`absolute inset-0 rounded-full blur-2xl animate-glow-pulse ${
                theme === "tactical" ? "bg-primary/50" : "bg-orange-500/50"
              }`} />
            )}
            
            <div className={`
              relative w-28 h-28 md:w-36 md:h-36 overflow-hidden
              ${theme === "pixel" ? "border-4 border-primary" : "rounded-full border-4 border-primary"}
              ${theme === "tactical" ? "glow-primary" : ""}
              ${theme === "shounen" ? "manga-border" : ""}
              ${theme === "islamic" ? "border-2 border-accent" : ""}
            `}>
              <Image
                src={avatarUrls[theme]}
                alt={username}
                fill
                className={`object-cover ${theme === "pixel" ? "" : "rounded-full"}`}
                unoptimized
              />
            </div>
            
            {/* Level badge */}
            <div className={`
              absolute -bottom-2 -right-2 w-12 h-12 flex items-center justify-center font-extrabold font-display text-lg
              ${theme === "pixel" 
                ? "bg-primary text-primary-foreground border-3 border-black" 
                : theme === "islamic"
                ? "bg-accent text-accent-foreground rounded-full shadow-lg"
                : "bg-background border-3 border-primary rounded-full text-primary glow-primary"
              }
            `}>
              {level}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center md:text-left">
            {/* Username with theme styling - BOLD */}
            <h2 className={`
              text-2xl md:text-4xl font-extrabold font-display tracking-wide
              ${theme === "shounen" ? "text-gray-950 italic" : ""}
              ${theme === "islamic" ? "text-gray-950" : "text-gray-100"}
              ${theme === "tactical" ? "text-gray-100" : ""}
              ${theme === "pixel" ? "text-gray-100" : ""}
            `}>
              {getThemeUsername()}
              {theme === "tactical" && <span className="text-accent">.</span>}
            </h2>
            
            {/* Title badge */}
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              <span className={`
                px-5 py-1.5 text-xs font-extrabold uppercase tracking-widest
                ${theme === "pixel" 
                  ? "bg-accent text-accent-foreground border-3 border-black" 
                  : theme === "islamic"
                  ? "bg-primary/15 text-primary border border-primary/40 rounded-full"
                  : theme === "shounen"
                  ? "bg-primary text-primary-foreground rounded-full shadow-md"
                  : "bg-primary/15 text-primary border border-primary/40"
                }
              `}>
                {titles[title]}
              </span>
              <div className={`flex items-center gap-1.5 ${ranks[rank].color}`}>
                <RankIcon className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">{ranks[rank].name}</span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6 max-w-sm">
              <div className={`flex justify-between text-xs mb-2 uppercase tracking-widest font-bold ${
                theme === "shounen" || theme === "islamic" ? "text-gray-700" : "text-gray-300"
              }`}>
                <span>Level {level} Progress</span>
                <span className="text-primary">{xp.toLocaleString()} / {maxXp.toLocaleString()}</span>
              </div>
              <div className={`stat-bar h-4 ${theme === "pixel" ? "border-2 border-foreground" : "rounded-full"}`}>
                <div
                  className={`stat-bar-fill ${theme === "pixel" ? "" : "rounded-full"}`}
                  style={{ width: `${xpPercentage}%` }}
                />
                <div className={`stat-bar-marker ${theme === "pixel" ? "" : "rounded-sm"}`} style={{ left: `${xpPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Professional RPG Stat Bars with Icons */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-4 text-center lg:text-left ${
            theme === "shounen" || theme === "islamic" ? "text-gray-800" : "text-gray-300"
          }`}>
            Combat Stats
          </h3>
          <div className="space-y-4">
            {playerStats.map((stat) => {
              const StatIcon = statIcons[stat.label as keyof typeof statIcons]
              return (
                <div key={stat.label} className="stat-bar-container">
                  <div className="flex items-center gap-3 mb-1.5">
                    {/* Neon Icon */}
                    <div className={`
                      p-1.5 rounded-md
                      ${theme === "pixel" 
                        ? "bg-secondary border-2 border-primary" 
                        : theme === "tactical"
                        ? "bg-primary/20 shadow-[0_0_10px_rgba(0,212,255,0.4)]"
                        : theme === "shounen"
                        ? "bg-primary/15"
                        : "bg-primary/10"
                      }
                    `}>
                      <StatIcon className={`w-4 h-4 ${
                        theme === "tactical" ? "text-primary animate-glow-pulse" : "text-primary"
                      }`} />
                    </div>
                    <span className={`
                      text-xs font-extrabold uppercase tracking-widest flex-1
                      ${theme === "shounen" || theme === "islamic" ? "text-gray-800" : "text-gray-200"}
                    `}>
                      {stat.label}
                    </span>
                    <span className={`
                      text-sm font-extrabold font-display
                      ${theme === "shounen" || theme === "islamic" ? "text-gray-900" : "text-white"}
                    `}>
                      {stat.value}
                    </span>
                  </div>
                  <div className={`stat-bar h-3 ${theme === "pixel" ? "border-2 border-foreground" : "rounded-full"}`}>
                    <div 
                      className={`stat-bar-fill ${theme === "pixel" ? "" : "rounded-full"}`}
                      style={{ 
                        width: `${stat.value}%`,
                        background: theme === "pixel" 
                          ? undefined 
                          : `linear-gradient(90deg, ${stat.color.split(' ')[0].replace('from-', '')} 0%, ${stat.color.split(' ')[1].replace('to-', '')} 100%)`
                      }} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Resources */}
        <div className="flex flex-row lg:flex-col justify-center gap-4">
          {/* Coins */}
          <div className={`
            flex items-center gap-3 px-6 py-4
            ${theme === "pixel" 
              ? "bg-secondary border-4 border-primary" 
              : theme === "islamic"
              ? "bg-accent/15 border border-accent/40 rounded-lg shadow-sm"
              : theme === "shounen"
              ? "bg-yellow-50 border-3 border-yellow-400 rounded-xl shadow-md"
              : "bg-secondary/60 border border-yellow-500/40 glow-accent"
            }
          `}>
            <Coins className={`w-7 h-7 ${theme === "islamic" ? "text-accent" : "text-yellow-500"}`} />
            <div className="text-right">
              <span className={`font-extrabold text-xl font-display ${theme === "islamic" ? "text-accent" : "text-yellow-500"}`}>
                {coins.toLocaleString()}
              </span>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${
                theme === "shounen" || theme === "islamic" ? "text-gray-600" : "text-gray-400"
              }`}>Coins</div>
            </div>
          </div>

          {/* Energy */}
          <div className={`
            flex items-center gap-3 px-6 py-4
            ${theme === "pixel" 
              ? "bg-secondary border-4 border-accent" 
              : theme === "islamic"
              ? "bg-primary/15 border border-primary/40 rounded-lg shadow-sm"
              : theme === "shounen"
              ? "bg-blue-50 border-3 border-blue-400 rounded-xl shadow-md"
              : "bg-secondary/60 border border-primary/40 glow-primary"
            }
          `}>
            <Zap className={`w-7 h-7 ${theme === "shounen" ? "text-blue-500" : "text-primary"} ${theme === "tactical" ? "animate-glow-pulse" : ""}`} />
            <div>
              <span className={`font-extrabold text-xl font-display ${theme === "shounen" ? "text-blue-600" : "text-primary"}`}>
                {energy}/{maxEnergy}
              </span>
              <div className={`w-20 h-2 mt-1.5 ${theme === "pixel" ? "border-2 border-foreground bg-secondary" : "bg-secondary/80 rounded-full"}`}>
                <div
                  className={`h-full ${theme === "shounen" ? "bg-blue-500" : "bg-primary"} ${theme === "pixel" ? "" : "rounded-full"} transition-all duration-300`}
                  style={{ width: `${energyPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
