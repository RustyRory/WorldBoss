'use strict';

const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const { BUILDINGS, RESOURCE_TYPES, costForLevel, durationForLevel } = require('../data/buildings');
const { grantItem } = require('./inventory.service');

const _redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
const redisConnection = {
  host: _redisUrl?.hostname ?? process.env.REDIS_HOST ?? 'localhost',
  port: _redisUrl ? parseInt(_redisUrl.port || '6379', 10) : parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: _redisUrl?.password || process.env.REDIS_PASSWORD || undefined,
};

const constructionQueue = new Queue('construction-complete', { connection: redisConnection });
let workerStarted = false;

const BASE_RESOURCE_DROP_CHANCE = 0.5;

async function getOrCreateCity(guildId) {
  let city = await prisma.city.findUnique({ where: { guildId } });
  if (!city) {
    city = await prisma.city.create({ data: { guildId } });
  }
  return city;
}

async function getCityWithBuildings(guildId) {
  const city = await getOrCreateCity(guildId);
  const [buildings, constructionJob] = await Promise.all([
    prisma.building.findMany({ where: { cityId: city.id } }),
    prisma.constructionJob.findUnique({ where: { cityId: city.id } }),
  ]);
  return { ...city, buildings, constructionJob };
}

/**
 * Sums the bonuses of every built level across the city's buildings. Consumed by
 * combat.service.js (goldPct/xpPct) and rollResourceDrop (resourceDropPct).
 */
async function getServerBonuses(guildId) {
  const city = await prisma.city.findUnique({ where: { guildId }, include: { buildings: true } });
  const totals = { goldPct: 0, xpPct: 0, resourceDropPct: 0 };
  if (!city) return totals;

  for (const b of city.buildings) {
    const def = BUILDINGS[b.type];
    if (!def || b.level <= 0) continue;
    const bonus = def.bonus(b.level);
    for (const [key, value] of Object.entries(bonus)) {
      totals[key] = (totals[key] ?? 0) + value;
    }
  }
  return totals;
}

/**
 * Rolls a chance to grant a random resource item after a dungeon room clear.
 * Boosted by the city's granary (resourceDropPct). Returns { type, quantity } or null.
 */
async function rollResourceDrop(characterId, guildId) {
  const bonuses = await getServerBonuses(guildId);
  const chance  = BASE_RESOURCE_DROP_CHANCE + (bonuses.resourceDropPct ?? 0);
  if (Math.random() > chance) return null;

  const type     = RESOURCE_TYPES[Math.floor(Math.random() * RESOURCE_TYPES.length)];
  const quantity = 1 + Math.floor(Math.random() * 3);
  await grantItem(characterId, type, quantity);
  return { type, quantity };
}

/**
 * A player donates resources from their personal inventory to the shared city stockpile.
 */
async function donateResource(characterId, guildId, resourceType, quantity) {
  if (!RESOURCE_TYPES.includes(resourceType)) return { success: false, message: 'Ressource inconnue.' };
  if (quantity < 1) return { success: false, message: 'Quantité invalide.' };

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId: resourceType } },
  });
  if (!charItem || charItem.quantity < quantity) {
    return { success: false, message: `Tu n'as pas assez de **${resourceType}** (tu en as ${charItem?.quantity ?? 0}).` };
  }

  const city = await getOrCreateCity(guildId);

  await prisma.$transaction([
    charItem.quantity === quantity
      ? prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId: resourceType } } })
      : prisma.characterItem.update({
          where: { characterId_itemId: { characterId, itemId: resourceType } },
          data: { quantity: { decrement: quantity } },
        }),
    prisma.city.update({ where: { guildId }, data: { [resourceType]: { increment: quantity } } }),
  ]);

  return { success: true, message: `**${quantity}** ${resourceType} donné(s) à la cité !`, city: { ...city, [resourceType]: city[resourceType] + quantity } };
}

