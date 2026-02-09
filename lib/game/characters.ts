import type { Character, CharacterId, BossId } from './types'

export const PLAYABLE_CHARACTERS: Record<CharacterId, Character> = {
  kaito: {
    id: 'kaito',
    name: 'Kaito',
    title: 'The Blazing Fist',
    description: 'A balanced warrior who channels fire energy. Reliable in any situation with strong fundamentals.',
    stats: { maxHp: 1000, attack: 80, defense: 75, speed: 70, comboRate: 75 },
    color: '#ff4444',
    accentColor: '#ff8800',
    specials: [
      { name: 'Ember Bolt', damage: 120, energyCost: 25, range: 400, startup: 8, active: 4, recovery: 12, type: 'projectile', knockback: 5 },
      { name: 'Rising Dragon', damage: 150, energyCost: 30, range: 80, startup: 4, active: 8, recovery: 18, type: 'melee', knockback: 12 },
    ],
    combos: [
      { name: 'Fire Rush', inputs: ['light', 'light', 'heavy'], damage: 200, hitCount: 3 },
      { name: 'Inferno Chain', inputs: ['light', 'heavy', 'special1'], damage: 320, hitCount: 4 },
      { name: 'Dragon Sequence', inputs: ['heavy', 'heavy', 'special2'], damage: 380, hitCount: 5 },
    ],
    ultimate: { name: 'Supernova Fist', damage: 500, energyRequired: 100, animation: 'supernova', duration: 90 },
    isBoss: false,
  },
  yuki: {
    id: 'yuki',
    name: 'Yuki',
    title: 'The Phantom Blade',
    description: 'Lightning-fast ninja who overwhelms foes with speed. Glass cannon with devastating combos.',
    stats: { maxHp: 750, attack: 90, defense: 50, speed: 100, comboRate: 95 },
    color: '#00ccff',
    accentColor: '#0088ff',
    specials: [
      { name: 'Shadow Step', damage: 80, energyCost: 20, range: 250, startup: 3, active: 6, recovery: 8, type: 'teleport', knockback: 3 },
      { name: 'Blade Storm', damage: 180, energyCost: 35, range: 120, startup: 6, active: 10, recovery: 14, type: 'melee', knockback: 8 },
    ],
    combos: [
      { name: 'Swift Cuts', inputs: ['light', 'light', 'light'], damage: 180, hitCount: 4 },
      { name: 'Phantom Dance', inputs: ['light', 'light', 'special1', 'heavy'], damage: 350, hitCount: 6 },
      { name: 'Endless Edge', inputs: ['light', 'heavy', 'light', 'special2'], damage: 420, hitCount: 8 },
    ],
    ultimate: { name: 'Thousand Cuts', damage: 550, energyRequired: 100, animation: 'thousand_cuts', duration: 100 },
    isBoss: false,
  },
  gorath: {
    id: 'gorath',
    name: 'Gorath',
    title: 'The Iron Mountain',
    description: 'An unstoppable juggernaut. Slow but immensely powerful with unmatched defense.',
    stats: { maxHp: 1400, attack: 100, defense: 95, speed: 40, comboRate: 45 },
    color: '#88aa44',
    accentColor: '#556622',
    specials: [
      { name: 'Ground Pound', damage: 200, energyCost: 30, range: 200, startup: 14, active: 6, recovery: 20, type: 'melee', knockback: 18 },
      { name: 'Iron Fortress', damage: 0, energyCost: 25, range: 0, startup: 6, active: 30, recovery: 10, type: 'counter', knockback: 0 },
    ],
    combos: [
      { name: 'Hammer Blow', inputs: ['heavy', 'heavy'], damage: 280, hitCount: 2 },
      { name: 'Titan Crush', inputs: ['heavy', 'special1', 'heavy'], damage: 450, hitCount: 3 },
      { name: 'Earthquake', inputs: ['heavy', 'heavy', 'special1'], damage: 500, hitCount: 4 },
    ],
    ultimate: { name: 'Continental Crush', damage: 650, energyRequired: 100, animation: 'continental', duration: 110 },
    isBoss: false,
  },
  akira: {
    id: 'akira',
    name: 'Akira',
    title: 'The Storm Weaver',
    description: 'Master of ranged combat with energy projectiles and barriers. Controls space with precision.',
    stats: { maxHp: 850, attack: 85, defense: 60, speed: 65, comboRate: 70 },
    color: '#aa44ff',
    accentColor: '#6622aa',
    specials: [
      { name: 'Spirit Orb', damage: 100, energyCost: 20, range: 500, startup: 10, active: 4, recovery: 10, type: 'projectile', knockback: 6 },
      { name: 'Void Barrier', damage: 60, energyCost: 30, range: 150, startup: 8, active: 15, recovery: 12, type: 'counter', knockback: 10 },
    ],
    combos: [
      { name: 'Arcane Volley', inputs: ['special1', 'special1', 'heavy'], damage: 260, hitCount: 3 },
      { name: 'Storm Cage', inputs: ['light', 'special1', 'special2'], damage: 340, hitCount: 4 },
      { name: 'Astral Onslaught', inputs: ['special1', 'heavy', 'special2', 'special1'], damage: 480, hitCount: 6 },
    ],
    ultimate: { name: 'Dimensional Rift', damage: 520, energyRequired: 100, animation: 'rift', duration: 95 },
    isBoss: false,
  },
  hana: {
    id: 'hana',
    name: 'Hana',
    title: 'The Crimson Chain',
    description: 'Combo specialist who chains devastating attack strings. Rewards aggressive, skillful play.',
    stats: { maxHp: 900, attack: 75, defense: 65, speed: 85, comboRate: 100 },
    color: '#ff44aa',
    accentColor: '#cc2288',
    specials: [
      { name: 'Chain Lash', damage: 90, energyCost: 15, range: 200, startup: 5, active: 8, recovery: 10, type: 'melee', knockback: 4 },
      { name: 'Rising Petal', damage: 130, energyCost: 25, range: 100, startup: 6, active: 6, recovery: 14, type: 'melee', knockback: 10 },
    ],
    combos: [
      { name: 'Blossom Rush', inputs: ['light', 'light', 'light', 'heavy'], damage: 260, hitCount: 5 },
      { name: 'Petal Storm', inputs: ['light', 'special1', 'light', 'special2'], damage: 380, hitCount: 7 },
      { name: 'Eternal Bloom', inputs: ['light', 'light', 'special1', 'heavy', 'special2'], damage: 520, hitCount: 10 },
    ],
    ultimate: { name: 'Crimson Requiem', damage: 480, energyRequired: 100, animation: 'requiem', duration: 105 },
    isBoss: false,
  },
}

