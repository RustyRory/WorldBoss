'use strict';

const { DUNGEONS } = require('../data/dungeons');
const { ENEMIES } = require('../data/enemies');

function createDungeonState(characterId, guildId, chapter) {
  const dungeon = DUNGEONS[chapter];
  if (!dungeon) throw new Error(`Unknown chapter: ${chapter}`);

  return {
    characterId,
    guildId,
    chapter,
    currentRoom: 1,
    totalRooms: dungeon.rooms.length,
    rooms: dungeon.rooms.map((r) => ({ ...r, completed: false })),
    enemiesFought: [],
    status: 'active',
  };
}

function getCurrentRoom(dungeonState) {
  return dungeonState.rooms.find((r) => r.room === dungeonState.currentRoom) ?? null;
}

function getRoomEnemies(room) {
  return room.enemies.map((id) => {
    const template = ENEMIES[id];
    if (!template) throw new Error(`Unknown enemy: ${id}`);
    return { ...template };
  });
}

function advanceRoom(dungeonState) {
  const room = getCurrentRoom(dungeonState);
  if (room) room.completed = true;

  if (dungeonState.currentRoom >= dungeonState.totalRooms) {
    dungeonState.status = 'completed';
    return { done: true };
  }

  dungeonState.currentRoom += 1;
  return { done: false };
}

module.exports = { createDungeonState, getCurrentRoom, getRoomEnemies, advanceRoom };
