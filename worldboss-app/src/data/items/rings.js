'use strict';

module.exports = {
  ring_wood: {
    id: 'ring_wood',
    name: 'Anneau de bois',
    type: 'ring',
    rarity: 'common',
    stats: { hp: 5 },
    skill: null,
    passive: null,
    price: 15,
    levelRequired: 1,
  },
  ring_power: {
    id: 'ring_power',
    name: 'Anneau de puissance',
    type: 'ring',
    rarity: 'rare',
    stats: { atk: 2 },
    skill: null,
    passive: null,
    price: 90,
    levelRequired: 2,
  },
  ring_crit: {
    id: 'ring_crit',
    name: 'Anneau de critique',
    type: 'ring',
    rarity: 'rare',
    stats: { crit: 10 },
    skill: null,
    passive: null,
    price: 130,
    levelRequired: 3,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  assassin_ring: {
    id: 'assassin_ring',
    name: 'Anneau de l\'assassin',
    type: 'ring',
    rarity: 'rare',
    stats: { crit: 15, atk: 4 },
    skill: 'shadow_burst',
    passive: 'bleed',
    price: 320,
    levelRequired: 7,
  },

  boss_signet: {
    id: 'boss_signet',
    name: 'Sceau du chef',
    type: 'ring',
    rarity: 'epic',
    stats: { atk: 7, hp: 25 },
    skill: 'battle_cry',
    passive: 'regeneration',
    price: 480,
    levelRequired: 9,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  ring_shadow: {
    id: 'ring_shadow',
    name: 'Anneau de l\'ombre',
    type: 'ring',
    rarity: 'epic',
    stats: { crit: 15, atk: 3 },
    skill: 'shadow_burst',
    passive: null,
    price: 450,
    levelRequired: 5,
  },
};
