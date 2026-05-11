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
      message: '**Nécromancien :** *"Ma mort engendra un chaos indescriptible !"*\n\n**Les primes sont maintenant débloquées !**',
    },
  },
  6: {
    id: 6,
    name: 'La Route des Bandits',
    lore: 'Votre réputation a traversé les murs des catacombes. Le **Roi du Château** vous fait mander à sa cour — c\'est la première fois qu\'il vous reçoit en audience.\n\n*"On m\'a rapporté vos exploits contre le nécromancien. Ce genre de courage est rare. J\'ai besoin de vous : des bandits ont pris le contrôle des grandes routes du royaume pendant que tout le monde avait les yeux tournés vers les catacombes. Ils pillent les convois, rançonnent les voyageurs... et se sont retranchés dans mon propre château. Ce nécromancien mérite qu\'on y regarde de plus près — mais d\'abord, libérez mes routes."*\n\nVous voilà au service du Roi.',
    levelRequired: 6,
    rooms: [
      {
        room: 1,
        enemies: ['bandit_scout'],
        description: 'Un carrefour isolé au milieu des bois. Un éclaireur bandit surgit des buissons, couteau à la main, le regard méfiant.',
      },
      {
        room: 2,
        enemies: ['bandit_scout', 'bandit_thief'],
        description: 'Une clairière jonchée de débris de chariots pillés. Un éclaireur vous coupe la route tandis qu\'un voleur bondit d\'un tronc d\'arbre renversé.',
      },
      {
        room: 3,
        enemies: ['bandit_thief', 'bandit_desperado'],
        description: 'L\'entrée du camp. Un voleur et un bandit désespéré montent la garde. Ce dernier grogne en vous apercevant : *"On ne passe pas !"*',
      },
    ],
  },
  7: {
    id: 7,
    name: 'Le Camp des Pillards',
    lore: 'Au cœur de la forêt, les bandits ont établi un camp fortifié d\'où ils organisent leurs raids. Démanteler leur repaire est la priorité...',
    levelRequired: 7,
    rooms: [
      {
        room: 1,
        enemies: ['bandit_desperado', 'bandit_scout'],
        description: 'Les abords du camp. Des tentes délabrées, des feux de camp et une odeur de viande brûlée. Un désespéré et son guetteur vous repèrent aussitôt.',
      },
      {
        room: 2,
        enemies: ['bandit_brute', 'bandit_thief'],
        description: 'Le cœur du camp. Une brute massive affûte sa hache près du feu de camp. Un voleur tourne discrètement autour de vous, guettant l\'occasion de frapper.',
      },
      {
        room: 3,
        enemies: ['bandit_brute', 'bandit_desperado'],
        description: 'L\'entrepôt de butin. Des caisses entassées, des sacs de pièces volées. Une brute et un désespéré défendent furieusement leur trésor.',
      },
    ],
  },
  8: {
    id: 8,
    name: 'Les Remparts',
    lore: 'Les bandits se sont retranchés dans un vieux château abandonné. Ses remparts croulants abritent désormais leurs troupes les plus coriaces...',
    levelRequired: 8,
    rooms: [
      {
        room: 1,
        enemies: ['bandit_brute', 'bandit_thief'],
        description: 'Le pied des remparts. Une brute monte la garde près du pont-levis, secondée par un voleur tapi dans l\'ombre d\'une meurtrière.',
      },
      {
        room: 2,
        enemies: ['bandit_leader', 'bandit_scout'],
        description: 'Le chemin de ronde. Un chef bandit surveille la cour d\'en haut, flanqué d\'un éclaireur posté sur une tour. *"Intrus ! Éliminez-le !"*',
      },
      {
        room: 3,
        enemies: ['bandit_brute', 'bandit_leader'],
        description: 'La salle des gardes. Une brute barre l\'escalier vers les tours, tandis qu\'un chef commande depuis le fond de la pièce. Aucun d\'eux ne compte reculer.',
      },
    ],
  },
  9: {
    id: 9,
    name: 'Les Coursives du Château',
    lore: 'Les coursives du château mènent jusqu\'au donjon. Le chef des bandits s\'y est retranché avec ses lieutenants, prêt à défendre son trône de fortune...',
    levelRequired: 9,
    rooms: [
      {
        room: 1,
        enemies: ['bandit_leader', 'bandit_brute'],
        description: 'Une antichambre aux murs noircis par la fumée. Un chef bandit et sa brute personnelle bloquent le couloir principal, croisant les bras en vous regardant arriver.',
      },
      {
        room: 2,
        enemies: ['bandit_leader', 'bandit_desperado', 'bandit_thief'],
        description: 'La grande galerie. Trois silhouettes vous encerclent — un chef, un enragé et un voleur. Le chef siffle entre ses dents : *"Personne ne monte au trône vivant."*',
      },
      {
        room: 3,
        enemies: ['bandit_champion', 'bandit_leader'],
        description: 'L\'antichambre du trône. Le champion des bandits trône sur un fauteuil de fortune, son chef à ses côtés. Il se lève lentement : *"Tu es courageux. Dommage que ça ne suffise pas."*',
      },
    ],
  },
  10: {
    id: 10,
    name: 'La Salle du Trône',
    lore: 'Le cœur du château est aux mains du champion bandit depuis des mois. Quelque part dans les geôles, le vrai roi du château attend d\'être libéré...',
    levelRequired: 10,
    rooms: [
      {
        room: 1,
        enemies: ['bandit_champion', 'bandit_brute'],
        description: 'L\'entrée de la salle du trône. Le champion barricade la porte avec la brute à ses côtés. *"Le roi est à nous maintenant. Faites demi-tour !"*',
      },
      {
        room: 2,
        enemies: ['bandit_champion', 'bandit_leader', 'bandit_thief'],
        description: 'La salle d\'apparat. Le champion et ses deux lieutenants forment un dernier rempart. Derrière eux, une porte mène aux cachots où gémit une silhouette enchaînée.',
      },
      {
        room: 3,
        enemies: ['bandit_champion'],
        description: 'Le trône usurpé. Le champion affronte seul, furieux d\'avoir été trahi par ses propres hommes. Le roi du château, libéré de ses chaînes, se joint à vous dans l\'ultime affrontement.',
        ally: 'castle_king',
      },
    ],
    reward: {
      message: '**Le Roi du Château** pose une main sur votre épaule.\n*"Vous avez rendu justice à mon peuple. Ce château vous sera à jamais reconnaissant."*\n\n**Donjon 10 terminé — l\'arc 2 est vaincu !**',
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
