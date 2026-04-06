"use client"

import { ThemeSwitcher } from "./theme-switcher"
import { Gamepad2, Settings, Bell, Menu, X, BookOpen, Swords, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/contexts/theme-context"

const navLinks = [
  { label: "Home", href: "#", active: false },
  { label: "Battles", href: "#", active: true },
  { label: "Leaderboard", href: "#", active: false },
  { label: "Profile", href: "#", active: false },
]

export function Navbar() {
  const { theme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getLogo = () => {
    switch (theme) {
      case "shounen":
        return <Sparkles className="w-6 h-6 text-primary" />
      case "pixel":
        return <Gamepad2 className="w-6 h-6 text-primary" />
      case "islamic":
        return <BookOpen className="w-6 h-6 text-primary" />
      default:
        return <Swords className="w-6 h-6 text-primary" />
    }
  }

  const getLogoText = () => {
    switch (theme) {
      case "shounen":
        return "RANKPUSH!"
      case "pixel":
        return "RANKPUSH"
      case "islamic":
        return "RankPush Varsity"
      default:
        return "RANKPUSH"
    }
  }

  return (
    <nav className={`
      sticky top-0 z-50 backdrop-blur-xl border-b
      ${theme === "shounen" 
        ? "bg-background/95 border-primary/30" 
        : theme === "pixel"
        ? "bg-background border-primary border-b-4"
        : theme === "islamic"
        ? "bg-background/95 border-border/30"
        : "bg-background/80 border-border/30"
      }
    `}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`
              relative p-2 transition-transform hover:scale-105
              ${theme === "pixel" ? "border-2 border-primary" : ""}
            `}>
              {getLogo()}
            </div>
            <span className={`
              font-bold font-display tracking-wider
              ${theme === "shounen" ? "text-xl text-primary italic" : ""}
              ${theme === "pixel" ? "text-xs" : "text-sm"}
              ${theme === "islamic" ? "text-base" : ""}
              ${theme === "tactical" ? "text-sm uppercase tracking-[0.2em]" : ""}
            `}>
              {getLogoText()}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`
                  text-sm uppercase tracking-wider transition-all duration-200
                  ${link.active 
                    ? theme === "shounen"
                      ? "text-primary font-bold border-b-2 border-primary pb-1"
                      : theme === "pixel"
                      ? "text-primary font-bold"
                      : theme === "islamic"
                      ? "text-primary font-semibold"
                      : "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />

            <div className="flex items-center gap-1">
              <button className={`
                relative p-2 transition-colors
                ${theme === "pixel" ? "hover:bg-primary/20" : "hover:bg-secondary/50 rounded-lg"}
              `}>
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                <span className={`
                  absolute top-1 right-1 w-2 h-2 bg-primary animate-pulse
                  ${theme === "pixel" ? "" : "rounded-full"}
                `} />
              </button>
              <button className={`
                p-2 transition-colors
                ${theme === "pixel" ? "hover:bg-primary/20" : "hover:bg-secondary/50 rounded-lg"}
              `}>
                <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`
              md:hidden p-2 transition-colors
              ${theme === "pixel" ? "border-2 border-foreground" : "hover:bg-secondary/50 rounded-lg"}
            `}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border/30 space-y-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`
                    px-4 py-3 text-sm uppercase tracking-wider transition-colors
                    ${link.active 
                      ? "text-primary font-bold bg-primary/10" 
                      : "text-muted-foreground hover:bg-secondary/50"
                    }
                    ${theme === "pixel" ? "" : "rounded-lg"}
                  `}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-2 border-t border-border/30">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
