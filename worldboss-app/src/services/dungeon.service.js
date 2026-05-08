'use strict';

const { prisma } = require('../db/prisma');
const { getDungeonState, setDungeonState, deleteDungeonState, deleteCombatState, getCombatState } = require('../cache/redis');
const { createDungeonState, getCurrentRoom, getRoomEnemies, advanceRoom } = require('../engines/dungeonEngine');
const { buildCombatState } = require('./combat.service');
const { getOrCreateLoadout } = require('./inventory.service');
const { computeRegenedHp } = require('./player.service');
const { computeStats } = require('../utils/stats');
const { buildCombatEmbed, buildCombatRow, buildDungeonNextRow, errorEmbed } = require('../utils/embed');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { DUNGEONS, ALLIES } = require('../data/dungeons');
const { setCombatState } = require('../cache/redis');

async function showDungeonSelection(interaction, characterId) {
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });

  const completedRuns = await prisma.dungeonRun.findMany({
    where: { characterId, status: 'completed' },
    select: { chapter: true },
  });
  const completedChapters = new Set(completedRuns.map((r) => r.chapter));

  const available = Object.values(DUNGEONS).filter((d) => character.level >= d.levelRequired);

  if (available.length === 0) {
    return interaction.reply({
      embeds: [errorEmbed('Aucun donjon disponible pour ton niveau actuel.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const lines = available.map((d) => {
    const done = completedChapters.has(d.id);
    return `${done ? '✅' : '🔓'} **${d.name}**\n> *${d.lore}*`;
  });

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Sélection du donjon')
    .setDescription(lines.join('\n\n'))
    .setColor(0x8e44ad)
    .setFooter({ text: '✅ Déjà terminé · 🔓 Disponible' });

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dungeon_select')
      .setPlaceholder('Choisir un donjon…')
      .addOptions(available.map((d) => ({
        label: completedChapters.has(d.id) ? `${d.name} ✅` : d.name,
        description: `Niveau ${d.levelRequired} requis · ${d.rooms.length} salles`,
        value: `${d.id}`,
      }))),
  );

  const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
  return interaction[method]({ embeds: [embed], components: [select], flags: MessageFlags.Ephemeral });
}

async function startDungeon(interaction, chapter, characterId) {
  const dungeon = DUNGEONS[chapter];
  if (!dungeon) {
    return interaction.update({ embeds: [errorEmbed('Donjon introuvable.')], components: [] });
  }

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (character.level < dungeon.levelRequired) {
    return interaction.update({ embeds: [errorEmbed(`Niveau ${dungeon.levelRequired} requis.`)], components: [] });
  }

  // Cancel any existing run for this chapter before starting a new one
  await prisma.dungeonRun.updateMany({
    where: { characterId, chapter, status: 'active' },
    data: { status: 'failed' },
  });

  const alreadyCompleted = await prisma.dungeonRun.findFirst({
    where: { characterId, chapter, status: 'completed' },
  });
  const replayMode = !!alreadyCompleted || character.level > dungeon.levelRequired;
  const dungeonState = createDungeonState(characterId, interaction.guildId, chapter, replayMode);
  await setDungeonState(characterId, dungeonState);
  await prisma.dungeonRun.create({ data: { characterId, chapter, status: 'active' } });

  const firstRoom = getCurrentRoom(dungeonState);
  const roomTitle = `🏰 ${dungeon.name} — Salle 1/${dungeonState.totalRooms}`;

  return interaction.update({
    embeds: [new EmbedBuilder()
      .setTitle(roomTitle)
      .setDescription(`*${firstRoom.description}*\n\n*Préparez-vous au combat !*`)
      .setColor(0x8e44ad)],
    components: [buildDungeonNextRow('Entrer dans la salle ⚔️')],
  });
}

async function handleDungeonNext(interaction, characterId) {
  const dungeonState = await getDungeonState(characterId);

  if (!dungeonState || dungeonState.status !== 'active') {
    return interaction.reply({
      embeds: [errorEmbed('Aucun donjon en cours. Utilisez `/dungeon` pour commencer.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferUpdate();

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: { loadout: true },
  });
  const loadout = character.loadout ?? await getOrCreateLoadout(characterId);
  const stats   = computeStats(character, loadout);

  // Apply regen to get current HP before combat
  const currentHp = computeRegenedHp(character.hp, character.hpUpdatedAt, stats.hp);
  if (currentHp !== character.hp) {
    await prisma.character.update({ where: { id: characterId }, data: { hp: currentHp, hpUpdatedAt: new Date() } });
    character.hp = currentHp;
  }

  const room    = getCurrentRoom(dungeonState);
  const enemies = getRoomEnemies(room);

  // Inject NPC ally if this room defines one
  const allies = room.ally && ALLIES[room.ally] ? [{ ...ALLIES[room.ally] }] : [];

  const { ITEMS } = require('../data/items');
  const charItems = await prisma.characterItem.findMany({ where: { characterId } });

  const combatState = buildCombatState({
    characterId,
    guildId:       interaction.guildId,
    messageId:     interaction.message?.id,
    channelId:     interaction.channelId,
    character,
    loadout,
    enemies,
    allies,
    dungeonChapter: dungeonState.chapter,
    currentRoom:    dungeonState.currentRoom,
    totalRooms:     dungeonState.totalRooms,
    replayMode:     dungeonState.replayMode ?? false,
  });

  // Load consumables into combat state:
  // - finite items: loaded with their actual quantity
  // - infiniteUse items: loaded with quantity = -1 (sentinel for unlimited)
  const combatConsumables = charItems
    .filter((ci) => {
      const def = ITEMS[ci.itemId];
      return def?.type === 'consumable' && (ci.quantity > 0 || def.infiniteUse);
    })
    .map((ci) => {
      const def = ITEMS[ci.itemId];
      return { itemId: ci.itemId, quantity: def.infiniteUse ? -1 : ci.quantity, infiniteUse: !!def.infiniteUse };
    });

  combatState.player.consumables = combatConsumables;

  await setCombatState(characterId, combatState);

  const embed = buildCombatEmbed(combatState);
  const existingDesc = embed.data.description ?? '';
  embed.setDescription(`*${room.description}*\n\n${existingDesc}`);

  return interaction.editReply({ embeds: [embed], components: buildCombatRow(combatState) });
}

async function startOrResumeDungeon(interaction, characterId) {
  const existing = await getDungeonState(characterId);

  if (existing && existing.status === 'active') {
    const combatState = await getCombatState(characterId);

    if (combatState && combatState.status === 'active') {
      return interaction.reply({
        embeds: [buildCombatEmbed(combatState)],
        components: buildCombatRow(combatState),
        flags: MessageFlags.Ephemeral,
      });
    }

    const dungeon = DUNGEONS[existing.chapter];
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🏰 ${dungeon?.name ?? 'Donjon'} — En cours`)
          .setDescription(`Vous êtes à la **Salle ${existing.currentRoom}/${existing.totalRooms}**.\n\nContinuez ou abandonnez.`)
          .setColor(0x8e44ad),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('dungeon_next').setLabel('Continuer ➡️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('dungeon_abandon').setLabel('Abandonner').setStyle(ButtonStyle.Danger),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  return showDungeonSelection(interaction, characterId);
}

module.exports = { startOrResumeDungeon, startDungeon, showDungeonSelection, handleDungeonNext };
