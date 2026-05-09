'use strict';

// unlockedBy : { type: 'dungeon', id } | { type: 'prime', id }
// replayThreshold : si level joueur > levelRequired + replayThreshold → replayMode

const PRIMES = {
  1: {
    id: 1,
    name: 'Les Catacombes — Expédition Élite',
    lore: 'Vous trouvez la source de la corruption : un nécromancien maléfique a pris le contrôle des squelettes. Il doit être arrêté avant que les catacombes ne deviennent un véritable cimetière pour les vivants...',
    levelRequired: 5,
    replayThreshold: 5,
    unlockedBy: { type: 'dungeon', id: 5 },
    rooms: [
      {
        room: 1,
        enemies: ['skeleton_warlord', 'skeleton_warlord', 'skeleton_warlord', 'skeleton_warlord'],
        description: 'La salle des champions déchus. Quatre chefs de guerre squelettes se tiennent côte à côte — les lieutenants du nécromancien. Leurs armures brisées portent encore les stigmates de batailles épiques. Un cri de guerre résonne dans la pierre.',
        enemyStats: {
          skeleton_warlord: { hp: 420, maxHp: 420, atk: 22, def: 9, restHeal: 25 },
        },
      },
      {
        room: 2,
        enemies: ['skeleton_warlord', 'skeleton_warlord', 'skeleton_warlord', 'skeleton_king'],
        description: 'La chambre profanée. Trois chefs de guerre squelettes entourent un roi squelette couronné qui flotte au-dessus du sol. *"Encore des intrus... Montrez-leur la puissance de la mort !"*',
        enemyStats: {
          skeleton_warlord: { hp: 420, maxHp: 420, atk: 22, def: 9, restHeal: 25 },
          skeleton_king:    { hp: 600, maxHp: 600, atk: 40, def: 1,  restHeal: 35, crit: 12 },
        },
      },
      {
        room: 3,
        enemies: ['skeleton_warlord', 'necromancer', 'skeleton_warlord', 'skeleton_warlord'],
        description: 'Un nécromancien en robe noire psalmodie au centre d\'un cercle runique, ses mains levées vers un roi squelette vaincu. *"Encore des intrus... Montrez-leur la puissance de la mort !"*',
        enemyStats: {
          necromancer:      { hp: 280, maxHp: 280, atk: 24, def: 5,  restHeal: 20 },
          skeleton_warlord: { hp: 420, maxHp: 420, atk: 22, def: 9,  restHeal: 25 },
        },
      },
    ],
  },

};

module.exports = { PRIMES };
