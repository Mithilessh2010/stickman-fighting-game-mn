import type { GameState, InputState, CharacterId, BossId, Difficulty } from './types'
import { getCharacter } from './characters'
import {
  createFighter, processInput, resolveHits, updatePhysics,
  updateParticles, enforceFacing, pushApart,
  CANVAS_WIDTH, GROUND_Y, ROUND_TIME, ROUNDS_TO_WIN,
} from './combat'
import { generateAIInput, getAIConfig, type AIConfig } from './ai'
import { CAMPAIGNS } from './stages'

export interface GameEngine {
  state: GameState
  isRunning: boolean
  mode: 'single' | 'local_multi'
  campaignStageIndex: number
  campaignDifficulty: Difficulty | null
  aiConfig: AIConfig | null
  p1Input: InputState
  p2Input: InputState
  onRoundEnd?: (winner: 'player1' | 'player2') => void
  onMatchEnd?: (winner: 'player1' | 'player2') => void
  onGameOver?: (result: 'win' | 'lose') => void
}

function createInputState(): InputState {
  return {
    left: false, right: false, up: false, down: false,
    light: false, heavy: false, special: false, ultimate: false,
    block: false, dodge: false,
    lightPressed: false, heavyPressed: false, specialPressed: false,
    ultimatePressed: false, dodgePressed: false,
  }
}

export function createGameState(
  p1CharId: CharacterId,
  p2CharId: CharacterId | BossId,
): GameState {
  const p1Char = getCharacter(p1CharId)
  const p2Char = getCharacter(p2CharId)

  return {
    phase: 'intro',
    player1: createFighter(p1Char, CANVAS_WIDTH * 0.25, 1),
    player2: createFighter(p2Char, CANVAS_WIDTH * 0.75, -1),
    projectiles: [],
    particles: [],
    hitEffects: [],
    timer: ROUND_TIME * 60,
    frameCount: 0,
    roundNumber: 1,
    player1Wins: 0,
    player2Wins: 0,
    screenShake: 0,
    slowMotion: 0,
    lastHitType: '',
    comboDisplay: { count: 0, timer: 0, side: 'left' },
  }
}

export function createEngine(
  p1CharId: CharacterId,
  p2CharId: CharacterId | BossId,
  mode: 'single' | 'local_multi',
  difficulty?: number,
  isBoss?: boolean,
): GameEngine {
  return {
    state: createGameState(p1CharId, p2CharId),
    isRunning: true,
    mode,
    campaignStageIndex: 0,
    campaignDifficulty: null,
    aiConfig: mode === 'single' ? getAIConfig(difficulty ?? 0.3, isBoss ?? false) : null,
    p1Input: createInputState(),
    p2Input: createInputState(),
  }
}

export function tick(engine: GameEngine): void {
  const { state } = engine
  if (!engine.isRunning) return

  state.frameCount++

  // Slow motion
  if (state.slowMotion > 0 && state.frameCount % 3 !== 0) {
    updateParticles(state)
    return
  }

  switch (state.phase) {
    case 'intro':
      handleIntro(engine)
      break
    case 'fighting':
      handleFighting(engine)
      break
    case 'round_end':
      handleRoundEnd(engine)
      break
    case 'match_end':
      // Just update particles for visual
      updateParticles(state)
      break
  }
}

function handleIntro(engine: GameEngine): void {
  const { state } = engine
  updateParticles(state)

  if (state.frameCount >= 90) {
    state.phase = 'fighting'
    state.frameCount = 0
  }
}

function handleFighting(engine: GameEngine): void {
  const { state } = engine

  // Process P1 input
  processInput(state.player1, engine.p1Input, state)

  // Process P2 input (AI or local player)
  if (engine.mode === 'single' && engine.aiConfig) {
    const aiInput = generateAIInput(state.player2, state.player1, state, engine.aiConfig)
    processInput(state.player2, aiInput, state)
  } else {
    processInput(state.player2, engine.p2Input, state)
  }

  // Physics
  updatePhysics(state.player1)
  updatePhysics(state.player2)

  // Facing
  enforceFacing(state.player1, state.player2)

  // Push apart
  pushApart(state.player1, state.player2)

  // Hit resolution
  resolveHits(state)

  // Particles
  updateParticles(state)

  // Timer
  state.timer--

  // Combo reset on idle
  if (state.player1.action === 'idle' && state.player1.comboCount > 0) {
    if (state.frameCount - state.player1.lastDamageTime > 30) {
      state.player1.comboCount = 0
    }
  }
  if (state.player2.action === 'idle' && state.player2.comboCount > 0) {
    if (state.frameCount - state.player2.lastDamageTime > 30) {
      state.player2.comboCount = 0
    }
  }

  // Check round end conditions
  if (state.player1.hp <= 0 || state.player2.hp <= 0 || state.timer <= 0) {
    let winner: 'player1' | 'player2'

    if (state.player1.hp <= 0 && state.player2.hp <= 0) {
      // Double KO - player with more % HP wins
      winner = state.player1.hp >= state.player2.hp ? 'player1' : 'player2'
    } else if (state.player1.hp <= 0) {
      winner = 'player2'
    } else if (state.player2.hp <= 0) {
      winner = 'player1'
    } else {
      // Timer ran out - most HP wins
      winner = state.player1.hp >= state.player2.hp ? 'player1' : 'player2'
    }

    if (winner === 'player1') state.player1Wins++
    else state.player2Wins++

    const winnerFighter = winner === 'player1' ? state.player1 : state.player2
    winnerFighter.action = 'victory'
    winnerFighter.actionFrame = 0

    state.phase = 'round_end'
    state.frameCount = 0

    engine.onRoundEnd?.(winner)
  }
}

