'use client'

import { useState } from 'react'
import type { Difficulty } from '@/lib/game/types'
import { CAMPAIGNS } from '@/lib/game/stages'

interface DifficultySelectProps {
  onSelect: (difficulty: Difficulty) => void
  onBack: () => void
}

const DIFFICULTY_CONFIG: { id: Difficulty; label: string; color: string; stars: number }[] = [
  { id: 'easy', label: 'EASY', color: '#44cc44', stars: 1 },
  { id: 'normal', label: 'NORMAL', color: '#44aaff', stars: 2 },
  { id: 'hard', label: 'HARD', color: '#ff8844', stars: 3 },
  { id: 'legendary', label: 'LEGENDARY', color: '#ff4444', stars: 4 },
]

export default function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  const [hovered, setHovered] = useState<Difficulty | null>(null)

  const hoveredCampaign = hovered ? CAMPAIGNS[hovered] : null

  return (
    <div className="flex flex-col items-center justify-center h-dvh overflow-y-auto bg-background p-6">
      <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground mb-2 tracking-tight">SELECT DIFFICULTY</h2>
      <p className="text-muted-foreground text-sm mb-8 font-mono">ONE RUN. NO RETRIES. CHOOSE WISELY.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mb-8">
        {DIFFICULTY_CONFIG.map(diff => {
          const campaign = CAMPAIGNS[diff.id]
          return (
            <button
              key={diff.id}
              onClick={() => onSelect(diff.id)}
              onMouseEnter={() => setHovered(diff.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative text-left p-5 rounded-lg border border-border transition-all duration-200 hover:scale-[1.02]"
              style={{
                borderColor: hovered === diff.id ? diff.color : undefined,
                boxShadow: hovered === diff.id ? `0 0 25px ${diff.color}33` : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-lg" style={{ color: diff.color }}>
                  {diff.label}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14">
                      <polygon
                        points="7,1 9,5 13,5 10,8 11,12 7,10 3,12 4,8 1,5 5,5"
                        fill={i < diff.stars ? diff.color : 'hsl(var(--muted))'}
                        opacity={i < diff.stars ? 1 : 0.3}
                      />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{campaign.description}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{campaign.stages.length} STAGES / {campaign.stages.filter(s => s.isBoss).length} BOSSES</p>
              {hovered === diff.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ backgroundColor: diff.color }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Stage preview */}
      {hoveredCampaign && (
        <div className="w-full max-w-xl mb-6 p-4 rounded-lg border border-border bg-card">
          <h3 className="text-sm font-mono font-bold text-foreground mb-2">STAGE PATH</h3>
          <div className="flex flex-wrap gap-1.5">
            {hoveredCampaign.stages.map((stage, i) => (
              <div
                key={stage.name}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  backgroundColor: stage.isBoss ? 'hsl(var(--destructive) / 0.15)' : 'hsl(var(--muted))',
                  color: stage.isBoss ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
                  border: stage.isBoss ? '1px solid hsl(var(--destructive) / 0.3)' : '1px solid transparent',
                }}
              >
                {i + 1}. {stage.isBoss ? 'BOSS' : stage.name.split(' ').slice(-1)[0]}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="px-6 py-3 border border-border rounded-lg text-muted-foreground font-mono text-sm hover:border-foreground hover:text-foreground transition-all"
      >
        BACK
      </button>
    </div>
  )
}
