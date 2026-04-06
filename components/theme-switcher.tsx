"use client"

import { useTheme, ThemeType, themeConfigs } from "@/contexts/theme-context"
import { Crosshair, Flame, Gamepad2, BookOpen } from "lucide-react"

const themeIcons: Record<ThemeType, React.ReactNode> = {
  tactical: <Crosshair className="w-4 h-4" />,
  shounen: <Flame className="w-4 h-4" />,
  pixel: <Gamepad2 className="w-4 h-4" />,
  islamic: <BookOpen className="w-4 h-4" />,
}

const themeOrder: ThemeType[] = ["tactical", "shounen", "pixel", "islamic"]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1.5 bg-secondary/50 backdrop-blur-sm border border-border/50 rounded-lg">
      {themeOrder.map((t) => {
        const config = themeConfigs[t]
        const isActive = theme === t
        
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300
              ${isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }
            `}
            title={config.description}
          >
            <span className={isActive ? "animate-pulse" : ""}>{themeIcons[t]}</span>
            <span className="hidden lg:inline text-xs font-semibold uppercase tracking-wider">
              {config.name.split(' ')[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