async function startConstruction(guildId, buildingType, discordClient) {
  const def = BUILDINGS[buildingType];
  if (!def) return { success: false, message: 'Bâtiment inconnu.' };

  const city = await getOrCreateCity(guildId);

  const existingJob = await prisma.constructionJob.findUnique({ where: { cityId: city.id } });
  if (existingJob) return { success: false, message: 'Une construction est déjà en cours sur ce serveur.' };

  const building     = await prisma.building.findUnique({ where: { cityId_type: { cityId: city.id, type: buildingType } } });
  const currentLevel = building?.level ?? 0;
  const targetLevel  = currentLevel + 1;
  if (targetLevel > def.maxLevel) return { success: false, message: `**${def.name}** est déjà au niveau maximum.` };

  const cost = costForLevel(buildingType, targetLevel);
  for (const res of RESOURCE_TYPES) {
    if (city[res] < cost[res]) {
      return { success: false, message: `Ressources insuffisantes pour **${def.name}** niveau **${targetLevel}** (il manque ${res}).` };
    }
  }

  const durationMs  = durationForLevel(buildingType, targetLevel);
  const completesAt = new Date(Date.now() + durationMs);

  await prisma.$transaction([
    prisma.city.update({
      where: { guildId },
      data: Object.fromEntries(RESOURCE_TYPES.map((res) => [res, { decrement: cost[res] }])),
    }),
    prisma.constructionJob.create({
      data: { cityId: city.id, buildingType, targetLevel, completesAt },
    }),
  ]);

  await scheduleConstructionCompletion(city.id, durationMs);

  return {
    success: true,
    message: `🏗️ Construction de **${def.name}** niveau **${targetLevel}** lancée (${Math.round(durationMs / 3_600_000 * 10) / 10}h).`,
  };
}

async function completeConstruction(cityId, discordClient) {
  const job = await prisma.constructionJob.findUnique({ where: { cityId } });
  if (!job) return;

  const [, city] = await Promise.all([
    prisma.building.upsert({
      where: { cityId_type: { cityId, type: job.buildingType } },
      update: { level: job.targetLevel },
      create: { cityId, type: job.buildingType, level: job.targetLevel },
    }),
    prisma.city.findUnique({ where: { id: cityId } }),
  ]);
  await prisma.constructionJob.delete({ where: { cityId } });

  const def = BUILDINGS[job.buildingType];
  if (discordClient && city) {
    await notifyCity(city.guildId, `🏗️ **${def.name}** a atteint le niveau **${job.targetLevel}** sur la cité du serveur !`, discordClient);
  }
}

async function notifyCity(guildId, message, discordClient) {
  try {
    const channels = await prisma.guildChannels.findUnique({ where: { guildId } });
    const channelId = channels?.cityChannelId ?? channels?.generalChannelId;
    if (!channelId) return;
    const channel = await discordClient.channels.fetch(channelId).catch(() => null);
    if (channel) await channel.send(message);
  } catch (err) {
    console.error('[City] notifyCity:', err.message);
  }
}

async function scheduleConstructionCompletion(cityId, delayMs) {
  await constructionQueue.add(
    'complete',
    { cityId },
    { delay: delayMs, jobId: `construction-${cityId}`, removeOnComplete: true, removeOnFail: true },
  );
}

async function restoreConstructionJobs(discordClient) {
  const jobs = await prisma.constructionJob.findMany();
  const now  = Date.now();

  for (const job of jobs) {
    const remaining = new Date(job.completesAt).getTime() - now;
    if (remaining <= 0) {
      await completeConstruction(job.cityId, discordClient).catch((err) =>
        console.error(`[City] completeConstruction on restore (${job.cityId}):`, err.message),
      );
    } else {
      await scheduleConstructionCompletion(job.cityId, remaining);
    }
  }
}

function startCityWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'construction-complete',
    async (job) => {
      await completeConstruction(job.data.cityId, discordClient);
    },
    { connection: redisConnection },
  );
}

module.exports = {
  getOrCreateCity,
  getCityWithBuildings,
  getServerBonuses,
  rollResourceDrop,
  donateResource,
  startConstruction,
  restoreConstructionJobs,
  startCityWorker,
};
