'use client'

import { useState, useEffect, useRef } from 'react'
import type { CharacterId } from '@/lib/game/types'
import { PLAYABLE_CHARACTERS, CHARACTER_LIST } from '@/lib/game/characters'

interface CharacterSelectProps {
  title: string
  subtitle?: string
  onSelect: (charId: CharacterId) => void
  onBack: () => void
  showP2?: boolean
  onP2Select?: (charId: CharacterId) => void
}

export default function CharacterSelect({ title, subtitle, onSelect, onBack, showP2, onP2Select }: CharacterSelectProps) {
  const [p1Selected, setP1Selected] = useState<CharacterId>('kaito')
  const [p2Selected, setP2Selected] = useState<CharacterId>('yuki')
  const [confirmed, setConfirmed] = useState(false)
  const [p2Confirmed, setP2Confirmed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  const selectedChar = PLAYABLE_CHARACTERS[p1Selected]
  const p2Char = showP2 ? PLAYABLE_CHARACTERS[p2Selected] : null

  // Draw stickman preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    const draw = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw stickman preview
      const drawPreview = (char: typeof selectedChar, x: number) => {
        const breathe = Math.sin(frame * 0.04) * 3
        ctx.save()
        ctx.translate(x, 180)

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(0, 2, 30, 8, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = char.color
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.shadowColor = char.color
        ctx.shadowBlur = 10

        // Head
        ctx.fillStyle = char.color
        ctx.beginPath()
        ctx.arc(0, -85 + breathe, 14, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = char.accentColor
        ctx.lineWidth = 2
        ctx.stroke()

        // Eyes
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(4, -87 + breathe, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(5, -87 + breathe, 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Body
        ctx.strokeStyle = char.color
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(0, -70 + breathe)
        ctx.lineTo(0, -25)
        ctx.stroke()

        // Arms - idle fighting stance
        const armSwing = Math.sin(frame * 0.05) * 5
        ctx.beginPath()
        ctx.moveTo(0, -60 + breathe)
        ctx.quadraticCurveTo(-20, -50, -30 + armSwing, -55 + breathe)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -60 + breathe)
        ctx.quadraticCurveTo(20, -50, 30 - armSwing, -55 + breathe)
        ctx.stroke()

        // Legs
        ctx.beginPath()
        ctx.moveTo(0, -25)
        ctx.quadraticCurveTo(-10, -10, -15, 0)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -25)
        ctx.quadraticCurveTo(10, -10, 15, 0)
        ctx.stroke()

        // Energy aura
        ctx.save()
        ctx.globalAlpha = 0.15 + Math.sin(frame * 0.06) * 0.1
        const aura = ctx.createRadialGradient(0, -45, 5, 0, -45, 50)
        aura.addColorStop(0, char.color)
        aura.addColorStop(1, 'transparent')
        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(0, -45, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        ctx.restore()
      }

      if (showP2 && p2Char) {
        drawPreview(selectedChar, 100)
        drawPreview(p2Char, 300)

        // VS text
        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('VS', 200, 130)
      } else {
        drawPreview(selectedChar, 200)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [selectedChar, p2Char, showP2])

  const handleConfirm = () => {
    if (showP2) {
      if (!confirmed) {
        setConfirmed(true)
        return
      }
      if (!p2Confirmed) {
        setP2Confirmed(true)
        onP2Select?.(p2Selected)
        onSelect(p1Selected)
        return
      }
    } else {
      onSelect(p1Selected)
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-mono font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>}
        {showP2 && (
          <p className="text-primary text-sm mt-1 font-mono">
            {!confirmed ? 'PLAYER 1 - SELECT YOUR FIGHTER' : !p2Confirmed ? 'PLAYER 2 - SELECT YOUR FIGHTER' : ''}
          </p>
        )}
      </div>

      {/* Character preview canvas */}
      <div className="mb-6">
        <canvas ref={canvasRef} width={showP2 ? 400 : 400} height={220} className="rounded-lg" />
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-5 gap-3 mb-6 w-full max-w-2xl">
        {CHARACTER_LIST.map(id => {
          const char = PLAYABLE_CHARACTERS[id]
          const isP1 = p1Selected === id
          const isP2 = showP2 && p2Selected === id
          const selectingP2 = showP2 && confirmed && !p2Confirmed

          return (
            <button
              key={id}
              onClick={() => {
                if (selectingP2) setP2Selected(id)
                else setP1Selected(id)
              }}
              className="relative flex flex-col items-center p-3 md:p-4 rounded-lg border border-border transition-all duration-200 hover:scale-105"
              style={{
                borderColor: isP1 ? char.color : isP2 ? char.color : undefined,
                boxShadow: (isP1 || isP2) ? `0 0 20px ${char.color}44, inset 0 0 20px ${char.color}11` : undefined,
                background: (isP1 || isP2) ? `${char.color}08` : undefined,
              }}
            >
              {/* Mini stickman icon */}
              <svg width="40" height="50" viewBox="0 0 40 50">
                <circle cx="20" cy="10" r="6" fill={char.color} />
                <line x1="20" y1="16" x2="20" y2="32" stroke={char.color} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="20" x2="10" y2="26" stroke={char.color} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="20" x2="30" y2="26" stroke={char.color} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="32" x2="12" y2="45" stroke={char.color} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="32" x2="28" y2="45" stroke={char.color} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-mono font-bold text-foreground mt-1">{char.name}</span>
              {isP1 && <span className="absolute -top-2 -left-2 text-xs font-bold px-1.5 py-0.5 rounded text-foreground" style={{ backgroundColor: char.color }}>P1</span>}
              {isP2 && <span className="absolute -top-2 -right-2 text-xs font-bold px-1.5 py-0.5 rounded text-foreground" style={{ backgroundColor: char.color }}>P2</span>}
            </button>
          )
        })}
      </div>

      {/* Selected character info */}
      <div className="w-full max-w-2xl mb-6 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-mono font-bold" style={{ color: selectedChar.color }}>
              {(!showP2 || !confirmed) ? selectedChar.name : p2Char?.name}
            </h3>
            <p className="text-sm text-muted-foreground italic">
              {(!showP2 || !confirmed) ? selectedChar.title : p2Char?.title}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {(!showP2 || !confirmed) ? selectedChar.description : p2Char?.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          {(['maxHp', 'attack', 'defense', 'speed', 'comboRate'] as const).map(stat => {
            const char = (!showP2 || !confirmed) ? selectedChar : p2Char!
            const val = char.stats[stat]
            const max = stat === 'maxHp' ? 1400 : 100
            const ratio = val / max
            const label = stat === 'maxHp' ? 'HP' : stat === 'comboRate' ? 'COMBO' : stat.toUpperCase()
            return (
              <div key={stat} className="text-center">
                <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${ratio * 100}%`, backgroundColor: char.color }}
                  />
                </div>
                <p className="text-xs font-mono mt-0.5 text-foreground">{val}</p>
              </div>
            )
          })}
        </div>

        {/* Specials */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {((!showP2 || !confirmed) ? selectedChar : p2Char!).specials.map((s, i) => (
            <div key={s.name} className="text-xs p-2 rounded bg-muted/50">
              <span className="font-mono font-bold text-primary">SP{i + 1}:</span>{' '}
              <span className="text-foreground">{s.name}</span>
              <span className="text-muted-foreground ml-1">({s.damage} DMG)</span>
            </div>
          ))}
        </div>

        {/* Ultimate */}
        <div className="mt-2 text-xs p-2 rounded border border-primary/30 bg-primary/5">
          <span className="font-mono font-bold text-primary">ULT:</span>{' '}
          <span className="text-foreground">
            {((!showP2 || !confirmed) ? selectedChar : p2Char!).ultimate.name}
          </span>
          <span className="text-muted-foreground ml-1">
            ({((!showP2 || !confirmed) ? selectedChar : p2Char!).ultimate.damage} DMG)
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-border rounded-lg text-muted-foreground font-mono text-sm hover:border-foreground hover:text-foreground transition-all"
        >
          BACK
        </button>
        <button
          onClick={handleConfirm}
          className="px-8 py-3 rounded-lg font-mono text-sm font-bold transition-all hover:scale-105"
          style={{
            backgroundColor: selectedChar.color,
            color: '#000',
            boxShadow: `0 0 20px ${selectedChar.color}44`,
          }}
        >
          {showP2 ? (confirmed ? (p2Confirmed ? 'START' : 'CONFIRM P2') : 'CONFIRM P1') : 'SELECT FIGHTER'}
        </button>
      </div>
    </div>
  )
}
