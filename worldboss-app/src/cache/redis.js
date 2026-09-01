'use strict';

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

// ── Helper: combat state ────────────────────────────────────────────────────
const COMBAT_TTL = 60 * 30; // 30 minutes
const LOOT_TTL   = 60 * 5;  // 5 minutes

async function getCombatState(userId) {
  const raw = await redis.get(`combat:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setCombatState(userId, state) {
  await redis.set(`combat:${userId}`, JSON.stringify(state), 'EX', COMBAT_TTL);
}

async function deleteCombatState(userId) {
  await redis.del(`combat:${userId}`);
}

// ── Helper: pending loot (after combat victory) ─────────────────────────────
async function getPendingLoot(characterId) {
  const raw = await redis.get(`loot:${characterId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setPendingLoot(characterId, options) {
  await redis.set(`loot:${characterId}`, JSON.stringify(options), 'EX', LOOT_TTL);
}

async function deletePendingLoot(characterId) {
  await redis.del(`loot:${characterId}`);
}

// ── Helper: dungeon state ───────────────────────────────────────────────────
const DUNGEON_TTL = 60 * 60 * 2; // 2 hours

async function getDungeonState(characterId) {
  const raw = await redis.get(`dungeon:${characterId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setDungeonState(characterId, state) {
  await redis.set(`dungeon:${characterId}`, JSON.stringify(state), 'EX', DUNGEON_TTL);
}

async function deleteDungeonState(characterId) {
  await redis.del(`dungeon:${characterId}`);
}

// ── Helper: prime combat state ──────────────────────────────────────────────
const PRIME_TTL = 60 * 60 * 2; // 2 hours

async function getPrimeCombatState(primeRunId) {
  const raw = await redis.get(`prime:${primeRunId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setPrimeCombatState(primeRunId, state) {
  await redis.set(`prime:${primeRunId}`, JSON.stringify(state), 'EX', PRIME_TTL);
}

async function deletePrimeCombatState(primeRunId) {
  await redis.del(`prime:${primeRunId}`);
}

// ── Helper: arena (PvP) match state + matchmaking queue ─────────────────────
const ARENA_MATCH_TTL = 60 * 30; // 30 minutes
const ARENA_QUEUE_TTL = 60 * 60; // 1 hour

async function getArenaMatchState(matchId) {
  const raw = await redis.get(`arena:match:${matchId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setArenaMatchState(matchId, state) {
  await redis.set(`arena:match:${matchId}`, JSON.stringify(state), 'EX', ARENA_MATCH_TTL);
}

async function deleteArenaMatchState(matchId) {
  await redis.del(`arena:match:${matchId}`);
}

async function getArenaQueue(guildId) {
  const raw = await redis.get(`arena:queue:${guildId}`);
  return raw ? JSON.parse(raw) : [];
}

async function setArenaQueue(guildId, queue) {
  await redis.set(`arena:queue:${guildId}`, JSON.stringify(queue), 'EX', ARENA_QUEUE_TTL);
}

// ── Helper: arena team battles (4v4 inter-serveurs, Phase 2) ────────────────
const TEAM_LOBBY_TTL = 60 * 60;     // 1 hour
const TEAM_MATCH_TTL = 60 * 30;     // 30 minutes, refreshed every round
const TEAM_QUEUE_TTL = 60 * 60 * 2; // 2 hours

async function getArenaTeamLobby(guildId) {
  const raw = await redis.get(`arena:team-lobby:${guildId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setArenaTeamLobby(guildId, lobby) {
  await redis.set(`arena:team-lobby:${guildId}`, JSON.stringify(lobby), 'EX', TEAM_LOBBY_TTL);
}

async function deleteArenaTeamLobby(guildId) {
  await redis.del(`arena:team-lobby:${guildId}`);
}

// Cross-guild — one shared queue, not scoped per server.
async function getArenaTeamQueue() {
  const raw = await redis.get('arena:team-queue');
  return raw ? JSON.parse(raw) : [];
}

async function setArenaTeamQueue(queue) {
  await redis.set('arena:team-queue', JSON.stringify(queue), 'EX', TEAM_QUEUE_TTL);
}

async function getArenaTeamMatchState(matchId) {
  const raw = await redis.get(`arena:team-match:${matchId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setArenaTeamMatchState(matchId, state) {
  await redis.set(`arena:team-match:${matchId}`, JSON.stringify(state), 'EX', TEAM_MATCH_TTL);
}

async function deleteArenaTeamMatchState(matchId) {
  await redis.del(`arena:team-match:${matchId}`);
}

module.exports = {
  redis,
  getCombatState,
  setCombatState,
  deleteCombatState,
  getPendingLoot,
  setPendingLoot,
  deletePendingLoot,
  getDungeonState,
  setDungeonState,
  deleteDungeonState,
  getPrimeCombatState,
  setPrimeCombatState,
  deletePrimeCombatState,
  getArenaMatchState,
  setArenaMatchState,
  deleteArenaMatchState,
  getArenaQueue,
  setArenaQueue,
  getArenaTeamLobby,
  setArenaTeamLobby,
  deleteArenaTeamLobby,
  getArenaTeamQueue,
  setArenaTeamQueue,
  getArenaTeamMatchState,
  setArenaTeamMatchState,
  deleteArenaTeamMatchState,
};
