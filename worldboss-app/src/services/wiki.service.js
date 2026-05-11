'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');

const { baseStats }                              = require('../utils/stats');
const { SKILLS }                                 = require('../data/skills');
const { PASSIVES }                               = require('../data/passives');
const CONSUMABLES                                = require('../data/items/consumables');
const { DUNGEONS, ALLIES }                       = require('../data/dungeons');
const { ENEMIES }                                = require('../data/enemies');
const { HP_REGEN_PER_MINUTE }                    = require('./player.service');
const { AP_MAX, AP_RECHARGE_MS, AP_COST }        = require('./actionPoints.service');
const { MERCHANT_RATE, MARKET_MIN_LVL, MARKET_UNLOCK_DUNGEON } = require('./market.service');

const GITHUB_URL = 'https://github.com/RustyRory/WorldBoss/';

const WIKI_OPTIONS = [
  { label: 'Gameplay',     value: 'gameplay',     emoji: '🎮' },
  { label: 'Combat',       value: 'combat',       emoji: '⚔️' },
  { label: 'Donjons',      value: 'donjons',      emoji: '🏰' },
  { label: 'Items',        value: 'items',        emoji: '🎒' },
  { label: 'Skills',       value: 'skills',       emoji: '🔥' },
  { label: 'Marché',       value: 'marche',       emoji: '🏪' },
];

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtSkill(skill) {
  const w = skill.wiki;
  if (!w) return null;
  let desc;
  const cd = skill.oncePerCombat ? '1 fois/combat' : (skill.cooldown ? `CD ${skill.cooldown} tours` : '');
  if (w.mult !== undefined) {
    desc = `×${w.mult}${w.extra ? ' + ' + w.extra : ''} · ${cd}`;
  } else if (w.healFlat !== undefined) {
    desc = `+${w.healFlat} HP · ${cd}`;
  } else if (w.healPct !== undefined) {
    desc = `+${Math.round(w.healPct * 100)}% HP max · ${cd}`;
  } else if (w.stat !== undefined) {
    desc = `${w.stat} +${w.val} pour ${w.turns} tours · ${cd}`;
  } else {
    return null;
  }
  return `• ${w.emoji} **${skill.name}** — ${desc}`;
}

function fmtPassive(passive) {
  const w = passive.wiki;
  if (!w) return null;
  let desc;
  if (w.dotVal !== undefined) {
    desc = `${w.dotVal} dégâts/tour × ${w.dotTurns} tours`;
  } else if (w.debuff !== undefined) {
    desc = `${w.debuff} ennemi −${w.debuffVal}`;
  } else if (w.healFlat !== undefined) {
    desc = `+${w.healFlat} HP`;
  } else if (w.stat !== undefined) {
    desc = `${w.stat} +${w.val} pour ${w.turns} tours`;
  } else {
    return null;
  }
  return `• ${w.emoji} **${passive.name}** — ${desc}`;
}

