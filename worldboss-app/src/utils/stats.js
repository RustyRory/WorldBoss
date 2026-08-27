'use strict';

const { ITEMS } = require('../data/items');
const { SKILLS } = require('../data/skills');
const { getRaceBonuses } = require('../data/races');

/**
 * Calculate base stats for a player at the given level.
 */
function baseStats(level, rank = 0) {
  return {
    hp: 100 + 20 * level + 20 * rank,
    atk: 10 + 2 * level + 2 * rank,
    def: 5 + level + rank,
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
 * All Loadout field names, in display order.
 */
const LOADOUT_FIELDS = [
  'weaponId', 'shieldId', 'armorId', 'helmetId', 'glovesId',
  'bootsId', 'beltId', 'amuletId', 'ring1Id', 'ring2Id',
];

/**
 * Get all stat bonuses from a loadout record.
 * @param {object} loadout - Prisma Loadout row (10 nullable slot fields, see LOADOUT_FIELDS)
 */
function loadoutStats(loadout) {
  if (!loadout) return { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };

  const slots = LOADOUT_FIELDS.map((field) => loadout[field]).filter(Boolean);

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
  const base  = baseStats(user.level, user.rank ?? 0);
  const equip = loadoutStats(loadout);
  const race  = getRaceBonuses(user.race ?? 'humain', user.gender ?? 'male');

  // Apply race/gender % multipliers on top of (base + equipment)
  const total = {
    hp:       Math.round((base.hp   + equip.hp)            * (1 + race.hpPct)),
    atk:      Math.round((base.atk  + (equip.atk  || 0))   * (1 + race.atkPct)),
    def:      Math.round((base.def  + (equip.def  || 0))   * (1 + race.defPct)),
    spd:      Math.round((base.spd  + (equip.spd  || 0))   * (1 + race.spdPct)),
    crit:     base.crit + (equip.crit || 0) + race.critFlat,
    critMult: base.critMult,
  };

  // Collect all skills and passives from every equipped slot
  const allSlots = LOADOUT_FIELDS.map((field) => loadout?.[field]).filter(Boolean);

  const activeSkills  = []; // { key, ...skillDef }
  const activePassives = []; // passive keys (strings)

  for (const slotId of allSlots) {
    const item = ITEMS[slotId];
    if (!item) continue;
    if (item.skill && activeSkills.length < 2) {
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
  shield: 'shieldId',
  armor: 'armorId',
  helmet: 'helmetId',
  gloves: 'glovesId',
  boots: 'bootsId',
  belt: 'beltId',
  amulet: 'amuletId',
  ring1: 'ring1Id',
  ring2: 'ring2Id',
};

/**
 * Given an item type, return the default slot field. Rings need special handling
 * (picked between ring1/ring2 by the caller, see inventory.service.js).
 */
function typeToSlot(type) {
  const map = {
    weapon: 'weaponId',
    shield: 'shieldId',
    armor: 'armorId',
    helmet: 'helmetId',
    gloves: 'glovesId',
    boots: 'bootsId',
    belt: 'beltId',
    amulet: 'amuletId',
    ring: null, // handled separately (ring1 / ring2)
  };
  return map[type] ?? null;
}

module.exports = { baseStats, xpRequired, loadoutStats, computeStats, SLOT_MAP, typeToSlot, LOADOUT_FIELDS };
