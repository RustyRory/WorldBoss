'use strict';

const crypto = require('crypto');
const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const {
  redis,
  getArenaTeamLobby, setArenaTeamLobby, deleteArenaTeamLobby,
  getArenaTeamQueue, setArenaTeamQueue,
  getArenaTeamMatchState, setArenaTeamMatchState, deleteArenaTeamMatchState,
} = require('../cache/redis');
const { resolveTeamRound } = require('../engines/pvpCombatEngine');
const { buildCombatant, getOrCreateArenaProfile, isInMatch, markActive, clearActive } = require('./arena.service');
const { COMBAT_CONFIG } = require('../data/combat');

const TEAM_SIZE = 4;

const _redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
const redisConnection = {
  host: _redisUrl?.hostname ?? process.env.REDIS_HOST ?? 'localhost',
  port: _redisUrl ? parseInt(_redisUrl.port || '6379', 10) : parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: _redisUrl?.password || process.env.REDIS_PASSWORD || undefined,
};

const teamTurnQueue = new Queue('arena-team-turn', { connection: redisConnection });
let workerStarted = false;

async function withMatchLock(matchId, fn) {
  const lockKey = `arena:team-lock:${matchId}`;
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

// ── Lobby (recrutement de 4 joueurs sur un serveur avant recherche cross-serveur) ──

async function joinLobby(character, guildId) {
  if (await isInMatch(character.id)) return { success: false, message: 'Tu es déjà en plein combat.' };

  let lobby = await getArenaTeamLobby(guildId);
  if (!lobby) lobby = { leaderId: character.id, members: [] };

  if (lobby.members.some((m) => m.characterId === character.id)) {
    return { success: false, message: 'Tu es déjà dans le groupe.' };
  }
  if (lobby.members.length >= TEAM_SIZE) {
    return { success: false, message: `Le groupe est déjà complet (${TEAM_SIZE}/${TEAM_SIZE}).` };
  }

  lobby.members.push({ characterId: character.id, userId: character.userId, name: character.name || 'Aventurier' });
  await setArenaTeamLobby(guildId, lobby);
  return { success: true, lobby };
}

async function leaveLobby(characterId, guildId) {
  const lobby = await getArenaTeamLobby(guildId);
  if (!lobby || !lobby.members.some((m) => m.characterId === characterId)) {
    return { success: false, message: 'Tu n\'es pas dans le groupe.' };
  }

  lobby.members = lobby.members.filter((m) => m.characterId !== characterId);
  if (lobby.members.length === 0) {
    await deleteArenaTeamLobby(guildId);
    return { success: true, lobby: null };
  }
  if (lobby.leaderId === characterId) lobby.leaderId = lobby.members[0].characterId;

  await setArenaTeamLobby(guildId, lobby);
  return { success: true, lobby };
}

/**
 * Called once the lobby has 4 members: pushes the roster into the cross-guild queue,
 * matching immediately with another server's waiting group if one exists.
 */
async function searchMatch(guildId, discordClient) {
  const lobby = await getArenaTeamLobby(guildId);
  if (!lobby || lobby.members.length < TEAM_SIZE) {
    return { success: false, message: `Il faut ${TEAM_SIZE} joueurs dans le groupe pour lancer la recherche.` };
  }

  const queue = await getArenaTeamQueue();
  const opponent = queue.find((q) => q.guildId !== guildId);

  if (!opponent) {
    await setArenaTeamQueue([...queue, { guildId, members: lobby.members, queuedAt: Date.now() }]);
    await deleteArenaTeamLobby(guildId);
    return { success: true, waiting: true, message: 'Groupe complet — en attente d\'un adversaire sur un autre serveur...' };
  }

  await setArenaTeamQueue(queue.filter((q) => q !== opponent));
  await deleteArenaTeamLobby(guildId);

  const { matchId, posted } = await startTeamMatch(opponent, { guildId, members: lobby.members }, discordClient);
  return {
    success: true,
    waiting: false,
    matchId,
    message: posted
      ? 'Adversaire trouvé sur un autre serveur ! Le combat commence.'
      : 'Adversaire trouvé, mais aucun canal arène n\'est disponible sur les deux serveurs.',
  };
}

// ── Combat ────────────────────────────────────────────────────────────────────

async function buildTeam(members) {
  const characters = await prisma.character.findMany({
    where: { id: { in: members.map((m) => m.characterId) } },
    include: { loadout: true },
  });
  return members
    .map((m) => characters.find((c) => c.id === m.characterId))
    .filter(Boolean)
    .map((c) => buildCombatant(c, c.loadout));
}

async function scheduleTurnTimeout(matchId, round) {
  await teamTurnQueue.add(
    'timeout',
    { matchId, round },
    { delay: COMBAT_CONFIG.ARENA_TURN_TIMEOUT_MS, jobId: `arena-team-turn-${matchId}-${round}`, removeOnComplete: true, removeOnFail: true },
  );
}

async function cancelTurnTimeout(matchId, round) {
  await teamTurnQueue.remove(`arena-team-turn-${matchId}-${round}`).catch(() => {});
}

async function postTeamUpdate(state, discordClient) {
  if (!discordClient || !state.channelId || !state.messageId) return;
  const channel = await discordClient.channels.fetch(state.channelId).catch(() => null);
  if (!channel) return;
  const message = await channel.messages.fetch(state.messageId).catch(() => null);
  if (!message) return;
  const { buildArenaTeamMatchMessage } = require('../utils/embed');
  const { embed, rows } = buildArenaTeamMatchMessage(state);
  await message.edit({ embeds: [embed], components: rows }).catch(() => {});
}

async function startTeamMatch(teamAInfo, teamBInfo, discordClient) {
  const matchId = crypto.randomUUID();

  const [teamA, teamB] = await Promise.all([buildTeam(teamAInfo.members), buildTeam(teamBInfo.members)]);

  const state = {
    matchId,
    guildIdA: teamAInfo.guildId,
    guildIdB: teamBInfo.guildId,
    ranked: true,
    round: 1,
    status: 'active',
    log: [],
    pendingActions: {},
    missedTurns: { A: 0, B: 0 },
    teamA,
    teamB,
  };

  await setArenaTeamMatchState(matchId, state);
  for (const c of [...teamA, ...teamB]) await markActive(c.characterId, matchId);

  const { buildArenaTeamMatchMessage } = require('../utils/embed');
  const { embed, rows } = buildArenaTeamMatchMessage(state);

  // "Canal arène du serveur du challenger" — ici, le serveur A (déjà en attente dans la
  // file) sert de référence ; on retombe sur le serveur B si A n'a pas de canal configuré.
  let channel = null;
  for (const guildId of [teamAInfo.guildId, teamBInfo.guildId]) {
    const channels = await prisma.guildChannels.findUnique({ where: { guildId } });
    if (channels?.arenaChannelId) {
      channel = await discordClient.channels.fetch(channels.arenaChannelId).catch(() => null);
      if (channel) break;
    }
  }

  if (channel) {
    const mentions = [...teamA, ...teamB].map((c) => `<@${c.userId}>`).join(' ');
    const msg = await channel.send({ content: `⚔️ **4v4 inter-serveurs** ⚔️\n${mentions}`, embeds: [embed], components: rows });
    state.messageId = msg.id;
    state.channelId = msg.channelId;
    await setArenaTeamMatchState(matchId, state);
  }

  await scheduleTurnTimeout(matchId, 1);

  return { matchId, state, posted: !!channel };
}

function findActor(state, userId) {
  const inA = state.teamA.find((c) => c.userId === userId);
  if (inA) return { side: 'A', combatant: inA };
  const inB = state.teamB.find((c) => c.userId === userId);
  if (inB) return { side: 'B', combatant: inB };
  return null;
}

async function resolveRound(state, discordClient) {
  const result = resolveTeamRound(state);
  state.teamA = result.teamA;
  state.teamB = result.teamB;
  state.log.push(...result.logs);
  state.pendingActions = {};
  state.round += 1;

  if (!result.finished) {
    await setArenaTeamMatchState(state.matchId, state);
    for (const c of [...state.teamA, ...state.teamB]) await markActive(c.characterId, state.matchId);
    await scheduleTurnTimeout(state.matchId, state.round);
    return { state, finished: false };
  }

  state.status = 'finished';
  const winningSide = result.aWiped ? 'B' : 'A';
  await finalizeMatch(state, winningSide, discordClient);
  return { state, finished: true, winningSide };
}

/**
 * A player submits their action (and target, chosen among their living enemies) for the
 * current round. Resolves the round once every still-alive participant has submitted.
 */
async function submitAction(matchId, characterId, action, targetIndex, discordClient) {
  return withMatchLock(matchId, async () => {
    const state = await getArenaTeamMatchState(matchId);
    if (!state || state.status !== 'active') return { mode: 'error', message: 'Ce combat est terminé ou introuvable.' };

    const inA = state.teamA.find((c) => c.characterId === characterId);
    const combatant = inA ?? state.teamB.find((c) => c.characterId === characterId);
    if (!combatant) return { mode: 'error', message: 'Tu ne participes pas à ce combat.' };
    if (combatant.hp <= 0) return { mode: 'error', message: 'Tu es K.O. — tu ne peux plus agir ce combat.' };
    if (state.pendingActions[characterId]) return { mode: 'wait', message: 'Tu as déjà choisi ton action ce tour.' };

    state.pendingActions[characterId] = { action, targetIndex };
    await setArenaTeamMatchState(matchId, state);

    const alive = [...state.teamA, ...state.teamB].filter((c) => c.hp > 0);
    const allSubmitted = alive.every((c) => state.pendingActions[c.characterId]);
    if (!allSubmitted) return { mode: 'wait', message: 'Action enregistrée — en attente du reste des deux équipes.' };

    await cancelTurnTimeout(matchId, state.round);
    const resolved = await resolveRound(state, discordClient);
    return { mode: 'resolved', ...resolved };
  });
}

async function handleTurnTimeout(matchId, round, discordClient) {
  const outcome = await withMatchLock(matchId, async () => {
    const state = await getArenaTeamMatchState(matchId);
    if (!state || state.status !== 'active' || state.round !== round) return null;

    state.missedTurns = state.missedTurns ?? { A: 0, B: 0 };
    const autoLogs = [];
    const missedSides = new Set();

    for (const [side, team] of [['A', state.teamA], ['B', state.teamB]]) {
      for (const c of team) {
        if (c.hp <= 0) continue;
        if (!state.pendingActions[c.characterId]) {
          const enemyTeam = side === 'A' ? state.teamB : state.teamA;
          const aliveEnemies = enemyTeam.filter((e) => e.hp > 0);
          const targetIndex  = aliveEnemies.length ? enemyTeam.indexOf(aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]) : 0;
          state.pendingActions[c.characterId] = { action: 'attack', targetIndex };
          missedSides.add(side);
          autoLogs.push(`⏱️ **${c.name}** n'a pas choisi à temps — attaque automatique.`);
        }
      }
    }

    for (const side of ['A', 'B']) {
      state.missedTurns[side] = missedSides.has(side) ? state.missedTurns[side] + 1 : 0;
    }

    const forfeitSide = (['A', 'B']).find((s) => state.missedTurns[s] >= COMBAT_CONFIG.ARENA_MAX_MISSED_TURNS);
    if (forfeitSide) {
      const winningSide = forfeitSide === 'A' ? 'B' : 'A';
      state.log.push(...autoLogs, `🏳️ L'équipe **${forfeitSide === 'A' ? state.guildIdA : state.guildIdB}** abandonne le combat (inactive trop longtemps).`);
      state.status = 'finished';
      await finalizeMatch(state, winningSide, discordClient);
      return state;
    }

    state.log.push(...autoLogs);
    const resolved = await resolveRound(state, discordClient);
    return resolved.state;
  });

  if (outcome) await postTeamUpdate(outcome, discordClient);
}

function startArenaTeamWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'arena-team-turn',
    async (job) => {
      await handleTurnTimeout(job.data.matchId, job.data.round, discordClient);
    },
    { connection: redisConnection },
  );
}

function eloDelta(eloSelf, eloOpponent, won) {
  const expected = 1 / (1 + Math.pow(10, (eloOpponent - eloSelf) / 400));
  return Math.round(COMBAT_CONFIG.ARENA_ELO_K * ((won ? 1 : 0) - expected));
}

/**
 * Team ELO uses each side's average rating as a single "team rating" for the standard
 * Elo formula, then applies the resulting delta identically to every member's own
 * ArenaProfile — a deliberate simplification over a full per-player team-rating system.
 */
async function finalizeMatch(state, winningSide, discordClient) {
  const winningTeam = winningSide === 'A' ? state.teamA : state.teamB;
  const losingTeam  = winningSide === 'A' ? state.teamB : state.teamA;

  const winningProfiles = await Promise.all(winningTeam.map((c) => getOrCreateArenaProfile(c.characterId)));
  const losingProfiles  = await Promise.all(losingTeam.map((c) => getOrCreateArenaProfile(c.characterId)));

  const avg = (profiles) => profiles.reduce((sum, p) => sum + p.elo, 0) / profiles.length;
  const winAvg = avg(winningProfiles);
  const loseAvg = avg(losingProfiles);

  const winDelta = eloDelta(winAvg, loseAvg, true);
  const loseDelta = eloDelta(loseAvg, winAvg, false);

  await prisma.$transaction([
    ...winningTeam.map((c) => prisma.arenaProfile.update({
      where: { characterId: c.characterId },
      data: { elo: { increment: winDelta }, wins: { increment: 1 }, lastMatchAt: new Date() },
    })),
    ...losingTeam.map((c) => prisma.arenaProfile.update({
      where: { characterId: c.characterId },
      data: { elo: { increment: loseDelta }, losses: { increment: 1 }, lastMatchAt: new Date() },
    })),
  ]);

  await prisma.arenaTeamMatch.create({
    data: {
      guildIdA: state.guildIdA,
      guildIdB: state.guildIdB,
      winningGuildId: winningSide === 'A' ? state.guildIdA : state.guildIdB,
      ranked: state.ranked,
      logJson: state.log,
      participants: {
        create: [
          ...state.teamA.map((c) => ({ characterId: c.characterId, side: 'A', eloDelta: winningSide === 'A' ? winDelta : loseDelta })),
          ...state.teamB.map((c) => ({ characterId: c.characterId, side: 'B', eloDelta: winningSide === 'B' ? winDelta : loseDelta })),
        ],
      },
    },
  });

  await cancelTurnTimeout(state.matchId, state.round);
  for (const c of [...state.teamA, ...state.teamB]) await clearActive(c.characterId);
  await deleteArenaTeamMatchState(state.matchId);
}

module.exports = {
  joinLobby,
  leaveLobby,
  searchMatch,
  submitAction,
  findActor,
  postTeamUpdate,
  startArenaTeamWorker,
};
