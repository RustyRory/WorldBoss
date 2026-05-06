'use strict';

// Arc 2 - Château maudit (niveaux 3-5)
// Stats: HP 80-180, ATK 14-22, DEF 5-12, SPD 4-12, XP 25-55, Gold 3-10

module.exports = {
  castle_warrior: {
    id: 'castle_warrior',
    name: 'Guerrier du château',
    hp: 100,
    maxHp: 100,
    atk: 16,
    def: 9,
    spd: 5,
    crit: 0,
    xp: 30,
    ability: 'power_strike',
    gold: { min: 3, max: 6 },
    loot: ['sword_steel', 'iron_armor', 'potion_heal'],
  },

  castle_priest: {
    id: 'castle_priest',
    name: 'Prêtre du château',
    hp: 80,
    maxHp: 80,
    atk: 14,
    def: 5,
    spd: 6,
    crit: 0,
    xp: 35,
    ability: 'heal',
    gold: { min: 3, max: 6 },
    loot: ['staff_bone', 'robe_cloth', 'potion_mana', 'amulet_bone'],
  },

  castle_captain: {
    id: 'castle_captain',
    name: 'Capitaine du château',
    hp: 150,
    maxHp: 150,
    atk: 20,
    def: 11,
    spd: 8,
    crit: 5,
    xp: 50,
    ability: 'rally',
    gold: { min: 6, max: 10 },
    loot: ['axe_heavy', 'iron_armor', 'potion_heal', 'helmet_soldier'],
  },
};
