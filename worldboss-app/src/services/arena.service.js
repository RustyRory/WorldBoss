'use strict';

const crypto = require('crypto');
const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const { redis, getArenaMatchState, setArenaMatchState, deleteArenaMatchState, getArenaQueue, setArenaQueue } = require('../cache/redis');
const { resolveArenaRound } = require('../engines/pvpCombatEngine');
const { computeStats } = require('../utils/stats');
const { COMBAT_CONFIG } = require('../data/combat');
const { getCharacterEmoji } = require('../data/races');

const ACTIVE_TTL = 60 * 30; // 30 minutes safety net, refreshed every round so it never expires mid-match

const _redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
const redisConnection = {
  host: _redisUrl?.hostname ?? process.env.REDIS_HOST ?? 'localhost',
  port: _redisUrl ? parseInt(_redisUrl.port || '6379', 10) : parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: _redisUrl?.password || process.env.REDIS_PASSWORD || undefined,
};

const arenaTurnQueue = new Queue('arena-turn', { connection: redisConnection });
let workerStarted = false;

function activeKey(characterId) {
  return `arena:active:${characterId}`;
}

/**
 * A player's action and the 30s auto-timeout can fire almost simultaneously — without
 * locking, both would read-modify-write the same Redis match state and one update would
 * silently clobber the other (lost update). Serializes access per match with a short-lived
 * Redis lock (retries for ~1s, which comfortably covers normal read-modify-write latency).
 */
async function withMatchLock(matchId, fn) {
  const lockKey = `arena:lock:${matchId}`;
  const token   = crypto.randomUUID();
  let acquired  = false;

  for (let i = 0; i < 20; i++) {
    acquired = (await redis.set(lockKey, token, 'NX', 'PX', 5000)) === 'OK';
    if (acquired) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!acquired) throw new Error('Le combat est occupé, réessaie dans un instant.');

  try {
    return await fn();
  } finally {
    const current = await redis.get(lockKey);
    if (current === token) await redis.del(lockKey);
  }
}

async function isInMatch(characterId) {
  return (await redis.exists(activeKey(characterId))) === 1;
}

async function markActive(characterId, matchId) {
  await redis.set(activeKey(characterId), matchId, 'EX', ACTIVE_TTL);
}

async function clearActive(characterId) {
  await redis.del(activeKey(characterId));
}

async function getOrCreateArenaProfile(characterId) {
  let profile = await prisma.arenaProfile.findUnique({ where: { characterId } });
  if (!profile) {
    profile = await prisma.arenaProfile.create({ data: { characterId, elo: COMBAT_CONFIG.ARENA_ELO_DEFAULT } });
  }
  return profile;
}

function checkArenaAccess(character) {
  if (character.level < COMBAT_CONFIG.ARENA_LEVEL_REQUIRED) {
    return { ok: false, message: `L'arène est réservée aux personnages de niveau **${COMBAT_CONFIG.ARENA_LEVEL_REQUIRED}**.` };
  }
  return { ok: true };
}

function buildCombatant(character, loadout) {
  const stats = computeStats(character, loadout);
  return {
    characterId: character.id,
    userId: character.userId,
    name: character.name || 'Aventurier',
    emoji: getCharacterEmoji(character.race ?? 'humain', character.gender ?? 'male'),
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    crit: stats.crit,
    critMult: stats.critMult,
    activeSkills: stats.activeSkills ?? [],
    activePassives: stats.activePassives ?? [],
    skillCooldowns: {},
    usedOnceSkills: [],
    buffs: [],
    dots: [],
  };
}

// ── Tour : minuteur 30s + forfait après 3 tours manqués d'affilée ────────────

async function scheduleTurnTimeout(matchId, round) {
  await arenaTurnQueue.add(
    'timeout',
    { matchId, round },
    { delay: COMBAT_CONFIG.ARENA_TURN_TIMEOUT_MS, jobId: `arena-turn-${matchId}-${round}`, removeOnComplete: true, removeOnFail: true },
  );
}

async function cancelTurnTimeout(matchId, round) {
  await arenaTurnQueue.remove(`arena-turn-${matchId}-${round}`).catch(() => {});
}

async function postArenaUpdate(state, discordClient) {
  if (!discordClient || !state.channelId || !state.messageId) return;
  const channel = await discordClient.channels.fetch(state.channelId).catch(() => null);
  if (!channel) return;
  const message = await channel.messages.fetch(state.messageId).catch(() => null);
  if (!message) return;
  const { buildArenaMatchMessage } = require('../utils/embed');
  const { embed, rows } = buildArenaMatchMessage(state);
  await message.edit({ embeds: [embed], components: rows }).catch(() => {});
}

/**
 * Resolves the current round once both sides have an action queued (state.pendingActions
 * fully populated), persists/schedules what's needed for the next round, and returns a
 * uniform result shape used by both the interaction-driven path (submitAction) and the
 * timeout-driven path (handleTurnTimeout).
 */
