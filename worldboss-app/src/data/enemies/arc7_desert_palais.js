'use strict';

// Arc 7 - Palais du désert (niveaux 17-20)
// Stats: HP 360-500, ATK 48-65, DEF 24-38, SPD 6-14, XP 140-200, Gold 18-40

module.exports = {
  desert_guard: {
    id: 'desert_guard',
    name: 'Garde du désert',
    hp: 370,
    maxHp: 370,
    atk: 50,
    def: 28,
    spd: 8,
    crit: 0,
    xp: 145,
    ability: 'shield_wall',
    gold: { min: 18, max: 28 },
    loot: ['royal_armor', 'sword_pharaoh', 'potion_heal'],
  },

  desert_shaman: {
    id: 'desert_shaman',
    name: 'Chaman du désert',
    hp: 360,
    maxHp: 360,
    atk: 52,
    def: 24,
    spd: 10,
    crit: 8,
    xp: 155,
    ability: 'curse',
    gold: { min: 20, max: 30 },
    loot: ['staff_royal', 'ankh_pharaoh', 'potion_mana'],
  },

  desert_prince: {
    id: 'desert_prince',
    name: 'Prince du désert',
    hp: 430,
    maxHp: 430,
    atk: 58,
    def: 32,
    spd: 12,
    crit: 10,
    xp: 175,
    ability: 'royal_command',
    gold: { min: 25, max: 35 },
    loot: ['sword_pharaoh', 'royal_armor', 'crown_pharaoh'],
  },

  desert_pharaoh: {
    id: 'desert_pharaoh',
    name: 'Pharaon du désert',
    hp: 490,
    maxHp: 490,
    atk: 62,
    def: 36,
    spd: 8,
    crit: 12,
    xp: 190,
    ability: 'hellfire',
    gold: { min: 30, max: 40 },
    loot: ['sword_pharaoh', 'crown_pharaoh', 'ankh_pharaoh', 'royal_armor'],
  },

  demon_lord: {
    id: 'demon_lord',
    name: 'Seigneur démon',
    hp: 500,
    maxHp: 500,
    atk: 65,
    def: 38,
    spd: 14,
    crit: 15,
    xp: 200,
    ability: 'hellfire',
    gold: { min: 32, max: 40 },
    loot: ['sword_pharaoh', 'staff_royal', 'royal_armor', 'ankh_pharaoh'],
  },
};
