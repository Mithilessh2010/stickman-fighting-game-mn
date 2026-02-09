// ===== GAME TYPES =====

export type CharacterId = 'kaito' | 'yuki' | 'gorath' | 'akira' | 'hana'
export type BossId = 'shadow_lord' | 'thunder_god' | 'void_emperor'
export type Difficulty = 'easy' | 'normal' | 'hard' | 'legendary'

export interface CharacterStats {
  maxHp: number
  attack: number
  defense: number
  speed: number
  comboRate: number
}

export interface SpecialMove {
  name: string
  damage: number
  energyCost: number
  range: number
  startup: number // frames before active
  active: number  // active frames
  recovery: number // recovery frames
  type: 'melee' | 'projectile' | 'grab' | 'counter' | 'teleport'
  knockback: number
}

export interface ComboSequence {
  name: string
  inputs: AttackType[]
  damage: number
  hitCount: number
}

export interface Ultimate {
  name: string
  damage: number
  energyRequired: number
  animation: string
  duration: number
}

export interface Character {
  id: CharacterId | BossId
  name: string
  title: string
  stats: CharacterStats
  color: string
  accentColor: string
  specials: SpecialMove[]
  combos: ComboSequence[]
  ultimate: Ultimate
  isBoss: boolean
  description: string
}

export type AttackType = 'light' | 'heavy' | 'special1' | 'special2' | 'ultimate'
export type ActionType = 'idle' | 'walk_forward' | 'walk_back' | 'jump' | 'crouch' | 'light_attack' | 'heavy_attack' | 'special1' | 'special2' | 'ultimate' | 'block' | 'dodge' | 'hit_stun' | 'knockdown' | 'dead' | 'intro' | 'victory'

export interface Fighter {
  character: Character
  x: number
  y: number
  velocityX: number
  velocityY: number
  hp: number
  energy: number
  facing: 1 | -1
  action: ActionType
  actionFrame: number
  actionDuration: number
  comboCount: number
  comboTimer: number
  comboInputs: AttackType[]
  isGrounded: boolean
  isBlocking: boolean
  isDodging: boolean
  dodgeCooldown: number
  hitStunFrames: number
  blockStunFrames: number
  invincibleFrames: number
  lastDamageTime: number
  animationOffset: number
}

export interface Projectile {
  x: number
  y: number
  velocityX: number
  velocityY: number
  damage: number
  owner: 'player1' | 'player2'
  color: string
  radius: number
  lifetime: number
  maxLifetime: number
}

export interface Particle {
  x: number
  y: number
  velocityX: number
  velocityY: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'hit' | 'block' | 'energy' | 'ultimate' | 'dust' | 'spark'
}

export interface HitEffect {
  x: number
  y: number
  frame: number
  maxFrames: number
  type: 'light' | 'heavy' | 'special' | 'ultimate' | 'block' | 'counter'
  scale: number
}

export interface GameState {
  phase: 'intro' | 'fighting' | 'round_end' | 'match_end'
  player1: Fighter
  player2: Fighter
  projectiles: Projectile[]
  particles: Particle[]
  hitEffects: HitEffect[]
  timer: number
  frameCount: number
  roundNumber: number
  player1Wins: number
  player2Wins: number
  screenShake: number
  slowMotion: number
  lastHitType: string
  comboDisplay: { count: number, timer: number, side: 'left' | 'right' }
}

export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  light: boolean
  heavy: boolean
  special: boolean
  ultimate: boolean
  block: boolean
  dodge: boolean
  lightPressed: boolean
  heavyPressed: boolean
  specialPressed: boolean
  ultimatePressed: boolean
  dodgePressed: boolean
}

export interface StageConfig {
  name: string
  opponent: CharacterId | BossId
  difficulty: number // 0-1 scale
  isBoss: boolean
  description: string
}

export interface CampaignPath {
  difficulty: Difficulty
  stages: StageConfig[]
  description: string
}

export type GameMode = 'menu' | 'character_select' | 'difficulty_select' | 'fighting' | 'campaign' | 'multiplayer_lobby' | 'game_over' | 'victory' | 'controls'
export type MultiplayerMode = 'local' | 'none'
