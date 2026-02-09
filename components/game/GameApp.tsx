'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import type { CharacterId, Difficulty, GameMode } from '@/lib/game/types'
import { CAMPAIGNS } from '@/lib/game/stages'
import { createEngine, type GameEngine } from '@/lib/game/engine'
import { getCharacter } from '@/lib/game/characters'
import MainMenu from './MainMenu'
import CharacterSelect from './CharacterSelect'
import DifficultySelect from './DifficultySelect'
import ControlsScreen from './ControlsScreen'
import StageIntro from './StageIntro'
import GameCanvas from './GameCanvas'
import MobileControls from './MobileControls'
import GameOverScreen from './GameOverScreen'

export default function GameApp() {
  const [mode, setMode] = useState<GameMode>('menu')
  const [playerChar, setPlayerChar] = useState<CharacterId>('kaito')
  const [p2Char, setP2Char] = useState<CharacterId>('yuki')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [campaignStage, setCampaignStage] = useState(0)
  const [gameResult, setGameResult] = useState<'win' | 'lose'>('lose')
  const [engine, setEngine] = useState<GameEngine | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [gameMode, setGameMode] = useState<'single' | 'local_multi'>('single')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const campaign = useMemo(() => difficulty ? CAMPAIGNS[difficulty] : null, [difficulty])

  const resetToMenu = useCallback(() => {
    setMode('menu')
    setEngine(null)
    setCampaignStage(0)
  }, [])

  // Start single player campaign
  const startCampaign = useCallback((charId: CharacterId) => {
    setPlayerChar(charId)
    setMode('difficulty_select')
  }, [])

  const startCampaignWithDifficulty = useCallback((diff: Difficulty) => {
    setDifficulty(diff)
    setCampaignStage(0)
    setMode('campaign')
  }, [])

  // Start a campaign stage fight
  const startCampaignFight = useCallback(() => {
    if (!campaign) return
    const stage = campaign.stages[campaignStage]
    if (!stage) return

    const eng = createEngine(
      playerChar,
      stage.opponent,
      'single',
      stage.difficulty,
      stage.isBoss,
    )
    setEngine(eng)
    setMode('fighting')
  }, [campaign, campaignStage, playerChar])

  // Handle match end in campaign
  const handleCampaignMatchEnd = useCallback((winner: 'player1' | 'player2') => {
    if (!campaign) return

    if (winner === 'player1') {
      // Advance to next stage
      const nextStage = campaignStage + 1
      if (nextStage >= campaign.stages.length) {
        // Campaign complete!
        setGameResult('win')
        setMode('game_over')
        setEngine(null)
      } else {
        setCampaignStage(nextStage)
        setMode('campaign')
        setEngine(null)
      }
    } else {
      // Player lost - game over (no retries)
      setGameResult('lose')
      setMode('game_over')
      setEngine(null)
    }
  }, [campaign, campaignStage])

  // Local multiplayer
  const startLocalMulti = useCallback(() => {
    setGameMode('local_multi')
    setMode('character_select')
  }, [])

  const startVersus = useCallback((p1: CharacterId, p2: CharacterId) => {
    setPlayerChar(p1)
    setP2Char(p2)
    const eng = createEngine(p1, p2, 'local_multi')
    setEngine(eng)
    setMode('fighting')
  }, [])

  const handleVersusMatchEnd = useCallback((winner: 'player1' | 'player2') => {
    setGameResult(winner === 'player1' ? 'win' : 'lose')
    setMode('game_over')
    setEngine(null)
  }, [playerChar, p2Char])

  // Render based on mode
  switch (mode) {
    case 'menu':
      return (
        <MainMenu
          onSinglePlayer={() => {
            setGameMode('single')
            setMode('character_select')
          }}
          onMultiplayer={startLocalMulti}
          onControls={() => setMode('controls')}
        />
      )

    case 'character_select':
      if (gameMode === 'local_multi') {
        return (
          <CharacterSelect
            title="SELECT FIGHTERS"
            subtitle="Local versus - same device"
            showP2
            onSelect={(p1) => {
              startVersus(p1, p2Char)
            }}
            onP2Select={(p2) => setP2Char(p2)}
            onBack={resetToMenu}
          />
        )
      }
      return (
        <CharacterSelect
          title="CHOOSE YOUR FIGHTER"
          subtitle="Select a character for your campaign run"
          onSelect={startCampaign}
          onBack={resetToMenu}
        />
      )

    case 'difficulty_select':
      return (
        <DifficultySelect
          onSelect={startCampaignWithDifficulty}
          onBack={() => {
            setGameMode('single')
            setMode('character_select')
          }}
        />
      )

    case 'campaign':
      if (campaign) {
        const stage = campaign.stages[campaignStage]
        return (
          <StageIntro
            stage={stage}
            stageNumber={campaignStage + 1}
            totalStages={campaign.stages.length}
            playerCharName={getCharacter(playerChar).name}
            onReady={startCampaignFight}
          />
        )
      }
      return null

    case 'fighting':
      if (engine) {
        return (
          <div className="flex flex-col h-dvh bg-background overflow-hidden">
            {/* Pause / back button */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-card/80 border-b border-border">
              <button
                onClick={resetToMenu}
                className="text-xs text-muted-foreground font-mono hover:text-foreground transition-colors px-2 py-1"
              >
                QUIT
              </button>
              {gameMode === 'single' && campaign && (
                <span className="text-xs text-muted-foreground font-mono">
                  STAGE {campaignStage + 1}/{campaign.stages.length}
                  {campaign.stages[campaignStage]?.isBoss ? ' - BOSS' : ''}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {gameMode === 'local_multi' ? 'LOCAL VS' : difficulty?.toUpperCase()}
              </span>
            </div>

            {/* Game canvas */}
            <div className="flex-1 min-h-0">
              <GameCanvas
                engine={engine}
                onMatchEnd={gameMode === 'single' ? handleCampaignMatchEnd : handleVersusMatchEnd}
              />
            </div>

            {/* Mobile controls */}
            {isMobile && <MobileControls engine={engine} />}
          </div>
        )
      }
      return null

    case 'game_over': {
      const currentStage = campaign?.stages[campaignStage]
      const opponentName = currentStage
        ? getCharacter(currentStage.opponent).name
        : gameMode === 'local_multi'
          ? (gameResult === 'win' ? getCharacter(playerChar).name : getCharacter(p2Char).name)
          : 'Unknown'

      if (gameMode === 'local_multi') {
        return (
          <GameOverScreen
            result={gameResult}
            stageReached={1}
            totalStages={1}
            playerName={gameResult === 'win' ? getCharacter(playerChar).name : getCharacter(p2Char).name}
            opponentName={gameResult === 'win' ? getCharacter(p2Char).name : getCharacter(playerChar).name}
            onReturnMenu={resetToMenu}
          />
        )
      }

      return (
        <GameOverScreen
          result={gameResult}
          stageReached={campaignStage}
          totalStages={campaign?.stages.length ?? 0}
          playerName={getCharacter(playerChar).name}
          opponentName={opponentName}
          onReturnMenu={resetToMenu}
        />
      )
    }

    case 'controls':
      return <ControlsScreen onBack={resetToMenu} />

    default:
      return null
  }
}
