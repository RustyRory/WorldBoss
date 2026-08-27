'use strict';

const crypto = require('crypto');
const { prisma } = require('../db/prisma');
const { redis, getArenaMatchState, setArenaMatchState, deleteArenaMatchState, getArenaQueue, setArenaQueue } = require('../cache/redis');
const { resolveArenaRound } = require('../engines/pvpCombatEngine');
const { computeStats } = require('../utils/stats');
const { COMBAT_CONFIG } = require('../data/combat');
const { getCharacterEmoji } = require('../data/races');

const ACTIVE_TTL = 60 * 30; // 30 minutes safety net in case a match is abandoned

function activeKey(characterId) {
  return `arena:active:${characterId}`;
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

  // Both sides have chosen: resolve the round.
  const result = resolveArenaRound(state);
  state.playerA = result.playerA;
  state.playerB = result.playerB;
  state.log.push(...result.logs);
  state.pendingActions = {};
  state.round += 1;

  if (!result.finished) {
    await setArenaMatchState(matchId, state);
    return { mode: 'resolved', state, finished: false, logs: result.logs };
  }

  state.status = 'finished';
  const winnerSide = result.aDied ? 'B' : 'A';
  await finalizeMatch(state, winnerSide, discordClient);
  return { mode: 'resolved', state, finished: true, winnerSide, logs: result.logs };
}

async function finalizeMatch(state, winnerSide, discordClient) {
  const winner = winnerSide === 'A' ? state.playerA : state.playerB;
  const loser  = winnerSide === 'A' ? state.playerB : state.playerA;

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

  await clearActive(state.playerA.characterId);
  await clearActive(state.playerB.characterId);
  await deleteArenaMatchState(state.matchId);

  void winner; void loser; void discordClient; // kept for symmetry / future notification hooks
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
};
