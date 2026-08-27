'use strict';

module.exports = {
  talisman_old: {
    id: 'talisman_old',
    name: 'Talisman ancien',
    type: 'amulet',
    rarity: 'epic',
    stats: {},
    skill: 'soin',
    passive: null,
    price: 400,
    levelRequired: 5,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_fragment: {
    id: 'bone_fragment',
    name: 'Fragment d\'os',
    type: 'amulet',
    rarity: 'common',
    stats: { hp: 8 },
    skill: null,
    passive: null,
    price: 20,
    levelRequired: 1,
  },

  skull_pendant: {
    id: 'skull_pendant',
    name: 'Pendentif de crâne',
    type: 'amulet',
    rarity: 'rare',
    stats: { atk: 3, hp: 10 },
    skill: null,
    passive: 'cursed_strike',
    price: 120,
    levelRequired: 2,
  },

  ghost_talisman: {
    id: 'ghost_talisman',
    name: 'Talisman fantôme',
    type: 'amulet',
    rarity: 'rare',
    stats: { hp: 20 },
    skill: 'spirit_ward',
    passive: null,
    price: 200,
    levelRequired: 3,
  },

  necro_seal: {
    id: 'necro_seal',
    name: 'Sceau nécromantique',
    type: 'amulet',
    rarity: 'rare',
    stats: { atk: 4, def: 2 },
    skill: 'dark_bolt',
    passive: 'bleed',
    price: 260,
    levelRequired: 4,
  },

  // ── Arc 1-2 ──────────────────────────────────────────────────────────────
  amulet_bone: {
    id: 'amulet_bone',
    name: 'Amulette d\'os',
    type: 'amulet',
    rarity: 'rare',
    stats: { hp: 15, def: 3 },
    skill: null,
    passive: null,
    price: 100,
    levelRequired: 2,
  },

  // ── Arc 4-5 ──────────────────────────────────────────────────────────────
  scarab_beetle: {
    id: 'scarab_beetle',
    name: 'Scarabée sacré',
    type: 'amulet',
    rarity: 'rare',
    stats: { hp: 20, spd: 3 },
    skill: null,
    passive: null,
    price: 280,
    levelRequired: 8,
  },

  // ── Arc 7 ─────────────────────────────────────────────────────────────────
  ankh_pharaoh: {
    id: 'ankh_pharaoh',
    name: 'Ânkh du Pharaon',
    type: 'amulet',
    rarity: 'epic',
    stats: { hp: 40 },
    skill: 'divine_heal',
    passive: null,
    price: 1100,
    levelRequired: 17,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  pendant_soul: {
    id: 'pendant_soul',
    name: 'Pendentif de l\'âme',
    type: 'amulet',
    rarity: 'legendary',
    stats: { atk: 10, crit: 20 },
    skill: 'soul_drain',
    passive: 'life_steal',
    price: 2200,
    levelRequired: 21,
  },
};