function fmtConsumableEffect(effect) {
  const STAT_LABELS = { atk: 'ATK', def: 'DEF', spd: 'SPD', hp: 'HP', crit: 'CRIT' };
  if (effect.type === 'heal')        return `+${effect.value} HP`;
  if (effect.type === 'damage')      return `${effect.value} dégâts${effect.aoe ? ' AoE' : ''}`;
  if (effect.type === 'stun')        return `Stun ${effect.turns} tour${effect.turns > 1 ? 's' : ''}${effect.aoe ? ' AoE' : ''}`;
  if (effect.type === 'cure_dot')    return 'Supprime tous tes DoTs';
  if (effect.type === 'restore_ap')  return `+${effect.value} PA`;
  if (effect.type === 'reroll_race') return 'Change race & genre';
  if (effect.type === 'dot')         return `${effect.value} dégâts/tour × ${effect.turns} tours`;
  if (effect.type === 'buff') {
    const stat = STAT_LABELS[effect.stat] ?? effect.stat.toUpperCase();
    return `${stat} +${effect.value} pendant ${effect.turns} tour${effect.turns > 1 ? 's' : ''}`;
  }
  return '?';
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildGameplay() {
  // Derive stat formulas dynamically from baseStats
  const bs0 = baseStats(0);
  const bs1 = baseStats(1);
  const bs5 = baseStats(5);
  const hpBase  = bs0.hp;  const hpInc  = bs1.hp  - bs0.hp;
  const atkBase = bs0.atk; const atkInc = bs1.atk - bs0.atk;
  const defBase = bs0.def; const defInc = bs1.def - bs0.def;
  const spdBase = bs0.spd; const spdPer5 = bs5.spd - bs0.spd;

  const rechargeHours = Math.round(AP_RECHARGE_MS / (60 * 60 * 1000));

  // Build dungeon unlock progression line from data
  const dungeonUnlockLine = Object.values(DUNGEONS)
    .filter((d) => d.name)
    .map((d) => {
      const suffix = d.reward?.unlockMarket ? ` + Marché` : d.reward?.unlockPrimes ? ` + Primes` : '';
      return `Lvl ${d.levelRequired} → Donjon ${d.id}${suffix}`;
    })
    .join(' · ');

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
      `• ${dungeonUnlockLine}`,
      '',
      '**Stats de base**',
      `• ❤️ **HP** — Points de vie *(${hpBase} + ${hpInc}/niveau)*`,
      `• ⚔️ **ATK** — Dégâts infligés *(${atkBase} + ${atkInc}/niveau)*`,
      `• 🛡️ **DEF** — Réduit les dégâts reçus *(${defBase} + ${defInc}/niveau)*`,
      `• 💨 **SPD** — Détermine qui agit en premier *(${spdBase} + ${spdPer5} tous les 5 niveaux)*`,
      `• 🎯 **CRIT** — Chance de coup critique (×${bs0.critMult} dégâts par défaut)`,
      '',
      '**Régénération HP**',
      `• +${HP_REGEN_PER_MINUTE} HP par minute hors combat (automatique)`,
      '',
      '**Points d\'action (PA)**',
      `• Maximum : **${AP_MAX} PA** · Recharge : **+1 PA toutes les ${rechargeHours}h**`,
      `• Coûtent ${AP_COST.sell} PA : vendre un item`,
    ].join('\n'),
  };
}

function buildDonjons() {
  const dungeonBlocks = Object.values(DUNGEONS)
    .filter((d) => d.name && d.rooms.some((r) => r.enemies.filter(Boolean).length > 0))
    .map((dungeon) => {
      const lines = [`**Donjon ${dungeon.id} — ${dungeon.name}** *(Lvl ${dungeon.levelRequired})*`];
      for (const room of dungeon.rooms) {
        const enemyNames = room.enemies.filter(Boolean).map((id) => ENEMIES[id]?.name ?? id);
        if (enemyNames.length === 0) continue;
        const allyDef = room.ally ? ALLIES[room.ally] : null;
        const allyStr = allyDef ? ` + **${allyDef.name}** ${allyDef.emoji}` : '';
        lines.push(`• Salle ${room.room} : ${enemyNames.join(' + ')}${allyStr}`);
      }
      if (dungeon.reward?.unlockMarket)  lines.push('• 🏪 Complète ce donjon pour débloquer le **marché** !');
      if (dungeon.reward?.unlockPrimes)  lines.push('• ⚔️ Complète ce donjon pour débloquer les **primes** !');
      return lines.join('\n');
    });

  return {
    title: '🏰 Donjons',
    description: [
      '**Accès** via `/dungeon` dans `wb-donjon`.',
      '',
      dungeonBlocks.join('\n\n'),
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
}

function buildItems() {
  const consumableLines = Object.values(CONSUMABLES)
    .filter((c) => c.showInWiki)
    .map((c) => `• ${c.emoji} **${c.name}** — ${fmtConsumableEffect(c.effect)}`);

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
      ...consumableLines,
      '',
      '**Commandes**',
      '• `/inventory` — Voir, équiper, utiliser, vendre',
    ].join('\n'),
  };
}

