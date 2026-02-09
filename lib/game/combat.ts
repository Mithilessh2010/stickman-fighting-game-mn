import type { Fighter, GameState, InputState, AttackType, Projectile, Particle, HitEffect } from './types'

// ===== CONSTANTS =====
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540
export const GROUND_Y = 420
export const GRAVITY = 0.8
export const JUMP_FORCE = -14
export const WALK_SPEED_BASE = 4
export const DODGE_SPEED = 12
export const DODGE_DURATION = 12
export const DODGE_COOLDOWN = 30
export const BLOCK_DAMAGE_REDUCTION = 0.8
export const COUNTER_WINDOW = 8
export const COMBO_TIMEOUT = 30
export const ENERGY_PER_HIT = 8
export const ENERGY_PER_DAMAGE = 0.05
export const LIGHT_DAMAGE_BASE = 40
export const HEAVY_DAMAGE_BASE = 80
export const LIGHT_STARTUP = 4
export const LIGHT_ACTIVE = 3
export const LIGHT_RECOVERY = 6
export const HEAVY_STARTUP = 8
export const HEAVY_ACTIVE = 5
export const HEAVY_RECOVERY = 12
export const HIT_STUN_LIGHT = 12
export const HIT_STUN_HEAVY = 20
export const BLOCK_STUN = 8
export const KNOCKBACK_LIGHT = 4
export const KNOCKBACK_HEAVY = 8
export const ROUND_TIME = 99
export const ROUNDS_TO_WIN = 2

export function createFighter(character: ReturnType<typeof import('./characters').getCharacter>, x: number, facing: 1 | -1): Fighter {
  return {
    character,
    x,
    y: GROUND_Y,
    velocityX: 0,
    velocityY: 0,
    hp: character.stats.maxHp,
    energy: 0,
    facing,
    action: 'idle',
    actionFrame: 0,
    actionDuration: 0,
    comboCount: 0,
    comboTimer: 0,
    comboInputs: [],
    isGrounded: true,
    isBlocking: false,
    isDodging: false,
    dodgeCooldown: 0,
    hitStunFrames: 0,
    blockStunFrames: 0,
    invincibleFrames: 0,
    lastDamageTime: 0,
    animationOffset: 0,
  }
}

function isActionLocked(fighter: Fighter): boolean {
  if (fighter.hitStunFrames > 0) return true
  if (fighter.blockStunFrames > 0) return true
  if (fighter.action === 'dead') return true
  if (fighter.action === 'knockdown' && fighter.actionFrame < fighter.actionDuration) return true
  if (fighter.action === 'ultimate' && fighter.actionFrame < fighter.actionDuration) return true
  const attackActions: string[] = ['light_attack', 'heavy_attack', 'special1', 'special2']
  if (attackActions.includes(fighter.action) && fighter.actionFrame < fighter.actionDuration) return true
  return false
}

function getAttackHitbox(fighter: Fighter): { x: number, y: number, w: number, h: number } | null {
  const dir = fighter.facing
  const bx = fighter.x + dir * 30
  const by = fighter.y - 40

  if (fighter.action === 'light_attack') {
    if (fighter.actionFrame >= LIGHT_STARTUP && fighter.actionFrame < LIGHT_STARTUP + LIGHT_ACTIVE) {
      return { x: bx, y: by - 10, w: 60, h: 30 }
    }
  }
  if (fighter.action === 'heavy_attack') {
    if (fighter.actionFrame >= HEAVY_STARTUP && fighter.actionFrame < HEAVY_STARTUP + HEAVY_ACTIVE) {
      return { x: bx, y: by - 15, w: 70, h: 40 }
    }
  }
  if (fighter.action === 'special1' || fighter.action === 'special2') {
    const idx = fighter.action === 'special1' ? 0 : 1
    const special = fighter.character.specials[idx]
    if (special && special.type === 'melee') {
      if (fighter.actionFrame >= special.startup && fighter.actionFrame < special.startup + special.active) {
        return { x: bx, y: by - 20, w: special.range, h: 50 }
      }
    }
  }
  if (fighter.action === 'ultimate') {
    if (fighter.actionFrame >= 20 && fighter.actionFrame < 50) {
      return { x: bx - 20, y: by - 40, w: 150, h: 100 }
    }
  }
  return null
}

function getFighterHurtbox(fighter: Fighter): { x: number, y: number, w: number, h: number } {
  return { x: fighter.x - 20, y: fighter.y - 80, w: 40, h: 80 }
}

