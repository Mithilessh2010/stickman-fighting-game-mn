'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { GameEngine } from '@/lib/game/engine'
import { tick, handleKeyDown, handleKeyUp, clearPressedFlags } from '@/lib/game/engine'
import { renderGame, drawIntroOverlay, drawRoundEndOverlay } from '@/lib/game/renderer'

interface GameCanvasProps {
  engine: GameEngine
  onMatchEnd?: (winner: 'player1' | 'player2') => void
}

export default function GameCanvas({ engine, onMatchEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const engineRef = useRef(engine)

  useEffect(() => {
    engineRef.current = engine
  }, [engine])

  useEffect(() => {
    engine.onMatchEnd = onMatchEnd
  }, [engine, onMatchEnd])

  const gameLoop = useCallback(() => {
    const eng = engineRef.current
    const canvas = canvasRef.current
    if (!canvas || !eng) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Update
    tick(eng)
    clearPressedFlags(eng)

    // Render
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    renderGame(ctx, eng.state, w, h)

    // Phase overlays
    if (eng.state.phase === 'intro') {
      drawIntroOverlay(ctx, eng.state, w, h)
    }
    if (eng.state.phase === 'round_end') {
      const winner = eng.state.player1Wins > eng.state.player2Wins
        ? eng.state.player1.character.name
        : eng.state.player2.character.name
      drawRoundEndOverlay(ctx, eng.state, w, h, winner)
    }

    animFrameRef.current = requestAnimationFrame(gameLoop)
  }, [])

  useEffect(() => {
    // Resize canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      const aspectRatio = 960 / 540
      let w = rect.width
      let h = w / aspectRatio
      if (h > rect.height) {
        h = rect.height
        w = h * aspectRatio
      }
      canvas.width = Math.floor(w * window.devicePixelRatio)
      canvas.height = Math.floor(h * window.devicePixelRatio)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Start game loop
    animFrameRef.current = requestAnimationFrame(gameLoop)

    // Input handlers
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      handleKeyDown(engineRef.current, e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault()
      handleKeyUp(engineRef.current, e.code)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gameLoop])

  return (
    <div className="flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="block rounded-lg"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  )
}
