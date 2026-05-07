'use strict';

const PRIMES = {
  1: {
    id: 1,
    name: 'Les Catacombes — Expédition Élite',
    lore: 'Vous trouvez la source de la corruption : un nécromancien maléfique a pris le contrôle des squelettes. Il doit être arrêté avant que les catacombes ne deviennent un véritable cimetière pour les vivants...',
    levelRequired: 5,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton_warlord', 'skeleton_warlord', 'skeleton_warlord', 'skeleton_warlord'],
        description: 'La salle des champions déchus. Quatre chefs de guerre squelettes se tiennent côte à côte — les lieutenants du nécromancien. Leurs armures brisées portent encore les stigmates de batailles épiques. Un cri de guerre résonne dans la pierre.',
      },
      {
        room: 2,
        enemies: ['skeleton_king', 'necromancer', 'skeleton_warlord', 'skeleton_warlord'],
        description: 'La chambre profanée. Un nécromancien en robe noire psalmodie au centre d\'un cercle runique, ses mains levées vers un roi squelette couronné qui flotte au-dessus du sol. *"Encore des intrus... Montrez-leur la puissance de la mort !"*',
      },
    ],
  },
};

module.exports = { PRIMES };