function boxOverlap(
  a: { x: number, y: number, w: number, h: number },
  b: { x: number, y: number, w: number, h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function calculateDamage(attacker: Fighter, actionType: string): number {
  const atkStat = attacker.character.stats.attack / 80
  let baseDmg = LIGHT_DAMAGE_BASE
  if (actionType === 'heavy_attack') baseDmg = HEAVY_DAMAGE_BASE
  if (actionType === 'special1' || actionType === 'special2') {
    const idx = actionType === 'special1' ? 0 : 1
    const special = attacker.character.specials[idx]
    if (special) baseDmg = special.damage
  }
  if (actionType === 'ultimate') baseDmg = attacker.character.ultimate.damage

  // Combo scaling
  const comboScale = Math.max(0.3, 1 - attacker.comboCount * 0.1)
  return Math.round(baseDmg * atkStat * comboScale)
}

function spawnHitParticles(x: number, y: number, color: string, count: number, type: Particle['type']): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6
    particles.push({
      x, y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 2,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      color,
      size: 2 + Math.random() * 4,
      type,
    })
  }
  return particles
}

function spawnHitEffect(x: number, y: number, type: HitEffect['type'], scale: number = 1): HitEffect {
  return { x, y, frame: 0, maxFrames: 15, type, scale }
}