export const BOSS_CHARACTERS: Record<BossId, Character> = {
  shadow_lord: {
    id: 'shadow_lord',
    name: 'Shadow Lord',
    title: 'Harbinger of Darkness',
    description: 'A dark entity that feeds on despair. His attacks drain life and energy.',
    stats: { maxHp: 1600, attack: 95, defense: 85, speed: 60, comboRate: 70 },
    color: '#333366',
    accentColor: '#8844cc',
    specials: [
      { name: 'Dark Wave', damage: 160, energyCost: 20, range: 450, startup: 10, active: 6, recovery: 14, type: 'projectile', knockback: 8 },
      { name: 'Shadow Grab', damage: 200, energyCost: 30, range: 120, startup: 8, active: 8, recovery: 16, type: 'grab', knockback: 14 },
    ],
    combos: [
      { name: 'Dark Chain', inputs: ['light', 'heavy', 'special1'], damage: 350, hitCount: 4 },
      { name: 'Oblivion', inputs: ['heavy', 'special1', 'special2', 'heavy'], damage: 500, hitCount: 6 },
    ],
    ultimate: { name: 'Eternal Night', damage: 600, energyRequired: 100, animation: 'eternal_night', duration: 100 },
    isBoss: true,
  },
  thunder_god: {
    id: 'thunder_god',
    name: 'Raijin',
    title: 'The Thunder God',
    description: 'Ancient deity of storms. Strikes with lightning speed and devastating thunder.',
    stats: { maxHp: 1800, attack: 110, defense: 80, speed: 80, comboRate: 75 },
    color: '#ffcc00',
    accentColor: '#ff8800',
    specials: [
      { name: 'Lightning Bolt', damage: 180, energyCost: 25, range: 500, startup: 6, active: 4, recovery: 12, type: 'projectile', knockback: 10 },
      { name: 'Thunder Clap', damage: 220, energyCost: 35, range: 180, startup: 10, active: 8, recovery: 18, type: 'melee', knockback: 16 },
    ],
    combos: [
      { name: 'Storm Fury', inputs: ['light', 'light', 'special1', 'heavy'], damage: 450, hitCount: 5 },
      { name: 'Divine Wrath', inputs: ['heavy', 'special2', 'special1', 'heavy'], damage: 600, hitCount: 7 },
    ],
    ultimate: { name: 'Ragnarok Thunder', damage: 700, energyRequired: 100, animation: 'ragnarok', duration: 110 },
    isBoss: true,
  },
  void_emperor: {
    id: 'void_emperor',
    name: 'Void Emperor',
    title: 'The Final Destruction',
    description: 'The ultimate enemy. Master of all elements with reality-warping power.',
    stats: { maxHp: 2200, attack: 120, defense: 90, speed: 75, comboRate: 85 },
    color: '#ff0044',
    accentColor: '#440022',
    specials: [
      { name: 'Void Rend', damage: 200, energyCost: 20, range: 400, startup: 8, active: 6, recovery: 14, type: 'projectile', knockback: 12 },
      { name: 'Reality Shatter', damage: 250, energyCost: 30, range: 200, startup: 6, active: 10, recovery: 16, type: 'melee', knockback: 18 },
    ],
    combos: [
      { name: 'Annihilation', inputs: ['heavy', 'heavy', 'special1', 'special2'], damage: 550, hitCount: 6 },
      { name: 'End of Days', inputs: ['light', 'special1', 'heavy', 'special2', 'heavy'], damage: 750, hitCount: 9 },
    ],
    ultimate: { name: 'Cosmic Erasure', damage: 800, energyRequired: 100, animation: 'cosmic_erasure', duration: 120 },
    isBoss: true,
  },
}

export function getCharacter(id: CharacterId | BossId): Character {
  if (id in PLAYABLE_CHARACTERS) return PLAYABLE_CHARACTERS[id as CharacterId]
  return BOSS_CHARACTERS[id as BossId]
}

export const CHARACTER_LIST: CharacterId[] = ['kaito', 'yuki', 'gorath', 'akira', 'hana']
