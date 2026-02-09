import type { Fighter, GameState, InputState } from './types'
import { CANVAS_WIDTH } from './combat'

// ===== AI CONTROLLER =====

export interface AIConfig {
  aggression: number    // 0-1: how often to attack
  defense: number       // 0-1: how often to block/dodge
  reaction: number      // 0-1: reaction speed (affects counter timing)
  specialUsage: number  // 0-1: how often to use specials
  comboAbility: number  // 0-1: ability to chain combos
  ultimateUsage: number // 0-1: tendency to use ultimate
  movement: number      // 0-1: how mobile the AI is
}

export function getAIConfig(difficulty: number, isBoss: boolean): AIConfig {
  // difficulty: 0-1 scale
  const d = Math.max(0, Math.min(1, difficulty))

  const base: AIConfig = {
    aggression: 0.2 + d * 0.6,
    defense: 0.15 + d * 0.6,
    reaction: 0.1 + d * 0.7,
    specialUsage: 0.1 + d * 0.5,
    comboAbility: 0.05 + d * 0.7,
    ultimateUsage: 0.3 + d * 0.5,
    movement: 0.3 + d * 0.5,
  }

  if (isBoss) {
    base.aggression = Math.min(1, base.aggression + 0.15)
    base.defense = Math.min(1, base.defense + 0.15)
    base.reaction = Math.min(1, base.reaction + 0.2)
    base.specialUsage = Math.min(1, base.specialUsage + 0.2)
    base.comboAbility = Math.min(1, base.comboAbility + 0.15)
    base.ultimateUsage = Math.min(1, base.ultimateUsage + 0.1)
  }

  return base
}

interface AIState {
  decisionTimer: number
  currentPlan: 'approach' | 'retreat' | 'attack' | 'defend' | 'special' | 'combo' | 'ultimate' | 'idle'
  planDuration: number
  attackSequence: string[]
  sequenceIndex: number
}

const aiStates = new WeakMap<Fighter, AIState>()

function getAIState(fighter: Fighter): AIState {
  let s = aiStates.get(fighter)
  if (!s) {
    s = {
      decisionTimer: 0,
      currentPlan: 'idle',
      planDuration: 0,
      attackSequence: [],
      sequenceIndex: 0,
    }
    aiStates.set(fighter, s)
  }
  return s
}

