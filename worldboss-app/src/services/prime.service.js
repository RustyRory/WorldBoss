'use strict';

const { prisma }                = require('../db/prisma');
const { getPrimeCombatState, setPrimeCombatState, deletePrimeCombatState } = require('../cache/redis');
const { computeStats }          = require('../utils/stats');
const { computeRegenedHp }      = require('./player.service');
const { getOrCreateLoadout }    = require('./inventory.service');
const { addXp, addGold }        = require('./player.service');
const { getAP, consumeAP }      = require('./actionPoints.service');
const { applyLoot }             = require('../engines/lootEngine');
const { resolvePrimeRound }     = require('../engines/primeCombatEngine');
const { PRIMES }                = require('../data/primes');
const { ENEMIES }               = require('../data/enemies');
const { ITEMS }                 = require('../data/items');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const { errorEmbed, hpBarAnsi } = require('../utils/embed');
const { animateCombatLogs, sleep } = require('../utils/animate');

const PRIME_MIN_PLAYERS = 4;

async function checkPrimeAccess(characterId, primeId) {
  const primeDef = PRIMES[primeId];
  if (!primeDef) return { ok: false, message: 'Prime introuvable.' };

  const character = await prisma.character.findUnique({ where: { id: characterId }, select: { level: true } });
  const level = character?.level ?? 0;

  if (level < primeDef.levelRequired) {
    return { ok: false, message: `Cette prime requiert le **niveau ${primeDef.levelRequired}**.` };
  }

  const { unlockedBy } = primeDef;
  if (unlockedBy?.type === 'dungeon') {
    const done = await prisma.dungeonRun.findFirst({ where: { characterId, chapter: unlockedBy.id, status: 'completed' } });
    if (!done) {
      return { ok: false, message: `Prime verrouillée. Complétez le **donjon ${unlockedBy.id}** pour y accéder.` };
    }
  } else if (unlockedBy?.type === 'prime') {
    const done = await prisma.primeRun.findFirst({
      where: { status: 'completed', participants: { some: { characterId } }, primeId: unlockedBy.id },
    });
    if (!done) {
      const prevPrime = PRIMES[unlockedBy.id];
      return { ok: false, message: `Prime verrouillée. Complétez **${prevPrime?.name ?? `Prime ${unlockedBy.id}`}** pour y accéder.` };
    }
  }

  return { ok: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hpBar(current, max, size = 8) {
  const clamped = Math.max(0, Math.min(current, max));
  const filled  = Math.round((clamped / max) * size);
  return `${'▰'.repeat(filled)}${'▱'.repeat(size - filled)} ${clamped}/${max}`;
}

function getCharName(character) {
  return character.name || character.user?.username || 'Aventurier';
}

// ── Embed builders ───────────────────────────────────────────────────────────

function buildLobbyEmbed(primeRun, participants, primeDef) {
  const slots = Array.from({ length: PRIME_MIN_PLAYERS }, (_, i) => {
    const p = participants[i];
    return p
      ? `${i + 1}. ✅ **${getCharName(p.character)}** — Niv. ${p.character.level}`
      : `${i + 1}. ⬜ *[vide]*`;
  });

  return new EmbedBuilder()
    .setTitle(`🏆 Prime — ${primeDef.name}`)
    .setDescription(
      `*${primeDef.lore}*\n\n` +
      `**Niveau requis :** ${primeDef.levelRequired}\n` +
      `**Joueurs :** ${participants.length}/${PRIME_MIN_PLAYERS}\n\n` +
      slots.join('\n') +
      '\n\n> Coût : **1 PA** par joueur',
    )
    .setColor(0xe74c3c)
    .setFooter({ text: 'Rejoins la prime pour participer !' });
}

function buildLobbyComponents(primeRun, participants) {
  const full     = participants.length >= PRIME_MIN_PLAYERS;
  const canStart = full;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prime_join:${primeRun.id}`)
        .setLabel('Rejoindre')
        .setStyle(ButtonStyle.Success)
        .setDisabled(full),
      new ButtonBuilder()
        .setCustomId(`prime_leave:${primeRun.id}`)
        .setLabel('Quitter')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`prime_start:${primeRun.id}`)
        .setLabel(`Commencer (${participants.length}/${PRIME_MIN_PLAYERS})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!canStart),
    ),
  ];
}

