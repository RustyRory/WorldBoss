'use strict';

const { prisma } = require('../db/prisma');
const { ITEMS } = require('../data/items');
const { typeToSlot } = require('../utils/stats');

async function getInventory(characterId) {
  return prisma.characterItem.findMany({
    where: { characterId },
    include: { item: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function getOrCreateLoadout(characterId) {
  let loadout = await prisma.loadout.findUnique({ where: { characterId } });
  if (!loadout) {
    loadout = await prisma.loadout.create({ data: { characterId } });
  }
  return loadout;
}

async function equipItem(characterId, itemId) {
  const itemDef = ITEMS[itemId];
  if (!itemDef) return { success: false, message: `Item **${itemId}** inconnu.` };
  if (itemDef.type === 'consumable') return { success: false, message: 'Les consommables ne peuvent pas être équipés.' };

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });
  if (!charItem || charItem.quantity < 1) {
    return { success: false, message: `Vous ne possédez pas **${itemDef.name}**.` };
  }

  const character = await prisma.character.findUnique({ where: { id: characterId }, select: { level: true } });
  if (character.level < itemDef.levelRequired) {
    return {
      success: false,
      message: `Niveau **${itemDef.levelRequired}** requis pour équiper **${itemDef.name}**.`,
    };
  }

  const loadout = await getOrCreateLoadout(characterId);

  // Verify enough unequipped copies are available
  const equippedList = [
    loadout.weaponId, loadout.armorId, loadout.helmetId,
    loadout.bootsId, loadout.accessory1Id, loadout.accessory2Id,
  ];
  const equippedCount = equippedList.filter((id) => id === itemId).length;
  if (charItem.quantity - equippedCount < 1) {
    return { success: false, message: `Toutes vos copies de **${itemDef.name}** sont déjà équipées.` };
  }

  let slotField = typeToSlot(itemDef.type);

  if (!slotField) {
    if (itemDef.type === 'accessory') {
      if (!loadout.accessory1Id) {
        slotField = 'accessory1Id';
      } else if (!loadout.accessory2Id) {
        slotField = 'accessory2Id';
      } else {
        slotField = 'accessory1Id';
      }
    } else {
      return { success: false, message: `Type d'item **${itemDef.type}** non équipable.` };
    }
  }

  const updatedLoadout = await prisma.loadout.update({
    where: { characterId },
    data: { [slotField]: itemId },
  });

  return { success: true, message: `**${itemDef.name}** équipé avec succès !`, loadout: updatedLoadout };
}

async function unequipSlot(characterId, slot) {
  const VALID_SLOTS = ['weapon', 'armor', 'helmet', 'boots', 'accessory1', 'accessory2'];
  if (!VALID_SLOTS.includes(slot)) {
    return { success: false, message: `Slot invalide. Utilisez: ${VALID_SLOTS.join(', ')}` };
  }

  const slotField = slot + 'Id';
  const loadout = await getOrCreateLoadout(characterId);

  if (!loadout[slotField]) {
    return { success: false, message: `Le slot **${slot}** est déjà vide.` };
  }

  const updatedLoadout = await prisma.loadout.update({
    where: { characterId },
    data: { [slotField]: null },
  });

  return { success: true, message: `Slot **${slot}** déséquipé.`, loadout: updatedLoadout };
}

async function grantItem(characterId, itemId, quantity = 1) {
  return prisma.characterItem.upsert({
    where: { characterId_itemId: { characterId, itemId } },
    update: { quantity: { increment: quantity } },
    create: { characterId, itemId, quantity },
  });
}

async function sellItem(characterId, itemId) {
  const { consumeAP } = require('./actionPoints.service');
  const itemDef = ITEMS[itemId];
  if (!itemDef) return { success: false, message: `Item **${itemId}** inconnu.` };

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });
  if (!charItem || charItem.quantity < 1) {
    return { success: false, message: `Tu ne possèdes pas **${itemDef.name}**.` };
  }

  const loadout = await getOrCreateLoadout(characterId);
  const equippedIds = [
    loadout.weaponId, loadout.armorId, loadout.helmetId,
    loadout.bootsId, loadout.accessory1Id, loadout.accessory2Id,
  ];
  const equippedCount = equippedIds.filter((id) => id === itemId).length;
  if (charItem.quantity - equippedCount < 1) {
    return { success: false, message: `Déséquipe **${itemDef.name}** avant de le vendre.` };
  }

  const ap = await consumeAP(characterId, 'sell');
  if (!ap.success) {
    const minutes = Math.ceil(ap.msUntilNext / 60000);
    return {
      success: false,
      message: `Tu n'as plus de points d'action (**${ap.currentAP}/10** PA).\nProchain PA dans **${minutes} minute${minutes > 1 ? 's' : ''}**.`,
    };
  }

  const sellPrice = Math.max(1, Math.floor(itemDef.price * 0.1));

  await prisma.$transaction([
    charItem.quantity > 1
      ? prisma.characterItem.update({
          where: { characterId_itemId: { characterId, itemId } },
          data: { quantity: { decrement: 1 } },
        })
      : prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId } } }),
    prisma.character.update({
      where: { id: characterId },
      data: { gold: { increment: sellPrice } },
    }),
  ]);

  return { success: true, message: `**${itemDef.name}** vendu pour **${sellPrice}** 🪙`, goldEarned: sellPrice };
}

