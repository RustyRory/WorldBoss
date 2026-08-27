'use strict';

module.exports = {
  gloves_worn: {
    id: 'gloves_worn',
    name: 'Gants usés',
    type: 'gloves',
    rarity: 'common',
    stats: { atk: 1 },
    skill: null,
    passive: null,
    price: 20,
    levelRequired: 1,
  },
  gloves_leather: {
    id: 'gloves_leather',
    name: 'Gants de cuir',
    type: 'gloves',
    rarity: 'rare',
    stats: { atk: 2, crit: 3 },
    skill: null,
    passive: null,
    price: 110,
    levelRequired: 3,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_grips: {
    id: 'bone_grips',
    name: 'Poignes d\'os',
    type: 'gloves',
    rarity: 'common',
    stats: { atk: 2 },
    skill: null,
    passive: null,
    price: 25,
    levelRequired: 1,
  },

  catacomb_gauntlets: {
    id: 'catacomb_gauntlets',
    name: 'Gantelets des catacombes',
    type: 'gloves',
    rarity: 'rare',
    stats: { atk: 3, crit: 5 },
    skill: null,
    passive: null,
    price: 140,
    levelRequired: 3,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  bandit_grips: {
    id: 'bandit_grips',
    name: 'Poignes de bandit',
    type: 'gloves',
    rarity: 'common',
    stats: { atk: 3, crit: 5 },
    skill: null,
    passive: null,
    price: 110,
    levelRequired: 6,
  },

  assassin_gloves: {
    id: 'assassin_gloves',
    name: 'Gants de l\'assassin',
    type: 'gloves',
    rarity: 'rare',
    stats: { crit: 12, atk: 2 },
    skill: null,
    passive: null,
    price: 280,
    levelRequired: 7,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  shadow_gloves: {
    id: 'shadow_gloves',
    name: 'Gants de l\'ombre',
    type: 'gloves',
    rarity: 'rare',
    stats: { crit: 10, atk: 2 },
    skill: null,
    passive: null,
    price: 220,
    levelRequired: 5,
  },

  // ── Arc 6 ─────────────────────────────────────────────────────────────────
  steam_gauntlets: {
    id: 'steam_gauntlets',
    name: 'Gantelets à vapeur',
    type: 'gloves',
    rarity: 'epic',
    stats: { atk: 8, crit: 10 },
    skill: null,
    passive: null,
    price: 680,
    levelRequired: 14,
  },

  // ── Arc 7 ─────────────────────────────────────────────────────────────────
  pharaoh_grips: {
    id: 'pharaoh_grips',
    name: 'Poignes du Pharaon',
    type: 'gloves',
    rarity: 'epic',
    stats: { atk: 10, crit: 12 },
    skill: null,
    passive: null,
    price: 980,
    levelRequired: 17,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  infernal_claws: {
    id: 'infernal_claws',
    name: 'Griffes infernales',
    type: 'gloves',
    rarity: 'legendary',
    stats: { atk: 15, crit: 15 },
    skill: null,
    passive: null,
    price: 2100,
    levelRequired: 21,
  },
};