function buildCombatEmbed(state) {
  const alive  = state.players.filter((p) => p.hp > 0);
  const acted  = Object.keys(state.pendingActions).length;
  const deltas = state.hpDeltas ?? {};

  const ansi = [];

  // Players
  ansi.push('\x1b[1m⚔️ Groupe\x1b[0m');
  state.players.forEach((p, pi) => {
    const status   = state.pendingActions[p.characterId] ? '✅' : (p.hp > 0 ? '⏳' : '💀');
    const dotsLine = (p.dots ?? []).map((d) => `☠️${d.label ?? 'DoT'}(${d.turns}t)`).join(' ');
    const bufLine  = (p.buffs ?? []).map((b) => `⚡${b.stat}+${b.value}(${b.turns}t)`).join(' ');
    const suffix   = [dotsLine, bufLine].filter(Boolean).join(' ');
    ansi.push(`${status} \x1b[1m${p.name}\x1b[0m`);
    ansi.push(hpBarAnsi(p.hp, p.maxHp, deltas.players?.[pi] ?? 0, 8));
    if (suffix) ansi.push(suffix);
  });

  ansi.push('');

  // Enemies
  ansi.push('\x1b[1m💀 Ennemis\x1b[0m');
  state.enemies.forEach((e, idx) => {
    if (e.hp <= 0) {
      ansi.push(`\x1b[2m[${idx + 1}] ${e.name}${e.elite ? ' ⭐' : ''} — Vaincu\x1b[0m`);
    } else {
      const statusParts = [];
      if (e.stunned) statusParts.push('💫 Étourdi');
      (e.dots ?? []).forEach((d) => statusParts.push(`🔥 DoT(${d.turns}t)`));
      ansi.push(`\x1b[1m[${idx + 1}] ${e.name}${e.elite ? ' ⭐' : ''}\x1b[0m`);
      ansi.push(hpBarAnsi(e.hp, e.maxHp, deltas.enemies?.[idx] ?? 0, 8));
      if (statusParts.length) ansi.push(statusParts.join(' '));
    }
  });

  // Log
  const activeIdx = state.activeLogIndex ?? -1;
  const allLogs   = state.log ?? [];
  if (allLogs.length > 0) {
    ansi.push('');
    ansi.push('\x1b[1m📜 Journal\x1b[0m');
    const lastLogs = allLogs.slice(-6);
    const offset   = allLogs.length - lastLogs.length;
    for (let li = 0; li < lastLogs.length; li++) {
      const globalIdx = offset + li;
      if (globalIdx === activeIdx) {
        ansi.push(`\x1b[1;33m▶ ${lastLogs[li]}\x1b[0m`);
      } else {
        ansi.push(`\x1b[2m${lastLogs[li]}\x1b[0m`);
      }
    }
  }

  const lines = ['```ansi', ...ansi, '```'];

  return new EmbedBuilder()
    .setTitle(`🏆 Prime — ${state.primeName}`)
    .setDescription(lines.join('\n'))
    .setColor(0xe74c3c)
    .setFooter({ text: `Salle ${state.currentRoomIndex + 1}/${state.totalRooms} · Tour ${state.roundNumber} · ${acted}/${alive.length} joueurs ont agi` });
}

function buildCombatComponents(state) {
  const aliveEnemies = state.enemies.filter((e) => e.hp > 0);
  if (aliveEnemies.length === 0) return [];

  const attackButtons = aliveEnemies.map((e) => {
    const idx = state.enemies.indexOf(e);
    return new ButtonBuilder()
      .setCustomId(`prime_attack:${state.primeRunId}:${idx}`)
      .setLabel(`⚔️ ${e.name}${e.elite ? ' ⭐' : ''}`)
      .setStyle(ButtonStyle.Danger);
  });

  const rows = [new ActionRowBuilder().addComponents(attackButtons.slice(0, 5))];

  // Consumable button (second row) — only if any alive player has consumables
  const hasConsumables = state.players.some(
    (p) => p.hp > 0 && (p.consumables ?? []).some((c) => c.quantity > 0 || c.quantity === -1),
  );
  if (hasConsumables) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`prime_item_open:${state.primeRunId}`)
          .setLabel('💊 Consommable')
          .setStyle(ButtonStyle.Secondary),
      ),
    );
  }

  return rows;
}