async function resolveRound(state, discordClient) {
  const result = resolveArenaRound(state);
  state.playerA = result.playerA;
  state.playerB = result.playerB;
  state.log.push(...result.logs);
  state.pendingActions = {};
  state.round += 1;

  if (!result.finished) {
    await setArenaMatchState(state.matchId, state);
    await markActive(state.playerA.characterId, state.matchId);
    await markActive(state.playerB.characterId, state.matchId);
    await scheduleTurnTimeout(state.matchId, state.round);
    return { state, finished: false, logs: result.logs };
  }

  state.status = 'finished';
  const winnerSide = result.aDied ? 'B' : 'A';
  await finalizeMatch(state, winnerSide, discordClient);
  return { state, finished: true, winnerSide, logs: result.logs };
}

/**
 * Fires when a round's 30s timer elapses. Auto-fills 'attack' for whoever hasn't
 * submitted, or declares a forfeit if a side has missed ARENA_MAX_MISSED_TURNS in a row.
 */
async function handleTurnTimeout(matchId, round, discordClient) {
  const outcome = await withMatchLock(matchId, async () => {
    const state = await getArenaMatchState(matchId);
    if (!state || state.status !== 'active' || state.round !== round) return null; // already resolved

    state.missedTurns = state.missedTurns ?? { A: 0, B: 0 };
    const autoLogs = [];

    for (const side of ['A', 'B']) {
      const name = side === 'A' ? state.playerA.name : state.playerB.name;
      if (!state.pendingActions[side]) {
        state.pendingActions[side] = 'attack';
        state.missedTurns[side] += 1;
        autoLogs.push(`⏱️ **${name}** n'a pas choisi à temps — attaque automatique.`);
      } else {
        state.missedTurns[side] = 0;
      }
    }

    const forfeitSide = (['A', 'B']).find((s) => state.missedTurns[s] >= COMBAT_CONFIG.ARENA_MAX_MISSED_TURNS);
    if (forfeitSide) {
      const winnerSide = forfeitSide === 'A' ? 'B' : 'A';
      const loserName  = forfeitSide === 'A' ? state.playerA.name : state.playerB.name;
      state.log.push(...autoLogs, `🏳️ **${loserName}** abandonne le combat (inactif trop longtemps).`);
      state.status = 'finished';
      await finalizeMatch(state, winnerSide, discordClient);
      return state;
    }

    state.log.push(...autoLogs);
    const resolved = await resolveRound(state, discordClient);
    return resolved.state;
  });

  if (outcome) await postArenaUpdate(outcome, discordClient);
}

function startArenaWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'arena-turn',
    async (job) => {
      await handleTurnTimeout(job.data.matchId, job.data.round, discordClient);
    },
    { connection: redisConnection },
  );
}

/**
 * Starts a new 1v1 arena match between two characters and posts the shared match
 * message (with one action-select per side) to the guild's arena channel.
 */
async function startMatch(characterA, loadoutA, characterB, loadoutB, guildId, ranked, discordClient) {
  const matchId = crypto.randomUUID();

  const state = {
    matchId,
    guildId,
    ranked,
    round: 1,
    status: 'active',
    log: [],
    pendingActions: {},
    missedTurns: { A: 0, B: 0 },
    playerA: buildCombatant(characterA, loadoutA),
    playerB: buildCombatant(characterB, loadoutB),
  };

  await setArenaMatchState(matchId, state);
  await markActive(characterA.id, matchId);
  await markActive(characterB.id, matchId);

  const { buildArenaMatchMessage } = require('../utils/embed');
  const { embed, rows } = buildArenaMatchMessage(state);

  const channels = await prisma.guildChannels.findUnique({ where: { guildId } });
  const channel  = channels?.arenaChannelId ? await discordClient.channels.fetch(channels.arenaChannelId).catch(() => null) : null;

  if (channel) {
    const msg = await channel.send({
      content: `<@${characterA.userId}> ⚔️ <@${characterB.userId}>`,
      embeds: [embed],
      components: rows,
    });
    state.messageId = msg.id;
    state.channelId = msg.channelId;
    await setArenaMatchState(matchId, state);
  }

  await scheduleTurnTimeout(matchId, 1);

  return { matchId, state, posted: !!channel };
}