export function processInput(fighter: Fighter, input: InputState, state: GameState): void {
  if (fighter.action === 'dead') return

  // Update cooldowns
  if (fighter.dodgeCooldown > 0) fighter.dodgeCooldown--
  if (fighter.invincibleFrames > 0) fighter.invincibleFrames--
  if (fighter.hitStunFrames > 0) {
    fighter.hitStunFrames--
    if (fighter.hitStunFrames === 0) {
      fighter.action = 'idle'
      fighter.actionFrame = 0
    }
    return
  }
  if (fighter.blockStunFrames > 0) {
    fighter.blockStunFrames--
    if (fighter.blockStunFrames === 0) {
      fighter.isBlocking = false
      fighter.action = 'idle'
      fighter.actionFrame = 0
    }
    return
  }

  if (isActionLocked(fighter)) {
    fighter.actionFrame++
    if (fighter.actionFrame >= fighter.actionDuration) {
      fighter.action = 'idle'
      fighter.actionFrame = 0
    }
    return
  }

  // Combo timer
  if (fighter.comboTimer > 0) {
    fighter.comboTimer--
    if (fighter.comboTimer === 0) {
      fighter.comboInputs = []
    }
  }

  const walkSpeed = WALK_SPEED_BASE * (fighter.character.stats.speed / 70)

  // Blocking
  fighter.isBlocking = input.block && fighter.isGrounded && !fighter.isDodging

  // Dodge
  if (input.dodgePressed && fighter.dodgeCooldown === 0 && fighter.isGrounded && !fighter.isDodging) {
    fighter.isDodging = true
    fighter.dodgeCooldown = DODGE_COOLDOWN
    fighter.invincibleFrames = DODGE_DURATION
    fighter.action = 'dodge'
    fighter.actionFrame = 0
    fighter.actionDuration = DODGE_DURATION
    const dodgeDir = input.left ? -1 : input.right ? 1 : -fighter.facing
    fighter.velocityX = dodgeDir * DODGE_SPEED
    return
  }

  if (fighter.isDodging) {
    fighter.actionFrame++
    if (fighter.actionFrame >= DODGE_DURATION) {
      fighter.isDodging = false
      fighter.action = 'idle'
      fighter.actionFrame = 0
    }
    return
  }

  if (fighter.isBlocking) {
    fighter.action = 'block'
    fighter.velocityX = 0
    return
  }

  // Ultimate
  if (input.ultimatePressed && fighter.energy >= fighter.character.ultimate.energyRequired) {
    fighter.action = 'ultimate'
    fighter.actionFrame = 0
    fighter.actionDuration = fighter.character.ultimate.duration
    fighter.energy = 0
    fighter.velocityX = 0
    state.slowMotion = 20
    state.screenShake = 15
    return
  }

  // Special moves
  if (input.specialPressed && fighter.isGrounded) {
    // Check if we should do special2 (hold down + special)
    const specialIdx = input.down ? 1 : 0
    const special = fighter.character.specials[specialIdx]
    if (special && fighter.energy >= special.energyCost) {
      fighter.energy -= special.energyCost
      const actionName = specialIdx === 0 ? 'special1' : 'special2'
      fighter.action = actionName
      fighter.actionFrame = 0
      fighter.actionDuration = special.startup + special.active + special.recovery
      fighter.velocityX = 0

      // Track combo
      fighter.comboInputs.push(actionName as AttackType)
      fighter.comboTimer = COMBO_TIMEOUT

      // Spawn projectile if needed
      if (special.type === 'projectile') {
        state.projectiles.push({
          x: fighter.x + fighter.facing * 40,
          y: fighter.y - 45,
          velocityX: fighter.facing * 8,
          velocityY: 0,
          damage: special.damage * (fighter.character.stats.attack / 80),
          owner: state.player1 === fighter ? 'player1' : 'player2',
          color: fighter.character.color,
          radius: 8,
          lifetime: 0,
          maxLifetime: 60,
        })
      }

      // Teleport
      if (special.type === 'teleport') {
        const opponent = state.player1 === fighter ? state.player2 : state.player1
        const behindOpponent = opponent.x - opponent.facing * 60
        fighter.x = Math.max(40, Math.min(CANVAS_WIDTH - 40, behindOpponent))
        fighter.invincibleFrames = 8
        state.particles.push(...spawnHitParticles(fighter.x, fighter.y - 40, fighter.character.accentColor, 10, 'energy'))
      }

      return
    }
  }

  // Light attack
  if (input.lightPressed) {
    fighter.action = 'light_attack'
    fighter.actionFrame = 0
    fighter.actionDuration = LIGHT_STARTUP + LIGHT_ACTIVE + LIGHT_RECOVERY
    fighter.velocityX = fighter.facing * 2
    fighter.comboInputs.push('light')
    fighter.comboTimer = COMBO_TIMEOUT
    return
  }

  // Heavy attack
  if (input.heavyPressed) {
    fighter.action = 'heavy_attack'
    fighter.actionFrame = 0
    fighter.actionDuration = HEAVY_STARTUP + HEAVY_ACTIVE + HEAVY_RECOVERY
    fighter.velocityX = fighter.facing * 1
    fighter.comboInputs.push('heavy')
    fighter.comboTimer = COMBO_TIMEOUT
    return
  }

  // Movement
  if (input.up && fighter.isGrounded) {
    fighter.velocityY = JUMP_FORCE
    fighter.isGrounded = false
    fighter.action = 'jump'
    state.particles.push(...spawnHitParticles(fighter.x, GROUND_Y, '#666666', 4, 'dust'))
  }

  if (input.left) {
    fighter.velocityX = -walkSpeed
    if (fighter.isGrounded) fighter.action = fighter.facing === -1 ? 'walk_forward' : 'walk_back'
  } else if (input.right) {
    fighter.velocityX = walkSpeed
    if (fighter.isGrounded) fighter.action = fighter.facing === 1 ? 'walk_forward' : 'walk_back'
  } else {
    fighter.velocityX *= 0.7
    if (fighter.isGrounded && Math.abs(fighter.velocityX) < 0.5) {
      fighter.action = input.down ? 'crouch' : 'idle'
    }
  }
}