/**
 * Use a consumable from inventory outside of combat.
 * Only items with usableOutOfCombat: true are allowed.
 * Decrements quantity (or deletes) unless item.infiniteUse is true.
 */
async function useConsumable(characterId, itemId) {
  const { computeRegenedHp } = require('./player.service');
  const { restoreAP } = require('./actionPoints.service');
  const { computeStats } = require('../utils/stats');

  const itemDef = ITEMS[itemId];
  if (!itemDef || itemDef.type !== 'consumable') {
    return { success: false, message: 'Item non consommable.' };
  }
  if (!itemDef.usableOutOfCombat) {
    return { success: false, message: `**${itemDef.name}** ne peut être utilisé qu'en combat.` };
  }

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });
  if (!charItem || charItem.quantity < 1) {
    return { success: false, message: `Vous ne possédez pas **${itemDef.name}**.` };
  }

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { loadout: true },
  });

  let message = '';
  const { type, value } = itemDef.effect ?? {};

  if (type === 'heal') {
    const stats     = computeStats(character, character.loadout);
    const maxHp     = stats.hp;
    const currentHp = computeRegenedHp(character.hp, character.hpUpdatedAt, maxHp);
    if (currentHp >= maxHp) {
      return { success: false, message: 'Vos HP sont déjà au maximum !' };
    }
    const newHp  = Math.min(maxHp, currentHp + value);
    const healed = newHp - currentHp;
    await prisma.character.update({
      where: { id: characterId },
      data: { hp: newHp, hpUpdatedAt: new Date() },
    });
    message = `💚 +**${healed}** HP — vous avez maintenant **${newHp}/${maxHp}** HP.`;

  } else if (type === 'restore_ap') {
    const result = await restoreAP(characterId, value);
    if (result.restored === 0) {
      return { success: false, message: 'Vos points d\'action sont déjà au maximum !' };
    }
    message = `⚡ +**${result.restored}** PA — vous avez maintenant **${result.newAP}/10** PA.`;

  } else if (type === 'cure_dot') {
    // Hors combat les DoTs n'existent pas — l'antidote n'a pas d'effet mais se consomme quand même
    message = `💊 **${itemDef.name}** utilisé — aucun effet hors combat.`;

  } else if (type === 'reroll_race') {
    // Consumed only after race/gender selection — signal the caller
    return { success: true, action: 'reroll_race' };

  } else {
    return { success: false, message: `Effet **${type}** non utilisable hors combat.` };
  }

  // Consume item unless infiniteUse
  if (!itemDef.infiniteUse) {
    if (charItem.quantity <= 1) {
      await prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId } } });
    } else {
      await prisma.characterItem.update({
        where: { characterId_itemId: { characterId, itemId } },
        data: { quantity: { decrement: 1 } },
      });
    }
  }

  return { success: true, message };
}

module.exports = { getInventory, getOrCreateLoadout, equipItem, unequipSlot, grantItem, sellItem, useConsumable };