function buildRoomClearComponents(state) {
  const isLastRoom = state.currentRoomIndex + 1 >= state.totalRooms;

  if (isLastRoom) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`prime_claim_loot:${state.primeRunId}`)
          .setLabel('🎁 Réclamer le butin')
          .setStyle(ButtonStyle.Success),
      ),
    ];
  }

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prime_rest_item:${state.primeRunId}`)
        .setLabel('💊 Consommable')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`prime_next_room:${state.primeRunId}`)
        .setLabel('➡️ Salle suivante')
        .setStyle(ButtonStyle.Primary),
    ),
  ];
}

// ── Enemy loader with prime stat overrides ───────────────────────────────────

function buildRoomEnemies(room) {
  return room.enemies.map((eId) => {
    const e   = ENEMIES[eId];
    if (!e) throw new Error(`Unknown enemy: ${eId}`);
    const ov  = room.enemyStats?.[eId] ?? {};
    const hp  = ov.hp ?? e.hp;
    return {
      id:         e.id,
      name:       e.name,
      hp,
      maxHp:      ov.maxHp ?? hp,
      atk:        ov.atk        ?? e.atk,
      def:        ov.def        ?? e.def,
      spd:        ov.spd        ?? e.spd,
      crit:       ov.crit       ?? e.crit       ?? 0,
      restHeal:   ov.restHeal   ?? e.restHeal   ?? 5,
      ability:    ov.ability    ?? e.ability    ?? null,
      elite:      e.elite       ?? false,
      eliteDrops: e.eliteDrops  ?? [],
      loot:       e.loot        ?? [],
      stunned:    false,
      dots:       [],
    };
  });
}

// ── Load participants with character data ─────────────────────────────────────

async function loadParticipants(primeRunId) {
  return prisma.primeParticipant.findMany({
    where: { primeRunId },
    include: { character: { include: { user: { select: { username: true } } } } },
  });
}

// ── Public actions ────────────────────────────────────────────────────────────

async function createPrime(interaction, primeId) {
  const primeDef = PRIMES[primeId];
  if (!primeDef) {
    return interaction.reply({ embeds: [errorEmbed('Prime introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const { user, guildId, channelId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    include: { user: { select: { username: true } } },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }
  const access = await checkPrimeAccess(character.id, primeId);
  if (!access.ok) {
    return interaction.reply({ embeds: [errorEmbed(access.message)], flags: MessageFlags.Ephemeral });
  }

  const existing = await prisma.primeParticipant.findFirst({
    where: { characterId: character.id, primeRun: { guildId, status: { in: ['recruiting', 'active'] } } },
  });
  if (existing) {
    return interaction.reply({
      embeds: [errorEmbed('Tu es déjà dans une prime en cours sur ce serveur !')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const primeRun = await prisma.primeRun.create({
    data: {
      guildId,
      primeId,
      leaderId: character.id,
      channelId,
      status: 'recruiting',
      participants: { create: { characterId: character.id, isLeader: true } },
    },
  });

  const participants = await loadParticipants(primeRun.id);
  const embed        = buildLobbyEmbed(primeRun, participants, primeDef);
  const components   = buildLobbyComponents(primeRun, participants);

  const message = await interaction.reply({ embeds: [embed], components, fetchReply: true });

  await prisma.primeRun.update({ where: { id: primeRun.id }, data: { messageId: message.id } });
}

async function joinPrime(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    include: { user: { select: { username: true } } },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const primeRun = await prisma.primeRun.findUnique({ where: { id: primeRunId } });
  if (!primeRun || primeRun.status !== 'recruiting') {
    return interaction.reply({ embeds: [errorEmbed('Cette prime n\'est plus disponible.')], flags: MessageFlags.Ephemeral });
  }

  const primeDef     = PRIMES[primeRun.primeId];
  const participants = await loadParticipants(primeRunId);

  if (participants.length >= PRIME_MIN_PLAYERS) {
    return interaction.reply({ embeds: [errorEmbed('La prime est déjà complète.')], flags: MessageFlags.Ephemeral });
  }
  if (participants.some((p) => p.characterId === character.id)) {
    return interaction.reply({ embeds: [errorEmbed('Tu es déjà dans cette prime.')], flags: MessageFlags.Ephemeral });
  }
  const access = await checkPrimeAccess(character.id, primeRun.primeId);
  if (!access.ok) {
    return interaction.reply({ embeds: [errorEmbed(access.message)], flags: MessageFlags.Ephemeral });
  }

  const existing = await prisma.primeParticipant.findFirst({
    where: { characterId: character.id, primeRun: { guildId, status: { in: ['recruiting', 'active'] } } },
  });
  if (existing) {
    return interaction.reply({
      embeds: [errorEmbed('Tu es déjà dans une prime en cours sur ce serveur !')],
      flags: MessageFlags.Ephemeral,
    });
  }

  await prisma.primeParticipant.create({ data: { primeRunId, characterId: character.id } });

  const updated    = await loadParticipants(primeRunId);
  const embed      = buildLobbyEmbed(primeRun, updated, primeDef);
  const components = buildLobbyComponents(primeRun, updated);
  return interaction.update({ embeds: [embed], components });
}

async function leavePrime(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const primeRun = await prisma.primeRun.findUnique({ where: { id: primeRunId } });
  if (!primeRun || primeRun.status !== 'recruiting') {
    return interaction.reply({
      embeds: [errorEmbed('Impossible de quitter une prime déjà commencée.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  if (primeRun.leaderId === character.id) {
    await prisma.primeRun.update({ where: { id: primeRunId }, data: { status: 'failed' } });
    return interaction.update({
      embeds: [new EmbedBuilder().setTitle('Prime annulée').setDescription('Le chef a quitté la prime.').setColor(0x95a5a6)],
      components: [],
    });
  }

  await prisma.primeParticipant.deleteMany({ where: { primeRunId, characterId: character.id } });

  const updated    = await loadParticipants(primeRunId);
  const primeDef   = PRIMES[primeRun.primeId];
  const embed      = buildLobbyEmbed(primeRun, updated, primeDef);
  const components = buildLobbyComponents(primeRun, updated);
  return interaction.update({ embeds: [embed], components });
}

async function startPrime(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const primeRun = await prisma.primeRun.findUnique({ where: { id: primeRunId } });
  if (!primeRun || primeRun.status !== 'recruiting') {
    return interaction.reply({ embeds: [errorEmbed('Cette prime n\'est plus en attente.')], flags: MessageFlags.Ephemeral });
  }

  const participants = await prisma.primeParticipant.findMany({
    where: { primeRunId },
    include: {
      character: { include: { loadout: true, user: { select: { username: true } } } },
    },
  });

  if (participants.length < PRIME_MIN_PLAYERS) {
    return interaction.reply({
      embeds: [errorEmbed(`Il faut **${PRIME_MIN_PLAYERS}** joueurs pour commencer (${participants.length}/${PRIME_MIN_PLAYERS}).`)],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Check AP for all players
  for (const p of participants) {
    const ap = await getAP(p.characterId);
    if (ap.current < 1) {
      const name = getCharName(p.character);
      return interaction.reply({
        embeds: [errorEmbed(`**${name}** n'a pas assez de PA (${ap.current}/1 requis).`)],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // Consume 1 AP per player
  for (const p of participants) {
    await consumeAP(p.characterId, 'prime');
  }

  // Build initial prime combat state
  const primeDef    = PRIMES[primeRun.primeId];
  const firstRoom   = primeDef.rooms[0];
  const roomEnemies = buildRoomEnemies(firstRoom);

  // replayMode si le niveau moyen du groupe dépasse le seuil
  const HEAL_SKILL_KEYS = new Set(['soin', 'divine_heal', 'second_wind']);
  const avgLevel = participants.reduce((s, p) => s + p.character.level, 0) / participants.length;
  const replayMode = avgLevel > primeDef.levelRequired + (primeDef.replayThreshold ?? 5);

  const players = await Promise.all(participants.map(async (p) => {
    const char    = p.character;
    const loadout = char.loadout ?? await getOrCreateLoadout(char.id);
    const stats   = computeStats(char, loadout);
    const currentHp = computeRegenedHp(char.hp, char.hpUpdatedAt, stats.hp);

    const charItems   = await prisma.characterItem.findMany({ where: { characterId: char.id } });
    const consumables = charItems
      .filter((ci) => {
        const def = ITEMS[ci.itemId];
        return def?.type === 'consumable' && (ci.quantity > 0 || def.infiniteUse) && !def.combatExcluded;
      })
      .map((ci) => {
        const def = ITEMS[ci.itemId];
        return { itemId: ci.itemId, quantity: def.infiniteUse ? -1 : ci.quantity };
      });

    const activeSkills = replayMode
      ? (stats.activeSkills ?? []).filter((s) => !HEAL_SKILL_KEYS.has(s.key))
      : (stats.activeSkills ?? []);

    return {
      characterId:    char.id,
      userId:         char.userId,
      name:           getCharName(char),
      hp:             currentHp,
      maxHp:          stats.hp,
      atk:            stats.atk,
      def:            stats.def,
      spd:            stats.spd,
      crit:           stats.crit,
      critMult:       stats.critMult ?? 1.5,
      consumables,
      activeSkills,
      activePassives: stats.activePassives ?? [],
      skillCooldowns: {},
      usedOnceSkills: [],
      buffs:          [],
      dots:           [],
    };
  }));

  const primeState = {
    primeRunId:       primeRun.id,
    primeId:          primeRun.primeId,
    primeName:        primeDef.name,
    guildId,
    channelId:        primeRun.channelId,
    messageId:        null,
    currentRoomIndex: 0,
    totalRooms:       primeDef.rooms.length,
    enemies:          roomEnemies,
    players,
    pendingActions:   {},
    elitesKilled:     [],
    lootClaimed:      [],
    roundNumber:      1,
    replayMode,
    log:              [
      `🏆 La prime **${primeDef.name}** commence !${replayMode ? ' *(Mode rejeu — loot et soins désactivés)*' : ''}`,
      `📍 **Salle 1** — *${firstRoom.description}*`,
    ],
    status: 'active',
  };

  await prisma.primeRun.update({ where: { id: primeRunId }, data: { status: 'active', roomIndex: 0 } });

  const embed      = buildCombatEmbed(primeState);
  const components = buildCombatComponents(primeState);

  await interaction.update({ embeds: [embed], components });
  primeState.messageId = interaction.message.id;
  await setPrimeCombatState(primeRunId, primeState);
}