export function resolveHits(state: GameState): void {
  const fighters: [Fighter, Fighter] = [state.player1, state.player2]

  for (let i = 0; i < 2; i++) {
    const attacker = fighters[i]
    const defender = fighters[1 - i]

    if (defender.action === 'dead') continue
    if (defender.invincibleFrames > 0) continue

    const hitbox = getAttackHitbox(attacker)
    if (!hitbox) continue

    const hurtbox = getFighterHurtbox(defender)
    if (!boxOverlap(hitbox, hurtbox)) continue

    // Check if this hit was already registered (use actionFrame to prevent multi-hit)
    const isNewHit = attacker.actionFrame === (
      attacker.action === 'light_attack' ? LIGHT_STARTUP :
      attacker.action === 'heavy_attack' ? HEAVY_STARTUP :
      attacker.action === 'ultimate' ? 20 :
      (attacker.character.specials[attacker.action === 'special1' ? 0 : 1]?.startup ?? 0)
    )
    if (!isNewHit) continue

    let damage = calculateDamage(attacker, attacker.action)
    let hitType: HitEffect['type'] = 'light'
    let knockback = KNOCKBACK_LIGHT
    let hitStun = HIT_STUN_LIGHT

    if (attacker.action === 'heavy_attack') {
      hitType = 'heavy'
      knockback = KNOCKBACK_HEAVY
      hitStun = HIT_STUN_HEAVY
    } else if (attacker.action === 'special1' || attacker.action === 'special2') {
      hitType = 'special'
      const idx = attacker.action === 'special1' ? 0 : 1
      knockback = attacker.character.specials[idx]?.knockback ?? 6
      hitStun = 16
    } else if (attacker.action === 'ultimate') {
      hitType = 'ultimate'
      knockback = 20
      hitStun = 30
    }

    // Blocking
    if (defender.isBlocking) {
      damage = Math.round(damage * (1 - BLOCK_DAMAGE_REDUCTION))
      defender.blockStunFrames = BLOCK_STUN
      defender.action = 'block'
      knockback *= 0.3
      state.hitEffects.push(spawnHitEffect(
        (attacker.x + defender.x) / 2,
        defender.y - 50,
        'block',
        0.8
      ))
      state.particles.push(...spawnHitParticles(defender.x, defender.y - 50, '#ffffff', 5, 'block'))
      state.screenShake = 3
    } else {
      // Apply hit
      defender.hitStunFrames = hitStun
      defender.action = 'hit_stun'
      defender.actionFrame = 0

      const hitX = (attacker.x + defender.x) / 2
      const hitY = defender.y - 50
      state.hitEffects.push(spawnHitEffect(hitX, hitY, hitType, hitType === 'ultimate' ? 2 : 1))
      state.particles.push(...spawnHitParticles(hitX, hitY, attacker.character.color, hitType === 'ultimate' ? 20 : 8, 'hit'))

      state.screenShake = hitType === 'ultimate' ? 12 : hitType === 'heavy' ? 6 : 3
      if (hitType === 'ultimate') state.slowMotion = 10

      // Combo tracking
      attacker.comboCount++
      attacker.comboTimer = COMBO_TIMEOUT

      const side = state.player1 === attacker ? 'left' : 'right'
      if (attacker.comboCount > 1) {
        state.comboDisplay = { count: attacker.comboCount, timer: 60, side }
      }
    }

    // Apply damage with defense reduction
    const defReduction = defender.character.stats.defense / 100
    const finalDamage = Math.round(damage * (1 - defReduction * 0.3))
    defender.hp = Math.max(0, defender.hp - finalDamage)
    defender.lastDamageTime = state.frameCount
    defender.velocityX = attacker.facing * knockback

    // Energy gain
    attacker.energy = Math.min(100, attacker.energy + ENERGY_PER_HIT + finalDamage * ENERGY_PER_DAMAGE)
    defender.energy = Math.min(100, defender.energy + finalDamage * ENERGY_PER_DAMAGE * 1.5)

    // Check combo sequences
    checkCombos(attacker, state)

    if (defender.hp <= 0) {
      defender.action = 'dead'
      defender.actionFrame = 0
      defender.actionDuration = 60
      state.screenShake = 15
      state.slowMotion = 30
      state.particles.push(...spawnHitParticles(defender.x, defender.y - 40, defender.character.color, 25, 'hit'))
    }
  }

  // Process projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i]
    proj.x += proj.velocityX
    proj.y += proj.velocityY
    proj.lifetime++

    if (proj.lifetime >= proj.maxLifetime || proj.x < -20 || proj.x > CANVAS_WIDTH + 20) {
      state.projectiles.splice(i, 1)
      continue
    }

    const target = proj.owner === 'player1' ? state.player2 : state.player1
    if (target.invincibleFrames > 0 || target.action === 'dead') continue

    const hurtbox = getFighterHurtbox(target)
    const projBox = { x: proj.x - proj.radius, y: proj.y - proj.radius, w: proj.radius * 2, h: proj.radius * 2 }

    if (boxOverlap(projBox, hurtbox)) {
      let damage = Math.round(proj.damage)
      if (target.isBlocking) {
        damage = Math.round(damage * (1 - BLOCK_DAMAGE_REDUCTION))
        target.blockStunFrames = BLOCK_STUN
        state.hitEffects.push(spawnHitEffect(proj.x, proj.y, 'block', 0.8))
        state.particles.push(...spawnHitParticles(proj.x, proj.y, '#ffffff', 5, 'block'))
      } else {
        target.hitStunFrames = 14
        target.action = 'hit_stun'
        target.velocityX = proj.velocityX > 0 ? 5 : -5
        state.hitEffects.push(spawnHitEffect(proj.x, proj.y, 'special', 1))
        state.particles.push(...spawnHitParticles(proj.x, proj.y, proj.color, 10, 'hit'))
        state.screenShake = 4

        const attacker = proj.owner === 'player1' ? state.player1 : state.player2
        attacker.comboCount++
        if (attacker.comboCount > 1) {
          state.comboDisplay = { count: attacker.comboCount, timer: 60, side: proj.owner === 'player1' ? 'left' : 'right' }
        }
      }

      const defReduction = target.character.stats.defense / 100
      const finalDamage = Math.round(damage * (1 - defReduction * 0.3))
      target.hp = Math.max(0, target.hp - finalDamage)
      target.lastDamageTime = state.frameCount

      const attacker = proj.owner === 'player1' ? state.player1 : state.player2
      attacker.energy = Math.min(100, attacker.energy + ENERGY_PER_HIT)
      target.energy = Math.min(100, target.energy + finalDamage * ENERGY_PER_DAMAGE * 1.5)

      if (target.hp <= 0) {
        target.action = 'dead'
        target.actionFrame = 0
        target.actionDuration = 60
        state.screenShake = 15
        state.slowMotion = 30
      }

      state.projectiles.splice(i, 1)
    }
  }
}