function buildSkills() {
  const OFFENSIVE_KEYS  = ['firebolt', 'bone_bolt', 'shadow_burst', 'ice_lance', 'thunder_bolt', 'soul_rend', 'power_slash', 'royal_smite', 'hellstrike', 'inferno_blast', 'soul_drain', 'sand_storm'];
  const DEFENSIVE_KEYS  = ['soin', 'divine_heal', 'second_wind', 'iron_skin', 'barrier', 'battle_cry', 'quicken', 'resurrection'];
  const PASSIVE_OFF_KEYS = ['fire_dot', 'poison_dot', 'bleed', 'cursed_strike'];
  const PASSIVE_DEF_KEYS = ['regeneration', 'life_steal', 'frost_shield'];

  const offLines  = OFFENSIVE_KEYS.map((k)   => fmtSkill(SKILLS[k])).filter(Boolean);
  const defLines  = DEFENSIVE_KEYS.map((k)   => fmtSkill(SKILLS[k])).filter(Boolean);
  const passOffLines = PASSIVE_OFF_KEYS.map((k) => fmtPassive(PASSIVES[k])).filter(Boolean);
  const passDefLines = PASSIVE_DEF_KEYS.map((k) => fmtPassive(PASSIVES[k])).filter(Boolean);

  return {
    title: '🔥 Skills & Passifs',
    description: [
      '**Skills offensifs** *(via arme ou accessoire)*',
      ...offLines,
      '',
      '**Skills défensifs / support**',
      ...defLines,
      '',
      '**Passifs offensifs** *(déclenchés sur chaque attaque basique)*',
      ...passOffLines,
      '',
      '**Passifs défensifs**',
      ...passDefLines,
    ].join('\n'),
  };
}

function buildMarche() {
  const rechargeHours = Math.round(AP_RECHARGE_MS / (60 * 60 * 1000));
  const merchantPct   = Math.round(MERCHANT_RATE * 100);
  const unlockDungeon = DUNGEONS[MARKET_UNLOCK_DUNGEON];

  return {
    title: '🏪 Marché',
    description: [
      '**Condition d\'accès**',
      `• Être niveau **${MARKET_MIN_LVL}** minimum`,
      `• Avoir terminé **${unlockDungeon?.name ?? `Donjon ${MARKET_UNLOCK_DUNGEON}`}** (Donjon ${MARKET_UNLOCK_DUNGEON})`,
      '',
      '**Vente au marchant**',
      '• Via `/inventory` → menu "Vendre"',
      `• Prix : **${merchantPct}%** de la valeur de l\'item`,
      `• Coûte **${AP_COST.sell} PA**`,
      '• Un item équipé peut être vendu si tu en as un exemplaire en double',
      '',
      '**Enchères**',
      '• Met un item en vente avec un prix de départ et un prix d\'achat direct',
      '• Durées : 1h · 6h · 24h',
      '• Les autres joueurs du serveur peuvent enchérir',
      '• Si personne n\'enchérit → item retourné au vendeur',
      '',
      '**Points d\'action (PA)**',
      `• Maximum **${AP_MAX} PA** · Recharge **+1 PA toutes les ${rechargeHours}h**`,
      `• Chaque vente coûte ${AP_COST.sell} PA`,
    ].join('\n'),
  };
}

function buildSection(section) {
  switch (section) {
    case 'gameplay': return buildGameplay();
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
    case 'donjons': return buildDonjons();
    case 'items':   return buildItems();
    case 'skills':  return buildSkills();
    case 'marche':  return buildMarche();
    default:        return { title: 'Wiki', description: 'Section inconnue.' };
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
