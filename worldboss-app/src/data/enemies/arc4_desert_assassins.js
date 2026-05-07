'use strict';

// Arc 4 - Désert assassins (niveaux 8-11)
// Stats: HP 160-260, ATK 24-35, DEF 8-18, SPD 8-18, XP 50-90, Gold 6-15

module.exports = {
  desert_ninja: {
    id: 'desert_ninja',
    name: 'Ninja du désert',
    hp: 160,
    maxHp: 160,
    atk: 28,
    def: 8,
    spd: 18,
    crit: 15,
    restHeal: 15,
    xp: 55,
    ability: 'shadow_step',
    gold: { min: 6, max: 10 },
    loot: ['dagger_shadow', 'hood_shadow', 'antidote'],
  },

  desert_berserker: {
    id: 'desert_berserker',
    name: 'Berserker du désert',
    hp: 230,
    maxHp: 230,
    atk: 32,
    def: 10,
    spd: 10,
    crit: 5,
    restHeal: 18,
    xp: 68,
    ability: 'frenzy_strike',
    gold: { min: 7, max: 12 },
    loot: ['scimitar_gold', 'throwing_knife', 'potion_heal'],
  },

  desert_assassin: {
    id: 'desert_assassin',
    name: 'Assassin du désert',
    hp: 175,
    maxHp: 175,
    atk: 34,
    def: 9,
    spd: 17,
    crit: 20,
    restHeal: 15,
    xp: 80,
    ability: 'shadow_strike',
    gold: { min: 9, max: 15 },
    loot: ['dagger_shadow', 'boots_shadow', 'smoke_bomb', 'ring_shadow'],
  },
};