function checkCombos(fighter: Fighter, state: GameState): void {
  const inputs = fighter.comboInputs
  if (inputs.length < 2) return

  for (const combo of fighter.character.combos) {
    const seq = combo.inputs
    if (inputs.length >= seq.length) {
      const recent = inputs.slice(-seq.length)
      let match = true
      for (let i = 0; i < seq.length; i++) {
        if (recent[i] !== seq[i]) { match = false; break }
      }
      if (match) {
        // Combo bonus damage
        const opponent = state.player1 === fighter ? state.player2 : state.player1
        const bonusDmg = Math.round(combo.damage * 0.2)
        opponent.hp = Math.max(0, opponent.hp - bonusDmg)
        fighter.energy = Math.min(100, fighter.energy + 15)

        state.particles.push(...spawnHitParticles(opponent.x, opponent.y - 40, fighter.character.accentColor, 15, 'spark'))
        state.screenShake = 8
        state.lastHitType = combo.name

        fighter.comboInputs = []
        break
      }
    }
  }
}

export function updatePhysics(fighter: Fighter): void {
  // Gravity
  if (!fighter.isGrounded) {
    fighter.velocityY += GRAVITY
  }

  // Apply velocity
  fighter.x += fighter.velocityX
  fighter.y += fighter.velocityY

  // Ground collision
  if (fighter.y >= GROUND_Y) {
    fighter.y = GROUND_Y
    fighter.velocityY = 0
    if (!fighter.isGrounded) {
      fighter.isGrounded = true
      if (fighter.action === 'jump') {
        fighter.action = 'idle'
        fighter.actionFrame = 0
      }
    }
  }

  // Wall bounds
  fighter.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, fighter.x))

  // Friction
  if (fighter.isGrounded && fighter.action === 'idle') {
    fighter.velocityX *= 0.85
  }

  // Animation
  fighter.animationOffset += fighter.character.stats.speed / 70
}

export function updateParticles(state: GameState): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i]
    p.x += p.velocityX
    p.y += p.velocityY
    p.velocityY += 0.15
    p.velocityX *= 0.96
    p.life--
    if (p.life <= 0) state.particles.splice(i, 1)
  }

  for (let i = state.hitEffects.length - 1; i >= 0; i--) {
    const e = state.hitEffects[i]
    e.frame++
    if (e.frame >= e.maxFrames) state.hitEffects.splice(i, 1)
  }

  if (state.screenShake > 0) state.screenShake--
  if (state.slowMotion > 0) state.slowMotion--
  if (state.comboDisplay.timer > 0) state.comboDisplay.timer--
}

export function enforceFacing(p1: Fighter, p2: Fighter): void {
  if (p1.x < p2.x) {
    p1.facing = 1
    p2.facing = -1
  } else {
    p1.facing = -1
    p2.facing = 1
  }
}

export function pushApart(p1: Fighter, p2: Fighter): void {
  const dist = Math.abs(p1.x - p2.x)
  if (dist < 40) {
    const push = (40 - dist) / 2
    if (p1.x < p2.x) {
      p1.x -= push
      p2.x += push
    } else {
      p1.x += push
      p2.x -= push
    }
  }
}
