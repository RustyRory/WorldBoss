'use strict';

// Arc 6 - Désert steampunk (niveaux 14-17)
// Stats: HP 280-400, ATK 40-55, DEF 18-30, SPD 5-12, XP 100-160, Gold 12-30

module.exports = {
  steampunk_steamkin: {
    id: 'steampunk_steamkin',
    name: 'Steamkin du désert',
    hp: 290,
    maxHp: 290,
    atk: 42,
    def: 20,
    spd: 8,
    crit: 5,
    xp: 105,
    ability: 'steam_blast',
    gold: { min: 12, max: 20 },
    loot: ['steam_armor', 'goggles_steam', 'elixir_berserk'],
  },

  steampunk_mechanic: {
    id: 'steampunk_mechanic',
    name: 'Mécanicien du désert',
    hp: 320,
    maxHp: 320,
    atk: 44,
    def: 24,
    spd: 6,
    crit: 0,
    xp: 120,
    ability: 'oil_slick',
    gold: { min: 15, max: 24 },
    loot: ['goggles_steam', 'boots_steam', 'scroll_fire', 'elixir_iron'],
  },

  steampunk_gunner: {
    id: 'steampunk_gunner',
    name: 'Tireur du désert',
    hp: 280,
    maxHp: 280,
    atk: 52,
    def: 18,
    spd: 12,
    crit: 15,
    xp: 138,
    ability: 'overheat',
    gold: { min: 18, max: 26 },
    loot: ['rifle_steam', 'goggles_steam', 'scroll_fire'],
  },

  steampunk_captain: {
    id: 'steampunk_captain',
    name: 'Capitaine du désert',
    hp: 390,
    maxHp: 390,
    atk: 50,
    def: 28,
    spd: 9,
    crit: 8,
    xp: 155,
    ability: 'steam_shield',
    gold: { min: 22, max: 30 },
    loot: ['rifle_steam', 'steam_armor', 'boots_steam', 'elixir_berserk'],
  },
};
