import type { Fighter, GameState, Particle, HitEffect, Projectile } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './combat'

// ===== STICKMAN RENDERER =====

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number): void {
  const scaleX = canvasW / CANVAS_WIDTH
  const scaleY = canvasH / CANVAS_HEIGHT

  ctx.save()

  // Screen shake
  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake * 2
    const shakeY = (Math.random() - 0.5) * state.screenShake * 2
    ctx.translate(shakeX, shakeY)
  }

  ctx.scale(scaleX, scaleY)

  // Background
  drawBackground(ctx, state)

  // Ground
  drawGround(ctx)

  // Projectiles (behind fighters)
  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj, state.frameCount)
  }

  // Fighters
  drawStickman(ctx, state.player1, state)
  drawStickman(ctx, state.player2, state)

  // Hit effects
  for (const effect of state.hitEffects) {
    drawHitEffect(ctx, effect)
  }

  // Particles
  for (const particle of state.particles) {
    drawParticle(ctx, particle)
  }

  // HUD
  drawHUD(ctx, state)

  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Dark gradient bg
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  grad.addColorStop(0, '#0a0a1a')
  grad.addColorStop(0.5, '#0d0d2b')
  grad.addColorStop(1, '#111133')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < CANVAS_WIDTH; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }

  // Energy aura on low HP
  const drawAura = (fighter: Fighter) => {
    const hpRatio = fighter.hp / fighter.character.stats.maxHp
    if (hpRatio < 0.3 && fighter.hp > 0) {
      const pulse = Math.sin(state.frameCount * 0.1) * 0.3 + 0.5
      ctx.save()
      ctx.globalAlpha = pulse * 0.15
      const auraGrad = ctx.createRadialGradient(fighter.x, fighter.y - 40, 10, fighter.x, fighter.y - 40, 80)
      auraGrad.addColorStop(0, fighter.character.color)
      auraGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = auraGrad
      ctx.fillRect(fighter.x - 80, fighter.y - 120, 160, 160)
      ctx.restore()
    }
  }
  drawAura(state.player1)
  drawAura(state.player2)
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  // Ground line
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT)
  groundGrad.addColorStop(0, '#1a1a3a')
  groundGrad.addColorStop(1, '#0d0d1f')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y)

  // Ground line glow
  ctx.strokeStyle = '#334'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y)
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(100,100,200,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y + 1)
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 1)
  ctx.stroke()
}

