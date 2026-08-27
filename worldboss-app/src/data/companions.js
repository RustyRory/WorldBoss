'use strict';

/**
 * Compagnons de combat, vendus par le dresseur (voir companion.service.js).
 * baseStats = stats au niveau 1. growth = gain par niveau au-delà du niveau 1.
 * Seuls hp/atk/def comptent réellement en combat (voir resolveAllyTurn) ;
 * spd est purement indicatif pour l'instant.
 */
const COMPANIONS = {
  wolf_pup: {
    id: 'wolf_pup',
    name: 'Louveteau',
    emoji: '🐺',
    rarity: 'common',
    levelRequired: 1,
    price: 150,
    baseStats: { hp: 35, atk: 7, def: 2, spd: 5 },
    growth: { hp: 5, atk: 2, def: 1, spd: 1 },
  },
  boar_piglet: {
    id: 'boar_piglet',
    name: 'Marcassin',
    emoji: '🐗',
    rarity: 'common',
    levelRequired: 1,
    price: 150,
    baseStats: { hp: 55, atk: 4, def: 5, spd: 2 },
    growth: { hp: 8, atk: 1, def: 2, spd: 0 },
  },
  hawk_chick: {
    id: 'hawk_chick',
    name: 'Faucon',
    emoji: '🦅',
    rarity: 'rare',
    levelRequired: 3,
    price: 350,
    baseStats: { hp: 40, atk: 6, def: 3, spd: 7 },
    growth: { hp: 6, atk: 2, def: 1, spd: 2 },
  },
  dire_wolf: {
    id: 'dire_wolf',
    name: 'Loup sinistre',
    emoji: '🐺',
    rarity: 'epic',
    levelRequired: 8,
    price: 900,
    baseStats: { hp: 70, atk: 12, def: 5, spd: 6 },
    growth: { hp: 10, atk: 3, def: 2, spd: 1 },
  },
  cave_bear: {
    id: 'cave_bear',
    name: 'Ours des cavernes',
    emoji: '🐻',
    rarity: 'epic',
    levelRequired: 14,
    price: 1800,
    baseStats: { hp: 130, atk: 10, def: 12, spd: 2 },
    growth: { hp: 16, atk: 3, def: 3, spd: 0 },
  },
};

/**
 * XP requise pour passer du niveau `level` au suivant.
 */
function companionXpRequired(level) {
  return Math.floor(70 * level);
}

/**
 * Stats courantes d'un compagnon (espèce + niveau).
 */
function computeCompanionStats(companion) {
  const species = COMPANIONS[companion.speciesId];
  if (!species) return { hp: 1, maxHp: 1, atk: 0, def: 0, spd: 0 };

  const levels = companion.level - 1;
  const hp  = species.baseStats.hp  + species.growth.hp  * levels;
  const atk = species.baseStats.atk + species.growth.atk * levels;
  const def = species.baseStats.def + species.growth.def * levels;
  const spd = species.baseStats.spd + species.growth.spd * levels;

  return { hp, maxHp: hp, atk, def, spd };
}

module.exports = { COMPANIONS, companionXpRequired, computeCompanionStats };
