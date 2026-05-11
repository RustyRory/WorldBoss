'use strict';

module.exports = {
  cloth_simple: {
    id: 'cloth_simple',
    name: 'Vêtements simples',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 5, def: 1 },
    skill: null,
    passive: null,
    price: 0,
    levelRequired: 1,
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Armure de cuir',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 15, def: 3 },
    skill: null,
    passive: null,
    price: 80,
    levelRequired: 2,
  },
  iron_armor: {
    id: 'iron_armor',
    name: 'Armure de fer',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 25, def: 8, spd: -1 },
    skill: null,
    passive: null,
    price: 200,
    levelRequired: 4,
  },
  magic_robe: {
    id: 'magic_robe',
    name: 'Robe magique',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 10, atk: 3 },
    skill: null,
    passive: null,
    price: 220,
    levelRequired: 5,
  },

  // ── Arc 1 — Catacombes ───────────────────────────────────────────────────
  bone_vest: {
    id: 'bone_vest',
    name: 'Gilet d\'os',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 10, def: 2 },
    skill: null,
    passive: null,
    price: 35,
    levelRequired: 1,
  },

  crypt_shroud: {
    id: 'crypt_shroud',
    name: 'Linceul de crypte',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 14, def: 3 },
    skill: null,
    passive: null,
    price: 60,
    levelRequired: 2,
  },

  grave_plate: {
    id: 'grave_plate',
    name: 'Plaque funèbre',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 28, def: 9 },
    skill: null,
    passive: null,
    price: 190,
    levelRequired: 4,
  },

  // ── Arc 1-2 ──────────────────────────────────────────────────────────────
  robe_cloth: {
    id: 'robe_cloth',
    name: 'Robe de tissu',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 8, def: 2 },
    skill: null,
    passive: null,
    price: 50,
    levelRequired: 1,
  },

  // ── Arc 2 — Château / Bandits ────────────────────────────────────────────
  raider_vest: {
    id: 'raider_vest',
    name: 'Gilet de pillard',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 20, def: 5 },
    skill: null,
    passive: null,
    price: 130,
    levelRequired: 6,
  },

  bandit_cloak: {
    id: 'bandit_cloak',
    name: 'Cape de bandit',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 30, def: 9, spd: 3 },
    skill: null,
    passive: null,
    price: 270,
    levelRequired: 7,
  },

  highwayman_coat: {
    id: 'highwayman_coat',
    name: 'Manteau du grand chemin',
    type: 'armor',
    rarity: 'epic',
    stats: { hp: 45, def: 14, crit: 8 },
    skill: null,
    passive: null,
    price: 500,
    levelRequired: 9,
  },

  // ── Arc 3-5 ──────────────────────────────────────────────────────────────
  scale_armor: {
    id: 'scale_armor',
    name: 'Armure d\'écailles',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 35, def: 12, spd: -2 },
    skill: null,
    passive: null,
    price: 280,
    levelRequired: 5,
  },

  studded_leather: {
    id: 'studded_leather',
    name: 'Cuir clouté',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 22, def: 8, crit: 5 },
    skill: null,
    passive: null,
    price: 240,
    levelRequired: 6,
  },

  // ── Arc 4-5 ──────────────────────────────────────────────────────────────
  desert_cloth: {
    id: 'desert_cloth',
    name: 'Vêtement du désert',
    type: 'armor',
    rarity: 'common',
    stats: { hp: 20, def: 5, spd: 2 },
    skill: null,
    passive: null,
    price: 150,
    levelRequired: 8,
  },

  // ── Arc 5-6 ──────────────────────────────────────────────────────────────
  desert_robe: {
    id: 'desert_robe',
    name: 'Robe du désert',
    type: 'armor',
    rarity: 'rare',
    stats: { hp: 30, atk: 5 },
    skill: null,
    passive: null,
    price: 350,
    levelRequired: 10,
  },

  // ── Arc 6 ─────────────────────────────────────────────────────────────────
  steam_armor: {
    id: 'steam_armor',
    name: 'Armure à vapeur',
    type: 'armor',
    rarity: 'epic',
    stats: { hp: 60, def: 20, spd: -3 },
    skill: null,
    passive: null,
    price: 700,
    levelRequired: 14,
  },

  // ── Arc 7 ─────────────────────────────────────────────────────────────────
  royal_armor: {
    id: 'royal_armor',
    name: 'Armure royale',
    type: 'armor',
    rarity: 'epic',
    stats: { hp: 55, def: 18, atk: 5 },
    skill: null,
    passive: null,
    price: 900,
    levelRequired: 17,
  },

  // ── Arc 8 ─────────────────────────────────────────────────────────────────
  infernal_plate: {
    id: 'infernal_plate',
    name: 'Plastron infernal',
    type: 'armor',
    rarity: 'legendary',
    stats: { hp: 100, def: 30, spd: -4 },
    skill: null,
    passive: null,
    price: 2000,
    levelRequired: 21,
  },
};
