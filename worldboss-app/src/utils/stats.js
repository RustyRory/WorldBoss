'use strict';

const { ITEMS } = require('../data/items');
const { SKILLS } = require('../data/skills');

/**
 * Calculate base stats for a player at the given level.
 */
function baseStats(level) {
  return {
    hp: 100 + 20 * level,
    atk: 10 + 2 * level,
    def: 5 + 1 * level,
    spd: 10 + Math.floor(level / 5),
    crit: 0,
    critMult: 1.5,
  };
}

/**
 * Calculate XP required to reach the next level from current level.
 */
function xpRequired(level) {
  return Math.floor(100 * level * 1.5);
}

/**
 * Get all stat bonuses from a loadout record.
 * @param {object} loadout - Prisma Loadout row (fields: weaponId, armorId, helmetId, bootsId, accessory1Id, accessory2Id)
 */
function loadoutStats(loadout) {
  if (!loadout) return { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };

  const slots = [
    loadout.weaponId,
    loadout.armorId,
    loadout.helmetId,
    loadout.bootsId,
    loadout.accessory1Id,
    loadout.accessory2Id,
  ].filter(Boolean);

  const bonus = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };

  for (const itemId of slots) {
    const item = ITEMS[itemId];
    if (!item || !item.stats) continue;
    for (const [stat, val] of Object.entries(item.stats)) {
      if (stat in bonus) bonus[stat] += val;
    }
  }

  return bonus;
}

/**
 * Return complete computed stats for a player (base + equipment).
 * Also returns the equipped skill (from weapon) if any.
 */
function computeStats(user, loadout) {
  const base = baseStats(user.level);
  const bonus = loadoutStats(loadout);

  const total = {
    hp: base.hp + bonus.hp,
    atk: base.atk + (bonus.atk || 0),
    def: base.def + (bonus.def || 0),
    spd: base.spd + (bonus.spd || 0),
    crit: base.crit + (bonus.crit || 0),
    critMult: base.critMult,
  };

  // Collect all skills and passives from every equipped slot
  const allSlots = [
    loadout?.weaponId,
    loadout?.armorId,
    loadout?.helmetId,
    loadout?.bootsId,
    loadout?.accessory1Id,
    loadout?.accessory2Id,
  ].filter(Boolean);

  const activeSkills  = []; // { key, ...skillDef }
  const activePassives = []; // passive keys (strings)

  for (const slotId of allSlots) {
    const item = ITEMS[slotId];
    if (!item) continue;
    if (item.skill) {
      const sk = SKILLS[item.skill];
      if (sk && !activeSkills.find((s) => s.key === item.skill)) {
        activeSkills.push({ key: item.skill, ...sk });
      }
    }
    if (item.passive && !activePassives.includes(item.passive)) {
      activePassives.push(item.passive);
    }
  }

  return { ...total, activeSkills, activePassives };
}

/**
 * Slot name → loadout field name mapping.
 */
const SLOT_MAP = {
  weapon: 'weaponId',
  armor: 'armorId',
  helmet: 'helmetId',
  boots: 'bootsId',
  accessory1: 'accessory1Id',
  accessory2: 'accessory2Id',
};

/**
 * Given an item type, return the default slot field. Accessories need special handling.
 */
function typeToSlot(type) {
  const map = {
    weapon: 'weaponId',
    armor: 'armorId',
    helmet: 'helmetId',
    boots: 'bootsId',
    accessory: null, // handled separately (accessory1 / accessory2)
  };
  return map[type] ?? null;
}

module.exports = { baseStats, xpRequired, loadoutStats, computeStats, SLOT_MAP, typeToSlot };
