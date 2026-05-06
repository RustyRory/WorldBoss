'use strict';

module.exports = {
  ring_wood: {
    id: 'ring_wood',
    name: 'Anneau de bois',
    type: 'accessory',
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
    type: 'accessory',
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
    type: 'accessory',
    rarity: 'rare',
    stats: { crit: 10 },
    skill: null,
    passive: null,
    price: 130,
    levelRequired: 3,
  },
  talisman_old: {
    id: 'talisman_old',
    name: 'Talisman ancien',
    type: 'accessory',
    rarity: 'epic',
    stats: {},
    skill: 'soin',
    passive: null,
    price: 400,
    levelRequired: 5,
  },

  // ── Arc 1-2 ──────────────────────────────────────────────────────────────
  amulet_bone: {
    id: 'amulet_bone',
    name: 'Amulette d\'os',
    type: 'accessory',
    rarity: 'rare',
    stats: { hp: 15, def: 3 },
    skill: null,
    passive: null,
    price: 100,
    levelRequired: 2,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  ring_shadow: {
    id: 'ring_shadow',
    name: 'Anneau de l\'ombre',
    type: 'accessory',
    rarity: 'epic',
    stats: { crit: 15, atk: 3 },
    skill: 'shadow_burst',
    passive: null,
    price: 450,
    levelRequired: 5,
  },

  // ── Arc 4-5 ──────────────────────────────────────────────────────────────
  scarab_beetle: {
    id: 'scarab_beetle',
    name: 'Scarabée sacré',
    type: 'accessory',
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
    type: 'accessory',
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
    type: 'accessory',
    rarity: 'legendary',
    stats: { atk: 10, crit: 20 },
    skill: 'soul_drain',
    passive: 'life_steal',
    price: 2200,
    levelRequired: 21,
  },
};
