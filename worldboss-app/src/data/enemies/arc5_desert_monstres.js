'use strict';

// Arc 5 - Désert monstres (niveaux 11-14)
// Stats: HP 200-320, ATK 30-45, DEF 12-22, SPD 6-14, XP 70-120, Gold 8-20

module.exports = {
  desert_snake: {
    id: 'desert_snake',
    name: 'Serpent du désert',
    hp: 200,
    maxHp: 200,
    atk: 32,
    def: 12,
    spd: 12,
    crit: 8,
    restHeal: 18,
    xp: 75,
    ability: 'poison_sting',
    gold: { min: 8, max: 14 },
    loot: ['whip_venom', 'desert_cloth', 'antidote', 'scarab_beetle'],
  },

  desert_scorpion: {
    id: 'desert_scorpion',
    name: 'Scorpion du désert',
    hp: 240,
    maxHp: 240,
    atk: 38,
    def: 18,
    spd: 8,
    crit: 5,
    restHeal: 20,
    xp: 90,
    ability: 'poison_sting',
    gold: { min: 10, max: 16 },
    loot: ['scimitar_gold', 'desert_cloth', 'antidote'],
  },

  desert_mummy: {
    id: 'desert_mummy',
    name: 'Momie du désert',
    hp: 310,
    maxHp: 310,
    atk: 35,
    def: 20,
    spd: 6,
    crit: 0,
    restHeal: 22,
    xp: 110,
    ability: 'curse',
    gold: { min: 12, max: 20 },
    loot: ['staff_desert', 'desert_robe', 'potion_mana', 'turban_desert'],
  },
};
