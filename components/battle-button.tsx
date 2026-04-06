"use client"

import { useState } from "react"
import { Swords, Atom, FlaskConical, Calculator, BookOpen, Play, Zap } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import Image from "next/image"

const subjects = [
  { 
    id: "physics", 
    name: "Physics", 
    icon: Atom,
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&h=120&fit=crop"
  },
  { 
    id: "chemistry", 
    name: "Chemistry", 
    icon: FlaskConical,
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=120&fit=crop"
  },
  { 
    id: "math", 
    name: "Mathematics", 
    icon: Calculator,
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=200&h=120&fit=crop"
  },
  { 
    id: "biology", 
    name: "Biology", 
    icon: BookOpen,
    image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=200&h=120&fit=crop"
  },
]

export function BattleButton() {
  const { theme } = useTheme()
  const [selectedSubject, setSelectedSubject] = useState(subjects[0])
  const [isSearching, setIsSearching] = useState(false)

  const handleBattle = () => {
    setIsSearching(true)
    setTimeout(() => setIsSearching(false), 3000)
  }

  const getButtonText = () => {
    if (isSearching) {
      switch (theme) {
        case "shounen": return "SEARCHING...!"
        case "pixel": return "FINDING..."
        case "islamic": return "Seeking Match..."
        default: return "Searching..."
      }
    }
    switch (theme) {
      case "shounen": return "BATTLE NOW!"
      case "pixel": return "START!"
      case "islamic": return "Begin Challenge"
      default: return "Find 1v1 Battle"
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Subject Selection - Card Grid */}
      <div className="w-full">
        <label className={`
          block text-xs font-extrabold uppercase tracking-widest mb-4 text-center
          ${theme === "islamic" ? "text-primary" : ""}
          ${theme === "shounen" ? "text-gray-800" : ""}
          ${theme === "tactical" || theme === "pixel" ? "text-gray-300" : ""}
        `}>
          Select Subject
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject)}
              className={`
                relative overflow-hidden transition-all duration-300 group p-4
                ${theme === "pixel" 
                  ? "border-4" 
                  : theme === "islamic"
                  ? "border-2 rounded-xl"
                  : theme === "shounen"
                  ? "border-3 rounded-xl"
                  : "border-2 rounded-sm"
                }
                ${selectedSubject.id === subject.id 
                  ? theme === "pixel"
                    ? "border-primary bg-primary/25"
                    : theme === "shounen"
                    ? "border-primary bg-primary/15 shadow-xl"
                    : theme === "islamic"
                    ? "border-primary bg-primary/10"
                    : "border-primary bg-primary/15 glow-primary"
                  : theme === "shounen" || theme === "islamic"
                    ? "border-border/60 hover:border-primary/60 bg-card/80"
                    : "border-border/50 hover:border-primary/50 bg-card/60"
                }
              `}
            >
              {/* Background image for tactical/shounen */}
              {(theme === "tactical" || theme === "shounen") && (
                <div className="absolute inset-0 opacity-25">
                  <Image
                    src={subject.image}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
              )}
              
              <div className="relative flex items-center gap-3">
                <subject.icon className={`
                  w-6 h-6 transition-colors
                  ${selectedSubject.id === subject.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"}
                `} />
                <span className={`
                  font-extrabold text-sm uppercase tracking-wider
                  ${selectedSubject.id === subject.id 
                    ? "text-primary" 
                    : theme === "shounen" || theme === "islamic" ? "text-gray-800" : "text-gray-200"
                  }
                `}>
                  {subject.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Battle Button */}
      <button
        onClick={handleBattle}
        disabled={isSearching}
        className={`
          relative group w-full py-6 font-extrabold text-xl md:text-2xl uppercase tracking-widest
          transition-all duration-300 transform
          ${isSearching 
            ? "opacity-80 cursor-not-allowed" 
            : "hover:scale-[1.03] active:scale-[0.98]"
          }
          ${theme === "pixel" 
            ? "bg-primary text-primary-foreground border-4 border-black" 
            : theme === "shounen"
            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-2xl manga-border"
            : theme === "islamic"
            ? "bg-primary text-primary-foreground rounded-xl shadow-lg"
            : "bg-primary text-primary-foreground glow-primary"
          }
        `}
      >
        {/* Glow effect */}
        {!isSearching && theme === "tactical" && (
          <div className="absolute inset-0 bg-primary/40 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Shounen action lines */}
        {theme === "shounen" && !isSearching && (
          <div className="absolute inset-0 action-lines opacity-40 rounded-xl" />
        )}

        {/* Button content */}
        <div className="relative flex items-center justify-center gap-4">
          {isSearching ? (
            <Swords className="w-7 h-7 animate-spin" />
          ) : theme === "shounen" ? (
            <Zap className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current" />
          )}
          <span>{getButtonText()}</span>
        </div>

        {/* Shimmer effect for tactical */}
        {!isSearching && theme === "tactical" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
      </button>

      {/* Secondary button */}
      <button className={`
        px-10 py-4 text-sm font-extrabold uppercase tracking-widest transition-all duration-300
        ${theme === "pixel"
          ? "border-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
          : theme === "shounen"
          ? "border-3 border-accent text-accent rounded-full hover:bg-accent hover:text-accent-foreground shadow-md"
          : theme === "islamic"
          ? "border-2 border-accent/60 text-accent rounded-xl hover:bg-accent/15"
          : "border-2 border-accent text-accent hover:bg-accent/15"
        }
      `}>
        <span className="flex items-center gap-3">
          <Swords className="w-5 h-5" />
          Explore Modes
        </span>
      </button>

      {/* Searching indicator */}
      {isSearching && (
        <div className={`flex items-center gap-3 font-bold ${
          theme === "shounen" || theme === "islamic" ? "text-gray-600" : "text-gray-400"
        }`}>
          <div className="flex gap-1.5">
            {theme === "pixel" ? (
              <span className="animate-blink text-primary text-lg">{">>>"}</span>
            ) : (
              <>
                <div className={`w-2.5 h-2.5 ${theme === "pixel" ? "" : "rounded-full"} bg-primary animate-bounce`} style={{ animationDelay: "0ms" }} />
                <div className={`w-2.5 h-2.5 ${theme === "pixel" ? "" : "rounded-full"} bg-primary animate-bounce`} style={{ animationDelay: "150ms" }} />
                <div className={`w-2.5 h-2.5 ${theme === "pixel" ? "" : "rounded-full"} bg-primary animate-bounce`} style={{ animationDelay: "300ms" }} />
              </>
            )}
          </div>
          <span className="uppercase tracking-wider text-sm">
            {theme === "islamic" ? "Seeking worthy challenger..." : "Finding worthy opponent"}
          </span>
        </div>
      )}
    </div>
  )
}
