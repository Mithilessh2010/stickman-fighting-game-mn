'use client'

import { useCallback, useRef } from 'react'
import type { GameEngine } from '@/lib/game/engine'

interface MobileControlsProps {
  engine: GameEngine
}

export default function MobileControls({ engine }: MobileControlsProps) {
  const engineRef = useRef(engine)
  engineRef.current = engine

  const press = useCallback((key: string) => {
    const inp = engineRef.current.p1Input as Record<string, boolean>
    inp[key] = true
    if (['light', 'heavy', 'special', 'ultimate', 'dodge'].includes(key)) {
      inp[key + 'Pressed'] = true
    }
  }, [])

  const release = useCallback((key: string) => {
    const inp = engineRef.current.p1Input as Record<string, boolean>
    inp[key] = false
  }, [])

  const btnClass = "select-none touch-none flex items-center justify-center rounded-lg border border-border active:scale-95 active:opacity-80 transition-transform"

  return (
    <div className="flex items-center justify-between w-full px-3 py-2 bg-card/80 backdrop-blur-sm border-t border-border">
      {/* D-pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-28 h-28">
        <div />
        <button
          className={`${btnClass} bg-muted text-foreground text-xs font-mono`}
          onTouchStart={() => press('up')}
          onTouchEnd={() => release('up')}
          onMouseDown={() => press('up')}
          onMouseUp={() => release('up')}
          aria-label="Jump"
        >
          W
        </button>
        <div />
        <button
          className={`${btnClass} bg-muted text-foreground text-xs font-mono`}
          onTouchStart={() => press('left')}
          onTouchEnd={() => release('left')}
          onMouseDown={() => press('left')}
          onMouseUp={() => release('left')}
          aria-label="Move left"
        >
          A
        </button>
        <div />
        <button
          className={`${btnClass} bg-muted text-foreground text-xs font-mono`}
          onTouchStart={() => press('right')}
          onTouchEnd={() => release('right')}
          onMouseDown={() => press('right')}
          onMouseUp={() => release('right')}
          aria-label="Move right"
        >
          D
        </button>
        <div />
        <button
          className={`${btnClass} bg-muted text-foreground text-xs font-mono`}
          onTouchStart={() => press('down')}
          onTouchEnd={() => release('down')}
          onMouseDown={() => press('down')}
          onMouseUp={() => release('down')}
          aria-label="Crouch"
        >
          S
        </button>
        <div />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <button
            className={`${btnClass} w-12 h-12 bg-primary/20 text-primary text-xs font-mono font-bold`}
            onTouchStart={() => press('light')}
            onTouchEnd={() => release('light')}
            onMouseDown={() => press('light')}
            onMouseUp={() => release('light')}
            aria-label="Light attack"
          >
            J
          </button>
          <button
            className={`${btnClass} w-12 h-12 bg-destructive/20 text-destructive text-xs font-mono font-bold`}
            onTouchStart={() => press('heavy')}
            onTouchEnd={() => release('heavy')}
            onMouseDown={() => press('heavy')}
            onMouseUp={() => release('heavy')}
            aria-label="Heavy attack"
          >
            K
          </button>
          <button
            className={`${btnClass} w-12 h-12 bg-accent/20 text-accent text-xs font-mono font-bold`}
            onTouchStart={() => press('special')}
            onTouchEnd={() => release('special')}
            onMouseDown={() => press('special')}
            onMouseUp={() => release('special')}
            aria-label="Special move"
          >
            SP
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            className={`${btnClass} w-12 h-12 bg-muted text-foreground text-xs font-mono`}
            onTouchStart={() => press('block')}
            onTouchEnd={() => release('block')}
            onMouseDown={() => press('block')}
            onMouseUp={() => release('block')}
            aria-label="Block"
          >
            BLK
          </button>
          <button
            className={`${btnClass} w-12 h-12 bg-muted text-foreground text-xs font-mono`}
            onTouchStart={() => press('dodge')}
            onTouchEnd={() => release('dodge')}
            onMouseDown={() => press('dodge')}
            onMouseUp={() => release('dodge')}
            aria-label="Dodge"
          >
            DGE
          </button>
          <button
            className={`${btnClass} w-12 h-12 text-xs font-mono font-bold`}
            style={{
              backgroundColor: 'hsl(45, 100%, 55%, 0.2)',
              color: 'hsl(45, 100%, 55%)',
            }}
            onTouchStart={() => press('ultimate')}
            onTouchEnd={() => release('ultimate')}
            onMouseDown={() => press('ultimate')}
            onMouseUp={() => release('ultimate')}
            aria-label="Ultimate attack"
          >
            ULT
          </button>
        </div>
      </div>
    </div>
  )
}
