'use strict';

const { prisma } = require('../db/prisma');
const { xpRequired, baseStats } = require('../utils/stats');
const { ITEMS } = require('../data/items');

async function getCharacter(userId, guildId) {
  return prisma.character.findUnique({
    where: { userId_guildId: { userId, guildId } },
    include: { loadout: true, user: { select: { username: true } } },
  });
}

async function characterExists(userId, guildId) {
  const c = await prisma.character.findUnique({
    where: { userId_guildId: { userId, guildId } },
    select: { id: true },
  });
  return !!c;
}

/**
 * Create a brand-new character for a player on a guild.
 * Gives starting items and equips weapon + armor by default.
 */
async function createCharacter(userId, username, guildId, characterName) {
  const base = baseStats(1);

  await ensureItemsSeeded();

  return prisma.$transaction(async (tx) => {
    // Upsert Discord identity
    await tx.user.upsert({
      where: { id: userId },
      update: { username },
      create: { id: userId, username },
    });

    const character = await tx.character.create({
      data: {
        userId,
        guildId,
        name: characterName || username,
        level: 1,
        xp: 0,
        gold: 0,
        hp: base.hp,
      },
    });

    const loadout = await tx.loadout.create({
      data: { characterId: character.id },
    });

    return { character, loadout };
  });
}

/**
 * Add XP to a character, handle level-up.
 * Returns { newXp, newLevel, leveledUp, levelsGained }
 */
const HP_REGEN_PER_MINUTE = 2;

/**
 * Compute current HP after passive regen (1 HP/min outside combat).
 * maxHp should be the character's computed max HP (base + equipment).
 */
function computeRegenedHp(storedHp, hpUpdatedAt, maxHp) {
  const minutes = (Date.now() - new Date(hpUpdatedAt).getTime()) / 60000;
  const regen = Math.floor(minutes * HP_REGEN_PER_MINUTE);
  return Math.min(maxHp, storedHp + regen);
}

async function addXp(characterId, amount) {
  const character = await prisma.character.findUnique({ where: { id: characterId }, include: { loadout: true } });
  if (!character) throw new Error('Character not found');

  let xp = character.xp + amount;
  let level = character.level;
  let leveledUp = false;
  let levelsGained = 0;

  while (xp >= xpRequired(level)) {
    xp -= xpRequired(level);
    level += 1;
    leveledUp = true;
    levelsGained += 1;
  }

  const updateData = { xp, level };
  if (leveledUp) {
    const { AP_MAX } = require('./actionPoints.service');
    const { computeStats } = require('../utils/stats');
    const maxHp = computeStats({ level }, character.loadout ?? {}).hp;
    updateData.hp                    = maxHp;
    updateData.hpUpdatedAt           = new Date();
    updateData.actionPoints          = AP_MAX;
    updateData.actionPointsUpdatedAt = new Date();
  }

  await prisma.character.update({ where: { id: characterId }, data: updateData });

  return { newXp: xp, newLevel: level, leveledUp, levelsGained };
}

async function addGold(characterId, amount) {
  return prisma.character.update({
    where: { id: characterId },
    data: { gold: { increment: amount } },
  });
}

async function ensureItemsSeeded() {
  const ops = Object.values(ITEMS).map((item) =>
    prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        statsJson: item.stats ?? {},
        skillJson: item.skill ?? null,
        effectJson: item.effect ?? null,
        price: item.price ?? 0,
        levelRequired: item.levelRequired ?? 1,
      },
    }),
  );
  await prisma.$transaction(ops);
}

module.exports = { getCharacter, characterExists, createCharacter, addXp, addGold, ensureItemsSeeded, computeRegenedHp };
