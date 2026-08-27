'use strict';

module.exports = {
  shield_wood: {
    id: 'shield_wood',
    name: 'Bouclier de bois',
    type: 'shield',
    rarity: 'common',
    stats: { def: 3 },
    skill: null,
    passive: null,
    price: 25,
    levelRequired: 1,
  },
  shield_iron: {
    id: 'shield_iron',
    name: 'Bouclier de fer',
    type: 'shield',
    rarity: 'rare',
    stats: { def: 6, hp: 5 },
    skill: null,
    passive: null,
    price: 130,
    levelRequired: 3,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_shield: {
    id: 'bone_shield',
    name: 'Bouclier d\'os',
    type: 'shield',
    rarity: 'common',
    stats: { def: 3, hp: 5 },
    skill: null,
    passive: null,
    price: 30,
    levelRequired: 1,
  },

  tomb_buckler: {
    id: 'tomb_buckler',
    name: 'Rondache de la tombe',
    type: 'shield',
    rarity: 'rare',
    stats: { def: 6, hp: 8 },
    skill: null,
    passive: null,
    price: 140,
    levelRequired: 3,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  bandit_targe: {
    id: 'bandit_targe',
    name: 'Targe de bandit',
    type: 'shield',
    rarity: 'common',
    stats: { def: 5, spd: 1 },
    skill: null,
    passive: null,
    price: 110,
    levelRequired: 6,
  },

  knight_shield: {
    id: 'knight_shield',
    name: 'Bouclier du chevalier',
    type: 'shield',
    rarity: 'rare',
    stats: { def: 10, hp: 15 },
    skill: null,
    passive: null,
    price: 260,
    levelRequired: 8,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  scale_shield: {
    id: 'scale_shield',
    name: 'Bouclier d\'écailles',
    type: 'shield',
    rarity: 'rare',
    stats: { def: 8, spd: -1 },
    skill: null,
    passive: null,
    price: 240,
    levelRequired: 5,
  },

  // ── Arc 6 ─────────────────────────────────────────────────────────────────
  steam_shield: {
    id: 'steam_shield',
    name: 'Bouclier à vapeur',
    type: 'shield',
    rarity: 'epic',
    stats: { def: 16, hp: 20 },
    skill: null,
    passive: null,
    price: 650,
    levelRequired: 14,
  },

  // ── Arc 7 ─────────────────────────────────────────────────────────────────
  royal_aegis: {
    id: 'royal_aegis',
    name: 'Égide royale',
    type: 'shield',
    rarity: 'epic',
    stats: { def: 20, hp: 25 },
    skill: null,
    passive: null,
    price: 950,
    levelRequired: 17,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  infernal_bulwark: {
    id: 'infernal_bulwark',
    name: 'Rempart infernal',
    type: 'shield',
    rarity: 'legendary',
    stats: { def: 28, hp: 40 },
    skill: null,
    passive: null,
    price: 2000,
    levelRequired: 21,
  },
};
