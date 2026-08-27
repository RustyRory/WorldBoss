'use strict';

const { prisma } = require('../db/prisma');
const { COMPANIONS, companionXpRequired, computeCompanionStats } = require('../data/companions');

async function getCompanion(characterId) {
  return prisma.companion.findUnique({ where: { characterId } });
}

/**
 * Species purchasable by a character right now (level gate only — no stock/rotation).
 */
function listAvailableSpecies(characterLevel) {
  return Object.values(COMPANIONS).filter((s) => s.levelRequired <= characterLevel);
}

async function buyCompanion(characterId, speciesId) {
  const species = COMPANIONS[speciesId];
  if (!species) return { success: false, message: 'Compagnon inconnu.' };

  const existing = await getCompanion(characterId);
  if (existing) return { success: false, message: 'Vous avez déjà un compagnon.' };

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { level: true, gold: true },
  });
  if (character.level < species.levelRequired) {
    return { success: false, message: `Niveau **${species.levelRequired}** requis pour ce compagnon.` };
  }
  if (character.gold < species.price) {
    return { success: false, message: `Or insuffisant. Il te faut **${species.price}** 🪙 (tu as **${character.gold}** 🪙).` };
  }

  const [, companion] = await prisma.$transaction([
    prisma.character.update({ where: { id: characterId }, data: { gold: { decrement: species.price } } }),
    prisma.companion.create({ data: { characterId, speciesId, name: species.name } }),
  ]);

  return { success: true, message: `${species.emoji} **${species.name}** rejoint votre aventure !`, companion };
}

/**
 * Add XP to a character's companion (no-op if it has none). Mirrors player.service.addXp's
 * level-up loop but with the companion's own (lighter) XP curve.
 */
async function addCompanionXp(characterId, xpGained) {
  const companion = await getCompanion(characterId);
  if (!companion || xpGained <= 0) return { leveledUp: false };

  let { level, xp } = companion;
  xp += xpGained;
  let leveledUp = false;

  let required = companionXpRequired(level);
  while (xp >= required) {
    xp -= required;
    level += 1;
    leveledUp = true;
    required = companionXpRequired(level);
  }

  await prisma.companion.update({ where: { characterId }, data: { level, xp } });

  return { leveledUp, newLevel: level, name: companion.name };
}

/**
 * Convert a Companion row into the ally stat-block shape expected by combatEngine.js
 * (resolveAllyTurn only reads name/hp/maxHp/atk/def). Companions always enter combat
 * at full HP, same convention as the scripted dungeon ALLIES.
 */
function companionToAllyStatBlock(companion) {
  const stats = computeCompanionStats(companion);
  const species = COMPANIONS[companion.speciesId];
  return {
    name: companion.name,
    emoji: species?.emoji ?? '🐾',
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
  };
}

module.exports = { getCompanion, listAvailableSpecies, buyCompanion, addCompanionXp, companionToAllyStatBlock };
