'use client'

import { useEffect, useState } from 'react'
import type { StageConfig } from '@/lib/game/types'
import { getCharacter } from '@/lib/game/characters'

interface StageIntroProps {
  stage: StageConfig
  stageNumber: number
  totalStages: number
  playerCharName: string
  onReady: () => void
}

export default function StageIntro({
  stage,
  stageNumber,
  totalStages,
  playerCharName,
  onReady,
}: StageIntroProps) {
  const [phase, setPhase] = useState(0)
  const opponent = getCharacter(stage.opponent)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Background effect for boss */}
      {stage.isBoss && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${opponent.color}, transparent 70%)`,
          }}
        />
      )}

      <div className="relative text-center max-w-md mx-auto px-6">
        {/* Stage number */}
        <div
          className="transition-all duration-500"
          style={{ opacity: phase >= 0 ? 1 : 0, transform: phase >= 0 ? 'translateY(0)' : 'translateY(-20px)' }}
        >
          <p className="text-muted-foreground text-xs font-mono tracking-widest mb-1">
            STAGE {stageNumber} OF {totalStages}
          </p>
          <div className="flex gap-1 justify-center mb-6">
            {Array.from({ length: totalStages }, (_, i) => (
              <div
                key={i}
                className="h-1 rounded-full"
                style={{
                  width: i === stageNumber - 1 ? '24px' : '8px',
                  backgroundColor: i < stageNumber - 1
                    ? 'hsl(var(--primary))'
                    : i === stageNumber - 1
                      ? stage.isBoss ? opponent.color : 'hsl(var(--primary))'
                      : 'hsl(var(--muted))',
                }}
              />
            ))}
          </div>
        </div>

        {/* Stage name */}
        <div
          className="transition-all duration-500"
          style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)' }}
        >
          {stage.isBoss && (
            <p className="text-destructive text-xs font-mono font-bold tracking-widest mb-2 animate-pulse">
              BOSS FIGHT
            </p>
          )}
          <h2
            className="text-3xl md:text-4xl font-mono font-bold mb-2 text-balance"
            style={{ color: stage.isBoss ? opponent.color : 'hsl(var(--foreground))' }}
          >
            {stage.name}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">{stage.description}</p>
        </div>

        {/* Matchup */}
        <div
          className="transition-all duration-500"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'scale(1)' : 'scale(0.9)' }}
        >
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono mb-1">YOU</p>
              <p className="font-mono font-bold text-primary text-lg">{playerCharName}</p>
            </div>
            <span className="text-2xl font-mono font-bold text-destructive">VS</span>
            <div className="text-center">
              <div>
                <p className="text-xs text-muted-foreground font-mono mb-1">
                  {stage.isBoss ? 'BOSS' : 'ENEMY'}
                </p>
                <p className="font-mono font-bold text-lg" style={{ color: opponent.color }}>
                  {opponent.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ready button */}
        <div
          className="transition-all duration-500"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)' }}
        >
          <button
            onClick={onReady}
            className="px-10 py-3 rounded-lg font-mono text-sm font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: stage.isBoss ? opponent.color : 'hsl(var(--primary))',
              color: stage.isBoss ? '#000' : 'hsl(var(--primary-foreground))',
              boxShadow: stage.isBoss
                ? `0 0 30px ${opponent.color}44`
                : '0 0 20px hsl(var(--primary) / 0.3)',
            }}
          >
            FIGHT
          </button>
        </div>
      </div>
    </div>
  )
}
