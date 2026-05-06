'use strict';

// Arc 3 - Bandits des routes (niveaux 5-8)
// Stats: HP 120-220, ATK 18-28, DEF 6-15, SPD 6-16, XP 35-70, Gold 4-12

module.exports = {
  bandit_scout: {
    id: 'bandit_scout',
    name: 'Éclaireur bandit',
    hp: 120,
    maxHp: 120,
    atk: 18,
    def: 6,
    spd: 16,
    crit: 10,
    xp: 38,
    ability: 'quick_strike',
    gold: { min: 4, max: 7 },
    loot: ['dagger_shadow', 'boots_shadow', 'potion_heal'],
  },

  bandit_thief: {
    id: 'bandit_thief',
    name: 'Voleur bandit',
    hp: 130,
    maxHp: 130,
    atk: 20,
    def: 7,
    spd: 14,
    crit: 8,
    xp: 45,
    ability: 'steal',
    gold: { min: 5, max: 9 },
    loot: ['dagger_shadow', 'studded_leather', 'potion_heal', 'smoke_bomb'],
  },

  bandit_brute: {
    id: 'bandit_brute',
    name: 'Brute bandit',
    hp: 190,
    maxHp: 190,
    atk: 24,
    def: 12,
    spd: 7,
    crit: 0,
    xp: 58,
    ability: 'smash',
    gold: { min: 6, max: 10 },
    loot: ['axe_heavy', 'studded_leather', 'potion_heal'],
  },

  bandit_leader: {
    id: 'bandit_leader',
    name: 'Chef bandit',
    hp: 175,
    maxHp: 175,
    atk: 26,
    def: 10,
    spd: 12,
    crit: 8,
    xp: 65,
    ability: 'intimidate',
    gold: { min: 8, max: 12 },
    loot: ['sword_ancient', 'studded_leather', 'potion_heal', 'ring_shadow'],
  },
};