// ── In-combat actions ─────────────────────────────────────────────────────────

async function handlePrimeAttack(interaction, primeRunId, targetIndex) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const state = await getPrimeCombatState(primeRunId);
  if (!state || state.status !== 'active') {
    return interaction.reply({ embeds: [errorEmbed('Cette prime n\'est plus active.')], flags: MessageFlags.Ephemeral });
  }

  const player = state.players.find((p) => p.characterId === character.id);
  if (!player) {
    return interaction.reply({ embeds: [errorEmbed('Tu ne fais pas partie de cette prime.')], flags: MessageFlags.Ephemeral });
  }
  if (player.hp <= 0) {
    return interaction.reply({ embeds: [errorEmbed('Tu es hors combat et ne peux plus agir.')], flags: MessageFlags.Ephemeral });
  }
  if (state.pendingActions[character.id]) {
    return interaction.reply({ embeds: [errorEmbed('Tu as déjà choisi ton action ce tour.')], flags: MessageFlags.Ephemeral });
  }

  const target = state.enemies[targetIndex];
  if (!target || target.hp <= 0) {
    return interaction.reply({ embeds: [errorEmbed('Cible invalide.')], flags: MessageFlags.Ephemeral });
  }

  state.pendingActions[character.id] = { type: 'attack', targetIndex };

  // Check if all alive players have acted
  const alivePlayers = state.players.filter((p) => p.hp > 0);
  const allActed     = alivePlayers.every((p) => state.pendingActions[p.characterId]);

  if (allActed) {
    await _resolveRound(state, interaction);
  } else {
    await setPrimeCombatState(primeRunId, state);
    const embed      = buildCombatEmbed(state);
    const components = buildCombatComponents(state);
    return interaction.update({ embeds: [embed], components });
  }
}

async function handlePrimeItemOpen(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const state = await getPrimeCombatState(primeRunId);
  if (!state || state.status !== 'active') {
    return interaction.reply({ embeds: [errorEmbed('Cette prime n\'est plus active.')], flags: MessageFlags.Ephemeral });
  }

  const player = state.players.find((p) => p.characterId === character.id);
  if (!player || player.hp <= 0) {
    return interaction.reply({ embeds: [errorEmbed('Tu es hors combat.')], flags: MessageFlags.Ephemeral });
  }
  if (state.pendingActions[character.id]) {
    return interaction.reply({ embeds: [errorEmbed('Tu as déjà choisi ton action ce tour.')], flags: MessageFlags.Ephemeral });
  }

  const available = (player.consumables ?? []).filter((c) => c.quantity > 0 || c.quantity === -1);
  if (available.length === 0) {
    return interaction.reply({ embeds: [errorEmbed('Aucun consommable disponible.')], flags: MessageFlags.Ephemeral });
  }

  const aliveEnemies = state.enemies.filter((e) => e.hp > 0);
  const targetOptions = aliveEnemies.map((e) => ({
    label: e.name,
    value: `${state.enemies.indexOf(e)}`,
    description: `HP: ${e.hp}/${e.maxHp}`,
  }));

  const rows = [];

  // Item select
  const itemSelect = new StringSelectMenuBuilder()
    .setCustomId(`prime_item_select:${primeRunId}`)
    .setPlaceholder('Choisir un consommable…')
    .addOptions(
      available.map((c) => {
        const def = ITEMS[c.itemId];
        return {
          label: def?.name ?? c.itemId,
          value: c.itemId,
          description: def?.effect?.type === 'heal' ? `Soigne ${def.effect.value} HP` : (def?.description ?? ''),
        };
      }).slice(0, 25),
    );
  rows.push(new ActionRowBuilder().addComponents(itemSelect));

  if (targetOptions.length > 0) {
    const targetSelect = new StringSelectMenuBuilder()
      .setCustomId(`prime_item_target:${primeRunId}`)
      .setPlaceholder('Cible (pour items offensifs)…')
      .addOptions(targetOptions);
    rows.push(new ActionRowBuilder().addComponents(targetSelect));
  }

  return interaction.reply({
    embeds: [new EmbedBuilder().setTitle('💊 Utiliser un consommable').setDescription('Sélectionne l\'item à utiliser. Pour les items offensifs, choisis aussi une cible.').setColor(0x3498db)],
    components: rows,
    flags: MessageFlags.Ephemeral,
  });
}

