'use strict';

/**
 * Config du serviteur — un seul type disponible pour l'instant (pas de catalogue
 * d'espèces comme le compagnon). Progresse en niveau uniquement via la tâche
 * train_combat (pas d'XP passive en donjon comme le compagnon).
 */
const SERVANT_CONFIG = {
  name: 'Serviteur',
  price: 400,
  levelRequired: 4,
  baseStats: { hp: 50, atk: 5, def: 5 },
  growth: { hp: 8, atk: 2, def: 2 },
};

/**
 * Tâches assignables. durationMs pilote le job BullMQ auto-replanifié.
 */
const SERVANT_TASKS = {
  mine_gold: {
    label: 'Mine d\'or',
    emoji: '⛏️',
    durationMs: 2 * 3_600_000,
    description: 'Rapporte de l\'or au bout de 2h.',
  },
  train_combat: {
    label: 'Entraînement',
    emoji: '🏋️',
    durationMs: 3 * 3_600_000,
    description: 'Augmente son niveau de combat au bout de 3h.',
  },
};

/**
 * Stats de combat courantes (utilisées uniquement quand le serviteur n'est pas en tâche).
 */
function computeServantStats(servant) {
  const levels = servant.level - 1;
  const hp  = SERVANT_CONFIG.baseStats.hp  + SERVANT_CONFIG.growth.hp  * levels;
  const atk = SERVANT_CONFIG.baseStats.atk + SERVANT_CONFIG.growth.atk * levels;
  const def = SERVANT_CONFIG.baseStats.def + SERVANT_CONFIG.growth.def * levels;
  return { hp, maxHp: hp, atk, def };
}

/**
 * Or rapporté par une session de mine, scalé par la loyauté accumulée.
 */
function mineGoldReward(servant) {
  return 50 + servant.loyalty * 5;
}

module.exports = { SERVANT_CONFIG, SERVANT_TASKS, computeServantStats, mineGoldReward };
