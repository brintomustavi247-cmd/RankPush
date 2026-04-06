"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type ThemeType = "tactical" | "shounen" | "pixel" | "islamic"

export interface ThemeConfig {
  id: ThemeType
  name: string
  description: string
  fontFamily: string
  backgroundImage?: string
}

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  tactical: {
    id: "tactical",
    name: "Tactical Esports",
    description: "Dark tactical UI with neon accents",
    fontFamily: "var(--font-rajdhani)",
  },
  shounen: {
    id: "shounen",
    name: "Shounen Anime",
    description: "Energetic manga-inspired style",
    fontFamily: "var(--font-rajdhani)",
  },
  pixel: {
    id: "pixel",
    name: "16-Bit Retro",
    description: "Nostalgic arcade vibes",
    fontFamily: "'Press Start 2P', monospace",
  },
  islamic: {
    id: "islamic",
    name: "Serene Scholar",
    description: "Calm & scholarly aesthetic",
    fontFamily: "'Amiri', serif",
  },
}

interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  config: ThemeConfig
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("tactical")

  useEffect(() => {
    const savedTheme = localStorage.getItem("rankpush-theme") as ThemeType
    if (savedTheme && Object.keys(themeConfigs).includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("rankpush-theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config: themeConfigs[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
