'use strict';

module.exports = {
  boots_simple: {
    id: 'boots_simple',
    name: 'Bottes simples',
    type: 'boots',
    rarity: 'common',
    stats: { spd: 1 },
    skill: null,
    passive: null,
    price: 20,
    levelRequired: 1,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_wraps: {
    id: 'bone_wraps',
    name: 'Bandelettes d\'os',
    type: 'boots',
    rarity: 'common',
    stats: { spd: 2 },
    skill: null,
    passive: null,
    price: 15,
    levelRequired: 1,
  },

  grave_boots: {
    id: 'grave_boots',
    name: 'Bottes de la tombe',
    type: 'boots',
    rarity: 'rare',
    stats: { spd: 3, def: 2 },
    skill: null,
    passive: null,
    price: 110,
    levelRequired: 3,
  },

  boots_light: {
    id: 'boots_light',
    name: 'Bottes légères',
    type: 'boots',
    rarity: 'rare',
    stats: { spd: 3 },
    skill: null,
    passive: null,
    price: 100,
    levelRequired: 3,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  boots_shadow: {
    id: 'boots_shadow',
    name: 'Bottes de l\'ombre',
    type: 'boots',
    rarity: 'rare',
    stats: { spd: 5, crit: 8 },
    skill: null,
    passive: null,
    price: 180,
    levelRequired: 5,
  },

  // ── Arc 4-5 ──────────────────────────────────────────────────────────────
  sandals_desert: {
    id: 'sandals_desert',
    name: 'Sandales du désert',
    type: 'boots',
    rarity: 'rare',
    stats: { spd: 6 },
    skill: null,
    passive: null,
    price: 200,
    levelRequired: 8,
  },

  // ── Arc 6 ─────────────────────────────────────────────────────────────────
  boots_steam: {
    id: 'boots_steam',
    name: 'Bottes à vapeur',
    type: 'boots',
    rarity: 'epic',
    stats: { spd: 8, def: 5 },
    skill: null,
    passive: null,
    price: 600,
    levelRequired: 14,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  boots_infernal: {
    id: 'boots_infernal',
    name: 'Bottes infernales',
    type: 'boots',
    rarity: 'legendary',
    stats: { spd: 10, atk: 4 },
    skill: null,
    passive: null,
    price: 1800,
    levelRequired: 21,
  },
};
