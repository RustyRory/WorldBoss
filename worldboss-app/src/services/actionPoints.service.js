'use strict';

const { prisma } = require('../db/prisma');

const AP_MAX = 10;
const AP_RECHARGE_MS = 2 * 60 * 60 * 1000; // 1 PA toutes les 2 heures

const AP_COST = {
  sell:  1,
  prime: 1,
};

function computeCurrentAP(character) {
  const elapsed = Date.now() - new Date(character.actionPointsUpdatedAt).getTime();
  const recharged = Math.floor(elapsed / AP_RECHARGE_MS);
  return Math.min(AP_MAX, character.actionPoints + recharged);
}

function msUntilNextAP(character) {
  const current = computeCurrentAP(character);
  if (current >= AP_MAX) return 0;
  const elapsed = Date.now() - new Date(character.actionPointsUpdatedAt).getTime();
  return AP_RECHARGE_MS - (elapsed % AP_RECHARGE_MS);
}

async function consumeAP(characterId, action) {
  const cost = AP_COST[action];
  if (cost === undefined) throw new Error(`Action inconnue : ${action}`);

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { actionPoints: true, actionPointsUpdatedAt: true },
  });
  if (!character) throw new Error('Character not found');

  const elapsed = Date.now() - new Date(character.actionPointsUpdatedAt).getTime();
  const recharged = Math.floor(elapsed / AP_RECHARGE_MS);
  const currentAP = Math.min(AP_MAX, character.actionPoints + recharged);

  if (currentAP < cost) {
    return { success: false, currentAP, msUntilNext: msUntilNextAP(character) };
  }

  const newUpdatedAt = recharged > 0
    ? new Date(new Date(character.actionPointsUpdatedAt).getTime() + recharged * AP_RECHARGE_MS)
    : character.actionPointsUpdatedAt;

  await prisma.character.update({
    where: { id: characterId },
    data: { actionPoints: currentAP - cost, actionPointsUpdatedAt: newUpdatedAt },
  });

  return { success: true, currentAP: currentAP - cost, msUntilNext: 0 };
}

async function getAP(characterId) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { actionPoints: true, actionPointsUpdatedAt: true },
  });
  if (!character) throw new Error('Character not found');
  return {
    current: computeCurrentAP(character),
    max: AP_MAX,
    msUntilNext: msUntilNextAP(character),
  };
}

async function restoreAP(characterId, amount) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { actionPoints: true, actionPointsUpdatedAt: true },
  });
  if (!character) throw new Error('Character not found');

  const elapsed   = Date.now() - new Date(character.actionPointsUpdatedAt).getTime();
  const recharged = Math.floor(elapsed / AP_RECHARGE_MS);
  const currentAP = Math.min(AP_MAX, character.actionPoints + recharged);
  const newAP     = Math.min(AP_MAX, currentAP + amount);

  const newUpdatedAt = recharged > 0
    ? new Date(new Date(character.actionPointsUpdatedAt).getTime() + recharged * AP_RECHARGE_MS)
    : character.actionPointsUpdatedAt;

  await prisma.character.update({
    where: { id: characterId },
    data: { actionPoints: newAP, actionPointsUpdatedAt: newUpdatedAt },
  });

  return { newAP, restored: newAP - currentAP };
}

module.exports = { consumeAP, restoreAP, getAP, AP_MAX, AP_COST };
