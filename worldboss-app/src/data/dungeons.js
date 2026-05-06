'use strict';

const DUNGEONS = {
  1: {
    id: 1,
    name: 'Les Catacombes',
    lore: 'Des squelettes réanimés rôdent dans ces ruines oubliées...',
    levelRequired: 1,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton'],
        description: 'Une salle poussiéreuse éclairée par une torche vacillante. Un squelette se retourne lentement vers vous.',
      },
      {
        room: 2,
        enemies: ['skeleton_archer'],
        description: 'Un couloir étroit. Une flèche siffle dans l\'obscurité avant même que vous ne voyiez la silhouette.',
      },
      {
        room: 3,
        enemies: ['skeleton', 'skeleton_archer'],
        description: 'Une grande salle voûtée. Un squelette avance vers vous pendant que son archer vise depuis l\'ombre.',
      },
    ],
  },
  2: {
    id: 2,
    name: 'Les Catacombes - Part 2',
    lore: 'Les squelettes sont de plus en plus nombreux et agressifs dans les profondeurs des catacombes...',
    levelRequired: 2,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton', 'skeleton_mage'],
        description: 'Vous entrez dans une salle plus grande, les murs sont couverts de crânes. Un squelette vous attaque pendant que son archer tire depuis une galerie en hauteur.',
      },
      {
        room: 2,
        enemies: ['skeleton_mage', 'skeleton_archer'],
        description: 'Un couloir étroit. Une boule de feu traverse l\'obscurité avant même que vous ne voyez la silhouette.',
      },
      {
        room: 3,
        enemies: ['skeleton', 'skeleton_archer'],
        description: 'Une corniche étroite au-dessus d\'un puits sans fond. Deux squelettes avancent vers vous, leurs os grinçant à chaque pas.',
      },
    ],
  },
  3: {
    id: 3,
    name: 'Les Catacombes - Part 3',
    lore: 'Un marchand isolé s\'est réfugié à l\'hôtel, cerné par des squelettes. Il a besoin d\'aide pour s\'en sortir vivant...',
    levelRequired: 3,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton', 'skeleton_mage'],
        description: 'L\'entrée de l\'hôtel. Un squelette décharné avance sur vous tandis qu\'un mage osseux lève les bras, prêt à invoquer.',
      },
      {
        room: 2,
        enemies: ['skeleton', 'skeleton_archer'],
        description: 'Le hall de l\'hôtel. Derrière le comptoir, un squelette se précipite vers vous pendant qu\'un archer vise depuis la mezzanine.',
      },
      {
        room: 3,
        enemies: ['skeleton', 'skeleton_mage', 'skeleton_archer', 'skeleton_knight'],
        description: 'Le bar de l\'hôtel. Quatre silhouettes osseuses encerclent un marchand tremblant dans un coin. *"Au secours !"* crie Aldric en vous apercevant — il se joint au combat !',
        ally: 'merchant_aldric',
      },
    ],
    reward: {
      unlockMarket: true,
      message: '🏪 **Aldric** te serre la main avec gratitude.\n*"Tu m\'as sauvé la mise, ami. Ma boutique te sera désormais ouverte — et je ferai passer le mot au marché."*\n\n**Le marché est maintenant débloqué !**',
    },
  },
  4: {
    id: 4,
    name: 'Les Catacombes - Part 4',
    lore: 'Les squelettes sont de plus en plus nombreux et agressifs dans les profondeurs des catacombes...',
    levelRequired: 4,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton_knight', 'skeleton_archer'],
        description: 'L\'entrée de l\'hôtel. Un squelette décharné avance sur vous tandis qu\'un mage osseux lève les bras, prêt à invoquer.',
      },
      {
        room: 2,
        enemies: ['skeleton_knight', 'skeleton_knight'],
        description: 'Le hall de l\'hôtel. Derrière le comptoir, un squelette se précipite vers vous pendant qu\'un archer vise depuis la mezzanine.',
      },
      {
        room: 3,
        enemies: ['skeleton_warlord', 'skeleton_mage', 'skeleton_archer', 'skeleton_knight'],
        description: 'Le bar de l\'hôtel. Quatre silhouettes osseuses encerclent un marchand tremblant dans un coin. *"Au secours !"* crie Aldric en vous apercevant — il se joint au combat !',
        
      },
    ],
  },
  5: {
    id: 5,
    name: 'Les Catacombes - Part 5',
    lore: 'Les squelettes sont de plus en plus nombreux et agressifs dans les profondeurs des catacombes...',
    levelRequired: 5,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton_knight', 'skeleton_archer'],
        description: 'L\'entrée de l\'hôtel. Un squelette décharné avance sur vous tandis qu\'un mage osseux lève les bras, prêt à invoquer.',
      },
      {
        room: 2,
        enemies: ['skeleton_warlord', 'skeleton_knight'],
        description: 'Le hall de l\'hôtel. Derrière le comptoir, un squelette se précipite vers vous pendant qu\'un archer vise depuis la mezzanine.',
      },
      {
        room: 3,
        enemies: ['skeleton_warlord', 'skeleton_mage', 'skeleton_archer', 'skeleton_king'],
        description: 'Le bar de l\'hôtel. Quatre silhouettes osseuses encerclent un marchand tremblant dans un coin. *"Au secours !"* crie Aldric en vous apercevant — il se joint au combat !',
        
      },
    ],
  },
};

// NPC allies definitions
const ALLIES = {
  merchant_aldric: {
    id: 'merchant_aldric',
    name: 'Aldric le Marchand',
    hp: 45,
    maxHp: 45,
    atk: 8,
    def: 3,
    spd: 5,
    emoji: '🧑‍💼',
  },
};

module.exports = { DUNGEONS, ALLIES };