async function handlePrimeItemSelect(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) return interaction.update({ content: '❌ Personnage introuvable.', components: [] });

  const state = await getPrimeCombatState(primeRunId);
  if (!state || state.status !== 'active') return interaction.update({ content: '❌ Prime terminée.', components: [] });

  if (state.pendingActions[character.id]) {
    return interaction.update({ content: '❌ Action déjà enregistrée ce tour.', components: [] });
  }

  const itemId      = interaction.values[0];
  const targetIndex = 0; // default to first alive enemy for offensive items
  state.pendingActions[character.id] = { type: 'item', itemId, targetIndex };

  const alivePlayers = state.players.filter((p) => p.hp > 0);
  const allActed     = alivePlayers.every((p) => state.pendingActions[p.characterId]);

  const itemDef = ITEMS[itemId];
  await interaction.update({ content: `✅ **${itemDef?.name ?? itemId}** enregistré comme action.`, embeds: [], components: [] });

  if (allActed) {
    const channel = interaction.client.channels.cache.get(state.channelId);
    if (channel) {
      const message = await channel.messages.fetch(state.messageId).catch(() => null);
      if (message) await _resolveRoundFromMessage(state, message);
    }
  } else {
    await setPrimeCombatState(primeRunId, state);
    const channel = interaction.client.channels.cache.get(state.channelId);
    if (channel) {
      const message = await channel.messages.fetch(state.messageId).catch(() => null);
      if (message) {
        await message.edit({ embeds: [buildCombatEmbed(state)], components: buildCombatComponents(state) });
      }
    }
  }
}

