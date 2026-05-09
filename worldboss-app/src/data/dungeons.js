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
      message: '**Aldric** te serre la main avec gratitude.\n*"Tu m\'as sauvé la mise, ami. Ma boutique te sera désormais ouverte — et je ferai passer le mot au marché."*\n\n**Le marché est maintenant débloqué !**',
    },
  },
  4: {
    id: 4,
    name: 'Les Catacombes - Part 4',
    lore: 'Les profondeurs des catacombes abritent des guerriers squelettes d\'une autre époque, tombés au combat et relevés par une force obscure...',
    levelRequired: 4,
    rooms: [
      {
        room: 1,
        enemies: ['skeleton_knight', 'skeleton_archer'],
        description: 'Une antichambre aux murs gravés d\'armoiries oubliées. Un chevalier squelette en armure rouillée s\'avance lentement, pendant qu\'un archer embusqué derrière une colonne brisée vous prend en ligne de mire.',
      },
      {
        room: 2,
        enemies: ['skeleton_knight', 'skeleton_knight'],
        description: 'Une salle de garde désaffectée. Deux chevaliers squelettes se font face de part et d\'autre d\'un trône vide — comme s\'ils montaient encore la garde pour un roi mort depuis longtemps. Ils se retournent vers vous à l\'unisson.',
      },
      {
        room: 3,
        enemies: ['skeleton_warlord', 'skeleton_mage', 'skeleton_archer'],
        description: 'La salle du conseil. Un chef de guerre osseux trône au centre, flanqué d\'un mage dont les orbites luisent d\'un bleu sinistre. Un chevalier barre la sortie pendant qu\'un archer surveille les hauteurs. Ils n\'ont pas l\'intention de vous laisser passer.',
      },
    ],
  },
  5: {
    id: 5,
    name: 'Les Catacombes - Part 5',
    lore: 'Vous trouvez la source de la corruption : un nécromancien maléfique qui a pris le contrôle des squelettes. Il doit être arrêté avant que les catacombes ne deviennent un véritable cimetière pour les vivants...',
    levelRequired: 5,
    rooms: [
            {
        room: 1,
        enemies: ['skeleton_warlord', 'skeleton_warlord'],
        description: 'La salle des champions déchus. Deux chefs de guerre squelettes se tiennent côte à côte — les lieutenants du nécromancien. Leurs armures brisées portent encore les stigmates de batailles épiques. Un cri de guerre résonne dans la pierre.',
      },
      {
        room: 2,
        enemies: ['skeleton_king', 'skeleton_warlord'],
        description: 'La chambre profanée. Un nécromancien en robe noire psalmodie au centre d\'un cercle runique, ses mains levées vers un roi squelette couronné qui flotte au-dessus du sol. *"Encore un intrus... Montre-lui la puissance de la mort, mon roi !"*',
      },
      {
        room: 3,
        enemies: ['necromancer'],
        description: 'Vous avez vaincu le roi squelette, mais le nécromancien est furieux. Il se jette sur vous, entouré de ses lieutenants restants. *"Vous ne pouvez pas arrêter la mort ! Je suis son maître !"*',
      },
    ],
    reward: {
      unlockPrimes: true,
      
      message: '**Necromancien :** "Ma mort engendra un chaos indescriptible !"*\n\n**Les primes sont maintenant débloquées !**',
    },
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
    restHeal: 5,
    emoji: '🧑‍💼',
  },
  castle_king: {
    id: 'castle_king',
    name: 'Roi du château',
    hp: 100,
    maxHp: 100,
    atk: 25,
    def: 15,
    spd: 8,
    crit: 5,
    restHeal: 12,
    ability: 'rally',
    emoji: '👑',
  },
};

module.exports = { DUNGEONS, ALLIES };
