'use strict';

/**
 * Bâtiments de la cité commune — un par serveur Discord. Chaque bâtiment profite à
 * TOUS les joueurs du serveur dès qu'il est construit (pas de portée alliance).
 * Coût et durée de construction scalent linéairement avec le niveau ciblé.
 */
const BUILDINGS = {
  treasury: {
    id: 'treasury',
    name: 'Trésorerie',
    emoji: '💰',
    maxLevel: 5,
    description: '+5% d\'or gagné en donjon par niveau, pour tout le serveur.',
    bonus: (level) => ({ goldPct: 0.05 * level }),
    baseCost: { wood: 80, stone: 40, iron: 10, food: 20 },
    baseDurationMs: 1 * 3_600_000,
  },
  training_grounds: {
    id: 'training_grounds',
    name: 'Terrain d\'entraînement',
    emoji: '🏋️',
    maxLevel: 5,
    description: '+5% d\'XP gagnée en donjon par niveau, pour tout le serveur.',
    bonus: (level) => ({ xpPct: 0.05 * level }),
    baseCost: { wood: 60, stone: 60, iron: 15, food: 20 },
    baseDurationMs: 1 * 3_600_000,
  },
  granary: {
    id: 'granary',
    name: 'Grenier',
    emoji: '🌾',
    maxLevel: 5,
    description: '+10% de chance de trouver des ressources en donjon par niveau, pour tout le serveur.',
    bonus: (level) => ({ resourceDropPct: 0.10 * level }),
    baseCost: { wood: 50, stone: 30, iron: 5, food: 40 },
    baseDurationMs: 45 * 60_000,
  },
};

const RESOURCE_TYPES = ['wood', 'stone', 'iron', 'food'];

function costForLevel(buildingType, targetLevel) {
  const def = BUILDINGS[buildingType];
  if (!def) return null;
  const cost = {};
  for (const res of RESOURCE_TYPES) cost[res] = def.baseCost[res] * targetLevel;
  return cost;
}

function durationForLevel(buildingType, targetLevel) {
  return BUILDINGS[buildingType].baseDurationMs * targetLevel;
}

module.exports = { BUILDINGS, RESOURCE_TYPES, costForLevel, durationForLevel };
