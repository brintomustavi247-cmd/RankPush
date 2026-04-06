"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/contexts/theme-context"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const particles: Particle[] = []
    // Different particle counts per theme
    const particleCount = theme === "pixel" ? 30 : theme === "islamic" ? 20 : 50

    const getParticleColors = () => {
      switch (theme) {
        case "tactical":
          return ["0, 212, 255", "255, 200, 50"] // Cyan + Yellow
        case "shounen":
          return ["255, 107, 0", "59, 130, 246"] // Orange + Blue
        case "pixel":
          return ["255, 215, 0", "255, 0, 255"] // Gold + Magenta
        case "islamic":
          return ["45, 90, 61", "201, 168, 76"] // Forest green + Gold
        default:
          return ["0, 212, 255", "255, 200, 50"]
      }
    }

    const colors = getParticleColors()

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (theme === "pixel" ? 0.5 : 0.3),
        vy: (Math.random() - 0.5) * (theme === "pixel" ? 0.5 : 0.3),
        size: theme === "pixel" ? 3 : Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        ctx.beginPath()
        
        if (theme === "pixel") {
          // Square particles for pixel theme
          ctx.fillStyle = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${particle.opacity})`
          ctx.fillRect(
            Math.floor(particle.x / 4) * 4, 
            Math.floor(particle.y / 4) * 4, 
            particle.size, 
            particle.size
          )
        } else if (theme === "islamic") {
          // Diamond shapes for islamic theme
          ctx.save()
          ctx.translate(particle.x, particle.y)
          ctx.rotate(Math.PI / 4)
          ctx.fillStyle = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${particle.opacity * 0.5})`
          ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2)
          ctx.restore()
        } else {
          // Circles for other themes
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${particle.opacity})`
          ctx.fill()
        }
      })

      // Draw connections only for tactical and shounen
      if (theme === "tactical" || theme === "shounen") {
        particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach((p2) => {
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(${colors[0]}, ${0.06 * (1 - distance / 100)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          })
        })
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [theme])

  // Don't show particles on Islamic theme (too subtle/distracting)
  if (theme === "islamic") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 geometric-pattern opacity-20" />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: theme === "pixel" ? 0.3 : 0.4 }}
    />
  )
}