export function generateAIInput(
  fighter: Fighter,
  opponent: Fighter,
  state: GameState,
  config: AIConfig
): InputState {
  const input: InputState = {
    left: false, right: false, up: false, down: false,
    light: false, heavy: false, special: false, ultimate: false,
    block: false, dodge: false,
    lightPressed: false, heavyPressed: false, specialPressed: false,
    ultimatePressed: false, dodgePressed: false,
  }

  if (fighter.action === 'dead' || state.phase !== 'fighting') return input

  const ai = getAIState(fighter)
  const dist = Math.abs(fighter.x - opponent.x)
  const facingOpponent = (opponent.x > fighter.x && fighter.facing === 1) || (opponent.x < fighter.x && fighter.facing === -1)
  const hpRatio = fighter.hp / fighter.character.stats.maxHp
  const oppHpRatio = opponent.hp / opponent.character.stats.maxHp
  const energyRatio = fighter.energy / 100
  const isCloseRange = dist < 80
  const isMidRange = dist >= 80 && dist < 250
  const isLongRange = dist >= 250

  ai.decisionTimer--

  if (ai.decisionTimer <= 0) {
    // Make new decision
    ai.decisionTimer = Math.floor(8 + (1 - config.reaction) * 20 + Math.random() * 10)

    // Threat assessment
    const opponentAttacking = ['light_attack', 'heavy_attack', 'special1', 'special2', 'ultimate'].includes(opponent.action)
    const opponentApproaching = Math.abs(opponent.velocityX) > 2 && (
      (opponent.x < fighter.x && opponent.velocityX > 0) ||
      (opponent.x > fighter.x && opponent.velocityX < 0)
    )

    // Decision weights
    let weights = {
      approach: 0,
      retreat: 0,
      attack: 0,
      defend: 0,
      special: 0,
      combo: 0,
      ultimate: 0,
      idle: 0.1,
    }

    // Distance-based decisions
    if (isLongRange) {
      weights.approach = 0.5 * config.movement
      weights.special = fighter.energy >= 20 ? 0.3 * config.specialUsage : 0
      weights.idle = 0.2
    } else if (isMidRange) {
      weights.approach = 0.3 * config.aggression
      weights.attack = 0.2 * config.aggression
      weights.special = fighter.energy >= 20 ? 0.4 * config.specialUsage : 0
      weights.retreat = 0.1 * (1 - config.aggression)
    } else if (isCloseRange) {
      weights.attack = 0.5 * config.aggression
      weights.combo = 0.3 * config.comboAbility
      weights.defend = 0.2 * config.defense
      weights.retreat = 0.15 * (1 - config.aggression)
    }

    // React to opponent
    if (opponentAttacking && isCloseRange) {
      if (Math.random() < config.defense) {
        weights.defend = 0.7
        weights.attack = 0.1
      }
      if (Math.random() < config.reaction * 0.5) {
        weights.retreat = 0.3
      }
    }

    if (opponentApproaching) {
      if (Math.random() < config.defense * 0.5) {
        weights.defend = 0.4
      }
    }

    // HP-based adjustments
    if (hpRatio < 0.3) {
      weights.retreat += 0.2
      weights.defend += 0.2
      if (energyRatio >= 1) {
        weights.ultimate = 0.6 * config.ultimateUsage
      }
    }

    if (oppHpRatio < 0.2) {
      weights.approach += 0.3
      weights.attack += 0.3
      weights.combo += 0.2
    }

    // Ultimate when available
    if (energyRatio >= 1 && isCloseRange) {
      weights.ultimate = 0.4 * config.ultimateUsage
    }

    // Pick weighted random
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    let chosen: AIState['currentPlan'] = 'idle'
    for (const [key, val] of Object.entries(weights)) {
      roll -= val
      if (roll <= 0) {
        chosen = key as AIState['currentPlan']
        break
      }
    }

    ai.currentPlan = chosen
    ai.planDuration = ai.decisionTimer

    // Set up attack sequences for combos
    if (chosen === 'combo' && Math.random() < config.comboAbility) {
      const combos = fighter.character.combos
      if (combos.length > 0) {
        const combo = combos[Math.floor(Math.random() * combos.length)]
        ai.attackSequence = [...combo.inputs]
        ai.sequenceIndex = 0
      }
    }
  }

  // Execute plan
  switch (ai.currentPlan) {
    case 'approach': {
      if (opponent.x > fighter.x) input.right = true
      else input.left = true
      // Jump sometimes
      if (Math.random() < 0.02 * config.movement && fighter.isGrounded) {
        input.up = true
      }
      // Attack when close
      if (dist < 90 && Math.random() < config.aggression * 0.3) {
        input.lightPressed = true
      }
      break
    }

    case 'retreat': {
      if (opponent.x > fighter.x) input.left = true
      else input.right = true
      // Dodge
      if (isCloseRange && Math.random() < config.defense * 0.15 && fighter.dodgeCooldown === 0) {
        input.dodgePressed = true
      }
      break
    }

    case 'attack': {
      // Move toward opponent
      if (dist > 70) {
        if (opponent.x > fighter.x) input.right = true
        else input.left = true
      }

      if (isCloseRange) {
        if (Math.random() < 0.4) {
          input.lightPressed = true
        } else if (Math.random() < 0.3) {
          input.heavyPressed = true
        }
      }
      break
    }

    case 'defend': {
      input.block = true
      // Counter with dodge
      if (Math.random() < config.reaction * 0.08 && fighter.dodgeCooldown === 0) {
        input.block = false
        input.dodgePressed = true
      }
      break
    }

    case 'special': {
      if (fighter.energy >= 20) {
        // Use projectile at range
        const hasProjectile = fighter.character.specials.some(s => s.type === 'projectile')
        if (hasProjectile && isMidRange) {
          input.specialPressed = true
        } else if (isCloseRange) {
          input.specialPressed = true
          input.down = Math.random() < 0.4
        } else {
          // Move closer
          if (opponent.x > fighter.x) input.right = true
          else input.left = true
        }
      }
      break
    }

    case 'combo': {
      if (ai.attackSequence.length > 0 && ai.sequenceIndex < ai.attackSequence.length) {
        // Move toward opponent first
        if (dist > 70) {
          if (opponent.x > fighter.x) input.right = true
          else input.left = true
        } else {
          const nextInput = ai.attackSequence[ai.sequenceIndex]
          if (fighter.action === 'idle' || fighter.actionFrame >= fighter.actionDuration - 2) {
            switch (nextInput) {
              case 'light': input.lightPressed = true; break
              case 'heavy': input.heavyPressed = true; break
              case 'special1': input.specialPressed = true; break
              case 'special2': input.specialPressed = true; input.down = true; break
            }
            ai.sequenceIndex++
          }
        }
      } else {
        ai.currentPlan = 'attack'
      }
      break
    }

    case 'ultimate': {
      if (fighter.energy >= 100) {
        if (isCloseRange) {
          input.ultimatePressed = true
        } else {
          if (opponent.x > fighter.x) input.right = true
          else input.left = true
        }
      } else {
        ai.currentPlan = 'attack'
      }
      break
    }

    default:
      // Idle - slight movement
      if (Math.random() < 0.05) {
        if (Math.random() < 0.5) input.left = true
        else input.right = true
      }
      break
  }

  // Safety: wall awareness
  if (fighter.x < 60 && input.left) {
    input.left = false
    input.right = true
  }
  if (fighter.x > CANVAS_WIDTH - 60 && input.right) {
    input.right = false
    input.left = true
  }

  return input
}
