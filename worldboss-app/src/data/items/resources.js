'use strict';

// Ressources de la cité commune — obtenues en butin de donjon (voir city.service.js
// rollResourceDrop), stockées normalement via CharacterItem, puis données à la cité
// via /city donate. Pas d'emplacement d'équipement, pas de stats de combat.
module.exports = {
  wood: {
    id: 'wood',
    name: 'Bois',
    type: 'resource',
    rarity: 'common',
    stats: {},
    skill: null,
    passive: null,
    price: 5,
    levelRequired: 1,
  },
  stone: {
    id: 'stone',
    name: 'Pierre',
    type: 'resource',
    rarity: 'common',
    stats: {},
    skill: null,
    passive: null,
    price: 8,
    levelRequired: 1,
  },
  iron: {
    id: 'iron',
    name: 'Fer',
    type: 'resource',
    rarity: 'rare',
    stats: {},
    skill: null,
    passive: null,
    price: 15,
    levelRequired: 1,
  },
  food: {
    id: 'food',
    name: 'Vivres',
    type: 'resource',
    rarity: 'common',
    stats: {},
    skill: null,
    passive: null,
    price: 6,
    levelRequired: 1,
  },
};