async function joinQueue(character, loadout, guildId, discordClient) {
  if (await isInMatch(character.id)) {
    return { success: false, message: 'Tu es déjà en plein combat.' };
  }

  const queue = await getArenaQueue(guildId);
  const already = queue.find((q) => q.characterId === character.id);
  if (already) return { success: false, message: 'Tu es déjà dans la file d\'attente.' };

  const opponent = queue[0];
  if (!opponent) {
    await setArenaQueue(guildId, [...queue, { characterId: character.id, queuedAt: Date.now() }]);
    return { success: true, waiting: true, message: 'Tu rejoins la file d\'attente — en attente d\'un adversaire...' };
  }

  // Match found: pop the opponent and start immediately.
  await setArenaQueue(guildId, queue.slice(1));

  const opponentChar = await prisma.character.findUnique({ where: { id: opponent.characterId }, include: { loadout: true } });
  if (!opponentChar) {
    // Stale queue entry — retry by queuing self.
    await setArenaQueue(guildId, [...(await getArenaQueue(guildId)), { characterId: character.id, queuedAt: Date.now() }]);
    return { success: true, waiting: true, message: 'Adversaire introuvable, tu rejoins la file d\'attente...' };
  }

  const { matchId, posted } = await startMatch(opponentChar, opponentChar.loadout, character, loadout, guildId, true, discordClient);
  return {
    success: true,
    waiting: false,
    matchId,
    message: posted
      ? 'Adversaire trouvé ! Le combat commence dans le canal arène.'
      : 'Adversaire trouvé, mais aucun canal arène n\'est configuré — utilisez `/setup`.',
  };
}

async function leaveQueue(characterId, guildId) {
  const queue = await getArenaQueue(guildId);
  const filtered = queue.filter((q) => q.characterId !== characterId);
  if (filtered.length === queue.length) return { success: false, message: 'Tu n\'es pas dans la file d\'attente.' };
  await setArenaQueue(guildId, filtered);
  return { success: true, message: 'Tu as quitté la file d\'attente.' };
}

function eloDelta(eloSelf, eloOpponent, won) {
  const expected = 1 / (1 + Math.pow(10, (eloOpponent - eloSelf) / 400));
  return Math.round(COMBAT_CONFIG.ARENA_ELO_K * ((won ? 1 : 0) - expected));
}

/**
 * A player submits their action for the current round. Resolves the round once both
 * sides have submitted. Returns what the caller (interactionCreate.js) should do:
 * { mode: 'wait' | 'resolved' | 'error', ... }
 */
async function submitAction(matchId, side, characterId, action, discordClient) {
  return withMatchLock(matchId, async () => {
    const state = await getArenaMatchState(matchId);
    if (!state || state.status !== 'active') return { mode: 'error', message: 'Ce combat est terminé ou introuvable.' };

    const combatant = side === 'A' ? state.playerA : state.playerB;
    if (combatant.characterId !== characterId) return { mode: 'error', message: 'Ce n\'est pas ton choix à faire.' };
    if (state.pendingActions[side]) return { mode: 'wait', message: 'Tu as déjà choisi ton action ce tour — en attente de ton adversaire.' };

    state.pendingActions[side] = action;

    if (!state.pendingActions.A || !state.pendingActions.B) {
      await setArenaMatchState(matchId, state);
      return { mode: 'wait', message: 'Action enregistrée — en attente de ton adversaire.' };
    }

    // Both sides have chosen before the timer ran out — cancel it and resolve now.
    await cancelTurnTimeout(matchId, state.round);
    const resolved = await resolveRound(state, discordClient);
    return { mode: 'resolved', ...resolved };
  });
}

async function finalizeMatch(state, winnerSide, discordClient) {
  const winner = winnerSide === 'A' ? state.playerA : state.playerB;

  const [profileA, profileB] = await Promise.all([
    getOrCreateArenaProfile(state.playerA.characterId),
    getOrCreateArenaProfile(state.playerB.characterId),
  ]);

  let deltaA = 0;
  let deltaB = 0;
  if (state.ranked) {
    const aWon = winnerSide === 'A';
    deltaA = eloDelta(profileA.elo, profileB.elo, aWon);
    deltaB = eloDelta(profileB.elo, profileA.elo, !aWon);

    await prisma.$transaction([
      prisma.arenaProfile.update({
        where: { characterId: state.playerA.characterId },
        data: { elo: { increment: deltaA }, wins: { increment: aWon ? 1 : 0 }, losses: { increment: aWon ? 0 : 1 }, lastMatchAt: new Date() },
      }),
      prisma.arenaProfile.update({
        where: { characterId: state.playerB.characterId },
        data: { elo: { increment: deltaB }, wins: { increment: aWon ? 0 : 1 }, losses: { increment: aWon ? 1 : 0 }, lastMatchAt: new Date() },
      }),
    ]);
  }

  await prisma.arenaMatch.create({
    data: {
      guildId: state.guildId,
      characterAId: state.playerA.characterId,
      characterBId: state.playerB.characterId,
      winnerId: winner.characterId,
      ranked: state.ranked,
      eloDeltaA: deltaA,
      eloDeltaB: deltaB,
      logJson: state.log,
    },
  });

  await cancelTurnTimeout(state.matchId, state.round);
  await clearActive(state.playerA.characterId);
  await clearActive(state.playerB.characterId);
  await deleteArenaMatchState(state.matchId);
}

module.exports = {
  getOrCreateArenaProfile,
  checkArenaAccess,
  buildCombatant,
  startMatch,
  joinQueue,
  leaveQueue,
  submitAction,
  isInMatch,
  clearActive,
  startArenaWorker,
};