function handleRoundEnd(engine: GameEngine): void {
  const { state } = engine
  updateParticles(state)

  // Animate
  if (state.player1.action === 'victory') state.player1.actionFrame++
  if (state.player2.action === 'victory') state.player2.actionFrame++
  if (state.player1.action === 'dead') {
    state.player1.actionFrame = Math.min(state.player1.actionFrame + 1, 60)
  }
  if (state.player2.action === 'dead') {
    state.player2.actionFrame = Math.min(state.player2.actionFrame + 1, 60)
  }

  if (state.frameCount >= 120) {
    // Check match end
    if (state.player1Wins >= ROUNDS_TO_WIN || state.player2Wins >= ROUNDS_TO_WIN) {
      state.phase = 'match_end'
      state.frameCount = 0
      const winner = state.player1Wins >= ROUNDS_TO_WIN ? 'player1' : 'player2'
      engine.onMatchEnd?.(winner)
    } else {
      // Next round
      resetRound(engine)
    }
  }
}

function resetRound(engine: GameEngine): void {
  const { state } = engine
  const p1Char = state.player1.character
  const p2Char = state.player2.character

  state.player1 = createFighter(p1Char, CANVAS_WIDTH * 0.25, 1)
  state.player2 = createFighter(p2Char, CANVAS_WIDTH * 0.75, -1)
  state.projectiles = []
  state.particles = []
  state.hitEffects = []
  state.timer = ROUND_TIME * 60
  state.frameCount = 0
  state.roundNumber++
  state.phase = 'intro'
  state.screenShake = 0
  state.slowMotion = 0
  state.lastHitType = ''
  state.comboDisplay = { count: 0, timer: 0, side: 'left' }
}

// ===== INPUT HANDLING =====

// Player 1: WASD + J/K/L/U/I/Space
// Player 2: Arrow keys + Numpad 1-5 or 7/8/9/4/5
const P1_KEYS: Record<string, keyof InputState> = {
  'KeyW': 'up',
  'KeyA': 'left',
  'KeyS': 'down',
  'KeyD': 'right',
  'KeyJ': 'light',
  'KeyK': 'heavy',
  'KeyL': 'special',
  'KeyU': 'ultimate',
  'Space': 'block',
  'ShiftLeft': 'dodge',
}

const P2_KEYS: Record<string, keyof InputState> = {
  'ArrowUp': 'up',
  'ArrowLeft': 'left',
  'ArrowDown': 'down',
  'ArrowRight': 'right',
  'Numpad1': 'light',
  'Numpad2': 'heavy',
  'Numpad3': 'special',
  'Numpad4': 'ultimate',
  'Numpad0': 'block',
  'NumpadDecimal': 'dodge',
  // Alternate P2 keys for keyboards without numpad
  'Digit7': 'light',
  'Digit8': 'heavy',
  'Digit9': 'special',
  'Digit0': 'ultimate',
  'Backslash': 'block',
  'BracketRight': 'dodge',
}

const PRESSED_KEYS = new Set<string>(['light', 'heavy', 'special', 'ultimate', 'dodge'])

export function handleKeyDown(engine: GameEngine, code: string): void {
  const p1Key = P1_KEYS[code]
  if (p1Key) {
    if (PRESSED_KEYS.has(p1Key)) {
      const pressedKey = (p1Key + 'Pressed') as keyof InputState
      if (!engine.p1Input[p1Key]) {
        (engine.p1Input as Record<string, boolean>)[pressedKey] = true
      }
    }
    (engine.p1Input as Record<string, boolean>)[p1Key] = true
  }

  if (engine.mode === 'local_multi') {
    const p2Key = P2_KEYS[code]
    if (p2Key) {
      if (PRESSED_KEYS.has(p2Key)) {
        const pressedKey = (p2Key + 'Pressed') as keyof InputState
        if (!engine.p2Input[p2Key]) {
          (engine.p2Input as Record<string, boolean>)[pressedKey] = true
        }
      }
      (engine.p2Input as Record<string, boolean>)[p2Key] = true
    }
  }
}

export function handleKeyUp(engine: GameEngine, code: string): void {
  const p1Key = P1_KEYS[code]
  if (p1Key) {
    (engine.p1Input as Record<string, boolean>)[p1Key] = false
  }

  if (engine.mode === 'local_multi') {
    const p2Key = P2_KEYS[code]
    if (p2Key) {
      (engine.p2Input as Record<string, boolean>)[p2Key] = false
    }
  }
}

export function clearPressedFlags(engine: GameEngine): void {
  engine.p1Input.lightPressed = false
  engine.p1Input.heavyPressed = false
  engine.p1Input.specialPressed = false
  engine.p1Input.ultimatePressed = false
  engine.p1Input.dodgePressed = false
  engine.p2Input.lightPressed = false
  engine.p2Input.heavyPressed = false
  engine.p2Input.specialPressed = false
  engine.p2Input.ultimatePressed = false
  engine.p2Input.dodgePressed = false
}

export { CAMPAIGNS }
