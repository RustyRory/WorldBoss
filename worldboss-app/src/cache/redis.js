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
};
