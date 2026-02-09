'use client'

import { useState, useEffect } from 'react'

interface MainMenuProps {
  onSinglePlayer: () => void
  onMultiplayer: () => void
  onControls: () => void
}

export default function MainMenu({ onSinglePlayer, onMultiplayer, onControls }: MainMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [animFrame, setAnimFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setAnimFrame(f => f + 1), 50)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { label: 'CAMPAIGN', desc: 'Fight through opponents in a one-try run', action: onSinglePlayer },
    { label: 'LOCAL VERSUS', desc: 'Battle a friend on the same device', action: onMultiplayer },
    { label: 'CONTROLS', desc: 'View key bindings and moves', action: onControls },
  ]

  const pulse = Math.sin(animFrame * 0.08) * 0.3 + 0.7

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Title */}
      <div className="relative mb-16 text-center">
        <h1
          className="text-6xl md:text-8xl font-mono font-bold tracking-tighter text-foreground"
          style={{ textShadow: `0 0 40px hsl(var(--primary) / ${pulse}), 0 0 80px hsl(var(--primary) / ${pulse * 0.5})` }}
        >
          STICK
          <span className="text-primary">FURY</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-3 font-mono tracking-widest">
          ANIME STICKMAN FIGHTING
        </p>
        <div
          className="mt-4 h-0.5 mx-auto bg-primary"
          style={{ width: `${60 + Math.sin(animFrame * 0.05) * 20}%`, opacity: pulse }}
        />
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-3 w-full max-w-md px-6 relative z-10">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={item.action}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
            className="group relative text-left px-6 py-4 border border-border rounded-lg transition-all duration-200 hover:border-primary hover:bg-primary/5"
            style={{
              borderColor: hoveredIndex === i ? 'hsl(var(--primary))' : undefined,
              boxShadow: hoveredIndex === i ? '0 0 20px hsl(var(--primary) / 0.2)' : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <svg
                width="20" height="20" viewBox="0 0 20 20" fill="none"
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
              >
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            {hoveredIndex === i && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-muted-foreground text-xs font-mono">PRESS ANY BUTTON TO START</p>
      </div>
    </div>
  )
}
