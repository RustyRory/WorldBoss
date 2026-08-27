'use strict';

const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const { SERVANT_CONFIG, SERVANT_TASKS, computeServantStats, mineGoldReward } = require('../data/servants');

const _redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
const redisConnection = {
  host: _redisUrl?.hostname ?? process.env.REDIS_HOST ?? 'localhost',
  port: _redisUrl ? parseInt(_redisUrl.port || '6379', 10) : parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: _redisUrl?.password || process.env.REDIS_PASSWORD || undefined,
};

const servantTaskQueue = new Queue('servant-task', { connection: redisConnection });

let workerStarted = false;

async function getServant(characterId) {
  return prisma.servant.findUnique({ where: { characterId } });
}

async function recruitServant(characterId) {
  const existing = await getServant(characterId);
  if (existing) return { success: false, message: 'Vous avez déjà un serviteur.' };

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { level: true, gold: true },
  });
  if (character.level < SERVANT_CONFIG.levelRequired) {
    return { success: false, message: `Niveau **${SERVANT_CONFIG.levelRequired}** requis pour recruter un serviteur.` };
  }
  if (character.gold < SERVANT_CONFIG.price) {
    return { success: false, message: `Or insuffisant. Il te faut **${SERVANT_CONFIG.price}** 🪙 (tu as **${character.gold}** 🪙).` };
  }

  const [, servant] = await prisma.$transaction([
    prisma.character.update({ where: { id: characterId }, data: { gold: { decrement: SERVANT_CONFIG.price } } }),
    prisma.servant.create({ data: { characterId, name: SERVANT_CONFIG.name } }),
  ]);

  return { success: true, message: `${SERVANT_CONFIG.name} recruté !`, servant };
}

async function assignTask(characterId, task) {
  if (!SERVANT_TASKS[task]) return { success: false, message: 'Tâche inconnue.' };

  const servant = await getServant(characterId);
  if (!servant) return { success: false, message: 'Vous n\'avez pas de serviteur.' };
  if (servant.task !== 'idle') return { success: false, message: `${servant.name} est déjà occupé.` };

  const def         = SERVANT_TASKS[task];
  const taskStartedAt = new Date();
  const taskEndsAt    = new Date(Date.now() + def.durationMs);

  await prisma.servant.update({
    where: { characterId },
    data: { task, taskStartedAt, taskEndsAt },
  });

  await scheduleServantTaskCompletion(characterId, def.durationMs);

  return { success: true, message: `${servant.name} part : **${def.label}** (${Math.round(def.durationMs / 3_600_000)}h).` };
}

async function recallServant(characterId) {
  const servant = await getServant(characterId);
  if (!servant) return { success: false, message: 'Vous n\'avez pas de serviteur.' };
  if (servant.task === 'idle') return { success: false, message: `${servant.name} n'est pas occupé.` };

  await servantTaskQueue.remove(`servant-task-${characterId}`);
  await prisma.servant.update({
    where: { characterId },
    data: { task: 'idle', taskStartedAt: null, taskEndsAt: null },
  });

  return { success: true, message: `${servant.name} est rappelé — la tâche en cours est abandonnée sans récompense.` };
}

/**
 * Called when a task's BullMQ job fires. If the servant was recalled in the meantime
 * (task already back to 'idle'), this is a no-op.
 */
async function completeTask(characterId, discordClient) {
  const servant = await getServant(characterId);
  if (!servant || servant.task === 'idle') return;

  const task = servant.task;
  let rewardMessage = '';

  if (task === 'mine_gold') {
    const reward = mineGoldReward(servant);
    await prisma.$transaction([
      prisma.character.update({ where: { id: characterId }, data: { gold: { increment: reward } } }),
      prisma.servant.update({
        where: { characterId },
        data: { task: 'idle', taskStartedAt: null, taskEndsAt: null, loyalty: { increment: 1 } },
      }),
    ]);
    rewardMessage = `⛏️ **${servant.name}** revient de la mine avec **${reward}** 🪙 !`;
  } else if (task === 'train_combat') {
    await prisma.servant.update({
      where: { characterId },
      data: { task: 'idle', taskStartedAt: null, taskEndsAt: null, level: { increment: 1 }, loyalty: { increment: 1 } },
    });
    rewardMessage = `🏋️ **${servant.name}** termine son entraînement — niveau **${servant.level + 1}** !`;
  }

  if (discordClient && rewardMessage) {
    await notifyServantOwner(characterId, rewardMessage, discordClient);
  }
}

async function notifyServantOwner(characterId, message, discordClient) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true, guildId: true },
    });
    if (!character) return;

    const channels = await prisma.guildChannels.findUnique({ where: { guildId: character.guildId } });
    if (!channels?.generalChannelId) return;

    const channel = await discordClient.channels.fetch(channels.generalChannelId).catch(() => null);
    if (channel) await channel.send(`<@${character.userId}> ${message}`);
  } catch (err) {
    console.error('[Servant] notifyServantOwner:', err.message);
  }
}

async function scheduleServantTaskCompletion(characterId, delayMs) {
  await servantTaskQueue.add(
    'complete',
    { characterId },
    { delay: delayMs, jobId: `servant-task-${characterId}`, removeOnComplete: true, removeOnFail: true },
  );
}

/**
 * Reschedules pending servant tasks on bot restart (mirrors merchant.service.js's
 * restoreMerchantShops).
 */
async function restoreServantTasks(discordClient) {
  const servants = await prisma.servant.findMany({ where: { task: { not: 'idle' } } });
  const now = Date.now();

  for (const servant of servants) {
    const remaining = new Date(servant.taskEndsAt).getTime() - now;
    if (remaining <= 0) {
      await completeTask(servant.characterId, discordClient).catch((err) =>
        console.error(`[Servant] completeTask on restore (${servant.characterId}):`, err.message),
      );
    } else {
      await scheduleServantTaskCompletion(servant.characterId, remaining);
    }
  }
}

/**
 * Ally stat-block for combat — only meaningful while the servant is idle
 * (busy on a task = unavailable for combat).
 */
function servantToAllyStatBlock(servant) {
  const stats = computeServantStats(servant);
  return { name: servant.name, emoji: '🧑‍🌾', hp: stats.maxHp, maxHp: stats.maxHp, atk: stats.atk, def: stats.def };
}

function startServantWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'servant-task',
    async (job) => {
      await completeTask(job.data.characterId, discordClient);
    },
    { connection: redisConnection },
  );
}

module.exports = {
  getServant,
  recruitServant,
  assignTask,
  recallServant,
  restoreServantTasks,
  servantToAllyStatBlock,
  startServantWorker,
};
