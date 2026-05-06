'use strict';

const { ITEMS } = require('../data/items');

function rollLootOptions(enemy) {
  const pool = [...(enemy.loot || [])];
  if (pool.length === 0) return ['potion_heal', 'potion_heal'];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const options = pool.slice(0, 2);
  while (options.length < 2) options.push('potion_heal');

  return options;
}

async function applyLoot(prisma, characterId, itemId) {
  const item = ITEMS[itemId];
  if (!item) throw new Error(`Unknown item: ${itemId}`);

  const existing = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });

  if (existing) {
    const updated = await prisma.characterItem.update({
      where: { characterId_itemId: { characterId, itemId } },
      data: { quantity: { increment: 1 } },
    });
    return { itemId, isNew: false, newQuantity: updated.quantity };
  } else {
    await prisma.characterItem.create({ data: { characterId, itemId, quantity: 1 } });
    return { itemId, isNew: true, newQuantity: 1 };
  }
}

module.exports = { rollLootOptions, applyLoot };