function drawStickman(ctx: CanvasRenderingContext2D, fighter: Fighter, state: GameState): void {
  ctx.save()
  ctx.translate(fighter.x, fighter.y)

  const f = fighter.facing
  const color = fighter.character.color
  const accent = fighter.character.accentColor
  const action = fighter.action
  const frame = fighter.actionFrame
  const breathe = Math.sin(state.frameCount * 0.06 + fighter.animationOffset) * 2

  // Invincibility flash
  if (fighter.invincibleFrames > 0 && state.frameCount % 4 < 2) {
    ctx.globalAlpha = 0.5
  }

  // Death fade
  if (action === 'dead') {
    ctx.globalAlpha = Math.max(0, 1 - frame / 60)
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(0, 2, 25, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Calculate body positions based on action
  let headY = -70 + breathe
  let bodyTopY = -60 + breathe
  let bodyBottomY = -25
  let leftFootX = -12 * f
  let leftFootY = 0
  let rightFootX = 12 * f
  let rightFootY = 0
  let leftHandX = -25 * f
  let leftHandY = -45 + breathe
  let rightHandX = 25 * f
  let rightHandY = -45 + breathe
  let lean = 0

  // Animation states
  switch (action) {
    case 'walk_forward': {
      const walkCycle = Math.sin(frame * 0.3) * 15
      leftFootX = -12 * f + walkCycle * f
      rightFootX = 12 * f - walkCycle * f
      leftHandX = -20 * f - walkCycle * 0.5 * f
      rightHandX = 20 * f + walkCycle * 0.5 * f
      lean = 3 * f
      break
    }
    case 'walk_back': {
      const walkCycle = Math.sin(frame * 0.25) * 12
      leftFootX = -12 * f + walkCycle * f
      rightFootX = 12 * f - walkCycle * f
      lean = -3 * f
      break
    }
    case 'jump': {
      headY = -75
      bodyTopY = -65
      leftFootX = -8 * f
      leftFootY = 10
      rightFootX = 8 * f
      rightFootY = 10
      leftHandY = -60
      rightHandY = -60
      break
    }
    case 'crouch': {
      headY = -50
      bodyTopY = -42
      bodyBottomY = -15
      leftHandY = -30
      rightHandY = -30
      break
    }
    case 'light_attack': {
      const punch = frame < 7 ? Math.min(1, frame / 4) : Math.max(0, 1 - (frame - 7) / 6)
      rightHandX = (25 + 50 * punch) * f
      rightHandY = -48
      lean = 5 * f * punch
      break
    }
    case 'heavy_attack': {
      const swing = frame < 10 ? Math.min(1, frame / 8) : Math.max(0, 1 - (frame - 10) / 7)
      rightHandX = (20 + 55 * swing) * f
      rightHandY = -35 - 15 * (1 - swing)
      leftHandX = (-15 + 20 * swing) * f
      lean = 8 * f * swing
      bodyTopY += -5 * swing
      break
    }
    case 'special1':
    case 'special2': {
      const idx = action === 'special1' ? 0 : 1
      const special = fighter.character.specials[idx]
      if (special) {
        if (special.type === 'projectile') {
          const charge = frame < special.startup ? frame / special.startup : 1
          rightHandX = (30 + 30 * charge) * f
          rightHandY = -50
          leftHandX = (10 + 20 * charge) * f
          leftHandY = -50
          lean = 3 * f
        } else if (special.type === 'melee') {
          const windup = frame < special.startup ? frame / special.startup : 0
          const strike = frame >= special.startup && frame < special.startup + special.active
            ? (frame - special.startup) / special.active : 0
          if (windup > 0) {
            rightHandX = (-10 - 20 * windup) * f
            rightHandY = -55 - 10 * windup
          }
          if (strike > 0) {
            rightHandX = (30 + 40 * strike) * f
            rightHandY = -40
            headY -= 5
            lean = 10 * f * strike
          }
        } else if (special.type === 'teleport') {
          ctx.globalAlpha *= 0.5
        } else if (special.type === 'counter') {
          leftHandX = -5 * f
          leftHandY = -50
          rightHandX = 5 * f
          rightHandY = -50
          lean = -2 * f
        }
      }
      break
    }
    case 'ultimate': {
      const phase = frame / fighter.actionDuration
      if (phase < 0.2) {
        // Charge up
        const charge = phase / 0.2
        headY -= 5 * charge
        rightHandY = -60 - 15 * charge
        leftHandY = -60 - 15 * charge
        rightHandX = 15 * f
        leftHandX = -15 * f
        // Aura
        ctx.save()
        ctx.globalAlpha = charge * 0.6
        const auraGrad = ctx.createRadialGradient(0, -40, 5, 0, -40, 60 * charge)
        auraGrad.addColorStop(0, color)
        auraGrad.addColorStop(0.5, accent)
        auraGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = auraGrad
        ctx.beginPath()
        ctx.arc(0, -40, 60 * charge, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      } else if (phase < 0.6) {
        // Strike
        const strike = (phase - 0.2) / 0.4
        rightHandX = (30 + 50 * strike) * f
        rightHandY = -45
        leftHandX = (-10 + 20 * strike) * f
        lean = 15 * f * strike
        // Ultimate flash
        ctx.save()
        ctx.globalAlpha = Math.max(0, 0.5 - strike * 0.5)
        ctx.fillStyle = color
        ctx.fillRect(-CANVAS_WIDTH, -CANVAS_HEIGHT, CANVAS_WIDTH * 3, CANVAS_HEIGHT * 3)
        ctx.restore()
      } else {
        // Recovery
        const rec = (phase - 0.6) / 0.4
        lean = 15 * f * (1 - rec)
        rightHandX = (80 * (1 - rec)) * f
      }
      break
    }
    case 'block': {
      leftHandX = 5 * f
      leftHandY = -55
      rightHandX = 8 * f
      rightHandY = -40
      lean = -3 * f
      break
    }
    case 'dodge': {
      const roll = Math.min(1, frame / 8)
      ctx.globalAlpha *= 0.6
      lean = roll * 30 * (fighter.velocityX > 0 ? 1 : -1)
      bodyBottomY += 10
      headY += 15
      bodyTopY += 10
      break
    }
    case 'hit_stun': {
      const stun = Math.min(1, frame / 5)
      lean = -8 * f * stun
      headY += 5 * stun
      rightHandX = (-15 - 10 * stun) * f
      leftHandX = (15 + 10 * stun) * f
      if (frame % 4 < 2) ctx.globalAlpha *= 0.8
      break
    }
    case 'knockdown': {
      const fall = Math.min(1, frame / 15)
      lean = -60 * f * fall
      headY += 40 * fall
      bodyTopY += 30 * fall
      bodyBottomY += 20 * fall
      break
    }
    case 'victory': {
      const pump = Math.sin(frame * 0.15) * 10
      rightHandY = -75 + pump
      rightHandX = 15 * f
      leftHandY = -75 + pump
      leftHandX = -15 * f
      break
    }
    default:
      break
  }

  // Apply lean
  ctx.rotate((lean * Math.PI) / 180)

  const lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 6

  // Body line (torso)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(0, bodyTopY)
  ctx.lineTo(0, bodyBottomY)
  ctx.stroke()

  // Head
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, headY, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Eyes
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(3 * f, headY - 2, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = action === 'ultimate' ? '#ff0' : '#000'
  ctx.beginPath()
  ctx.arc(3.5 * f, headY - 2, 1.2, 0, Math.PI * 2)
  ctx.fill()

  // Arms
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  // Left arm
  ctx.beginPath()
  ctx.moveTo(0, bodyTopY + 5)
  ctx.quadraticCurveTo(leftHandX * 0.4, (bodyTopY + leftHandY) / 2, leftHandX, leftHandY)
  ctx.stroke()
  // Right arm
  ctx.beginPath()
  ctx.moveTo(0, bodyTopY + 5)
  ctx.quadraticCurveTo(rightHandX * 0.4, (bodyTopY + rightHandY) / 2, rightHandX, rightHandY)
  ctx.stroke()

  // Fist glow on attacks
  if (action === 'light_attack' || action === 'heavy_attack' || action === 'special1' || action === 'special2' || action === 'ultimate') {
    ctx.save()
    ctx.shadowColor = accent
    ctx.shadowBlur = 12
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(rightHandX, rightHandY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Legs
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  // Left leg
  ctx.beginPath()
  ctx.moveTo(0, bodyBottomY)
  ctx.quadraticCurveTo(leftFootX * 0.3, (bodyBottomY + leftFootY) / 2 + 5, leftFootX, leftFootY)
  ctx.stroke()
  // Right leg
  ctx.beginPath()
  ctx.moveTo(0, bodyBottomY)
  ctx.quadraticCurveTo(rightFootX * 0.3, (bodyBottomY + rightFootY) / 2 + 5, rightFootX, rightFootY)
  ctx.stroke()

  // Energy bar indicator under character
  if (fighter.energy > 0 && fighter.hp > 0) {
    ctx.save()
    ctx.shadowBlur = 0
    const barW = 40
    const barH = 3
    const barX = -barW / 2
    const barY = 8
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(barX, barY, barW, barH)
    const energyRatio = fighter.energy / 100
    ctx.fillStyle = energyRatio >= 1 ? '#ffcc00' : accent
    ctx.fillRect(barX, barY, barW * energyRatio, barH)
    ctx.restore()
  }

  ctx.restore()
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile, frame: number): void {
  ctx.save()
  ctx.translate(proj.x, proj.y)

  const pulse = Math.sin(frame * 0.3) * 0.3 + 1
  const r = proj.radius * pulse

  ctx.shadowColor = proj.color
  ctx.shadowBlur = 15

  // Outer glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2)
  grad.addColorStop(0, proj.color)
  grad.addColorStop(0.5, proj.color + '88')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, r * 2, 0, Math.PI * 2)
  ctx.fill()

  // Core
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Trail
  ctx.strokeStyle = proj.color + '66'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(-proj.velocityX * 4, -proj.velocityY * 4)
  ctx.stroke()

  ctx.restore()
}

function drawHitEffect(ctx: CanvasRenderingContext2D, effect: HitEffect): void {
  ctx.save()
  ctx.translate(effect.x, effect.y)

  const progress = effect.frame / effect.maxFrames
  const alpha = 1 - progress
  const scale = effect.scale * (0.5 + progress * 1.5)

  ctx.globalAlpha = alpha

  if (effect.type === 'block') {
    // Shield flash
    ctx.strokeStyle = '#88bbff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 20 * scale, -Math.PI * 0.3, Math.PI * 0.3)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 25 * scale, -Math.PI * 0.2, Math.PI * 0.2)
    ctx.stroke()
  } else if (effect.type === 'ultimate') {
    // Big explosion
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 20
    const colors = ['#fff', '#ff0', '#f80', '#f00']
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = colors[i]
      ctx.lineWidth = 4 - i
      const r = (15 + i * 12) * scale
      ctx.beginPath()
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2 + progress * 2
        const px = Math.cos(angle) * r
        const py = Math.sin(angle) * r
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }
  } else {
    // Standard hit - starburst
    const colors = effect.type === 'heavy' ? ['#fff', '#ff8'] : effect.type === 'special' ? ['#fff', '#8ff'] : ['#fff', '#ffa']
    ctx.strokeStyle = colors[0]
    ctx.lineWidth = 2.5
    const rays = effect.type === 'heavy' ? 8 : 6
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2 + progress
      const inner = 5 * scale
      const outer = (15 + (effect.type === 'heavy' ? 15 : 8)) * scale
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      ctx.stroke()
    }

    ctx.fillStyle = colors[1]
    ctx.beginPath()
    ctx.arc(0, 0, 8 * scale * (1 - progress), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.save()
  const alpha = particle.life / particle.maxLife
  ctx.globalAlpha = alpha

  if (particle.type === 'spark') {
    ctx.strokeStyle = particle.color
    ctx.lineWidth = particle.size * 0.5
    ctx.beginPath()
    ctx.moveTo(particle.x, particle.y)
    ctx.lineTo(particle.x - particle.velocityX * 3, particle.y - particle.velocityY * 3)
    ctx.stroke()
  } else {
    ctx.fillStyle = particle.color
    ctx.shadowColor = particle.color
    ctx.shadowBlur = particle.type === 'energy' ? 8 : 4
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.save()
  ctx.shadowBlur = 0

  const p1 = state.player1
  const p2 = state.player2
  const barWidth = 350
  const barHeight = 22
  const barY = 20
  const padding = 20

  // Background bar area
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, 75)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 75)
  ctx.lineTo(CANVAS_WIDTH, 75)
  ctx.stroke()

  // Player 1 HP bar (left, fills right to left)
  drawHealthBar(ctx, padding, barY, barWidth, barHeight, p1, false)

  // Player 2 HP bar (right, fills left to right)
  drawHealthBar(ctx, CANVAS_WIDTH - padding - barWidth, barY, barWidth, barHeight, p2, true)

  // Timer
  const timeStr = Math.ceil(state.timer / 60).toString()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(timeStr, CANVAS_WIDTH / 2, barY + 22)

  // Round indicator
  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`ROUND ${state.roundNumber}`, CANVAS_WIDTH / 2, barY + 40)

  // Win dots
  drawWinDots(ctx, CANVAS_WIDTH / 2 - 30, barY + 50, state.player1Wins)
  drawWinDots(ctx, CANVAS_WIDTH / 2 + 20, barY + 50, state.player2Wins)

  // Names
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = p1.character.color
  ctx.fillText(p1.character.name.toUpperCase(), padding + 2, barY + barHeight + 16)
  ctx.textAlign = 'right'
  ctx.fillStyle = p2.character.color
  ctx.fillText(p2.character.name.toUpperCase(), CANVAS_WIDTH - padding - 2, barY + barHeight + 16)

  // Energy bars
  drawEnergyBar(ctx, padding, barY + barHeight + 22, 120, 5, p1)
  drawEnergyBar(ctx, CANVAS_WIDTH - padding - 120, barY + barHeight + 22, 120, 5, p2)

  // Combo display
  if (state.comboDisplay.timer > 0 && state.comboDisplay.count > 1) {
    const comboAlpha = Math.min(1, state.comboDisplay.timer / 20)
    ctx.save()
    ctx.globalAlpha = comboAlpha
    ctx.font = 'bold 36px monospace'
    ctx.textAlign = state.comboDisplay.side === 'left' ? 'left' : 'right'
    const cx = state.comboDisplay.side === 'left' ? 30 : CANVAS_WIDTH - 30
    const cy = CANVAS_HEIGHT / 2

    ctx.fillStyle = '#000'
    ctx.fillText(`${state.comboDisplay.count} HIT`, cx + 2, cy + 2)
    ctx.fillStyle = state.comboDisplay.count >= 5 ? '#ff4444' : state.comboDisplay.count >= 3 ? '#ffaa00' : '#ffffff'
    ctx.fillText(`${state.comboDisplay.count} HIT`, cx, cy)

    if (state.comboDisplay.count >= 3) {
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = '#ffcc00'
      const label = state.comboDisplay.count >= 7 ? 'INSANE!' : state.comboDisplay.count >= 5 ? 'AMAZING!' : 'GREAT!'
      ctx.fillText(label, cx, cy + 22)
    }
    ctx.restore()
  }

  // Last hit type
  if (state.lastHitType && state.comboDisplay.timer > 30) {
    ctx.save()
    ctx.globalAlpha = (state.comboDisplay.timer - 30) / 30
    ctx.font = 'bold 16px sans-serif'
    ctx.fillStyle = '#00ffcc'
    ctx.textAlign = 'center'
    ctx.fillText(state.lastHitType.toUpperCase(), CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40)
    ctx.restore()
  }

  ctx.restore()
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fighter: Fighter,
  mirrored: boolean
): void {
  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(x, y, w, h)

  // HP fill
  const hpRatio = Math.max(0, fighter.hp / fighter.character.stats.maxHp)
  const fillW = w * hpRatio

  const hpColor = hpRatio > 0.5 ? fighter.character.color : hpRatio > 0.25 ? '#ffaa00' : '#ff3333'
  const grad = ctx.createLinearGradient(x, y, x, y + h)
  grad.addColorStop(0, hpColor)
  grad.addColorStop(1, hpColor + '88')

  if (mirrored) {
    ctx.fillStyle = grad
    ctx.fillRect(x + w - fillW, y, fillW, h)
  } else {
    ctx.fillStyle = grad
    ctx.fillRect(x, y, fillW, h)
  }

  // Damage flash
  if (fighter.hitStunFrames > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    if (mirrored) {
      ctx.fillRect(x + w - fillW, y, fillW, h)
    } else {
      ctx.fillRect(x, y, fillW, h)
    }
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)

  // HP text
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = mirrored ? 'right' : 'left'
  ctx.fillText(`${fighter.hp}`, mirrored ? x + w - 4 : x + 4, y + h - 5)
}

function drawEnergyBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fighter: Fighter
): void {
  ctx.fillStyle = '#0a0a1e'
  ctx.fillRect(x, y, w, h)

  const ratio = fighter.energy / 100
  const full = ratio >= 1

  ctx.fillStyle = full ? '#ffcc00' : '#00aaff'
  ctx.fillRect(x, y, w * ratio, h)

  if (full) {
    ctx.strokeStyle = '#ffcc00'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
  }
}

function drawWinDots(ctx: CanvasRenderingContext2D, x: number, y: number, wins: number): void {
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = i < wins ? '#ffcc00' : '#333'
    ctx.beginPath()
    ctx.arc(x + i * 14, y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ===== PHASE OVERLAYS =====

export function drawIntroOverlay(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number): void {
  const scaleX = canvasW / CANVAS_WIDTH
  const scaleY = canvasH / CANVAS_HEIGHT
  ctx.save()
  ctx.scale(scaleX, scaleY)

  const progress = Math.min(1, state.frameCount / 90)
  ctx.fillStyle = `rgba(0,0,0,${0.7 * (1 - progress)})`
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (progress < 0.5) {
    ctx.globalAlpha = 1 - progress * 2
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ROUND ' + state.roundNumber, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
  } else {
    ctx.globalAlpha = (progress - 0.5) * 2
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 56px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FIGHT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
  }

  ctx.restore()
}

export function drawRoundEndOverlay(ctx: CanvasRenderingContext2D, state: GameState, canvasW: number, canvasH: number, winner: string): void {
  const scaleX = canvasW / CANVAS_WIDTH
  const scaleY = canvasH / CANVAS_HEIGHT
  ctx.save()
  ctx.scale(scaleX, scaleY)

  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#ffcc00'
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('K.O.!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px sans-serif'
  ctx.fillText(`${winner} WINS THE ROUND`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

  ctx.restore()
}
