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

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_fragment: {
    id: 'bone_fragment',
    name: 'Fragment d\'os',
    type: 'accessory',
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
    type: 'accessory',
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
    type: 'accessory',
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
    type: 'accessory',
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
    type: 'accessory',
    rarity: 'rare',
    stats: { hp: 15, def: 3 },
    skill: null,
    passive: null,
    price: 100,
    levelRequired: 2,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  bandit_pouch: {
    id: 'bandit_pouch',
    name: 'Bourse de bandit',
    type: 'accessory',
    rarity: 'common',
    stats: { hp: 15 },
    skill: null,
    passive: null,
    price: 80,
    levelRequired: 6,
  },

  assassin_ring: {
    id: 'assassin_ring',
    name: 'Anneau de l\'assassin',
    type: 'accessory',
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
    type: 'accessory',
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
