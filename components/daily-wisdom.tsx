"use client"

import { BookOpen, Heart, RefreshCw } from "lucide-react"
import { useState } from "react"

const wisdomQuotes = [
  {
    text: "Seek knowledge from the cradle to the grave.",
    source: "Prophet Muhammad (PBUH)",
    arabic: "اطلبوا العلم من المهد إلى اللحد"
  },
  {
    text: "The ink of the scholar is more sacred than the blood of the martyr.",
    source: "Prophet Muhammad (PBUH)",
    arabic: "مداد العلماء أفضل من دماء الشهداء"
  },
  {
    text: "He who travels in search of knowledge travels along Allah's path to paradise.",
    source: "Prophet Muhammad (PBUH)",
    arabic: "من سلك طريقا يلتمس فيه علما سهل الله له به طريقا إلى الجنة"
  },
  {
    text: "The best among you are those who learn the Quran and teach it.",
    source: "Prophet Muhammad (PBUH)",
    arabic: "خيركم من تعلم القرآن وعلمه"
  },
  {
    text: "Knowledge is the life of the mind.",
    source: "Imam Ali (RA)",
    arabic: "العلم حياة العقول"
  },
]

export function DailyWisdom() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const quote = wisdomQuotes[currentIndex]

  const nextQuote = () => {
    setCurrentIndex((prev) => (prev + 1) % wisdomQuotes.length)
    setIsLiked(false)
  }

  return (
    <div className="theme-card overflow-hidden h-full rounded-lg">
      {/* Header with geometric pattern */}
      <div className="relative px-5 py-4 border-b border-border/30 bg-primary/5">
        <div className="absolute inset-0 geometric-pattern opacity-30" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base font-display">Daily Wisdom</h3>
          </div>
          <button 
            onClick={nextQuote}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors"
            title="Next quote"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Quote Content */}
      <div className="p-6 space-y-6">
        {/* Arabic Text */}
        <div className="text-center">
          <p className="text-2xl text-primary/80 leading-relaxed font-arabic" dir="rtl">
            {quote.arabic}
          </p>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/50" />
          <div className="w-2 h-2 rotate-45 bg-accent/50" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        {/* English Translation */}
        <blockquote className="text-center">
          <p className="text-lg text-foreground leading-relaxed italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="mt-4">
            <cite className="text-sm text-accent not-italic font-semibold">
              — {quote.source}
            </cite>
          </footer>
        </blockquote>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/30">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
              ${isLiked 
                ? "bg-red-50 text-red-500 border border-red-200" 
                : "bg-secondary/50 text-muted-foreground hover:text-red-500 border border-border/30"
              }
            `}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm font-medium">
              {isLiked ? "Saved" : "Save"}
            </span>
          </button>
          
          <div className="text-xs text-muted-foreground">
            {currentIndex + 1} of {wisdomQuotes.length}
          </div>
        </div>
      </div>

      {/* Bottom decorative border */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
    </div>
  )
}
