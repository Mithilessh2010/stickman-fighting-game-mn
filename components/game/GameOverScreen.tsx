'use client'

import { useEffect, useState } from 'react'

interface GameOverScreenProps {
  result: 'win' | 'lose'
  stageReached: number
  totalStages: number
  playerName: string
  opponentName: string
  onReturnMenu: () => void
}

export default function GameOverScreen({
  result,
  stageReached,
  totalStages,
  playerName,
  opponentName,
  onReturnMenu,
}: GameOverScreenProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const isVictory = result === 'win'

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-background relative overflow-hidden">
      {/* Background effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: isVictory
            ? 'radial-gradient(circle at 50% 40%, hsl(45, 100%, 55%), transparent 60%)'
            : 'radial-gradient(circle at 50% 40%, hsl(0, 75%, 40%), transparent 60%)',
        }}
      />

      <div
        className="relative text-center transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        {/* Result title */}
        <h1
          className="text-5xl md:text-7xl font-mono font-bold mb-4"
          style={{
            color: isVictory ? 'hsl(45, 100%, 55%)' : 'hsl(0, 75%, 55%)',
            textShadow: isVictory
              ? '0 0 40px hsl(45 100% 55% / 0.5)'
              : '0 0 40px hsl(0 75% 55% / 0.5)',
          }}
        >
          {isVictory ? 'VICTORY' : 'DEFEATED'}
        </h1>

        <p className="text-muted-foreground text-lg font-mono mb-2">
          {isVictory
            ? `${playerName} has conquered all challenges!`
            : `${playerName} fell to ${opponentName}`}
        </p>

        {/* Stage progress */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground font-mono mb-3">
            STAGES CLEARED: {isVictory ? totalStages : stageReached} / {totalStages}
          </p>
          <div className="flex gap-1.5 justify-center flex-wrap max-w-md mx-auto">
            {Array.from({ length: totalStages }, (_, i) => (
              <div
                key={i}
                className="w-6 h-2 rounded-sm"
                style={{
                  backgroundColor: i < (isVictory ? totalStages : stageReached)
                    ? 'hsl(var(--primary))'
                    : i === stageReached && !isVictory
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--muted))',
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        {isVictory && (
          <div className="mb-8 p-4 rounded-lg border border-border bg-card inline-block">
            <p className="text-xs text-muted-foreground font-mono">CAMPAIGN COMPLETE</p>
            <p className="text-accent font-mono font-bold text-lg mt-1">FLAWLESS RUN</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onReturnMenu}
            className="px-8 py-3 rounded-lg font-mono text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all hover:scale-105"
            style={{
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
            }}
          >
            RETURN TO MENU
          </button>
          <p className="text-xs text-muted-foreground font-mono">NO RETRIES. THAT IS THE WAY.</p>
        </div>
      </div>
    </div>
  )
}