async function handleNextRoom(interaction, primeRunId) {
  const state = await getPrimeCombatState(primeRunId);
  if (!state) {
    return interaction.reply({ embeds: [errorEmbed('Prime introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const primeDef    = PRIMES[state.primeId];
  const nextRoomIdx = state.currentRoomIndex + 1;

  if (nextRoomIdx >= primeDef.rooms.length) {
    return interaction.reply({ embeds: [errorEmbed('Aucune salle suivante.')], flags: MessageFlags.Ephemeral });
  }

  const nextRoom    = primeDef.rooms[nextRoomIdx];
  const roomEnemies = buildRoomEnemies(nextRoom);

  state.currentRoomIndex = nextRoomIdx;
  state.enemies          = roomEnemies;
  state.pendingActions   = {};
  state.roundNumber      = 1;
  state.log              = [`📍 **Salle ${nextRoomIdx + 1}/${state.totalRooms}** — Nouvelle salle !`];

  await prisma.primeRun.update({ where: { id: primeRunId }, data: { roomIndex: nextRoomIdx } });
  await setPrimeCombatState(primeRunId, state);

  state.log = [`📍 **Salle ${nextRoomIdx + 1}** — *${nextRoom.description}*`];
  await setPrimeCombatState(primeRunId, state);

  const embed      = buildCombatEmbed(state);
  const components = buildCombatComponents(state);
  return interaction.update({ embeds: [embed], components });
}

async function handleClaimLoot(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const state = await getPrimeCombatState(primeRunId);
  if (!state) {
    return interaction.reply({ embeds: [errorEmbed('Prime introuvable.')], flags: MessageFlags.Ephemeral });
  }

  if ((state.lootClaimed ?? []).includes(character.id)) {
    return interaction.reply({ embeds: [errorEmbed('Tu as déjà réclamé ton butin !')], flags: MessageFlags.Ephemeral });
  }

  const participant = state.players.find((p) => p.characterId === character.id);
  if (!participant) {
    return interaction.reply({ embeds: [errorEmbed('Tu ne faisais pas partie de cette prime.')], flags: MessageFlags.Ephemeral });
  }

  // replayMode : pas de loot, XP/gold déjà distribués dans _distributeRewards
  if (state.replayMode) {
    state.lootClaimed = [...(state.lootClaimed ?? []), character.id];
    await setPrimeCombatState(state.primeRunId, state);
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('⚔️ Mode rejeu')
        .setDescription('*Niveau trop élevé pour cette prime — aucun loot disponible.*\nL\'XP et l\'or ont déjà été distribués.')
        .setColor(0x95a5a6)],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Build loot pool from last room's bosses
  const primeDef   = PRIMES[state.primeId];
  const lastRoom   = primeDef.rooms[state.totalRooms - 1];
  const bossIds    = lastRoom.enemies;
  const lootPool   = [...new Set(bossIds.flatMap((eId) => ENEMIES[eId]?.loot ?? []))];

  // Shuffle + pick 2 options
  for (let i = lootPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lootPool[i], lootPool[j]] = [lootPool[j], lootPool[i]];
  }
  const options = lootPool.slice(0, 2);
  while (options.length < 2) options.push('potion_heal');

  // Elite drops (10% per elite killed)
  const eliteDropsGranted = [];
  for (const eliteId of (state.elitesKilled ?? [])) {
    const enemyDef = ENEMIES[eliteId];
    if (!enemyDef?.eliteDrops?.length) continue;
    for (const dropItemId of enemyDef.eliteDrops) {
      if (Math.random() < 0.1) {
        await applyLoot(prisma, character.id, dropItemId);
        const itemName = ITEMS[dropItemId]?.name ?? dropItemId;
        eliteDropsGranted.push(`⭐ **${ENEMIES[eliteId].name}** — **${itemName}**`);
      }
    }
  }

  // Mark as claimed
  state.lootClaimed = [...(state.lootClaimed ?? []), character.id];
  await setPrimeCombatState(primeRunId, state);

  // Store pending loot for choice
  const { setPendingLoot } = require('../cache/redis');
  await setPendingLoot(character.id, options);

  const optLines = options.map((id, i) => {
    const def = ITEMS[id];
    return `> **${i + 1}.** ${def?.name ?? id}`;
  });

  const eliteLines = eliteDropsGranted.length > 0
    ? `\n\n**🎲 Drops élite obtenus :**\n${eliteDropsGranted.join('\n')}`
    : '';

  const embed = new EmbedBuilder()
    .setTitle('🎁 Réclamer ton butin')
    .setDescription(`Choisis **1** item parmi :\n${optLines.join('\n')}${eliteLines}`)
    .setColor(0xf1c40f);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prime_loot:0').setLabel(ITEMS[options[0]]?.name ?? options[0]).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('prime_loot:1').setLabel(ITEMS[options[1]]?.name ?? options[1]).setStyle(ButtonStyle.Secondary),
  );

  return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}

async function handlePrimeLootChoice(interaction, idx) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) return interaction.update({ content: '❌ Personnage introuvable.', components: [] });

  const { getPendingLoot, deletePendingLoot } = require('../cache/redis');
  const options = await getPendingLoot(character.id);
  if (!options) return interaction.update({ content: '❌ Le butin a expiré.', components: [] });

  const chosen  = options[idx];
  if (!chosen) return interaction.update({ content: '❌ Choix invalide.', components: [] });

  await applyLoot(prisma, character.id, chosen);
  await deletePendingLoot(character.id);

  const itemName = ITEMS[chosen]?.name ?? chosen;
  return interaction.update({
    embeds: [new EmbedBuilder().setTitle('✅ Butin obtenu !').setDescription(`Tu as obtenu : **${itemName}**`).setColor(0x2ecc71)],
    components: [],
  });
}

// ── Internal round resolution ─────────────────────────────────────────────────

async function _resolveRound(state, interaction) {
  await interaction.deferUpdate();

  const result   = resolvePrimeRound(state);
  const newLogs  = result.logs;
  const frames   = result.frames;
  const snap     = result.initialSnapshot;
  const prevLog  = [...(state.log ?? [])];

  const preAnimState = {
    ...state,
    log:     prevLog,
    players: state.players.map((p, i) => ({ ...p, hp: snap?.playersHp[i] ?? p.hp })),
    enemies: state.enemies.map((e, i) => ({ ...e, hp: snap?.enemiesHp[i] ?? e.hp })),
  };

  for (let i = 0; i < state.enemies.length; i++) {
    const wasAlive = state.enemies[i].hp > 0;
    const nowDead  = result.enemies[i].hp <= 0;
    if (wasAlive && nowDead && state.enemies[i].elite) {
      if (!state.elitesKilled.includes(state.enemies[i].id)) {
        state.elitesKilled.push(state.enemies[i].id);
      }
    }
  }

  state.players        = result.players;
  state.enemies        = result.enemies;
  state.log            = [...prevLog, ...newLogs].slice(-20);
  state.pendingActions = {};
  state.roundNumber   += 1;

  if (result.allEnemiesDead) {
    const isLastRoom = state.currentRoomIndex + 1 >= state.totalRooms;
    state.status = isLastRoom ? 'completed' : 'room_clear';

    state.roomDropResults = await _rollRoomLoot(state);

    if (isLastRoom) {
      await prisma.primeRun.update({ where: { id: state.primeRunId }, data: { status: 'completed' } });
      await _distributeRewards(state);
      state.log.push('🏆 **Prime terminée ! Victoire !**');
    } else {
      state.log.push(`✅ **Salle ${state.currentRoomIndex + 1} terminée !** Préparez-vous pour la suite…`);
    }

    await setPrimeCombatState(state.primeRunId, state);
    await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    return interaction.editReply({ embeds: [buildVictoryEmbed(state)], components: buildRoomClearComponents(state) });
  }

  if (result.allPlayersDead) {
    state.status = 'defeated';
    await prisma.primeRun.update({ where: { id: state.primeRunId }, data: { status: 'failed' } });
    await deletePrimeCombatState(state.primeRunId);

    const defeatEmbed = new EmbedBuilder()
      .setTitle('💀 Prime échouée')
      .setDescription('*Tous les joueurs sont tombés.*')
      .setColor(0x2c3e50);

    await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    return interaction.editReply({ embeds: [defeatEmbed], components: [] });
  }

  await setPrimeCombatState(state.primeRunId, state);
  await animateCombatLogs(
    (p) => interaction.editReply(p),
    preAnimState,
    newLogs,
    frames,
    buildCombatEmbed,
    buildCombatComponents(state),
  );
}

async function _resolveRoundFromMessage(state, message) {
  const result   = resolvePrimeRound(state);
  const newLogs  = result.logs;
  const frames   = result.frames;
  const snap     = result.initialSnapshot;
  const prevLog  = [...(state.log ?? [])];

  const preAnimState = {
    ...state,
    log:     prevLog,
    players: state.players.map((p, i) => ({ ...p, hp: snap?.playersHp[i] ?? p.hp })),
    enemies: state.enemies.map((e, i) => ({ ...e, hp: snap?.enemiesHp[i] ?? e.hp })),
  };

  for (let i = 0; i < state.enemies.length; i++) {
    const wasAlive = state.enemies[i].hp > 0;
    const nowDead  = result.enemies[i].hp <= 0;
    if (wasAlive && nowDead && state.enemies[i].elite) {
      if (!state.elitesKilled.includes(state.enemies[i].id)) {
        state.elitesKilled.push(state.enemies[i].id);
      }
    }
  }

  state.players        = result.players;
  state.enemies        = result.enemies;
  state.log            = [...prevLog, ...newLogs].slice(-20);
  state.pendingActions = {};
  state.roundNumber   += 1;

  if (result.allEnemiesDead) {
    const isLastRoom = state.currentRoomIndex + 1 >= state.totalRooms;
    state.status = isLastRoom ? 'completed' : 'room_clear';

    state.roomDropResults = await _rollRoomLoot(state);

    if (isLastRoom) {
      await prisma.primeRun.update({ where: { id: state.primeRunId }, data: { status: 'completed' } });
      await _distributeRewards(state);
      state.log.push('🏆 **Prime terminée ! Victoire !**');
    } else {
      state.log.push(`✅ **Salle ${state.currentRoomIndex + 1} terminée !**`);
    }

    await setPrimeCombatState(state.primeRunId, state);
    await animateCombatLogs((p) => message.edit(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    await message.edit({ embeds: [buildVictoryEmbed(state)], components: buildRoomClearComponents(state) });
    return;
  }

  if (result.allPlayersDead) {
    state.status = 'defeated';
    await prisma.primeRun.update({ where: { id: state.primeRunId }, data: { status: 'failed' } });
    await deletePrimeCombatState(state.primeRunId);

    const defeatEmbed = new EmbedBuilder()
      .setTitle('💀 Prime échouée')
      .setDescription('*Tous les joueurs sont tombés.*')
      .setColor(0x2c3e50);

    await animateCombatLogs((p) => message.edit(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    await message.edit({ embeds: [defeatEmbed], components: [] });
    return;
  }

  await setPrimeCombatState(state.primeRunId, state);
  await animateCombatLogs(
    (p) => message.edit(p),
    preAnimState,
    newLogs,
    frames,
    buildCombatEmbed,
    buildCombatComponents(state),
  );
}

function buildVictoryEmbed(state) {
  const lines = [];
  lines.push('**⚔️ Groupe**');
  for (const p of state.players) {
    const icon = p.hp > 0 ? '✅' : '💀';
    lines.push(`${icon} **${p.name}** \`${hpBar(p.hp, p.maxHp)}\``);
  }

  const drops = state.roomDropResults ?? [];
  const dropLines = drops.filter((d) => d.itemId).map((d) => `> 🎁 **${d.playerName}** reçoit **${d.itemName}**`);
  if (dropLines.length > 0) {
    lines.push('');
    lines.push('**💰 Butin de la salle**');
    lines.push(dropLines.join('\n'));
  }

  lines.push('');
  const lastLogs = (state.log ?? []).slice(-5);
  if (lastLogs.length > 0) {
    lines.push('**📜 Journal**');
    lines.push(lastLogs.map((l) => `> ${l}`).join('\n'));
  }

  const isFullVictory = state.currentRoomIndex + 1 >= state.totalRooms;
  return new EmbedBuilder()
    .setTitle(isFullVictory ? '🏆 Prime terminée — Victoire !' : `✅ Salle ${state.currentRoomIndex + 1} terminée`)
    .setDescription(lines.join('\n'))
    .setColor(isFullVictory ? 0xf1c40f : 0x2ecc71)
    .setFooter({ text: isFullVictory ? 'Cliquez sur "Réclamer le butin" pour recevoir vos récompenses.' : 'Préparez-vous pour la prochaine salle !' });
}

const ROOM_DROP_CHANCE = 0.6;

async function _rollRoomLoot(state) {
  if (state.replayMode) return [];

  const primeDef = PRIMES[state.primeId];
  const room     = primeDef.rooms[state.currentRoomIndex];
  const pool     = [...new Set(room.enemies.flatMap((eId) => ENEMIES[eId]?.loot ?? []))];
  if (pool.length === 0) return [];

  const results = [];
  for (const player of state.players) {
    if (player.hp <= 0) continue;
    if (Math.random() > ROOM_DROP_CHANCE) {
      results.push({ playerName: player.name, itemId: null });
      continue;
    }
    const itemId   = pool[Math.floor(Math.random() * pool.length)];
    const itemName = ITEMS[itemId]?.name ?? itemId;
    await applyLoot(prisma, player.characterId, itemId);
    results.push({ playerName: player.name, itemId, itemName });
  }
  return results;
}

async function _distributeRewards(state) {
  const primeDef  = PRIMES[state.primeId];
  const allRooms  = primeDef.rooms;
  let totalXp     = 0;
  let totalGold   = 0;

  // XP and gold from all enemies across all rooms
  for (const room of allRooms) {
    for (const eId of room.enemies) {
      const e = ENEMIES[eId];
      if (!e) continue;
      totalXp  += e.xp ?? 0;
      const gMin = e.gold?.min ?? 0;
      const gMax = e.gold?.max ?? 0;
      totalGold += gMin + Math.floor(Math.random() * (gMax - gMin + 1));
    }
  }

  // Apply 1.5x multiplier for prime difficulty
  totalXp   = Math.floor(totalXp  * 1.5);
  totalGold = Math.floor(totalGold * 1.5);

  for (const player of state.players) {
    if (player.hp <= 0) continue; // dead players get no rewards
    const { addXp: _addXp, addGold: _addGold } = require('./player.service');
    await _addXp(player.characterId, totalXp);
    await _addGold(player.characterId, totalGold);
  }
}

// ── Rest phase (between rooms) ────────────────────────────────────────────────

async function handleRestItemOpen(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const state = await getPrimeCombatState(primeRunId);
  if (!state || state.status !== 'room_clear') {
    return interaction.reply({ embeds: [errorEmbed('Plus en phase de repos.')], flags: MessageFlags.Ephemeral });
  }

  const player = state.players.find((p) => p.characterId === character.id);
  if (!player) {
    return interaction.reply({ embeds: [errorEmbed('Tu ne fais pas partie de cette prime.')], flags: MessageFlags.Ephemeral });
  }
  if (player.hp <= 0) {
    return interaction.reply({ embeds: [errorEmbed('Tu es hors combat.')], flags: MessageFlags.Ephemeral });
  }

  const available = (player.consumables ?? []).filter((c) => c.quantity > 0 || c.quantity === -1);
  if (available.length === 0) {
    return interaction.reply({ embeds: [errorEmbed('Aucun consommable disponible.')], flags: MessageFlags.Ephemeral });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`prime_rest_item_select:${primeRunId}`)
    .setPlaceholder('Choisir un consommable…')
    .addOptions(
      available.map((c) => {
        const def = ITEMS[c.itemId];
        const qty = c.quantity === -1 ? '∞' : `×${c.quantity}`;
        return {
          label: `${def?.name ?? c.itemId} (${qty})`,
          value:  c.itemId,
          description: def?.effect?.type === 'heal'
            ? `Soigne ${def.effect.value} HP`
            : (def?.effect?.type === 'buff' ? `${def.effect.stat?.toUpperCase()}+${def.effect.value} (${def.effect.turns}t)` : ''),
        };
      }).slice(0, 25),
    );

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('💊 Repos — Utiliser un consommable')
        .setDescription(`**${player.name}** — HP : **${player.hp}/${player.maxHp}**\n\nChoisis un consommable à utiliser avant la prochaine salle.`)
        .setColor(0x3498db),
    ],
    components: [new ActionRowBuilder().addComponents(select)],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleRestItemUse(interaction, primeRunId) {
  const { user, guildId } = interaction;
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
    select: { id: true },
  });
  if (!character) return interaction.update({ content: '❌ Personnage introuvable.', embeds: [], components: [] });

  const state = await getPrimeCombatState(primeRunId);
  if (!state || state.status !== 'room_clear') {
    return interaction.update({ content: '❌ Plus en phase de repos.', embeds: [], components: [] });
  }

  const player = state.players.find((p) => p.characterId === character.id);
  if (!player || player.hp <= 0) {
    return interaction.update({ content: '❌ Tu es hors combat.', embeds: [], components: [] });
  }

  const itemId  = interaction.values[0];
  const itemDef = ITEMS[itemId];
  if (!itemDef) return interaction.update({ content: '❌ Item inconnu.', embeds: [], components: [] });

  const idx = (player.consumables ?? []).findIndex(
    (c) => c.itemId === itemId && (c.quantity > 0 || c.quantity === -1),
  );
  if (idx === -1) {
    return interaction.update({ content: `❌ **${itemDef.name}** non disponible.`, embeds: [], components: [] });
  }

  const { effect } = itemDef;
  let resultMsg = '';

  if (effect?.type === 'heal') {
    const before   = player.hp;
    player.hp      = Math.min(player.maxHp, player.hp + effect.value);
    const healed   = player.hp - before;
    resultMsg = `💊 **${itemDef.name}** : +**${healed}** HP → **${player.hp}/${player.maxHp}**`;
  } else if (effect?.type === 'cure_dot') {
    const count  = (player.dots ?? []).length;
    player.dots  = [];
    resultMsg = count > 0
      ? `💊 **${itemDef.name}** : tous les effets négatifs dissipés.`
      : `💊 **${itemDef.name}** : aucun effet à dissiper.`;
  } else if (effect?.type === 'buff') {
    player[effect.stat] = (player[effect.stat] ?? 0) + effect.value;
    player.buffs        = [...(player.buffs ?? []), { stat: effect.stat, value: effect.value, turns: effect.turns }];
    resultMsg = `⚡ **${itemDef.name}** : **${effect.stat.toUpperCase()}**+${effect.value} pendant **${effect.turns}** tours.`;
  } else {
    return interaction.update({ content: '❌ Cet item ne peut pas être utilisé pendant le repos.', embeds: [], components: [] });
  }

  if (player.consumables[idx].quantity !== -1) player.consumables[idx].quantity -= 1;

  await setPrimeCombatState(primeRunId, state);

  return interaction.update({
    embeds: [new EmbedBuilder().setTitle('✅ Consommable utilisé').setDescription(resultMsg).setColor(0x2ecc71)],
    components: [],
  });
}

module.exports = {
  createPrime,
  joinPrime,
  leavePrime,
  startPrime,
  handlePrimeAttack,
  handlePrimeItemOpen,
  handlePrimeItemSelect,
  handleNextRoom,
  handleClaimLoot,
  handlePrimeLootChoice,
  handleRestItemOpen,
  handleRestItemUse,
};
