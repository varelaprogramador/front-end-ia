"use client"

import { useEffect, useState } from "react"

interface AIHeadPreloaderProps {
  onComplete?: () => void
  duration?: number
}

export function AIHeadPreloader({ onComplete, duration = 3000 }: AIHeadPreloaderProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          if (onComplete) {
            setTimeout(onComplete, 500)
          }
          return 100
        }
        return prev + 2
      })
    }, duration / 50)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg viewBox="0 0 128 128" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Robot head base - appears first */}
            <rect
              x="24"
              y="34"
              width="80"
              height="60"
              rx="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-primary"
              style={{
                strokeDasharray: "276",
                strokeDashoffset: `${276 - (276 * Math.min(progress, 25)) / 25}`,
                transition: "stroke-dashoffset 0.1s ease-out",
              }}
            />

            {/* Antennas - appear second */}
            {progress > 25 && (
              <g className="text-secondary">
                <line
                  x1="45"
                  y1="34"
                  x2="45"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    strokeDasharray: "14",
                    strokeDashoffset: `${14 - (14 * Math.min(progress - 25, 25)) / 25}`,
                    transition: "stroke-dashoffset 0.1s ease-out",
                  }}
                />
                <line
                  x1="83"
                  y1="34"
                  x2="83"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    strokeDasharray: "14",
                    strokeDashoffset: `${14 - (14 * Math.min(progress - 25, 25)) / 25}`,
                    transition: "stroke-dashoffset 0.1s ease-out",
                  }}
                />
                {/* Antenna tips */}
                <circle
                  cx="45"
                  cy="18"
                  r="2"
                  fill="currentColor"
                  style={{
                    opacity: Math.min((progress - 35) / 15, 1),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
                <circle
                  cx="83"
                  cy="18"
                  r="2"
                  fill="currentColor"
                  style={{
                    opacity: Math.min((progress - 35) / 15, 1),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
              </g>
            )}

            {/* Robot eyes - appear third */}
            {progress > 50 && (
              <g className="text-accent">
                <rect
                  x="38"
                  y="48"
                  width="12"
                  height="8"
                  rx="2"
                  fill="currentColor"
                  style={{
                    opacity: Math.min((progress - 50) / 25, 1),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
                <rect
                  x="78"
                  y="48"
                  width="12"
                  height="8"
                  rx="2"
                  fill="currentColor"
                  style={{
                    opacity: Math.min((progress - 50) / 25, 1),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
                {/* Eye glow effect */}
                <rect
                  x="36"
                  y="46"
                  width="16"
                  height="12"
                  rx="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  style={{
                    opacity: Math.min((progress - 60) / 15, 0.5),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
                <rect
                  x="76"
                  y="46"
                  width="16"
                  height="12"
                  rx="4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  style={{
                    opacity: Math.min((progress - 60) / 15, 0.5),
                    transition: "opacity 0.2s ease-out",
                  }}
                />
              </g>
            )}

            {/* Robot details - appear last */}
            {progress > 75 && (
              <g className="text-chart-1">
                {/* Mouth grille */}
                <rect
                  x="50"
                  y="70"
                  width="28"
                  height="8"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                  style={{
                    strokeDasharray: "72",
                    strokeDashoffset: `${72 - (72 * Math.min(progress - 75, 25)) / 25}`,
                    transition: "stroke-dashoffset 0.1s ease-out",
                  }}
                />
                {/* Grille lines */}
                <line x1="55" y1="70" x2="55" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
                <line x1="60" y1="70" x2="60" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
                <line x1="65" y1="70" x2="65" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
                <line x1="70" y1="70" x2="70" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
                <line x1="73" y1="70" x2="73" y2="78" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />

                {/* Screws/bolts */}
                <circle cx="30" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
                <circle cx="98" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
                <circle cx="30" cy="88" r="1.5" fill="currentColor" opacity="0.6" />
                <circle cx="98" cy="88" r="1.5" fill="currentColor" opacity="0.6" />
              </g>
            )}
          </svg>

          {/* Pulsing effect when complete */}
          {progress === 100 && <div className="absolute inset-0 rounded-lg bg-primary/10 animate-ping" />}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-muted rounded-full mx-auto mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">Montando Robô</p>
          <p className="text-sm text-muted-foreground">
            {progress < 25 && "Construindo chassi..."}
            {progress >= 25 && progress < 50 && "Instalando antenas..."}
            {progress >= 50 && progress < 75 && "Ativando sensores visuais..."}
            {progress >= 75 && progress < 100 && "Finalizando montagem..."}
            {progress === 100 && "Robô operacional!"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{progress}%</p>
        </div>
      </div>
    </div>
  )
}
