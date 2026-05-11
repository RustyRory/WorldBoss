'use strict';

module.exports = {
  helmet_broken: {
    id: 'helmet_broken',
    name: 'Casque cassé',
    type: 'helmet',
    rarity: 'common',
    stats: { def: 2 },
    skill: null,
    passive: null,
    price: 30,
    levelRequired: 1,
  },
  helmet_soldier: {
    id: 'helmet_soldier',
    name: 'Casque de soldat',
    type: 'helmet',
    rarity: 'rare',
    stats: { def: 5 },
    skill: null,
    passive: null,
    price: 120,
    levelRequired: 3,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  skull_cap: {
    id: 'skull_cap',
    name: 'Calotte de crâne',
    type: 'helmet',
    rarity: 'common',
    stats: { def: 2, atk: 1 },
    skill: null,
    passive: null,
    price: 25,
    levelRequired: 1,
  },

  catacomb_hood: {
    id: 'catacomb_hood',
    name: 'Capuche des catacombes',
    type: 'helmet',
    rarity: 'rare',
    stats: { def: 4, spd: 1 },
    skill: null,
    passive: null,
    price: 130,
    levelRequired: 3,
  },

  // ── Arc 1-2 ──────────────────────────────────────────────────────────────
  circlet_bone: {
    id: 'circlet_bone',
    name: 'Diadème d\'os',
    type: 'helmet',
    rarity: 'common',
    stats: { def: 3, atk: 2 },
    skill: null,
    passive: null,
    price: 45,
    levelRequired: 2,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  bandana_red: {
    id: 'bandana_red',
    name: 'Bandana rouge',
    type: 'helmet',
    rarity: 'common',
    stats: { def: 3, spd: 2 },
    skill: null,
    passive: null,
    price: 90,
    levelRequired: 6,
  },

  thief_hood: {
    id: 'thief_hood',
    name: 'Capuche du voleur',
    type: 'helmet',
    rarity: 'rare',
    stats: { crit: 15, def: 4 },
    skill: null,
    passive: null,
    price: 210,
    levelRequired: 7,
  },

  iron_mask: {
    id: 'iron_mask',
    name: 'Masque de fer',
    type: 'helmet',
    rarity: 'rare',
    stats: { def: 8, atk: 3 },
    skill: null,
    passive: null,
    price: 240,
    levelRequired: 8,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  hood_shadow: {
    id: 'hood_shadow',
    name: 'Capuche de l\'ombre',
    type: 'helmet',
    rarity: 'rare',
    stats: { crit: 15, def: 2 },
    skill: null,
    passive: null,
    price: 200,
    levelRequired: 5,
  },

  // ── Arc 4-5 ──────────────────────────────────────────────────────────────
  turban_desert: {
    id: 'turban_desert',
    name: 'Turban du désert',
    type: 'helmet',
    rarity: 'rare',
    stats: { def: 6, spd: 2 },
    skill: null,
    passive: null,
    price: 220,
    levelRequired: 8,
  },

  // ── Arc 6 ─────────────────────────────────────────────────────────────────
  goggles_steam: {
    id: 'goggles_steam',
    name: 'Lunettes à vapeur',
    type: 'helmet',
    rarity: 'epic',
    stats: { crit: 20, def: 8 },
    skill: null,
    passive: null,
    price: 650,
    levelRequired: 14,
  },

  // ── Arc 7 ─────────────────────────────────────────────────────────────────
  crown_pharaoh: {
    id: 'crown_pharaoh',
    name: 'Couronne du Pharaon',
    type: 'helmet',
    rarity: 'legendary',
    stats: { atk: 8, def: 10, crit: 10 },
    skill: null,
    passive: null,
    price: 1500,
    levelRequired: 17,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  helm_infernal: {
    id: 'helm_infernal',
    name: 'Heaume infernal',
    type: 'helmet',
    rarity: 'legendary',
    stats: { def: 18, atk: 6 },
    skill: null,
    passive: null,
    price: 1800,
    levelRequired: 21,
  },
};
