'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');

const GITHUB_URL = 'https://github.com/RustyRory/WorldBoss/';

const WIKI_OPTIONS = [
  { label: 'Gameplay',     value: 'gameplay',     emoji: '🎮' },
  { label: 'Combat',       value: 'combat',       emoji: '⚔️' },
  { label: 'Donjons',      value: 'donjons',      emoji: '🏰' },
  { label: 'Items',        value: 'items',        emoji: '🎒' },
  { label: 'Skills',       value: 'skills',       emoji: '🔥' },
  { label: 'Marché',       value: 'marche',       emoji: '🏪' },
];

function buildSection(section) {
  switch (section) {
    case 'gameplay':
      return {
        title: '🎮 Gameplay',
        description: [
          '**WorldBoss** est un RPG tour par tour jouable directement sur Discord.',
          '',
          '**Démarrer**',
          '• `/start` — Crée ton personnage sur ce serveur',
          '• `/profile` — Affiche tes stats et ton équipement',
          '• `/inventory` — Gère ton inventaire',
          '• `/dungeon` — Lance un donjon solo',
          '',
          '**Progression**',
          '• Gagne de l\'XP en terminant des combats',
          '• Monte de niveau pour débloquer du contenu',
          '• Équipe des items pour améliorer tes stats',
          '• Lvl 1 → Donjons 1 · Lvl 2 → Donjon 2 · Lvl 3 → Donjon 3 + Marché',
          '',
          '**Stats de base**',
          '• ❤️ **HP** — Points de vie *(120 + 20/niveau)*',
          '• ⚔️ **ATK** — Dégâts infligés *(12 + 2/niveau)*',
          '• 🛡️ **DEF** — Réduit les dégâts reçus *(6 + 1/niveau)*',
          '• 💨 **SPD** — Détermine qui agit en premier *(10 + 1 tous les 5 niveaux)*',
          '• 🎯 **CRIT** — Chance de coup critique (×1.5 dégâts par défaut)',
          '',
          '**Régénération HP**',
          '• +2 HP par minute hors combat (automatique)',
          '',
          '**Points d\'action (PA)**',
          '• Maximum : **10 PA** · Recharge : **+1 PA toutes les 2h**',
          '• Coûtent 1 PA : vendre un item',
        ].join('\n'),
      };

    case 'combat':
      return {
        title: '⚔️ Combat',
        description: [
          '**Formule de dégâts**',
          '```',
          'Dégâts = ATK × mult × (100 / (100 + DEF))',
          '```',
          'La DEF réduit les dégâts de façon asymptotique (jamais 0).',
          '',
          '**Initiative**',
          '• Calculée à partir du SPD + léger RNG (±10%)',
          '• Le joueur le plus rapide agit en premier',
          '• Un ennemi **étourdi** passe son tour (initiative = 0)',
          '',
          '**Actions disponibles**',
          '• ⚔️ **Attaquer** — Dégâts ×1.0, déclenche tes passifs',
          '• 🔥 **Skill** — Multiplicateur plus élevé + effet spécial (cooldown)',
          '• 🎒 **Consommable** — Sélectionne un item dans ton sac',
          '• 🏃 **Fuir** — 40–70% de réussite selon ton SPD',
          '',
          '**Effets de statut**',
          '• 🔥 **Brûlure / Poison / Saignement** — X dégâts/tour pendant N tours',
          '• 💫 **Stun** — L\'ennemi passe son prochain tour',
          '• ⚡ **Buff** — Bonus de stat temporaire (se décrémente chaque tour)',
          '',
          '**IA ennemie**',
          '• 1/3 Attaque · 1/3 Ability spéciale · 1/3 Repos (+15% HP max)',
          '',
          '**Alliés NPC**',
          '• Agissent après toi et les ennemis',
          '• 2/3 Attaque sur ennemi aléatoire · 1/3 Repos',
        ].join('\n'),
      };

    case 'donjons':
      return {
        title: '🏰 Donjons',
        description: [
          '**Accès** via `/dungeon` dans `wb-donjon`.',
          '',
          '**Donjon 1 — Les Catacombes** *(Lvl 1)*',
          '• Salle 1 : Squelette',
          '• Salle 2 : Archer Squelette',
          '• Salle 3 : Squelette + Archer Squelette',
          '',
          '**Donjon 2 — Les Catacombes Pt.2** *(Lvl 2)*',
          '• Salle 1 : Squelette + Archer',
          '• Salle 2 : Squelette Mage',
          '• Salle 3 : Squelette + Squelette Mage',
          '',
          '**Donjon 3 — Les Catacombes Pt.3** *(Lvl 3)*',
          '• Salle 1 : Squelette + Squelette Mage',
          '• Salle 2 : Squelette + Archer Squelette',
          '• Salle 3 : Squelette + Mage + Archer + Chevalier + **Aldric** 🧑‍💼',
          '• 🏪 Complète ce donjon pour débloquer le **marché** !',
          '',
          '**Entre les salles**',
          '• +15% HP max récupérés automatiquement (min 5 HP)',
          '• Level up pendant une salle → HP restaurés à 100%',
          '',
          '**Loot**',
          '• Chaque ennemi contribue un candidat à la pool',
          '• Un seul item tiré au sort à la fin du donjon',
          '• Plus d\'ennemis = pool plus diversifiée',
          '',
          '**Mort / Fuite**',
          '• HP remis à 1, progression perdue',
        ].join('\n'),
      };

    case 'items':
      return {
        title: '🎒 Items',
        description: [
          '**Slots d\'équipement** (6 au total)',
          '• ⚔️ **Arme** — ATK · skill actif · passif offensif',
          '• 🧥 **Armure** — HP · DEF · passif défensif',
          '• 🪖 **Casque** — DEF · ATK · CRIT',
          '• 👢 **Bottes** — SPD · DEF',
          '• 💍 **Accessoire ×2** — HP · CRIT · skill ou passif',
          '',
          '**Raretés**',
          '• ⚪ **Commun** — Stats simples',
          '• 🔵 **Rare** — Stats + passif ou skill de base',
          '• 🟣 **Épique** — Stats solides + skill offensif',
          '• 🟠 **Légendaire** — Stats hautes + skill + passif unique',
          '',
          '**Skills & Passifs via équipement**',
          '• Un item peut donner un **skill actif** (cooldown en tours)',
          '• Un item peut donner un **passif** (déclenché sur chaque attaque)',
          '• Tu peux cumuler skills et passifs de plusieurs items équipés',
          '',
          '**Consommables** *(utilisables en combat via le menu)*',
          '• 🧪 Potion de soin — +30 HP',
          '• 💣 Bombe — 25 dégâts AoE',
          '• ❄️ Bombe fumigène — Stun 1 tour',
          '• ☠️ Antidote — Supprime tous tes DoTs',
          '• 📜 Parchemin de feu — 40 dégâts feu',
          '• ⚡ Élixir berserk — ATK +15 pendant 3 tours',
          '• 🛡️ Élixir de fer — DEF +10 pendant 3 tours',
          '',
          '**Commandes**',
          '• `/inventory` — Voir, équiper, utiliser, vendre',
        ].join('\n'),
      };

    case 'skills':
      return {
        title: '🔥 Skills & Passifs',
        description: [
          '**Skills offensifs** *(via arme ou accessoire)*',
          '• 🔥 **Firebolt** — ×1.8 · CD 2 tours',
          '• 🦴 **Bone Bolt** — ×1.5 + DoT os · CD 3 tours',
          '• 🌑 **Shadow Burst** — ×2.2 · CD 3 tours',
          '• 🧊 **Ice Lance** — ×1.6 + Stun · CD 3 tours',
          '• ⚡ **Thunder Bolt** — ×1.7 · CD 3 tours',
          '• 🩸 **Soul Rend** — ×1.5 + Saignement · CD 3 tours',
          '• 💥 **Power Slash** — ×2.0 · CD 3 tours',
          '• 👑 **Royal Smite** — ×2.2 · CD 3 tours',
          '• 😈 **Hellstrike** — ×2.5 + DoT feu · CD 4 tours',
          '• 🌋 **Inferno Blast** — ×2.0 · CD 4 tours',
          '• 💀 **Soul Drain** — ×1.8 + Soin 30% dégâts · CD 3 tours',
          '• 🌪️ **Sand Storm** — ×1.4 + DEF ennemi −5 · CD 3 tours',
          '',
          '**Skills défensifs / support**',
          '• 💚 **Soin** — +20 HP · 1 fois/combat',
          '• ✨ **Divine Heal** — +50 HP · 1 fois/combat',
          '• 🌬️ **Second Wind** — +25% HP max · CD 5 tours',
          '• 🛡️ **Iron Skin** — DEF +15 pour 4 tours · CD 4 tours',
          '• 🔰 **Barrier** — DEF +30 pour 3 tours · CD 5 tours',
          '• 📣 **Battle Cry** — ATK +10 pour 3 tours · CD 4 tours',
          '• 💨 **Quicken** — SPD +8 pour 3 tours · CD 4 tours',
          '• ☀️ **Resurrection** — Soin 30% HP · 1 fois/combat',
          '',
          '**Passifs** *(déclenchés sur chaque attaque basique)*',
          '• 🔥 **Brûlure** — 2 dégâts/tour × 2 tours',
          '• ☠️ **Poison** — 1 dégât/tour × 3 tours',
          '• 🩸 **Saignement** — 3 dégâts/tour × 3 tours',
          '• 💀 **Coup maudit** — DEF ennemi −2',
          '• 💧 **Régénération** — +3 HP',
          '• 🧛 **Vol de vie** — +5 HP',
          '• ❄️ **Bouclier de givre** — DEF +3 pour 2 tours',
        ].join('\n'),
      };

    case 'marche':
      return {
        title: '🏪 Marché',
        description: [
          '**Condition d\'accès**',
          '• Être niveau **3** minimum',
          '• Avoir terminé **Les Catacombes Pt.3** (Donjon 3)',
          '',
          '**Vente au marchant**',
          '• Via `/inventory` → menu "Vendre"',
          '• Prix : **10%** de la valeur de l\'item',
          '• Coûte **1 PA**',
          '• Un item équipé peut être vendu si tu en as un exemplaire en double',
          '',
          '**Enchères**',
          '• Met un item en vente avec un prix de départ et un prix d\'achat direct',
          '• Durées : 1h · 6h · 24h',
          '• Les autres joueurs du serveur peuvent enchérir',
          '• Si personne n\'enchérit → item retourné au vendeur',
          '',
          '**Points d\'action (PA)**',
          '• Maximum **10 PA** · Recharge **+1 PA toutes les 2h**',
          '• Chaque vente coûte 1 PA',
        ].join('\n'),
      };

    default:
      return { title: 'Wiki', description: 'Section inconnue.' };
  }
}

async function buildWikiEmbed(guild, section = 'gameplay') {
  const { title, description } = buildSection(section);

  const embed = new EmbedBuilder()
    .setTitle(`📖 Wiki — ${title}`)
    .setDescription(description)
    .setColor(0x2ecc71)
    .setFooter({ text: 'Utilisez le menu pour naviguer entre les sections' })
    .setTimestamp();

  const select = new StringSelectMenuBuilder()
    .setCustomId('wiki_section')
    .setPlaceholder('Choisir une section…')
    .addOptions(WIKI_OPTIONS.map((o) => ({ ...o, default: o.value === section })));

  const githubButton = new ButtonBuilder()
    .setLabel('Code source')
    .setEmoji('💻')
    .setURL(GITHUB_URL)
    .setStyle(ButtonStyle.Link);

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(select),
      new ActionRowBuilder().addComponents(githubButton),
    ],
    flags: MessageFlags.Ephemeral,
  };
}

module.exports = { buildWikiEmbed };
